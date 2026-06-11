#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDeepSeekClient } from "../../lib/llm.mjs";
import { discoverNews, mergeWithExisting } from "./sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const NEWS_FILE = path.join(ROOT, "public", "data", "news.json");
const NEWS_HEALTH_FILE = path.join(ROOT, "public", "data", "news-health.json");
const NEWS_ENRICH_MODEL = "deepseek-v4-flash";
const NEWS_ENRICH_BATCH_SIZE = 8;
const NEWS_IMAGE_CANDIDATE_LIMIT = 10;
const NEWS_FRESHNESS_MAX_AGE_DAYS = 2;
const DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; ai-brief/0.1; news enricher)";

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
  let items = mergeWithExisting(current.items || [], discovered.items, {
    ...options,
    now: () => generatedAt,
  });
  items = await enrichNewsItems(items, {
    ...options,
    generatedAt,
    logger: console,
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
    enrichment: {
      enabled: Boolean(options.enableLlm),
      model: options.enableLlm ? NEWS_ENRICH_MODEL : "",
      imageCandidateLimit: options.enableLlm ? NEWS_IMAGE_CANDIDATE_LIMIT : 0,
    },
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

  const health = buildNewsHealth(doc, { now: () => new Date() });
  if (!options.dryRun) {
    await writeJson(NEWS_HEALTH_FILE, health);
    console.log(`[news] wrote ${NEWS_HEALTH_FILE}`);
  }

  printSummary(doc);
  printHealthSummary(health);
  if (!health.ok) {
    const error = new Error(`news daily unhealthy: ${health.failures.join("; ")}`);
    error.health = health;
    throw error;
  }
  return doc;
}

export function parseArgs(argv = []) {
  const options = {
    dryRun: false,
    noLlm: false,
    // Chinese is non-negotiable for this feed (Kevin 2026-06-11: 新闻必须中文). LLM ON by default —
    // it drives titleZh/summaryZh (News.tsx falls back to English title when absent). Per-batch
    // enrichment is already fail-soft (try/catch → keep English for that batch, never hangs the run);
    // codex B's earlier "180s hang" was the 124s INTERACTIVE command cap, not a boot-time hang (4h limit).
    // Escape hatches kept: --no-llm flag and NEWS_ENABLE_LLM=0.
    enableLlm: process.env.NEWS_ENABLE_LLM !== "0",
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
  if (process.env.NEWS_ENABLE_LLM === "0" || process.env.NO_LLM === "1" || process.env.AI_BRIEF_OFFLINE === "1") {
    options.noLlm = true;
    options.enableLlm = false;
  }

  return options;
}

export function buildNewsHealth(doc = {}, { now = () => new Date(), maxAgeDays = NEWS_FRESHNESS_MAX_AGE_DAYS } = {}) {
  const checkedAt = now().toISOString();
  const generatedAt = String(doc.generatedAt || "");
  const generatedMs = Date.parse(generatedAt);
  const ageDays = Number.isFinite(generatedMs)
    ? Math.max(0, (now().getTime() - generatedMs) / 864e5)
    : null;
  const sourceStats = Array.isArray(doc.sourceStats) ? doc.sourceStats : [];
  const successfulSources = sourceStats.filter((stat) => stat?.ok);
  const failedSources = sourceStats.filter((stat) => !stat?.ok);
  const totalDiscovered = Number(doc.totalDiscovered) || 0;
  const totalPublished = Number(doc.totalPublished) || 0;
  const totalPublishedForGeneratedDay = Number(doc.totalPublishedForGeneratedDay) || 0;

  const checks = [
    healthCheck(
      "freshness",
      `news.json generatedAt is no older than ${maxAgeDays} days`,
      ageDays !== null && ageDays <= maxAgeDays,
      ageDays === null ? "generatedAt missing or invalid" : `ageDays=${round(ageDays)}, generatedAt=${generatedAt}`,
    ),
    healthCheck(
      "source-availability",
      "at least one source succeeded",
      successfulSources.length > 0,
      `${successfulSources.length}/${sourceStats.length} sources succeeded`,
    ),
    healthCheck(
      "discovery-nonempty",
      "discovery produced publishable candidates",
      totalDiscovered > 0,
      `${totalDiscovered} discovered`,
    ),
    healthCheck(
      "published-total",
      "published feed is non-empty",
      totalPublished > 0,
      `${totalPublished} retained items`,
    ),
    healthCheck(
      "generated-day-nonempty",
      "generated day has at least one item",
      totalPublishedForGeneratedDay > 0,
      `${totalPublishedForGeneratedDay} items for generated day`,
    ),
  ];
  const failures = checks.filter((check) => check.status === "fail").map((check) => `${check.id}: ${check.details}`);
  return {
    schemaVersion: 1,
    generatedAt: checkedAt,
    ok: failures.length === 0,
    status: failures.length === 0 ? "pass" : "fail",
    column: "news",
    dataFile: "public/data/news.json",
    dataGeneratedAt: generatedAt,
    maxAgeDays,
    ageDays: ageDays === null ? null : round(ageDays),
    totalDiscovered,
    totalPublished,
    totalPublishedForGeneratedDay,
    sourceCount: sourceStats.length,
    successfulSourceCount: successfulSources.length,
    failedSourceCount: failedSources.length,
    failedSources: failedSources.map((stat) => ({
      id: String(stat.id || stat.source || "unknown"),
      source: String(stat.source || stat.id || "unknown"),
      error: String(stat.error || "failed"),
    })),
    checks,
    failures,
    note: failures.length === 0
      ? "News freshness healthy."
      : "News freshness unhealthy; rerun npm run news:daily and inspect source failures.",
  };
}

async function enrichNewsItems(items = [], options = {}) {
  if (!options.enableLlm || options.noLlm || process.env.NO_LLM === "1" || process.env.AI_BRIEF_OFFLINE === "1") {
    return items;
  }

  const withImages = await enrichTopImages(items, options);
  return enrichChineseFields(withImages, options);
}

async function enrichChineseFields(items = [], options = {}) {
  const targets = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.title && (!item.titleZh || !item.summaryZh));
  if (!targets.length) return items;

  const client = createDeepSeekClient({ logger: options.logger || console });
  const nextItems = items.map((item) => ({ ...item }));
  for (const batch of chunk(targets, NEWS_ENRICH_BATCH_SIZE)) {
    const payload = {
      items: batch.map(({ item, index }) => ({
        index,
        title: item.title || "",
        summary: item.summary || "",
      })),
    };
    try {
      const result = await client.chatJson({
        model: NEWS_ENRICH_MODEL,
        maxTokens: 3200,
        system: newsEnrichSystemPrompt(),
        user: JSON.stringify(payload),
      });
      const enriched = Array.isArray(result?.items) ? result.items : [];
      for (const row of enriched) {
        const index = Number(row?.index);
        if (!Number.isInteger(index) || !nextItems[index]?.title) continue;
        const titleZh = cleanText(row.titleZh);
        const summaryZh = cleanText(row.summaryZh);
        if (titleZh) nextItems[index].titleZh = titleZh;
        if (summaryZh) nextItems[index].summaryZh = nextItems[index].summary ? summaryZh : titleZh || summaryZh;
      }
    } catch (error) {
      options.logger?.warn?.(`[news] Chinese enrichment failed for ${batch.length} items: ${error.message || String(error)}`);
    }
  }
  return nextItems.map((item) => {
    if (!item.title) {
      const { summaryZh, ...rest } = item;
      return rest;
    }
    if (!item.summary && item.summaryZh && item.titleZh) {
      return { ...item, summaryZh: item.titleZh };
    }
    return item;
  });
}

async function enrichTopImages(items = [], options = {}) {
  const generatedDay = dayFromIso(options.generatedAt);
  const nextItems = items.map((item) => ({ ...item }));
  const topCandidateIndexes = new Set(nextItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => dayFromIso(item.publishedAt) === generatedDay && item.url)
    .slice(0, NEWS_IMAGE_CANDIDATE_LIMIT)
    .map(({ index }) => index));
  for (let index = 0; index < nextItems.length; index += 1) {
    if (dayFromIso(nextItems[index].publishedAt) === generatedDay && !topCandidateIndexes.has(index)) {
      delete nextItems[index].imageUrl;
    }
  }
  const candidates = [...topCandidateIndexes]
    .map((index) => ({ item: nextItems[index], index }))
    .filter(({ item }) => item?.url && !item.imageUrl);
  if (!candidates.length) return nextItems;

  await Promise.all(candidates.map(async ({ item, index }) => {
    const imageUrl = await fetchOpenGraphImage(item.url, options);
    if (imageUrl) nextItems[index].imageUrl = imageUrl;
  }));
  return nextItems;
}

async function fetchOpenGraphImage(url, options = {}) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        headers: {
          accept: "text/html,*/*;q=0.8",
          "user-agent": DEFAULT_USER_AGENT,
        },
        signal: controller.signal,
      });
      if (!response.ok) return "";
      const html = await response.text();
      const raw = firstMetaContent(html, "og:image")
        || firstMetaContent(html, "twitter:image")
        || firstMetaContent(html, "twitter:image:src");
      return normalizeAbsoluteUrl(raw, url);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    options.logger?.warn?.(`[news] og:image fetch failed: ${url} - ${error.message || String(error)}`);
    return "";
  }
}

function newsEnrichSystemPrompt() {
  return `You enrich AI news cards for a Chinese-language news column.

Return only a JSON object shaped exactly as:
{"items":[{"index":0,"titleZh":"...","summaryZh":"..."}]}

Rules:
- titleZh: translate the title into concise Simplified Chinese. Preserve proper nouns and product names such as GPT-5, Claude, DeepSeek, Qwen, Gemini, OpenAI, Anthropic.
- summaryZh: one factual Chinese sentence that explains what happened.
- Strict no fabrication: summaryZh may use only the provided title and existing summary. Do not add background, causes, implications, analysis, dates, numbers, or actors not present in the input.
- If summary is empty, faithfully restate the title in Chinese without adding facts. If the title itself is insufficient to state an event, leave summaryZh empty.
- If there is not enough source information, leave summaryZh empty.
- Never produce a non-empty summaryZh for an item with an empty title.`;
}

function firstMetaContent(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${escaped}["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>`, "i"),
    new RegExp(`<meta\\b(?=[^>]*content=["']([^"']+)["'])(?=[^>]*(?:property|name)=["']${escaped}["'])[^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(String(html || ""));
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
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

function printHealthSummary(health) {
  const marker = health.ok ? "ok" : "failed";
  console.log(`news health: ${marker} (${health.successfulSourceCount}/${health.sourceCount} sources, age ${health.ageDays ?? "n/a"} days, generated-day items ${health.totalPublishedForGeneratedDay})`);
  for (const failure of health.failures) console.warn(`news health failure: ${failure}`);
}

function healthCheck(id, label, ok, details) {
  return {
    id,
    label,
    status: ok ? "pass" : "fail",
    details,
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function countItemsForDay(items = [], generatedAt) {
  const day = new Date(generatedAt).toISOString().slice(0, 10);
  return items.filter((item) => String(item.publishedAt || "").startsWith(day)).length;
}

function chunk(items = [], size = 1) {
  const out = [];
  const chunkSize = Math.max(1, Math.floor(size));
  for (let index = 0; index < items.length; index += chunkSize) {
    out.push(items.slice(index, index + chunkSize));
  }
  return out;
}

function cleanText(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function normalizeAbsoluteUrl(value, base) {
  const raw = cleanText(value);
  if (!raw || raw.startsWith("data:") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) return "";
  try {
    return new URL(raw, base).toString();
  } catch {
    return "";
  }
}

function dayFromIso(value) {
  const parsed = Date.parse(value || "");
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
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
  --enable-llm          Optional cheap DeepSeek summaries; disabled unless NEWS_ENABLE_LLM=1 or this flag is passed.
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
