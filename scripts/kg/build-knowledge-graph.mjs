// scripts/kg/build-knowledge-graph.mjs
// ------------------------------------------------------------------
// Assemble the L0 knowledge-graph DAG ("大脑神经元网络", Kevin 2026-06-05).
//   nodes = papers + design-principles (cross-paper agent-construction patterns)
//   edges = exhibits_principle / shares_principle / shares_tag / forward_lineage
// Output: public/data/knowledge-graph.json
//
// NO-FABRICATION RED LINE: forward_lineage edges (the "edge effect": who
// optimized/replaced whom) come ONLY from data/papers/forward-edges.json, which
// the PM curates from the VERIFIED research (data/papers/forward-lineage-verified.md).
// If that JSON is absent, the graph builds without forward edges (and says so).
// See memory: knowledge-graph-dag-core.
// ------------------------------------------------------------------
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PAPERS_DIR = join(ROOT, "content", "papers");
const PRIMS_DIR = join(ROOT, "data", "autosci", "primitives");
const SEED_FILE = join(ROOT, "data", "papers", "lineage-seed.json");
const FWD_JSON = join(ROOT, "data", "papers", "forward-edges.json");
const OUT_FILE = join(ROOT, "public", "data", "knowledge-graph.json");

// tags too generic to imply a real conceptual link
const GENERIC_TAGS = new Set(["agent", "survey", "benchmark", "evaluation", "breadth", "agent-framework"]);
const SHARED_TAG_THRESHOLD = 2;

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const paperNodeId = (arxiv) => `paper:${arxiv}`;

export async function main() {
const nodes = new Map();
const edges = [];

// ---- 1. paper nodes (content/papers/*/metadata.json) ----
const seedInfo = existsSync(SEED_FILE) ? readJSON(SEED_FILE) : { seeds: [] };
const seedById = new Map((seedInfo.seeds || []).map((s) => [s.arxiv_id, s]));

const paperDirs = existsSync(PAPERS_DIR)
  ? readdirSync(PAPERS_DIR).filter((d) => statSync(join(PAPERS_DIR, d)).isDirectory())
  : [];

for (const dir of paperDirs) {
  const metaPath = join(PAPERS_DIR, dir, "metadata.json");
  if (!existsSync(metaPath)) continue;
  let m;
  try { m = readJSON(metaPath); } catch { continue; }
  const arxiv = String(m.arxiv_id || m.paper_id || dir.split("-")[0]);
  const id = paperNodeId(arxiv);
  const seed = seedById.get(arxiv);
  nodes.set(id, {
    id, type: "paper", arxiv_id: arxiv, slug: dir,
    title: m.title || dir, date: m.date || "",
    authors: m.authors || [], tags: m.tags || [],
    topic: m.topic || "", agent_relevant: !!m.agent_relevant,
    status: m.status || "", scores: m.scores || {},
    is_lineage_seed: !!seed, seed_priority: seed ? seed.priority : null,
    primitive: null, external: false,
  });
}

// ---- 2. principle nodes + exhibits_principle edges (primitives yaml) ----
const primFiles = existsSync(PRIMS_DIR)
  ? readdirSync(PRIMS_DIR).filter((f) => f.endsWith(".yaml"))
  : [];

for (const f of primFiles) {
  let y;
  try { y = parseYaml(readFileSync(join(PRIMS_DIR, f), "utf8")); } catch { continue; }
  if (!y) continue;
  const src = String(y.source_paper || f.replace(/\.yaml$/, ""));
  const paperId = paperNodeId(src);
  if (nodes.has(paperId)) {
    nodes.get(paperId).primitive = y.primitive_id || null;
    nodes.get(paperId).primitive_relevance = y.relevance_level || null;
  }
  const dps = Array.isArray(y.design_principles) ? y.design_principles : [];
  for (const dp of dps) {
    if (!dp || !dp.id) continue;
    const pid = `principle:${dp.id}`;
    if (!nodes.has(pid)) {
      nodes.set(pid, { id: pid, type: "principle", key: dp.id, principle: dp.principle || "", papers: [] });
    }
    const pnode = nodes.get(pid);
    if (!pnode.papers.includes(src)) pnode.papers.push(src);
    if (nodes.has(paperId)) edges.push({ source: paperId, target: pid, type: "exhibits_principle" });
  }
}

// ---- 3. shares_principle edges (papers exhibiting the same principle key) ----
for (const n of nodes.values()) {
  if (n.type !== "principle") continue;
  const ps = n.papers.map(paperNodeId).filter((id) => nodes.has(id));
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      edges.push({ source: ps[i], target: ps[j], type: "shares_principle", via: n.key });
}

// ---- 4. shares_tag edges (papers sharing >= N meaningful tags) ----
const paperNodes = [...nodes.values()].filter((n) => n.type === "paper");
for (let i = 0; i < paperNodes.length; i++)
  for (let j = i + 1; j < paperNodes.length; j++) {
    const a = new Set((paperNodes[i].tags || []).filter((t) => !GENERIC_TAGS.has(t)));
    const shared = (paperNodes[j].tags || []).filter((t) => !GENERIC_TAGS.has(t) && a.has(t));
    if (shared.length >= SHARED_TAG_THRESHOLD)
      edges.push({ source: paperNodes[i].id, target: paperNodes[j].id, type: "shares_tag", weight: shared.length, tags: shared });
  }

// ---- 5. forward_lineage edges (VERIFIED only; the "edge effect") ----
let forwardCount = 0, forwardSource = "absent (run verification → curate forward-edges.json)";
if (existsSync(FWD_JSON)) {
  let fwd;
  try { fwd = readJSON(FWD_JSON); } catch { fwd = null; }
  const list = Array.isArray(fwd) ? fwd : (fwd && Array.isArray(fwd.edges) ? fwd.edges : []);
  for (const e of list) {
    if (!e || !e.source || !e.target) continue;
    const src = paperNodeId(String(e.source));
    const tgt = paperNodeId(String(e.target));
    if (!nodes.has(src)) nodes.set(src, { id: src, type: "paper", arxiv_id: String(e.source), title: e.source_title || `(${e.source})`, external: true, tags: [] });
    if (!nodes.has(tgt)) nodes.set(tgt, { id: tgt, type: "paper", arxiv_id: String(e.target), title: e.target_title || `(${e.target})`, external: true, tags: [] });
    edges.push({
      source: src, target: tgt, type: "forward_lineage",
      subtype: e.edge_type || "optimized_by",
      what_changed: e.what_changed || "", confidence: e.confidence || "", evidence: e.evidence || "",
    });
    forwardCount++;
  }
  forwardSource = `${FWD_JSON.split(/[\\/]/).pop()} (${forwardCount} edges)`;
}

// ---- emit ----
const byType = {};
for (const e of edges) byType[e.type] = (byType[e.type] || 0) + 1;
const nodeByType = {};
for (const n of nodes.values()) nodeByType[n.type] = (nodeByType[n.type] || 0) + 1;

const out = {
  generatedAt: new Date().toISOString(),
  note: "L0 knowledge-graph DAG. forward_lineage = verified 'edge effect' only.",
  stats: { nodes: nodes.size, edges: edges.length, nodeByType, edgeByType: byType, forwardSource },
  nodes: [...nodes.values()],
  edges,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log("[kg] built knowledge-graph.json");
console.log(`[kg] nodes: ${nodes.size}`, nodeByType);
console.log(`[kg] edges: ${edges.length}`, byType);
console.log(`[kg] forward_lineage: ${forwardSource}`);
return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
