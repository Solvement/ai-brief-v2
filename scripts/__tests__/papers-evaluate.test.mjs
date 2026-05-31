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
