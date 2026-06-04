import test from "node:test";
import assert from "node:assert/strict";
import { runColumnPipeline } from "../lib/pipeline-kernel.mjs";

test("runColumnPipeline awaits async discover before evidence collection", async () => {
  const seen = [];
  const result = await runColumnPipeline({
    id: "async-test",
    async discover() {
      return [{ id: "cand-1" }];
    },
    async collectEvidence(candidate) {
      seen.push(candidate.id);
      return { text: "evidence" };
    },
    async evaluate(candidate) {
      return { decision: "select", mode: "rank", score: 80, reason: candidate.id, signals: [] };
    },
    async analyze(item) {
      return { id: item.candidate.id };
    },
    async qaGate() {
      return { verdict: "pass" };
    },
  });

  assert.deepEqual(seen, ["cand-1"]);
  assert.equal(result.candidates[0].id, "cand-1");
});

test("runColumnPipeline isolates per-item analyze and qaGate failures and still publishes", async () => {
  const warnings = [];
  let publishedItems = null;

  const result = await runColumnPipeline({
    id: "resilience-test",
    async discover() {
      return [{ id: "cand-1" }, { id: "cand-2" }, { id: "cand-3" }];
    },
    async collectEvidence(candidate) {
      return { text: candidate.id };
    },
    async evaluate(candidate) {
      return { decision: "select", mode: "rank", score: 80, reason: candidate.id, signals: [] };
    },
    async select(items) {
      return items;
    },
    async analyze(item) {
      if (item.candidate.id === "cand-2") throw new Error("deep dive JSON failed");
      return { id: item.candidate.id };
    },
    async qaGate(analysis) {
      if (!analysis) return { verdict: "skipped" };
      if (analysis.id === "cand-3") throw new Error("qa judge failed");
      return { verdict: "pass" };
    },
    async publish(items) {
      publishedItems = items;
      return { count: items.length };
    },
  }, {
    concurrency: { analyze: 2, qaGate: 2 },
    logger: { warn: (message) => warnings.push(message) },
  });

  assert.equal(result.published.count, 3);
  assert.equal(publishedItems.length, 3);
  assert.equal(result.analyses[1].analysis, null);
  assert.match(result.analyses[1].analysisError, /deep dive JSON failed/);
  assert.equal(result.qa[2].qa, null);
  assert.match(result.qa[2].qaError, /qa judge failed/);
  assert.equal(result.stages.find((stage) => stage.stage === "analyze").failures, 1);
  assert.equal(result.stages.find((stage) => stage.stage === "qaGate").failures, 1);
  assert.equal(result.stages.find((stage) => stage.stage === "publish").status, "pass");
  assert.equal(warnings.length, 2);
});
