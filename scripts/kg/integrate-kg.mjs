#!/usr/bin/env node
// Integrate SA2's source-reaching output into the brief knowledge graph:
//  (1) merge design-assessments self_evo_use onto existing nodes (match by arxiv-id / slug),
//  (2) add discovery ghost nodes (dedupe against existing content nodes),
//  (3) add the curated add/replace/merge edges (Kevin 2026-06-09: architecture is not only ADD —
//      improves_on = 取长补短/REPLACE, composes_with = 前后关联/MERGE, no edge = 新思路/ADD).
// Idempotent: re-running replaces the integrated layer (tagged kg_integrated).

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { buildDeterministicFacetRelationEdges, extractEdgesLLM, normalizeGraphRelations } from "./relation-engine.mjs";
import { loadFileJudge } from "./relation-llm-io.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH = path.join(ROOT, "public", "data", "brief", "graph.json");
const ASSESS = path.join(ROOT, "data", "knowledge-graph", "design-assessments.json");
const CAND = path.join(ROOT, "data", "knowledge-graph", "discovery-candidates.json");
const FACETS = path.join(ROOT, "data", "knowledge-graph", "facets");
const PAPERS_DIR = path.join(ROOT, "content", "papers");
const VERIFIED_FACET_EDGE_TYPES = new Set(["improves_on", "extends", "contradicts", "composes_with", "implements", "applies", "tool_for"]);

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const arxivOf = (s) => (/(\d{4}\.\d{4,5})/.exec(String(s || "")) || [])[1] || "";
const slugOf = (s) => String(s || "").replace(/^(paper|project|ghost):/, "").replace(/^\d{4}\.\d{4,5}-?/, "");

const graph = await readJson(GRAPH);
const nodes = graph.nodes || [];
const byId = new Map(nodes.map((n) => [n.id, n]));
const bySlug = new Map();
const byArxiv = new Map();
for (const node of nodes) {
  if (node.slug && !bySlug.has(node.slug)) bySlug.set(node.slug, node);
  const stripped = slugOf(node.id);
  if (stripped && !bySlug.has(stripped)) bySlug.set(stripped, node);
  const ax = node.arxiv_id || arxivOf(node.id) || arxivOf(node.slug) || arxivOf(node.file);
  if (ax && !byArxiv.has(ax)) byArxiv.set(ax, node);
}

function paperDirFromSource(source) {
  const match = String(source || "").replace(/\\/g, "/").match(/content\/papers\/([^/\s]+)/);
  return match?.[1] || "";
}

function registerNode(node) {
  byId.set(node.id, node);
  if (node.slug && !bySlug.has(node.slug)) bySlug.set(node.slug, node);
  const stripped = slugOf(node.id);
  if (stripped && !bySlug.has(stripped)) bySlug.set(stripped, node);
  const ax = node.arxiv_id || arxivOf(node.id) || arxivOf(node.slug) || arxivOf(node.file);
  if (ax && !byArxiv.has(ax)) byArxiv.set(ax, node);
}

function registerAlias(alias, node) {
  if (alias && node && !bySlug.has(alias)) bySlug.set(alias, node);
}

// Primary-node resolver: find the best node for a keyword (prefer content/paper/project/ghost,
// avoid sub-nodes like claim/evidence/artifact/source-pack).
const PRIMARY = new Set(["content", "paper", "project", "deep-dive", "ghost"]);
function findNode(keyword) {
  const k = keyword.toLowerCase();
  const cands = nodes.filter((n) => (n.id + " " + (n.title || "")).toLowerCase().includes(k));
  cands.sort((a, b) => (PRIMARY.has(b.type) ? 1 : 0) - (PRIMARY.has(a.type) ? 1 : 0));
  return cands[0] || null;
}

function resolveFacetNode(facet) {
  if (facet?.node_id && byId.has(facet.node_id)) return byId.get(facet.node_id);
  const arxiv = facet?.arxiv_id || arxivOf(facet?.node_id) || arxivOf(facet?.slug) || arxivOf(facet?.source);
  if (arxiv && byArxiv.has(arxiv)) return byArxiv.get(arxiv);
  const paperDir = paperDirFromSource(facet?.source);
  if (paperDir && bySlug.has(paperDir)) return bySlug.get(paperDir);
  if (facet?.slug && bySlug.has(facet.slug)) return bySlug.get(facet.slug);
  return facet?.slug ? findNode(facet.slug) : null;
}

function resolveSlug(slug) {
  return bySlug.get(slug) || findNode(slug);
}

async function loadFacets() {
  let files = [];
  try {
    files = (await readdir(FACETS)).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch {
    return [];
  }
  const facets = [];
  for (const file of files) {
    try {
      const facet = YAML.parse(await readFile(path.join(FACETS, file), "utf8"));
      if (facet && facet.status !== "reject") facets.push({ ...facet, _file: file });
    } catch (error) {
      console.warn(`[integrate-kg] WARN facet parse failed: ${file} — ${error.message}`);
    }
  }
  return facets;
}

async function readPaperMetadata(dir) {
  if (!dir) return {};
  try {
    return JSON.parse(await readFile(path.join(PAPERS_DIR, dir, "metadata.json"), "utf8"));
  } catch {
    return {};
  }
}

async function ensurePaperFacetNode(facet) {
  const existing = resolveFacetNode(facet);
  if (existing) return existing;
  if (facet?.kind !== "paper") {
    if (facet?.kind !== "project") return null;
    const slug = facet.slug || slugOf(facet.node_id);
    const id = facet.node_id || `content/${slug}`;
    if (!slug || byId.has(id)) return byId.get(id) || null;
    const node = {
      id,
      type: "project",
      kind: "project",
      family: "project",
      slug,
      title: facet.title || slug,
      tags: [],
      file: facet.source || undefined,
      href: `/brief/${encodeURIComponent(slug)}`,
      source: facet.source || undefined,
      kg_integrated: true,
      ghost: false,
    };
    nodes.push(node);
    registerNode(node);
    return node;
  }

  const paperDir = paperDirFromSource(facet.source) || (facet.slug && bySlug.has(facet.slug) ? facet.slug : "");
  const metadata = await readPaperMetadata(paperDir);
  const arxiv = facet.arxiv_id || arxivOf(facet.source) || arxivOf(paperDir) || metadata.arxiv_id || metadata.paper_id || "";
  const slug = paperDir || facet.slug || (arxiv ? arxiv : slugOf(facet.node_id));
  const id = arxiv ? `paper:${arxiv}` : facet.node_id || `content/${slug}`;
  if (byId.has(id)) return byId.get(id);

  const node = {
    id,
    type: "paper",
    kind: "paper",
    family: "paper",
    slug,
    ...(arxiv ? { arxiv_id: arxiv } : {}),
    title: metadata.title || facet.title || slug,
    tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : [],
    ...(metadata.topic ? { topic: metadata.topic } : {}),
    file: paperDir ? `content/papers/${paperDir}/metadata.json` : undefined,
    href: slug ? `/papers/${encodeURIComponent(slug)}` : "/articles",
    source: facet.source || undefined,
    kg_integrated: true,
    ghost: false,
  };
  nodes.push(node);
  registerNode(node);
  return node;
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

// (1b) merge Mind Palace facets onto primary nodes.
const facets = await loadFacets();
let facetedNodes = 0;
let facetEdgesAdded = 0;
let relationEngineEdgesAdded = 0;
let relationEngineLlmEdgesAdded = 0;
for (const facet of facets) {
  const node = await ensurePaperFacetNode(facet);
  if (!node) {
    console.warn(`[integrate-kg] WARN facet node unresolved: ${facet._file || facet.slug || facet.node_id}`);
    continue;
  }
  if (facet.facets) node.facets = facet.facets;
  if (facet.self_evo_use) node.self_evo_use = facet.self_evo_use;
  if (Array.isArray(facet.core_concepts) && facet.core_concepts.length) node.core_concepts = facet.core_concepts;
  if (facet.discovery_trace && typeof facet.discovery_trace === "object") node.discovery_trace = facet.discovery_trace;
  if (facet.slug) node.facet_slug = facet.slug;
  if (facet.status) node.facet_status = facet.status;
  if (facet.kind === "paper" && node.slug && !node.href) node.href = `/papers/${encodeURIComponent(node.slug)}`;
  registerAlias(facet.slug, node);
  registerAlias(paperDirFromSource(facet.source), node);
  facetedNodes += 1;
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
graph.edges = (graph.edges || []).filter((e) => !e.kg_integrated); // idempotent
let edgesAdded = 0;
for (const [ka, kb, type, confidence, evidence] of CURATED) {
  const A = findNode(ka), B = findNode(kb);
  if (!A || !B) { console.warn(`[integrate-kg] WARN curated endpoint unresolved: "${!A ? ka : kb}" — edge dropped`); continue; }
  if (A.id === B.id) continue;
  graph.edges.push({ from: A.id, to: B.id, type, confidence, evidence, kg_integrated: true, cross_doc: true });
  edgesAdded += 1;
}

// (3b) facet-authored verified typed edges. These are the reasoning layer;
// unlike tag-derived same_track edges, they passed the facet gate.
for (const facet of facets) {
  const fromNode = await ensurePaperFacetNode(facet);
  if (!fromNode || !Array.isArray(facet.edges)) continue;
  for (const edge of facet.edges) {
    if (!edge || !VERIFIED_FACET_EDGE_TYPES.has(edge.type)) continue;
    const toNode = resolveSlug(edge.to);
    if (!toNode) {
      console.warn(`[integrate-kg] WARN facet edge endpoint unresolved: ${facet.slug || fromNode.id} -> ${edge.to}`);
      continue;
    }
    if (fromNode.id === toNode.id) continue;
    graph.edges.push({
      from: fromNode.id,
      to: toNode.id,
      type: edge.type,
      confidence: edge.confidence || "medium",
      evidence: edge.evidence || `verified facet edge from ${facet.slug || fromNode.id}`,
      kg_integrated: true,
      cross_doc: true,
      verified_from_facet: true,
    });
    facetEdgesAdded += 1;
  }
}

// (3c) KG-3 deterministic relation engine. CI/dry-run path: no model call,
// only promotes evidence that already exists in facets and passes candidate
// generation (hybrid-like lexical + shared core_concept top-K).
const relationEngineEdges = buildDeterministicFacetRelationEdges({ facets, nodes, topK: 6 });
const existingRelationKeys = new Set((graph.edges || []).map((e) => `${e.from}|${e.to}|${e.type}`));
for (const edge of relationEngineEdges) {
  const key = `${edge.from}|${edge.to}|${edge.type}`;
  if (existingRelationKeys.has(key)) continue;
  graph.edges.push(edge);
  existingRelationKeys.add(key);
  relationEngineEdgesAdded += 1;
}

// (3d) KG-3 opt-in LLM relation extraction. This is intentionally not the
// default build path: CI/dry-run remains deterministic, while local enrichment
// can be run with KG_RELATION_LLM=1 npm run kg:build.
if (process.env.KG_RELATION_LLM === "1") {
  const llmModel = process.env.KG_RELATION_MODEL || "claude-sonnet-4-6";
  const llmProvider = process.env.KG_RELATION_PROVIDER || undefined;
  const llmTopK = Number(process.env.KG_RELATION_TOPK) || 10;
  const llmMaxCandidates = Number(process.env.KG_RELATION_MAX_CANDIDATES) || 300;
  const llmTimeoutMs = Number(process.env.KG_RELATION_TIMEOUT_MS) || undefined;
  // Preferred path: replay precomputed decisions from a strong model (codex
  // gpt-5.5, separate quota) via a file judge — zero model calls at build time,
  // no 5h-window contention. Falls back to the live runRelationJudge only if no
  // decisions file is provided.
  const decisionsFile = process.env.KG_RELATION_DECISIONS_FILE || undefined;
  let fileJudge;
  if (decisionsFile) {
    try {
      fileJudge = await loadFileJudge(decisionsFile);
    } catch (error) {
      console.warn(`[integrate-kg] WARN relation decisions file unreadable (${decisionsFile}): ${error.message}`);
    }
  }
  try {
    const { edges: llmEdges, stats } = await extractEdgesLLM(facets, {
      model: fileJudge ? `file:${path.basename(decisionsFile)}` : llmModel,
      ...(fileJudge ? { judge: fileJudge } : {}),
      ...(!fileJudge && llmProvider ? { provider: llmProvider } : {}),
      topK: llmTopK,
      maxCandidates: llmMaxCandidates,
      ...(llmTimeoutMs ? { timeoutMs: llmTimeoutMs } : {}),
    });
    for (const edge of llmEdges) {
      const key = `${edge.from}|${edge.to}|${edge.type}`;
      if (existingRelationKeys.has(key)) continue;
      graph.edges.push(edge);
      existingRelationKeys.add(key);
      relationEngineLlmEdgesAdded += 1;
    }
    graph.relationEngineLlm = {
      enabled: true,
      ...stats,
      added: relationEngineLlmEdgesAdded,
    };
    console.log(`[integrate-kg] relation-engine LLM source=${fileJudge ? `file:${path.basename(decisionsFile)}` : `live:${llmProvider || "auto"}/${llmModel}`} candidates=${stats.candidates} judged=${stats.judged} accepted=${stats.accepted} added=${relationEngineLlmEdgesAdded} failed=${stats.failed} rejected=${stats.rejected}`);
  } catch (error) {
    graph.relationEngineLlm = { enabled: true, model: llmModel, error: error.message };
    console.warn(`[integrate-kg] WARN relation-engine LLM skipped: ${error.message}`);
  }
} else {
  delete graph.relationEngineLlm;
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
// Structural / taxonomy / language / generic-tech tags do NOT imply a shared research track —
// excluded so "同赛道" requires ≥2 genuinely TOPICAL shared tags (cold-review round 2: 85% of edges
// were boilerplate like tier-3/project/python). Keep this list broad on purpose.
const GENERIC = new Set([
  "agent", "agents", "ai", "llm", "llms", "survey", "ml", "nlp",
  "tier-1", "tier-2", "tier-3", "tier1", "tier2", "tier3", "project", "projects", "model", "models",
  "python", "typescript", "javascript", "rust", "go", "golang", "java", "c", "cpp", "ruby",
  "mcp", "cli", "sdk", "api", "framework", "agent-framework", "library", "lib", "tool", "tools",
  "app", "desktop", "web", "open-source", "opensource", "github", "docs", "documentation",
  "skill", "skills", "workflow", "demo", "starter", "template", "boilerplate", "guide", "tutorial",
  // process/category markers (cold-review r3: these — not tier-3/python — were driving 80% of noise:
  // "deep" just means it got a deep-read; ai-app/devtool-cli are broad product buckets).
  "deep", "analysis", "devtool-cli", "ai-app", "ai-application", "application", "library-sdk",
  "model-infra", "infra", "infrastructure", "dev-tool", "devtool", "product", "platform", "utility",
]);
const isTopical = (t) => !GENERIC.has(String(t).toLowerCase());
const tagged = nodes.filter((n) => DOC_TYPES.has(n.type) && Array.isArray(n.tags) && n.tags.some(isTopical) && !n.ghost);
const seen = new Set();
// Seed dedup with EVERY existing pair (base + curated) so we never emit a reverse-direction
// duplicate or a redundant same_track over a more-meaningful curated edge.
for (const e of graph.edges) seen.add([e.from, e.to].sort().join("|"));
for (const a of tagged) {
  const scored = [];
  for (const b of tagged) {
    if (a.id === b.id) continue;
    const shared = (a.tags || []).filter((t) => (b.tags || []).includes(t) && isTopical(t));
    // ≥1 shared RESEARCH tag = same-track (noise is removed by the GENERIC blacklist above, not by a
    // high count: with deep/ai-app/project/python/etc. excluded, a single shared tag like
    // "agent-memory" is a real signal; capped top-5/node so a popular topic can't over-connect).
    if (shared.length >= 1) scored.push({ b, shared });
  }
  scored.sort((x, y) => y.shared.length - x.shared.length);
  for (const { b, shared } of scored.slice(0, 5)) {
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) continue; seen.add(key);
    graph.edges.push({ from: a.id, to: b.id, type: "same_track", confidence: shared.length >= 3 ? "high" : "medium",
      evidence: `共享标签:${shared.slice(0, 3).join("、")}`, kg_integrated: true, cross_doc: true, weak: true });
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
    const key = [docs[i].id, docs[j].id].sort().join("|"); // unified key: one associative edge per doc-pair
    if (seen.has(key)) continue; seen.add(key);
    graph.edges.push({ from: docs[i].id, to: docs[j].id, type: "shares_concept", confidence: "medium",
      evidence: `共享概念:${concept.replace(/^[a-z-]+\//, "")}`, kg_integrated: true, cross_doc: true });
    crossDoc += 1;
  }
}

graph.generatedAt = new Date().toISOString();
for (const edge of graph.edges) {
  if (edge.type === "same_track") edge.weak = true;
}
// Final dedup: keep ALL references, but at most ONE associative edge per doc-pair — the most
// meaningful type (judgment > typed > concept > same_track). Removes reverse-direction duplicates
// the base builder emits.
const PRIORITY = {
  composes_with: 7, layers_with: 7, complements: 7, supersedes: 7, replaces: 7, cheaper_alt: 7,
  compares_with: 7, contradicts: 7, tension_with: 7, precedes: 7, lineage_anchor: 7,
  validates: 7, isomorphic_with: 7, evaluates: 7,
  improves_on: 6, extends: 6, implements: 6, applies: 6, tool_for: 6, shares_method: 6, builds_on: 6,
  same_use_case: 5, shares_concept: 3, same_track: 2,
};
const bestByPair = new Map();
const keptRefs = [];
for (const e of graph.edges) {
  if (e.type === "references") { keptRefs.push(e); continue; }
  const k = [e.from, e.to].sort().join("|");
  const prev = bestByPair.get(k);
  if (!prev || (PRIORITY[e.type] || 1) > (PRIORITY[prev.type] || 1)) bestByPair.set(k, e);
}
graph.edges = [...keptRefs, ...bestByPair.values()];
graph.edges = normalizeGraphRelations(graph.edges);

const references = graph.edges.filter((e) => e.type === "references").length;
const associativeEdges = graph.edges.filter((e) => e.type !== "references" && !(e.type === "same_track" && e.weak)).length;
const edgeByType = {}; // recompute from scratch — base builder's count is stale after we add edges
for (const e of graph.edges) edgeByType[e.type] = (edgeByType[e.type] || 0) + 1;
graph.summary = { ...(graph.summary || {}), nodes: nodes.length, edges: graph.edges.length,
  references, associativeEdges, crossDocEdges: graph.edges.filter((e) => e.cross_doc).length,
  edgeByType, ghosts: nodes.filter((n) => n.ghost).length, assessed: nodes.filter((n) => n.self_evo_use).length,
  facetedNodes: nodes.filter((n) => n.facets).length };
await writeFile(GRAPH, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
console.log(`[integrate-kg] assessments:${merged} | facets:${facetedNodes} | ghosts +${ghostsAdded}/merged ${ghostsMerged} | curated:${edgesAdded} | facet-edges:${facetEdgesAdded} | relation-engine:${relationEngineEdgesAdded} | relation-llm:${relationEngineLlmEdgesAdded} | cross-doc:${crossDoc}`);
console.log(`[integrate-kg] nodes ${nodes.length} | edges ${graph.edges.length} (references ${references} plumbing + ASSOCIATIVE ${associativeEdges}, weak same_track excluded) | ghosts ${graph.summary.ghosts} | assessed ${graph.summary.assessed} | faceted ${graph.summary.facetedNodes}`);
