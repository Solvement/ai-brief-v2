#!/usr/bin/env node
// Integrate SA2's source-reaching output into the brief knowledge graph:
//  (1) merge design-assessments self_evo_use onto existing nodes (match by arxiv-id / slug),
//  (2) add discovery ghost nodes (dedupe against existing content nodes),
//  (3) add the curated add/replace/merge edges (Kevin 2026-06-09: architecture is not only ADD —
//      improves_on = 取长补短/REPLACE, composes_with = 前后关联/MERGE, no edge = 新思路/ADD).
// Idempotent: re-running replaces the integrated layer (tagged kg_integrated).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH = path.join(ROOT, "public", "data", "brief", "graph.json");
const ASSESS = path.join(ROOT, "data", "knowledge-graph", "design-assessments.json");
const CAND = path.join(ROOT, "data", "knowledge-graph", "discovery-candidates.json");

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const arxivOf = (s) => (/(\d{4}\.\d{4,5})/.exec(String(s || "")) || [])[1] || "";
const slugOf = (s) => String(s || "").replace(/^(paper|project|ghost):/, "").replace(/^\d{4}\.\d{4,5}-?/, "");

const graph = await readJson(GRAPH);
const nodes = graph.nodes || [];
const byId = new Map(nodes.map((n) => [n.id, n]));

// Primary-node resolver: find the best node for a keyword (prefer content/paper/project/ghost,
// avoid sub-nodes like claim/evidence/artifact/source-pack).
const PRIMARY = new Set(["content", "paper", "project", "deep-dive", "ghost"]);
function findNode(keyword) {
  const k = keyword.toLowerCase();
  const cands = nodes.filter((n) => (n.id + " " + (n.title || "")).toLowerCase().includes(k));
  cands.sort((a, b) => (PRIMARY.has(b.type) ? 1 : 0) - (PRIMARY.has(a.type) ? 1 : 0));
  return cands[0] || null;
}

// (1) merge assessments
const assess = await readJson(ASSESS);
let merged = 0;
for (const a of assess.assessments || []) {
  const ax = arxivOf(a.id);
  let node = null;
  if (a.id.startsWith("paper:") && ax) node = byId.get(`paper:${ax}`) || findNode(ax);
  else node = findNode(slugOf(a.id));
  if (node && a.self_evo_use) { node.self_evo_use = a.self_evo_use; merged += 1; }
}

// (2) add ghost nodes (dedupe vs existing content/paper nodes by slug/arxiv)
const cand = await readJson(CAND);
let ghostsAdded = 0; let ghostsMerged = 0;
for (const c of cand.candidates || []) {
  const ax = arxivOf(c.id) || arxivOf(c.url);
  const slug = slugOf(c.id);
  const existing = (ax && (byId.get(`paper:${ax}`) || findNode(ax))) || findNode(slug.replace(/^ghost:/, ""));
  if (existing && PRIMARY.has(existing.type) && existing.type !== "ghost") {
    // already a real node — enrich, don't duplicate
    if (c.design_idea) existing.design_idea = c.design_idea;
    if (c.self_evo_use) existing.self_evo_use = c.self_evo_use;
    existing.external_url = c.url;
    ghostsMerged += 1;
  } else if (!byId.has(c.id)) {
    nodes.push({ id: c.id, type: "ghost", ghost: true, title: c.title, tags: c.tags || [],
      url: c.url, design_idea: c.design_idea, self_evo_use: c.self_evo_use, kg_integrated: true });
    byId.set(c.id, nodes[nodes.length - 1]);
    ghostsAdded += 1;
  }
}

// (3) curated add/replace/merge edges (resolve endpoints by keyword; skip if missing).
const CURATED = [
  ["agemem", "rohitg00-agentmemory", "improves_on", "high", "AgeMem 用 RL 学习记忆策略,取长补短 agentmemory 的写死 hook(REPLACE/优化:学习式 > 固定式)"],
  ["openspace", "metagpt", "improves_on", "high", "OpenSpace 的 skill 自进化(FIX/DERIVED/CAPTURED+回退)取代 MetaGPT 写死的 SOP 工作流(REPLACE:自进化 > 固定流程)"],
  ["evolvemem", "agemem", "composes_with", "high", "EvolveMem 让系统自研究记忆配置,与 AgeMem 可学习记忆策略前后组合成自进化记忆层(MERGE)"],
  ["agentdisco", "deep-research", "composes_with", "medium", "AgentDisCo 的探索/利用解耦+policy bank 与深研 agent 的错误定位/上下文管理前后关联(MERGE)"],
  ["openspace", "2507.21046", "same_track", "high", "都在解 agent 自进化;OpenSpace 是自进化综述所述能力的可落地 skill 自进化引擎"],
  ["dgm", "2507.21046", "same_track", "high", "DGM 递归自改代码=自进化最强形态(北极星,受成本/适应度信号约束)"],
  ["generative-agents", "agemem", "composes_with", "medium", "Generative Agents 的 reflection 综合层补上纯检索记忆(agentmemory/AgeMem)缺的跨条目综合(MERGE)"],
  ["alita", "openspace", "shares_method", "medium", "都走最小预定义/动态自生成能力(Alita 动态 MCP vs OpenSpace skill 派生)"],
];
const before = (graph.edges || []).length;
graph.edges = (graph.edges || []).filter((e) => !e.kg_integrated); // idempotent
let edgesAdded = 0;
for (const [ka, kb, type, confidence, evidence] of CURATED) {
  const A = findNode(ka), B = findNode(kb);
  if (!A || !B) { console.warn(`[integrate-kg] WARN curated endpoint unresolved: "${!A ? ka : kb}" — edge dropped`); continue; }
  if (A.id === B.id) continue;
  graph.edges.push({ from: A.id, to: B.id, type, confidence, evidence, kg_integrated: true, cross_doc: true });
  edgesAdded += 1;
}

// (4) D1 FIX (cold-review): REAL cross-document associative edges. The base graph is ~98% intra-doc
// plumbing (a deep-read referencing its OWN claim/evidence sub-nodes) — useless for 联想/recall.
// These connect DISTINCT papers/projects, which is what associative recall actually needs.
const DOC_TYPES = new Set(["paper", "project", "content", "deep-dive"]);
const docRoot = (id) => String(id).replace(/^[a-z-]+[:/]/, "").replace(/-(deep-dive|main-claim|repo|source-pack|evidence-pack|code|results).*$/, "");
let crossDoc = 0;
// (a) same_track via shared tags, but CAPPED to each node's top-5 strongest neighbors (≥2 shared
// tags) — a handful of genuinely-related items, not a near-complete graph (generic tags like
// "agent" would otherwise over-connect everything into noise).
const GENERIC = new Set(["agent", "agents", "ai", "llm", "llms", "survey"]); // too broad to imply same track
const tagged = nodes.filter((n) => DOC_TYPES.has(n.type) && Array.isArray(n.tags) && n.tags.length >= 2 && !n.ghost);
const seen = new Set();
for (const a of tagged) {
  const scored = [];
  for (const b of tagged) {
    if (a.id === b.id) continue;
    const shared = (a.tags || []).filter((t) => (b.tags || []).includes(t) && !GENERIC.has(String(t).toLowerCase()));
    if (shared.length >= 2) scored.push({ b, shared });
  }
  scored.sort((x, y) => y.shared.length - x.shared.length);
  for (const { b, shared } of scored.slice(0, 5)) {
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) continue; seen.add(key);
    graph.edges.push({ from: a.id, to: b.id, type: "same_track", confidence: shared.length >= 3 ? "high" : "medium",
      evidence: `共享标签:${shared.slice(0, 3).join("、")}`, kg_integrated: true, cross_doc: true });
    crossDoc += 1;
  }
}
// (b) concept bridges: a concept referenced by ≥2 DISTINCT documents → shares_concept between those docs.
const conceptDocs = new Map();
for (const e of graph.edges) {
  if (e.type !== "references" || !/^(concept|method)\//.test(e.to || "")) continue;
  const root = docRoot(e.from);
  if (!root) continue;
  if (!conceptDocs.has(e.to)) conceptDocs.set(e.to, new Set());
  conceptDocs.get(e.to).add(root);
}
const docByRoot = new Map();
for (const n of nodes) if (DOC_TYPES.has(n.type) && !n.ghost) { const r = docRoot(n.id); if (!docByRoot.has(r)) docByRoot.set(r, n); }
for (const [concept, roots] of conceptDocs) {
  if (roots.size < 2) continue;
  const docs = [...roots].map((r) => docByRoot.get(r)).filter(Boolean);
  for (let i = 0; i < docs.length; i += 1) for (let j = i + 1; j < docs.length; j += 1) {
    if (docs[i].id === docs[j].id) continue;
    const key = `c:${[docs[i].id, docs[j].id].sort().join("|")}`;
    if (seen.has(key)) continue; seen.add(key);
    graph.edges.push({ from: docs[i].id, to: docs[j].id, type: "shares_concept", confidence: "medium",
      evidence: `共享概念:${concept.replace(/^[a-z-]+\//, "")}`, kg_integrated: true, cross_doc: true });
    crossDoc += 1;
  }
}

graph.generatedAt = new Date().toISOString();
const references = graph.edges.filter((e) => e.type === "references").length;
const associativeEdges = graph.edges.length - references; // honest: cross-item association, not intra-doc plumbing
graph.summary = { ...(graph.summary || {}), nodes: nodes.length, edges: graph.edges.length,
  references, associativeEdges, crossDocEdges: graph.edges.filter((e) => e.cross_doc).length,
  ghosts: nodes.filter((n) => n.ghost).length, assessed: nodes.filter((n) => n.self_evo_use).length };
await writeFile(GRAPH, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
console.log(`[integrate-kg] assessments:${merged} | ghosts +${ghostsAdded}/merged ${ghostsMerged} | curated:${edgesAdded} | cross-doc:${crossDoc}`);
console.log(`[integrate-kg] nodes ${nodes.length} | edges ${graph.edges.length} (references ${references} plumbing + ASSOCIATIVE ${associativeEdges}) | ghosts ${graph.summary.ghosts} | assessed ${graph.summary.assessed}`);
