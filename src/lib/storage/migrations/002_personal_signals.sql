-- Migration 002: personal_signals — Kevin's per-item feedback layer.
-- See src/lib/personal/signals.ts for the matching TypeScript shape.

CREATE TABLE IF NOT EXISTS personal_signals (
  content_id TEXT PRIMARY KEY REFERENCES content_items (id) ON DELETE CASCADE,
  evaluation_rating TEXT,                  -- accurate | wrong | shallow | insightful | NULL
  override_takeaway TEXT,
  override_action TEXT,
  saved_to_kb INTEGER NOT NULL DEFAULT 0,  -- 0 / 1
  acted_on_at TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_personal_signals_saved ON personal_signals (saved_to_kb);
CREATE INDEX IF NOT EXISTS idx_personal_signals_acted ON personal_signals (acted_on_at);
