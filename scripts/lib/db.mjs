import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

export const DEFAULT_DB_PATH = path.join(ROOT, "data", "ai-brief.db");
export const SQLITE_SCHEMA_VERSION = 2;

export const SQLITE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  "column" TEXT NOT NULL,
  source TEXT NOT NULL,
  raw TEXT NOT NULL CHECK (json_valid(raw)),
  dedupe_key TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  UNIQUE ("column", dedupe_key)
);

CREATE TABLE IF NOT EXISTS evidence (
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT CHECK (metadata IS NULL OR json_valid(metadata)),
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (candidate_id, kind)
);

CREATE TABLE IF NOT EXISTS evals (
  candidate_id TEXT PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  mode TEXT NOT NULL,
  score REAL,
  signals TEXT NOT NULL CHECK (json_valid(signals)),
  reason TEXT NOT NULL,
  evaluated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  model TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qa_verdicts (
  analysis_id TEXT PRIMARY KEY REFERENCES analyses(id) ON DELETE CASCADE,
  structural_pass INTEGER NOT NULL CHECK (structural_pass IN (0, 1)),
  grounded_score REAL,
  flags TEXT NOT NULL CHECK (json_valid(flags)),
  verdict TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  "column" TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  metrics TEXT NOT NULL CHECK (json_valid(metrics)),
  ran_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidates_column_discovered ON candidates("column", discovered_at);
CREATE INDEX IF NOT EXISTS idx_evidence_candidate ON evidence(candidate_id);
CREATE INDEX IF NOT EXISTS idx_analyses_candidate_tier ON analyses(candidate_id, tier);
CREATE INDEX IF NOT EXISTS idx_runs_column_ran ON runs("column", ran_at);
PRAGMA user_version = ${SQLITE_SCHEMA_VERSION};
`;

export async function sqliteDriverDecision() {
  const driver = await loadSqliteDriver();
  return {
    name: driver.name,
    nodeMajor: Number(process.versions.node.split(".")[0]),
    reason: driver.name === "node:sqlite"
      ? "Node >= 22: using built-in node:sqlite"
      : "Node < 22: using better-sqlite3 fallback",
  };
}

export async function openAiBriefDb(dbPath = DEFAULT_DB_PATH, options = {}) {
  const driver = await loadSqliteDriver(options);
  if (dbPath !== ":memory:") await mkdir(path.dirname(dbPath), { recursive: true });
  const connection = new driver.Database(dbPath);
  applyConcurrencyPragmas(connection, dbPath);
  const db = new AiBriefDb(connection, { dbPath, driverName: driver.name });
  if (options.init !== false) db.initSchema();
  return db;
}

// Concurrency hardening: the daily pipeline now authors project deep-dives in
// PARALLEL (scripts/columns/projects/codex-deepdive.mjs), so several writers can
// hit this one file at once. WAL lets readers and a writer coexist and avoids the
// "database is locked" SQLITE_BUSY that a default rollback journal throws under
// concurrent writes; busy_timeout makes any remaining contention block-and-retry
// (up to 10s) instead of failing immediately. WAL is a no-op for :memory:.
function applyConcurrencyPragmas(connection, dbPath) {
  try {
    if (dbPath !== ":memory:") connection.exec("PRAGMA journal_mode=WAL;");
    connection.exec("PRAGMA busy_timeout=10000;");
  } catch {
    // Pragmas are best-effort tuning; a driver that rejects them must not block
    // opening the DB. Writes still work, just without the concurrency cushion.
  }
}

async function loadSqliteDriver({ preferBuiltin = true } = {}) {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (preferBuiltin && nodeMajor >= 22) {
    const sqlite = await import("node:sqlite");
    return { name: "node:sqlite", Database: sqlite.DatabaseSync };
  }

  try {
    const betterSqlite = await import("better-sqlite3");
    return { name: "better-sqlite3", Database: betterSqlite.default || betterSqlite };
  } catch (error) {
    throw new Error(`SQLite driver unavailable: use Node >= 22 for node:sqlite or install better-sqlite3 (${error.message})`);
  }
}

export class AiBriefDb {
  constructor(connection, { dbPath, driverName }) {
    this.connection = connection;
    this.path = dbPath;
    this.driverName = driverName;
  }

  initSchema() {
    this.connection.exec(SQLITE_SCHEMA);
    this.ensureSchemaCompatibility();
    return this;
  }

  ensureSchemaCompatibility() {
    const evidenceColumns = new Set(this.connection.prepare("PRAGMA table_info(evidence)").all().map((row) => row.name));
    if (!evidenceColumns.has("metadata")) {
      this.connection.exec("ALTER TABLE evidence ADD COLUMN metadata TEXT CHECK (metadata IS NULL OR json_valid(metadata))");
    }
    this.connection.exec(`PRAGMA user_version = ${SQLITE_SCHEMA_VERSION}`);
  }

  close() {
    this.connection.close();
  }

  transaction(fn) {
    this.connection.exec("BEGIN");
    try {
      const result = fn(this);
      this.connection.exec("COMMIT");
      return result;
    } catch (error) {
      this.connection.exec("ROLLBACK");
      throw error;
    }
  }

  upsertCandidate(candidate) {
    const now = nowIso();
    const row = {
      id: candidate.id || randomUUID(),
      column: candidate.column,
      source: candidate.source,
      raw: encodeJson(candidate.raw ?? {}),
      dedupeKey: candidate.dedupeKey || candidate.dedupe_key || candidate.id,
      discoveredAt: candidate.discoveredAt || candidate.discovered_at || now,
    };
    requireFields(row, ["id", "column", "source", "dedupeKey", "discoveredAt"], "candidate");
    this.connection.prepare(`
      INSERT INTO candidates (id, "column", source, raw, dedupe_key, discovered_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        "column" = excluded."column",
        source = excluded.source,
        raw = excluded.raw,
        dedupe_key = excluded.dedupe_key,
        discovered_at = excluded.discovered_at
    `).run(row.id, row.column, row.source, row.raw, row.dedupeKey, row.discoveredAt);
    return this.getCandidate(row.id);
  }

  getCandidate(id) {
    return decodeCandidate(this.connection.prepare(`
      SELECT id, "column", source, raw, dedupe_key, discovered_at
      FROM candidates
      WHERE id = ?
    `).get(id));
  }

  listCandidates({ column, source, limit = 100 } = {}) {
    const filters = [];
    const args = [];
    if (column) {
      filters.push('"column" = ?');
      args.push(column);
    }
    if (source) {
      filters.push("source = ?");
      args.push(source);
    }
    args.push(limit);
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    return this.connection.prepare(`
      SELECT id, "column", source, raw, dedupe_key, discovered_at
      FROM candidates
      ${where}
      ORDER BY discovered_at DESC
      LIMIT ?
    `).all(...args).map(decodeCandidate);
  }

  upsertEvidence(evidence) {
    const metadata = evidence.metadata !== undefined
      ? evidence.metadata
      : evidence.artifactAudit !== undefined
        ? { artifactAudit: evidence.artifactAudit }
        : null;
    const row = {
      candidateId: evidence.candidateId || evidence.candidate_id,
      kind: evidence.kind,
      content: evidence.content,
      metadata: metadata == null ? null : encodeJson(metadata),
      fetchedAt: evidence.fetchedAt || evidence.fetched_at || nowIso(),
    };
    requireFields(row, ["candidateId", "kind", "content", "fetchedAt"], "evidence");
    this.connection.prepare(`
      INSERT INTO evidence (candidate_id, kind, content, metadata, fetched_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(candidate_id, kind) DO UPDATE SET
        content = excluded.content,
        metadata = excluded.metadata,
        fetched_at = excluded.fetched_at
    `).run(row.candidateId, row.kind, row.content, row.metadata, row.fetchedAt);
    return this.getEvidence(row.candidateId, row.kind);
  }

  getEvidence(candidateId, kind) {
    return decodeEvidence(this.connection.prepare(`
      SELECT candidate_id, kind, content, metadata, fetched_at
      FROM evidence
      WHERE candidate_id = ? AND kind = ?
    `).get(candidateId, kind));
  }

  listEvidence(candidateId) {
    return this.connection.prepare(`
      SELECT candidate_id, kind, content, metadata, fetched_at
      FROM evidence
      WHERE candidate_id = ?
      ORDER BY kind
    `).all(candidateId).map(decodeEvidence);
  }

  upsertEval(evaluation) {
    const row = {
      candidateId: evaluation.candidateId || evaluation.candidate_id,
      decision: evaluation.decision,
      mode: evaluation.mode,
      score: evaluation.score ?? null,
      signals: encodeJson(evaluation.signals ?? []),
      reason: evaluation.reason || "",
      evaluatedAt: evaluation.evaluatedAt || evaluation.evaluated_at || nowIso(),
    };
    requireFields(row, ["candidateId", "decision", "mode", "reason", "evaluatedAt"], "eval");
    this.connection.prepare(`
      INSERT INTO evals (candidate_id, decision, mode, score, signals, reason, evaluated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(candidate_id) DO UPDATE SET
        decision = excluded.decision,
        mode = excluded.mode,
        score = excluded.score,
        signals = excluded.signals,
        reason = excluded.reason,
        evaluated_at = excluded.evaluated_at
    `).run(row.candidateId, row.decision, row.mode, row.score, row.signals, row.reason, row.evaluatedAt);
    return this.getEval(row.candidateId);
  }

  getEval(candidateId) {
    return decodeEval(this.connection.prepare(`
      SELECT candidate_id, decision, mode, score, signals, reason, evaluated_at
      FROM evals
      WHERE candidate_id = ?
    `).get(candidateId));
  }

  insertAnalysis(analysis) {
    const row = {
      id: analysis.id || randomUUID(),
      candidateId: analysis.candidateId || analysis.candidate_id,
      tier: analysis.tier,
      payload: encodeJson(analysis.payload ?? {}),
      model: analysis.model,
      generatedAt: analysis.generatedAt || analysis.generated_at || nowIso(),
    };
    requireFields(row, ["id", "candidateId", "tier", "model", "generatedAt"], "analysis");
    this.connection.prepare(`
      INSERT INTO analyses (id, candidate_id, tier, payload, model, generated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(row.id, row.candidateId, row.tier, row.payload, row.model, row.generatedAt);
    return this.getAnalysis(row.id);
  }

  getAnalysis(id) {
    return decodeAnalysis(this.connection.prepare(`
      SELECT id, candidate_id, tier, payload, model, generated_at
      FROM analyses
      WHERE id = ?
    `).get(id));
  }

  listAnalyses(candidateId) {
    return this.connection.prepare(`
      SELECT id, candidate_id, tier, payload, model, generated_at
      FROM analyses
      WHERE candidate_id = ?
      ORDER BY generated_at DESC
    `).all(candidateId).map(decodeAnalysis);
  }

  upsertQaVerdict(verdict) {
    const row = {
      analysisId: verdict.analysisId || verdict.analysis_id,
      structuralPass: verdict.structuralPass ?? verdict.structural_pass,
      groundedScore: verdict.groundedScore ?? verdict.grounded_score ?? null,
      flags: encodeJson(verdict.flags ?? []),
      verdict: verdict.verdict,
    };
    requireFields(row, ["analysisId", "structuralPass", "verdict"], "qa verdict");
    this.connection.prepare(`
      INSERT INTO qa_verdicts (analysis_id, structural_pass, grounded_score, flags, verdict)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(analysis_id) DO UPDATE SET
        structural_pass = excluded.structural_pass,
        grounded_score = excluded.grounded_score,
        flags = excluded.flags,
        verdict = excluded.verdict
    `).run(row.analysisId, row.structuralPass ? 1 : 0, row.groundedScore, row.flags, row.verdict);
    return this.getQaVerdict(row.analysisId);
  }

  getQaVerdict(analysisId) {
    return decodeQaVerdict(this.connection.prepare(`
      SELECT analysis_id, structural_pass, grounded_score, flags, verdict
      FROM qa_verdicts
      WHERE analysis_id = ?
    `).get(analysisId));
  }

  recordRun(run) {
    const row = {
      id: run.id || randomUUID(),
      column: run.column,
      stage: run.stage,
      status: run.status,
      metrics: encodeJson(run.metrics ?? {}),
      ranAt: run.ranAt || run.ran_at || nowIso(),
    };
    requireFields(row, ["id", "column", "stage", "status", "ranAt"], "run");
    this.connection.prepare(`
      INSERT INTO runs (id, "column", stage, status, metrics, ran_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        "column" = excluded."column",
        stage = excluded.stage,
        status = excluded.status,
        metrics = excluded.metrics,
        ran_at = excluded.ran_at
    `).run(row.id, row.column, row.stage, row.status, row.metrics, row.ranAt);
    return this.getRun(row.id);
  }

  getRun(id) {
    return decodeRun(this.connection.prepare(`
      SELECT id, "column", stage, status, metrics, ran_at
      FROM runs
      WHERE id = ?
    `).get(id));
  }

  listRuns({ column, limit = 50 } = {}) {
    const args = [];
    const where = column ? 'WHERE "column" = ?' : "";
    if (column) args.push(column);
    args.push(limit);
    return this.connection.prepare(`
      SELECT id, "column", stage, status, metrics, ran_at
      FROM runs
      ${where}
      ORDER BY ran_at DESC
      LIMIT ?
    `).all(...args).map(decodeRun);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function encodeJson(value) {
  return JSON.stringify(value);
}

function decodeJson(value, fallback) {
  if (value == null || value === "") return fallback;
  return JSON.parse(value);
}

function requireFields(row, fields, label) {
  const missing = fields.filter((field) => row[field] === undefined || row[field] === null || row[field] === "");
  if (missing.length) throw new Error(`Missing ${label} field(s): ${missing.join(", ")}`);
}

function decodeCandidate(row) {
  if (!row) return null;
  return {
    id: row.id,
    column: row.column,
    source: row.source,
    raw: decodeJson(row.raw, {}),
    dedupeKey: row.dedupe_key,
    discoveredAt: row.discovered_at,
  };
}

function decodeEvidence(row) {
  if (!row) return null;
  const metadata = decodeJson(row.metadata, null);
  return {
    candidateId: row.candidate_id,
    kind: row.kind,
    content: row.content,
    ...(metadata == null ? {} : { metadata }),
    ...(metadata?.artifactAudit ? { artifactAudit: metadata.artifactAudit } : {}),
    fetchedAt: row.fetched_at,
  };
}

function decodeEval(row) {
  if (!row) return null;
  return {
    candidateId: row.candidate_id,
    decision: row.decision,
    mode: row.mode,
    score: row.score,
    signals: decodeJson(row.signals, []),
    reason: row.reason,
    evaluatedAt: row.evaluated_at,
  };
}

function decodeAnalysis(row) {
  if (!row) return null;
  return {
    id: row.id,
    candidateId: row.candidate_id,
    tier: row.tier,
    payload: decodeJson(row.payload, {}),
    model: row.model,
    generatedAt: row.generated_at,
  };
}

function decodeQaVerdict(row) {
  if (!row) return null;
  return {
    analysisId: row.analysis_id,
    structuralPass: Boolean(row.structural_pass),
    groundedScore: row.grounded_score,
    flags: decodeJson(row.flags, []),
    verdict: row.verdict,
  };
}

function decodeRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    column: row.column,
    stage: row.stage,
    status: row.status,
    metrics: decodeJson(row.metrics, {}),
    ranAt: row.ran_at,
  };
}
