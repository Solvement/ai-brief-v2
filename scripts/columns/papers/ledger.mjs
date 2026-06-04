// Persistent paper ledger for the HF curation pipeline (Kevin spec 2026-06-04).
// One JSONL record per paper at data/papers/ledger.jsonl. arxiv_id is the primary
// key; normalized_title + hf_paper_url is the fallback. The ledger is the single
// source of truth for "have we already seen / analyzed this paper" — dedupe strictly.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const LEDGER_FILE = path.join(ROOT, "data", "papers", "ledger.jsonl");

/** Statuses that mean "already worked on" — never re-surface as a new candidate. */
export const DONE_STATUSES = new Set(["deep_read", "analyzed", "published"]);

export function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable dedupe key: arxiv_id wins; else normalized title + hf url. */
export function ledgerKey({ arxiv_id, normalized_title, hf_paper_url } = {}) {
  if (arxiv_id) return `arxiv:${arxiv_id}`;
  return `title:${normalized_title || ""}::${hf_paper_url || ""}`;
}

export async function readLedger() {
  let text;
  try {
    text = await readFile(LEDGER_FILE, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return new Map();
    throw error;
  }
  const map = new Map();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const rec = JSON.parse(trimmed);
      map.set(ledgerKey(rec), rec);
    } catch {
      // tolerate a corrupt line rather than lose the whole ledger
    }
  }
  return map;
}

export async function writeLedger(map) {
  await mkdir(path.dirname(LEDGER_FILE), { recursive: true });
  const lines = [...map.values()]
    .sort((a, b) => String(b.first_seen_date || "").localeCompare(String(a.first_seen_date || "")))
    .map((rec) => JSON.stringify(rec));
  await writeFile(LEDGER_FILE, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
}

/**
 * Merge a freshly-seen candidate into the ledger map (mutates + returns the record).
 * New paper → status "new". Reappearance → only widen all_seen_sources (never downgrade
 * status, never reset first_seen). Returns { record, isNew }.
 */
export function upsertSeen(map, candidate, { date, source } = {}) {
  const key = ledgerKey(candidate);
  const existing = map.get(key);
  if (existing) {
    const sources = new Set([...(existing.all_seen_sources || []), source].filter(Boolean));
    existing.all_seen_sources = [...sources];
    if (candidate.title && !existing.title) existing.title = candidate.title;
    map.set(key, existing);
    return { record: existing, isNew: false };
  }
  const record = {
    arxiv_id: candidate.arxiv_id || "",
    hf_paper_url: candidate.hf_paper_url || "",
    title: candidate.title || "",
    normalized_title: candidate.normalized_title || normalizeTitle(candidate.title),
    first_seen_date: date,
    first_seen_source: source,
    all_seen_sources: [source].filter(Boolean),
    status: "new",
    analysis_file: "",
    tags: [],
    scores: {},
    notes: "",
  };
  map.set(key, record);
  return { record, isNew: true };
}

/** True if this paper has already been deep-read / analyzed / published. */
export function isDone(record) {
  return Boolean(record && DONE_STATUSES.has(record.status));
}
