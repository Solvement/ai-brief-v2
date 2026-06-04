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

test("ordinary AI projects need a strong signal before Tier 3", () => {
  const ordinary = {
    owner: "indie-dev",
    owner_type: "User",
    repo: "agent-workbench",
    trend_sources: ["github-trending:daily", "github-trending:weekly"],
    appears_in_tabs: ["daily", "weekly"],
    stars: 2400,
    stars_in_period: 520,
    forks: 80,
    language: "TypeScript",
    topics: ["ai", "agent", "mcp"],
    description: "AI agent workbench with MCP tools, RAG memory, install docs, examples, demos, and tests",
    created_at: "2026-05-01T00:00:00Z",
    raw_readme: "Agent runtime with MCP tools, RAG memory, installation, examples, demos, tests, docs, CLI usage, and reusable workflow orchestration. ".repeat(30),
    readme_found: true,
    readme_fetch_failed: false,
    readme_empty: false,
    readme_length: 3600,
    top_level_dirs: ["src", "agents", "mcp", "docs", "examples", "tests"],
    key_files: ["package.json", "README.md"],
    has_docs: true,
    has_examples: true,
    has_tests: true,
    has_install: true,
    has_cli: true,
    has_agents: true,
    has_mcp: true,
    has_skills: false,
    has_models: true,
    has_demo: true,
    package_files: { package_json: true },
  };

  const decision = decideProjectDepth({ ranking: scoreProject(ordinary), evidence_signals: ordinary });

  assert.equal(decision.project_tier, 2);
  assert.equal(decision.final_depth, "analysis");
  assert.equal(decision.requires_manual_confirmation, false);
  assert.ok(!decision.ranking_reasons.some((reason) => reason.startsWith("tier3:strong_signal:")));
});

test("Tier 3 is scarce and marked only when a strong signal is present", () => {
  const arxivBacked = {
    owner: "research-lab",
    owner_type: "Org",
    repo: "agentic-training-runtime",
    trend_sources: ["github-trending:daily", "github-trending:weekly"],
    appears_in_tabs: ["daily", "weekly"],
    stars: 3200,
    stars_in_period: 720,
    forks: 120,
    language: "Python",
    topics: ["ai", "agent", "benchmark"],
    description: "Novel agentic training runtime with execution feedback benchmark",
    homepage: "https://arxiv.org/abs/2601.12345",
    created_at: "2026-04-15T00:00:00Z",
    raw_readme: "Novel agentic training method with execution feedback, benchmark results, installation, examples, demos, tests, docs, and CLI usage. arXiv:2601.12345 ".repeat(30),
    readme_found: true,
    readme_fetch_failed: false,
    readme_empty: false,
    readme_length: 4500,
    top_level_dirs: ["src", "agents", "docs", "examples", "tests"],
    key_files: ["pyproject.toml", "README.md"],
    has_docs: true,
    has_examples: true,
    has_tests: true,
    has_install: true,
    has_cli: true,
    has_agents: true,
    has_mcp: false,
    has_skills: false,
    has_models: true,
    has_demo: true,
    package_files: { pyproject_toml: true },
  };

  const decision = decideProjectDepth({ ranking: scoreProject(arxivBacked), evidence_signals: arxivBacked });

  assert.equal(decision.project_tier, 3);
  assert.equal(decision.final_depth, "deep");
  assert.equal(decision.requires_manual_confirmation, true);
  assert.ok(decision.ranking_reasons.includes("tier3:strong_signal:arxiv"));
  assert.ok(decision.ranking_reasons.includes("manual_confirmation_required"));
});
