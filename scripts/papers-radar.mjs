#!/usr/bin/env node
/**
 * AI Job Research Radar
 *
 * Independent paper radar for AI engineer interview / portfolio preparation.
 * It intentionally does not connect to the existing News or Projects pipeline.
 *
 * Commands:
 *   node scripts/papers-radar.mjs discover
 *   node scripts/papers-radar.mjs triage
 *   node scripts/papers-radar.mjs review
 *   node scripts/papers-radar.mjs daily
 *   node scripts/papers-radar.mjs run
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createQualityGate,
  gateCheck,
  gateWarning,
  rememberPipelineRun,
  summarizeSelection,
} from "./lib/agentic-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "papers");
const REVIEWED_DIR = path.join(DATA_DIR, "reviewed");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const CACHE_FILE = path.join(CACHE_DIR, "radar-cache.json");
const PUBLIC_DATA_DIR = path.join(ROOT, "public", "data");
const PUBLIC_RADAR_FILE = path.join(PUBLIC_DATA_DIR, "paper-radar.json");
const UA = "ai-brief-paper-radar/0.1 (AI engineer research radar)";

const argv = process.argv.slice(2);
const command = argv[0] || "run";
const flags = argv.slice(1);

function flag(name, fallback = null) {
  const exact = flags.find((item) => item === `--${name}`);
  if (exact) return true;
  const prefixed = flags.find((item) => item.startsWith(`--${name}=`));
  if (!prefixed) return fallback;
  return prefixed.slice(name.length + 3);
}

const DATE = String(flag("date", today()));
const NO_MODEL = Boolean(flag("no-model", false));
const DRY_RUN = Boolean(flag("dry-run", false));
const FORCE_REVIEW = Boolean(flag("force", false) || flag("force-review", false));
const DISCOVER_LIMIT = Number(flag("limit", 140)) || 140;
const REVIEW_LIMIT = Number(flag("review-limit", 2)) || 2;

const MODEL_TELEMETRY = {
  calls: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  models: {},
};

const FOCUS_TOPICS = [
  {
    label: "AI Agents",
    patterns: [/\bagents?\b/i, /\bautonomous\b/i, /\bweb agent\b/i, /\bcomputer use\b/i, /\bmulti-agent\b/i, /\bagentic\b/i],
  },
  {
    label: "Tool Use",
    patterns: [/\btool[- ]?use\b/i, /\bfunction calling\b/i, /\bAPI\b/i, /\btools?\b/i, /\bworkflow\b/i],
  },
  {
    label: "AI Coding / SWE Agents",
    patterns: [/\bSWE[- ]?Bench\b/i, /\bTerminal[- ]?Bench\b/i, /\bcoding agent\b/i, /\bsoftware engineering\b/i, /\bdebugg/i, /\bcode generation\b/i, /\bprogram repair\b/i],
  },
  {
    label: "Agent Harness / Observability",
    patterns: [/\bharness\b/i, /\bharness engineering\b/i, /\bagentic harness\b/i, /\bobservability\b/i, /\btrajectory\b/i, /\bexecution trace\b/i, /\bmiddleware\b/i, /\brollback\b/i, /\bself[- ]?improv/i],
  },
  {
    label: "RAG / Knowledge Systems",
    patterns: [/\bRAG\b/i, /\bretriev/i, /\bknowledge\b/i, /\bmemory\b/i, /\blong[- ]?term\b/i, /\bGraphRAG\b/i],
  },
  {
    label: "AIGC Image/Video/Product Workflows",
    patterns: [/\bimage generation\b/i, /\bvideo generation\b/i, /\bdiffusion\b/i, /\bgenerative media\b/i, /\bcreative workflow\b/i],
  },
  {
    label: "Multimodal UI",
    patterns: [/\bmultimodal\b/i, /\bGUI\b/i, /\buser interface\b/i, /\bUI\b/i, /\bvision-language\b/i, /\bVLM\b/i],
  },
  {
    label: "Evaluation / Benchmarks",
    patterns: [/\beval/i, /\bbenchmark/i, /\bleaderboard\b/i, /\bassessment\b/i, /\breliability\b/i],
  },
  {
    label: "LLM Security / Reliability",
    patterns: [/\bsecurity\b/i, /\bsafety\b/i, /\brobust/i, /\bhallucination\b/i, /\bjailbreak\b/i, /\btrustworthy\b/i],
  },
  {
    label: "Human-AI Interaction",
    patterns: [/\bhuman[- ]?AI\b/i, /\binteraction\b/i, /\buser study\b/i, /\bUX\b/i, /\bcollaboration\b/i],
  },
];

const SOURCE_CONFIG = {
  huggingfaceDaily: { url: "https://huggingface.co/papers", limit: 45 },
  papersWithCodeTrending: { url: "https://paperswithcode.com/trending", limit: 45 },
  arxivMaxPerQuery: 18,
  openReviewVenues: [
    "ICLR.cc/2026/Conference",
    "ICML.cc/2026/Conference",
    "NeurIPS.cc/2025/Conference",
    "ICLR.cc/2025/Conference",
  ],
  aclEvents: [
    "https://aclanthology.org/events/acl-2025/",
    "https://aclanthology.org/events/emnlp-2025/",
    "https://aclanthology.org/events/naacl-2025/",
  ],
  cvfEvents: [
    "https://openaccess.thecvf.com/CVPR2025?day=all",
    "https://openaccess.thecvf.com/ICCV2025?day=all",
  ],
  companyResearchPages: [
    { source: "openai_research", company: "OpenAI", url: "https://openai.com/newsroom/research/", fallbackUrls: ["https://openai.com/sitemap.xml"] },
    { source: "anthropic_research", company: "Anthropic", url: "https://www.anthropic.com/research" },
    { source: "google_deepmind_blog", company: "Google DeepMind", url: "https://deepmind.google/discover/blog/" },
    { source: "meta_ai_blog", company: "Meta", url: "https://ai.meta.com/blog/" },
    { source: "microsoft_research_ai", company: "Microsoft", url: "https://www.microsoft.com/en-us/research/research-area/artificial-intelligence/" },
    { source: "nvidia_research", company: "NVIDIA", url: "https://research.nvidia.com/publications" },
  ],
};

const ARXIV_QUERIES = [
  {
    label: "agent harness engineering",
    maxResults: 80,
    query: 'all:"Agentic Harness Engineering" OR all:"AI Harness Engineering" OR all:"harness engineering" OR all:"agent harness" OR all:"agentic harness" OR all:"coding-agent harness" OR all:"harness safety" OR all:"HarnessAudit"',
  },
  {
    label: "terminal agents observability",
    maxResults: 45,
    query: 'all:"Terminal-Bench" OR all:"trajectory observability" OR all:"execution trace" OR all:"execution traces" OR all:"trace-based evaluation" OR all:"rollback" OR all:"self-improving coding agent" OR all:"agent skills"',
  },
  {
    label: "coding agents and SWE evals",
    maxResults: 35,
    query: 'all:"coding agent" OR all:"SWE-Bench" OR all:"Terminal-Bench" OR all:"software engineering agent" OR all:"debugging agent" OR all:"program repair agent"',
  },
  {
    label: "agents and tool use",
    maxResults: 24,
    query: 'all:"AI agent" OR all:"agentic" OR all:"tool use" OR all:"multi-agent"',
  },
  {
    label: "agent memory and RAG",
    maxResults: 24,
    query: 'all:"retrieval augmented generation" OR all:"RAG" OR all:"agent memory" OR all:"long-term memory"',
  },
  {
    label: "multimodal UI agents",
    maxResults: 18,
    query: 'all:"multimodal" AND (all:"GUI" OR all:"user interface" OR all:"vision language")',
  },
  {
    label: "eval reliability security",
    maxResults: 24,
    query: 'all:"LLM evaluation" OR all:"benchmark" OR all:"reliability" OR all:"LLM security"',
  },
  {
    label: "AIGC workflows",
    maxResults: 18,
    query: 'all:"video generation" OR all:"image generation" OR all:"AIGC workflow"',
  },
];

const CORE_JOB_RE = /\b(agentic|agent|harness|observability|trajectory|execution trace|middleware|rollback|self[- ]?improv|tool[- ]?use|function calling|coding agent|SWE[- ]?Bench|Terminal[- ]?Bench|software engineering|debugging|program repair|RAG|retrieval|memory|benchmark|evaluation|eval|security|reliability|workflow|pipeline|infrastructure|production|data preparation)\b/i;
const NARROW_VERTICAL_RE = /\b(gaming|game|interior design|3D room|virtual reality|short-video|short video|bioinformatics|medical|protein|chemistry|robotics vertical)\b/i;
const GENERIC_COMPANY_PAGE_RE = /\b(security and compliance|inside claude security|claude security|experimental tools|human-computer interaction|search & information retrieval|programming languages & software engineering|microsoft security|safety & eco|trust center)\b/i;
const AHE_STRONG_SIGNALS = [
  { label: "harness engineering", pattern: /\bharness engineering\b/i },
  { label: "agent harness", pattern: /\b(?:agent|agentic) harness(?:es)?\b/i },
  { label: "observability", pattern: /\bobservability\b/i },
  { label: "execution trace", pattern: /\bexecution traces?\b/i },
  { label: "trajectory", pattern: /\btrajector(?:y|ies)\b/i },
  { label: "rollback", pattern: /\brollback|revertible|regression[- ]?free\b/i },
  { label: "Terminal-Bench", pattern: /\bTerminal[- ]?Bench\b/i },
  { label: "self-improving coding agent", pattern: /\bself[- ]?improv(?:ing|ed)? coding agents?\b/i },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function loadEnv() {
  const envFile = path.join(ROOT, ".env.local");
  if (!existsSync(envFile)) return;
  const raw = await readFile(envFile, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}

async function ensureDirs() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(REVIEWED_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function loadCache() {
  return readJson(CACHE_FILE, { seen: {}, reviewed: {} });
}

async function saveCache(cache) {
  await writeJson(CACHE_FILE, cache);
}

async function fetchText(url, { timeoutMs = 20000, retries = 1 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/atom+xml,application/json;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(700 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startTrace(stage, meta = {}) {
  return {
    stage,
    startedAt: new Date().toISOString(),
    startedMs: Date.now(),
    ...meta,
  };
}

function finishTrace(trace, meta = {}) {
  const finishedAt = new Date().toISOString();
  const durationMs = Math.max(0, Date.now() - trace.startedMs);
  const { startedMs, ...publicTrace } = trace;
  return {
    ...publicTrace,
    ...meta,
    finishedAt,
    durationMs,
    modelUsage: modelTelemetrySnapshot(),
  };
}

function recordModelUsage(model, data) {
  const usage = data?.usage || {};
  const promptTokens = Number(usage.prompt_tokens || usage.promptTokens || 0);
  const completionTokens = Number(usage.completion_tokens || usage.completionTokens || 0);
  const totalTokens = Number(usage.total_tokens || usage.totalTokens || promptTokens + completionTokens || 0);
  MODEL_TELEMETRY.calls += 1;
  MODEL_TELEMETRY.promptTokens += promptTokens;
  MODEL_TELEMETRY.completionTokens += completionTokens;
  MODEL_TELEMETRY.totalTokens += totalTokens;
  const key = model || "unknown";
  const current = MODEL_TELEMETRY.models[key] || { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  MODEL_TELEMETRY.models[key] = {
    calls: current.calls + 1,
    promptTokens: current.promptTokens + promptTokens,
    completionTokens: current.completionTokens + completionTokens,
    totalTokens: current.totalTokens + totalTokens,
  };
}

function modelTelemetrySnapshot() {
  return {
    calls: MODEL_TELEMETRY.calls,
    promptTokens: MODEL_TELEMETRY.promptTokens,
    completionTokens: MODEL_TELEMETRY.completionTokens,
    totalTokens: MODEL_TELEMETRY.totalTokens,
    models: MODEL_TELEMETRY.models,
  };
}

function pushDiscoveryTrace(trace, input) {
  if (!Array.isArray(trace)) return;
  const sourceSignals = [...new Set((input.sourceSignals || [input.sourceName]).filter(Boolean))];
  const entry = {
    source: input.source,
    sourceName: input.sourceName,
    queryLabel: input.queryLabel || input.sourceName,
    status: input.status,
    rawCandidateCount: Number(input.rawCandidateCount || 0),
    candidateCount: Number(input.candidateCount || 0),
    requestedLimit: Number(input.requestedLimit || 0),
    sourceSignals,
    failureReason: input.failureReason || "",
    startedAt: input.startedAt || "",
    finishedAt: input.finishedAt || new Date().toISOString(),
    durationMs: Number(input.durationMs || 0),
  };
  if (input.query) entry.query = input.query;
  trace.push(entry);
}

async function runDiscoveryTrace(trace, meta, fn) {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  try {
    const result = await fn();
    const items = Array.isArray(result) ? result : result.items || [];
    pushDiscoveryTrace(trace, {
      ...meta,
      status: "ok",
      rawCandidateCount: result.rawCandidateCount === undefined ? items.length : result.rawCandidateCount,
      candidateCount: items.length,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
    });
    return items;
  } catch (error) {
    pushDiscoveryTrace(trace, {
      ...meta,
      status: "failed",
      rawCandidateCount: 0,
      candidateCount: 0,
      failureReason: error.message || String(error),
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
    });
    console.warn(`[discover] ${meta.sourceName} failed${meta.queryLabel ? ` (${meta.queryLabel})` : ""}: ${error.message}`);
    return [];
  }
}

function decodeEntities(text = "") {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function isAllowedCompanyResearchUrl(company, url) {
  if (company === "Microsoft") return /\/research\/publication\//i.test(url);
  if (company === "NVIDIA") return /\/publication\/20\d{2}/i.test(url);
  if (company === "Anthropic") return /anthropic\.com\/research\/[^/?#]+/i.test(url);
  if (company === "Google DeepMind") return /deepmind\.google\/discover\/blog\/[^/?#]+/i.test(url);
  if (company === "Meta") return /ai\.meta\.com\/blog\/[^/?#]+/i.test(url);
  if (company === "OpenAI") return /openai\.com\/(index|newsroom\/research)\//i.test(url);
  return /\/research\/publication\/|\/research\/[^/?#]+|\/blog\/[^/?#]+|\/publications?\/[^/?#]+/i.test(url);
}

function stripTags(text = "") {
  return decodeEntities(text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function cleanTitle(title) {
  return stripTags(title).replace(/\s+/g, " ").trim();
}

function hasMojibake(text = "") {
  return /Ã|Â|â€|â€œ|â€|ï¼|ã€|å[^\sA-Za-z]*|æ[^\sA-Za-z]*|ç[^\sA-Za-z]*|è[^\sA-Za-z]*|ä[^\sA-Za-z]*/.test(String(text));
}

function cleanReviewText(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || hasMojibake(text)) return fallback;
  return text;
}

function firstCleanReviewArrayValue(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const found = value.map((item) => String(item || "").trim()).find((item) => item && !hasMojibake(item));
  return found || fallback;
}

function hash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function normalizeArxivId(value = "") {
  const match = String(value).match(/(\d{4}\.\d{4,5})(v\d+)?/);
  return match ? `${match[1]}${match[2] || ""}` : null;
}

function baseArxivId(value = "") {
  const id = normalizeArxivId(value);
  return id ? id.replace(/v\d+$/, "") : null;
}

function paperKey(candidate) {
  const arxivId = baseArxivId(candidate.arxivId || candidate.paperUrl || candidate.sourceUrl || "");
  if (arxivId) return `arxiv:${arxivId}`;
  if (candidate.doi) return `doi:${String(candidate.doi).toLowerCase()}`;
  if (candidate.sourceUrl) return `url:${candidate.sourceUrl.toLowerCase().replace(/[?#].*$/, "")}`;
  return `title:${cleanTitle(candidate.title).toLowerCase()}`;
}

function candidateId(candidate) {
  const key = paperKey(candidate);
  return key.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 80) || `paper-${hash(candidate.title)}`;
}

function makeCandidate(input) {
  const title = cleanTitle(input.title);
  const arxivId = normalizeArxivId(input.arxivId || input.paperUrl || input.sourceUrl || "");
  const sourceUrl = input.sourceUrl || input.paperUrl || "";
  return {
    id: input.id || "",
    key: "",
    title,
    authors: input.authors || [],
    abstract: input.abstract || "",
    source: input.source,
    sourceName: input.sourceName || input.source,
    sourceUrl,
    paperUrl: input.paperUrl || (arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : sourceUrl),
    pdfUrl: input.pdfUrl || "",
    arxivId: arxivId || "",
    venue: input.venue || "",
    publishedAt: input.publishedAt || "",
    updatedAt: input.updatedAt || input.publishedAt || "",
    discoveredAt: new Date().toISOString(),
    version: input.version || arxivId || input.updatedAt || input.publishedAt || "unknown",
    codeUrl: input.codeUrl || "",
    tags: input.tags || [],
    sourceSignals: input.sourceSignals || [],
  };
}

function finalizeCandidate(input) {
  const candidate = makeCandidate(input);
  candidate.key = paperKey(candidate);
  candidate.id = candidateId(candidate);
  candidate.focusTopics = detectTopics(candidate).map((topic) => topic.label);
  return candidate;
}

function detectTopics(candidate) {
  const text = `${candidate.title}\n${candidate.abstract}\n${candidate.tags.join(" ")}\n${candidate.venue}`.toLowerCase();
  return FOCUS_TOPICS.filter((topic) => topic.patterns.some((pattern) => pattern.test(text)));
}

function detectAheSignals(candidate) {
  const text = `${candidate.title}\n${candidate.abstract || ""}\n${candidate.tags?.join(" ") || ""}\n${candidate.venue || ""}\n${candidate.sourceSignals?.join(" ") || ""}`;
  return AHE_STRONG_SIGNALS.filter((signal) => signal.pattern.test(text)).map((signal) => signal.label);
}

function isAheLikeCandidate(candidate) {
  const text = `${candidate.title}\n${candidate.abstract || ""}\n${candidate.sourceSignals?.join(" ") || ""}`;
  return detectAheSignals(candidate).length > 0 || /\b(AHE|HarnessAudit|harness|observability|execution traces?|trajectory|rollback|Terminal[- ]?Bench|self[- ]?improv)\b/i.test(text);
}

function focusMatches(candidate) {
  return detectTopics(candidate).length > 0;
}

function parseHfStylePapers(html, source, sourceName, baseUrl, limit) {
  const out = [];
  const seen = new Set();
  const anchorRe = /href="(\/papers\/([^"?#]+))"[^>]*>([\s\S]{0,500}?)<\/a>/g;
  let match;
  while ((match = anchorRe.exec(html)) && out.length < limit) {
    const arxivId = normalizeArxivId(match[2]);
    const title = cleanTitle(match[3]);
    if (!arxivId || title.length < 8 || title.toLowerCase() === "view paper") continue;
    const key = `${arxivId}:${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finalizeCandidate({
      title,
      arxivId,
      source,
      sourceName,
      sourceUrl: absoluteUrl(baseUrl, match[1]),
      paperUrl: `https://arxiv.org/abs/${baseArxivId(arxivId)}`,
      sourceSignals: [sourceName],
    }));
  }
  return out;
}

async function discoverHuggingFaceDaily() {
  const html = await fetchText(SOURCE_CONFIG.huggingfaceDaily.url, { retries: 1 });
  return parseHfStylePapers(html, "huggingface_daily", "Hugging Face Daily Papers", SOURCE_CONFIG.huggingfaceDaily.url, SOURCE_CONFIG.huggingfaceDaily.limit);
}

async function discoverPapersWithCodeTrending() {
  const html = await fetchText(SOURCE_CONFIG.papersWithCodeTrending.url, { retries: 1 });
  return parseHfStylePapers(html, "papers_with_code_trending", "Papers with Code trending", SOURCE_CONFIG.papersWithCodeTrending.url, SOURCE_CONFIG.papersWithCodeTrending.limit);
}

function getTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1].replace(/<!\[CDATA\[|\]\]>/g, "")).trim() : "";
}

function parseAtomEntries(xml, source, sourceName) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
  return entries.map((entry) => {
    const id = getTag(entry, "id");
    const title = cleanTitle(getTag(entry, "title"));
    const abstract = stripTags(getTag(entry, "summary"));
    const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g)].map((m) => decodeEntities(m[1]).trim()).filter(Boolean);
    const publishedAt = getTag(entry, "published");
    const updatedAt = getTag(entry, "updated");
    const arxivId = normalizeArxivId(id);
    const pdfMatch = entry.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/i);
    const categories = [...entry.matchAll(/<category[^>]+term="([^"]+)"/g)].map((m) => m[1]);
    return finalizeCandidate({
      title,
      authors,
      abstract,
      arxivId,
      source,
      sourceName,
      sourceUrl: arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : id,
      paperUrl: arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : id,
      pdfUrl: pdfMatch ? pdfMatch[1] : "",
      publishedAt,
      updatedAt,
      tags: categories,
      sourceSignals: [sourceName],
    });
  }).filter((candidate) => candidate.title);
}

async function fetchArxivQuery(query, maxResults, label = "filtered search") {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${maxResults}`;
  const xml = await fetchText(url, { retries: 2, timeoutMs: 30000 });
  const parsed = parseAtomEntries(xml, "arxiv_filtered", `arXiv ${label}`).map((candidate) => finalizeCandidate({
    ...candidate,
    sourceSignals: [...new Set([...(candidate.sourceSignals || []), `arXiv query:${label}`])],
  }));
  return {
    rawCandidateCount: parsed.length,
    items: parsed.filter(focusMatches),
  };
}

async function discoverArxivFiltered(trace = []) {
  const all = [];
  for (const item of ARXIV_QUERIES) {
    const query = typeof item === "string" ? item : item.query;
    const label = typeof item === "string" ? "filtered search" : item.label;
    const maxResults = typeof item === "string" ? SOURCE_CONFIG.arxivMaxPerQuery : (item.maxResults || SOURCE_CONFIG.arxivMaxPerQuery);
    all.push(...await runDiscoveryTrace(trace, {
      source: "arxiv_filtered",
      sourceName: "arXiv filtered search",
      queryLabel: label,
      query,
      requestedLimit: maxResults,
      sourceSignals: ["arXiv", `arXiv query:${label}`],
    }, () => fetchArxivQuery(query, maxResults, label)));
    await sleep(1300);
  }
  return all;
}

async function enrichArxivCandidates(candidates) {
  const ids = [...new Set(candidates.map((item) => baseArxivId(item.arxivId)).filter(Boolean))];
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 35) {
    const chunk = ids.slice(i, i + 35);
    if (chunk.length === 0) continue;
    try {
      const url = `https://export.arxiv.org/api/query?id_list=${chunk.join(",")}`;
      const xml = await fetchText(url, { retries: 2, timeoutMs: 30000 });
      for (const item of parseAtomEntries(xml, "arxiv_metadata", "arXiv metadata")) {
        byId.set(baseArxivId(item.arxivId), item);
      }
      await sleep(1300);
    } catch (error) {
      console.warn(`[discover] arXiv metadata failed: ${error.message}`);
    }
  }
  return candidates.map((candidate) => {
    const arxivId = baseArxivId(candidate.arxivId);
    const meta = arxivId ? byId.get(arxivId) : null;
    if (!meta) return candidate;
    return finalizeCandidate({
      ...candidate,
      authors: candidate.authors.length ? candidate.authors : meta.authors,
      abstract: candidate.abstract || meta.abstract,
      publishedAt: candidate.publishedAt || meta.publishedAt,
      updatedAt: candidate.updatedAt || meta.updatedAt,
      pdfUrl: candidate.pdfUrl || meta.pdfUrl,
      tags: [...new Set([...(candidate.tags || []), ...(meta.tags || [])])],
      sourceSignals: [...new Set([...(candidate.sourceSignals || []), "arXiv metadata"])],
    });
  });
}

function openReviewValue(value) {
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value;
}

async function discoverOpenReview(trace = []) {
  const all = [];
  for (const venue of SOURCE_CONFIG.openReviewVenues) {
    const url = `https://api2.openreview.net/notes?content.venueid=${encodeURIComponent(venue)}&limit=50`;
    const items = await runDiscoveryTrace(trace, {
      source: "openreview_selected_venues",
      sourceName: "OpenReview selected venues",
      queryLabel: venue,
      query: venue,
      requestedLimit: 50,
      sourceSignals: ["OpenReview", venue],
    }, async () => {
      const json = JSON.parse(await fetchText(url, { retries: 1 }));
      const venueCandidates = [];
      for (const note of json.notes || []) {
        const content = note.content || {};
        const title = cleanTitle(openReviewValue(content.title) || "");
        if (!title) continue;
        const abstract = stripTags(openReviewValue(content.abstract) || "");
        const authors = openReviewValue(content.authors) || [];
        const venueText = openReviewValue(content.venue) || venue;
        const candidate = finalizeCandidate({
          title,
          authors: Array.isArray(authors) ? authors : [],
          abstract,
          source: "openreview_selected_venues",
          sourceName: "OpenReview selected venues",
          sourceUrl: `https://openreview.net/forum?id=${note.id || note.forum}`,
          venue: venueText,
          publishedAt: note.cdate ? new Date(note.cdate).toISOString() : "",
          updatedAt: note.mdate ? new Date(note.mdate).toISOString() : "",
          version: note.id || note.forum || "",
          sourceSignals: ["OpenReview", venue],
        });
        if (focusMatches(candidate)) venueCandidates.push(candidate);
      }
      return { rawCandidateCount: Array.isArray(json.notes) ? json.notes.length : venueCandidates.length, items: venueCandidates };
    });
    all.push(...items);
  }
  return all;
}

async function discoverAclAnthology(trace = []) {
  const all = [];
  const paperRe = /href=(\/20\d{2}\.[^/\s>]+?\.\d+\/)[^>]*>([^<]{12,260})<\/a>/g;
  for (const url of SOURCE_CONFIG.aclEvents) {
    const items = await runDiscoveryTrace(trace, {
      source: "acl_anthology",
      sourceName: "ACL Anthology",
      queryLabel: url.split("/").filter(Boolean).pop() || "acl-event",
      query: url,
      requestedLimit: 60,
      sourceSignals: ["ACL Anthology"],
    }, async () => {
      const html = await fetchText(url, { timeoutMs: 30000, retries: 1 });
      let match;
      let rawCandidateCount = 0;
      const eventCandidates = [];
      while ((match = paperRe.exec(html))) {
        const title = cleanTitle(match[2]);
        if (!title || /^Proceedings of/i.test(title)) continue;
        rawCandidateCount += 1;
        const candidate = finalizeCandidate({
          title,
          source: "acl_anthology",
          sourceName: "ACL Anthology",
          sourceUrl: absoluteUrl(url, match[1]),
          paperUrl: absoluteUrl(url, match[1]),
          venue: "ACL Anthology",
          sourceSignals: ["ACL Anthology"],
        });
        if (focusMatches(candidate)) eventCandidates.push(candidate);
      }
      return { rawCandidateCount, items: eventCandidates };
    });
    all.push(...items);
  }
  return all.slice(0, 60);
}

async function discoverCvfOpenAccess(trace = []) {
  const all = [];
  const paperRe = /<dt class="ptitle">([\s\S]*?)<\/dt>/g;
  const linkRe = /<a href="([^"]+)">([\s\S]*?)<\/a>/i;
  for (const url of SOURCE_CONFIG.cvfEvents) {
    const items = await runDiscoveryTrace(trace, {
      source: "cvf_open_access",
      sourceName: "CVF Open Access",
      queryLabel: url.includes("ICCV") ? "ICCV 2025" : "CVPR 2025",
      query: url,
      requestedLimit: 60,
      sourceSignals: ["CVF Open Access"],
    }, async () => {
      const html = await fetchText(url, { timeoutMs: 30000, retries: 1 });
      let match;
      let rawCandidateCount = 0;
      const eventCandidates = [];
      while ((match = paperRe.exec(html))) {
        const link = match[1].match(linkRe);
        if (!link) continue;
        const title = cleanTitle(link[2]);
        rawCandidateCount += 1;
        const candidate = finalizeCandidate({
          title,
          source: "cvf_open_access",
          sourceName: "CVF Open Access",
          sourceUrl: absoluteUrl(url, link[1]),
          paperUrl: absoluteUrl(url, link[1]),
          venue: url.includes("ICCV") ? "ICCV 2025" : "CVPR 2025",
          sourceSignals: ["CVF Open Access"],
        });
        if (focusMatches(candidate)) eventCandidates.push(candidate);
      }
      return { rawCandidateCount, items: eventCandidates };
    });
    all.push(...items);
  }
  return all.slice(0, 60);
}

function extractGenericLinks(html, baseUrl, source, sourceName, company) {
  const out = [];
  const seen = new Set();
  const linkRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]{0,500}?)<\/a>/gi;
  let match;
  while ((match = linkRe.exec(html)) && out.length < 35) {
    const href = match[1];
    const title = cleanTitle(match[2]);
    if (!title || title.length < 12 || title.length > 180) continue;
    const url = absoluteUrl(baseUrl, href);
    if (GENERIC_COMPANY_PAGE_RE.test(title)) continue;
    if (!isAllowedCompanyResearchUrl(company, url)) continue;
    if (!CORE_JOB_RE.test(title)) continue;
    const key = `${title.toLowerCase()}:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const candidate = finalizeCandidate({
      title,
      source,
      sourceName,
      sourceUrl: url,
      paperUrl: url,
      venue: `${company} research blog`,
      sourceSignals: [company, "company research blog"],
    });
    if (focusMatches(candidate)) out.push(candidate);
  }
  return out;
}

function titleFromResearchUrl(url, company) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || parts[parts.length - 2] || company;
    return decodeEntities(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return company;
  }
}

function extractSitemapResearchLinks(xml, source, sourceName, company) {
  const out = [];
  const seen = new Set();
  const locRe = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = locRe.exec(xml)) && out.length < 35) {
    const url = decodeEntities(match[1]).trim();
    if (!url || seen.has(url)) continue;
    if (!isAllowedCompanyResearchUrl(company, url)) continue;
    const title = titleFromResearchUrl(url, company);
    if (!CORE_JOB_RE.test(`${title} ${url}`)) continue;
    seen.add(url);
    const candidate = finalizeCandidate({
      title,
      source,
      sourceName,
      sourceUrl: url,
      paperUrl: url,
      venue: `${company} research blog`,
      sourceSignals: [company, "company research blog", "sitemap fallback"],
    });
    if (focusMatches(candidate)) out.push(candidate);
  }
  return out;
}

async function discoverCompanyResearchBlogs(trace = []) {
  const all = [];
  for (const page of SOURCE_CONFIG.companyResearchPages) {
    const items = await runDiscoveryTrace(trace, {
      source: page.source,
      sourceName: `${page.company} research blog`,
      queryLabel: page.company,
      query: page.url,
      requestedLimit: 35,
      sourceSignals: [page.company, "company research blog"],
    }, async () => {
      const html = await fetchText(page.url, { retries: 1 });
      const items = extractGenericLinks(html, page.url, page.source, `${page.company} research blog`, page.company);
      return { rawCandidateCount: items.length, items };
    });
    all.push(...items);
    for (const fallbackUrl of page.fallbackUrls || []) {
      const fallbackItems = await runDiscoveryTrace(trace, {
        source: page.source,
        sourceName: `${page.company} research sitemap fallback`,
        queryLabel: `${page.company} sitemap fallback`,
        query: fallbackUrl,
        requestedLimit: 35,
        sourceSignals: [page.company, "company research blog", "sitemap fallback"],
      }, async () => {
        const xml = await fetchText(fallbackUrl, { retries: 1 });
        const items = extractSitemapResearchLinks(xml, page.source, `${page.company} research sitemap fallback`, page.company);
        return { rawCandidateCount: items.length, items };
      });
      all.push(...fallbackItems);
    }
  }
  return all;
}

function mergeCandidates(candidates) {
  const map = new Map();
  for (const candidate of candidates) {
    if (!candidate.title) continue;
    const existing = map.get(candidate.key);
    if (!existing) {
      map.set(candidate.key, candidate);
      continue;
    }
    map.set(candidate.key, finalizeCandidate({
      ...existing,
      authors: existing.authors?.length ? existing.authors : candidate.authors,
      abstract: existing.abstract && existing.abstract.length >= candidate.abstract.length ? existing.abstract : candidate.abstract,
      source: existing.source,
      sourceName: existing.sourceName,
      sourceUrl: existing.sourceUrl,
      paperUrl: existing.paperUrl || candidate.paperUrl,
      pdfUrl: existing.pdfUrl || candidate.pdfUrl,
      arxivId: existing.arxivId || candidate.arxivId,
      venue: existing.venue || candidate.venue,
      publishedAt: earliestDate(existing.publishedAt, candidate.publishedAt),
      updatedAt: latestDate(existing.updatedAt, candidate.updatedAt),
      version: latestDate(existing.updatedAt, candidate.updatedAt) || existing.version || candidate.version,
      codeUrl: existing.codeUrl || candidate.codeUrl,
      tags: [...new Set([...(existing.tags || []), ...(candidate.tags || [])])],
      sourceSignals: [...new Set([...(existing.sourceSignals || []), ...(candidate.sourceSignals || []), candidate.sourceName])],
    }));
  }
  return [...map.values()];
}

function earliestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

function latestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function ageDays(candidate) {
  const date = Date.parse(candidate.updatedAt || candidate.publishedAt || candidate.discoveredAt);
  if (!Number.isFinite(date)) return 90;
  return Math.max(0, (Date.now() - date) / 86400000);
}

function countMatches(text, patterns) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function deterministicScores(candidate) {
  const text = `${candidate.title}\n${candidate.abstract}\n${candidate.venue}\n${candidate.tags.join(" ")}`;
  const isCoreJob = CORE_JOB_RE.test(text);
  const isNarrowVertical = NARROW_VERTICAL_RE.test(text);
  const topics = detectTopics(candidate);
  const topicCount = topics.length;
  const sourceBoost = sourceQuality(candidate);
  const recencyBoost = ageDays(candidate) <= 14 ? 12 : ageDays(candidate) <= 60 ? 8 : ageDays(candidate) <= 180 ? 4 : 0;
  const hasAbstract = candidate.abstract.length > 120 ? 8 : 0;
  const hasCode = /code|github|implementation/i.test(`${candidate.abstract} ${candidate.sourceUrl} ${candidate.codeUrl}`) ? 8 : 0;
  const benchmarkHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "Evaluation / Benchmarks").patterns);
  const codingHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "AI Coding / SWE Agents").patterns);
  const agentHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "AI Agents").patterns);
  const harnessHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "Agent Harness / Observability").patterns);
  const aheSignalCount = detectAheSignals(candidate).length;
  const ragHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "RAG / Knowledge Systems").patterns);
  const multimodalHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "Multimodal UI").patterns);
  const securityHits = countMatches(text, FOCUS_TOPICS.find((t) => t.label === "LLM Security / Reliability").patterns);
  const designWords = countMatches(text, [/\barchitecture\b/i, /\bsystem\b/i, /\bpipeline\b/i, /\bframework\b/i, /\binfrastructure\b/i, /\bworkflow\b/i, /\bmemory\b/i, /\btool\b/i, /\bharness\b/i, /\bobservability\b/i, /\btrajectory\b/i, /\bmiddleware\b/i, /\bcomponent\b/i]);
  const evalWords = countMatches(text, [/\bbenchmark\b/i, /\bevaluation\b/i, /\bdataset\b/i, /\bmetric\b/i, /\bSWE-Bench\b/i, /\bTerminal-Bench\b/i, /\bpass@1\b/i, /\bablation\b/i, /\btransfer\b/i]);
  const productWords = countMatches(text, [/\bdeploy\b/i, /\bproduction\b/i, /\bworkflow\b/i, /\btool\b/i, /\binterface\b/i, /\buser\b/i, /\bopen-source\b/i, /\bgithub\b/i, /\bobservability\b/i, /\brollback\b/i, /\bexecution\b/i]);
  const noveltyWords = countMatches(text, [/\bnew\b/i, /\bnovel\b/i, /\bfirst\b/i, /\bchallenge\b/i, /\bbenchmark\b/i, /\bframework\b/i, /\bstate-of-the-art\b/i, /\bself[- ]?improv/i, /\bautomatic evolution\b/i, /\bharness engineering\b/i]);

  const coreBoost = isCoreJob ? 8 : -8;
  const verticalPenalty = isNarrowVertical ? 10 : 0;
  const stalePenalty = ageDays(candidate) > 365 ? 18 : ageDays(candidate) > 180 ? 8 : 0;

  return {
    role_relevance: clamp(18 + topicCount * 10 + agentHits * 8 + codingHits * 10 + harnessHits * 12 + aheSignalCount * 9 + ragHits * 7 + multimodalHits * 5 + securityHits * 5 + sourceBoost * 0.2 + coreBoost - verticalPenalty - stalePenalty),
    architecture_value: clamp(18 + designWords * 10 + agentHits * 8 + harnessHits * 12 + aheSignalCount * 11 + ragHits * 6 + hasAbstract + sourceBoost * 0.2 + coreBoost - verticalPenalty * 0.5 - stalePenalty),
    practicality: clamp(15 + productWords * 9 + hasCode + codingHits * 8 + harnessHits * 10 + aheSignalCount * 7 + recencyBoost + sourceBoost * 0.15 + coreBoost - verticalPenalty - stalePenalty),
    novelty: clamp(18 + noveltyWords * 8 + harnessHits * 5 + aheSignalCount * 6 + recencyBoost + sourceBoost * 0.25 - verticalPenalty * 0.4 - stalePenalty),
    evaluation_quality: clamp(12 + evalWords * 12 + benchmarkHits * 10 + harnessHits * 4 + aheSignalCount * 4 + sourceBoost * 0.25 + (benchmarkHits ? 4 : 0) - stalePenalty * 0.4),
    interview_value: clamp(20 + codingHits * 10 + agentHits * 8 + harnessHits * 12 + aheSignalCount * 9 + benchmarkHits * 8 + ragHits * 6 + sourceBoost * 0.25 + coreBoost - verticalPenalty - stalePenalty),
    build_potential: clamp(15 + productWords * 8 + designWords * 6 + hasCode + agentHits * 7 + codingHits * 8 + harnessHits * 12 + aheSignalCount * 8 + ragHits * 5 + coreBoost - verticalPenalty - stalePenalty),
  };
}

function sourceQuality(candidate) {
  const sourceText = `${candidate.source} ${candidate.sourceName} ${candidate.sourceSignals.join(" ")} ${candidate.venue}`;
  let score = 0;
  if (/OpenReview|ICLR|ICML|NeurIPS/i.test(sourceText)) score += 24;
  if (/ACL Anthology|CVF|CVPR|ICCV|EMNLP|NAACL/i.test(sourceText)) score += 18;
  if (/OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA/i.test(sourceText)) score += 22;
  if (/Hugging Face|Papers with Code/i.test(sourceText)) score += 12;
  if (/arXiv/i.test(sourceText)) score += 8;
  return Math.min(score, 35);
}

function weightedTotal(scores) {
  return clamp(
    scores.role_relevance * 0.22 +
    scores.architecture_value * 0.18 +
    scores.practicality * 0.14 +
    scores.novelty * 0.12 +
    scores.evaluation_quality * 0.12 +
    scores.interview_value * 0.14 +
    scores.build_potential * 0.08
  );
}

function decisionFor(total, scores) {
  if (total >= 84 && scores.architecture_value >= 65 && scores.interview_value >= 70) return "deep_dive";
  if (total >= 74) return "review";
  if (total >= 64) return "read";
  if (total >= 46) return "skim";
  return "ignore";
}

function primaryTopicBucket(item) {
  const topics = item.triage?.matched_topics || item.focusTopics || [];
  const order = [
    "Agent Harness / Observability",
    "AI Coding / SWE Agents",
    "Evaluation / Benchmarks",
    "RAG / Knowledge Systems",
    "AI Agents",
    "Tool Use",
    "Multimodal UI",
    "AIGC Image/Video/Product Workflows",
    "LLM Security / Reliability",
    "Human-AI Interaction",
  ];
  return order.find((topic) => topics.includes(topic)) || "other";
}

function selectDiverseTop(items, limit) {
  const caps = new Map([
    ["Agent Harness / Observability", 6],
    ["AI Coding / SWE Agents", 4],
    ["Evaluation / Benchmarks", 4],
    ["RAG / Knowledge Systems", 3],
    ["AIGC Image/Video/Product Workflows", 2],
  ]);
  const selected = [];
  const deferred = [];
  const counts = new Map();
  for (const item of items) {
    const bucket = primaryTopicBucket(item);
    const cap = caps.get(bucket) || 3;
    const count = counts.get(bucket) || 0;
    if (selected.length < limit && count < cap) {
      selected.push(item);
      counts.set(bucket, count + 1);
    } else {
      deferred.push(item);
    }
  }
  for (const item of deferred) {
    if (selected.length >= limit) break;
    selected.push(item);
  }
  return selected;
}

function deterministicTriage(candidate) {
  const scores = deterministicScores(candidate);
  const total = weightedTotal(scores);
  const days = ageDays(candidate);
  const freshnessSignal = days <= 14 ? "new" : days <= 90 ? "recent" : "archive";
  const hotnessSignal = /Hugging Face|Papers with Code|OpenReview|OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA/i.test(`${candidate.sourceName} ${candidate.sourceSignals.join(" ")}`) ? "high_signal_source" : "standard_source";
  const matchedTopics = detectTopics(candidate).map((topic) => topic.label);
  const matchedAheSignals = detectAheSignals(candidate);
  const deterministicReason = reasonFor(candidate, scores, total);
  return {
    ...scores,
    total_score: total,
    decision: decisionFor(total, scores),
    matched_topics: matchedTopics,
    matched_ahe_signals: matchedAheSignals,
    source_quality: sourceQuality(candidate),
    freshness_signal: freshnessSignal,
    freshness_days: Math.round(days * 10) / 10,
    freshness_reason: `${freshnessSignal}: updated ${Math.round(days * 10) / 10} days ago`,
    hotness_signal: hotnessSignal,
    hotness_reason: hotnessSignal === "high_signal_source" ? "matched high-signal source or venue" : "standard source without external trend boost",
    deterministic_reason: deterministicReason,
    reason: deterministicReason,
  };
}

function discoveryPriorityScore(candidate) {
  const triage = deterministicTriage(candidate);
  const text = `${candidate.title}\n${candidate.abstract || ""}`;
  const freshness = ageDays(candidate) <= 21 ? 10 : ageDays(candidate) <= 90 ? 6 : ageDays(candidate) <= 180 ? 2 : -8;
  const emergingConcept = detectAheSignals(candidate).length * 5 + (/\b(harness|observability|trajectory|Terminal[- ]?Bench|self[- ]?improv|middleware|rollback)\b/i.test(text) ? 8 : 0);
  const stalePenalty = ageDays(candidate) > 365 ? 18 : ageDays(candidate) > 180 ? 8 : 0;
  return triage.total_score + sourceQuality(candidate) * 0.35 + freshness + emergingConcept - stalePenalty;
}

function reasonFor(candidate, scores, total) {
  const topics = detectTopics(candidate).map((topic) => topic.label).slice(0, 3).join(", ") || "weak focus match";
  const strengths = Object.entries(scores).filter(([key, value]) => key !== "source_quality" && value >= 70).map(([key]) => key).slice(0, 3).join(", ");
  const aheSignals = detectAheSignals(candidate).join(", ");
  const aheReason = aheSignals ? ` AHE signals: ${aheSignals}.` : "";
  return `${topics}; total ${total}; strongest signals: ${strengths || "none"}.${aheReason}`;
}

function dailyPriorityScore(item) {
  if (!item?.triage) return 0;
  const text = `${item.title}\n${item.abstract || ""}`;
  const core = CORE_JOB_RE.test(text) ? 8 : -8;
  const vertical = NARROW_VERTICAL_RE.test(text) ? 14 : 0;
  const stale = ageDays(item) > 365 ? 16 : ageDays(item) > 180 ? 7 : 0;
  const decisionBoost = item.triage.decision === "deep_dive" ? 10 : item.triage.decision === "review" ? 7 : item.triage.decision === "implement" ? 6 : item.triage.decision === "read" ? 3 : 0;
  const sourceBoost = /Papers with Code|OpenReview|Microsoft|OpenAI|Anthropic|DeepMind|Meta|NVIDIA/i.test(`${item.sourceName} ${item.sourceSignals?.join(" ")}`) ? 4 : 0;
  const harnessBoost = /\b(harness|observability|trajectory|Terminal[- ]?Bench|self[- ]?improv|middleware|rollback)\b/i.test(text) ? 8 : 0;
  return (
    item.triage.total_score * 0.35 +
    item.triage.architecture_value * 0.18 +
    item.triage.interview_value * 0.18 +
    item.triage.build_potential * 0.16 +
    item.triage.practicality * 0.08 +
    decisionBoost +
    sourceBoost +
    harnessBoost +
    core -
    vertical -
    stale
  );
}

function describeSelectionSignals(item) {
  const topics = item.triage?.matched_topics?.slice(0, 3).join(", ") || "no strong topic match";
  const ahe = item.triage?.matched_ahe_signals?.length ? `; AHE signals: ${item.triage.matched_ahe_signals.join(", ")}` : "";
  return `${topics}${ahe}; freshness=${item.triage?.freshness_signal}; hotness=${item.triage?.hotness_signal}; score=${item.triage?.total_score}`;
}

function withSelectionExplanation(item, { rank, selectedRank, selected, cutoffScore }) {
  const selectionStatus = selected ? "selected" : item.triage.decision === "ignore" ? "rejected" : "below_top_cutoff";
  const selectedReason = selected
    ? `Selected as top ${selectedRank} after score and diversity ranking: ${describeSelectionSignals(item)}.`
    : "";
  const rejectionReason = selected
    ? ""
    : selectionStatus === "rejected"
      ? `Rejected because decision is ignore: ${describeSelectionSignals(item)}; deterministic reason: ${item.triage.deterministic_reason}`
      : `Not selected because top 10 was filled by higher-priority or diversity-balanced papers; rank=${rank}, cutoffScore=${cutoffScore === null || cutoffScore === undefined ? "n/a" : cutoffScore}; ${describeSelectionSignals(item)}.`;
  return {
    ...item,
    triage: {
      ...item.triage,
      rank,
      selected_rank: selected ? selectedRank : null,
      selection_status: selectionStatus,
      selected_reason: selectedReason,
      rejection_reason: rejectionReason,
    },
  };
}

async function cheapModelTriage(candidates) {
  if (NO_MODEL || !process.env.DEEPSEEK_API_KEY || candidates.length === 0) return new Map();
  const payload = candidates.slice(0, 24).map((item) => ({
    id: item.id,
    title: item.title,
    abstract: item.abstract.slice(0, 900),
    source: item.sourceName,
    venue: item.venue,
    deterministic: item.triage,
  }));
  const system = "You are a cheap triage model for an AI engineer research radar. Score papers conservatively. Return strict JSON only.";
  const user = `For each paper, return {"items":[{"id","model_adjustment":-10..10,"decision_override":null|"ignore"|"skim"|"read"|"review"|"deep_dive","reason":"short"}]}.\nFocus on AI engineer interview and portfolio value: agents, tool use, AI coding/SWE agents, RAG/knowledge systems, AIGC product workflows, multimodal UI, eval/benchmarks, LLM security/reliability, human-AI interaction.\n\nPapers:\n${JSON.stringify(payload)}`;
  try {
    const parsed = await chatJson({ system, user, model: process.env.PAPERS_TRIAGE_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", maxTokens: 2600, temperature: 0.2 });
    const map = new Map();
    for (const item of parsed.items || []) {
      map.set(item.id, {
        model_adjustment: Math.max(-10, Math.min(10, Number(item.model_adjustment) || 0)),
        decision_override: item.decision_override || null,
        reason: String(item.reason || "").slice(0, 240),
      });
    }
    return map;
  } catch (error) {
    console.warn(`[triage] cheap model skipped: ${error.message}`);
    return new Map();
  }
}

async function chat({ system, user, model, maxTokens = 4000, jsonMode = false, temperature = 0.3 }) {
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = await res.json();
  recordModelUsage(model, data);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty model response");
  return content;
}

function parseJson(raw) {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(text);
}

async function chatJson({ system, user, model, maxTokens = 4000, temperature = 0.3 }) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const strictSystem = attempt === 0
      ? system
      : `${system}\n\n上一轮输出不是合法 JSON。现在只重新输出一个完整 JSON object：不要 markdown，不要注释，不要尾随逗号，字符串内部的英文双引号必须转义。`;
    const strictUser = attempt === 0
      ? user
      : `${user}\n\n上一次 JSON 解析错误：${lastError?.message || "unknown"}。请重新生成完整、可被 JSON.parse 直接解析的 JSON。`;
    const raw = await chat({ system: strictSystem, user: strictUser, model, maxTokens, jsonMode: true, temperature });
    try {
      return parseJson(raw);
    } catch (error) {
      lastError = error;
      console.warn(`[json] parse retry ${attempt + 1}/2: ${error.message}`);
    }
  }
  throw lastError;
}

async function discover() {
  await ensureDirs();
  const stageTrace = startTrace("discover");
  const cache = await loadCache();
  const batches = [];
  const discoveryTrace = [];
  const adapters = [
    {
      name: "Hugging Face Daily Papers",
      run: () => runDiscoveryTrace(discoveryTrace, {
        source: "huggingface_daily",
        sourceName: "Hugging Face Daily Papers",
        queryLabel: "daily papers",
        query: SOURCE_CONFIG.huggingfaceDaily.url,
        requestedLimit: SOURCE_CONFIG.huggingfaceDaily.limit,
        sourceSignals: ["Hugging Face Daily Papers"],
      }, discoverHuggingFaceDaily),
    },
    {
      name: "Papers with Code trending",
      run: () => runDiscoveryTrace(discoveryTrace, {
        source: "papers_with_code_trending",
        sourceName: "Papers with Code trending",
        queryLabel: "trending",
        query: SOURCE_CONFIG.papersWithCodeTrending.url,
        requestedLimit: SOURCE_CONFIG.papersWithCodeTrending.limit,
        sourceSignals: ["Papers with Code trending"],
      }, discoverPapersWithCodeTrending),
    },
    { name: "arXiv filtered search", run: () => discoverArxivFiltered(discoveryTrace) },
    { name: "OpenReview selected venues", run: () => discoverOpenReview(discoveryTrace) },
    { name: "ACL Anthology", run: () => discoverAclAnthology(discoveryTrace) },
    { name: "CVF Open Access", run: () => discoverCvfOpenAccess(discoveryTrace) },
    { name: "company research blogs", run: () => discoverCompanyResearchBlogs(discoveryTrace) },
  ];

  for (const adapter of adapters) {
    const items = await adapter.run();
    batches.push(...items);
    console.log(`[discover] ${adapter.name}: ${items.length}`);
  }

  const mergedLive = mergeCandidates(batches);
  const resumeNeeded = mergedLive.filter((item) => item.abstract || item.arxivId || /Hugging Face|Papers with Code|arXiv|OpenReview/i.test(item.sourceName)).length < 30;
  const resumeCandidates = resumeNeeded ? await loadResumeCandidates(DISCOVER_LIMIT) : [];
  if (resumeCandidates.length > 0) {
    pushDiscoveryTrace(discoveryTrace, {
      source: "resume_cache",
      sourceName: "Recent candidates cache",
      queryLabel: "recent candidates fallback",
      status: "ok",
      rawCandidateCount: resumeCandidates.length,
      candidateCount: resumeCandidates.length,
      requestedLimit: DISCOVER_LIMIT,
      sourceSignals: ["resume cache"],
    });
    console.log(`[discover] resume-cache: ${resumeCandidates.length}`);
  }
  const criticalAheTraceFailed = discoveryTrace.some((item) => item.status === "failed" && /agent harness engineering|terminal agents observability/i.test(item.queryLabel || ""));
  const liveAheCount = mergedLive.filter(isAheLikeCandidate).length;
  const aheRescueCandidates = criticalAheTraceFailed || liveAheCount < 4 ? await loadAheRescueCandidates(cache, 30) : [];
  if (aheRescueCandidates.length > 0) {
    pushDiscoveryTrace(discoveryTrace, {
      source: "ahe_rescue_cache",
      sourceName: "AHE rescue cache",
      queryLabel: criticalAheTraceFailed ? "critical AHE query fallback" : "low AHE live count fallback",
      status: "ok",
      rawCandidateCount: aheRescueCandidates.length,
      candidateCount: aheRescueCandidates.length,
      requestedLimit: 30,
      sourceSignals: ["AHE rescue cache", "source failure fallback"],
    });
    console.log(`[discover] AHE rescue cache: ${aheRescueCandidates.length}`);
  }

  const enriched = await enrichArxivCandidates(mergeCandidates([...mergedLive, ...resumeCandidates, ...aheRescueCandidates]));
  const candidates = mergeCandidates(enriched)
    .filter((item) => focusMatches(item))
    .sort((a, b) => discoveryPriorityScore(b) - discoveryPriorityScore(a) || Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0))
    .slice(0, DISCOVER_LIMIT);

  for (const candidate of candidates) {
    cache.seen[candidate.key] = {
      id: candidate.id,
      title: candidate.title,
      firstSeenAt: cache.seen[candidate.key]?.firstSeenAt || new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      version: candidate.version,
      sourceUrl: candidate.sourceUrl,
    };
  }
  await saveCache(cache);

  const out = {
    schemaVersion: 3,
    date: DATE,
    generatedAt: new Date().toISOString(),
    purpose: "AI Job Research Radar discovery candidates",
    sources: Object.keys(SOURCE_CONFIG),
    discoverySummary: {
      rawCandidateCount: batches.length + resumeCandidates.length + aheRescueCandidates.length,
      mergedLiveCandidateCount: mergedLive.length,
      aheLiveCandidateCount: liveAheCount,
      aheRescueCandidateCount: aheRescueCandidates.length,
      finalCandidateCount: candidates.length,
      limit: DISCOVER_LIMIT,
      failedTraceCount: discoveryTrace.filter((item) => item.status === "failed").length,
    },
    discoveryTrace,
    runTrace: finishTrace(stageTrace, {
      adapterCount: adapters.length,
      failedAdapterCount: discoveryTrace.filter((item) => item.status === "failed").length,
      rawCandidateCount: batches.length + resumeCandidates.length + aheRescueCandidates.length,
      finalCandidateCount: candidates.length,
    }),
    focusTopics: FOCUS_TOPICS.map((topic) => topic.label),
    candidates,
  };
  const file = path.join(DATA_DIR, `candidates-${DATE}.json`);
  await writeJson(file, out);
  console.log(`[discover] wrote ${file} (${candidates.length} candidates)`);
  return out;
}

async function latestFile(prefix) {
  await ensureDirs();
  const files = (await readdir(DATA_DIR)).filter((name) => name.startsWith(prefix) && name.endsWith(".json")).sort();
  return files.length ? path.join(DATA_DIR, files[files.length - 1]) : null;
}

async function recentFiles(prefix, excludeDate = DATE, limit = 3) {
  await ensureDirs();
  const files = (await readdir(DATA_DIR))
    .filter((name) => name.startsWith(prefix) && name.endsWith(".json") && !name.includes(excludeDate))
    .sort()
    .reverse()
    .slice(0, limit);
  return files.map((name) => path.join(DATA_DIR, name));
}

async function loadResumeCandidates(limit) {
  const files = await recentFiles("candidates-", DATE, 3);
  const out = [];
  for (const file of files) {
    const data = await readJson(file, null);
    for (const item of data?.candidates || []) {
      out.push(finalizeCandidate({
        ...item,
        sourceSignals: [...new Set([...(item.sourceSignals || []), `resume-cache:${path.basename(file)}`])],
      }));
      if (out.length >= limit) return out;
    }
  }
  return out;
}

async function loadAheRescueCandidates(cache, limit = 30) {
  const out = [];
  const seenKeys = new Set();
  const push = (candidate) => {
    const finalized = finalizeCandidate(candidate);
    if (!isAheLikeCandidate(finalized) || seenKeys.has(finalized.key)) return;
    seenKeys.add(finalized.key);
    out.push(finalized);
  };

  const files = await recentFiles("candidates-", DATE, 5);
  for (const file of files) {
    const data = await readJson(file, null);
    for (const item of data?.candidates || []) {
      if (!isAheLikeCandidate(item)) continue;
      push({
        ...item,
        sourceSignals: [...new Set([...(item.sourceSignals || []), `ahe-rescue:${path.basename(file)}`])],
      });
      if (out.length >= limit) return out;
    }
  }

  for (const [key, item] of Object.entries(cache?.seen || {})) {
    if (!/\b(AHE|HarnessAudit|harness|observability|execution trace|trajectory|rollback|Terminal[- ]?Bench|self[- ]?improv)\b/i.test(item.title || "")) continue;
    push({
      title: item.title,
      source: "ahe_rescue_cache",
      sourceName: "AHE rescue cache",
      sourceUrl: item.sourceUrl || "",
      paperUrl: item.sourceUrl || "",
      arxivId: key.startsWith("arxiv:") ? key.slice("arxiv:".length) : "",
      publishedAt: item.firstSeenAt || "",
      updatedAt: item.lastSeenAt || item.firstSeenAt || "",
      version: item.version || "cache",
      sourceSignals: ["AHE rescue cache", "source failure fallback"],
    });
    if (out.length >= limit) return out;
  }

  return out;
}

async function triage() {
  await ensureDirs();
  const stageTrace = startTrace("triage");
  const inputFile = path.join(DATA_DIR, `candidates-${DATE}.json`);
  const file = existsSync(inputFile) ? inputFile : await latestFile("candidates-");
  if (!file) throw new Error("No candidates file found. Run npm run papers:discover first.");
  const input = await readJson(file, null);
  const candidates = input?.candidates || [];
  const scored = candidates.map((candidate) => ({ ...candidate, triage: deterministicTriage(candidate) }));
  const cheapModel = await cheapModelTriage(scored.sort((a, b) => b.triage.total_score - a.triage.total_score).slice(0, 30));
  const merged = scored.map((candidate) => {
    const model = cheapModel.get(candidate.id);
    if (!model) return candidate;
    const adjustedTotal = clamp(candidate.triage.total_score + model.model_adjustment);
    const adjustedDecision = model.decision_override || decisionFor(adjustedTotal, candidate.triage);
    return {
      ...candidate,
      triage: {
        ...candidate.triage,
        model_adjustment: model.model_adjustment,
        model_reason: model.reason,
        total_score: adjustedTotal,
        decision: adjustedDecision,
      },
    };
  });

  const scoreRanked = [...merged].sort((a, b) => b.triage.total_score - a.triage.total_score);
  const ranked = scoreRanked.filter((item) => item.triage.decision !== "ignore");
  const selectedTop = selectDiverseTop(ranked, 10);
  const selectedRankById = new Map(selectedTop.map((item, index) => [item.id, index + 1]));
  const cutoffScore = selectedTop.length ? selectedTop[selectedTop.length - 1].triage?.total_score : null;
  const items = scoreRanked.map((item, index) => withSelectionExplanation(item, {
    rank: index + 1,
    selectedRank: selectedRankById.get(item.id) || null,
    selected: selectedRankById.has(item.id),
    cutoffScore,
  }));
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const top = selectedTop.map((item) => itemsById.get(item.id) || item);

  const out = {
    schemaVersion: 3,
    date: DATE,
    generatedAt: new Date().toISOString(),
    inputFile: path.relative(ROOT, file),
    modelUsed: !NO_MODEL && process.env.DEEPSEEK_API_KEY ? (process.env.PAPERS_TRIAGE_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash") : null,
    decisions: ["ignore", "skim", "read", "review", "deep_dive", "implement"],
    discoveryTrace: input?.discoveryTrace || [],
    discoveryRunTrace: input?.runTrace || null,
    triageSummary: {
      candidateCount: candidates.length,
      scoredCount: merged.length,
      selectedCount: top.length,
      rejectedCount: items.filter((item) => item.triage.selection_status === "rejected").length,
      belowTopCutoffCount: items.filter((item) => item.triage.selection_status === "below_top_cutoff").length,
      cutoffScore,
    },
    runTrace: finishTrace(stageTrace, {
      inputFile: path.relative(ROOT, file),
      candidateCount: candidates.length,
      scoredCount: merged.length,
      selectedCount: top.length,
      cheapModelCandidateCount: Math.min(30, scored.length),
      cheapModelUsed: Boolean(!NO_MODEL && process.env.DEEPSEEK_API_KEY),
      cutoffScore,
    }),
    items,
    top,
  };
  const outFile = path.join(DATA_DIR, `triage-${DATE}.json`);
  await writeJson(outFile, out);
  console.log(`[triage] wrote ${outFile} (${top.length} top papers)`);
  return out;
}

async function review() {
  await ensureDirs();
  const stageTrace = startTrace("review");
  const triageFile = path.join(DATA_DIR, `triage-${DATE}.json`);
  const file = existsSync(triageFile) ? triageFile : await latestFile("triage-");
  if (!file) throw new Error("No triage file found. Run npm run papers:triage first.");
  const input = await readJson(file, null);
  const cache = await loadCache();
  const top = input?.top || [];
  const reviewPreferred = top.filter((item) => ["deep_dive", "review", "implement"].includes(item.triage?.decision));
  const reviewFallback = top.filter((item) => item.triage?.decision !== "ignore");
  const candidates = (reviewPreferred.length > 0 ? reviewPreferred : reviewFallback).slice(0, REVIEW_LIMIT);
  const reviewed = [];
  const skipped = [];
  for (const candidate of candidates) {
    const reviewedKey = `${candidate.key}:${candidate.version || "unknown"}`;
    const existing = cache.reviewed[reviewedKey];
    if (existing && !DRY_RUN && !FORCE_REVIEW && !existing.dryRun && existsSync(path.join(ROOT, existing.file))) {
      skipped.push({ id: candidate.id, reason: "already_reviewed_same_version", file: existing.file });
      continue;
    }
    if (DRY_RUN) {
      const dry = dryReview(candidate);
      const outFile = path.join(REVIEWED_DIR, `${candidate.id}-${DATE}.json`);
      await writeJson(outFile, dry);
      cache.reviewed[reviewedKey] = { id: candidate.id, version: candidate.version, file: path.relative(ROOT, outFile), reviewedAt: new Date().toISOString(), dryRun: true };
      reviewed.push(dry);
      continue;
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      skipped.push({ id: candidate.id, reason: "missing_DEEPSEEK_API_KEY" });
      continue;
    }
    const model = process.env.PAPERS_REVIEW_MODEL || process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro";
    const structured = await modelReview(candidate, model);
    const outFile = path.join(REVIEWED_DIR, `${candidate.id}-${DATE}.json`);
    await writeJson(outFile, structured);
    cache.reviewed[reviewedKey] = { id: candidate.id, version: candidate.version, file: path.relative(ROOT, outFile), reviewedAt: new Date().toISOString(), model };
    reviewed.push(structured);
  }
  await saveCache(cache);

  const out = {
    schemaVersion: 2,
    date: DATE,
    generatedAt: new Date().toISOString(),
    inputFile: path.relative(ROOT, file),
    reviewed: reviewed.map((item) => ({ id: item.id, title: item.title, file: path.relative(ROOT, path.join(REVIEWED_DIR, `${item.id}-${DATE}.json`)) })),
    skipped,
    runTrace: finishTrace(stageTrace, {
      inputFile: path.relative(ROOT, file),
      reviewLimit: REVIEW_LIMIT,
      candidateCount: candidates.length,
      reviewedCount: reviewed.length,
      skippedCount: skipped.length,
      forceReview: FORCE_REVIEW,
      dryRun: DRY_RUN,
      modelUsed: reviewed.find((item) => item.model)?.model || null,
    }),
  };
  const outFile = path.join(DATA_DIR, `reviews-${DATE}.json`);
  await writeJson(outFile, out);
  console.log(`[review] wrote ${outFile} (${reviewed.length} reviewed, ${skipped.length} skipped)`);
  return out;
}

function dryReview(candidate) {
  const placeholder = "Dry run placeholder. Configure DEEPSEEK_API_KEY and PAPERS_REVIEW_MODEL for full DeepSeek Pro review.";
  const learning = `从 ${candidate.title} 中练习把论文贡献拆成：问题定义、系统接口、数据/工具流、评价标准、失败模式和可迁移设计模式。`;
  return {
    schemaVersion: 2,
    id: candidate.id,
    key: candidate.key,
    title: candidate.title,
    sourceUrl: candidate.sourceUrl,
    paperUrl: candidate.paperUrl,
    version: candidate.version,
    reviewedAt: new Date().toISOString(),
    model: "dry-run",
    abstract_takeaway: candidate.abstract ? candidate.abstract.slice(0, 220) : candidate.title,
    motivation: placeholder,
    solution: placeholder,
    design: placeholder,
    evaluation: placeholder,
    results: placeholder,
    strengths: ["Dry run verified review file generation."],
    weaknesses: ["No model judgment was used in dry-run mode."],
    professor_lens: learning,
    what_to_learn: [
      "这篇文章解决的真实工程问题是什么。",
      "作者把系统边界、工具接口、数据流和评测闭环怎么拆开。",
      "哪些思路可以迁移到自己的 AI 应用或 agent 项目。",
    ],
    good_ideas: [
      "把论文中的核心结构抽象成可复用的工程模式，而不是只记论文结论。",
    ],
    bad_ideas_or_limits: [
      "dry-run 没有真实模型 review，不能代表论文质量判断。",
    ],
    transferable_patterns: [
      "固定输入 -> 明确系统边界 -> 记录执行轨迹 -> 设计 pass/fail 评价标准。",
    ],
    future_work_applications: [
      `把 ${candidate.title} 的一个设计思想改造成可写进作品集的最小 demo。`,
    ],
    reading_questions: [
      "这篇文章最值得偷走的设计模式是什么？",
      "它最大的评测或落地缺口是什么？",
      "如果我要在工作中应用它，第一版 MVP 应该怎么切？",
    ],
    learning_tasks: [
      "画出论文系统图。",
      "写出 3 个优点和 2 个局限。",
      "把一个优点改写成自己的项目设计原则。",
    ],
    architecture_takeaway: `Use ${candidate.title} to practice extracting system boundaries, data flow, and evaluation signals.`,
    interview_talking_points: ["Explain why the paper matters for AI engineer system design, not just its headline result."],
    likely_interview_questions: ["How would you convert this paper into a small portfolio project with clear evaluation?"],
    project_ideas: [`Build a small demo inspired by ${candidate.title} with fixed inputs, logged traces, and pass/fail criteria.`],
  };
}

function reviewDepthScore(review) {
  if (!review) return 0;
  const textFields = [
    review.abstract_takeaway,
    review.motivation,
    review.solution,
    review.design,
    review.evaluation,
    review.results,
    review.professor_lens,
    review.architecture_takeaway,
  ].map((item) => String(item || "").trim());
  const arrayFields = [
    review.what_to_learn,
    review.good_ideas,
    review.bad_ideas_or_limits,
    review.transferable_patterns,
    review.future_work_applications,
    review.reading_questions,
    review.learning_tasks,
    review.strengths,
    review.weaknesses,
  ];
  const longTextCount = textFields.filter((text) => text.length >= 80 && !hasMojibake(text)).length;
  const populatedArrayCount = arrayFields.filter((items) => Array.isArray(items) && items.some((item) => String(item || "").trim().length >= 20)).length;
  return clamp(longTextCount * 7 + populatedArrayCount * 5);
}

function buildTraceSummary({ triageData, reviewIndex, reviews, dailyTrace, mustRead, skim }) {
  const discoverTrace = Array.isArray(triageData.discoveryTrace) ? triageData.discoveryTrace : [];
  const stages = [triageData.discoveryRunTrace, triageData.runTrace, reviewIndex.runTrace, dailyTrace].filter(Boolean);
  const modelUsage = modelTelemetrySnapshot();
  const sourceFailures = discoverTrace.filter((item) => item.status === "failed");
  return {
    summary: {
      candidateCount: triageData.triageSummary?.candidateCount || 0,
      selectedCount: (mustRead ? 1 : 0) + skim.length,
      reviewedCount: reviews.filter(Boolean).length,
      sourceFailureCount: sourceFailures.length,
      modelCalls: modelUsage.calls,
      totalTokens: modelUsage.totalTokens,
    },
    stages,
    modelUsage,
    sourceFailures: sourceFailures.slice(0, 6).map((item) => ({
      source: item.source,
      queryLabel: item.queryLabel,
      failureReason: item.failureReason,
    })),
  };
}

function buildReflection({ triageData, reviews, qualityGate, mustRead, skim, trace }) {
  const reviewScores = reviews.filter(Boolean).map(reviewDepthScore);
  const averageReviewDepth = reviewScores.length
    ? Math.round(reviewScores.reduce((sum, score) => sum + score, 0) / reviewScores.length)
    : 0;
  const warnings = qualityGate.checks.filter((check) => check.status !== "pass").map((check) => `${check.id}: ${check.details}`);
  const aheCount = [mustRead, ...skim].filter(Boolean).filter((paper) => (paper.triage?.matched_ahe_signals || []).length > 0).length;
  const belowCutoff = triageData.triageSummary?.belowTopCutoffCount || 0;
  const whatWorked = [
    mustRead ? `Must-read selected with score ${mustRead.triage?.total_score}: ${mustRead.title}` : "No must-read paper selected.",
    `${aheCount} selected paper(s) carried agent harness / observability signals.`,
    `${reviews.filter(Boolean).length} reviewed paper file(s) are available for teaching-oriented reuse.`,
  ];
  const whatToWatch = [
    ...warnings,
    trace.summary.sourceFailureCount > 0 ? `${trace.summary.sourceFailureCount} discovery source/query failure(s) need monitoring.` : "",
    averageReviewDepth < 70 ? `Average review depth is ${averageReviewDepth}; do not promote weak reviews into Articles.` : "",
    belowCutoff > 20 ? `${belowCutoff} papers were below top cutoff; inspect if emerging concepts are being crowded out.` : "",
  ].filter(Boolean);
  const nextRunAdjustments = [
    aheCount === 0 ? "Run AHE rescue queries and inspect rejected harness-like candidates." : "Keep AHE rescue enabled, but prefer papers with concrete harness/eval evidence.",
    reviews.filter(Boolean).length === 0 ? "Run review with DeepSeek Pro before using this radar as an Articles source." : "Use reviewed papers as candidates for full Articles deep dive only after manual read.",
    "If a review lacks good/bad/transferable patterns, rerun review with stricter professor prompt instead of publishing a shallow analysis.",
  ];
  return {
    schemaVersion: 1,
    summary: whatToWatch.length
      ? `Reflection found ${whatToWatch.length} watch item(s); keep the feed small and evidence-led.`
      : "Reflection found no blocking watch item; keep the feed small and evidence-led.",
    averageReviewDepth,
    whatWorked,
    whatToWatch,
    selfCorrections: [
      "Do not treat fresh or hot as sufficient quality evidence; freshness only earns attention, not promotion.",
      "Benchmark and evaluation papers must be read through claims, controlled variables, metrics, and failure modes.",
      "A paper is only Articles-worthy when it teaches a reusable AI engineer pattern, not merely because it is about AI.",
    ],
    nextRunAdjustments,
  };
}

async function modelReview(candidate, model) {
  const system = "你是 AI Job Research Radar 的教授型论文 reviewer。用户是正在准备 AI engineer / AI 应用岗的学生。你的目标不是写摘要，而是教学生从论文中学到可迁移的好设计、识别坏设计或局限，并知道未来工作中怎么应用。必须输出严格 JSON，不要 markdown。";
  const user = `请只基于下面的论文元数据做结构化 review。如果信息不足，要明确写“不足”。重点顺序：1) 教授视角讲清楚这篇文章该学什么；2) 好的地方；3) 坏的地方/局限；4) 可迁移到未来工作的设计模式；5) 面试时可自然讲出的观点。不要把“面试”写成唯一目的。\n\nPaper:\n${JSON.stringify({
    id: candidate.id,
    title: candidate.title,
    authors: candidate.authors,
    abstract: candidate.abstract,
    source: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    paperUrl: candidate.paperUrl,
    venue: candidate.venue,
    scores: candidate.triage,
  }, null, 2)}\n\nReturn JSON with exactly these fields:\n{
  "id": "...",
  "key": "...",
  "title": "...",
  "sourceUrl": "...",
  "paperUrl": "...",
  "version": "...",
  "reviewedAt": "...",
  "model": "...",
  "abstract_takeaway": "中文，1段",
  "motivation": "中文，为什么这个问题重要",
  "solution": "中文，论文提出什么",
  "design": "中文，架构/方法设计",
  "evaluation": "中文，怎么评",
  "results": "中文，结果说明什么",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "professor_lens": "中文，像老师一样解释学生应该从这篇文章里学到什么，不要只复述摘要",
  "what_to_learn": ["这篇文章训练哪种 AI engineer 能力"],
  "good_ideas": ["值得吸收的好设计/好问题定义/好评测方式"],
  "bad_ideas_or_limits": ["不该照搬的地方、局限、可能失败的原因"],
  "transferable_patterns": ["可以迁移到未来工作中的设计模式或工程方法"],
  "future_work_applications": ["未来在工作/项目中怎么用这个思路"],
  "reading_questions": ["读完后学生应该能回答的问题"],
  "learning_tasks": ["学生可执行的小练习"],
  "architecture_takeaway": "中文，AI engineer 应学的架构要点",
  "interview_talking_points": ["..."],
  "likely_interview_questions": ["..."],
  "project_ideas": ["..."]
}`;
  const parsed = await chatJson({ system, user, model, maxTokens: 7000, temperature: 0.25 });
  return {
    schemaVersion: 2,
    id: candidate.id,
    key: candidate.key,
    title: candidate.title,
    sourceUrl: candidate.sourceUrl,
    paperUrl: candidate.paperUrl,
    version: candidate.version,
    reviewedAt: new Date().toISOString(),
    model,
    abstract_takeaway: String(parsed.abstract_takeaway || ""),
    motivation: String(parsed.motivation || ""),
    solution: String(parsed.solution || ""),
    design: String(parsed.design || ""),
    evaluation: String(parsed.evaluation || ""),
    results: String(parsed.results || ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    professor_lens: String(parsed.professor_lens || ""),
    what_to_learn: Array.isArray(parsed.what_to_learn) ? parsed.what_to_learn.map(String) : [],
    good_ideas: Array.isArray(parsed.good_ideas) ? parsed.good_ideas.map(String) : [],
    bad_ideas_or_limits: Array.isArray(parsed.bad_ideas_or_limits) ? parsed.bad_ideas_or_limits.map(String) : [],
    transferable_patterns: Array.isArray(parsed.transferable_patterns) ? parsed.transferable_patterns.map(String) : [],
    future_work_applications: Array.isArray(parsed.future_work_applications) ? parsed.future_work_applications.map(String) : [],
    reading_questions: Array.isArray(parsed.reading_questions) ? parsed.reading_questions.map(String) : [],
    learning_tasks: Array.isArray(parsed.learning_tasks) ? parsed.learning_tasks.map(String) : [],
    architecture_takeaway: String(parsed.architecture_takeaway || ""),
    interview_talking_points: Array.isArray(parsed.interview_talking_points) ? parsed.interview_talking_points.map(String) : [],
    likely_interview_questions: Array.isArray(parsed.likely_interview_questions) ? parsed.likely_interview_questions.map(String) : [],
    project_ideas: Array.isArray(parsed.project_ideas) ? parsed.project_ideas.map(String) : [],
  };
}

async function daily() {
  await ensureDirs();
  const stageTrace = startTrace("daily");
  const triageFile = path.join(DATA_DIR, `triage-${DATE}.json`);
  const file = existsSync(triageFile) ? triageFile : await latestFile("triage-");
  if (!file) throw new Error("No triage file found. Run npm run papers:triage first.");
  const triageData = await readJson(file, null);
  const reviewIndexFile = path.join(DATA_DIR, `reviews-${DATE}.json`);
  const reviewIndex = existsSync(reviewIndexFile) ? await readJson(reviewIndexFile, { reviewed: [] }) : { reviewed: [] };
  const reviewFiles = reviewIndex.reviewed?.map((item) => path.join(ROOT, item.file)).filter(existsSync) || [];
  const reviews = [];
  for (const reviewFile of reviewFiles) reviews.push(await readJson(reviewFile, null));

  const top = triageData.top || [];
  const prioritized = [...top].sort((a, b) => dailyPriorityScore(b) - dailyPriorityScore(a));
  const mustRead = prioritized.find((item) => ["deep_dive", "review", "read", "implement"].includes(item.triage?.decision)) || prioritized[0] || null;
  const skim = prioritized.filter((item) => item.id !== mustRead?.id).slice(0, 3);
  const firstReview = reviews.find(Boolean);
  const professorLesson = fallbackProfessorLesson(mustRead);
  const goodIdea = fallbackGoodIdea(mustRead);
  const badIdea = fallbackBadIdea(mustRead);
  const transferablePattern = fallbackTransferablePattern(mustRead);
  const futureApplication = fallbackFutureApplication(mustRead);
  const architectureTakeaway = fallbackArchitectureTakeaway(mustRead);
  const interviewPoint = fallbackInterviewPoint(mustRead);
  const projectIdea = fallbackProjectIdea(mustRead);
  const agentFlow = buildDailyAgentFlow(triageData, mustRead);
  const reviewDepthScores = reviews.filter(Boolean).map(reviewDepthScore);
  const averageReviewDepth = reviewDepthScores.length
    ? Math.round(reviewDepthScores.reduce((sum, score) => sum + score, 0) / reviewDepthScores.length)
    : 0;
  const qualityGate = createQualityGate({
    surface: "paper_radar",
    checks: [
      gateCheck("must-read", "daily output has one must-read paper", Boolean(mustRead), mustRead?.title || "missing must-read"),
      gateCheck("skim-count", "daily output keeps at most three skim papers", skim.length <= 3, `${skim.length} skim papers`),
      gateCheck("triage-top", "triage top list stays small and present", top.length > 0 && top.length <= 10, `${top.length} top papers`),
      gateCheck("professor-fields", "daily output includes professor learning fields", Boolean(professorLesson && goodIdea && badIdea && transferablePattern), "professor/good/risk/pattern fallbacks available"),
      gateWarning("review-cache", "at least one Pro review is attached or cached", reviews.filter(Boolean).length > 0, `${reviews.filter(Boolean).length} review files linked`),
      gateWarning("review-depth", "attached review reaches teaching-depth bar", averageReviewDepth >= 70, `average review depth ${averageReviewDepth}`),
    ],
  });
  const dailyTrace = finishTrace(stageTrace, {
    inputFile: path.relative(ROOT, file),
    reviewFileCount: reviewFiles.length,
    mustReadId: mustRead?.id || "",
    skimCount: skim.length,
    averageReviewDepth,
  });
  const runTrace = buildTraceSummary({ triageData, reviewIndex, reviews, dailyTrace, mustRead, skim });
  const reflection = buildReflection({ triageData, reviews, qualityGate, mustRead, skim, trace: runTrace });
  const out = {
    schemaVersion: 3,
    date: DATE,
    generatedAt: new Date().toISOString(),
    one_must_read_paper: mustRead ? summarizePaper(mustRead, "must_read") : null,
    three_skim_papers: skim.map((item) => summarizePaper(item, "skim")),
    one_professor_lesson: cleanReviewText(firstReview?.professor_lens, professorLesson),
    one_good_idea_to_steal: firstCleanReviewArrayValue(firstReview?.good_ideas, goodIdea),
    one_bad_idea_or_risk: firstCleanReviewArrayValue(firstReview?.bad_ideas_or_limits, badIdea),
    one_transferable_pattern: firstCleanReviewArrayValue(firstReview?.transferable_patterns, transferablePattern),
    one_future_work_application: firstCleanReviewArrayValue(firstReview?.future_work_applications, futureApplication),
    one_architecture_takeaway: cleanReviewText(firstReview?.architecture_takeaway, architectureTakeaway),
    one_interview_talking_point: firstCleanReviewArrayValue(firstReview?.interview_talking_points, interviewPoint),
    one_project_idea: firstCleanReviewArrayValue(firstReview?.project_ideas, projectIdea),
    agent_flow: agentFlow,
    quality_gate: qualityGate,
    run_trace: runTrace,
    reflection,
    reviewedFiles: reviewIndex.reviewed || [],
  };
  const pipelineMemory = await rememberPipelineRun({
    surface: "paper_radar",
    date: DATE,
    sourceFiles: {
      candidates: `data/papers/candidates-${DATE}.json`,
      triage: `data/papers/triage-${DATE}.json`,
      daily: `data/papers/daily-${DATE}.json`,
      public: "public/data/paper-radar.json",
    },
    agentFlow,
    qualityGate,
    trace: runTrace,
    reflection,
    selectedItems: summarizeSelection([mustRead, ...skim].filter(Boolean), (paper) => ({
      id: paper.id,
      title: paper.title,
      score: paper.triage?.total_score || paper.triage?.score || 0,
      reason: paper.triage?.selected_reason || paper.triage?.reason || paper.title,
    })),
    archivedItems: summarizeSelection(top.filter((paper) => paper.id !== mustRead?.id && !skim.some((item) => item.id === paper.id)).slice(0, 8), (paper) => ({
      id: paper.id,
      title: paper.title,
      score: paper.triage?.total_score || paper.triage?.score || 0,
      reason: paper.triage?.rejection_reason || "not selected for daily paper radar",
    })),
    highlights: [
      mustRead ? `Must-read paper: ${mustRead.title}` : "No must-read paper selected.",
      `${triageData.triageSummary?.candidateCount || top.length} candidates passed through radar triage.`,
    ],
    nextActions: [
      "Review the must-read paper before promoting it into Articles.",
      "Run npm run validate after publishing radar data.",
    ],
    reusablePatterns: [mustRead, ...skim].filter(Boolean).map((paper) => ({
      text: `${paper.title}: ${paper.triage?.selected_reason || paper.triage?.reason || "paper radar selection"}`,
      source: "paper_radar",
    })),
  });
  out.pipelineRun = {
    id: pipelineMemory.run.id,
    memoryFile: "data/agent-memory/paper_radar.json",
    statusFile: "public/data/pipeline-status.json",
  };
  const outFile = path.join(DATA_DIR, `daily-${DATE}.json`);
  await writeJson(outFile, out);
  await publishRadarForFrontend(out, triageData);
  console.log(`[daily] wrote ${outFile}`);
  console.log(`[daily] published ${PUBLIC_RADAR_FILE}`);
  return out;
}

function buildDailyAgentFlow(triageData, mustRead) {
  const summary = triageData.triageSummary || {};
  return [
    {
      role: "Discoverer",
      responsibility: "从 HF Daily、Papers with Code、arXiv、OpenReview、ACL、CVF 和公司研究页发现候选论文。",
      signal: `${summary.candidateCount || 0} candidates entered triage`,
    },
    {
      role: "Evidence Collector",
      responsibility: "保留 sourceUrl、paperUrl、abstract、sourceSignals、focusTopics 和版本号，避免只看标题判断。",
      signal: mustRead?.sourceName || "waiting for candidates",
    },
    {
      role: "Ranker",
      responsibility: "按岗位相关性、架构价值、实用性、新颖性、评估质量、面试表达和可构建性打分。",
      signal: `cutoff ${summary.cutoffScore === null || summary.cutoffScore === undefined ? "n/a" : summary.cutoffScore}, selected ${summary.selectedCount || 0}`,
    },
    {
      role: "Teacher Reviewer",
      responsibility: "只对 1-2 篇高价值论文做教授式深读，讲清好设计、坏设计和可迁移模式。",
      signal: "review cache is version-aware",
    },
    {
      role: "Verifier",
      responsibility: "用 validate 脚本检查 trace、daily 输出、review 字段和中文编码。",
      signal: "npm run validate is the quality gate",
    },
    {
      role: "Publisher",
      responsibility: "把 daily radar 摘要发布到 public/data/paper-radar.json，供前端展示。",
      signal: "public radar data ready",
    },
    {
      role: "Archivist",
      responsibility: "保存 candidates、triage、reviewed 和 daily 文件，后续复用思路架构。",
      signal: `data/papers/*-${DATE}.json`,
    },
  ];
}

async function publishRadarForFrontend(dailyData, triageData) {
  const top = triageData.top || [];
  const items = triageData.items || top;
  const out = {
    schemaVersion: 2,
    date: dailyData.date,
    generatedAt: new Date().toISOString(),
    sourceFiles: {
      daily: `data/papers/daily-${dailyData.date}.json`,
      triage: `data/papers/triage-${dailyData.date}.json`,
    },
    pipelineRun: dailyData.pipelineRun || null,
    qualityGate: dailyData.quality_gate || null,
    runTrace: dailyData.run_trace || null,
    reflection: dailyData.reflection || null,
    memoryVersion: 1,
    triageSummary: triageData.triageSummary || null,
    agentFlow: dailyData.agent_flow || [],
    mustRead: dailyData.one_must_read_paper,
    skim: dailyData.three_skim_papers,
    professorLesson: dailyData.one_professor_lesson,
    goodIdeaToSteal: dailyData.one_good_idea_to_steal,
    badIdeaOrRisk: dailyData.one_bad_idea_or_risk,
    transferablePattern: dailyData.one_transferable_pattern,
    futureWorkApplication: dailyData.one_future_work_application,
    architectureTakeaway: dailyData.one_architecture_takeaway,
    interviewTalkingPoint: dailyData.one_interview_talking_point,
    projectIdea: dailyData.one_project_idea,
    topPapers: top.map((item) => summarizePaper(item, item.id === dailyData.one_must_read_paper?.id ? "must_read" : "skim")),
    selectionTrace: items.slice(0, 24).map((item) => ({
      id: item.id,
      title: item.title,
      score: item.triage?.total_score,
      decision: item.triage?.decision,
      status: item.triage?.selection_status,
      reason: item.triage?.selected_reason || item.triage?.rejection_reason || item.triage?.reason || "",
      aheSignals: item.triage?.matched_ahe_signals || [],
      freshness: item.triage?.freshness_signal || "",
      hotness: item.triage?.hotness_signal || "",
    })),
  };
  await writeJson(PUBLIC_RADAR_FILE, out);
}

function summarizePaper(item, dailyAction) {
  return {
    id: item.id,
    title: item.title,
    daily_action: dailyAction,
    triage_decision: item.triage?.decision,
    total_score: item.triage?.total_score,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    matched_topics: item.triage?.matched_topics || item.focusTopics || [],
    freshness_signal: item.triage?.freshness_signal,
    hotness_signal: item.triage?.hotness_signal,
    reason: item.triage?.model_reason || item.triage?.deterministic_reason || "",
  };
}

function fallbackProfessorLesson(item) {
  if (!item) return "";
  return `像老师带读一样，先问：${item.title} 重新定义了什么问题？它把系统拆成哪些可观察模块？哪些设计值得迁移，哪些只是论文场景下成立？`;
}

function fallbackGoodIdea(item) {
  if (!item) return "";
  return `值得吸收的是它的“问题定义 + 评测闭环”思路：不要只做功能 demo，要定义输入、动作、反馈和成功标准。`;
}

function fallbackBadIdea(item) {
  if (!item) return "";
  return `不要直接照搬论文设置；先检查它的数据、评测环境、成本和失败模式是否适合真实工作场景。`;
}

function fallbackTransferablePattern(item) {
  if (!item) return "";
  return `把论文抽象成可迁移模式：任务边界 -> 工具/数据接口 -> 执行轨迹 -> 质量门禁 -> 复盘改进。`;
}

function fallbackFutureApplication(item) {
  if (!item) return "";
  return `未来工作中可以把 ${item.title} 的核心思想转成团队内部的评测或小工具，用来验证 agent/RAG/AI coding workflow 是否真的可靠。`;
}

function fallbackArchitectureTakeaway(item) {
  if (!item) return "";
  const topics = item.triage?.matched_topics?.join(", ") || item.focusTopics?.join(", ") || "AI systems";
  return `从 ${item.title} 里先抽取系统边界、工具/数据流、评测闭环。当前匹配主题：${topics}。`;
}

function fallbackInterviewPoint(item) {
  if (!item) return "";
  return `面试时不要只说模型分数，说明这篇论文如何定义任务、如何评价失败模式，以及为什么这对 AI engineer 有工程价值。`;
}

function fallbackProjectIdea(item) {
  if (!item) return "";
  return `把 ${item.title} 的评测思想改造成一个小型 portfolio demo：固定输入、记录轨迹、给出 pass/fail 标准。`;
}

async function run() {
  await discover();
  await triage();
  await review();
  await daily();
}

async function main() {
  await loadEnv();
  if (command === "discover") await discover();
  else if (command === "triage") await triage();
  else if (command === "review") await review();
  else if (command === "daily") await daily();
  else if (command === "run") await run();
  else {
    throw new Error(`Unknown command: ${command}. Use discover | triage | review | daily | run`);
  }
}

main().catch((error) => {
  console.error(`[papers-radar] ${error.stack || error.message}`);
  process.exitCode = 1;
});
