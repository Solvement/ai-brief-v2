import test from "node:test";
import assert from "node:assert/strict";

import { validateTrendingData } from "../validate-trending.mjs";

const generatedAt = "2026-06-07T12:00:00.000Z";

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
    ...overrides,
  };
}

function board(window, project) {
  return {
    window,
    generatedAt,
    repos: [project],
  };
}

function trendingData(project) {
  return {
    generatedAt,
    daily: board("daily", project),
    weekly: board("weekly", project),
    monthly: board("monthly", project),
  };
}

test("validateTrendingData grandfathers Tier2/3 tier_template entries without comparison_table", () => {
  assert.doesNotThrow(() => validateTrendingData(trendingData(repo({
    project_tier: 2,
    tier_template: {
      comparison: "README only names alternatives without a structured table.",
    },
  }))));
});

test("validateTrendingData rejects present empty comparison_table unless comparison is 数据不足", () => {
  assert.throws(
    () => validateTrendingData(trendingData(repo({
      project_tier: 2,
      tier_template: {
        comparison: "mem0 / Letta",
        comparison_table: [],
      },
    }))),
    /empty comparison_table requires tier_template\.comparison to be 数据不足/,
  );
});

test("validateTrendingData accepts a populated Tier2/3 comparison_table", () => {
  assert.doesNotThrow(() => validateTrendingData(trendingData(repo({
    project_tier: 3,
    tier_template: {
      comparison: "和 mem0 相比, 本项目把记忆接口放在更窄的 CLI 范围里。",
      comparison_table: [{
        alternative: "mem0",
        difference: "mem0 偏长期记忆服务, 本项目偏 CLI 内的短链路记忆接口。",
        maturity_vs: "mem0 的 star/release 信号更成熟; 本项目仍需 clone-and-run 确认。",
        tradeoff: "选 mem0 得到成熟生态; 选本项目得到更窄、更易嵌入的接口。",
      }],
    },
  }))));
});
