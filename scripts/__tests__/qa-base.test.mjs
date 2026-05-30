import test from "node:test";
import assert from "node:assert/strict";
import { judgeGroundedness, normalizeGroundednessVerdict, runStructuralQa } from "../lib/qa-base.mjs";

test("structural QA passes complete sourced payload with verified latest claim", () => {
  const result = runStructuralQa({
    title: "Model release",
    summary: "Latest model update with verified source.",
    verifiedAt: "2026-05-29T00:00:00.000Z",
    claims: [
      { text: "The model card says context length changed.", sourceUrl: "https://example.com/model-card" },
    ],
  }, {
    requiredFields: ["title", "summary", "claims"],
    requireSources: true,
    claimsPath: "claims",
  });

  assert.equal(result.structuralPass, true);
  assert.equal(result.verdict, "pass");
  assert.deepEqual(result.flags, []);
});

test("structural QA fails placeholders mojibake missing fields sources and verifiedAt", () => {
  const result = runStructuralQa({
    title: "",
    summary: "[placeholder] latest release notes \u00e2\u0080\u00a6",
    claims: [
      { text: "Unsupported claim" },
    ],
  }, {
    requiredFields: ["title", "summary", "claims"],
    requireSources: true,
    claimsPath: "claims",
  });

  assert.equal(result.structuralPass, false);
  assert.equal(result.verdict, "fail");
  assert.ok(result.flags.some((flag) => flag.id === "required-field" && flag.path === "title"));
  assert.ok(result.flags.some((flag) => flag.id === "no-placeholder"));
  assert.ok(result.flags.some((flag) => flag.id === "no-mojibake"));
  assert.ok(result.flags.some((flag) => flag.id === "claims-sources"));
  assert.ok(result.flags.some((flag) => flag.id === "latest-claims-verified-at"));
});

test("LLM groundedness judge is skipped unless enabled", async () => {
  let called = false;
  const result = await judgeGroundedness({
    analysis: { claim: "x" },
    evidence: { text: "x" },
    enabled: false,
    chatJson: async () => {
      called = true;
      return {};
    },
  });

  assert.equal(called, false);
  assert.equal(result.verdict, "skipped");
  assert.equal(result.enabled, false);
});

test("groundedness verdict normalization clamps score and defaults verdict", () => {
  const result = normalizeGroundednessVerdict({ groundedScore: 1.8, flags: ["ok"] });

  assert.equal(result.enabled, true);
  assert.equal(result.verdict, "pass");
  assert.equal(result.groundedScore, 1);
  assert.deepEqual(result.flags, ["ok"]);
});
