#!/usr/bin/env node
// Mind Palace — 向量召回底座（本地，无 API）。
// 读 data/knowledge-graph/facets/*.yaml → 用本地 multilingual-e5-small 嵌入 facet 文本
// → 写 public/data/brief/mind-palace-embeddings.json（前端 in-browser query 同模型做 cosine NN）。
// 这是冷审指出缺的"功能"层：agent 真能 query 的记忆，不是词面图。
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FACETS = path.join(ROOT, "data", "knowledge-graph", "facets");
const OUT = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const MODEL = "Xenova/multilingual-e5-small"; // 384-dim multilingual (zh+en), local ONNX, no API

// e5: embed text = title + 核心 facet（problem/method/innovation/transfer/result），passage: 前缀
function embedText(f) {
  const x = f.facets || {};
  const parts = [f.title, x.problem_solved, x.method, x.innovation, x.transfer, x.result, x.self_evo_use ?? f.self_evo_use]
    .filter(Boolean)
    .map((s) => String(s).trim());
  return "passage: " + parts.join(" \n");
}

async function loadFacets() {
  let files = [];
  try { files = (await readdir(FACETS)).filter((n) => n.endsWith(".yaml") || n.endsWith(".yml")); }
  catch { console.error(`[embed] no facets dir ${FACETS}`); return []; }
  const out = [];
  for (const file of files) {
    try {
      const f = YAML.parse(await readFile(path.join(FACETS, file), "utf8"));
      if (!f || !f.node_id) { console.warn(`[embed] skip ${file}: no node_id`); continue; }
      out.push(f);
    } catch (e) { console.warn(`[embed] skip ${file}: ${e.message}`); }
  }
  return out;
}

const facets = await loadFacets();
if (!facets.length) { console.error("[embed] no facets to embed — nothing written"); process.exit(0); }

console.log(`[embed] loading ${MODEL} …`);
const extractor = await pipeline("feature-extraction", MODEL);
const embed = async (t) => Array.from((await extractor(t, { pooling: "mean", normalize: true })).data);

const vectors = [];
for (const f of facets) {
  const vec = await embed(embedText(f));
  vectors.push({ id: f.node_id, slug: f.slug, title: f.title, kind: f.kind || "paper", status: f.status || "extracted", vec });
  console.log(`[embed] ${f.slug} (${vec.length}d)`);
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ model: MODEL, dim: vectors[0]?.vec.length || 0, generated_at: new Date().toISOString(), count: vectors.length, vectors }, null, 0) + "\n", "utf8");
console.log(`[embed] wrote ${vectors.length} vectors → ${path.relative(ROOT, OUT)}`);

// Frontend-readable facet index (slug → facets), so 项目人读页 / 文章页 can render the spine
// without parsing yaml or graph.json. Reject ones are excluded.
const FACETS_OUT = path.join(ROOT, "public", "data", "brief", "facets.json");
const facetIndex = {};
for (const f of facets) {
  if (f.status === "reject") continue;
  facetIndex[f.slug] = {
    node_id: f.node_id, title: f.title, kind: f.kind || "paper", status: f.status || "extracted",
    facets: f.facets || {}, self_evo_use: f.self_evo_use ?? null, edges: f.edges || [],
  };
}
await writeFile(FACETS_OUT, JSON.stringify({ generated_at: new Date().toISOString(), count: Object.keys(facetIndex).length, facets: facetIndex }, null, 0) + "\n", "utf8");
console.log(`[embed] wrote ${Object.keys(facetIndex).length} facet records → ${path.relative(ROOT, FACETS_OUT)}`);
