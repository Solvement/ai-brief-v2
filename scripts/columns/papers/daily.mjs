#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openAiBriefDb } from "../../lib/db.mjs";
import { runColumnPipeline } from "../../lib/pipeline-kernel.mjs";
import { main as runCodexDeepDiveDaily } from "./codex-deepdive.mjs";
import papersColumnModule from "./index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");

export async function main(argv = process.argv.slice(2)) {
  await loadEnv();
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  if (!options.legacyKernel) {
    return runCodexDeepDiveDaily(toCodexArgs(options));
  }

  const db = await openAiBriefDb(options.dbPath);
  options.db = db;

  try {
    const result = await runColumnPipeline(papersColumnModule, {
      ...options,
      runId: options.runId || dailyRunId(options),
      logger: console,
      paperAnalysisTier: "deep",
      concurrency: {
        evidence: numberOption(options.evidenceConcurrency, 2),
        evaluate: numberOption(options.evaluateConcurrency, 2),
        analyze: numberOption(options.analyzeConcurrency, 1),
        qaGate: numberOption(options.qaConcurrency, 1),
      },
    });

    console.log(
      `papers daily ${result.runId}: ${result.candidates.length} candidates, ${result.selected.length} selected, ${result.analyses.length} analyzed`,
    );
    return result;
  } finally {
    db.close();
  }
}

export function parseArgs(argv = []) {
  const options = {
    cap: numberOption(process.env.PAPERS_DEEP_CAP, 3),
    topN: numberOption(process.env.PAPERS_TOP_N ?? process.env.PAPERS_DEEP_LIMIT, 5),
    maxLimit: numberOption(process.env.PAPERS_MAX_DEEP_LIMIT, 12),
    limit: numberOption(process.env.PAPERS_DISCOVER_LIMIT, 140),
    minScore: numberOption(process.env.PAPERS_MIN_SCORE, null),
    paperTextMaxChars: numberOption(process.env.PAPERS_TEXT_MAX_CHARS, 120000),
    paperLightMaxTokens: numberOption(process.env.PAPERS_LIGHT_MAX_TOKENS, 2600),
    paperDeepMaxTokens: numberOption(process.env.PAPERS_DEEP_MAX_TOKENS, 16000),
    apiTimeoutMs: numberOption(process.env.DEEPSEEK_TIMEOUT_MS, 180000),
    activeArticlesLimit: numberOption(process.env.PAPERS_ARTICLES_ACTIVE_LIMIT, 12),
    radarArchiveLimit: numberOption(process.env.PAPERS_RADAR_ARCHIVE_LIMIT, 90),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[++index];
    };

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--offline" || arg === "--no-llm") {
      options.offline = true;
      options.noLlm = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
      options.offline = true;
      options.noLlm = true;
      options.noCodex = true;
    } else if (arg === "--legacy-kernel") {
      options.legacyKernel = true;
    } else if (arg === "--no-codex") {
      options.noCodex = true;
    } else if (arg === "--no-cache") {
      options.noCache = true;
    } else if (arg === "--top-n") {
      options.topN = numberOption(nextValue(), options.topN);
    } else if (arg.startsWith("--top-n=")) {
      options.topN = numberOption(valueAfterEquals(arg), options.topN);
    } else if (arg === "--cap") {
      options.cap = numberOption(nextValue(), options.cap);
      options.topN = options.cap;
    } else if (arg.startsWith("--cap=")) {
      options.cap = numberOption(valueAfterEquals(arg), options.cap);
      options.topN = options.cap;
    } else if (arg === "--limit") {
      options.topN = numberOption(nextValue(), options.topN);
    } else if (arg.startsWith("--limit=")) {
      options.topN = numberOption(valueAfterEquals(arg), options.topN);
    } else if (arg === "--candidate-limit") {
      options.limit = numberOption(nextValue(), options.limit);
    } else if (arg.startsWith("--candidate-limit=")) {
      options.limit = numberOption(valueAfterEquals(arg), options.limit);
    } else if (arg === "--max-limit") {
      options.maxLimit = numberOption(nextValue(), options.maxLimit);
    } else if (arg.startsWith("--max-limit=")) {
      options.maxLimit = numberOption(valueAfterEquals(arg), options.maxLimit);
    } else if (arg === "--min-score") {
      options.minScore = numberOption(nextValue(), options.minScore);
    } else if (arg.startsWith("--min-score=")) {
      options.minScore = numberOption(valueAfterEquals(arg), options.minScore);
    } else if (arg === "--api-timeout-ms") {
      options.apiTimeoutMs = numberOption(nextValue(), options.apiTimeoutMs);
    } else if (arg.startsWith("--api-timeout-ms=")) {
      options.apiTimeoutMs = numberOption(valueAfterEquals(arg), options.apiTimeoutMs);
    } else if (arg === "--active-limit") {
      options.activeArticlesLimit = numberOption(nextValue(), options.activeArticlesLimit);
    } else if (arg.startsWith("--active-limit=")) {
      options.activeArticlesLimit = numberOption(valueAfterEquals(arg), options.activeArticlesLimit);
    } else if (arg === "--radar-archive-limit") {
      options.radarArchiveLimit = numberOption(nextValue(), options.radarArchiveLimit);
    } else if (arg.startsWith("--radar-archive-limit=")) {
      options.radarArchiveLimit = numberOption(valueAfterEquals(arg), options.radarArchiveLimit);
    } else if (arg === "--db") {
      options.dbPath = nextValue();
    } else if (arg.startsWith("--db=")) {
      options.dbPath = valueAfterEquals(arg);
    } else if (arg === "--run-id") {
      options.runId = nextValue();
    } else if (arg.startsWith("--run-id=")) {
      options.runId = valueAfterEquals(arg);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (process.env.NO_LLM === "1" || process.env.AI_BRIEF_OFFLINE === "1") {
    options.offline = true;
    options.noLlm = true;
  }

  return options;
}

function toCodexArgs(options = {}) {
  const args = [
    "--limit", String(options.topN || 5),
    "--max-limit", String(options.maxLimit || 12),
    "--candidate-limit", String(options.limit || 45),
    "--active-limit", String(options.activeArticlesLimit || 12),
  ];
  if (options.noCodex || options.noLlm || options.offline || options.dryRun) args.push("--no-codex");
  return args;
}

async function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const raw = await readFile(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]] && value) process.env[match[1]] = value;
  }
}

function dailyRunId(options = {}) {
  const mode = options.offline || options.dryRun ? "offline" : "online";
  return `papers-daily-${mode}-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberOption(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/papers/daily.mjs [--limit N] [--candidate-limit N] [--no-codex]

Runs the canonical papers chain:
  HF Daily Papers -> top-N by upvotes+signal -> codex v2 deep authoring -> light cards -> publish articles.json

Flags:
  --limit N        Deep v2 top-N. Default: 5, max: 12
  --candidate-limit N  HF Daily papers to keep as deep candidates + light cards. Default: 45
  --no-codex       Fetch/select/publish with dry-run deep payloads
  --legacy-kernel  Run the older kernel pipeline path
  --offline        Alias for no-LLM/no-codex where supported
  --dry-run        Offline/no-LLM fixture path for cheap shape verification
  --db PATH        SQLite DB path override
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
