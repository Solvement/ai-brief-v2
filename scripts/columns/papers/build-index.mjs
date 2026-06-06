#!/usr/bin/env node
// Aggregate the file-based paper corpus into ONE queryable index for the frontend +
// dedup + listing — reconciles "网站从库渲染" while keeping files as the human artifact.
//   deepReads ← content/papers/<slug>/metadata.json (human deep-reads)
//   radar / deepCandidates ← data/papers/<latest>-selection.json
//   board (HF 日/周/月榜) ← data/papers/<latest>-candidates.json (by window, upvote-ranked)
// → public/data/papers-index.json
// Run: node scripts/columns/papers/build-index.mjs

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CONTENT = path.join(ROOT, "content", "papers");
const PAPERS_DATA = path.join(ROOT, "data", "papers");
const OUT = path.join(ROOT, "public", "data", "papers-index.json");
const BOARD_PER_WINDOW = 30;

async function readJson(p, fallback = null) {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return fallback; }
}

async function latestDated(prefixSuffix) {
  // find newest data/papers/YYYY-MM-DD-<suffix>.json
  let files = [];
  try { files = await readdir(PAPERS_DATA); } catch { return null; }
  const re = new RegExp(`^(\\d{4}-\\d{2}-\\d{2})-${prefixSuffix}\\.json$`);
  const dated = files.map((f) => { const m = f.match(re); return m ? { date: m[1], f } : null; }).filter(Boolean);
  dated.sort((a, b) => b.date.localeCompare(a.date));
  return dated[0] ? path.join(PAPERS_DATA, dated[0].f) : null;
}

// Cold-audit gate (CLAUDE.md 红线「禁未过审内容自动落库/上线」): a deep-read that the cold-audit
// gate HELD (or flagged for a human) must NOT ship. Publish only when cold_audit is absent (legacy),
// "grandfathered" (pre-gate corpus), or "ready_to_publish" (passed). "hold"/"needs_human" → excluded.
const COLD_AUDIT_PUBLISHABLE = new Set(["grandfathered", "ready_to_publish"]);

export function coldAuditAllowsPublish(meta) {
  const state = meta?.cold_audit?.status;
  if (!state) return true; // absent = legacy/pre-gate → allowed (back-compat).
  return COLD_AUDIT_PUBLISHABLE.has(state); // "hold"/"needs_human"/unknown → blocked.
}

export async function collectDeepReads(deps = {}) {
  const readdirFn = deps.readdirFn || ((p, o) => readdir(p, o));
  const readJsonFn = deps.readJsonFn || readJson;
  const contentDir = deps.contentDir || CONTENT;
  let dirs = [];
  try { dirs = (await readdirFn(contentDir, { withFileTypes: true })).filter((d) => d.isDirectory()); } catch { return []; }
  const out = [];
  for (const d of dirs) {
    const meta = await readJsonFn(path.join(contentDir, d.name, "metadata.json"));
    if (!meta || meta.status !== "deep_read") continue;
    if (!coldAuditAllowsPublish(meta)) continue; // HELD / needs-human deep-read → never publish.
    out.push({
      slug: d.name,
      arxiv_id: meta.arxiv_id || meta.paper_id || "",
      title: meta.title || d.name,
      date: meta.date || meta.first_seen_date || "",
      authors: (meta.authors || []).slice(0, 6),
      tags: meta.tags || [],
      scores: meta.scores || {},
      source_rankings: meta.source_rankings || [],
      one_sentence_judgment: meta.one_sentence_judgment || "",
      thumbnail_url: meta.arxiv_id ? `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${meta.arxiv_id}.png` : "",
    });
  }
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function boardFromCandidates(cand) {
  const board = { daily: [], weekly: [], monthly: [] };
  if (!cand?.candidates) return board;
  for (const w of ["daily", "weekly", "monthly"]) {
    board[w] = cand.candidates
      .filter((c) => (c.windows || []).includes(w))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, BOARD_PER_WINDOW)
      .map((c) => ({
        arxiv_id: c.arxiv_id,
        title: c.title,
        upvotes: c.upvotes,
        num_comments: c.num_comments || 0,
        authors: (c.authors || []).slice(0, 3),
        thumbnail_url: c.thumbnail_url,
        hf_paper_url: c.hf_paper_url,
        paper_url: c.paper_url,
        already_done: Boolean(c.already_done),
      }));
  }
  return board;
}

export async function main() {
  const deepReads = await collectDeepReads();
  const selFile = await latestDated("selection");
  const candFile = await latestDated("candidates");
  const selection = selFile ? await readJson(selFile) : null;
  const candidates = candFile ? await readJson(candFile) : null;

  const deepSlugByArxiv = new Map(deepReads.map((d) => [d.arxiv_id, d.slug]));

  const index = {
    generatedAt: new Date().toISOString(),
    date: candidates?.date || selection?.date || new Date().toISOString().slice(0, 10),
    counts: {
      deepReads: deepReads.length,
      radar: selection?.radar?.length || 0,
      deepCandidates: selection?.deep?.length || 0,
    },
    deepReads,
    deepCandidates: (selection?.deep || []).map((d) => ({ ...d, deep_slug: deepSlugByArxiv.get(d.arxiv_id) || null })),
    radar: (selection?.radar || []).map((r) => ({ ...r, deep_slug: deepSlugByArxiv.get(r.arxiv_id) || null })),
    radarEmpty: Boolean(selection?.empty),
    board: boardFromCandidates(candidates),
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(`[papers-index] deepReads ${index.counts.deepReads} · radar ${index.counts.radar} · deepCand ${index.counts.deepCandidates} · board d/w/m ${index.board.daily.length}/${index.board.weekly.length}/${index.board.monthly.length}`);
  console.log(`[papers-index] wrote ${path.relative(ROOT, OUT)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[papers-index] FAILED: ${e.message}`); process.exitCode = 1; });
}
