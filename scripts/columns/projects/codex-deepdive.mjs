#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openAiBriefDb } from "../../lib/db.mjs";
import { parseJson } from "../../lib/llm.mjs";
import { publishBriefMirror, isBriefWikiAnalysisCompleted, isProjectAlreadyDeepDived } from "./brief-pipeline.mjs";
import { writeProjectBriefWikiEntities } from "./brief-writer.mjs";
import { emitProjectAutoSciPrimitive } from "./autosci-primitives.mjs";
import { enqueueProjectKgIngest, normalizeProjectMindPalace } from "./project-facet.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const TRENDING_FILE = path.join(ROOT, "public", "data", "trending.json");
const DEFAULT_WIKI_ROOT = "brief-wiki";
const TIER_TEMPLATE_SCHEMA_VERSION = "project-tier-template/v1";
const CODEX_DEEP_MODEL = "gpt-5.5";
// Deep-dive default = high: at high, codex clones + reads the repo source, which is
// what produces concrete (not framework-sketch) analysis. See memory: analysis-concreteness
// + deepdive-model-cost-strategy. Override per-run with --reasoning-effort=medium to save quota.
const CODEX_REASONING_EFFORT = "high";
// Default parallelism for the authoring pool. Each project deep-dive is fully
// independent (own checkoutDir, own brief-wiki/<slug> writes, own log dir), so we
// fan them out at a FIXED concurrency instead of one-at-a-time. This is the fix for
// "one stuck/hung project (e.g. roboflow/supervision) blocks the rebuild of the
// other 11 already-finished deep-reads": a hang now only occupies one pool slot and
// is bounded by PROJECT_CODEX_DEEP_DIVE_TIMEOUT_MS, and the others keep flowing.
// Kept DETERMINISTIC (fixed N, not an open-ended agent) because this runs inside the
// daily boot pipeline. Override with env PROJECT_DEEPDIVE_CONCURRENCY.
const DEFAULT_DEEPDIVE_CONCURRENCY = 3;

export function resolveDeepDiveConcurrency(env = process.env) {
  const raw = Number(env.PROJECT_DEEPDIVE_CONCURRENCY);
  if (Number.isFinite(raw) && raw >= 1) return Math.floor(raw);
  return DEFAULT_DEEPDIVE_CONCURRENCY;
}

/**
 * Minimal fixed-concurrency promise pool. Runs at most `concurrency` invocations
 * of `fn(item, index)` at once; resolves to an array of results in INPUT order.
 * `fn` is expected to settle (never throw) — the caller wraps each unit so a single
 * failure/timeout is isolated and the whole batch always completes. No deps.
 */
export async function pMap(items, fn, concurrency = 1) {
  const list = Array.from(items);
  const results = new Array(list.length);
  const limit = Math.max(1, Math.floor(concurrency) || 1);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= list.length) return;
      results[index] = await fn(list[index], index);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(limit, list.length); i += 1) workers.push(worker());
  await Promise.all(workers);
  return results;
}

/**
 * Process ONE selected record: honor --force/skip-already-deep-dived, author the
 * deep-dive, and convert any failure/timeout into a markNeedsEnrichment fallback.
 * This NEVER throws — that is what guarantees a single stuck project (one pool slot)
 * cannot stall or abort the batch, and the final rebuild always runs. The author fn
 * is injectable (`deps.authorOneDeepDive`) so tests can drive concurrency/isolation
 * without invoking codex.
 */
export async function processOneRecord(record, options = {}, deps = {}) {
  const author = deps.authorOneDeepDive || authorOneDeepDive;
  const onEnrich = deps.markNeedsEnrichment || markNeedsEnrichment;
  const repo = record.repo.fullName || record.candidate.id;
  try {
    if (!options.force && isProjectAlreadyDeepDived(record.candidate, options)) {
      console.log(`codex deep-dive skipped ${repo}: already deep-dived`);
      return { repo, status: "skipped", reason: "already_deep_dived" };
    }
    const result = await author(record, options);
    console.log(`codex deep-dive generated ${repo}: ${result.slug}`);
    return result;
  } catch (error) {
    const fallback = onEnrich(record, error, options);
    console.warn(`codex deep-dive failed ${repo}: ${error.message}`);
    return fallback;
  }
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  if (options.help) {
    printUsage();
    return null;
  }

  const db = await openAiBriefDb(options.dbPath);
  options.db = db;

  try {
    await mkdir(options.logRoot, { recursive: true });
    const records = selectAuthoringRecords(loadProjectRecords(db, options), options);
    const concurrency = resolveDeepDiveConcurrency();

    // Parallel authoring with single-failure isolation. processOneRecord already
    // catches per-record, so each unit settles; we still go through allSettled as a
    // belt-and-suspenders guard so that even an unexpected throw in the pool plumbing
    // for one project cannot prevent the others' results or the final rebuild.
    const settled = await pMap(
      records,
      (record) => processOneRecord(record, options, deps).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason }),
      ),
      concurrency,
    );
    const results = settled.map((entry, index) => {
      if (entry.status === "fulfilled") return entry.value;
      const record = records[index];
      const repo = record.repo.fullName || record.candidate.id;
      console.warn(`codex deep-dive pool error ${repo}: ${entry.reason?.message || entry.reason}`);
      return (deps.markNeedsEnrichment || markNeedsEnrichment)(record, entry.reason, options);
    });

    // ALWAYS rebuild with whatever succeeded — never gated on a stuck/failed project.
    // (deps.publishBriefMirror is an injection seam for hermetic tests only.)
    const rebuild = deps.publishBriefMirror || publishBriefMirror;
    let briefMirror = null;
    if (options.build) {
      briefMirror = await rebuild({ options, logger: console });
    }

    const summary = {
      generatedAt: nowIso(options),
      integration: "decoupled-codex-deep-dive-authoring",
      model: options.model,
      model_reasoning_effort: options.reasoningEffort,
      command_template: codexCommandTemplate(options),
      concurrency,
      logRoot: relativeToRoot(options.logRoot),
      results,
      briefMirror,
    };
    const summaryPath = path.join(options.logRoot, "summary.json");
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ summaryPath, results }, null, 2));
    return summary;
  } finally {
    db.close();
  }
}

export function parseArgs(argv = []) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  const options = {
    repos: [],
    limit: 1,
    candidateLimit: 1000,
    wikiRoot: DEFAULT_WIKI_ROOT,
    logRoot: path.join(ROOT, "logs", `codex-deepdive-${stamp}`),
    model: CODEX_DEEP_MODEL,
    reasoningEffort: CODEX_REASONING_EFFORT,
    codexBin: "codex",
    timeoutMs: Number(process.env.PROJECT_CODEX_DEEP_DIVE_TIMEOUT_MS) || 20 * 60 * 1000,
    build: true,
    updateTrending: true,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[++index];
    };

    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--repo") options.repos.push(nextValue());
    else if (arg.startsWith("--repo=")) options.repos.push(valueAfterEquals(arg));
    else if (arg === "--limit") options.limit = numberOption(nextValue(), options.limit);
    else if (arg.startsWith("--limit=")) options.limit = numberOption(valueAfterEquals(arg), options.limit);
    else if (arg === "--candidate-limit") options.candidateLimit = numberOption(nextValue(), options.candidateLimit);
    else if (arg.startsWith("--candidate-limit=")) options.candidateLimit = numberOption(valueAfterEquals(arg), options.candidateLimit);
    else if (arg === "--db") options.dbPath = nextValue();
    else if (arg.startsWith("--db=")) options.dbPath = valueAfterEquals(arg);
    else if (arg === "--wiki-root") options.wikiRoot = nextValue();
    else if (arg.startsWith("--wiki-root=")) options.wikiRoot = valueAfterEquals(arg);
    else if (arg === "--log-root") options.logRoot = path.resolve(ROOT, nextValue());
    else if (arg.startsWith("--log-root=")) options.logRoot = path.resolve(ROOT, valueAfterEquals(arg));
    else if (arg === "--model") options.model = nextValue();
    else if (arg.startsWith("--model=")) options.model = valueAfterEquals(arg);
    else if (arg === "--reasoning-effort") options.reasoningEffort = nextValue();
    else if (arg.startsWith("--reasoning-effort=")) options.reasoningEffort = valueAfterEquals(arg);
    else if (arg === "--codex-bin") options.codexBin = nextValue();
    else if (arg.startsWith("--codex-bin=")) options.codexBin = valueAfterEquals(arg);
    else if (arg === "--timeout-ms") options.timeoutMs = numberOption(nextValue(), options.timeoutMs);
    else if (arg.startsWith("--timeout-ms=")) options.timeoutMs = numberOption(valueAfterEquals(arg), options.timeoutMs);
    else if (arg === "--force") options.force = true;
    else if (arg === "--no-build") options.build = false;
    else if (arg === "--no-trending") options.updateTrending = false;
    else if (!arg.startsWith("--")) options.repos.push(arg);
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  options.logRoot = path.resolve(ROOT, options.logRoot);
  return options;
}

export function loadProjectRecords(db, options = {}) {
  return db.listCandidates({ column: "projects", limit: options.candidateLimit || 1000 })
    .map((candidate) => {
      const analyses = db.listAnalyses(candidate.id);
      const lightRows = analyses.filter((analysis) => analysis.tier === "light");
      const lightRow = lightRows.find((analysis) => analysis.payload?.final_depth === "deep" || analysis.payload?.depth_decision?.final_depth === "deep")
        || lightRows[0];
      const briefWikiRow = analyses.find((analysis) => analysis.tier === "brief-wiki");
      const evidenceRows = db.listEvidence(candidate.id);
      const evidence = evidenceRows.find((row) => row.kind === "readme") || evidenceRows[0] || null;
      const light = lightRow?.payload || {};
      const finalDepth = light.final_depth || light.depth_decision?.final_depth || null;
      return {
        candidate,
        repo: candidate.raw || {},
        evidence,
        light,
        finalDepth,
        lightRow,
        briefWikiRow,
      };
    });
}

export function selectAuthoringRecords(records, options = {}) {
  const byRepo = new Map(records.map((record) => [normalizeRepoFullName(record.repo.fullName || record.repo.url), record]));
  if (options.repos?.length) {
    return options.repos.map((repoArg) => {
      const record = byRepo.get(normalizeRepoFullName(repoArg));
      if (!record) throw new Error(`Repo not found in project DB: ${repoArg}`);
      return record;
    });
  }

  return records
    .filter((record) => record.finalDepth === "deep")
    .filter((record) => options.force || !isBriefWikiAnalysisCompleted(record.briefWikiRow))
    .slice(0, options.limit || 1);
}

export async function authorOneDeepDive(record, options = {}) {
  const repo = record.repo;
  const repoLabel = repo.fullName || record.candidate.id;
  const safeRepo = slugify(repoLabel.replace("/", "__"));
  const itemLogDir = path.join(options.logRoot, safeRepo);
  const checkoutDir = path.join(itemLogDir, "checkout");
  const responsePath = path.join(itemLogDir, "codex-last-message.json");
  const schemaPath = path.join(itemLogDir, "output-schema.json");
  const promptPath = path.join(itemLogDir, "prompt.md");

  await mkdir(itemLogDir, { recursive: true });
  await mkdir(checkoutDir, { recursive: true });
  await writeFile(schemaPath, `${JSON.stringify(codexOutputSchema(), null, 2)}\n`, "utf8");

  const prompt = buildCodexAuthorPrompt({
    candidate: record.candidate,
    repo,
    evidence: record.evidence,
    triage: record.light,
    checkoutDir,
  });
  await writeFile(promptPath, prompt, "utf8");

  const invocation = await runCodexExec({
    prompt,
    outputPath: responsePath,
    schemaPath,
    itemLogDir,
    options,
  });

  const rawMessage = await readFile(responsePath, "utf8");
  const parsed = parseJson(rawMessage);
  const payload = normalizeCodexPayload(parsed, {
    repo,
    invocation,
    responsePath,
    promptPath,
  });
  const rawJsonPath = path.join(itemLogDir, "author-payload.json");
  await writeFile(rawJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const triage = {
    ...record.light,
    final_depth: "deep",
    depth_decision: {
      ...(record.light.depth_decision || {}),
      final_depth: "deep",
      max_allowed_depth: record.light.max_allowed_depth || record.light.depth_decision?.max_allowed_depth || "deep",
      needs_enrichment: false,
    },
  };
  const written = await writeProjectBriefWikiEntities({
    candidate: record.candidate,
    evidence: record.evidence || {},
    triage,
    deepDive: payload,
    options,
    logger: console,
  });
  const autosciPrimitive = await emitProjectAutoSciPrimitive({
    candidate: record.candidate,
    evidence: record.evidence || {},
    triage,
    deepDive: payload,
    finalDepth: "deep",
    options,
  });
  const autosciPrimitiveCount = autosciPrimitive ? 1 : 0;
  console.log(`codex deep-dive AutoSci primitives ${repoLabel}: 本次抽取 ${autosciPrimitiveCount} 条原语`);

  const generatedAt = nowIso(options);
  const projectMindPalace = normalizeProjectMindPalace(payload);
  const kgIngestQueue = projectMindPalace
    ? await enqueueProjectKgIngest({
        repo,
        slug: written.slug,
        mindPalace: projectMindPalace,
        sourceFile: written.paths?.deepDive || "",
        generatedAt,
        queueFile: options.projectKgQueueFile,
      })
    : null;
  const dbPayload = {
    repo: repoLabel,
    slug: written.slug,
    final_depth: "deep",
    depth_decision: triage.depth_decision,
    paths: written.paths,
    entitySlugs: written.entitySlugs,
    triage: summarizeTriage(triage),
    artifactAudit: record.evidence?.artifactAudit || record.evidence?.metadata?.artifactAudit || null,
    authoring: payload.authoring,
    mind_palace: projectMindPalace,
    kgIngestQueue,
    rawPayload: relativeToRoot(rawJsonPath),
    autosciPrimitive,
    autosciPrimitiveCount,
  };

  let analysisId = null;
  if (options.db) {
    const row = options.db.insertAnalysis({
      candidateId: record.candidate.id,
      tier: "brief-wiki",
      payload: dbPayload,
      model: authoringModelLabel(options),
      generatedAt,
    });
    analysisId = row.id;
    options.db.recordRun({
      id: `projects-codex-deep-dive:${record.candidate.id}:${Date.now()}`,
      column: "projects",
      stage: "codex-deep-dive",
      status: "pass",
      metrics: {
        repo: repoLabel,
        slug: written.slug,
        model: options.model,
        model_reasoning_effort: options.reasoningEffort,
        autosciPrimitiveCount,
      },
      ranAt: generatedAt,
    });
  }

  const trending = options.updateTrending
    ? await backfillTrendingBriefSlug({ repoFullName: repoLabel, slug: written.slug, options })
    : null;

  return {
    repo: repoLabel,
    status: "generated",
    slug: written.slug,
    analysisId,
    paths: written.paths,
    rawPayload: rawJsonPath,
    autosciPrimitive,
    autosciPrimitiveCount,
    prompt: promptPath,
    invocation: invocation.invocationPath,
    trending,
  };
}

function normalizeCodexPayload(input = {}, { repo, invocation, responsePath, promptPath } = {}) {
  if (!input.tier_template && !input.tierTemplate) {
    throw new Error("codex response missing tier_template");
  }
  return {
    ...input,
    tier_template: normalizeAuthorTierTemplate(input.tier_template || input.tierTemplate),
    mind_palace: normalizeProjectMindPalace(input),
    schema_version: input.schema_version || TIER_TEMPLATE_SCHEMA_VERSION,
    project_type: input.project_type || input.projectType,
    authoring: {
      method: "codex-exec",
      model: invocation.model,
      model_reasoning_effort: invocation.model_reasoning_effort,
      command: invocation.command,
      prompt: relativeToRoot(promptPath),
      raw_response: relativeToRoot(responsePath),
      invoked_at: invocation.startedAt,
      completed_at: invocation.finishedAt,
      repo: repo.fullName || repo.url || "",
    },
  };
}

function normalizeAuthorTierTemplate(template = {}) {
  if (!template || typeof template !== "object") return template;
  const comparison = sectionText(template.comparison);
  const reusable = reusableTemplateText(template.reusable_abstractions);
  return {
    ...template,
    comparison: comparison || cleanTemplateText(template.comparison),
    how_it_works_with_analogy: cleanTemplateText(
      template.how_it_works_with_analogy
      || template.howItWorksWithAnalogy
      || sectionText(template.how_it_works)
    ),
    essential_design_difference: cleanTemplateText(
      template.essential_design_difference
      || template.essentialDesignDifference
      || reusable
    ),
    practitioner_meaning: cleanTemplateText(
      template.practitioner_meaning
      || template.practitionerMeaning
      || sectionText(template.judgment)
    ),
    pain_point: cleanTemplateText(
      template.pain_point
      || template.painPoint
      || sectionText(template.why_worth_attention)
    ),
  };
}

function sectionText(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return cleanTemplateText(value.body_md || value.summary || "");
}

function reusableTemplateText(section = {}) {
  const body = sectionText(section);
  const items = asArray(section?.items).map((item) => {
    if (typeof item === "string") return cleanTemplateText(item);
    const name = cleanTemplateText(item?.name || "");
    const copy = cleanTemplateText(item?.copy || "");
    const skip = cleanTemplateText(item?.skip || "");
    const why = cleanTemplateText(item?.why_it_matters || item?.whyItMatters || "");
    return [name, copy, skip, why].filter(Boolean).join("；");
  }).filter(Boolean);
  return [body, ...items.map((item) => `- ${item}`)].filter(Boolean).join("\n");
}

function cleanTemplateText(value) {
  return String(value || "").trim();
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

async function runCodexExec({ prompt, outputPath, schemaPath, itemLogDir, options = {} }) {
  const startedAt = nowIso(options);
  const codexArgs = [
    "exec",
    "-c",
    `model_reasoning_effort="${options.reasoningEffort}"`,
    "-m",
    options.model,
    "-s",
    "danger-full-access",
    "-C",
    ROOT,
    "--color",
    "never",
    "--output-last-message",
    outputPath,
    "-",
  ];
  const resolved = resolveCodexCommand(options);
  const spawnArgs = [...resolved.argsPrefix, ...codexArgs];
  const command = [resolved.command, ...spawnArgs].map(quoteArg).join(" ");
  const invocationPath = path.join(itemLogDir, "codex-invocation.json");
  await writeFile(invocationPath, `${JSON.stringify({
    command,
    argv: [resolved.command, ...spawnArgs],
    codexArgv: [options.codexBin, ...codexArgs],
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    startedAt,
  }, null, 2)}\n`, "utf8");

  const result = await spawnWithInput(resolved.command, spawnArgs, prompt, {
    cwd: ROOT,
    timeoutMs: options.timeoutMs,
  });
  const finishedAt = nowIso(options);
  await writeFile(path.join(itemLogDir, "codex-stdout.log"), result.stdout, "utf8");
  await writeFile(path.join(itemLogDir, "codex-stderr.log"), result.stderr, "utf8");

  const invocation = {
    command,
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    startedAt,
    finishedAt,
    exitCode: result.code,
    invocationPath,
  };
  await writeFile(invocationPath, `${JSON.stringify(invocation, null, 2)}\n`, "utf8");

  if (result.code !== 0) {
    throw new Error(`codex exec exited ${result.code}: ${lastLines(result.stderr || result.stdout, 8)}`);
  }
  return invocation;
}

function spawnWithInput(command, args, input, { cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`codex exec timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

function markNeedsEnrichment(record, error, options = {}) {
  const repo = record.repo.fullName || record.candidate.id;
  const message = error?.message || String(error);
  const generatedAt = nowIso(options);
  const payload = {
    ...(record.light || {}),
    final_depth: "needs_enrichment",
    needs_enrichment: true,
    recommended_action: "monitor",
    reason: `codex_deep_dive_failed: ${message}`,
    rejection_reasons: unique([...(record.light.rejection_reasons || []), "codex_deep_dive_failed"]),
    review_verdict: "not_applicable",
    review_issues: unique([...(record.light.review_issues || []), "codex_deep_dive_failed"]),
    depth_decision: {
      ...(record.light.depth_decision || {}),
      final_depth: "needs_enrichment",
      needs_enrichment: true,
      recommended_action: "monitor",
      rejection_reasons: unique([...(record.light.depth_decision?.rejection_reasons || []), "codex_deep_dive_failed"]),
    },
  };

  let analysisId = null;
  if (options.db) {
    options.db.upsertEval({
      candidateId: record.candidate.id,
      decision: "needs_enrichment",
      mode: "codex-deep-dive-fallback",
      score: Number(record.light.ranking_score || record.light.worthDeepDive || 0),
      signals: unique([...(record.light.signals || []), "final_depth:needs_enrichment", "codex_deep_dive_failed"]),
      reason: payload.reason,
      evaluatedAt: generatedAt,
    });
    const row = options.db.insertAnalysis({
      candidateId: record.candidate.id,
      tier: "light",
      payload,
      model: "project-codex-deep-dive-fallback",
      generatedAt,
    });
    analysisId = row.id;
    options.db.recordRun({
      id: `projects-codex-deep-dive:${record.candidate.id}:fail:${Date.now()}`,
      column: "projects",
      stage: "codex-deep-dive",
      status: "fail",
      metrics: { repo, error: message },
      ranAt: generatedAt,
    });
  }

  return {
    repo,
    status: "needs_enrichment",
    generated: false,
    analysisId,
    error: message,
  };
}

async function backfillTrendingBriefSlug({ repoFullName, slug, options = {} }) {
  let data;
  try {
    data = JSON.parse(await readFile(TRENDING_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { file: TRENDING_FILE, touched: 0, missing: true };
    throw error;
  }

  let touched = 0;
  for (const boardName of ["radar", "daily", "weekly", "monthly"]) {
    const repos = data[boardName]?.repos || [];
    for (const repo of repos) {
      if (normalizeRepoFullName(repo.fullName || repo.url) !== normalizeRepoFullName(repoFullName)) continue;
      repo.briefSlug = slug;
      repo.brief_slug = slug;
      touched += 1;
    }
  }

  data.analysisModels = {
    ...(data.analysisModels || {}),
    projectDeep: authoringModelLabel(options),
  };
  data.deepDiveAuthoring = {
    ...(data.deepDiveAuthoring || {}),
    method: "decoupled-codex-exec",
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    lastBackfillAt: nowIso(options),
  };

  await writeFile(TRENDING_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return { file: TRENDING_FILE, touched };
}

function buildCodexAuthorPrompt({ candidate, repo, evidence, triage, checkoutDir }) {
  return `You are the AI-Brief project deep-dive author.

Task: author one Chinese project deep-dive for ${repo.fullName || repo.url}.

Hard requirements:
- You MUST autonomously inspect the real upstream repository, not only the enrichment README below.
- Clone or otherwise read the real repo into this temporary directory: ${checkoutDir}
- Read README plus deeper docs/examples/config/package files when present. Use source anchors that name the file/section, e.g. （来源：README Quickstart）, （来源：docs/policy.md）, （来源：package.json scripts）.
- Do not edit the AI-Brief workspace. The caller will write brief-wiki files.

【新范式·呈现纪律(Kevin 2026-06-08, 最重要 — 旧版"差到不想看", 这次按此写)】
- **少文字**: 每个 section 只写几句应用判断, 不堆长段、不复述源码。一段话能说清就不要三段。
- **去英文原文**: 严禁整段贴英文 README/源码/文档。一律中文转述; 只在必要处放**极短**代码/命令/配置片段(≤2 行)且紧跟一句中文说明。术语首次出现给一句中文白话注解。
- **架构用图, 不用长文**: 核心架构 / 数据流 / agent loop 必须用一个 **Mermaid 图**(在 how_it_works.body_md 里放 \`\`\`mermaid 代码块, flowchart/graph), 用图表达结构, 配几句话点关键节点 — 不要用长段文字描述架构。Mermaid 节点文字用中文/极短英文, 不放特殊字符。
- **应用判断为主**(读者=做 AI 应用的人): 它是什么(中文一句话) / 解决什么痛点 / 怎么用 / 什么时候用 / **横向对比≥2 个点名同类**(命名竞品+真实差异+取舍) / 成熟度 + 风险。不堆机制数学、不做研究审稿。
- Use Chinese plain-language two-layer writing: 先人话, 再点术语。
- No fabrication: undocumented facts become 未知/未在 README/docs/tree 说明.
- README, badges, benchmark, marketing, "supports N", "fastest/best/only" claims must be attributed as 自称. Facts you verify from files/tree/package config can be 已核实.
- Keep exact numbers and wording. Do not round, infer, or fill counts.
- Do not write speculation as fact. Avoid 可能/也许/应该/看起来/大概.
- Keep body size proportional to evidence. No padding.

Return only a JSON object matching this schema shape:
{
  "schema_version": "${TIER_TEMPLATE_SCHEMA_VERSION}",
  "repo": "owner/name",
  "project_type": "agent_framework|agent_skill|devtool_cli|ai_app|model_infra|frontend_ui|dataset_benchmark|library_sdk|template_boilerplate|non_ai_eng",
  "tier_template": {
    "one_sentence": {"summary": "...", "body_md": "..."},
    "why_worth_attention": {"body_md": "...", "bullets": ["..."]},
    "key_claims_evidence": {
      "body_md": "...",
      "items": [
        {"claim": "...", "plain_english": "...", "source": "...", "attribution": "自称|已核实", "evidence_strength": "high|medium|low|none", "supports": "...", "does_not_support": "...", "threat": "..."}
      ]
    },
    "how_it_works": {"body_md": "..."},
    "reusable_abstractions": {"body_md": "...", "items": [{"name": "...", "copy": "...", "skip": "...", "why_it_matters": "..."}]},
    "comparison": {"body_md": "..."},
    "dependency_platform_risk": {"body_md": "...", "items": [{"dependency": "...", "what_if_change": "...", "exposure": "high|medium|low|unknown", "mitigation_or_unknown": "...", "source": "..."}]},
    "unknowns_to_confirm": {"body_md": "...", "items": ["..."]},
    "core_concepts": [
      {"name": "规范概念名(中文优先,跨文件统一锚)", "role": "primary|supporting", "evidence": "为什么承重:逐字引用 README/源码/文档原词 + 文件/章节锚(来源：...);拿掉它该项目的核心范式不成立。营销词不算承重概念。"}
    ],
    "judgment": {"action": "skip|watch|read-docs|clone-and-run|extract-pattern", "ratings": {"相关度": 1, "工程深度": 1, "复用价值": 1, "成熟度": 1}, "body_md": "..."}
  },
  "mind_palace": {
    "problem_solved": "这个项目解决的真实问题; 不知道写 数据不足",
    "discovery_trace": "数据不足 或 {\"hypothesis\":\"设计动机\", \"failed_attempts\":[\"被否定的替代方案\"], \"source_span\":\"README/docs/issue/PR/blog 的具体锚点\"}",
    "method": "机制链 + 一个 Mermaid 图; 只写源码/README/docs 支撑的内容",
    "self_evo_use": "三段都必须出现: 记忆: ... 理解: ... 自进化: ...",
    "core_concepts": [
      {"name": "规范概念名", "role": "primary|supporting|mentioned", "evidence": "逐字短语 + 文件/章节锚"}
    ]
  },
  "concepts": [
    {"slug": "lowercase-hyphen", "name": "...", "explanation": "...", "tags": ["..."], "maturity": "stable|active|emerging|deprecated", "examples": ["..."], "common_misunderstandings": ["..."], "open_questions": ["..."]}
  ],
  "artifact": {"artifact_type": "repo", "url": "${repo.url || ""}", "official_or_third_party": "official", "status": "available|partial|missing|broken|on_hold", "license": "...", "runnable": "yes|no|unknown", "missing_parts": ["..."], "last_checked": "${new Date().toISOString().slice(0, 10)}", "summary": "..."}
}

Concreteness contract:
- Every tier_template section must contain specific, concrete detail extracted from the actual upstream repo. Do not write only category labels, architecture sketches, or generic capability summaries.
- "how_it_works" must walk a real flow with a real example from the repo. Include actual config/code/commands/file paths where present, such as a policy rule text, a function call, a CLI command, a deny/allow path, or a package/module path. A sentence like "it uses a policy engine to intercept tools" fails unless it shows the concrete mechanism and example.
- "comparison" is required for Tier 3 horizontal judgment. Name at least 2 concrete alternatives, predecessors, or common practices, not vague labels like "similar systems". For each, state a real difference dimension (retrieval mechanism, integration path, self-hosting, license, maturity, workflow fit, or equivalent) and the tradeoff for building AI applications: when to pick this project, and when to pick the alternative. If a competitor capability is only vendor/project claimed or not independently verified, mark it as self-claimed/unverified. If you cannot find a directly comparable alternative, write "未找到直接可比同类" and describe the searched scope; do not invent competitors or numbers.
- "key_claims_evidence.items" must make each claim concrete: state the literal mechanism, number, config, path, command, or example that supports it. Do not write abstract claims like "provides governance capabilities" unless you also quote what it literally does and where.
- "tier_template.core_concepts" is a required Tier 3 standard piece (KG-2 paradigm): emit 3-5 LOAD-BEARING concepts, each {name, role: primary|supporting, evidence}. A concept is load-bearing only if removing it makes the project's core paradigm collapse; marketing words, generic buzzwords (e.g. "AI", "fast", "easy"), and undocumented features are NOT concepts. Each concept MUST appear in the actual README/source/docs (not invented) and its evidence MUST quote the source wording verbatim plus a file/section anchor (来源：...). Use a stable canonical name (中文优先) so the same concept matches across files — these feed the Mind Palace core-concept gate and are the project-side anchor for paper↔project edge judging. If you cannot find 3 genuinely load-bearing documented concepts, emit fewer rather than padding.
- "mind_palace" is the project facet hook for KG ingest. It must include problem_solved / discovery_trace / method / self_evo_use / core_concepts. self_evo_use must explicitly cover 记忆、理解、自进化. discovery_trace must be 数据不足 unless the repo/docs/issues/PRs/blogs really show the design motivation path; non-empty discovery_trace requires source_span. core_concepts must be 3-5 objects with role primary|supporting|mentioned and evidence anchored in real source text.
- Actively pull real snippets, config keys, commands, numbers, module names, and file paths from README plus source/docs/examples/config/tests. The result should read like someone inspected the code, not someone skimmed the README.
- Standard: "more useful than a full translation." Preserve the concrete details a raw translation would carry, then organize and judge them. Any section that contains only a framework/category with no concrete example, number, snippet, command, or path is a failure.
- If a section fails that concreteness standard, add a top-level "render_warnings" array explaining which section is too abstract and why.
- Concreteness must not reintroduce fabrication. Every concrete specific must be sourced inline and attributed as self-claimed or verified. If you cannot find a concrete detail, say unknown/README docs tree did not explain it; do not invent.

Context from local radar pipeline, for orientation only:
${JSON.stringify({
  repo,
  candidate: {
    id: candidate.id,
    source: candidate.source,
    discoveredAt: candidate.discoveredAt,
  },
  triage,
  evidence: {
    kind: evidence?.kind,
    fetchedAt: evidence?.fetchedAt,
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
    readme_excerpt: String(evidence?.content || "").slice(0, 4000),
  },
}, null, 2)}
`;
}

function codexOutputSchema() {
  return {
    type: "object",
    additionalProperties: true,
    required: ["schema_version", "repo", "tier_template", "mind_palace"],
    properties: {
      schema_version: { type: "string" },
      repo: { type: "string" },
      project_type: { type: "string" },
      mind_palace: {
        type: "object",
        additionalProperties: true,
        required: ["problem_solved", "method", "self_evo_use", "core_concepts"],
      },
      tier_template: {
        type: "object",
        additionalProperties: true,
        required: [
          "tier",
          "bucket",
          "one_sentence_positioning",
          "what_it_does",
          "metadata",
          "pain_point",
          "core_capabilities",
          "how_to_run",
          "maturity_signals",
          "comparison",
          "trajectory_note",
          "how_it_works_with_analogy",
          "essential_design_difference",
          "practitioner_meaning",
          "comparison",
        ],
      },
    },
  };
}

function summarizeTriage(triage = {}) {
  return {
    project_type: triage.project_type || null,
    verdict: triage.verdict || null,
    ratings: triage.ratings || null,
    worthDeepDive: Number(triage.worthDeepDive ?? triage.score ?? 0),
    ranking_score: Number(triage.ranking_score ?? triage.score ?? 0),
    max_allowed_depth: triage.max_allowed_depth || triage.depth_decision?.max_allowed_depth || null,
    final_depth: triage.final_depth || triage.depth_decision?.final_depth || null,
    recommended_action: triage.recommended_action || triage.depth_decision?.recommended_action || null,
    needs_enrichment: Boolean(triage.needs_enrichment || triage.depth_decision?.needs_enrichment),
    reason: triage.reason || "",
  };
}

function authoringModelLabel(options = {}) {
  return `codex:${options.model || CODEX_DEEP_MODEL};model_reasoning_effort=${options.reasoningEffort || CODEX_REASONING_EFFORT}`;
}

function codexCommandTemplate(options = {}) {
  return `${options.codexBin || "codex"} exec -c model_reasoning_effort="${options.reasoningEffort || CODEX_REASONING_EFFORT}" -m ${options.model || CODEX_DEEP_MODEL} -s danger-full-access -C <repo> --output-last-message <file> -`;
}

function resolveCodexCommand(options = {}) {
  if (options.codexBin && options.codexBin !== "codex") return { command: options.codexBin, argsPrefix: [] };
  if (process.platform !== "win32") return { command: options.codexBin || "codex", argsPrefix: [] };

  const npmRoot = process.env.APPDATA ? path.join(process.env.APPDATA, "npm") : "";
  const codexJs = npmRoot ? path.join(npmRoot, "node_modules", "@openai", "codex", "bin", "codex.js") : "";
  if (codexJs) return { command: process.execPath, argsPrefix: [codexJs] };
  return { command: options.codexBin || "codex", argsPrefix: [] };
}

function normalizeRepoFullName(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^github\.com\//i, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "");
  const match = raw.match(/^([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : "";
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function relativeToRoot(value) {
  return path.relative(ROOT, path.resolve(ROOT, value || "")) || ".";
}

function quoteArg(value) {
  const raw = String(value);
  return /^[A-Za-z0-9_./:=\\"-]+$/.test(raw) ? raw : JSON.stringify(raw);
}

function lastLines(value, count) {
  return String(value || "").trim().split(/\r?\n/).slice(-count).join("\n");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "project";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/projects/codex-deepdive.mjs --repo owner/name [--repo owner/name] [--force]

Runs the decoupled project deep-dive authoring pass:
  SQLite deep candidate -> codex exec gpt-5.5 medium -> light-spine JSON -> brief-wiki -> trending briefSlug backfill

Flags:
  --repo owner/name       Explicit repo from data/ai-brief.db. Repeatable.
  --limit N              Auto-select count when --repo is omitted. Default: 1.
  --force                Author even if brief-wiki already marks the repo deep_dived.
  --wiki-root DIR        Brief wiki root. Default: brief-wiki.
  --log-root DIR         Raw prompt/response/invocation output dir.
  --no-build             Skip public/data/brief rebuild.
  --no-trending          Skip public/data/trending.json briefSlug backfill.
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
