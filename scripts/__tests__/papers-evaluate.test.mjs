import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, select } from "../columns/papers/evaluate.mjs";

const ctx = {
  options: {
    noLlm: true,
    now: () => "2026-05-30T00:00:00.000Z",
  },
};

function paperCandidate(id, raw) {
  return {
    id,
    column: "papers",
    source: raw.source || "arxiv_filtered",
    raw: {
      id,
      authors: [],
      abstract: "",
      source: "arxiv_filtered",
      sourceName: "arXiv filtered search",
      sourceUrl: `https://example.com/${id}`,
      venue: "",
      publishedAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
      tags: [],
      sourceSignals: [],
      focusTopics: [],
      ...raw,
    },
  };
}

test("convergence: >=2 independent trusted sources -> select", async () => {
  const cand = paperCandidate("paper:p1", {
    title: "Agent harness eval for tool-use systems",
    abstract: "A benchmark and evaluation framework for agent harness observability, execution traces, and SWE-Bench style coding agents.",
    source: "huggingface_daily",
    sourceName: "Hugging Face Daily Papers",
    sourceSignals: ["Hugging Face Daily Papers", "Papers with Code trending"],
    focusTopics: ["AI Agents", "Evaluation / Benchmarks", "Agent Harness / Observability"],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "agent harness eval" }, ctx);

  assert.equal(r.candidateId, "paper:p1");
  assert.equal(r.mode, "rank");
  assert.equal(r.decision, "select");
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(r.signals.includes("convergence:2"));
  assert.deepEqual(r.selection.convergence, ["Hugging Face Daily Papers", "Papers with Code trending"]);
});

test("single newsletter/recommendation source -> not auto-selected", async () => {
  const cand = paperCandidate("paper:p2", {
    title: "Cool agent idea from a newsletter",
    abstract: "A short recommendation about an agent workflow.",
    source: "newsletter",
    sourceName: "One Newsletter",
    sourceSignals: ["One Newsletter"],
    focusTopics: ["AI Agents"],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "agent workflow" }, ctx);

  assert.notEqual(r.decision, "select");
  assert.ok(r.signals.includes("convergence:0"));
});

test("single trusted curated platform feature -> select", async () => {
  const cand = paperCandidate("paper:p-curated", {
    title: "Datawhale feature on LLM evaluation and RAG memory systems",
    abstract: "A curated AI article covering large language model evaluation, retrieval augmented generation, and production workflow reliability.",
    source: "datawhale",
    sourceName: "Datawhale 科鲸",
    sourceSignals: ["Datawhale 科鲸"],
    focusTopics: ["Evaluation / Benchmarks", "RAG / Knowledge Systems"],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "Datawhale curated AI article" }, ctx);

  assert.equal(r.decision, "select");
  assert.deepEqual(r.selection.convergence, ["Datawhale 科鲸"]);
  assert.ok(r.signals.includes("priority:curated_platform"));
});

test("single best-paper award feature -> select", async () => {
  const cand = paperCandidate("paper:p-award", {
    title: "Outstanding Paper: Hardware-aware sparse attention for efficient LLM inference",
    abstract: "An award paper on efficient large language model inference, sparse attention, benchmark evaluation, and production deployment.",
    source: "best_paper",
    sourceName: "最佳论文奖",
    sourceSignals: ["AI Best Paper Awards", "best paper award", "ICLR 2025 Outstanding Paper"],
    focusTopics: ["Evaluation / Benchmarks", "LLM Security / Reliability"],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "best paper award" }, ctx);

  assert.equal(r.decision, "select");
  assert.deepEqual(r.selection.convergence, ["Best paper award"]);
  assert.ok(r.signals.includes("priority:best_paper"));
});

test("strong single trusted source can pass without multi-source convergence", async () => {
  const cand = paperCandidate("paper:p-strong", {
    title: "A benchmark framework for reliable RAG and LLM tool-use workflows",
    abstract: "A novel benchmark and evaluation framework for retrieval augmented generation, tool-use agents, workflow reliability, code implementation, production observability, ablation metrics, and deployment infrastructure.",
    source: "arxiv_filtered",
    sourceName: "arXiv filtered search",
    sourceSignals: ["arXiv"],
    focusTopics: ["Evaluation / Benchmarks", "RAG / Knowledge Systems", "Tool Use"],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "arXiv benchmark framework" }, ctx);

  assert.equal(r.decision, "select");
  assert.deepEqual(r.selection.convergence, ["arXiv"]);
});

test("off-track single source -> archive", async () => {
  const cand = paperCandidate("paper:p3", {
    title: "Unrelated protein folding note",
    abstract: "A narrow vertical biology paper about enzymes, assays, and lab measurements.",
    sourceSignals: ["arXiv"],
    focusTopics: [],
  });

  const r = await evaluate(cand, { kind: "paper-text", content: "protein folding" }, ctx);

  assert.equal(r.decision, "archive");
});

test("select keeps only selected evals by rank", () => {
  const evals = [
    { eval: { candidateId: "paper:a", decision: "archive", score: 99 } },
    { eval: { candidateId: "paper:b", decision: "select", score: 60 } },
    { eval: { candidateId: "paper:c", decision: "select", score: 80 } },
  ];

  assert.deepEqual(select(evals).map((item) => item.eval.candidateId), ["paper:c", "paper:b"]);
});
