import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const PROJECT_LEDGER_FILE = path.join(ROOT, "data", "projects", "ledger.jsonl");
export const DONE_STATUSES = new Set(["analyzed", "deep_dived"]);

export function projectLedgerKey(input = {}) {
  const repo = input.raw || input;
  return normalizeRepoFullName(repo.fullName || repo.full_name || repo.url || input.fullName || input.url);
}

export async function readProjectLedger(file = PROJECT_LEDGER_FILE) {
  const map = new Map();
  let raw = "";
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return map;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      const key = projectLedgerKey(record) || record.full_name;
      if (key) map.set(key, { ...record, full_name: key });
    } catch {
      // Keep a corrupt ledger line from losing the rest of the source history.
    }
  }
  return map;
}

export async function writeProjectLedger(map, file = PROJECT_LEDGER_FILE) {
  await mkdir(path.dirname(file), { recursive: true });
  const rows = [...map.values()]
    .sort((left, right) => String(left.full_name).localeCompare(String(right.full_name)))
    .map((record) => JSON.stringify(record));
  await writeFile(file, `${rows.join("\n")}${rows.length ? "\n" : ""}`, "utf8");
}

export function isProjectDone(record = {}) {
  return DONE_STATUSES.has(record.status);
}

export function upsertProjectSeen(ledger, candidate, { seenAt = new Date().toISOString() } = {}) {
  const key = projectLedgerKey(candidate);
  if (!key) return { record: null, isNew: false };
  const repo = candidate.raw || candidate;
  const existing = ledger.get(key);
  const provenance = mergeProvenance(existing?.provenance, repo.provenance || provenanceFromCandidate(candidate, seenAt));
  const status = repo.alreadyDeepDived ? "deep_dived" : existing?.status || "seen";
  const record = {
    full_name: key,
    status,
    first_seen_at: existing?.first_seen_at || seenAt,
    last_seen_at: seenAt,
    sources: unique([...(existing?.sources || []), ...provenance.map((item) => item.source).filter(Boolean)]),
    provenance,
    analysis_file: existing?.analysis_file || existing?.analysisFile || repo.analysis_file || repo.analysisFile || null,
    repo: {
      url: repo.url || existing?.repo?.url || `https://github.com/${key}`,
      owner: repo.owner || existing?.repo?.owner || key.split("/")[0],
      name: repo.name || existing?.repo?.name || key.split("/")[1],
    },
  };
  ledger.set(key, record);
  return { record, isNew: !existing };
}

export function filterNewProjectCandidates(candidates = [], ledger = new Map(), { seenAt = new Date().toISOString() } = {}) {
  const accepted = [];
  const reuse = [];
  const skipped = [];
  for (const candidate of candidates) {
    const { record } = upsertProjectSeen(ledger, candidate, { seenAt });
    if (record && isProjectDone(record)) {
      reuse.push(markAlreadyAnalyzed(candidate, record));
      continue;
    }
    accepted.push(candidate);
  }
  return { accepted, reuse, skipped };
}

function markAlreadyAnalyzed(candidate, record = {}) {
  const repo = candidate.raw || {};
  return {
    ...candidate,
    raw: {
      ...repo,
      alreadyAnalyzed: true,
      alreadyAnalyzedStatus: record.status || "analyzed",
      analysisFile: repo.analysisFile || repo.analysis_file || record.analysis_file || record.analysisFile || null,
      ...(record.status === "deep_dived" ? { alreadyDeepDived: true } : {}),
    },
    alreadyAnalyzed: true,
    needsAnalysis: false,
    ledgerRecord: {
      full_name: record.full_name,
      status: record.status,
      analysis_file: record.analysis_file || record.analysisFile || null,
    },
  };
}

function provenanceFromCandidate(candidate = {}, seenAt) {
  return [{
    source: candidate.source || "projects",
    seen_at: candidate.discoveredAt || seenAt,
  }];
}

function mergeProvenance(left = [], right = []) {
  const byKey = new Map();
  for (const item of [...asArray(left), ...asArray(right)]) {
    if (!item || typeof item !== "object") continue;
    const source = String(item.source || "").trim();
    if (!source) continue;
    const key = `${source}|${item.window || ""}|${item.query || ""}|${item.url || ""}`;
    byKey.set(key, {
      ...byKey.get(key),
      ...item,
      source,
    });
  }
  return [...byKey.values()].sort((leftItem, rightItem) => String(leftItem.source).localeCompare(String(rightItem.source)));
}

function normalizeRepoFullName(value = "") {
  const raw = String(value || "")
    .trim()
    .replace(/^github\.com\//i, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "");
  const match = raw.match(/^([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  if (!match) return "";
  return `${match[1]}/${match[2]}`.toLowerCase();
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
