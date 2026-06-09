#!/usr/bin/env node
// Mind Palace 检索：给一句话 → 召回最相关的记忆节点 + 它的结构(架构) + 联想(typed边+语义邻居)。
// 这就是"让 Mind Palace 当记忆用"的核心动作。用法: node scripts/kg/recall.mjs "你的问题"
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const query = process.argv.slice(2).join(" ").trim();
if (!query) { console.error('用法: node scripts/kg/recall.mjs "问题"'); process.exit(1); }

const emb = JSON.parse(await readFile(path.join(ROOT, "public/data/brief/mind-palace-embeddings.json"), "utf8"));
const facetsDoc = JSON.parse(await readFile(path.join(ROOT, "public/data/brief/facets.json"), "utf8"));
const facets = facetsDoc.facets || {};
const cos = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; }; // normalized → dot=cos

const extractor = await pipeline("feature-extraction", emb.model);
const qv = Array.from((await extractor("query: " + query, { pooling: "mean", normalize: true })).data);

const ranked = emb.vectors.map((v) => ({ slug: v.slug, title: v.title, score: cos(qv, v.vec) }))
  .sort((a, b) => b.score - a.score);

console.log(`\n问: ${query}\n`);
console.log("== 召回 (语义最近) ==");
for (const r of ranked.slice(0, 5)) console.log(`  ${r.score.toFixed(3)}  ${r.slug} — ${r.title}`);

const top = ranked[0];
const f = facets[top.slug];
console.log(`\n== 最相关记忆: ${top.slug} ==`);
if (f?.facets) {
  console.log(`【结构·解决什么 Y】${(f.facets.problem_solved || "").trim()}`);
  console.log(`【结构·用什么方法 X】${(f.facets.method || "").trim()}`);
  const arch = (f.facets.architecture || "").replace(/```mermaid|```/g, "").trim().split("\n").slice(0, 4).join("\n   ");
  if (arch) console.log(`【结构·架构(节选)】\n   ${arch} ...`);
}
console.log(`\n== 联想 (已核验 typed 边) ==`);
for (const e of f?.edges || []) console.log(`  →[${e.type}] ${e.to} — ${e.evidence || ""}`);
console.log(`== 联想 (语义邻居 top3，非词面) ==`);
const self = emb.vectors.find((v) => v.slug === top.slug);
emb.vectors.filter((v) => v.slug !== top.slug).map((v) => ({ slug: v.slug, s: cos(self.vec, v.vec) }))
  .sort((a, b) => b.s - a.s).slice(0, 3).forEach((n) => console.log(`  ${n.s.toFixed(3)}  ${n.slug}`));
