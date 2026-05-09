import type { ActionLabel } from "../../content/types";
import type { PersonalSignals } from "../../personal/signals";
import { openDb, type DatabaseInstance } from "../db";

interface SignalRow {
  content_id: string;
  evaluation_rating: PersonalSignals["evaluation_rating"] | null;
  override_takeaway: string | null;
  override_action: ActionLabel | null;
  saved_to_kb: number;
  acted_on_at: string | null;
  notes: string | null;
  updated_at: string;
}

function rowToSignals(row: SignalRow): PersonalSignals {
  return {
    saved_to_kb: row.saved_to_kb === 1,
    updated_at: row.updated_at,
    ...(row.evaluation_rating ? { evaluation_rating: row.evaluation_rating } : {}),
    ...(row.override_takeaway ? { override_takeaway: row.override_takeaway } : {}),
    ...(row.override_action ? { override_action: row.override_action } : {}),
    ...(row.acted_on_at ? { acted_on_at: row.acted_on_at } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

export function readSignalsForContent(
  contentId: string,
  db: DatabaseInstance = openDb(),
): PersonalSignals | null {
  const row = db
    .prepare("SELECT * FROM personal_signals WHERE content_id = ?")
    .get(contentId) as SignalRow | undefined;
  return row ? rowToSignals(row) : null;
}

export function writeSignalsForContent(
  contentId: string,
  partial: Partial<PersonalSignals>,
  db: DatabaseInstance = openDb(),
): PersonalSignals {
  const existing = readSignalsForContent(contentId, db) ?? { saved_to_kb: false, updated_at: new Date(0).toISOString() };
  const merged: PersonalSignals = {
    ...existing,
    ...partial,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO personal_signals (
       content_id, evaluation_rating, override_takeaway, override_action,
       saved_to_kb, acted_on_at, notes, updated_at
     ) VALUES (
       @content_id, @evaluation_rating, @override_takeaway, @override_action,
       @saved_to_kb, @acted_on_at, @notes, @updated_at
     )
     ON CONFLICT (content_id) DO UPDATE SET
       evaluation_rating = excluded.evaluation_rating,
       override_takeaway = excluded.override_takeaway,
       override_action = excluded.override_action,
       saved_to_kb = excluded.saved_to_kb,
       acted_on_at = excluded.acted_on_at,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
  ).run({
    content_id: contentId,
    evaluation_rating: merged.evaluation_rating ?? null,
    override_takeaway: merged.override_takeaway ?? null,
    override_action: merged.override_action ?? null,
    saved_to_kb: merged.saved_to_kb ? 1 : 0,
    acted_on_at: merged.acted_on_at ?? null,
    notes: merged.notes ?? null,
    updated_at: merged.updated_at,
  });

  return merged;
}

export function listAllSignalsByContent(
  db: DatabaseInstance = openDb(),
): Record<string, PersonalSignals> {
  const rows = db.prepare("SELECT * FROM personal_signals").all() as unknown as SignalRow[];
  const result: Record<string, PersonalSignals> = {};
  for (const row of rows) {
    result[row.content_id] = rowToSignals(row);
  }
  return result;
}

export function deleteSignalsForContent(
  contentId: string,
  db: DatabaseInstance = openDb(),
): boolean {
  const result = db.prepare("DELETE FROM personal_signals WHERE content_id = ?").run(contentId);
  return Number(result.changes) > 0;
}
