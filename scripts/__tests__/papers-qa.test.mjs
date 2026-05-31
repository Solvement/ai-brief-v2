import { test } from "node:test";
import assert from "node:assert/strict";
import { qaGate } from "../columns/papers/qa.mjs";

function validAnalysis(overrides = {}) {
  return {
    id: "agent-harness-engineering-survey",
    title: "Agent Harness Engineering: A Survey",
    authors: "Anonymous",
    venue: "TMLR under review",
    sourceName: "OpenReview",
    sourceUrl: "https://openreview.net/pdf?id=3hXEPbG0dh",
    verifiedAt: "2026-05-30T00:00:00.000Z",
    tier: "deep",
    leadJudgment: "The paper frames harness engineering as the reliability bottleneck.",
    sections: [
      {
        heading: "Abstract",
        summary: "The paper surveys agent harness components and their reliability role.",
      },
    ],
    limitsAndFuture: {
      paperStated: "The paper calls out observability and governance gaps.",
      evidenceNotes: "The evidence is survey-style and should not be read as a benchmark result.",
    },
    selection: {
      convergence: ["OpenReview"],
      track: ["Agent Harness / Observability"],
      ideaSignal: "review:75",
    },
    provenance: {
      sourceUrl: "https://openreview.net/pdf?id=3hXEPbG0dh",
      evidenceKind: "paper-text",
    },
    ...overrides,
  };
}

const evidence = {
  kind: "paper-text",
  content: "The survey describes agent harnesses, observability, and open problems.",
};

test("placeholder text fails QA", async () => {
  const result = await qaGate(validAnalysis({
    sections: [{ heading: "Abstract", summary: "Needs rewrite [\u5360\u4f4d]." }],
  }), evidence, { options: {} });

  assert.equal(result.structuralPass, false);
  assert.equal(result.verdict, "fail");
  assert.ok(result.flags.some((flag) => flag.id === "no-placeholder"));
});

test("missing verifiedAt fails QA", async () => {
  const { verifiedAt, ...missingVerifiedAt } = validAnalysis();
  const result = await qaGate(missingVerifiedAt, evidence, { options: {} });

  assert.equal(result.structuralPass, false);
  assert.equal(result.verdict, "fail");
  assert.ok(result.flags.some((flag) => flag.id === "required-field" && flag.path === "verifiedAt"));
});

test("clean valid paper analysis passes QA", async () => {
  const result = await qaGate(validAnalysis(), evidence, { options: {} });

  assert.equal(result.structuralPass, true);
  assert.equal(result.groundedScore, null);
  assert.deepEqual(result.flags, []);
  assert.equal(result.verdict, "pass");
});
