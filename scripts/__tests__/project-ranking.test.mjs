import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDailyDepthTargets,
  decideProjectDepth,
  depthAtLeast,
  scoreProject,
} from "../columns/projects/project-ranking.mjs";
import { projectRadarRegressionFixtures } from "./fixtures/project-radar-regression-fixtures.mjs";

function decisionFor(fixture) {
  const ranking = scoreProject(fixture.evidence_signals);
  return decideProjectDepth({ ranking, evidence_signals: fixture.evidence_signals });
}

test("project ranking returns the six deterministic sub-scores and tier", () => {
  const fixture = projectRadarRegressionFixtures.find((item) => item.id === "tinyhumansai/openhuman");
  const ranking = scoreProject(fixture.evidence_signals);

  for (const key of ["ai_relevance", "evidence_sufficiency", "architecture_value", "usability", "novelty", "trend_signal"]) {
    assert.equal(typeof ranking[key], "number");
  }
  assert.equal(ranking.total, ranking.ai_relevance + ranking.evidence_sufficiency + ranking.architecture_value + ranking.usability + ranking.novelty + ranking.trend_signal);
  assert.ok(["list_only", "light", "analysis", "deep_candidate"].includes(ranking.tier));
  assert.ok(ranking.ranking_reasons.length > 0);
});

test("regression fixtures keep real agent repos at least analysis when enriched", () => {
  for (const id of ["tinyhumansai/openhuman", "anthropics/financial-services"]) {
    const fixture = projectRadarRegressionFixtures.find((item) => item.id === id);
    const decision = decisionFor(fixture);

    assert.ok(
      depthAtLeast(decision.final_depth, "analysis"),
      `${id} expected >= analysis, got ${decision.final_depth} with ${decision.rejection_reasons.join(", ")}`,
    );
    assert.equal(decision.needs_enrichment, false);
  }
});

test("empty README, slogan-only, and high-star-only fixtures cannot deep", () => {
  for (const id of ["fixtures/empty-readme", "fixtures/slogan-only", "fixtures/high-star-only"]) {
    const fixture = projectRadarRegressionFixtures.find((item) => item.id === id);
    const decision = decisionFor(fixture);

    assert.ok(!depthAtLeast(decision.max_allowed_depth, "deep"), `${id} max_allowed_depth should be below deep`);
    assert.ok(!depthAtLeast(decision.final_depth, "deep"), `${id} final_depth should not be deep`);
    assert.ok(decision.rejection_reasons.length > 0);
  }
});

test("readme_fetch_failed is distinct from readme_empty and marks needs_enrichment", () => {
  const fixture = projectRadarRegressionFixtures.find((item) => item.id === "fixtures/readme-fetch-failed");
  const decision = decisionFor(fixture);

  assert.equal(decision.evidence_signals.readme_fetch_failed, true);
  assert.equal(decision.evidence_signals.readme_empty, false);
  assert.equal(decision.needs_enrichment, true);
  assert.equal(decision.final_depth, "needs_enrichment");
  assert.ok(decision.rejection_reasons.includes("readme_fetch_failed"));
});

test("daily depth target helper does not cap deep candidates", () => {
  const deepItems = projectRadarRegressionFixtures.slice(0, 2).map((fixture, index) => {
    const decision = decisionFor(fixture);
    decision.final_depth = "deep";
    return {
      candidate: {
        id: fixture.id,
        raw: { fullName: fixture.id, ranksByWindow: { daily: index + 1 } },
      },
      eval: {
        score: decision.ranking_score,
        ranking_score: decision.ranking_score,
        final_depth: "deep",
        depth_decision: decision,
      },
    };
  });

  const assigned = applyDailyDepthTargets(deepItems, {});
  assert.equal(assigned.filter((item) => item.eval.final_depth === "deep").length, 2);
  assert.equal(assigned.filter((item) => item.eval.rejection_reasons.some((reason) => reason.startsWith("daily_"))).length, 0);
});
