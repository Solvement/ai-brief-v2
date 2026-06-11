import test from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceSignals } from "./sources.mjs";

test("buildEvidenceSignals carries multi-source provenance metrics into rank signals", () => {
  const signals = buildEvidenceSignals({
    fullName: "owner/repo",
    owner: "owner",
    name: "repo",
    stars: 1000,
    starsGained: 120,
    starsGainedByWindow: { monthly: 900 },
    ranksByWindow: { monthly: 7 },
    windows: ["monthly"],
    provenance: [
      { source: "github-trending:monthly", metrics: { stars_gained: 900 } },
      { source: "hacker-news:show-hn", metrics: { hn_points: 140, hn_comments: 35 } },
      { source: "github-search-growth:agent", metrics: {} },
    ],
  }, {
    rawReadme: "# Repo\nAgent runtime with memory, evals, MCP, install guide, examples, and tests.",
    readmeState: { readme_found: true },
    artifactAudit: {
      topics: ["agents"],
      language: "TypeScript",
      top_level_dirs: ["src", "docs", "examples", "tests"],
      key_files: ["package.json"],
      package_files: { package_json: true },
      has_docs: true,
      has_examples: true,
      has_tests: true,
      has_ci: true,
      has_install: true,
      has_agents: true,
      has_mcp: true,
    },
  });

  assert.equal(signals.source_count, 3);
  assert.equal(signals.hn_points, 140);
  assert.equal(signals.hn_comments, 35);
  assert.equal(signals.ranks_by_window.monthly, 7);
  assert.equal(signals.has_ci, true);
});
