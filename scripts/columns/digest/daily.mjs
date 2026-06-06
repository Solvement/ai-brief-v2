#!/usr/bin/env node
// 今日 3 分钟 — 聚类去噪日报生成器（确定性脚本，禁开放式 agent，符合红线）。
//   读取各栏当日数据文件 → 规则聚类（按主题桶）→ 去近重 → 选每桶代表项 →
//   产出 public/data/daily-digest.json（线上）+ data/digest/<date>.json（按日归档，
//   与 data/papers/<date>-*.json 归档约定一致）。
//
// 文案（lede / 每个 cluster 的 why_it_matters）默认用规则模板生成；若有
// DEEPSEEK_API_KEY，则用便宜层（DeepSeek，与 papers/select.mjs、news/daily.mjs 同路）
// 把模板润色成更顺的中文。无 key 时跳过润色，模板兜底——保证脚本可离线确定性运行。
//
// 说明：当日 2026-06-05 的 public/data/daily-digest.json 是手写的参考产物（高质量、
// 真实聚类+真实站内链接），作为本生成器的对照基线 + npm run validate 的 lint 目标。
// 聚类的「策展判断」（哪条进、为什么值得看怎么写）仍是高价值环节——本脚本给出可跑的
// 确定性骨架；要达到手写版的判断质量，需要在 deepseek 润色 seam 里喂更强的 prompt，
// 或保留手写覆盖（见 --keep-manual）。
//
// Run: node scripts/columns/digest/daily.mjs [--date YYYY-MM-DD] [--keep-manual] [--no-llm]

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PUBLIC_DATA = path.join(ROOT, "public", "data");
const ARCHIVE_DIR = path.join(ROOT, "data", "digest");
const OUT_FILE = path.join(PUBLIC_DATA, "daily-digest.json");
const READ_MINUTES = 3;
const MAX_CLUSTERS = 5;
const MAX_ITEMS_PER_CLUSTER = 5;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (name === "--keep-manual" || name === "--no-llm") return process.argv.includes(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function readJson(rel) {
  try { return JSON.parse(await readFile(path.join(PUBLIC_DATA, rel), "utf8")); } catch { return null; }
}

// ---- normalize the loud English term for near-dup detection ----
function normKey(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "").slice(0, 40);
}

// ---- collect candidate items across all columns into a flat, typed pool ----
function collectPapers(papers) {
  const out = [];
  const seen = new Set();
  const push = (kind, title, one_line, href, score) => {
    const k = normKey(title);
    if (!title || seen.has(k)) return;
    seen.add(k);
    out.push({ kind, title, one_line, href, score, category: undefined });
  };
  for (const d of papers?.deepReads || []) {
    push("paper", d.title, d.one_sentence_judgment, `/papers/${encodeURIComponent(d.slug)}`, undefined, d.tags);
    out[out.length - 1] && (out[out.length - 1].category = inferPaperCategory(d.tags, d.title));
  }
  for (const c of papers?.deepCandidates || []) {
    push("paper", c.title, c.one_line, c.deep_slug ? `/papers/${encodeURIComponent(c.deep_slug)}` : "/articles", c.final_score);
    out[out.length - 1] && (out[out.length - 1].category = c.category);
  }
  for (const r of papers?.radar || []) {
    push("paper", r.title, r.one_line, r.deep_slug ? `/papers/${encodeURIComponent(r.deep_slug)}` : "/articles", r.final_score);
    out[out.length - 1] && (out[out.length - 1].category = r.category);
  }
  return out;
}

function inferPaperCategory(tags = [], title = "") {
  const t = (tags.join(" ") + " " + title).toLowerCase();
  if (/self-evolv|skill|distill|gptswarm|metagpt|judge|survey/.test(t)) return "self-evolving";
  if (/search|deep-research|trajectory|benchmark|eval|rl|reward|rubric|browse/.test(t)) return "search-agent";
  if (/multimodal|video|robot|humanoid|figure|embod/.test(t)) return "multimodal";
  if (/peft|moe|decoding|speculative|distill|training|inference/.test(t)) return "training";
  return "agent";
}

function collectProjects(trending) {
  const seen = new Map();
  for (const w of ["daily", "weekly", "monthly"]) {
    for (const r of trending?.[w]?.repos || []) if (!seen.has(r.fullName)) seen.set(r.fullName, r);
  }
  return [...seen.values()]
    .filter((r) => r.final_depth === "deep" || r.project_tier === 3)
    .sort((a, b) => (Number(b.starsGained) || 0) - (Number(a.starsGained) || 0))
    .map((r) => {
      const slug = r.briefSlug || r.brief_slug;
      const stars = Number(r.starsGained) || Number(r.stars) || 0;
      return {
        kind: "project",
        title: `${r.name} — ${(r.description || "").split(/[.。]/)[0].slice(0, 28)}`.trim(),
        one_line: `${r.description || ""}${stars ? ` ★+${fmtK(stars)}。` : ""}`.trim(),
        href: slug ? `/brief/${encodeURIComponent(slug)}` : r.url,
        score: r.worthDeepDive || r.ranking_score,
        category: "ai-coding-tooling",
      };
    });
}

function collectNews(news) {
  return (news?.items || [])
    .filter((n) => (n.publishedAt || "").slice(0, 10) === (news?.generatedAt || "").slice(0, 10) || true)
    .slice(0, 12)
    .map((n) => ({ kind: "news", title: n.titleZh || n.title, one_line: n.summaryZh || "", href: "/news", category: "news" }));
}

function collectModels(models) {
  return (models?.models || [])
    .filter((m) => m.latestReleasedAt && m.latestReleasedAt >= "2026-05-01")
    .sort((a, b) => String(b.latestReleasedAt).localeCompare(String(a.latestReleasedAt)))
    .map((m) => ({
      kind: "model",
      title: `${m.latestVersion}（${m.vendor}）`,
      one_line: `${m.vendor} ${m.isOpen ? "开放" : "闭源"}模型最新版（${m.latestReleasedAt}）。`,
      href: "/models",
      category: "models",
    }));
}

function collectPodcasts(podcasts) {
  return (podcasts?.episodes || []).slice(0, 4).map((p) => ({
    kind: "podcast",
    title: p.title,
    one_line: (p.tldr || "").replace(/^这期谈了:?/, "").slice(0, 70),
    href: "/podcast",
    category: "podcast",
  }));
}

function fmtK(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n); }

// ---- deterministic clustering: assign pool items into a small set of themes ----
const CLUSTER_DEFS = [
  { id: "search-agent-reliability", theme: "搜索 / 深研 agent 的可靠性与评测", match: (it) => it.kind === "paper" && it.category === "search-agent",
    why: "你要造的 AutoSci 本质是深研 agent，这批论文覆盖它最痛的环节（错在哪、上下文怎么管、评测怎么做难），可直接迁进冷审与自评。" },
  { id: "self-evolving-agents", theme: "自进化 agent / 技能蒸馏（L1 脉络）", match: (it) => it.kind === "paper" && it.category === "self-evolving",
    why: "这是 L0→L1 自进化的零件目录：把轨迹蒸馏成可版本化技能、把 agent 系统当可优化图来自我变好。" },
  { id: "ai-coding-agent-tooling", theme: "给编码 agent 省 token / 省上下文的新工具", match: (it) => it.kind === "project",
    why: "今天月榜清一色在做同一件事：在内容到达 LLM 之前压缩它——这正是 agent 落地的成本瓶颈，也是做 AI 应用最能抄的工程模式。" },
  { id: "training-multimodal", theme: "训练 / 多模态 / 具身", match: (it) => it.kind === "paper" && (it.category === "training" || it.category === "multimodal"),
    why: "能力侧的增量：个性化缩放、推理提速、统一多模态与具身——做应用时按需取用的底层零件。" },
  { id: "models-and-cost", theme: "模型版本 + 成本焦虑", match: (it) => it.kind === "model" || it.kind === "news",
    why: "能力之外，行业话题正转向「token 账单怎么管」，和今天论文/项目的「可靠 + 省钱」主线合流。" },
  { id: "podcast-people", theme: "播客 · 人与判断", match: (it) => it.kind === "podcast",
    why: "想做 AI PM/FDE，还要看从业者怎么判断节奏——挑一期听采用周期与一线训模经验。" },
];

function clusterPool(pool) {
  const clusters = [];
  for (const def of CLUSTER_DEFS) {
    const items = pool.filter(def.match).slice(0, MAX_ITEMS_PER_CLUSTER);
    if (items.length === 0) continue;
    clusters.push({
      id: def.id,
      theme: def.theme,
      why_it_matters: def.why,
      items: items.map((it) => {
        const o = { kind: it.kind, title: it.title, href: it.href };
        if (it.one_line) o.one_line = it.one_line;
        if (typeof it.score === "number") o.score = it.score;
        return o;
      }),
    });
  }
  return clusters.slice(0, MAX_CLUSTERS);
}

function templateLede(clusters) {
  const themes = clusters.slice(0, 3).map((c) => c.theme.split(/[（(]/)[0].trim());
  return `今天的看点集中在：${themes.join("、")}。聚类去噪后保留每个主题最值得看的几条，约 ${READ_MINUTES} 分钟读完。`;
}

// --- optional cheap-layer polish (DeepSeek) — same wiring as papers/select.mjs, news/daily.mjs ---
async function maybePolish({ lede, clusters }, useLlm) {
  if (!useLlm || !process.env.DEEPSEEK_API_KEY) {
    return { lede, clusters, polished: false, reason: useLlm ? "no DEEPSEEK_API_KEY" : "--no-llm" };
  }
  try {
    const { createDeepSeekClient } = await import("../../lib/llm.mjs");
    const client = createDeepSeekClient();
    const sys = `你是 Kevin 的 AI 情报日报编辑。给定一份当日聚类摘要，用大白话、不夸张、不编造，
重写 lede（1-2 句捕捉当天主线）和每个 cluster 的 why_it_matters（1 句「为什么值得看」）。
保持中文、信息不增不减，只让句子更顺。只输出 JSON：{"lede":"..","why":{"<cluster_id>":".."}}，不要 markdown。`;
    const user = `lede 草稿：${lede}\n\nclusters：\n${clusters.map((c) => `- id=${c.id} 主题=${c.theme} why=${c.why_it_matters} 条目=${c.items.map((i) => i.title).join("；")}`).join("\n")}`;
    const out = await client.chatJson({ system: sys, user, maxTokens: 1200 });
    const why = out?.why || {};
    return {
      lede: typeof out?.lede === "string" && out.lede.trim() ? out.lede.trim() : lede,
      clusters: clusters.map((c) => (typeof why[c.id] === "string" && why[c.id].trim() ? { ...c, why_it_matters: why[c.id].trim() } : c)),
      polished: true,
    };
  } catch (e) {
    return { lede, clusters, polished: false, reason: `polish failed: ${e.message}` };
  }
}

export async function main() {
  const date = arg("--date", new Date().toISOString().slice(0, 10));
  const keepManual = arg("--keep-manual");
  const useLlm = !arg("--no-llm");

  // Guard: never silently clobber a hand-authored reference output for `date`.
  if (keepManual && existsSync(OUT_FILE)) {
    try {
      const cur = JSON.parse(await readFile(OUT_FILE, "utf8"));
      if (cur?.date === date && cur?.source === "hand-authored") {
        console.log(`[digest] --keep-manual: ${date} is hand-authored — leaving public/data/daily-digest.json untouched.`);
        await mkdir(ARCHIVE_DIR, { recursive: true });
        await writeFile(path.join(ARCHIVE_DIR, `${date}.json`), JSON.stringify(cur, null, 2) + "\n", "utf8");
        return cur;
      }
    } catch { /* fall through to regenerate */ }
  }

  const [papers, trending, news, models, podcasts] = await Promise.all([
    readJson("papers-index.json"), readJson("trending.json"), readJson("news.json"),
    readJson("models.json"), readJson("podcasts.json"),
  ]);

  const pool = [
    ...collectPapers(papers), ...collectProjects(trending),
    ...collectModels(models), ...collectNews(news), ...collectPodcasts(podcasts),
  ];
  const clusters = clusterPool(pool);
  let lede = templateLede(clusters);

  const polished = await maybePolish({ lede, clusters }, useLlm);
  lede = polished.lede;

  const doc = {
    generatedAt: new Date().toISOString(),
    date,
    readMinutes: READ_MINUTES,
    source: "generated",
    lede,
    clusters: polished.clusters,
    audio: { available: false, note: "音频简报（NotebookLM 式 TTS）即将上线，引擎待定。" },
  };

  await mkdir(ARCHIVE_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(doc, null, 2) + "\n", "utf8");
  await writeFile(path.join(ARCHIVE_DIR, `${date}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");

  console.log(`[digest] ${date}: ${doc.clusters.length} clusters, ${doc.clusters.reduce((n, c) => n + c.items.length, 0)} items` +
    `${polished.polished ? " (llm-polished)" : ` (template${polished.reason ? `, ${polished.reason}` : ""})`}`);
  console.log(`[digest] wrote public/data/daily-digest.json + data/digest/${date}.json`);
  return doc;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[digest] FAILED: ${e.message}`); process.exitCode = 1; });
}
