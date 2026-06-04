// Fetch HF Daily Papers rankings via the official `hf` CLI (huggingface_hub).
//   hf papers ls --date today|--week ISO|--month YYYY-MM --sort trending --format json
// Returns normalized candidates. No HTML scraping — this is the structured API.

import { spawnSync } from "node:child_process";
import { normalizeTitle } from "./ledger.mjs";

const HF_CLI = process.env.HF_CLI || "hf";

/** ISO week string for a date, e.g. 2026-W23 (matches `hf papers ls --week`). */
export function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isoMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// `--sort trending` is GLOBAL (it ignores --date/--week/--month and returns all-time
// trending), so we fetch with `--sort publishedAt` to get the correctly window-scoped
// set, then re-rank locally by upvotes — which reproduces the HF site's in-window ranking.
// hf CLI caps --limit at 100, so that's the most we can pull per window/call.
const MAX_LIMIT = 100;
const DEFAULT_LIMITS = { daily: 100, weekly: 100, monthly: 100 };

/** Run `hf papers ls` for one window. window ∈ {daily, weekly, monthly}. */
export function fetchWindow(window, { now = new Date(), limit } = {}) {
  const lim = Math.min(MAX_LIMIT, limit || DEFAULT_LIMITS[window] || 100);
  const args = ["papers", "ls", "--sort", "publishedAt", "--limit", String(lim), "--format", "json"];
  if (window === "daily") args.push("--date", "today");
  else if (window === "weekly") args.push("--week", isoWeek(now));
  else if (window === "monthly") args.push("--month", isoMonth(now));
  else throw new Error(`unknown window: ${window}`);

  // shell only needed to resolve a bare "hf" on Windows; with a full exe path, skip it
  // (avoids the DEP0190 args-with-shell warning).
  const useShell = process.platform === "win32" && !/[\\/]/.test(HF_CLI);
  const res = spawnSync(HF_CLI, args, { encoding: "utf8", shell: useShell, maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw new Error(`hf CLI not runnable (${HF_CLI}): ${res.error.message}`);
  if (res.status !== 0) throw new Error(`hf papers ls ${window} exited ${res.status}: ${String(res.stderr).slice(0, 400)}`);

  let rows;
  try {
    rows = JSON.parse(res.stdout);
  } catch (error) {
    throw new Error(`hf papers ls ${window} returned non-JSON: ${error.message}`);
  }
  // in-window ranking = upvotes desc (the signal HF surfaces); recency breaks ties
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeCandidate(row, window))
    .sort((a, b) => b.upvotes - a.upvotes || String(b.published_at).localeCompare(String(a.published_at)));
}

export function normalizeCandidate(row = {}, window) {
  const arxivId = String(row.id || "").trim();
  const title = String(row.title || "").trim();
  return {
    arxiv_id: arxivId,
    title,
    normalized_title: normalizeTitle(title),
    summary: String(row.summary || "").replace(/\s+/g, " ").trim(),
    authors: (Array.isArray(row.authors) ? row.authors : [])
      .map((a) => (typeof a === "string" ? a : a?.name))
      .filter(Boolean),
    upvotes: Number(row.upvotes) || 0,
    num_comments: Number(row.comments ?? row.num_comments) || 0,
    submitted_by: String(row.submitted_by_name || "").trim(),
    published_at: String(row.published_at || "").trim(),
    hf_paper_url: arxivId ? `https://huggingface.co/papers/${arxivId}` : "",
    paper_url: arxivId ? `https://arxiv.org/abs/${arxivId}` : "",
    thumbnail_url: arxivId ? `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${arxivId}.png` : "",
    window,
  };
}

/** Fetch all three windows; returns { byWindow, merged } where merged dedupes by arxiv_id. */
export function fetchAllWindows(opts = {}) {
  const byWindow = {};
  const merged = new Map();
  for (const window of ["daily", "weekly", "monthly"]) {
    const items = fetchWindow(window, opts);
    byWindow[window] = items;
    for (const item of items) {
      const key = item.arxiv_id || `${item.normalized_title}::${item.hf_paper_url}`;
      const existing = merged.get(key);
      if (existing) {
        existing.windows = [...new Set([...existing.windows, window])];
        existing.upvotes = Math.max(existing.upvotes, item.upvotes);
      } else {
        merged.set(key, { ...item, windows: [window] });
      }
    }
  }
  return { byWindow, merged: [...merged.values()] };
}
