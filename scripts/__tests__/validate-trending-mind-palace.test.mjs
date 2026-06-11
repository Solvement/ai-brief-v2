import test from "node:test";
import assert from "node:assert/strict";

import { validateTrendingData } from "../validate-trending.mjs";

const generatedAt = "2026-06-11T12:00:00.000Z";

function repo(overrides = {}) {
  return {
    fullName: "owner/repo",
    owner: "owner",
    name: "repo",
    url: "https://github.com/owner/repo",
    ownerAvatarUrl: "https://github.com/owner.png?size=80",
    tldr: "Short project summary",
    light: "Light project note",
    stars: 100,
    forks: 10,
    starsGained: 5,
    rank: 1,
    worthDeepDive: 80,
    tags: ["agent"],
    ranking_score: 81,
    final_depth: "analysis",
    depth_band: "standard",
    analysis_depth: "standard",
    ...overrides,
  };
}

function board(window, project) {
  return { window, generatedAt, repos: [project] };
}

function trendingData(project) {
  return {
    generatedAt,
    daily: board("daily", project),
    weekly: board("weekly", project),
    monthly: board("monthly", project),
  };
}

const mindPalace = {
  problem_solved: "Agent memory systems need grounded write/read/update loops.",
  discovery_trace: "数据不足",
  method: "Use hooks to capture events, index them, and retrieve them for future tool calls.",
  self_evo_use: "记忆: stores durable events. 理解: links actions to outcomes. 自进化: turns repeated failures into reusable policies.",
  core_concepts: [
    { name: "事件记忆", role: "primary", evidence: "README Memory Events" },
    { name: "混合检索", role: "supporting", evidence: "README Hybrid Search" },
    { name: "工具钩子", role: "supporting", evidence: "README Hooks" },
  ],
};

test("validateTrendingData accepts project mind_palace facet hooks", () => {
  assert.doesNotThrow(() => validateTrendingData(trendingData(repo({ mind_palace: mindPalace }))));
});

test("validateTrendingData rejects self_evo_use that misses the three required segments", () => {
  assert.throws(
    () => validateTrendingData(trendingData(repo({
      mind_palace: {
        ...mindPalace,
        self_evo_use: "记忆: only covers storage.",
      },
    }))),
    /self_evo_use/,
  );
});

test("validateTrendingData rejects non-empty discovery_trace without source_span", () => {
  assert.throws(
    () => validateTrendingData(trendingData(repo({
      mind_palace: {
        ...mindPalace,
        discovery_trace: { hypothesis: "try hooks first", failed_attempts: [] },
      },
    }))),
    /discovery_trace\.source_span/,
  );
});
