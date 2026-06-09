import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEliteSelection,
  fetchHackerNewsRepoSignal,
  fetchOssInsightTrendingRepos,
} from "../columns/projects/sources.mjs";

function candidate(fullName, raw = {}) {
  const [owner, name] = fullName.split("/");
  return {
    id: `project:${fullName.toLowerCase()}`,
    column: "projects",
    source: "github-trending:daily",
    dedupeKey: fullName.toLowerCase(),
    discoveredAt: "2026-06-08T00:00:00.000Z",
    raw: {
      fullName,
      owner,
      name,
      url: `https://github.com/${fullName}`,
      ownerAvatarUrl: `https://github.com/${owner}.png?size=80`,
      description: `${fullName} repo`,
      stars: 5000,
      forks: 10,
      starsGained: 100,
      windows: ["daily"],
      ranksByWindow: { daily: 1 },
      starsGainedByWindow: { daily: 100 },
      currentWindows: ["daily"],
      currentRanksByWindow: { daily: 1 },
      currentStarsGainedByWindow: { daily: 100 },
      sourceTerms: [],
      ...raw,
    },
  };
}

function jsonResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
    headers: new Headers(),
  };
}

test("HN repo validation accepts high-point stories whose URL is the GitHub repo", async () => {
  const signal = await fetchHackerNewsRepoSignal({ fullName: "owner/elite", url: "https://github.com/owner/elite" }, {
    thresholds: { hnMinPoints: 50 },
    options: {
      fetchImpl: async () => jsonResponse({
        hits: [
          { title: "Show HN: Elite", url: "https://github.com/owner/elite", points: 80, objectID: "1" },
          { title: "Low score", url: "https://github.com/owner/elite", points: 12, objectID: "2" },
        ],
      }),
    },
  });

  assert.equal(signal.points, 80);
  assert.equal(signal.title, "Show HN: Elite");
});

test("OSSInsight trending parser returns repo full names from the public API shape", async () => {
  const repos = await fetchOssInsightTrendingRepos({
    options: {
      fetchImpl: async () => jsonResponse({
        data: {
          rows: [
            { repo_name: "owner/elite", stars: "5000", total_score: "123.4" },
            { repo_name: "", stars: "1", total_score: "1" },
          ],
        },
      }),
    },
  });

  assert.deepEqual(repos, [{ fullName: "owner/elite", stars: 5000, score: 123.4 }]);
});

test("elite selection requires heat plus at least two validation source signals", async () => {
  const candidates = [
    candidate("owner/oss-elite", { stars: 6000 }),
    candidate("owner/single-source", { stars: 12000 }),
    candidate("owner/hn-elite", {
      stars: 1200,
      starsGained: 1800,
      starsGainedByWindow: { daily: 200, monthly: 1800 },
      currentStarsGainedByWindow: { daily: 200, monthly: 1800 },
    }),
  ];

  const fetchImpl = async (url) => {
    const text = String(url);
    if (text.includes("ossinsight")) {
      return jsonResponse({ data: { rows: [{ repo_name: "owner/oss-elite", stars: "6000", total_score: "100" }] } });
    }
    if (text.includes("owner%2Fhn-elite") || text.includes("owner/hn-elite")) {
      return jsonResponse({ hits: [{ title: "HN elite", url: "https://github.com/owner/hn-elite", points: 90, objectID: "hn" }] });
    }
    return jsonResponse({ hits: [] });
  };

  const selected = await applyEliteSelection(candidates, {
    options: {
      fetchImpl,
      eliteLimit: 12,
      eliteMinStars: 3000,
      eliteMinMonthlyStars: 1500,
      eliteMinSourceCount: 2,
      hnMinPoints: 50,
    },
  });

  assert.deepEqual(new Set(selected.map((item) => item.raw.fullName)), new Set(["owner/oss-elite", "owner/hn-elite"]));
  const byName = new Map(selected.map((item) => [item.raw.fullName, item]));
  assert.equal(byName.get("owner/oss-elite").raw.eliteSelection.sourceSignals.includes("ossinsight_trending"), true);
  assert.equal(byName.get("owner/hn-elite").raw.eliteSelection.sourceSignals.includes("hacker_news"), true);
});
