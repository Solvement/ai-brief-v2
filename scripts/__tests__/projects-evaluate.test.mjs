import test from "node:test";
import assert from "node:assert/strict";
import { classifyProjectIntent, evaluate } from "../columns/projects/evaluate.mjs";

function candidate(overrides = {}) {
  return {
    id: "owner/repo",
    column: "projects",
    source: "github-topic:agent",
    dedupeKey: "owner/repo",
    raw: {
      fullName: "owner/repo",
      owner: "owner",
      name: "repo",
      url: "https://github.com/owner/repo",
      description: "finance agent infrastructure with MCP tools and RAG memory",
      language: "TypeScript",
      stars: 1200,
      forks: 80,
      starsGained: 180,
      ...overrides.raw,
    },
    ...overrides,
  };
}

test("project evaluate treats finance keywords as score features, not a hard cap", async () => {
  const result = await evaluate(candidate(), {
    kind: "readme",
    content: "This repo builds reusable agent infrastructure for finance workflows with MCP, RAG, memory, evals, and tool-use orchestration.",
    artifactAudit: {
      has_src: true,
      has_tests: true,
      has_docs: true,
      has_examples: true,
      has_packages: true,
      has_ci: true,
      license_spdx_id: "MIT",
      pushed_at: "2026-05-29T00:00:00Z",
      latest_release_tag_name: "v1.0.0",
      archived: false,
    },
  }, {
    options: {
      noLlm: false,
      chatJson: async () => ({
        worthDeepDive: 82,
        tags: ["agent", "MCP", "finance"],
        tldr: "Reusable agent infrastructure for financial workflows.",
        light: "Shows how to wire MCP tools, retrieval memory, and eval loops into finance agents.",
        intent: "tool",
        reason: "The finance domain is incidental; the reusable agent architecture is the learning value.",
        project_type: "agent_framework",
        verdict: "deep_dive",
        ratings: {
          relevance_to_ai_engineer: 5,
          engineering_depth: 4,
          reuse_value: 5,
          maturity: 4,
        },
      }),
    },
  });

  assert.equal(result.mode, "rank");
  assert.equal(result.decision, "select");
  assert.ok(result.score >= 70, `expected score >= 70, got ${result.score}`);
  assert.equal(result.intent, "tool");
  assert.equal(result.project_type, "agent_framework");
  assert.equal(result.verdict, "deep_dive");
  assert.deepEqual(result.ratings, {
    relevance_to_ai_engineer: 5,
    engineering_depth: 4,
    reuse_value: 5,
    maturity: 4,
  });
  assert.ok(result.signals.includes("finance"));
  assert.ok(result.signals.includes("agent"));
  assert.ok(result.signals.includes("project_type:agent_framework"));
  assert.ok(result.signals.includes("verdict:deep_dive"));
  assert.notEqual(result.rankingReason.decision, "cap-low-priority");
});

test("project evaluate gates deep selection by verdict", async () => {
  const result = await evaluate(candidate(), {
    kind: "readme",
    content: "Reusable MCP and RAG project with strong keywords but thin artifacts.",
  }, {
    options: {
      noLlm: false,
      chatJson: async () => ({
        worthDeepDive: 95,
        tags: ["agent", "MCP"],
        tldr: "Agent idea with thin implementation signals.",
        light: "Keyword-relevant, but the available artifact evidence is too thin for a deep dive.",
        intent: "tool",
        reason: "Watch only until implementation depth is clearer.",
        project_type: "agent_framework",
        verdict: "watch",
        ratings: {
          relevance_to_ai_engineer: 5,
          engineering_depth: 2,
          reuse_value: 3,
          maturity: 2,
        },
      }),
    },
  });

  assert.equal(result.verdict, "watch");
  assert.equal(result.decision, "skip");
  assert.ok(result.score >= 70, `expected score >= 70, got ${result.score}`);
});

test("project intent classification separates understanding teaching and tool repos", () => {
  assert.equal(classifyProjectIntent({
    description: "Visual guide explaining how agent memory works",
    readme: "Architecture notes and concepts for understanding long-term memory in LLM agents.",
  }), "understanding");

  assert.equal(classifyProjectIntent({
    description: "Hands-on course for learning RAG evaluation",
    readme: "Tutorial lessons, exercises, curriculum, and notebooks for students.",
  }), "teaching");

  assert.equal(classifyProjectIntent({
    description: "CLI for running coding agents",
    readme: "Install with npm, configure your API key, run commands, and integrate the SDK.",
  }), "tool");
});
