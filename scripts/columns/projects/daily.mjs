#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openAiBriefDb } from "../../lib/db.mjs";
import { runColumnPipeline } from "../../lib/pipeline-kernel.mjs";
import projectsColumnModule from "./index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");

export async function main(argv = process.argv.slice(2)) {
  await loadEnv();
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  const db = await openAiBriefDb(options.dbPath);
  options.db = db;

  try {
    const result = await runColumnPipeline(projectsColumnModule, {
      ...options,
      runId: options.runId || dailyRunId(options),
      logger: console,
      concurrency: {
        evidence: numberOption(options.evidenceConcurrency, 5),
        evaluate: numberOption(options.evaluateConcurrency, 3),
        analyze: numberOption(options.analyzeConcurrency, 1),
        qaGate: numberOption(options.qaConcurrency, 1),
      },
    });

    console.log(
      `projects daily ${result.runId}: ${result.candidates.length} candidates, ${result.selected.length} selected, ${result.analyses.length} analyzed`,
    );
    return result;
  } finally {
    db.close();
  }
}

export function parseArgs(argv = []) {
  const options = {
    projectBriefWiki: true,
    briefWikiDaily: true,
    dailyDeepDive: true,
    cap: 6,
    limit: 15,
    topicLimit: 4,
    worthThreshold: 60,
    readmeMaxChars: 14000,
    lightMaxTokens: Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 1200,
    deepDiveMaxTokens: Number(process.env.PROJECT_DEEP_DIVE_MAX_TOKENS) || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 12000,
    apiTimeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS) || 180000,
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
    } else if (arg === "--no-readme") {
      options.noReadme = true;
    } else if (arg === "--no-cache") {
      options.noCache = true;
    } else if (arg === "--cap") {
      options.cap = numberOption(nextValue(), options.cap);
    } else if (arg.startsWith("--cap=")) {
      options.cap = numberOption(valueAfterEquals(arg), options.cap);
    } else if (arg === "--limit") {
      options.limit = numberOption(nextValue(), options.limit);
    } else if (arg.startsWith("--limit=")) {
      options.limit = numberOption(valueAfterEquals(arg), options.limit);
    } else if (arg === "--topic-limit") {
      options.topicLimit = numberOption(nextValue(), options.topicLimit);
    } else if (arg.startsWith("--topic-limit=")) {
      options.topicLimit = numberOption(valueAfterEquals(arg), options.topicLimit);
    } else if (arg === "--readme-max-chars") {
      options.readmeMaxChars = numberOption(nextValue(), options.readmeMaxChars);
    } else if (arg.startsWith("--readme-max-chars=")) {
      options.readmeMaxChars = numberOption(valueAfterEquals(arg), options.readmeMaxChars);
    } else if (arg === "--light-max-tokens") {
      options.lightMaxTokens = numberOption(nextValue(), options.lightMaxTokens);
    } else if (arg.startsWith("--light-max-tokens=")) {
      options.lightMaxTokens = numberOption(valueAfterEquals(arg), options.lightMaxTokens);
    } else if (arg === "--deep-max-tokens" || arg === "--deep-dive-max-tokens") {
      options.deepDiveMaxTokens = numberOption(nextValue(), options.deepDiveMaxTokens);
    } else if (arg.startsWith("--deep-max-tokens=") || arg.startsWith("--deep-dive-max-tokens=")) {
      options.deepDiveMaxTokens = numberOption(valueAfterEquals(arg), options.deepDiveMaxTokens);
    } else if (arg === "--api-timeout-ms") {
      options.apiTimeoutMs = numberOption(nextValue(), options.apiTimeoutMs);
    } else if (arg.startsWith("--api-timeout-ms=")) {
      options.apiTimeoutMs = numberOption(valueAfterEquals(arg), options.apiTimeoutMs);
    } else if (arg === "--db") {
      options.dbPath = nextValue();
    } else if (arg.startsWith("--db=")) {
      options.dbPath = valueAfterEquals(arg);
    } else if (arg === "--wiki-root") {
      options.wikiRoot = nextValue();
    } else if (arg.startsWith("--wiki-root=")) {
      options.wikiRoot = valueAfterEquals(arg);
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
  return `projects-daily-${mode}-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/projects/daily.mjs [--cap N] [--offline] [--dry-run]

Runs the project daily chain:
  discover -> evidence/artifactAudit -> triage -> verdict-gated select -> brief-wiki deep-dive -> brief:lint -> brief:build -> trending.json

Flags:
  --cap N          Max selected deep-dive candidates. Default: 6
  --offline        No LLM/network project deep-dive; use deterministic generator stub
  --dry-run        Offline/no-LLM path for cheap shape verification
  --wiki-root DIR  Brief wiki root. Default: brief-wiki
  --db PATH        SQLite DB path override
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
