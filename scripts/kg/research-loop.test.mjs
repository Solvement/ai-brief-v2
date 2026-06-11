import test from "node:test";
import assert from "node:assert/strict";
import {
  parseArgs, tokens, cosine, expandQuery, isStrategyForecastQuery,
  bm25Rank, reciprocalRankFusion, rolesFor, useAs,
  buildContest, buildRoleCoverage, buildGaps, buildSynthesisBrief, renderMarkdown,
} from "./research-loop.mjs";

test("parseArgs: query joining and flags", () => {
  const opts = parseArgs(["冷审", "误杀", "--top=3", "--json"]);
  assert.equal(opts.query, "冷审 误杀");
  assert.equal(opts.top, 3);
  assert.equal(opts.json, true);
});

test("tokens: latin words + cjk chars + cjk bigrams", () => {
  const toks = tokens("BM25 检索");
  assert.ok(toks.includes("bm25"));
  assert.ok(toks.includes("检"));
  assert.ok(toks.includes("检索"));
});

test("cosine: orthogonal=0, identical=1", () => {
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.ok(Math.abs(cosine([1, 2], [1, 2]) - 1) < 1e-9);
});

test("bm25 ranks the matching doc first", () => {
  const docs = [
    { slug: "a", text: "记忆 写入 检索 遗忘" },
    { slug: "b", text: "代码 图谱 解析 符号" },
  ];
  const ranked = bm25Rank("记忆 检索", docs);
  assert.equal(ranked[0].slug, "a");
});

test("rrf fuses two lists and keeps signals", () => {
  const fused = reciprocalRankFusion({
    vector: [{ slug: "a", score: 0.9 }, { slug: "b", score: 0.5 }],
    lexical: [{ slug: "b", score: 3 }, { slug: "a", score: 1 }],
  });
  assert.equal(fused.length, 2);
  assert.ok(fused[0].signals.vector !== undefined && fused[0].signals.lexical !== undefined);
});

test("rolesFor tags evaluation and memory", () => {
  const roles = rolesFor("一个评测 benchmark，测记忆的写入与遗忘");
  assert.ok(roles.includes("evaluation"));
  assert.ok(roles.includes("memory"));
});

test("useAs: undisclosed code -> method pattern, not direct dependency", () => {
  const facet = { facets: { weakness: "[代码未披露] 自报结果" }, self_evo_use: "能用" };
  assert.equal(useAs(facet, []), "method pattern, not direct dependency");
});

test("buildContest guarantees an evaluator slot when one exists in the pool", () => {
  const facets = {
    m1: { title: "m1", facets: { problem_solved: "记忆写入" } },
    m2: { title: "m2", facets: { problem_solved: "记忆检索" } },
    ev: { title: "评测 benchmark", facets: { problem_solved: "评测 agent 记忆的 benchmark" } },
  };
  const ranked = [
    { slug: "m1", score: 0.9, signals: {} },
    { slug: "m2", score: 0.8, signals: {} },
    { slug: "ev", score: 0.1, signals: {} },
  ];
  const contest = buildContest(ranked, facets, 2);
  assert.equal(contest.length, 2);
  assert.ok(contest.some((row) => row.slug === "ev"), "evaluator must be injected into top slots");
});

test("strategy hint only on strategy/forecast queries (例子≠范围)", () => {
  const briefStrategy = buildSynthesisBrief("做一个战略决策 agent", []);
  assert.ok(briefStrategy.reference_shape_hint);
  const briefOther = buildSynthesisBrief("冷审深读质量门怎么减少误杀", []);
  assert.equal(briefOther.reference_shape_hint, undefined);
  assert.ok(briefOther.must_produce.length >= 3);
  assert.equal(isStrategyForecastQuery("预测 agent 概率校准"), true);
  assert.equal(isStrategyForecastQuery("修复渲染 bug"), false);
});

test("expandQuery: domain additions are conditional", () => {
  assert.ok(expandQuery("预测市场怎么校准").includes("base rate"));
  assert.ok(!expandQuery("代码图谱").includes("base rate"));
});

test("buildRoleCoverage reports covered sources and missing roles", () => {
  const contest = [
    { slug: "a", roles: ["memory", "evaluation"], use_as: "evaluator / regression gate" },
    { slug: "b", roles: ["memory"], use_as: "reference / contrast case" },
  ];
  const cov = buildRoleCoverage(contest);
  assert.deepEqual(cov.covered.memory, ["a", "b"]);
  assert.ok(cov.missing.includes("prediction"));
});

test("buildGaps flags missing evaluator and missing domain material", () => {
  const gaps = buildGaps("预测 agent", [{ slug: "x", roles: ["memory"], use_as: "reference / contrast case" }]);
  assert.ok(gaps.some((g) => g.includes("forecasting")));
  assert.ok(gaps.some((g) => g.includes("evaluator")));
});

test("renderMarkdown: no canned architecture for non-strategy query", () => {
  const pack = {
    query: "冷审误杀",
    retrieval: { mode: "lexical(bm25)", facet_count: 2 },
    contest: [{
      rank: 1, slug: "a", title: "A", score: 0.5, roles: ["evaluation"],
      use_as: "evaluator / regression gate", method: "m", result: "r", problem: "p", weakness: "w",
    }],
    role_coverage: { covered: { evaluation: ["a"] }, missing: ["prediction"] },
    gaps: ["g"],
    synthesis_brief: buildSynthesisBrief("冷审误杀", []),
  };
  const md = renderMarkdown(pack);
  assert.ok(!md.includes("Forecast Engine"), "non-strategy query must not get the strategy shape");
  assert.ok(md.includes("Synthesis & Evolution"));
  assert.ok(md.includes("Role Coverage"));
});
