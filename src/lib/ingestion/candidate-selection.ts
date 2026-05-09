import type { IngestionColumn } from "./column-source-policy";

export interface EvaluationCandidateBatch<TRow> {
  column: IngestionColumn;
  source_id: string;
  rows: TRow[];
}

export function selectDiverseRowsForEvaluation<TBatch extends EvaluationCandidateBatch<unknown>>(
  batches: readonly TBatch[],
  columnLimits: Partial<Record<IngestionColumn, number>>,
  multiplier = 2,
): TBatch[] {
  const selectedBySource = new Map<string, unknown[]>();
  const byColumn = groupByColumn(batches);

  for (const [column, columnBatches] of byColumn) {
    const baseLimit = Math.max(1, columnLimits[column] ?? 1);
    const evaluationLimit = Math.max(1, baseLimit * Math.max(1, multiplier));
    const cursorBySource = new Map<string, number>();
    const seenIdentity = new Set<string>();
    let selectedCount = 0;
    let progressed = true;

    while (selectedCount < evaluationLimit && progressed) {
      progressed = false;
      for (const batch of columnBatches) {
        if (selectedCount >= evaluationLimit) break;
        const cursor = cursorBySource.get(batch.source_id) ?? 0;
        const row = batch.rows[cursor];
        if (row === undefined) continue;
        cursorBySource.set(batch.source_id, cursor + 1);
        progressed = true;

        const identity = rowIdentity(row);
        if (identity && seenIdentity.has(identity)) continue;
        if (identity) seenIdentity.add(identity);

        const sourceRows = selectedBySource.get(batch.source_id) ?? [];
        sourceRows.push(row);
        selectedBySource.set(batch.source_id, sourceRows);
        selectedCount += 1;
      }
    }
  }

  return batches
    .map((batch) => ({ ...batch, rows: (selectedBySource.get(batch.source_id) ?? []) as TBatch["rows"] }))
    .filter((batch) => batch.rows.length > 0) as TBatch[];
}

function rowIdentity(row: unknown): string | undefined {
  if (!row || typeof row !== "object") return String(row);
  const record = row as Record<string, unknown>;
  const url = typeof record.canonical_url === "string" ? record.canonical_url : typeof record.url === "string" ? record.url : "";
  if (url) return normalizeIdentity(url);
  const title = typeof record.title === "string" ? record.title : "";
  return title ? normalizeIdentity(title) : undefined;
}

function normalizeIdentity(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function groupByColumn<TBatch extends EvaluationCandidateBatch<unknown>>(batches: readonly TBatch[]): Map<IngestionColumn, TBatch[]> {
  const grouped = new Map<IngestionColumn, TBatch[]>();
  for (const batch of batches) {
    grouped.set(batch.column, [...(grouped.get(batch.column) ?? []), batch]);
  }
  return grouped;
}
