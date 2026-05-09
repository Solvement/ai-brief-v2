-- AI-brief schema, migration 001: content + evaluations + ingestion log.
-- Each table corresponds 1:1 to a TypeScript type in src/lib/content/types.ts
-- or src/lib/ai/evaluation/schema.ts. Complex nested fields are stored as
-- JSON TEXT columns; simple flat fields get their own columns so they can be
-- indexed and filtered.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  language TEXT NOT NULL,

  -- card-level scores (denormalized so we can sort without parsing JSON)
  impact_score INTEGER NOT NULL,
  readability_score INTEGER NOT NULL,
  actionability_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,

  recommended_action TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL,

  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  author TEXT,
  published_at TEXT,
  collected_at TEXT NOT NULL,

  -- The whole shape as JSON. The columns above are projections for indexing.
  payload TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items (status);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items (content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_collected ON content_items (collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_action ON content_items (recommended_action);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id TEXT NOT NULL REFERENCES content_items (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (content_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags (tag);

CREATE TABLE IF NOT EXISTS evaluations (
  -- SHA-256 of (content_type|title|raw_text|model|prompt_version)
  cache_key TEXT PRIMARY KEY,
  content_id TEXT REFERENCES content_items (id) ON DELETE SET NULL,
  prompt_version TEXT NOT NULL,
  model TEXT,
  cached_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evaluations_content ON evaluations (content_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_prompt_version ON evaluations (prompt_version);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  language TEXT NOT NULL,
  reliability_level INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_checked_at TEXT
);

CREATE TABLE IF NOT EXISTS ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_source ON ingestion_log (source_id, created_at DESC);
