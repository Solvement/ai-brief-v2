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
      }),
    },
  });

  assert.equal(result.mode, "rank");
  assert.equal(result.decision, "select");
  assert.ok(result.score >= 70, `expected score >= 70, got ${result.score}`);
  assert.equal(result.intent, "tool");
  assert.ok(result.signals.includes("finance"));
  assert.ok(result.signals.includes("agent"));
  assert.notEqual(result.rankingReason.decision, "cap-low-priority");
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
