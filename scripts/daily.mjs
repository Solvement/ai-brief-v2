#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { main as runModelsDaily } from "./columns/models/daily.mjs";
import { main as runNewsDaily } from "./columns/news/daily.mjs";
import { main as runPapersHfDaily } from "./columns/papers/daily-hf.mjs";
import { main as runProjectsDaily } from "./columns/projects/daily.mjs";
import { main as runKgBuild } from "./kg/build-knowledge-graph.mjs";

export async function main(argv = process.argv.slice(2), { runners } = {}) {
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  const results = [];
  const want = (c) => options.only === "all" || options.only === c;   // --only news|papers|kg|projects|models
  if (want("news")) results.push(await runColumn("news", runners?.news ?? (() => runNewsDaily(passThroughArgs(options)))));
  if (want("papers")) results.push(await runColumn("papers", runners?.papers ?? (() => runPapersHfDaily())));
  if (want("kg")) results.push(await runColumn("kg", runners?.kg ?? (() => runKgBuild())));
  // Full 30-per-board radar by default (spec target); pass-through flags (offline/dry-run/cap) still apply.
  if (want("projects")) results.push(await runColumn("projects", runners?.projects ?? (() => runProjectsDaily(["--limit", "30", "--radar-limit", "30", ...passThroughArgs(options)]))));
  if (want("models")) results.push(await runColumn("models", runners?.models ?? (() => runModelsDaily(passThroughArgs(options)))));
  if (results.length === 0) { console.warn(`[daily] --only '${options.only}' matched no column`); return []; }

  printCombinedSummary(results);

  const outcome = evaluateRunOutcome(results, { allowPartial: options.allowPartial });
  if (outcome.shouldFail) {
    const failedColumns = outcome.failed.join(", ");
    console.error(`daily: FAILED columns: ${failedColumns}`);
    const error = new Error(`daily: failed columns: ${failedColumns}`);
    error.results = results;
    throw error;
  }

  return results;
}

export function evaluateRunOutcome(results, { allowPartial = false } = {}) {
  const failed = results.filter((r) => r.status === "failed").map((r) => r.name);
  const allFailed = results.length > 0 && failed.length === results.length;
  const shouldFail = allowPartial ? allFailed : failed.length > 0;
  return { failed, allFailed, shouldFail };
}

export function parseArgs(argv = []) {
  const options = {
    offline: false,
    dryRun: false,
    cap: 0,
    only: "all",
    allowPartial: false,
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
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--allow-partial") {
      options.allowPartial = true;
    } else if (arg === "--cap") {
      options.cap = numberOption(nextValue(), options.cap);
    } else if (arg.startsWith("--cap=")) {
      options.cap = numberOption(valueAfterEquals(arg), options.cap);
    } else if (arg === "--only") {
      options.only = nextValue();
    } else if (arg.startsWith("--only=")) {
      options.only = valueAfterEquals(arg);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return options;
}

async function runColumn(name, fn) {
  console.log(`[daily] ${name}: starting`);
  const startedMs = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - startedMs;
    console.log(`[daily] ${name}: ok (${durationMs}ms)`);
    return { name, status: "ok", durationMs, result };
  } catch (error) {
    const durationMs = Date.now() - startedMs;
    console.warn(`[daily] ${name}: failed (${error.message || String(error)})`);
    return { name, status: "failed", durationMs, error };
  }
}

function passThroughArgs(options = {}) {
  const args = [];
  if (options.offline) {
    args.push("--offline");
  }
  if (options.dryRun) args.push("--dry-run");
  if (options.cap) args.push("--cap", String(options.cap));
  return args;
}

function printCombinedSummary(results) {
  const ok = results.filter((result) => result.status === "ok").length;
  const failed = results.length - ok;
  console.log(`daily: ${ok}/${results.length} columns succeeded, ${failed} failed`);
  for (const result of results) {
    const detail = result.status === "ok"
      ? summarizeResult(result.result)
      : result.error?.message || "failed";
    console.log(`daily: ${result.name} ${result.status}${detail ? ` - ${detail}` : ""}`);
  }
}

function summarizeResult(result) {
  if (!result) return "";
  if (result.command) return result.command;
  if (typeof result === "object" && "checked" in result && "newVersions" in result) {
    return `${result.checked} checked, ${result.newVersions} new versions, ${result.regenerated} regenerated`;
  }
  if (typeof result === "object" && result.runId) return result.runId;
  return "";
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
  node scripts/daily.mjs [--offline] [--dry-run] [--cap N]

Runs daily checks in sequence:
  news     -> scripts/columns/news/daily.mjs
  papers   -> scripts/columns/papers/daily.mjs
  kg       -> scripts/kg/build-knowledge-graph.mjs
  projects -> scripts/columns/projects/daily.mjs
  models   -> scripts/columns/models/daily.mjs

Flags:
  --offline  Pass offline/no-LLM mode through to columns that support it
  --dry-run  Pass dry-run mode through to columns that support it
  --allow-partial  Only fail the combined daily run when every selected column fails
  --cap N    Pass cap through to columns that support it
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
