import test from "node:test";
import assert from "node:assert/strict";
import { makeRadar } from "../columns/projects/index.mjs";

// A completed deep-dive: low trending score, but its merged light.tier_template
// carries authored (non-"数据不足") narrative body. The radar MUST pin it.
function deepItem(fullName, score = 1) {
  return {
    repo: { fullName, owner: fullName.split("/")[0], name: fullName.split("/")[1], url: `https://github.com/${fullName}`, windows: [], ranksByWindow: {} },
    light: {
      tldr: `${fullName} deep`,
      light: `${fullName} deep`,
      ranking_score: score,
      worthDeepDive: score,
      final_depth: "deep",
      tier_template: {
        comparison: "和同类 X/Y 相比，更轻量。",
        practitioner_meaning: "对从业者意味着可以直接拿来用。",
        how_it_works_with_analogy: "像一个缓存层。",
        essential_design_difference: "把状态外置到一个独立服务。",
      },
    },
    briefSlug: fullName.replace("/", "-").toLowerCase(),
    eval: { score },
  };
}

// A fresh-trending light card: high score, only the deterministic stub (every
// narrative field "数据不足"). It should fill remaining slots and may roll out.
function lightItem(fullName, score) {
  return {
    repo: { fullName, owner: fullName.split("/")[0], name: fullName.split("/")[1], url: `https://github.com/${fullName}`, windows: ["daily"], ranksByWindow: { daily: 1 } },
    light: {
      tldr: `${fullName} light`,
      light: `${fullName} light`,
      ranking_score: score,
      worthDeepDive: score,
      final_depth: "list_only",
      tier_template: {
        comparison: "数据不足",
        practitioner_meaning: "数据不足",
        how_it_works_with_analogy: "数据不足",
        essential_design_difference: "数据不足",
      },
    },
    eval: { score },
  };
}

const repoSet = (radar) => new Set(radar.repos.map((r) => String(r.fullName).toLowerCase()));

test("makeRadar pins completed deep-dives so fresh trending cannot evict them", () => {
  // 3 accumulated deep-dives, each with a LOW trending score (1-3).
  const deep = [deepItem("acc/alpha", 1), deepItem("acc/beta", 2), deepItem("acc/gamma", 3)];
  // 40 high-rank fresh-trending light cards (scores 100..61) — way more than the
  // 30 cap, all out-ranking the deep items.
  const fresh = Array.from({ length: 40 }, (_, i) => lightItem(`fresh/repo-${i}`, 100 - i));

  const radar = makeRadar([...deep, ...fresh], { radarLimit: 30, now: () => "2026-06-08T00:00:00.000Z" });
  const repos = repoSet(radar);

  // Every accumulated deep-dive survives despite its low score + the trending flood.
  for (const item of deep) {
    assert.ok(repos.has(item.repo.fullName.toLowerCase()), `${item.repo.fullName} must stay pinned in radar`);
  }
  // Remaining slots are filled by top trending light, total honors the cap when
  // pinned (3) <= limit (30).
  assert.equal(radar.repos.length, 30);
  assert.equal(radar.depthCounts.deep, 3);
});

test("makeRadar is idempotent across rebuilds (deep set never drops out)", () => {
  const deep = [deepItem("acc/alpha", 1), deepItem("acc/beta", 2)];
  const freshA = Array.from({ length: 40 }, (_, i) => lightItem(`a/repo-${i}`, 100 - i));
  const freshB = Array.from({ length: 40 }, (_, i) => lightItem(`b/repo-${i}`, 100 - i)); // a totally different trending day

  const first = repoSet(makeRadar([...deep, ...freshA], { radarLimit: 30, now: () => "t1" }));
  const second = repoSet(makeRadar([...deep, ...freshB], { radarLimit: 30, now: () => "t2" }));

  // Trending churned 100% between the two rebuilds, but the deep set persists in both.
  for (const item of deep) {
    assert.ok(first.has(item.repo.fullName.toLowerCase()), `${item.repo.fullName} in rebuild #1`);
    assert.ok(second.has(item.repo.fullName.toLowerCase()), `${item.repo.fullName} in rebuild #2`);
  }
});

test("makeRadar lets accumulated deep grow past the light cap (deep never dropped)", () => {
  // 35 accumulated deep-dives > radarLimit 30. Deep accumulation wins: the radar
  // carries ALL 35 deep, growing past the cap rather than dropping any deep.
  const deep = Array.from({ length: 35 }, (_, i) => deepItem(`acc/deep-${i}`, i + 1));
  const fresh = Array.from({ length: 20 }, (_, i) => lightItem(`fresh/repo-${i}`, 200 - i));

  const radar = makeRadar([...deep, ...fresh], { radarLimit: 30, now: () => "t" });
  const repos = repoSet(radar);

  for (const item of deep) {
    assert.ok(repos.has(item.repo.fullName.toLowerCase()), `${item.repo.fullName} must stay (deep > cap)`);
  }
  assert.equal(radar.depthCounts.deep, 35);
  assert.ok(radar.repos.length >= 35, "radar carries all accumulated deep beyond the 30 light cap");
});

test("makeRadar does NOT pin stub-only (数据不足) cards — they roll with trending", () => {
  const stub = lightItem("stub/only", 1); // low score, no authored body
  const fresh = Array.from({ length: 40 }, (_, i) => lightItem(`fresh/repo-${i}`, 100 - i));

  const radar = makeRadar([stub, ...fresh], { radarLimit: 30, now: () => "t" });
  // The low-scored stub is NOT pinned and falls out below the trending fill.
  assert.ok(!repoSet(radar).has("stub/only"), "stub-only card is not pinned and rolls out");
});
