import type {
  ActionLabel,
  AnyContentItem,
  ContentLanguage,
  ContentStatus,
  ContentTag,
  ContentType,
  Difficulty,
} from "../../content/types";
import { openDb, runInTransaction, type DatabaseInstance } from "../db";

interface ContentItemRow {
  id: string;
  slug: string;
  title: string;
  content_type: ContentType;
  category: string;
  status: ContentStatus;
  language: ContentLanguage;
  impact_score: number;
  readability_score: number;
  actionability_score: number;
  confidence_score: number;
  recommended_action: ActionLabel;
  difficulty: Difficulty;
  reading_time_minutes: number;
  source_name: string;
  source_url: string;
  canonical_url: string | null;
  author: string | null;
  published_at: string | null;
  collected_at: string;
  payload: string;
  created_at: string;
  updated_at: string;
}

type SqlParams = Record<string, string | number | null>;

function rowToItem(row: ContentItemRow): AnyContentItem {
  return JSON.parse(row.payload) as AnyContentItem;
}

const upsertContent = `
  INSERT INTO content_items (
    id, slug, title, content_type, category, status, language,
    impact_score, readability_score, actionability_score, confidence_score,
    recommended_action, difficulty, reading_time_minutes,
    source_name, source_url, canonical_url, author, published_at, collected_at,
    payload, updated_at
  ) VALUES (
    @id, @slug, @title, @content_type, @category, @status, @language,
    @impact_score, @readability_score, @actionability_score, @confidence_score,
    @recommended_action, @difficulty, @reading_time_minutes,
    @source_name, @source_url, @canonical_url, @author, @published_at, @collected_at,
    @payload, datetime('now')
  )
  ON CONFLICT (id) DO UPDATE SET
    slug = excluded.slug,
    title = excluded.title,
    content_type = excluded.content_type,
    category = excluded.category,
    status = excluded.status,
    language = excluded.language,
    impact_score = excluded.impact_score,
    readability_score = excluded.readability_score,
    actionability_score = excluded.actionability_score,
    confidence_score = excluded.confidence_score,
    recommended_action = excluded.recommended_action,
    difficulty = excluded.difficulty,
    reading_time_minutes = excluded.reading_time_minutes,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    canonical_url = excluded.canonical_url,
    author = excluded.author,
    published_at = excluded.published_at,
    collected_at = excluded.collected_at,
    payload = excluded.payload,
    updated_at = datetime('now')
`;

function upsertContentItemWithoutTransaction(item: AnyContentItem, db: DatabaseInstance): void {
  db.prepare(upsertContent).run({
    id: item.id,
    slug: item.slug,
    title: item.title,
    content_type: item.content_type,
    category: item.category,
    status: item.status,
    language: item.language,
    impact_score: item.impact_score,
    readability_score: item.readability_score,
    actionability_score: item.actionability_score,
    confidence_score: item.confidence_score,
    recommended_action: item.recommended_action,
    difficulty: item.difficulty,
    reading_time_minutes: item.reading_time_minutes,
    source_name: item.source_name,
    source_url: item.source_url,
    canonical_url: item.canonical_url ?? null,
    author: item.author ?? null,
    published_at: item.published_at ?? null,
    collected_at: item.collected_at,
    payload: JSON.stringify(item),
  });

  db.prepare("DELETE FROM content_tags WHERE content_id = ?").run(item.id);
  const insertTag = db.prepare("INSERT INTO content_tags (content_id, tag) VALUES (?, ?)");
  for (const tag of item.tags) {
    insertTag.run(item.id, tag);
  }
}

export function upsertContentItem(item: AnyContentItem, db: DatabaseInstance = openDb()): void {
  runInTransaction(db, () => upsertContentItemWithoutTransaction(item, db));
}

export function bulkUpsertContent(items: AnyContentItem[], db: DatabaseInstance = openDb()): number {
  runInTransaction(db, () => {
    for (const record of items) upsertContentItemWithoutTransaction(record, db);
  });
  return items.length;
}

export function getContentItem(id: string, db: DatabaseInstance = openDb()): AnyContentItem | null {
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(id) as ContentItemRow | undefined;
  return row ? rowToItem(row) : null;
}

export function getContentBySlug(slug: string, db: DatabaseInstance = openDb()): AnyContentItem | null {
  const row = db.prepare("SELECT * FROM content_items WHERE slug = ?").get(slug) as ContentItemRow | undefined;
  return row ? rowToItem(row) : null;
}

export interface ListContentOptions {
  status?: ContentStatus;
  contentType?: ContentType;
  recommendedAction?: ActionLabel;
  tag?: ContentTag;
  limit?: number;
  orderBy?: "decision_value" | "collected_at" | "impact_score";
}

const decisionValueExpr = `
  (impact_score * 0.38)
  + (confidence_score * 0.24)
  + (actionability_score * 0.24)
  + (readability_score * 0.14)
`;

export function listContent(options: ListContentOptions = {}, db: DatabaseInstance = openDb()): AnyContentItem[] {
  const where: string[] = [];
  const params: SqlParams = {};
  if (options.status) {
    where.push("status = @status");
    params.status = options.status;
  }
  if (options.contentType) {
    where.push("content_type = @content_type");
    params.content_type = options.contentType;
  }
  if (options.recommendedAction) {
    where.push("recommended_action = @recommended_action");
    params.recommended_action = options.recommendedAction;
  }
  if (options.tag) {
    where.push("id IN (SELECT content_id FROM content_tags WHERE tag = @tag)");
    params.tag = options.tag;
  }

  const orderClause =
    options.orderBy === "collected_at"
      ? "ORDER BY collected_at DESC"
      : options.orderBy === "impact_score"
        ? "ORDER BY impact_score DESC"
        : `ORDER BY (${decisionValueExpr}) DESC`;
  const limitClause = options.limit && options.limit > 0 ? `LIMIT ${Math.floor(options.limit)}` : "";
  const sql = `SELECT * FROM content_items ${where.length > 0 ? "WHERE " + where.join(" AND ") : ""} ${orderClause} ${limitClause}`.trim();

  const rows = db.prepare(sql).all(params) as unknown as ContentItemRow[];
  return rows.map(rowToItem);
}

export function deleteContentItem(id: string, db: DatabaseInstance = openDb()): boolean {
  const result = db.prepare("DELETE FROM content_items WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

export function countContent(db: DatabaseInstance = openDb()): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM content_items").get() as { count: number } | undefined;
  return row?.count ?? 0;
}
