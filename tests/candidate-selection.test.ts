import { selectDiverseRowsForEvaluation } from "../src/lib/ingestion/candidate-selection";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const selected = selectDiverseRowsForEvaluation(
  [
    { column: "news", source_id: "source-a", rows: ["a1", "a2", "a3", "a4"] },
    { column: "news", source_id: "source-b", rows: ["b1", "b2"] },
    { column: "news", source_id: "source-c", rows: ["c1"] },
  ],
  { news: 2 },
  2,
);

const flatRows = selected.flatMap((batch) => batch.rows);
assert(flatRows.length === 4, "selection should cap rows to column limit times multiplier");
assert(flatRows.includes("a1"), "selection should keep the first source");
assert(flatRows.includes("b1"), "selection should include later sources before taking all rows from the first source");
assert(flatRows.includes("c1"), "selection should include all available sources when possible");
assert(!flatRows.includes("a4"), "selection should not let one source dominate the candidate pool");

const deduped = selectDiverseRowsForEvaluation(
  [
    {
      column: "projects",
      source_id: "daily",
      rows: [
        { title: "same/repo", url: "https://github.com/same/repo" },
        { title: "daily/next", url: "https://github.com/daily/next" },
      ],
    },
    {
      column: "projects",
      source_id: "weekly",
      rows: [
        { title: "same/repo", url: "https://github.com/same/repo?tab=readme" },
        { title: "weekly/next", url: "https://github.com/weekly/next" },
      ],
    },
  ],
  { projects: 3 },
  1,
);

const dedupedRows = deduped.flatMap((batch) => batch.rows as Array<{ title: string; url: string }>);
assert(dedupedRows.length === 3, "selection should skip duplicate rows and continue to later candidates");
assert(dedupedRows.some((row) => row.title === "weekly/next"), "selection should use the next row from a source after a duplicate");

console.log("candidate selection tests passed");
