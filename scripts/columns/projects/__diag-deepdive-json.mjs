#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openAiBriefDb } from "../../lib/db.mjs";
import { createDeepSeekClient, parseJson, projectDeepModel } from "../../lib/llm.mjs";
import { projectDeepDiveSystemPrompt, projectDeepDiveUser } from "./deepdive-prompts.mjs";
import { generateProjectDeepDive } from "./deepdive.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_REPOS = [
  "Chachamaru127/claude-code-harness",
  "EveryInc/compound-engineering-plugin",
  "Lum1104/Understand-Anything",
  "multica-ai/andrej-karpathy-skills",
  "stefan-jansen/machine-learning-for-trading",
];

async function main(argv) {
  const args = parseArgs(argv);
  const db = await openAiBriefDb(args.dbPath || path.join(ROOT, "data", "ai-brief.db"), { init: false });
  try {
    const repos = args.repos.length ? args.repos : DEFAULT_REPOS;
    if (args.mode === "raw") {
      await captureRaw({ db, repos, limit: args.limit, outDir: args.outDir, options: args.options });
    } else if (args.mode === "rerun") {
      await rerunDeepDives({ db, repos, limit: args.limit, outDir: args.outDir, options: args.options });
    } else {
      throw new Error(`Unknown mode: ${args.mode}`);
    }
  } finally {
    db.close();
  }
}

async function captureRaw({ db, repos, limit, outDir, options }) {
  const selected = repos.slice(0, limit || repos.length);
  const client = createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: console });
  await mkdir(outDir, { recursive: true });

  for (const fullName of selected) {
    const fixture = loadProjectFixture(db, fullName);
    const finalDepth = fixture.triage.final_depth || fixture.triage.depth_decision?.final_depth || "deep";
    const model = options.projectDeepModel || projectDeepModel();
    const raw = await client.chat({
      system: projectDeepDiveSystemPrompt(fixture.triage.project_type, finalDepth),
      user: projectDeepDiveUser(fixture.candidate, fixture.evidence, fixture.triage, options),
      model,
      jsonMode: true,
      maxTokens: options.deepDiveMaxTokens,
    });
    const base = safeFileName(fullName);
    const rawPath = path.join(outDir, `${base}.raw.json`);
    await writeFile(rawPath, raw, "utf8");

    let parseStatus = "pass";
    let parseError = null;
    try {
      parseJson(raw);
    } catch (error) {
      parseStatus = "fail";
      parseError = error.message;
    }

    console.log(JSON.stringify({
      repo: fullName,
      mode: "raw",
      model,
      finalDepth,
      chars: raw.length,
      rawPath: path.relative(ROOT, rawPath),
      parseStatus,
      parseError,
    }));
  }
}

async function rerunDeepDives({ db, repos, limit, outDir, options }) {
  await mkdir(outDir, { recursive: true });
  const selected = repos.slice(0, limit || repos.length);
  const singlePassClient = options.singlePassJson
    ? createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: console })
    : null;
  const results = [];
  for (const fullName of selected) {
    const fixture = loadProjectFixture(db, fullName);
    const runOptions = {
      ...options,
      db: null,
      wikiRoot: path.join(outDir, "brief-wiki"),
    };
    if (singlePassClient) {
      runOptions.chatJson = async ({ system, user, model, maxTokens }) => {
        const raw = await singlePassClient.chat({
          system,
          user,
          model,
          jsonMode: true,
          maxTokens,
          retries: 0,
        });
        const rawPath = path.join(outDir, `${safeFileName(fullName)}.raw.json`);
        await writeFile(rawPath, raw, "utf8");
        return parseJson(raw);
      };
    }
    try {
      const result = await generateProjectDeepDive({
        candidate: fixture.candidate,
        evidence: fixture.evidence,
        triage: fixture.triage,
        options: runOptions,
        logger: console,
      });
      results.push({
        repo: fullName,
        status: result?.generated === false || result?.skipped ? "skipped" : "pass",
        finalDepth: result?.final_depth || null,
        skipReview: Boolean(options.skipReview),
        singlePassJson: Boolean(options.singlePassJson),
        rawPath: options.singlePassJson ? path.relative(ROOT, path.join(outDir, `${safeFileName(fullName)}.raw.json`)) : null,
        slug: result?.slug || null,
        paths: result?.paths || null,
      });
    } catch (error) {
      results.push({
        repo: fullName,
        status: "fail",
        error: error.message,
      });
    }
    console.log(JSON.stringify(results.at(-1)));
  }

  const summary = {
    passed: results.filter((item) => item.status === "pass").length,
    total: results.length,
    skipReview: Boolean(options.skipReview),
    singlePassJson: Boolean(options.singlePassJson),
    results,
  };
  const summaryPath = path.join(outDir, "rerun-summary.json");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ mode: "rerun-summary", summaryPath: path.relative(ROOT, summaryPath), passed: summary.passed, total: summary.total }));
}

function loadProjectFixture(db, fullName) {
  const candidate = findCandidateByFullName(db, fullName);
  if (!candidate) throw new Error(`Candidate not found in DB: ${fullName}`);
  const evidence = db.getEvidence(candidate.id, "github") || db.listEvidence(candidate.id)[0];
  if (!evidence) throw new Error(`Evidence not found in DB: ${fullName}`);
  const evaluation = db.getEval(candidate.id);
  if (!evaluation) throw new Error(`Eval not found in DB: ${fullName}`);
  const light = latestUsableLightAnalysis(db.listAnalyses(candidate.id))?.payload || {};
  const triage = {
    ...light,
    decision: light.decision || evaluation.decision,
    mode: light.mode || "deterministic-project-radar",
    score: light.score ?? light.ranking_score ?? evaluation.score,
    signals: light.signals || light.depth_decision?.ranking_reasons || evaluation.signals,
    reason: light.reason || evaluation.reason,
    evaluatedAt: evaluation.evaluatedAt,
  };
  return { candidate, evidence, triage };
}

function findCandidateByFullName(db, fullName) {
  const key = String(fullName || "").toLowerCase();
  const row = db.connection.prepare(`
    SELECT id, "column", source, raw, dedupe_key, discovered_at
    FROM candidates
    WHERE "column" = 'projects'
      AND lower(json_extract(raw, '$.fullName')) = ?
    ORDER BY discovered_at DESC
    LIMIT 1
  `).get(key);
  if (!row) return null;
  return {
    id: row.id,
    column: row.column,
    source: row.source,
    raw: JSON.parse(row.raw),
    dedupeKey: row.dedupe_key,
    discoveredAt: row.discovered_at,
  };
}

function latestTier(analyses, tier) {
  return analyses.find((analysis) => analysis.tier === tier) || null;
}

function latestUsableLightAnalysis(analyses) {
  return analyses.find((analysis) => (
    analysis.tier === "light"
    && analysis.model !== "project-deep-dive-fallback"
    && ["light", "analysis", "deep"].includes(analysis.payload?.final_depth)
  )) || latestTier(analyses, "light");
}

function parseArgs(argv) {
  const outDirDefault = path.join(ROOT, "logs", "deepdive-json-diag");
  const args = {
    mode: "raw",
    repos: [],
    limit: 2,
    outDir: outDirDefault,
    dbPath: "",
    options: {
      deepDiveMaxTokens: Number(process.env.PROJECT_DEEP_DIVE_MAX_TOKENS) || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 16000,
      skipReview: false,
      singlePassJson: false,
    },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") {
      args.mode = argv[++index];
    } else if (arg === "--repo") {
      args.repos.push(argv[++index]);
    } else if (arg === "--all") {
      args.limit = 0;
    } else if (arg === "--limit") {
      args.limit = Number(argv[++index]);
    } else if (arg === "--out-dir") {
      args.outDir = path.resolve(argv[++index]);
    } else if (arg === "--db") {
      args.dbPath = path.resolve(argv[++index]);
    } else if (arg === "--deep-dive-max-tokens") {
      args.options.deepDiveMaxTokens = Number(argv[++index]);
    } else if (arg === "--api-timeout-ms") {
      args.options.apiTimeoutMs = Number(argv[++index]);
    } else if (arg === "--readme-max-chars") {
      args.options.readmeMaxChars = Number(argv[++index]);
    } else if (arg === "--project-deep-model") {
      args.options.projectDeepModel = argv[++index];
    } else if (arg === "--skip-review") {
      args.options.skipReview = true;
    } else if (arg === "--single-pass-json") {
      args.options.singlePassJson = true;
    } else if (!arg.startsWith("--")) {
      args.repos.push(arg);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (args.mode === "rerun" && !argv.includes("--limit")) args.limit = 0;
  return args;
}

function safeFileName(value) {
  return String(value || "repo").replace(/[^a-z0-9._-]+/gi, "__");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
