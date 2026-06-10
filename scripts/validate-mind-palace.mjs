#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FACETS_DIR = path.join(ROOT, "data", "knowledge-graph", "facets");
const GRAPH_FILE = path.join(ROOT, "public", "data", "brief", "graph.json");
const EMBEDDINGS_FILE = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const REQUIRED_FACETS = ["problem_solved", "method", "result", "innovation", "weakness", "transfer"];
const EDGE_TYPES = new Set(["improves_on", "extends", "contradicts", "composes_with", "implements", "applies", "tool_for", "evaluates"]);
const KILLED_EDGE_TYPES = new Set(["same_problem", "same_use_case"]);
const CORE_CONCEPT_ROLES = new Set(["primary", "supporting", "mentioned"]);
const CROSS_TYPE_EDGE_TYPES = new Set(["implements", "applies", "tool_for"]);
const ROLE_RANK = { mentioned: 0, supporting: 1, primary: 2 };
const LEGACY_EDGE_GRANDFATHER = new Map([
  ["agemem.yaml", new Set(["improves_on|rohitg00-agentmemory|AgeMem 用 RL 学习记忆策略，取长补短 agentmemory 的写死 hook（学习式 > 固定式）"])],
  ["ai-scientist-v2.yaml", new Set(["composes_with|nousresearch-hermes-agent|ai-scientist-v2 给的是任务级探索引擎（树搜索+实验manager），hermes-agent 给的是长期运行时（skills记忆+终端后端+审批）——前者当 hermes 的一个 execute_code 任务跑，后者补它缺的经验沉淀与安全沙箱。"])],
  ["colbymchenry-codegraph.yaml", new Set(["composes_with|understand-anything|两者都用 Tree-sitter 把代码库抽成知识图谱给 agent 用；codegraph 强在低层索引基础设施（SQLite schema+MCP工具+staleness），understand-anything 强在上层多agent语义导览+可视化仪表盘——一个做底座一个做表现层，互补而非重复。"])],
  ["memoryagentbench.yaml", new Set([
    "composes_with|agemem|AgeMem 提可学习的记忆方法、MemoryAgentBench 负责考这些方法行不行（连 Mem0 都是两篇共同评测对象）；方法×评测天然配对（deep-read 明确称二者『是一对』）",
    "composes_with|mempalace|MemPalace 自报 LongMemEval R@5 96.6%；MemoryAgentBench 指出仅靠 AR 单维高分不够，正可补 TTL/LRU/CR 三维的独立体检",
  ])],
  ["mempalace.yaml", new Set([
    "contradicts|supermemory|同做 AI 记忆但路线相反：MemPalace=本地逐字零 API 不摘要；supermemory=云托管 LLM 抽取事实图谱并自动遗忘/压缩。存储哲学正相反",
    "composes_with|memoryagentbench|MemPalace 自报 LongMemEval R@5 96.6%（仅 AR 单维）；MemoryAgentBench 四维协议正可补 TTL/LRU/CR 三维的独立体检，校验其『最佳』自称",
  ])],
  ["nousresearch-hermes-agent.yaml", new Set(["contradicts|agemem|两者都想做自进化记忆：agemem 把记忆操作做成可被 RL 训练的策略动作（学习式），hermes 的 SKILL.md 是规则式生成/编辑技能文件（无策略学习）——对『记忆策略怎么进化』给出相反答案：学出来 vs 写出来。"])],
  ["rohitg00-agentmemory.yaml", new Set([
    "improves_on|agemem|agemem 用 RL 把 agentmemory 写死的 hook 记忆操作变成可学习的策略动作（agemem facet 已声明对侧 improves_on）；二者方向相反、互为对照",
    "composes_with|memoryagentbench|agentmemory 自带 LongMemEval/coding-life 评测 adapter；MemoryAgentBench 提供 AR/TTL/LRU/CR 四维协议，正可当 agentmemory 检索层的外部体检尺",
  ])],
  ["supermemory.yaml", new Set([
    "contradicts|mempalace|同做 AI 记忆但路线相反：supermemory=云托管 + LLM 抽取事实图谱（黑箱）；MemPalace=本地优先 + 逐字存储零 API。一个抽取压缩、一个不摘要不释义，权衡正相反",
    "composes_with|memoryagentbench|supermemory 自报 LongMemEval/LoCoMo/ConvoMem #1 但无复现；MemoryAgentBench 的四维增量协议正可独立核验这类自报记忆分数",
  ])],
  ["understand-anything.yaml", new Set(["composes_with|colbymchenry-codegraph|同样 Tree-sitter→代码知识图谱给 agent；understand-anything 在上层做多agent语义导览+可视化仪表盘+图谱进Git，codegraph 在底层做 SQLite 索引基础设施+MCP工具+staleness——表现层 vs 基础设施层互补。"])],
]);

const errors = [];
const warnings = [];
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const hasText = (value) => typeof value === "string" && value.trim() !== "";
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function fail(where, message) {
  errors.push(`${where}: ${message}`);
}

function warn(where, message) {
  warnings.push(`${where}: ${message}`);
}

async function readJson(file, label) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail(label, `cannot read/parse JSON: ${error.message}`);
    return null;
  }
}

function normalizeTrace(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isDataInsufficient(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return normalizeTrace(value) === "" || normalizeTrace(value) === "数据不足";
  if (isObject(value)) {
    return Object.values(value).every((item) => normalizeTrace(item) === "" || normalizeTrace(item) === "数据不足");
  }
  return false;
}

function conceptMap(facet) {
  const out = new Map();
  if (!Array.isArray(facet?.core_concepts)) return out;
  for (const concept of facet.core_concepts) {
    if (hasText(concept?.name) && CORE_CONCEPT_ROLES.has(concept.role)) out.set(concept.name, concept.role);
  }
  return out;
}

function edgeSignature(edge) {
  return `${edge?.type || ""}|${edge?.to || ""}|${edge?.evidence || ""}`;
}

function isLegacyGrandfatheredEdge(file, edge) {
  return LEGACY_EDGE_GRANDFATHER.get(file)?.has(edgeSignature(edge)) || false;
}

function validateCoreConcepts(facet, where) {
  if (facet.core_concepts === undefined) return;
  if (!Array.isArray(facet.core_concepts)) {
    fail(where, "core_concepts must be an array when present");
    return;
  }
  if (facet.core_concepts.length < 3) warn(where, `core_concepts should contain 3-5 items; got ${facet.core_concepts.length}`);
  if (facet.core_concepts.length > 5) fail(where, `core_concepts must contain at most 5 items; got ${facet.core_concepts.length}`);
  facet.core_concepts.forEach((concept, index) => {
    const conceptPath = `${where}.core_concepts[${index}]`;
    if (!isObject(concept)) {
      fail(conceptPath, "must be an object");
      return;
    }
    if (!hasText(concept.name)) fail(conceptPath, "name must be non-empty");
    if (!CORE_CONCEPT_ROLES.has(concept.role)) fail(conceptPath, `role must be one of ${[...CORE_CONCEPT_ROLES].join("|")}`);
    if (!hasText(concept.evidence)) fail(conceptPath, "evidence must be non-empty");
  });
}

function validateDiscoveryTrace(facet, where) {
  if (facet.discovery_trace === undefined || isDataInsufficient(facet.discovery_trace)) return;
  if (!isObject(facet.discovery_trace)) {
    fail(where, "discovery_trace must be an object or 数据不足 when present");
    return;
  }
  if (!hasText(facet.discovery_trace.source_span)) {
    fail(where, "discovery_trace.source_span must be non-empty when discovery_trace is not 数据不足");
  }
}

function validateCrossTypeConcept(edge, edgePath, fromFacet, toFacet) {
  const concept = edge.concept;
  if (!hasText(concept)) {
    fail(edgePath, "concept must be non-empty for implements/applies/tool_for edges");
    return;
  }
  if (!Array.isArray(fromFacet.core_concepts)) fail(edgePath, "from facet core_concepts required for cross-type edge");
  if (!Array.isArray(toFacet?.core_concepts)) fail(edgePath, "to facet core_concepts required for cross-type edge");
  if (!Array.isArray(fromFacet.core_concepts) || !Array.isArray(toFacet?.core_concepts)) return;

  const fromConcepts = conceptMap(fromFacet);
  const toConcepts = conceptMap(toFacet);
  const fromRole = fromConcepts.get(concept);
  const toRole = toConcepts.get(concept);
  if (!fromRole || !toRole) {
    fail(edgePath, `concept must exist in both endpoint core_concepts: ${concept}`);
    return;
  }

  const fromKind = fromFacet.kind || "";
  const toKind = toFacet.kind || "";
  const paperRole = fromKind === "paper" ? fromRole : toKind === "paper" ? toRole : "";
  const projectRole = fromKind === "project" ? fromRole : toKind === "project" ? toRole : "";
  if (!paperRole || !projectRole) {
    fail(edgePath, "implements/applies/tool_for must connect paper and project facets");
    return;
  }
  if (edge.type === "implements" && (fromRole !== "primary" || toRole !== "primary")) {
    fail(edgePath, "implements concept role must be primary on both endpoints");
  }
  if ((edge.type === "applies" || edge.type === "tool_for") && (paperRole !== "primary" || ROLE_RANK[projectRole] < ROLE_RANK.supporting)) {
    fail(edgePath, `${edge.type} concept role must be paper primary + project supporting-or-primary`);
  }
}

// evaluates: A(benchmark)→B(被测)。kind 不限。概念门=被测概念 ∈ 两端，且 B 侧 primary（plan KG-2 §3.1）。
function validateEvaluatesConcept(edge, edgePath, fromFacet, toFacet) {
  const concept = edge.concept;
  if (!hasText(concept)) {
    fail(edgePath, "concept must be non-empty for evaluates edges");
    return;
  }
  if (!Array.isArray(fromFacet.core_concepts) || !Array.isArray(toFacet?.core_concepts)) {
    fail(edgePath, "both endpoint facets need core_concepts for evaluates edge");
    return;
  }
  const fromRole = conceptMap(fromFacet).get(concept);
  const toRole = conceptMap(toFacet).get(concept);
  if (!fromRole || !toRole) {
    fail(edgePath, `concept must exist in both endpoint core_concepts: ${concept}`);
    return;
  }
  if (toRole !== "primary") {
    fail(edgePath, "evaluates concept role must be primary on the evaluated (to) endpoint");
  }
  // 判边 agent 发现的门缝隙：概念角色过门 ≠ A 真测过 B。强制声明证据种类，冷审据此对账。
  if (!["results_table", "self_report_citation"].includes(edge.evidence_kind)) {
    fail(edgePath, "evaluates edge requires evidence_kind: results_table (A 的结果表/榜单含 B) or self_report_citation (B 自报分数引用 A)");
  }
}

function nodeSlugs(nodes) {
  const slugs = new Set();
  for (const node of nodes) {
    if (hasText(node.slug)) slugs.add(node.slug);
    if (hasText(node.id)) {
      const id = node.id;
      slugs.add(id.replace(/^(paper|project|ghost|content|radar|deep-dive|concept|method|claim|evidence|artifact|source-pack|evidence-pack|system-component|design-principle|taste)[/:]/, ""));
    }
  }
  return slugs;
}

let facetFiles = [];
try {
  facetFiles = (await readdir(FACETS_DIR)).filter((name) => /\.ya?ml$/i.test(name)).sort();
} catch (error) {
  fail(rel(FACETS_DIR), `cannot read facets directory: ${error.message}`);
}

const graph = await readJson(GRAPH_FILE, rel(GRAPH_FILE));
const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
const nodeIds = new Set(nodes.map((node) => node.id).filter(Boolean));
const slugSet = nodeSlugs(nodes);
const nodesBySlug = new Map();
const nodesByArxiv = new Map();
for (const node of nodes) {
  if (hasText(node.slug) && !nodesBySlug.has(node.slug)) nodesBySlug.set(node.slug, node);
  const arxiv = (/(\d{4}\.\d{4,5})/.exec(`${node.id || ""} ${node.slug || ""} ${node.arxiv_id || ""} ${node.file || ""}`) || [])[1];
  if (arxiv && !nodesByArxiv.has(arxiv)) nodesByArxiv.set(arxiv, node);
}

function paperDirFromSource(source) {
  const match = String(source || "").replace(/\\/g, "/").match(/content\/papers\/([^/\s]+)/);
  return match?.[1] || "";
}

function resolvesFacetNode(facet) {
  if (hasText(facet.node_id) && nodeIds.has(facet.node_id)) return true;
  const arxiv = (/(\d{4}\.\d{4,5})/.exec(`${facet.node_id || ""} ${facet.slug || ""} ${facet.arxiv_id || ""} ${facet.source || ""}`) || [])[1];
  if (arxiv && nodesByArxiv.has(arxiv)) return true;
  const paperDir = paperDirFromSource(facet.source);
  if (paperDir && nodesBySlug.has(paperDir)) return true;
  if (hasText(facet.slug) && (nodesBySlug.has(facet.slug) || slugSet.has(facet.slug))) return true;
  return false;
}

const embeddings = await readJson(EMBEDDINGS_FILE, rel(EMBEDDINGS_FILE));
const vectors = Array.isArray(embeddings?.vectors) ? embeddings.vectors : [];
const vectorIds = new Set(vectors.map((item) => item.id).filter(Boolean));
const vectorSlugs = new Set(vectors.map((item) => item.slug).filter(Boolean));

const activeFacets = [];
const facetBySlug = new Map();
const parsedFacets = [];
for (const file of facetFiles) {
  const fullPath = path.join(FACETS_DIR, file);
  const where = rel(fullPath);
  let facet;
  try {
    facet = YAML.parse(await readFile(fullPath, "utf8"));
  } catch (error) {
    fail(where, `cannot parse YAML: ${error.message}`);
    continue;
  }

  if (!isObject(facet)) {
    fail(where, "must parse to an object");
    continue;
  }

  if (facet.status === "reject") continue;
  activeFacets.push(facet);
  parsedFacets.push({ facet, file, where });
  if (hasText(facet.slug)) facetBySlug.set(facet.slug, facet);
  const paperDir = paperDirFromSource(facet.source);
  if (paperDir) facetBySlug.set(paperDir, facet);
}

for (const { facet, file, where } of parsedFacets) {
  if (!hasText(facet.node_id)) fail(where, "node_id must be a non-empty string");
  else if (!resolvesFacetNode(facet)) fail(where, `node_id does not resolve in graph nodes: ${facet.node_id}`);

  validateCoreConcepts(facet, where);
  validateDiscoveryTrace(facet, where);

  if (!isObject(facet.facets)) {
    fail(where, "facets must be an object");
  } else {
    for (const key of REQUIRED_FACETS) {
      if (!hasText(facet.facets[key])) fail(where, `facets.${key} must be non-empty`);
    }
    if (facet.facets.architecture !== undefined && !String(facet.facets.architecture).includes("```mermaid")) {
      fail(where, "facets.architecture must include a ```mermaid fence when present");
    }
  }

  if (hasText(facet.node_id) && !vectorIds.has(facet.node_id) && !vectorSlugs.has(facet.slug)) {
    fail(where, `missing embedding vector for ${facet.node_id}${facet.slug ? ` / ${facet.slug}` : ""}`);
  }

  if (facet.edges !== undefined) {
    if (!Array.isArray(facet.edges)) {
      fail(where, "edges must be an array when present");
    } else {
      facet.edges.forEach((edge, index) => {
        const edgePath = `${where}.edges[${index}]`;
        if (!isObject(edge)) {
          fail(edgePath, "must be an object");
          return;
        }
        if (KILLED_EDGE_TYPES.has(edge.type)) fail(edgePath, `${edge.type} is killed in KG-2 schema v2`);
        else if (!EDGE_TYPES.has(edge.type)) fail(edgePath, `type must be one of ${[...EDGE_TYPES].join("|")}`);
        if (!hasText(edge.to)) fail(edgePath, "to must be a non-empty slug");
        else if (!slugSet.has(edge.to) && !resolvesFacetNode(facetBySlug.get(edge.to) || {})) {
          fail(edgePath, `to slug does not resolve in graph nodes: ${edge.to}`);
        }
        if (facet.schema === "v2" && !isLegacyGrandfatheredEdge(file, edge)) {
          if (!hasText(edge.evidence)) fail(edgePath, "evidence must be non-empty for schema:v2 edges");
          if (!hasText(edge.negative_rationale)) fail(edgePath, "negative_rationale must be non-empty for schema:v2 edges");
          if (!hasText(edge.confidence)) fail(edgePath, "confidence must be present for schema:v2 edges");
        }
        if (edge.type === "evaluates") {
          validateEvaluatesConcept(edge, edgePath, facet, facetBySlug.get(edge.to));
        }
        if (CROSS_TYPE_EDGE_TYPES.has(edge.type)) {
          validateCrossTypeConcept(edge, edgePath, facet, facetBySlug.get(edge.to));
        }
      });
    }
  }
}

if (!facetFiles.length) fail(rel(FACETS_DIR), "must contain at least one facet YAML file");
if (!Array.isArray(graph?.nodes)) fail(rel(GRAPH_FILE), "nodes must be an array");
if (!Array.isArray(embeddings?.vectors)) fail(rel(EMBEDDINGS_FILE), "vectors must be an array");

if (errors.length) {
  console.error(`[validate-mind-palace] ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`[validate-mind-palace] WARN ${warning}`);
console.log(`[validate-mind-palace] OK facets:${activeFacets.length} vectors:${vectors.length}`);
