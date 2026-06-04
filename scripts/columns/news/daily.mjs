#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverNews, mergeWithExisting } from "./sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const NEWS_FILE = path.join(ROOT, "public", "data", "news.json");

export async function main(argv = process.argv.slice(2)) {
  await loadEnv();
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  const generatedAt = options.generatedAt || new Date().toISOString();
  const current = await readNewsFile();
  const discovered = await discoverNews({
    ...options,
    logger: console,
    now: () => generatedAt,
  });
  const dedupedItems = mergeWithExisting(current.items || [], discovered.items, {
    ...options,
    dailyCap: 0,
    now: () => generatedAt,
  });
  const items = mergeWithExisting(current.items || [], discovered.items, {
    ...options,
    now: () => generatedAt,
  });

  const doc = {
    generatedAt,
    column: "news",
    mode: options.enableLlm ? "aggregate+optional-llm" : "aggregate-only",
    llmEnabled: Boolean(options.enableLlm),
    retention: {
      days: options.retentionDays,
      maxItems: options.retentionLimit,
      perSourceLimit: options.perSourceLimit,
      dailyCap: options.dailyCap,
    },
    sourceStats: discovered.sourceStats,
    totalDiscovered: discovered.items.length,
    totalAfterDedupe: dedupedItems.length,
    totalPublished: items.length,
    totalPublishedForGeneratedDay: countItemsForDay(items, generatedAt),
    items,
  };

  if (options.dryRun) {
    console.log(`[news] dry-run: would write ${NEWS_FILE}`);
  } else {
    await writeJson(NEWS_FILE, doc);
    console.log(`[news] wrote ${NEWS_FILE}`);
  }

  printSummary(doc);
  return doc;
}

export function parseArgs(argv = []) {
  const options = {
    dryRun: false,
    noLlm: true,
    enableLlm: false,
    perSourceLimit: numberOption(process.env.NEWS_PER_SOURCE_LIMIT, 30),
    dailyCap: numberOption(process.env.NEWS_DAILY_CAP, 20),
    retentionDays: numberOption(process.env.NEWS_RETENTION_DAYS, 14),
    retentionLimit: numberOption(process.env.NEWS_RETENTION_LIMIT, 300),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[++index];
    };

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--offline" || arg === "--no-llm") {
      options.noLlm = true;
      options.enableLlm = false;
    } else if (arg === "--llm" || arg === "--enable-llm") {
      options.noLlm = false;
      options.enableLlm = true;
    } else if (arg === "--per-source-limit") {
      options.perSourceLimit = numberOption(nextValue(), options.perSourceLimit);
    } else if (arg.startsWith("--per-source-limit=")) {
      options.perSourceLimit = numberOption(valueAfterEquals(arg), options.perSourceLimit);
    } else if (arg === "--daily-cap") {
      options.dailyCap = numberOption(nextValue(), options.dailyCap);
    } else if (arg.startsWith("--daily-cap=")) {
      options.dailyCap = numberOption(valueAfterEquals(arg), options.dailyCap);
    } else if (arg === "--retention-days") {
      options.retentionDays = numberOption(nextValue(), options.retentionDays);
    } else if (arg.startsWith("--retention-days=")) {
      options.retentionDays = numberOption(valueAfterEquals(arg), options.retentionDays);
    } else if (arg === "--retention-limit") {
      options.retentionLimit = numberOption(nextValue(), options.retentionLimit);
    } else if (arg.startsWith("--retention-limit=")) {
      options.retentionLimit = numberOption(valueAfterEquals(arg), options.retentionLimit);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (process.env.NEWS_ENABLE_LLM === "1" && process.env.NO_LLM !== "1" && process.env.AI_BRIEF_OFFLINE !== "1") {
    options.noLlm = false;
    options.enableLlm = true;
  }
  if (process.env.NO_LLM === "1" || process.env.AI_BRIEF_OFFLINE === "1") {
    options.noLlm = true;
    options.enableLlm = false;
  }

  return options;
}

async function readNewsFile() {
  try {
    return JSON.parse(await readFile(NEWS_FILE, "utf8"));
  } catch {
    return { generatedAt: "", items: [] };
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
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

function printSummary(doc) {
  console.log(`news daily: ${doc.totalDiscovered} discovered, ${doc.totalAfterDedupe} after dedupe, ${doc.totalPublishedForGeneratedDay} for generated day, ${doc.totalPublished} retained published, daily cap ${doc.retention.dailyCap}, LLM ${doc.llmEnabled ? "on" : "off"}`);
  for (const stat of doc.sourceStats) {
    console.log(`news source: ${stat.source} ${stat.ok ? "ok" : "failed"} (${stat.count})${stat.error ? ` - ${stat.error}` : ""}`);
  }
  console.log("news samples:");
  for (const item of doc.items.slice(0, 10)) {
    console.log(`- ${item.title} | ${item.source} | ${item.url}`);
  }
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function countItemsForDay(items = [], generatedAt) {
  const day = new Date(generatedAt).toISOString().slice(0, 10);
  return items.filter((item) => String(item.publishedAt || "").startsWith(day)).length;
}

function numberOption(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/news/daily.mjs [--dry-run] [--no-llm] [--per-source-limit N]

Runs the AI news aggregation chain:
  discover -> normalize/dedupe -> publish public/data/news.json

Flags:
  --no-llm              Aggregate only. Default.
  --enable-llm          Reserved for optional cheap summaries; disabled unless NEWS_ENABLE_LLM=1 or this flag is passed.
  --per-source-limit N  Safety cap per source. Default: 30
  --daily-cap N         Max published items per retained day. Default: 20
  --retention-days N    Rolling window. Default: 14
  --retention-limit N   Max retained items. Default: 300
  --dry-run             Fetch and summarize without writing.
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
