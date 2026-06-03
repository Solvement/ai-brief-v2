import test from "node:test";
import assert from "node:assert/strict";
import { classifyProjectIntent, evaluate } from "../columns/projects/evaluate.mjs";

function candidate(overrides = {}) {
  return {
    id: "project:owner/repo",
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
      windows: ["daily"],
      ranksByWindow: { daily: 1 },
      ...overrides.raw,
    },
    ...overrides,
  };
}

function evidence(overrides = {}) {
  const rawReadme = `
This repository builds reusable agent infrastructure for finance workflows with MCP connectors,
RAG memory, evals, skills, commands, installation docs, examples, demos, and tests.
It is a vertical agent workflow rather than only finance content.
`.repeat(8);
  return {
    kind: "readme",
    content: rawReadme,
    evidenceSignals: {
      owner: "owner",
      repo: "repo",
      url: "https://github.com/owner/repo",
      trend_sources: ["github-trending:daily"],
      stars: 1200,
      forks: 80,
      stars_today: 180,
      language: "TypeScript",
      topics: ["agent", "mcp", "finance"],
      description: "finance agent infrastructure with MCP tools and RAG memory",
      raw_readme: rawReadme,
      readme_found: true,
      readme_fetch_failed: false,
      readme_empty: false,
      readme_length: rawReadme.length,
      top_level_dirs: ["agents", "mcp", "skills", "docs", "examples", "tests"],
      key_files: ["package.json", "README.md"],
      has_docs: true,
      has_examples: true,
      has_tests: true,
      has_install: true,
      has_docker: false,
      has_cli: true,
      has_agents: true,
      has_mcp: true,
      has_skills: true,
      has_models: true,
      has_demo: true,
      package_files: {
        package_json: true,
        pyproject_toml: false,
        cargo_toml: false,
        requirements_txt: false,
        docker_compose_yml: false,
        dockerfile: false,
      },
      ...overrides.evidenceSignals,
    },
    ...overrides,
  };
}

test("project evaluate is deterministic and does not call the LLM", async () => {
  let called = false;
  const result = await evaluate(candidate(), evidence(), {
    options: {
      noLlm: false,
      chatJson: async () => {
        called = true;
        throw new Error("evaluate must not call chatJson");
      },
    },
  });

  assert.equal(called, false);
  assert.equal(result.mode, "deterministic-radar");
  assert.ok(result.ranking_score >= 60, `expected score >= 60, got ${result.ranking_score}`);
  assert.ok(["analysis", "deep"].includes(result.final_depth));
  assert.equal(result.needs_enrichment, false);
  assert.ok(result.ranking_reasons.length > 0);
  assert.equal(result.evidence_signals.readme_fetch_failed, false);
});

test("project evaluate treats finance as vertical agent evidence, not a hard cap", async () => {
  const result = await evaluate(candidate(), evidence(), { options: { noLlm: true } });

  assert.equal(result.project_type, "agent_framework");
  assert.ok(["analysis", "deep"].includes(result.final_depth));
  assert.ok(result.tags.includes("mcp"));
  assert.ok(result.ranking_reasons.some((reason) => /MCP|agent/i.test(reason)));
  assert.ok(!result.rejection_reasons.includes("awesome_course_tutorial_or_resource_list"));
});

test("project evaluate marks README fetch failure as needs_enrichment, not empty README", async () => {
  const result = await evaluate(candidate(), evidence({
    content: "",
    evidenceSignals: {
      raw_readme: "",
      readme_found: false,
      readme_fetch_failed: true,
      readme_empty: false,
      readme_length: 0,
    },
  }), { options: { noLlm: true } });

  assert.equal(result.needs_enrichment, true);
  assert.equal(result.final_depth, "needs_enrichment");
  assert.equal(result.evidence_signals.readme_empty, false);
  assert.equal(result.evidence_signals.readme_fetch_failed, true);
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
