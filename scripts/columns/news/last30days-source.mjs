// last30days community-signal discovery sub-layer for the AI-news column.
//
// GATE: only active when env NEWS_LAST30DAYS=1 (default OFF). The default
// deterministic daily pipeline is unchanged unless the flag is set.
//
// This module spawns the locally-installed `last30days` engine
// (.claude/skills/last30days/scripts/last30days.py) in its DETERMINISTIC,
// HEADLESS mode (--quick --emit=compact, zero API keys; its internal LLM
// calls SSL-fail and it cleanly falls back to deterministic planning — which
// is the cron/headless path we want). It parses the `## Ranked Evidence
// Clusters` block from stdout and returns CANDIDATES in the exact news-item
// shape normalizeNewsItem() consumes (title/source/sourceType/url/publishedAt
// + points|score). English text is fine — the pipeline's DeepSeek stage adds
// titleZh/summaryZh downstream.
//
// It only supplies CANDIDATES. The Chinese enrichment, ~20/day cap, dedupe,
// retention, and lint all stay in the existing pipeline.

import { spawn } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ENGINE_SCRIPT = path.join(ROOT, ".claude", "skills", "last30days", "scripts", "last30days.py");

// Small fixed set of AI topics. Deterministic — no open-ended agent.
export const DEFAULT_TOPICS = ["AI agents", "open source LLM", "AI coding"];

const DEFAULT_PYTHON = process.env.LAST30DAYS_PYTHON || "python";
const DEFAULT_PER_TOPIC_TIMEOUT_MS = numberEnv(process.env.NEWS_LAST30DAYS_TIMEOUT_MS, 180_000);
const SOURCE_NAME = "last30days";
const SOURCE_TYPE = "community";

// Map the engine's per-candidate source token ([hackernews]/[reddit]/...) to
// a human source name used on the card. Multi-source candidates (comma list)
// fall back to the generic engine name.
const SOURCE_TOKEN_NAMES = {
  hackernews: "Hacker News",
  reddit: "Reddit",
  github: "GitHub",
  polymarket: "Polymarket",
};

export function isLast30DaysEnabled() {
  return process.env.NEWS_LAST30DAYS === "1";
}

/**
 * Discover community-signal candidates via the last30days engine.
 * Returns { items, sourceStats } where items are normalize-ready news
 * candidates (deduped by URL). Always resolves — never throws — so a flaky
 * engine cannot break the daily pipeline.
 */
export async function fetchLast30DaysSource(options = {}) {
  const topics = Array.isArray(options.topics) && options.topics.length ? options.topics : DEFAULT_TOPICS;
  const logger = options.logger;
  const discoveredAt = options.discoveredAt || options.now?.() || new Date().toISOString();

  const byUrl = new Map();
  const topicStats = [];
  let anyOk = false;

  for (const topic of topics) {
    try {
      const stdout = await runEngine(topic, { ...options, logger });
      const candidates = parseRankedClusters(stdout, { source: SOURCE_NAME, sourceType: SOURCE_TYPE, discoveredAt });
      let added = 0;
      for (const candidate of candidates) {
        const key = canonicalUrlKey(candidate.url);
        if (!key || byUrl.has(key)) continue;
        byUrl.set(key, candidate);
        added += 1;
      }
      anyOk = true;
      topicStats.push({ topic, ok: true, parsed: candidates.length, added });
    } catch (error) {
      const message = error?.message || String(error);
      logger?.warn?.(`[news] last30days topic "${topic}" failed: ${message}`);
      topicStats.push({ topic, ok: false, error: message });
    }
  }

  const items = [...byUrl.values()];
  const failures = topicStats.filter((stat) => !stat.ok);
  return {
    items,
    sourceStats: [{
      id: "last30days",
      source: SOURCE_NAME,
      sourceType: SOURCE_TYPE,
      ok: anyOk,
      count: items.length,
      error: failures.length ? `${failures.length}/${topics.length} topics failed` : "",
      topics: topicStats,
    }],
    discoveredAt,
  };
}

/** Spawn the engine for one topic, deterministic/headless. Resolves stdout. */
export function runEngine(topic, options = {}) {
  const python = options.python || DEFAULT_PYTHON;
  const script = options.script || ENGINE_SCRIPT;
  const timeoutMs = numberOption(options.timeoutMs, DEFAULT_PER_TOPIC_TIMEOUT_MS);
  const saveDir = options.saveDir || path.join(tmpdir(), "ai-brief-l30-news");
  const args = [script, topic, "--quick", "--emit=compact", `--save-dir=${saveDir}`];

  return new Promise((resolve, reject) => {
    const child = spawn(python, args, {
      cwd: ROOT,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch { /* ignore */ }
      reject(new Error(`engine timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.setEncoding("utf-8");
    child.stderr?.setEncoding("utf-8");
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`failed to spawn engine (${python}): ${error.message || error}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!stdout.includes("## Ranked Evidence Clusters")) {
        const detail = stderr.trim().split(/\r?\n/).slice(-3).join(" | ");
        reject(new Error(`engine exit ${code}, no Ranked Evidence Clusters block${detail ? ` (stderr: ${detail})` : ""}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Parse the `## Ranked Evidence Clusters` block of compact stdout into raw
 * news candidates. Each candidate carries title, url, source, sourceType,
 * publishedAt, and points|score. Output is normalize-ready (matches the shape
 * normalizeNewsItem() consumes); the caller still runs it through the
 * pipeline's normalize/dedupe.
 *
 * Format parsed (per lib/render.py):
 *   ### N. <cluster title> (score X, M items, sources: ...)
 *   1. [hackernews] <candidate title>
 *      - <date>[ [date:conf]] | <actor> | [Npts, Mcmt] | score:NN[ | fun:NN]
 *      - URL: <url>
 *      - Evidence: ...
 */
export function parseRankedClusters(stdout, options = {}) {
  const source = options.source || SOURCE_NAME;
  const sourceType = options.sourceType || SOURCE_TYPE;
  const fallbackDate = options.discoveredAt || new Date().toISOString();

  const block = extractClustersBlock(String(stdout || ""));
  if (!block) return [];

  const lines = block.split(/\r?\n/);
  const out = [];
  // A candidate header looks like: `1. [hackernews] Some title`
  const candidateHeaderRe = /^\s*\d+\.\s*\[([^\]]+)\]\s*(.+?)\s*$/;
  const urlLineRe = /^\s*-\s*URL:\s*(\S+)\s*$/i;
  const detailLineRe = /^\s*-\s*(.+?)\s*$/;

  let current = null;
  const flush = () => {
    if (current && current.title && current.url) out.push(current);
    current = null;
  };

  for (const line of lines) {
    // New cluster header — ignore, but it ends any dangling candidate.
    if (/^###\s+\d+\./.test(line)) {
      flush();
      continue;
    }
    const header = candidateHeaderRe.exec(line);
    if (header) {
      flush();
      const token = primaryToken(header[1]);
      current = {
        title: cleanText(header[2]),
        url: "",
        source: SOURCE_TOKEN_NAMES[token] || source,
        sourceType,
        publishedAt: fallbackDate,
        _engagement: null,
      };
      continue;
    }
    if (!current) continue;

    const urlMatch = urlLineRe.exec(line);
    if (urlMatch) {
      current.url = urlMatch[1];
      continue;
    }

    // Detail line: `- 2026-06-02 | Hacker News | [85pts, 65cmt] | score:48 | fun:60`
    // Only the FIRST detail line (the one with `score:`) carries date/engagement.
    if (current._engagement === null) {
      const detail = detailLineRe.exec(line);
      if (detail && /(\|\s*score:|^\s*-\s*\d{4}-\d{2}-\d{2})/.test(line) && !urlLineRe.test(line)) {
        const parts = detail[1].split("|").map((part) => part.trim());
        const date = parseDate(parts[0]);
        if (date) current.publishedAt = date;
        const engagement = parseEngagement(detail[1]);
        if (engagement != null) {
          current._engagement = engagement;
        }
      }
    }
  }
  flush();

  return out.map((candidate) => {
    const item = {
      title: candidate.title,
      source: candidate.source,
      sourceType: candidate.sourceType,
      url: candidate.url,
      publishedAt: candidate.publishedAt,
    };
    // Surface community engagement as `points` so the pipeline's importance
    // ranking (which reads points ?? score) can use it.
    if (Number.isFinite(candidate._engagement)) item.points = candidate._engagement;
    return item;
  });
}

function extractClustersBlock(stdout) {
  const startIdx = stdout.indexOf("## Ranked Evidence Clusters");
  if (startIdx === -1) return "";
  const rest = stdout.slice(startIdx + "## Ranked Evidence Clusters".length);
  // The block ends at the next `## ` heading (## Stats / ## Source Coverage)
  // or the END EVIDENCE marker.
  const endMarkers = [/\n##\s/, /<!-- END EVIDENCE FOR SYNTHESIS -->/];
  let endIdx = rest.length;
  for (const marker of endMarkers) {
    const match = marker.exec(rest);
    if (match && match.index < endIdx) endIdx = match.index;
  }
  return rest.slice(0, endIdx);
}

function primaryToken(rawToken) {
  // e.g. "hackernews" or "hackernews, reddit" -> first token.
  return String(rawToken || "").split(",")[0].trim().toLowerCase();
}

// Sum the leading [Npts, Mcmt]-style engagement numbers into a single signal.
// Returns null when no engagement bracket is present.
function parseEngagement(detail) {
  const bracket = detail.match(/\[([^\]]*(?:pts|cmt|upvotes|react|cite)[^\]]*)\]/i);
  if (!bracket) return null;
  // Prefer points/pts/upvotes as the headline signal; fall back to summing.
  const ptsMatch = bracket[1].match(/([\d,]+)\s*(?:pts|upvotes)/i);
  if (ptsMatch) return toInt(ptsMatch[1]);
  const anyNum = bracket[1].match(/([\d,]+)/);
  return anyNum ? toInt(anyNum[1]) : null;
}

function parseDate(part) {
  if (!part) return "";
  const iso = String(part).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (!iso) return "";
  const time = Date.parse(iso[1]);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function canonicalUrlKey(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return raw.toLowerCase();
  }
}

function toInt(value) {
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numberOption(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function numberEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
