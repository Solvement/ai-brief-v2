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
      const score = sharedConcepts.length * 20 + lexical;
      if (score <= 0) continue;
      const candidate = {
        from: a.node_id,
        to: b.node_id,
        from_slug: a.slug,
        to_slug: b.slug,
        score,
        shared_core_concepts: sharedConcepts,
        lexical_overlap: lexical,
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
