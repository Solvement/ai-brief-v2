#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openAiBriefDb } from "./lib/db.mjs";
import { runColumnPipeline } from "./lib/pipeline-kernel.mjs";
import papersColumnModule from "./columns/papers/index.mjs";
import projectsColumnModule from "./columns/projects/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MODULES = {
  papers: papersColumnModule,
  projects: projectsColumnModule,
};

export async function main(argv = process.argv.slice(2)) {
  await loadEnv();
  const { column, stage, options } = parseArgs(argv);
  const module = MODULES[column];
  if (!module) throw new Error(`Unknown column "${column}". Available: ${Object.keys(MODULES).join(", ")}`);

  const db = await openAiBriefDb(options.dbPath);
  options.db = db;
  try {
    if (stage === "publish") {
      const published = await module.publish([], {
        column,
        runId: runId(column, options),
        startedAt: new Date().toISOString(),
        logger: console,
        options,
        state: {},
        result: { evals: [], qa: [] },
      });
      console.log(formatPublishSummary(column, published));
      return published;
    }

    if (stage !== "all") {
      console.warn(`stage "${stage}" currently runs the full ${column} funnel and publishes from SQLite`);
    }
    const result = await runColumnPipeline(module, {
      ...options,
      runId: runId(column, options),
      logger: console,
      concurrency: {
        evidence: numberOption(options.evidenceConcurrency, 5),
        evaluate: numberOption(options.evaluateConcurrency, 3),
        analyze: numberOption(options.analyzeConcurrency, 1),
        qaGate: numberOption(options.qaConcurrency, 2),
      },
    });
    console.log(`${column} pipeline ${result.runId}: ${result.candidates.length} candidates, ${result.selected.length} selections`);
    return result;
  } finally {
    db.close();
  }
}

export function parseArgs(argv) {
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const column = positional[0] || "projects";
  const stage = positional[1] || "all";
  const flags = Object.fromEntries(argv
    .filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => {
      const index = arg.indexOf("=");
      return [arg.slice(2, index), arg.slice(index + 1)];
    }));

  const options = {
    dryRun: argv.includes("--dry-run"),
    noLlm: argv.includes("--dry-run") || argv.includes("--no-llm") || process.env.NO_LLM === "1",
    noReadme: argv.includes("--no-readme"),
    noCache: argv.includes("--no-cache"),
    limit: numberOption(flags.limit, 15),
    cap: numberOption(flags.cap, 6),
    worthThreshold: numberOption(flags.worth, 60),
    topicLimit: numberOption(flags["topic-limit"], 4),
    readmeMaxChars: numberOption(flags["readme-max-chars"], 14000),
    lightMaxTokens: numberOption(flags["light-max-tokens"], Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 1200),
    deepMaxTokens: numberOption(flags["deep-max-tokens"], Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 8000),
    apiTimeoutMs: numberOption(flags["api-timeout-ms"], Number(process.env.DEEPSEEK_TIMEOUT_MS) || 180000),
    dbPath: flags.db,
  };
  return { column, stage, options };
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

function runId(column, options = {}) {
  return options.runId || `${column}-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatPublishSummary(column, published = {}) {
  if (column === "projects") {
    return `published ${published.file} (${published.repoCount} repos, ${published.deepCount} deep dives)`;
  }
  if (column === "papers") {
    return `published ${published.file} and ${published.radarFile} (${published.paperCount} papers, ${published.excludedQaFailCount} QA failures excluded)`;
  }
  return `published ${published.file || column}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
