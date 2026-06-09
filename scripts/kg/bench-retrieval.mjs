#!/usr/bin/env node
// 检索方法竞赛裁判 (research-loop: 锁定 benchmark 判方法, 不照抄).
// 用法: node scripts/kg/bench-retrieval.mjs [vector|bm25|hybrid]
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const method = process.argv[2] || "vector";
const J = async (p) => JSON.parse(await readFile(path.join(ROOT, p), "utf8"));
const bench = await J("data/knowledge-graph/recall-bench.json");
const emb = await J("public/data/brief/mind-palace-embeddings.json");
const facetsDoc = await J("public/data/brief/facets.json");
const facets = facetsDoc.facets;

const slugs = emb.vectors.map((v) => v.slug);
const vecBySlug = Object.fromEntries(emb.vectors.map((v) => [v.slug, v.vec]));

// 词法分词: latin 词 + CJK 单字 + CJK 字二元组（无需中文分词器, 够做 BM25 信号）
function tokens(s) {
  s = String(s || "").toLowerCase();
  const latin = s.match(/[a-z0-9]+/g) || [];
  const cjk = s.match(/[一-鿿]/g) || [];
  const bi = [];
  for (let i = 0; i < cjk.length - 1; i++) bi.push(cjk[i] + cjk[i + 1]);
  return [...latin, ...cjk, ...bi];
}
function facetText(slug) {
  const f = facets[slug]?.facets || {};
  return [facets[slug]?.title, f.problem_solved, f.method, f.innovation, f.transfer, f.result].filter(Boolean).join(" ");
}
const docs = slugs.map((s) => ({ slug: s, toks: tokens(facetText(s)) }));
const df = {};
docs.forEach((d) => new Set(d.toks).forEach((t) => (df[t] = (df[t] || 0) + 1)));
const N = docs.length;
const avgdl = docs.reduce((a, d) => a + d.toks.length, 0) / N;
const k1 = 1.5, bp = 0.75;
function bm25(qToks, d) {
  const tf = {};
  d.toks.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
  let s = 0;
  for (const qt of new Set(qToks)) {
    if (!tf[qt]) continue;
    const idf = Math.log(1 + (N - df[qt] + 0.5) / (df[qt] + 0.5));
    s += idf * (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - bp + bp * d.toks.length / avgdl));
  }
  return s;
}
const cos = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; };
let extractor = null;
const embed = async (q) => { if (!extractor) extractor = await pipeline("feature-extraction", emb.model); return Array.from((await extractor("query: " + q, { pooling: "mean", normalize: true })).data); };
const ranksOf = (scored) => { const r = {}; scored.slice().sort((a, b) => b[1] - a[1]).forEach(([s], i) => (r[s] = i)); return r; };
function rrf(r1, r2, k = 60) {
  const sc = {}; slugs.forEach((s) => (sc[s] = 0));
  [r1, r2].forEach((r) => Object.entries(r).forEach(([s, rank]) => (sc[s] += 1 / (k + rank + 1))));
  return slugs.slice().sort((a, b) => sc[b] - sc[a]);
}
async function rank(q) {
  let vScored, bScored;
  if (method === "vector" || method === "hybrid") { const qv = await embed(q); vScored = slugs.map((s) => [s, cos(qv, vecBySlug[s])]); }
  if (method === "bm25" || method === "hybrid") { const qt = tokens(q); bScored = docs.map((d) => [d.slug, bm25(qt, d)]); }
  if (method === "vector") return vScored.sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  if (method === "bm25") return bScored.sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  return rrf(ranksOf(vScored), ranksOf(bScored));
}

let precHit = 0, precTot = 0, rec3 = 0, recTot = 0, mrr = 0;
const byType = {};
for (const Q of bench.queries) {
  const ranked = await rank(Q.q);
  const pos = ranked.indexOf(Q.expect);
  mrr += pos >= 0 ? 1 / (pos + 1) : 0;
  byType[Q.type] = byType[Q.type] || { hit: 0, tot: 0 };
  let hit;
  if (Q.mode === "precision") { precTot++; hit = ranked[0] === Q.expect; if (hit) precHit++; }
  else { recTot++; hit = (Q.accept || [Q.expect]).some((s) => ranked.slice(0, 3).includes(s)); if (hit) rec3++; }
  byType[Q.type].tot++; if (hit) byType[Q.type].hit++;
  console.log(`${hit ? "✓" : "✗"} [${Q.mode}] expect=${Q.expect} rank=${pos + 1} top3=${ranked.slice(0, 3).join(",")}`);
}
console.log(`\n=== method=${method} (queries=${bench.queries.length}) ===`);
console.log(`precision(rank1): ${precHit}/${precTot} = ${(precHit / precTot).toFixed(3)}`);
console.log(`recall@3:         ${rec3}/${recTot} = ${(rec3 / recTot).toFixed(3)}`);
console.log(`MRR(expect):      ${(mrr / bench.queries.length).toFixed(3)}`);
console.log(`by type: ${Object.entries(byType).map(([t, v]) => `${t} ${v.hit}/${v.tot}`).join(" | ")}`);
