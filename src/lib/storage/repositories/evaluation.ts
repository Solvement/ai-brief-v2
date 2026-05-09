import type { EvaluationResult } from "../../ai/evaluation/schema";
import { openDb, type DatabaseInstance } from "../db";

interface EvaluationRow {
  cache_key: string;
  content_id: string | null;
  prompt_version: string;
  model: string | null;
  cached_at: string;
  payload: string;
}

export interface PutEvaluationInput {
  cacheKey: string;
  contentId?: string | null;
  model?: string | null;
  result: EvaluationResult;
}

export function getEvaluationByCacheKey(
  cacheKey: string,
  db: DatabaseInstance = openDb(),
): EvaluationResult | null {
  const row = db
    .prepare("SELECT * FROM evaluations WHERE cache_key = ?")
    .get(cacheKey) as EvaluationRow | undefined;
  return row ? (JSON.parse(row.payload) as EvaluationResult) : null;
}

export function putEvaluation(input: PutEvaluationInput, db: DatabaseInstance = openDb()): void {
  db.prepare(
    `INSERT INTO evaluations (cache_key, content_id, prompt_version, model, cached_at, payload)
     VALUES (@cache_key, @content_id, @prompt_version, @model, datetime('now'), @payload)
     ON CONFLICT (cache_key) DO UPDATE SET
       content_id = excluded.content_id,
       prompt_version = excluded.prompt_version,
       model = excluded.model,
       cached_at = excluded.cached_at,
       payload = excluded.payload`,
  ).run({
    cache_key: input.cacheKey,
    content_id: input.contentId ?? null,
    prompt_version: input.result.prompt_version,
    model: input.model ?? null,
    payload: JSON.stringify(input.result),
  });
}

export function listEvaluationsForContent(
  contentId: string,
  db: DatabaseInstance = openDb(),
): EvaluationResult[] {
  const rows = db
    .prepare("SELECT * FROM evaluations WHERE content_id = ? ORDER BY cached_at DESC")
    .all(contentId) as unknown as EvaluationRow[];
  return rows.map((row) => JSON.parse(row.payload) as EvaluationResult);
}

export function listStaleEvaluations(
  currentPromptVersion: string,
  db: DatabaseInstance = openDb(),
): EvaluationRow[] {
  return db
    .prepare("SELECT * FROM evaluations WHERE prompt_version != ?")
    .all(currentPromptVersion) as unknown as EvaluationRow[];
}

export function clearEvaluations(db: DatabaseInstance = openDb()): number {
  const result = db.prepare("DELETE FROM evaluations").run();
  return Number(result.changes);
}
