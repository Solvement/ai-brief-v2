#!/usr/bin/env node
// Mind Palace research loop: retrieve -> contest -> (agent synthesizes) -> write back.
// This is the agent-facing path. The frontend graph is for humans; this script is for using
// accumulated papers/projects as an evolution substrate before complex work.
//
// 分工边界(2026-06-10 review 定): 本脚本只做"机械可判"的两层 —— Recall(hybrid 检索) +
// Contest(证据表/角色覆盖/缺口)。Synthesis 与 Evolution actions 是判断工作, 必须由消费
// 本输出的 agent 按 docs/workflow/mind-palace-operating-contract.md 产出, 脚本不再输出
// 写死的架构模板(旧版把战略/预测七层架构 stamp 到任何查询上, 是模板冒充综合)。

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const EMBEDDINGS_FILE = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const FACETS_FILE = path.join(ROOT, "public", "data", "brief", "facets.json");
const DEFAULT_TOP = 8;

export function parseArgs(argv = []) {
  const opts = { json: false, top: DEFAULT_TOP, query: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--top") opts.top = Math.max(1, Number(argv[++i]) || DEFAULT_TOP);
    else if (arg.startsWith("--top=")) opts.top = Math.max(1, Number(arg.slice(6)) || DEFAULT_TOP);
    else opts.query.push(arg);
  }
  opts.query = opts.query.join(" ").trim();
  return opts;
}

function readJson(file) {
  return readFile(file, "utf8").then((raw) => JSON.parse(raw));
}

export function tokens(value = "") {
  const text = String(value).toLowerCase();
  const latin = text.match(/[a-z0-9]+/g) || [];
  const cjk = text.match(/[一-鿿]/g) || [];
  const bi = [];
  for (let i = 0; i < cjk.length - 1; i += 1) bi.push(cjk[i] + cjk[i + 1]);
  return [...latin, ...cjk, ...bi];
}

export function cosine(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  const n = Math.min(a?.length || 0, b?.length || 0);
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

function asText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).join(" ");
  if (typeof value === "object") return Object.values(value).map(asText).join(" ");
  return String(value);
}

export function facetText(facet = {}) {
  const f = facet.facets || {};
  return [
    facet.title,
    f.problem_solved,
    f.method,
    f.result,
    f.innovation,
    f.weakness,
    f.transfer,
    f.architecture,
    facet.self_evo_use,
    facet.discovery_trace,
    ...(Array.isArray(facet.core_concepts) ? facet.core_concepts.map((c) => `${c.name} ${c.evidence}`) : []),
  ].map(asText).filter(Boolean).join("\n");
}

export function isStrategyForecastQuery(query) {
  const q = String(query || "");
  return /战略|策略|strategy|decision|决策|规划|plan|预测|forecast|prediction|predict|概率|校准|scenario|情景/i.test(q);
}

export function expandQuery(query) {
  const q = String(query || "");
  const additions = ["方法论", "架构", "适用边界", "评测"];
  if (/战略|策略|strategy|decision|决策|规划|plan/i.test(q)) additions.push("战略", "规划", "目标分解", "约束", "human-in-the-loop");
  if (/预测|forecast|prediction|predict|概率|校准|scenario|情景/i.test(q)) additions.push("预测", "概率校准", "情景树", "base rate", "回测");
  if (/agent|智能体/i.test(q)) additions.push("agent", "工具", "轨迹", "反馈闭环", "评估器");
  if (/记忆|memory|遗忘|检索/i.test(q)) additions.push("记忆", "写入", "检索", "遗忘");
  if (/自进化|self-evol|进化|优化自身/i.test(q)) additions.push("自进化", "反馈信号", "护栏", "回滚");
  return `${q}\n${additions.join(" ")}`;
}

export function bm25Rank(query, docs) {
  const qTokens = tokens(query);
  const docTokens = docs.map((doc) => ({ slug: doc.slug, tokens: tokens(doc.text) }));
  const df = new Map();
  for (const doc of docTokens) {
    for (const token of new Set(doc.tokens)) df.set(token, (df.get(token) || 0) + 1);
  }
  const n = docTokens.length || 1;
  const avgdl = docTokens.reduce((sum, doc) => sum + doc.tokens.length, 0) / n || 1;
  const k1 = 1.5;
  const b = 0.75;
  return docTokens.map((doc) => {
    const tf = new Map();
    for (const token of doc.tokens) tf.set(token, (tf.get(token) || 0) + 1);
    let score = 0;
    for (const token of new Set(qTokens)) {
      const freq = tf.get(token) || 0;
      if (!freq) continue;
      const idf = Math.log(1 + (n - (df.get(token) || 0) + 0.5) / ((df.get(token) || 0) + 0.5));
      score += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.tokens.length / avgdl))));
    }
    return { slug: doc.slug, score };
  }).sort((a, b) => b.score - a.score);
}

async function vectorRank(query, vectors, model) {
  const { pipeline } = await import("@huggingface/transformers");
  const extractor = await pipeline("feature-extraction", model);
  const qv = Array.from((await extractor(`query: ${query}`, { pooling: "mean", normalize: true })).data);
  return vectors
    .map((candidate) => ({ slug: candidate.slug, score: cosine(qv, candidate.vec) }))
    .sort((a, b) => b.score - a.score);
}

export function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();
  const details = new Map();
  for (const [name, list] of Object.entries(lists)) {
    list.forEach((item, index) => {
      const current = scores.get(item.slug) || 0;
      scores.set(item.slug, current + 1 / (k + index + 1));
      const row = details.get(item.slug) || {};
      row[name] = item.score;
      details.set(item.slug, row);
    });
  }
  return [...scores.entries()]
    .map(([slug, score]) => ({ slug, score, signals: details.get(slug) || {} }))
    .sort((a, b) => b.score - a.score);
}

export const ROLE_RULES = [
  ["memory", ["记忆", "memory", "检索", "写入", "遗忘", "冲突", "长期", "上下文", "context", "kv cache", "adapter"]],
  ["understanding", ["理解", "understand", "world model", "因果", "抽象", "结构", "代码图谱", "tree-sitter", "归因"]],
  ["self_evolution", ["自进化", "self-evol", "evolve", "优化器", "反馈", "policy", "skill", "反思", "回滚"]],
  ["evaluation", ["评测", "benchmark", "judge", "eval", "冷审", "错误定位", "error localization", "回归"]],
  ["strategy", ["战略", "策略", "规划", "planning", "decision", "决策", "constraint", "目标"]],
  ["prediction", ["预测", "forecast", "prediction", "概率", "校准", "scenario", "lookahead", "base rate"]],
  ["multi_agent", ["多 agent", "multi-agent", "协作", "角色", "拓扑", "graph", "消息池"]],
  ["research", ["科研", "research", "实验", "hypothesis", "tree search", "探索"]],
];

export function rolesFor(text) {
  const lower = String(text || "").toLowerCase();
  return ROLE_RULES
    .filter(([, needles]) => needles.some((needle) => lower.includes(String(needle).toLowerCase())))
    .map(([role]) => role);
}

function clip(value, length = 150) {
  const text = asText(value).replace(/\s+/g, " ").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
}

export function useAs(facet, roles) {
  const weak = `${facet.facets?.weakness || ""} ${facet.self_evo_use || ""}`;
  if (/代码未披露|未披露|不可复现|不能直接|黑箱|自报/.test(weak)) return "method pattern, not direct dependency";
  const evaluatorText = `${facet.title || ""} ${facet.facets?.problem_solved || ""}`;
  if (roles.includes("evaluation") && /benchmark|评测|judge|eval|错误定位|回归/i.test(evaluatorText)) return "evaluator / regression gate";
  if ((facet.kind || "") === "project") return "tool or implementation reference";
  if (/高可用|可复用|能用|直接可用/.test(facet.self_evo_use || "")) return "candidate pattern to compose";
  return "reference / contrast case";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function buildContest(ranked, facets, top) {
  const rows = ranked.map((item, index) => {
    const facet = facets[item.slug] || {};
    const text = facetText(facet);
    const roles = rolesFor(text);
    return {
      rank: index + 1,
      original_rank: index + 1,
      slug: item.slug,
      title: facet.title || item.slug,
      score: Number(item.score.toFixed(4)),
      vector_score: item.signals?.vector === undefined ? null : Number(item.signals.vector.toFixed(4)),
      lexical_score: item.signals?.lexical === undefined ? null : Number(item.signals.lexical.toFixed(4)),
      roles,
      use_as: useAs(facet, roles),
      problem: clip(facet.facets?.problem_solved, 180),
      method: clip(facet.facets?.method, 220),
      result: clip(facet.facets?.result, 160),
      weakness: clip(facet.facets?.weakness, 160),
      self_evo_use: clip(facet.self_evo_use, 220),
      core_concepts: Array.isArray(facet.core_concepts) ? facet.core_concepts.map((c) => c.name).slice(0, 5) : [],
    };
  });
  const selected = rows.slice(0, top);
  if (!selected.some((item) => item.use_as === "evaluator / regression gate")) {
    const evaluator = rows.find((item) => item.use_as === "evaluator / regression gate");
    if (evaluator && !selected.some((item) => item.slug === evaluator.slug)) selected[selected.length - 1] = evaluator;
  }
  return selected.map((item, index) => ({ ...item, rank: index + 1 }));
}

// 角色覆盖图: 哪些认知角色被召回结果覆盖、各自来源是谁、哪些角色缺位。
// 这是给 agent 做 Synthesis 用的"原材料地图", 不是结论。
export function buildRoleCoverage(contest) {
  const covered = {};
  for (const [role] of ROLE_RULES) {
    const sources = unique(contest.filter((item) => item.roles.includes(role)).map((item) => item.slug));
    if (sources.length) covered[role] = sources;
  }
  const missing = ROLE_RULES.map(([role]) => role).filter((role) => !covered[role]);
  return { covered, missing };
}

export function buildGaps(query, contest) {
  const roles = new Set(contest.flatMap((item) => item.roles));
  const gaps = [];
  if (!roles.has("prediction") && /预测|forecast|prediction|概率|校准/i.test(query)) {
    gaps.push("Mind Palace has weak direct forecasting material; add papers/projects on probabilistic forecasting, calibration, scenario planning, and prediction markets.");
  }
  if (!roles.has("strategy") && /战略|strategy|decision|规划|决策/i.test(query)) {
    gaps.push("Mind Palace has weak direct strategy-agent material; add cases on planning under uncertainty and human-in-the-loop strategic decision systems.");
  }
  if (!contest.some((item) => item.use_as === "evaluator / regression gate")) {
    gaps.push("No strong evaluator was retrieved; add or up-rank evaluation/critic facets before trusting the design.");
  }
  if (!gaps.length) gaps.push("No obvious retrieval gap; next risk is whether the implementation writes outcome feedback back into memory.");
  return gaps;
}

// 战略/预测类查询的参考形态(出处: docs/workflow/mind-palace-operating-contract.md §目标形态)。
// 只在查询命中该领域时作为 hint 附带; 其它领域不给任何预制架构 —— 例子≠范围。
const STRATEGY_REFERENCE_SHAPE =
  "Evidence Store -> Belief State -> Forecast Engine -> Strategy Planner -> Critic / Evaluator -> Decision Log -> Memory Update Gate";

export function buildSynthesisBrief(query, contest) {
  const brief = {
    note: "以下两层是判断工作, 由消费本输出的 agent 产出, 脚本不代写(模板会冒充综合)。",
    must_produce: [
      "Synthesis: 针对本查询的组合方案 —— 从 contest 表挑方法、说明为什么选它不选同类、每个部件标注来源 slug 和适用边界; 召回弱就明说'Mind Palace 现有语料不足'。",
      "Evolution actions: delete / replace / optimize / add 四类, 每条都要落到本站/agent 的具体资产(脚本/范式/门/记忆), 并标注依据的 facet。",
      "回写: 执行后把'哪个 facet 真被用上/哪里没帮上/要不要新增 recall bench 查询'写回(operating contract §回写契约)。",
    ],
  };
  if (isStrategyForecastQuery(query)) {
    brief.reference_shape_hint = STRATEGY_REFERENCE_SHAPE;
    brief.reference_shape_source = "docs/workflow/mind-palace-operating-contract.md §对\"战略 agent + 预测 agent\"的目标形态";
  }
  return brief;
}

export function renderMarkdown(pack) {
  const lines = [];
  lines.push(`# Mind Palace Research Loop`);
  lines.push("");
  lines.push(`Query: ${pack.query}`);
  lines.push(`Mode: ${pack.retrieval.mode} | facets: ${pack.retrieval.facet_count}`);
  lines.push("");
  lines.push("## Recall");
  for (const item of pack.contest.slice(0, 8)) {
    lines.push(`- ${item.rank}. ${item.slug} (${item.score}) — ${item.title}`);
    lines.push(`  - roles: ${item.roles.join(", ") || "reference"}; use: ${item.use_as}`);
    lines.push(`  - method: ${item.method || "(missing)"}`);
  }
  lines.push("");
  lines.push("## Contest");
  lines.push("| method | use | strength | weakness |");
  lines.push("| --- | --- | --- | --- |");
  for (const item of pack.contest.slice(0, 8)) {
    lines.push(`| ${item.slug} | ${item.use_as} | ${item.result || item.problem || ""} | ${item.weakness || ""} |`);
  }
  lines.push("");
  lines.push("## Role Coverage");
  for (const [role, sources] of Object.entries(pack.role_coverage.covered)) {
    lines.push(`- ${role}: ${sources.join(", ")}`);
  }
  if (pack.role_coverage.missing.length) {
    lines.push(`- MISSING: ${pack.role_coverage.missing.join(", ")}`);
  }
  lines.push("");
  lines.push("## Gaps");
  for (const gap of pack.gaps) lines.push(`- ${gap}`);
  lines.push("");
  lines.push("## Synthesis & Evolution (agent 必须自己产出, 不要照抄模板)");
  for (const item of pack.synthesis_brief.must_produce) lines.push(`- ${item}`);
  if (pack.synthesis_brief.reference_shape_hint) {
    lines.push(`- 参考形态(仅战略/预测类查询): \`${pack.synthesis_brief.reference_shape_hint}\``);
  }
  return `${lines.join("\n")}\n`;
}

export async function buildPack(query, top, { embeddings, facetsDoc }) {
  const facets = facetsDoc.facets || {};
  const docs = Object.entries(facets).map(([slug, facet]) => ({ slug, facet, text: facetText(facet) }));
  const vectors = (embeddings.vectors || []).filter((item) => item.slug && facets[item.slug] && Array.isArray(item.vec));
  const expandedQuery = expandQuery(query);

  const lexical = bm25Rank(expandedQuery, docs);
  let vector = [];
  try {
    vector = await vectorRank(expandedQuery, vectors, embeddings.model || "Xenova/multilingual-e5-small");
  } catch (error) {
    console.warn(`[research-loop] vector recall unavailable; falling back to lexical only: ${error.message}`);
  }
  const ranked = reciprocalRankFusion(vector.length ? { vector, lexical } : { lexical });
  const contest = buildContest(ranked, facets, top);
  return {
    query,
    generated_at: new Date().toISOString(),
    retrieval: {
      mode: vector.length ? "hybrid(vector+bm25+rrf)" : "lexical(bm25)",
      expanded_query: expandedQuery,
      facet_count: docs.length,
      vector_count: vectors.length,
    },
    contest,
    role_coverage: buildRoleCoverage(contest),
    gaps: buildGaps(query, contest),
    synthesis_brief: buildSynthesisBrief(query, contest),
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.query) {
    console.error('Usage: node scripts/kg/research-loop.mjs "problem" [--top N] [--json]');
    process.exit(1);
  }

  const [embeddings, facetsDoc] = await Promise.all([readJson(EMBEDDINGS_FILE), readJson(FACETS_FILE)]);
  const pack = await buildPack(opts.query, opts.top, { embeddings, facetsDoc });
  const output = opts.json ? JSON.stringify(pack, null, 2) : renderMarkdown(pack);
  // ONNX runtime 线程在 Windows 上会让进程以非零码挂尾; 显式 flush 后干净退出。
  await new Promise((resolve) => process.stdout.write(`${output}\n`, resolve));
  process.exit(0);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
