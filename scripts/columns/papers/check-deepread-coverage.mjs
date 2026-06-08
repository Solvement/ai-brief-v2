#!/usr/bin/env node
// DURABLE detection for the silent paper deep-read failure.
//
// The boot's deep-read authoring (`claude -p`, scripts in boot-daily.ps1) is BEST-EFFORT /
// non-fatal: when it fails the deterministic pipeline still publishes, so a deep-read gap is
// INVISIBLE. On 2026-06-07/08 the authoring silently failed for 2 days — the HF curator kept
// SELECTING papers for deep-read but none were authored, and nothing alerted. This script makes
// that gap detectable: it compares what was SELECTED for deep-read (data/papers/<date>-selection.json
// `deep[]`) vs what actually got AUTHORED + published (public/data/papers-index.json `deepReads`),
// writes a visible health file (public/data/papers-deepread-health.json, deploys with the site),
// and exits non-zero when there is a gap so the boot can retry / alert.
//
// Run it AFTER build-index (in the daily pipeline / boot). Read-only except the health file.

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAPERS_DIR = path.join(ROOT, "data", "papers");
const INDEX = path.join(ROOT, "public", "data", "papers-index.json");
const HEALTH = path.join(ROOT, "public", "data", "papers-deepread-health.json");
const LOOKBACK_DAYS = Number(process.env.DEEPREAD_COVERAGE_LOOKBACK_DAYS) || 7;

function baseArxiv(value) {
  const match = /(\d{4}\.\d{4,5})/.exec(String(value || ""));
  return match ? match[1] : "";
}

// Pure core (testable): given the index deepReads + selections-by-date, compute the coverage gap.
export function computeCoverage(deepReads = [], selectionsByDate = {}, { now = () => new Date(), lookbackDays = LOOKBACK_DAYS } = {}) {
  const deepReadIds = new Set(deepReads.map((d) => baseArxiv(d.arxiv_id)).filter(Boolean));
  const latestDeepReadDate = deepReads
    .map((d) => String(d.first_seen_date || d.date || "").slice(0, 10))
    .filter(Boolean)
    .sort()
    .pop() || null;

  const cutoff = new Date(now().getTime() - lookbackDays * 864e5).toISOString().slice(0, 10);
  const ungenerated = [];
  let latestSelectionDate = null;
  for (const date of Object.keys(selectionsByDate).sort()) {
    if (date < cutoff) continue;
    const deepPicks = Array.isArray(selectionsByDate[date]) ? selectionsByDate[date] : [];
    if (deepPicks.length) latestSelectionDate = date;
    for (const pick of deepPicks) {
      const aid = baseArxiv(pick.arxiv_id || pick.id);
      if (aid && !deepReadIds.has(aid)) {
        ungenerated.push({ selectedDate: date, arxiv_id: aid, title: String(pick.title || "").slice(0, 120) });
      }
    }
  }

  const lagDays = latestSelectionDate && latestDeepReadDate
    ? Math.round((Date.parse(latestSelectionDate) - Date.parse(latestDeepReadDate)) / 864e5)
    : 0;
  const ok = ungenerated.length === 0;
  return { latestDeepReadDate, latestSelectionDate, lagDays, ok, ungenerated };
}

export async function checkDeepReadCoverage({ now = () => new Date() } = {}) {
  const idx = JSON.parse(await readFile(INDEX, "utf8"));
  const deepReads = Array.isArray(idx.deepReads) ? idx.deepReads : [];

  let files = [];
  try {
    files = (await readdir(PAPERS_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}-selection\.json$/.test(f)).sort();
  } catch { /* no selections yet */ }
  const selectionsByDate = {};
  for (const file of files) {
    try {
      const sel = JSON.parse(await readFile(path.join(PAPERS_DIR, file), "utf8"));
      selectionsByDate[file.slice(0, 10)] = Array.isArray(sel.deep) ? sel.deep : [];
    } catch { /* skip unreadable selection */ }
  }

  const { latestDeepReadDate, latestSelectionDate, lagDays, ok, ungenerated } =
    computeCoverage(deepReads, selectionsByDate, { now, lookbackDays: LOOKBACK_DAYS });
  return {
    generatedAt: now().toISOString(),
    ok,
    lookbackDays: LOOKBACK_DAYS,
    latestSelectionDate,
    latestDeepReadDate,
    lagDays,
    ungeneratedCount: ungenerated.length,
    ungenerated: ungenerated.slice(0, 50),
    note: ok
      ? "深读覆盖正常:近期被选中深读的论文都已产出并发布。"
      : `深读静默失败检测:近 ${LOOKBACK_DAYS} 天有 ${ungenerated.length} 篇被选中深读却未产出/未发布(深读最新 ${latestDeepReadDate || "无"}, 选题最新 ${latestSelectionDate || "无"}, 落后 ${lagDays} 天)。boot 的 claude -p 深读授权那几天可能失败了——应重跑 papers:deepread + cold-audit。`,
  };
}

async function main() {
  const health = await checkDeepReadCoverage();
  await writeFile(HEALTH, `${JSON.stringify(health, null, 2)}\n`, "utf8");
  if (health.ok) {
    console.log(`[deepread-coverage] ✓ 覆盖正常(深读最新 ${health.latestDeepReadDate})`);
  } else {
    console.warn(`[deepread-coverage] ✗ ${health.ungeneratedCount} 篇选中未深读(落后 ${health.lagDays} 天) — 见 public/data/papers-deepread-health.json`);
    for (const item of health.ungenerated.slice(0, 10)) {
      console.warn(`  - ${item.selectedDate} ${item.arxiv_id} ${item.title}`);
    }
    process.exitCode = 1;
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
