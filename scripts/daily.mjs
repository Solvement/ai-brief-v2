#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { main as runModelsDaily } from "./columns/models/daily.mjs";
import { main as runNewsDaily } from "./columns/news/daily.mjs";
import { main as runPapersColumnDaily } from "./columns/papers/daily.mjs";
import { main as runProjectsDaily } from "./columns/projects/daily.mjs";

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  const results = [];
  results.push(await runColumn("news", () => runNewsDaily(passThroughArgs(options))));
  results.push(await runColumn("papers", () => runPapersColumnDaily(passThroughArgs(options))));
  // Full 30-per-board radar by default (spec target); pass-through flags (offline/dry-run/cap) still apply.
  results.push(await runColumn("projects", () => runProjectsDaily(["--limit", "30", "--radar-limit", "30", ...passThroughArgs(options)])));
  results.push(await runColumn("models", () => runModelsDaily(passThroughArgs(options))));

  printCombinedSummary(results);

  if (results.every((result) => result.status === "failed")) {
    const error = new Error("daily: all columns failed");
    error.results = results;
    throw error;
  }

  return results;
}

export function parseArgs(argv = []) {
  const options = {
    offline: false,
    dryRun: false,
    cap: 0,
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
    } else if (arg === "--cap") {
      options.cap = numberOption(nextValue(), options.cap);
    } else if (arg.startsWith("--cap=")) {
      options.cap = numberOption(valueAfterEquals(arg), options.cap);
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
  projects -> scripts/columns/projects/daily.mjs
  models   -> scripts/columns/models/daily.mjs

Flags:
  --offline  Pass offline/no-LLM mode through to columns that support it
  --dry-run  Pass dry-run mode through to columns that support it
  --cap N    Pass cap through to columns that support it
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
