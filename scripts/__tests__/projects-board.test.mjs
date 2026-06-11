import test from "node:test";
import assert from "node:assert/strict";
import { makeBoard } from "../columns/projects/index.mjs";

function item(fullName, { windows = [], ranksByWindow = {}, currentWindows, currentRun, score = 80, alreadyAnalyzed = false } = {}) {
  const [owner, name] = fullName.split("/");
  const out = {
    candidate: {
      id: `project:${fullName.toLowerCase()}`,
      raw: { fullName },
    },
    repo: {
      fullName,
      owner,
      name,
      url: `https://github.com/${fullName}`,
      ownerAvatarUrl: `https://github.com/${owner}.png?size=80`,
      description: `${fullName} description`,
      language: "TypeScript",
      languageColor: "#3178c6",
      stars: 100,
      forks: 10,
      starsGained: 5,
      alreadyAnalyzed,
      windows,
      ranksByWindow,
      ...(currentWindows ? { currentWindows } : {}),
    },
    eval: { score },
    light: {
      tldr: `${fullName} TLDR`,
      light: `${fullName} light`,
      worthDeepDive: score,
      ranking_score: score,
      final_depth: "analysis",
    },
  };
  if (currentRun !== undefined) out.currentRun = currentRun;
  return out;
}

test("project boards only contain repos from that real trending window", () => {
  const board = makeBoard("daily", [
    item("owner/daily-one", { windows: ["daily"], ranksByWindow: { daily: 1 } }),
    item("owner/weekly-only", { windows: ["weekly"], ranksByWindow: { weekly: 1 }, score: 100 }),
    item("owner/topic-only", { windows: [], score: 99 }),
    item("owner/daily-two", { windows: ["daily"], ranksByWindow: { daily: 2 } }),
  ], { limit: 30, radarLimit: 30 });

  assert.deepEqual(board.repos.map((repo) => repo.fullName), [
    "owner/daily-one",
    "owner/daily-two",
  ]);
  assert.equal(board.target, 2);
});

test("project board limit is an explicit cap, not padding", () => {
  const board = makeBoard("daily", [
    item("owner/daily-one", { windows: ["daily"], ranksByWindow: { daily: 1 } }),
    item("owner/topic-only", { windows: [], score: 99 }),
  ], { boardLimit: 10, limit: 30 });

  assert.deepEqual(board.repos.map((repo) => repo.fullName), ["owner/daily-one"]);
  assert.equal(board.target, 1);
});

test("project boards drop stale accumulated repos outside the current run", () => {
  const board = makeBoard("daily", [
    item("owner/current", { windows: ["daily"], ranksByWindow: { daily: 1 }, currentWindows: ["daily"], currentRun: true }),
    item("owner/old-deep", { windows: ["daily"], ranksByWindow: { daily: 2 }, currentRun: false, score: 100 }),
  ], { boardLimit: 12 });

  assert.deepEqual(board.repos.map((repo) => repo.fullName), ["owner/current"]);
});

test("project boards include done-but-currently-trending reuse repos", () => {
  const board = makeBoard("monthly", [
    item("owner/reused-deep", {
      windows: ["monthly"],
      ranksByWindow: { monthly: 2 },
      currentWindows: ["monthly"],
      currentRun: true,
      score: 100,
      alreadyAnalyzed: true,
    }),
    item("owner/current-light", {
      windows: ["monthly"],
      ranksByWindow: { monthly: 1 },
      currentWindows: ["monthly"],
      currentRun: true,
      score: 20,
    }),
  ], { boardLimit: 12 });

  assert.ok(board.repos.some((repo) => repo.fullName === "owner/reused-deep"));
  assert.equal(board.repos.find((repo) => repo.fullName === "owner/reused-deep").alreadyAnalyzed, true);
  assert.equal(board.target, 2);
});

test("project boards use current window membership instead of accumulated windows", () => {
  const board = makeBoard("daily", [
    item("owner/weekly-now", {
      windows: ["daily", "weekly"],
      ranksByWindow: { daily: 1, weekly: 1 },
      currentWindows: ["weekly"],
      currentRun: true,
      score: 100,
    }),
    item("owner/daily-now", {
      windows: ["daily"],
      ranksByWindow: { daily: 2 },
      currentWindows: ["daily"],
      currentRun: true,
    }),
  ], { boardLimit: 12 });

  assert.deepEqual(board.repos.map((repo) => repo.fullName), ["owner/daily-now"]);
});
