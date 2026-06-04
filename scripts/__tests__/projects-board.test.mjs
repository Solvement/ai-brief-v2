import test from "node:test";
import assert from "node:assert/strict";
import { makeBoard } from "../columns/projects/index.mjs";

function item(fullName, { windows = [], ranksByWindow = {}, score = 80 } = {}) {
  const [owner, name] = fullName.split("/");
  return {
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
      windows,
      ranksByWindow,
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
