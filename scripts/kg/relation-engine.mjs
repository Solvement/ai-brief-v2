// scripts/kg/relation-engine.mjs
// ------------------------------------------------------------------
// Mind Palace relation engine (KG-3 Loop B+C).
//
// The live graph must expose verified typed relations as the primary layer.
// Mechanical edges remain available for plumbing/debugging, but are hidden from
// the primary graph by layer metadata. The deterministic path below is the CI
// stub: it never calls a model, and only accepts relation evidence already
// present in facets or authored graph edges.
// ------------------------------------------------------------------

import { spawn } from "node:child_process";

import { createDeepSeekClient, parseJson } from "../lib/llm.mjs";

export const TAXONOMY_EDGE_TYPES = new Set([
  "composes_with",
  "layers_with",
  "complements",
  "supersedes",
  "replaces",
  "cheaper_alt",
  "compares_with",
  "contradicts",
  "tension_with",
  "precedes",
  "lineage_anchor",
  "validates",
  "isomorphic_with",
  "evaluates",
]);

// KG-2 transition types accepted by the locked eval while old authored edges
// are migrated into the KG-3 taxonomy.
export const COMPAT_EDGE_TYPES = new Set([
  "improves_on",
  "extends",
  "implements",
  "applies",
  "tool_for",
  "shares_method",
  "builds_on",
]);

export const TYPED_EDGE_TYPES = new Set([...TAXONOMY_EDGE_TYPES, ...COMPAT_EDGE_TYPES]);

export const MECHANICAL_EDGE_TYPES = new Set([
  "references",
  "same_track",
  "shares_tag",
  "shares_concept",
]);

export const EDGE_TYPE_ALIASES = new Map([
  ["same_use_case", "complements"],
]);

const RELATION_USE = {
  composes_with: "Use together as adjacent pipeline stages.",
  layers_with: "Layer the lower-level substrate with the higher-level interface.",
  complements: "Combine the strengths of both endpoints for one design.",
  supersedes: "Prefer the stronger endpoint and keep the other as historical context.",
  replaces: "Use the replacement endpoint for the same job.",
  cheaper_alt: "Use the cheaper endpoint when cost or latency dominates.",
  compares_with: "Compare routes and choose by the stated dominance axis.",
  contradicts: "Treat as a research tension and inspect both claims before reuse.",
  tension_with: "Keep the opposing constraints visible during design.",
  precedes: "Use as lineage context for later work.",
  lineage_anchor: "Use as a lineage anchor when tracking this research family.",
  validates: "Use as independent design confirmation.",
  isomorphic_with: "Transfer the same structure across domains.",
  evaluates: "Use the benchmark endpoint to measure the evaluated endpoint.",
  improves_on: "Use the newer endpoint when its stated improvement axis matters.",
  extends: "Use as a follow-on extension of the target endpoint.",
  implements: "Use the implementation endpoint as the concrete artifact for the method.",
  applies: "Reuse the applied method in the target setting.",
  tool_for: "Use the source endpoint as a tool for the target workflow.",
  shares_method: "Compare or combine endpoints through the shared method.",
  builds_on: "Read the target first, then use the source as the next step.",
};

const FIELD_HINTS = ["method", "core_concept", "core_concepts"];
const LLM_EDGE_DIRECTIONS = new Set(["A_TO_B", "B_TO_A"]);
const DEFAULT_LLM_MODEL = "claude-sonnet-4-6";
const DEFAULT_LLM_TIMEOUT_MS = 45_000;
const MAX_LLM_CANDIDATES = 80;
const SYMMETRIC_LLM_EDGE_TYPES = new Set([
  "complements",
  "compares_with",
  "contradicts",
  "tension_with",
  "validates",
  "isomorphic_with",
  "composes_with",
  "layers_with",
]);
const IDENTITY_STOPWORDS = new Set([
  "agent", "agents", "memory", "scaling", "survey", "project", "paper", "model", "models",
  "research", "benchmark", "framework", "system", "method", "skill", "skills", "code",
]);

export function normalizeRelationType(type) {
  return EDGE_TYPE_ALIASES.get(String(type || "")) || String(type || "");
}

export function isTypedRelation(type) {
  return TYPED_EDGE_TYPES.has(normalizeRelationType(type));
}

export function isMechanicalRelation(type) {
  return MECHANICAL_EDGE_TYPES.has(normalizeRelationType(type));
}

export function relationUse(type) {
  return RELATION_USE[normalizeRelationType(type)] || "Use this typed relation as a reasoning edge.";
}

export function normalizeRelationEdge(edge, { hideMechanical = true } = {}) {
  const type = normalizeRelationType(edge.type || edge.rel || edge.kind);
  const normalized = { ...edge, type };
  if (isMechanicalRelation(type)) {
    if (hideMechanical) {
      normalized.layer = "mechanical";
      normalized.hidden = true;
    }
    return normalized;
  }

  if (!isTypedRelation(type)) return normalized;
  if (!String(normalized.use || normalized.how_to_use || "").trim()) {
    normalized.use = relationUse(type);
  }
  if (!String(normalized.evidence || "").trim() && normalized.source_file) {
    normalized.evidence = `Relation evidence recorded in ${normalized.source_file}`;
  }
  if (!FIELD_HINTS.some((key) => normalized[key])) {
    normalized.from_field = normalized.from_field || "method";
    normalized.to_field = normalized.to_field || "method";
  }
  return normalized;
}

export function normalizeGraphRelations(edges, options = {}) {
  return (edges || []).map((edge) => normalizeRelationEdge(edge, options));
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clipped(value, max = 1600) {
  const text = compactWhitespace(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function facetText(facet) {
  const f = facet?.facets || {};
  return [
    facet?.title,
    f.problem_solved,
    f.method,
    f.innovation,
    f.transfer,
    f.result,
    facet?.self_evo_use,
  ].filter(Boolean).join(" ");
}

export function facetRelationProse(facet) {
  const f = facet?.facets || {};
  const lines = [
    ["title", facet?.title],
    ["problem_solved", f.problem_solved],
    ["method", f.method],
    ["innovation", f.innovation],
    ["transfer", f.transfer],
    ["result", f.result],
    ["weakness", f.weakness],
    ["self_evo_use", facet?.self_evo_use],
  ];

  for (const concept of Array.isArray(facet?.core_concepts) ? facet.core_concepts : []) {
    const name = String(concept?.name || "").trim();
    const evidence = String(concept?.evidence || "").trim();
    if (name || evidence) lines.push([`core_concept:${name || "unnamed"}`, evidence || name]);
  }
  for (const edge of Array.isArray(facet?.edges) ? facet.edges : []) {
    if (edge?.evidence) lines.push([`edge_evidence:${edge.to || "unknown"}`, edge.evidence]);
  }
  return lines
    .map(([field, value]) => [field, compactWhitespace(value)])
    .filter(([, value]) => value)
    .map(([field, value]) => `${field}: ${value}`)
    .join("\n");
}

export function tokens(text) {
  const s = String(text || "").toLowerCase();
  const latin = s.match(/[a-z0-9]+/g) || [];
  const cjk = s.match(/[一-鿿]/g) || [];
  const bigrams = [];
  for (let i = 0; i < cjk.length - 1; i += 1) bigrams.push(cjk[i] + cjk[i + 1]);
  return [...latin, ...cjk, ...bigrams].filter((token) => token.length >= 2 || /[一-鿿]/.test(token));
}

function coreConceptNames(facet) {
  return (Array.isArray(facet?.core_concepts) ? facet.core_concepts : [])
    .map((concept) => String(concept?.name || "").trim())
    .filter(Boolean);
}

function identityHints(facet) {
  const hints = [
    facet?.slug,
    facet?.title,
    String(facet?.node_id || "").replace(/^(content|paper|project)[/:]/, ""),
  ];
  return hints
    .flatMap((hint) => String(hint || "").split(/[—\-_/|:()（）\s]+/))
    .map((hint) => hint.toLowerCase().trim())
    .filter((hint) => hint.length >= 4 && !IDENTITY_STOPWORDS.has(hint) && !["content", "paper", "project"].includes(hint));
}

function mentionsFacet(text, facet) {
  const lower = String(text || "").toLowerCase();
  return identityHints(facet).some((hint) => lower.includes(hint));
}

function overlapScore(aTokens, bTokens) {
  const b = new Set(bTokens);
  let score = 0;
  for (const token of new Set(aTokens)) if (b.has(token)) score += 1;
  return score;
}

export function generateFacetCandidates(facets, { topK = 6 } = {}) {
  const docs = facets
    .filter((facet) => facet && facet.status !== "reject")
    .map((facet) => ({
      facet,
      slug: facet.slug,
      node_id: facet.node_id,
      textTokens: tokens(facetText(facet)),
      concepts: coreConceptNames(facet),
    }))
    .filter((item) => item.slug || item.node_id);

  const byFacet = new Map();
  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const a = docs[i];
      const b = docs[j];
      const sharedConcepts = a.concepts.filter((concept) => b.concepts.includes(concept));
      const lexical = overlapScore(a.textTokens, b.textTokens);
      const aText = facetText(a.facet);
      const bText = facetText(b.facet);
      const explicitMentions = (mentionsFacet(aText, b.facet) ? 1 : 0) + (mentionsFacet(bText, a.facet) ? 1 : 0);
      const score = sharedConcepts.length * 20 + explicitMentions * 500 + lexical;
      if (score <= 0) continue;
      const candidate = {
        from: a.node_id,
        to: b.node_id,
        from_slug: a.slug,
        to_slug: b.slug,
        score,
        shared_core_concepts: sharedConcepts,
        lexical_overlap: lexical,
        explicit_mentions: explicitMentions,
        from_field: sharedConcepts.length ? "core_concept" : "method",
        to_field: sharedConcepts.length ? "core_concept" : "method",
      };
      for (const key of [a.slug || a.node_id, b.slug || b.node_id]) {
        if (!byFacet.has(key)) byFacet.set(key, []);
        byFacet.get(key).push(candidate);
      }
    }
  }

  const picked = new Map();
  for (const list of byFacet.values()) {
    list.sort((a, b) => b.score - a.score);
    for (const candidate of list.slice(0, topK)) {
      const key = [candidate.from, candidate.to].sort().join("|");
      if (!picked.has(key)) picked.set(key, candidate);
    }
  }
  return [...picked.values()].sort((a, b) => b.score - a.score);
}

export function limitFacetCandidates(facets, { topK = 5, maxCandidates = MAX_LLM_CANDIDATES } = {}) {
  const boundedTopK = Math.max(1, Math.min(Number(topK) || 5, 5));
  const boundedMax = Math.max(1, Math.min(Number(maxCandidates) || MAX_LLM_CANDIDATES, MAX_LLM_CANDIDATES));
  return generateFacetCandidates(facets, { topK: boundedTopK }).slice(0, boundedMax);
}

function nodeLookup(nodes) {
  const bySlug = new Map();
  const byId = new Map();
  for (const node of nodes || []) {
    if (node?.id) byId.set(node.id, node);
    if (node?.slug && !bySlug.has(node.slug)) bySlug.set(node.slug, node);
    if (node?.id) bySlug.set(String(node.id).replace(/^(paper|project|ghost|content|radar|deep-dive|concept|method|claim|evidence|artifact|source-pack|evidence-pack|system-component|design-principle|taste)[/:]/, ""), node);
  }
  return { bySlug, byId };
}

export function buildDeterministicFacetRelationEdges({ facets = [], nodes = [], topK = 6 } = {}) {
  const candidates = generateFacetCandidates(facets, { topK });
  const candidatePairs = new Set(candidates.flatMap((candidate) => [
    `${candidate.from_slug}|${candidate.to_slug}`,
    `${candidate.to_slug}|${candidate.from_slug}`,
    `${candidate.from}|${candidate.to}`,
    `${candidate.to}|${candidate.from}`,
  ]));
  const { bySlug } = nodeLookup(nodes);
  const edges = [];

  for (const facet of facets) {
    if (!facet || facet.status === "reject" || !Array.isArray(facet.edges)) continue;
    const fromNode = bySlug.get(facet.slug) || bySlug.get(String(facet.node_id || "").replace(/^content\//, "")) || { id: facet.node_id };
    for (const edge of facet.edges) {
      const type = normalizeRelationType(edge?.type);
      if (!isTypedRelation(type)) continue;
      const toNode = bySlug.get(edge.to);
      if (!fromNode?.id || !toNode?.id || fromNode.id === toNode.id) continue;
      const explicitPair = `${facet.slug}|${edge.to}`;
      const inferredPair = `${fromNode.id}|${toNode.id}`;
      if (!candidatePairs.has(explicitPair) && !candidatePairs.has(inferredPair) && edge.confidence !== "high") {
        continue;
      }
      edges.push(normalizeRelationEdge({
        from: fromNode.id,
        to: toNode.id,
        type,
        confidence: edge.confidence || "medium",
        evidence: edge.evidence,
        source_file: facet._file ? `data/knowledge-graph/facets/${facet._file}` : undefined,
        kg_relation_engine: true,
        cross_doc: true,
        from_field: edge.concept ? "core_concept" : "method",
        to_field: edge.concept ? "core_concept" : "method",
        ...(edge.concept ? { core_concept: edge.concept } : {}),
      }));
    }
  }
  return edges;
}

function facetKey(facet) {
  return facet?.slug || facet?.node_id || "";
}

function facetLookup(facets) {
  const byKey = new Map();
  for (const facet of facets || []) {
    if (!facet || facet.status === "reject") continue;
    for (const key of [facet.slug, facet.node_id]) {
      if (key) byKey.set(key, facet);
    }
  }
  return byKey;
}

function findCandidateFacet(byKey, ...keys) {
  for (const key of keys) {
    if (key && byKey.has(key)) return byKey.get(key);
  }
  return null;
}

function relationPrompt({ candidate, a, b }) {
  const taxonomy = [...TAXONOMY_EDGE_TYPES].join(", ");
  return [
    "Judge one possible Mind Palace typed relation. Return ONLY JSON.",
    "",
    "Allowed JSON shapes:",
    "{\"decision\":\"NO_EDGE\",\"reason\":\"...\"}",
    "{\"decision\":\"EDGE\",\"direction\":\"A_TO_B|B_TO_A\",\"type\":\"one taxonomy type\",\"dominance\":\"better|worse|mixed optional\",\"evidence\":\"verbatim prose sentence/span from A or B\",\"use\":\"how to use this edge\"}",
    "",
    `Taxonomy types: ${taxonomy}`,
    "",
    "Hard gates:",
    "- Default to NO_EDGE.",
    "- Reject category-level pairings such as both using GRPO, both being memory systems, or same broad tag.",
    "- Evidence must be a verbatim sentence/span from A or B prose below.",
    "- Evidence must state the specific comparison, layer, complement, replacement, lineage, validation, conflict, or evaluation signal.",
    "- Use must be an actionable design/reasoning instruction.",
    "",
    `Candidate hints: shared_core_concepts=${(candidate.shared_core_concepts || []).join(", ") || "none"}; lexical_overlap=${candidate.lexical_overlap || 0}; explicit_mentions=${candidate.explicit_mentions || 0}`,
    "",
    `A slug=${a.slug || ""} node=${a.node_id || ""}`,
    clipped(facetRelationProse(a), 1800),
    "",
    `B slug=${b.slug || ""} node=${b.node_id || ""}`,
    clipped(facetRelationProse(b), 1800),
  ].join("\n");
}

async function runClaudePrompt(prompt, { model = DEFAULT_LLM_MODEL, timeoutMs = DEFAULT_LLM_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", prompt, "--model", model], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude relation judge timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && stdout.trim()) resolve(stdout);
      else reject(new Error(`claude relation judge failed (${code}): ${stderr.slice(0, 300)}`));
    });
  });
}

async function runDeepSeekPrompt(prompt, { model, timeoutMs = DEFAULT_LLM_TIMEOUT_MS } = {}) {
  const client = createDeepSeekClient({ apiTimeoutMs: timeoutMs });
  return client.chatJson({
    model: model || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    maxTokens: 600,
    system: "You are a strict relation extraction judge. Return one valid JSON object only.",
    user: prompt,
  });
}

async function runRelationJudge(prompt, { model = DEFAULT_LLM_MODEL, timeoutMs = DEFAULT_LLM_TIMEOUT_MS, provider } = {}) {
  const selectedProvider = provider || (String(model).toLowerCase().startsWith("deepseek") ? "deepseek" : "claude");
  if (selectedProvider === "deepseek") return runDeepSeekPrompt(prompt, { model, timeoutMs });
  return runClaudePrompt(prompt, { model, timeoutMs });
}

function evidenceInFacetProse(evidence, ...facets) {
  const quote = compactWhitespace(evidence);
  if (quote.length < 8) return false;
  return facets.some((facet) => compactWhitespace(facetRelationProse(facet)).includes(quote));
}

function normalizeLlmDecision(rawDecision) {
  const decision = typeof rawDecision === "string" ? parseJson(rawDecision) : rawDecision;
  if (!decision || typeof decision !== "object") return { decision: "NO_EDGE", reason: "empty decision" };
  const normalizedDecision = String(decision.decision || decision.kind || "").toUpperCase();
  if (normalizedDecision !== "EDGE") return { decision: "NO_EDGE", reason: decision.reason || "model returned NO_EDGE" };
  return { ...decision, decision: "EDGE" };
}

function edgeFromLlmDecision({ decision, candidate, a, b }) {
  const type = normalizeRelationType(decision.type);
  if (!TAXONOMY_EDGE_TYPES.has(type)) return null;
  const direction = String(decision.direction || (SYMMETRIC_LLM_EDGE_TYPES.has(type) ? "A_TO_B" : "")).toUpperCase();
  if (!LLM_EDGE_DIRECTIONS.has(direction)) return null;
  const evidence = compactWhitespace(decision.evidence);
  const use = compactWhitespace(decision.use || decision.how_to_use);
  if (!evidenceInFacetProse(evidence, a, b) || !use) return null;

  const from = direction === "A_TO_B" ? candidate.from : candidate.to;
  const to = direction === "A_TO_B" ? candidate.to : candidate.from;
  if (!from || !to || from === to) return null;

  return normalizeRelationEdge({
    from,
    to,
    type,
    confidence: "medium",
    evidence,
    use,
    ...(decision.dominance ? { dominance: String(decision.dominance) } : {}),
    kg_relation_engine: true,
    kg_relation_llm: true,
    cross_doc: true,
    from_field: candidate.from_field || "method",
    to_field: candidate.to_field || "method",
    candidate_score: candidate.score,
    candidate_shared_core_concepts: candidate.shared_core_concepts || [],
    from_slug: direction === "A_TO_B" ? candidate.from_slug : candidate.to_slug,
    to_slug: direction === "A_TO_B" ? candidate.to_slug : candidate.from_slug,
  });
}

export async function extractEdgesLLM(facets, {
  model = DEFAULT_LLM_MODEL,
  topK = 5,
  maxCandidates = MAX_LLM_CANDIDATES,
  judge,
  provider,
  timeoutMs = DEFAULT_LLM_TIMEOUT_MS,
  logger = console,
} = {}) {
  const byKey = facetLookup(facets);
  const candidates = limitFacetCandidates(facets, { topK, maxCandidates });
  const judgeOne = judge || ((prompt) => runRelationJudge(prompt, { model, timeoutMs, provider }));
  const edges = [];
  const stats = {
    model,
    candidates: candidates.length,
    judged: 0,
    accepted: 0,
    noEdge: 0,
    failed: 0,
    rejected: 0,
    topK: Math.min(Math.max(1, Number(topK) || 5), 5),
    maxCandidates: Math.min(Math.max(1, Number(maxCandidates) || MAX_LLM_CANDIDATES), MAX_LLM_CANDIDATES),
  };

  for (const candidate of candidates) {
    const a = findCandidateFacet(byKey, candidate.from_slug, candidate.from);
    const b = findCandidateFacet(byKey, candidate.to_slug, candidate.to);
    if (!a || !b || facetKey(a) === facetKey(b)) {
      stats.rejected += 1;
      continue;
    }
    stats.judged += 1;
    try {
      const prompt = relationPrompt({ candidate, a, b });
      const raw = await judgeOne(prompt, { candidate, a, b, model });
      const decision = normalizeLlmDecision(raw);
      if (decision.decision !== "EDGE") {
        stats.noEdge += 1;
        continue;
      }
      const edge = edgeFromLlmDecision({ decision, candidate, a, b });
      if (!edge) {
        stats.rejected += 1;
        continue;
      }
      edges.push(edge);
      stats.accepted += 1;
    } catch (error) {
      stats.failed += 1;
      logger?.warn?.(`[relation-engine] LLM pair skipped ${candidate.from_slug || candidate.from} -> ${candidate.to_slug || candidate.to}: ${error.message}`);
    }
  }

  return { edges, stats };
}
