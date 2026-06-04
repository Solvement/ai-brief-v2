#!/usr/bin/env node
// Daily HF paper curation pipeline (Kevin spec 2026-06-04) — STEP 1: fetch + dedupe + ledger.
//   fetch daily/weekly/monthly HF rankings → merge → dedupe against data/papers/ledger.jsonl
//   → write data/papers/YYYY-MM-DD-candidates.json → update ledger (new papers = status "new";
//   reappearances only widen all_seen_sources). Scoring + 1-3 deep / 5-10 radar selection +
//   content/radar markdown land in step 2.
// Deterministic + idempotent. Run: node scripts/columns/papers/curate.mjs [--limit N]

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllWindows } from "./hf-source.mjs";
import { readLedger, writeLedger, upsertSeen, ledgerKey, isDone } from "./ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAPERS_DIR = path.join(ROOT, "data", "papers");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const limitArg = arg("--limit", "");
  const limit = limitArg ? Number(limitArg) : undefined; // undefined → per-window defaults (100/200/400)

  console.log(`[curate] fetching HF daily/weekly/monthly${limit ? ` (limit ${limit}/window)` : " (publishedAt, upvote-ranked)"}…`);
  const { byWindow, merged } = fetchAllWindows({ now, limit });
  console.log(`[curate] daily ${byWindow.daily.length} · weekly ${byWindow.weekly.length} · monthly ${byWindow.monthly.length} → merged ${merged.length} unique`);

  const ledger = await readLedger();
  const candidates = [];
  let freshCount = 0;
  let doneSkipped = 0;

  // primary window for first_seen_source: daily > weekly > monthly
  const primaryWindow = (windows) => ["daily", "weekly", "monthly"].find((w) => windows.includes(w));

  for (const item of merged) {
    const source = primaryWindow(item.windows);
    const { record, isNew } = upsertSeen(ledger, item, { date, source });
    // widen all_seen_sources with every window this paper showed up in today
    const sources = new Set([...(record.all_seen_sources || []), ...item.windows]);
    record.all_seen_sources = [...sources];
    if (isNew) freshCount += 1;

    const done = isDone(record);
    if (done) doneSkipped += 1;

    candidates.push({
      ...item,
      ledger_key: ledgerKey(item),
      ledger_status: record.status,
      is_new: isNew,
      already_done: done, // deep_read/analyzed/published — exclude from new-candidate selection
      first_seen_date: record.first_seen_date,
    });
  }

  // surface order: fresh first, then by upvotes (popularity is a tiebreak signal, not the ranker)
  candidates.sort((a, b) => Number(b.is_new) - Number(a.is_new) || b.upvotes - a.upvotes);

  await mkdir(PAPERS_DIR, { recursive: true });
  const outFile = path.join(PAPERS_DIR, `${date}-candidates.json`);
  await writeFile(outFile, JSON.stringify({
    date,
    generatedAt: now.toISOString(),
    source: "huggingface daily papers (hf CLI)",
    counts: {
      daily: byWindow.daily.length,
      weekly: byWindow.weekly.length,
      monthly: byWindow.monthly.length,
      merged: merged.length,
      new: freshCount,
      already_done: doneSkipped,
    },
    candidates,
  }, null, 2) + "\n", "utf8");

  await writeLedger(ledger);

  console.log(`[curate] ${freshCount} new · ${candidates.length - freshCount} seen-before · ${doneSkipped} already deep-read/analyzed (excluded from new selection)`);
  console.log(`[curate] wrote ${path.relative(ROOT, outFile)} + updated ledger (${ledger.size} total)`);
}

main().catch((err) => {
  console.error(`[curate] FAILED: ${err.message}`);
  process.exitCode = 1;
});
