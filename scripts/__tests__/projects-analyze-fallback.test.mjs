import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { analyze } from "../columns/projects/index.mjs";

function candidate() {
  return {
    id: "project:owner/repo",
    column: "projects",
    source: "github-trending:daily",
    raw: {
      fullName: "owner/repo",
      owner: "owner",
      name: "repo",
      url: "https://github.com/owner/repo",
      description: "Agent framework with MCP tools and memory",
      language: "TypeScript",
      stars: 1200,
      forks: 80,
      starsGained: 120,
      windows: ["daily"],
      ranksByWindow: { daily: 1 },
    },
  };
}

function evidence() {
  return {
    kind: "readme",
    content: "Agent framework with install docs, examples, MCP connectors, memory, and tests.".repeat(20),
    evidence_signals: {
      readme_found: true,
      readme_fetch_failed: false,
      readme_empty: false,
      readme_length: 1600,
      has_docs: true,
      has_examples: true,
      has_tests: true,
      has_install: true,
      has_agents: true,
      has_mcp: true,
      has_skills: false,
      has_models: true,
      package_files: { package_json: true },
    },
  };
}

function triage() {
  const depthDecision = {
    ranking_score: 82,
    max_allowed_depth: "deep",
    final_depth: "deep",
    ranking_reasons: ["agent architecture signal", "MCP connector signal"],
    rejection_reasons: [],
    recommended_action: "deep_dive",
    needs_enrichment: false,
    review_verdict: "pending",
    review_issues: [],
  };

  return {
    candidateId: "project:owner/repo",
    decision: "radar",
    mode: "deterministic-radar",
    score: 82,
    worthDeepDive: 82,
    ranking_score: 82,
    reason: "deep candidate",
    signals: ["tier:deep_candidate", "final_depth:deep"],
    project_type: "agent_framework",
    final_depth: "deep",
    max_allowed_depth: "deep",
    recommended_action: "deep_dive",
    needs_enrichment: false,
    depth_decision: depthDecision,
  };
}

test("projects brief-wiki analyze falls back to a needs_enrichment radar payload when deep-dive JSON fails", async () => {
  const insertedAnalyses = [];
  const upsertedEvals = [];
  const warnings = [];
  const db = {
    upsertEval(row) {
      upsertedEvals.push(row);
      return row;
    },
    insertAnalysis(row) {
      insertedAnalyses.push(row);
      return { id: `analysis-${insertedAnalyses.length}`, ...row };
    },
  };

  const result = await analyze({ candidate: candidate(), eval: triage() }, evidence(), {
    logger: {
      warn: (message) => warnings.push(message),
      info() {},
    },
    options: {
      projectBriefWiki: true,
      codexDeepDiveAuthoring: false,
      briefWikiContentDir: path.join(os.tmpdir(), "ai-brief-empty-content-dir"),
      db,
      now: () => "2026-06-03T12:00:00.000Z",
      chatJson: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    },
  });

  assert.equal(result.status, "needs_enrichment");
  assert.equal(result.generated, false);
  assert.equal(result.fallback_tier, "light");
  assert.match(result.reason, /deep_dive_failed/);
  assert.match(result.error, /Unexpected end of JSON input/);

  assert.equal(upsertedEvals.at(-1).decision, "needs_enrichment");
  assert.equal(insertedAnalyses.at(-1).tier, "light");
  assert.equal(insertedAnalyses.at(-1).model, "project-deep-dive-fallback");
  assert.equal(insertedAnalyses.at(-1).payload.final_depth, "needs_enrichment");
  assert.equal(insertedAnalyses.at(-1).payload.needs_enrichment, true);
  assert.ok(insertedAnalyses.at(-1).payload.rejection_reasons.includes("deep_dive_generation_failed"));
  assert.ok(warnings.some((message) => /brief-wiki deep-dive failed/.test(message)));
});
