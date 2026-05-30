import test from "node:test";
import assert from "node:assert/strict";
import { adjustWorthForAiEngineerFocus, BOOST_TERMS, CAP_TERMS } from "../lib/project-ranking.mjs";

test("boost path: agent keyword raises score by 6 and records reason", () => {
  const out = adjustWorthForAiEngineerFocus(
    { fullName: "org/agent-thing", description: "autonomous agent framework" },
    null,
    { tldr: "", light: "", tags: [], worthDeepDive: 70 },
  );

  assert.equal(out.worthDeepDive, 76);
  assert.equal(out.rankingReason.decision, "boost");
  assert.equal(out.rankingReason.rawScore, 70);
  assert.equal(out.rankingReason.finalScore, 76);
  assert.ok(out.rankingReason.matchedBoostTerms.includes("agent"));
  assert.equal(out.rankingReason.matchedCapTerms.length, 0);
  assert.ok(out.rankingReason.explanation.includes("boost") || out.rankingReason.explanation.includes("加权"));
});

test("low-priority keyword is a penalty feature, not a hard cap when AI signals are strong", () => {
  const out = adjustWorthForAiEngineerFocus(
    { fullName: "org/trader", description: "crypto trading agent with MCP memory and eval workflow" },
    "Reusable agent infrastructure for finance workflows, including RAG memory and tool use.",
    { tldr: "", light: "", tags: [], worthDeepDive: 80 },
  );

  assert.ok(out.worthDeepDive >= 70, `expected score >= 70, got ${out.worthDeepDive}`);
  assert.equal(out.rankingReason.decision, "boost");
  assert.ok(out.rankingReason.matchedCapTerms.length > 0);
  assert.ok(out.rankingReason.matchedBoostTerms.length > 0);
  assert.equal(out.rankingReason.rawScore, 80);
});

test("neutral text keeps the model score without a non-core hard cap", () => {
  const out = adjustWorthForAiEngineerFocus(
    { fullName: "org/utility", description: "a generic utility library" },
    null,
    { tldr: "", light: "", tags: [], worthDeepDive: 70 },
  );

  assert.equal(out.worthDeepDive, 70);
  assert.equal(out.rankingReason.decision, "no-change");
  assert.equal(out.rankingReason.matchedBoostTerms.length, 0);
  assert.equal(out.rankingReason.matchedCapTerms.length, 0);
  assert.equal(out.rankingReason.finalScore, 70);
});

test("BOOST_TERMS and CAP_TERMS are non-empty, deduped, lowercase", () => {
  assert.ok(BOOST_TERMS.length > 0);
  assert.ok(CAP_TERMS.length > 0);
  assert.equal(new Set(BOOST_TERMS).size, BOOST_TERMS.length);
  assert.equal(new Set(CAP_TERMS).size, CAP_TERMS.length);
  assert.ok(BOOST_TERMS.every((term) => term === term.toLowerCase()));
  assert.ok(CAP_TERMS.every((term) => term === term.toLowerCase()));
  assert.equal(BOOST_TERMS.filter((term) => CAP_TERMS.includes(term)).length, 0);
});
