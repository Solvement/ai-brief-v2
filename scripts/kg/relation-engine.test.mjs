import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicFacetRelationEdges,
  generateFacetCandidates,
  isMechanicalRelation,
  isTypedRelation,
  normalizeGraphRelations,
  normalizeRelationType,
} from "./relation-engine.mjs";

test("normalizeRelationType maps killed same_use_case into taxonomy complements", () => {
  assert.equal(normalizeRelationType("same_use_case"), "complements");
  assert.equal(isTypedRelation("same_use_case"), true);
});

test("normalizeGraphRelations hides mechanical edges and enriches typed edges with use", () => {
  const edges = normalizeGraphRelations([
    { from: "a", to: "b", type: "references", evidence: "link" },
    { from: "a", to: "c", type: "composes_with", evidence: "method A feeds method C" },
  ]);
  assert.equal(isMechanicalRelation(edges[0].type), true);
  assert.equal(edges[0].layer, "mechanical");
  assert.equal(edges[0].hidden, true);
  assert.equal(edges[1].use, "Use together as adjacent pipeline stages.");
  assert.equal(edges[1].from_field, "method");
  assert.equal(edges[1].to_field, "method");
});

test("generateFacetCandidates uses shared core_concepts and lexical overlap without all-pairs output", () => {
  const facets = [
    {
      slug: "agemem",
      node_id: "content/agemem",
      title: "AgeMem",
      facets: { method: "learned memory action controller", innovation: "memory policy" },
      core_concepts: [{ name: "可学习的记忆操作" }],
    },
    {
      slug: "memoryagentbench",
      node_id: "content/memoryagentbench",
      title: "MemoryAgentBench",
      facets: { method: "memory benchmark protocol", innovation: "memory tests" },
      core_concepts: [{ name: "可学习的记忆操作" }],
    },
    {
      slug: "unrelated",
      node_id: "content/unrelated",
      title: "Unrelated",
      facets: { method: "video rendering" },
      core_concepts: [{ name: "视频渲染" }],
    },
  ];
  const candidates = generateFacetCandidates(facets, { topK: 1 });
  assert.ok(candidates.some((candidate) => candidate.from_slug === "agemem" && candidate.to_slug === "memoryagentbench"));
  assert.ok(!candidates.some((candidate) => candidate.from_slug === "agemem" && candidate.to_slug === "unrelated"));
});

test("buildDeterministicFacetRelationEdges promotes explicit facet evidence only", () => {
  const facets = [
    {
      slug: "memoryagentbench",
      node_id: "content/memoryagentbench",
      title: "MemoryAgentBench",
      facets: { method: "memory benchmark protocol", innovation: "memory tests" },
      core_concepts: [{ name: "可学习的记忆操作" }],
      edges: [{
        to: "agemem",
        type: "composes_with",
        confidence: "high",
        evidence: "AgeMem supplies the method; MemoryAgentBench tests it.",
      }],
    },
    {
      slug: "agemem",
      node_id: "content/agemem",
      title: "AgeMem",
      facets: { method: "learned memory action controller", innovation: "memory policy" },
      core_concepts: [{ name: "可学习的记忆操作" }],
    },
  ];
  const nodes = [
    { id: "content/memoryagentbench", slug: "memoryagentbench" },
    { id: "content/agemem", slug: "agemem" },
  ];
  const edges = buildDeterministicFacetRelationEdges({ facets, nodes });
  assert.equal(edges.length, 1);
  assert.equal(edges[0].type, "composes_with");
  assert.equal(edges[0].use, "Use together as adjacent pipeline stages.");
  assert.equal(edges[0].evidence, "AgeMem supplies the method; MemoryAgentBench tests it.");
  assert.equal(edges[0].kg_relation_engine, true);
});
