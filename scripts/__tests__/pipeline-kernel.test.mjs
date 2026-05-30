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
