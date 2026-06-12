import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicFacetRelationEdges,
  extractEdgesLLM,
  facetRelationProse,
  generateFacetCandidates,
  isMechanicalRelation,
  isTypedRelation,
  limitFacetCandidates,
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

test("facetRelationProse includes prose fields and core concept evidence for LLM judging", () => {
  const prose = facetRelationProse({
    title: "Codegraph",
    facets: { innovation: "staleness banner prevents stale answers" },
    self_evo_use: "Use as index infrastructure.",
    core_concepts: [{ name: "freshness gate", evidence: "pending files require direct Read fallback" }],
  });
  assert.match(prose, /innovation: staleness banner/);
  assert.match(prose, /self_evo_use: Use as index infrastructure/);
  assert.match(prose, /core_concept:freshness gate: pending files/);
});

test("limitFacetCandidates caps LLM work to topK<=10 and maxCandidates<=300", () => {
  const facets = Array.from({ length: 40 }, (_, index) => ({
    slug: `facet-${index}`,
    node_id: `content/facet-${index}`,
    title: `Facet ${index}`,
    facets: { method: `shared memory controller ${index}` },
    core_concepts: [{ name: "shared relation candidate" }],
  }));
  // REMINE (0e9eb16) 把 MAX_LLM_CANDIDATES 提到 300 以覆盖 93 个 facet；上界断言跟随常量。
  const candidates = limitFacetCandidates(facets, { topK: 99, maxCandidates: 999 });
  assert.ok(candidates.length <= 300);
});

test("extractEdgesLLM accepts mock taxonomy edge with verbatim evidence and use", async () => {
  const evidence = "A provides the low-level index and B provides the visual navigation layer.";
  const facets = [
    {
      slug: "a",
      node_id: "content/a",
      title: "A",
      facets: { method: evidence, innovation: "shared graph infrastructure" },
      core_concepts: [{ name: "graph interface" }],
    },
    {
      slug: "b",
      node_id: "content/b",
      title: "B",
      facets: { method: "visual graph navigation for users", innovation: "shared graph infrastructure" },
      core_concepts: [{ name: "graph interface" }],
    },
  ];
  const { edges, stats } = await extractEdgesLLM(facets, {
    judge: async () => ({
      decision: "EDGE",
      direction: "A_TO_B",
      type: "layers_with",
      evidence,
      use: "Layer A below B as the substrate for navigation.",
    }),
  });
  assert.equal(stats.accepted, 1);
  assert.equal(edges.length, 1);
  assert.equal(edges[0].from, "content/a");
  assert.equal(edges[0].to, "content/b");
  assert.equal(edges[0].type, "layers_with");
  assert.equal(edges[0].kg_relation_llm, true);
  assert.equal(edges[0].use, "Layer A below B as the substrate for navigation.");
});

test("extractEdgesLLM rejects mock edge when evidence is not in facet prose", async () => {
  const facets = [
    {
      slug: "a",
      node_id: "content/a",
      title: "A",
      facets: { method: "memory policy controller" },
      core_concepts: [{ name: "memory policy" }],
    },
    {
      slug: "b",
      node_id: "content/b",
      title: "B",
      facets: { method: "memory evaluation suite" },
      core_concepts: [{ name: "memory policy" }],
    },
  ];
  const { edges, stats } = await extractEdgesLLM(facets, {
    judge: async () => ({
      decision: "EDGE",
      direction: "A_TO_B",
      type: "complements",
      evidence: "This sentence was never present in either endpoint.",
      use: "Combine the method and evaluator.",
    }),
  });
  assert.equal(edges.length, 0);
  assert.equal(stats.rejected, 1);
});
