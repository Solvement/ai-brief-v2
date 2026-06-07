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
    project_tier: 2,
    tier_template: {
      comparison: "数据不足",
      comparison_table: [],
    },
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

function claim(overrides = {}) {
  return {
    claim: "README says the project supports 10 platforms.",
    plain_english: "README 自称支持多个平台。",
    source: "README benchmark table",
    evidence_strength: "medium",
    supports: "README contains the claim.",
    does_not_support: "No independent replication.",
    threat: "Marketing copy may be stale.",
    ...overrides,
  };
}

test("validateTrendingData grandfathers claim_ledger items without attribution", () => {
  assert.doesNotThrow(() => validateTrendingData(trendingData(repo({
    claim_ledger: [claim()],
  }))));
});

test("validateTrendingData rejects illegal claim_ledger attribution values", () => {
  assert.throws(
    () => validateTrendingData(trendingData(repo({
      claim_ledger: [claim({ attribution: "官方口径" })],
    }))),
    /claim_ledger\[0\]\.attribution: must be one of 自报, 已核实, 不适用/,
  );
});

test("validateTrendingData rejects README sources marked 已核实", () => {
  assert.throws(
    () => validateTrendingData(trendingData(repo({
      claim_ledger: [claim({ attribution: "已核实" })],
    }))),
    /已核实 需具名独立来源，不能来自 README 自述/,
  );
});

test("validateTrendingData accepts README sources marked 自报", () => {
  assert.doesNotThrow(() => validateTrendingData(trendingData(repo({
    claim_ledger: [claim({ attribution: "自报" })],
  }))));
});
