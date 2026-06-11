import test from "node:test";
import assert from "node:assert/strict";

import {
  decideProjectDepth,
  scoreDeterministicSignals,
  scoreProject,
} from "./project-ranking.mjs";

const baseSignals = {
  owner: "acme",
  owner_type: "Organization",
  repo: "agent-runtime",
  description: "Agent runtime with memory, tool calling, eval harness, and MCP server.",
  raw_readme: [
    "Agent runtime with memory, retrieval, eval harness, MCP server, install guide, examples, and tests.",
    "The runtime exposes a planner loop, a tool registry, a state store, and a validation harness.",
    "Install with npm install agent-runtime, then run examples/basic-agent.ts to execute a tool-calling workflow.",
    "Tests cover memory writes, retrieval, MCP server registration, and eval reports.",
    "Docs describe failure recovery, trace logging, and policy checks for autonomous coding agents.",
  ].join(" "),
  readme_found: true,
  readme_length: 1600,
  stars: 4200,
  stars_in_period: 1800,
  stars_gained_by_window: { monthly: 1800 },
  ranks_by_window: { monthly: 8 },
  trend_sources: ["github-trending:monthly", "hacker-news:show-hn", "github-search-growth:agent"],
  source_provenance: [
    { source: "github-trending:monthly" },
    { source: "hacker-news:show-hn", metrics: { hn_points: 160, hn_comments: 48 } },
    { source: "github-search-growth:agent" },
  ],
  hn_points: 160,
  hn_comments: 48,
  language: "TypeScript",
  top_level_dirs: ["src", "docs", "examples", "tests"],
  key_files: ["package.json", ".github/workflows/ci.yml"],
  has_docs: true,
  has_examples: true,
  has_tests: true,
  has_ci: true,
  has_install: true,
  has_agents: true,
  has_mcp: true,
  package_files: { package_json: true },
};

test("scoreDeterministicSignals emits explainable v2 subscore parts", () => {
  const scored = scoreDeterministicSignals(baseSignals);

  assert.ok(scored.total >= 78);
  assert.ok(scored.subscores.star_velocity > 0);
  assert.ok(scored.subscores.cross_source >= 12);
  assert.ok(scored.subscores.topic_fit >= 15);
  assert.ok(scored.subscores.maturity >= 12);
  assert.equal(scored.subscores.blacklist_penalty, 0);
  assert.ok(scored.reasons.some((reason) => reason.startsWith("signal:cross_source")));
});

test("decideProjectDepth maps architecture projects over the signal bar to deep", () => {
  const ranking = scoreProject(baseSignals);
  const decision = decideProjectDepth({ ranking, evidence_signals: baseSignals });

  assert.equal(decision.depth_band, "deep");
  assert.equal(decision.final_depth, "deep");
  assert.equal(decision.analysis_depth, "deep");
  assert.ok(decision.ranking_reasons.includes("depth_gate:monthly_top10_default_deep"));
});

test("resource/tutorial projects are capped at light even with heat", () => {
  const signals = {
    ...baseSignals,
    repo: "awesome-agent-course",
    description: "Awesome course and tutorial resources for AI agents.",
    raw_readme: "Awesome list of courses, tutorials, lessons, and roadmap resources for AI agents.",
    has_install: false,
    has_examples: false,
    has_tests: false,
    has_ci: false,
    top_level_dirs: [],
    key_files: ["README.md"],
    package_files: {},
  };
  const decision = decideProjectDepth({ ranking: scoreProject(signals), evidence_signals: signals });

  assert.equal(decision.depth_band, "light");
  assert.equal(decision.final_depth, "light");
  assert.ok(decision.rejection_reasons.includes("depth_gate:teaching_skill_or_resource_max_light"));
});
