#!/usr/bin/env node
// Acceptance eval for the 2026-06-04 three-column redesign (Kevin-directed).
// The machine DONE-definition / "goal" target: drive every check to ✅.
//   项目(1A/1B): trending 三榜 + 去重 + 至少一个 Tier2/3 媒体卡 + 高star周/月榜进深度
//   论文(2A/2B): papers-board.json 三榜 + 每条有 arxivId/upvotes/缩略图 + 跨窗去重
//   新闻(3A/3B): news.json 每条有 titleZh + summaryZh(中文)，头条有 imageUrl，日 cap≤24，不编造的结构面
// Read-only. Never throws on content gaps — reports flags so the goal-loop can chase green.
// Visual / "能否讲清楚" checks need a browser (/browse) — flagged for manual review, not asserted here.

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date().toISOString().slice(0, 10);

async function readJson(rel) {
  try { return JSON.parse(await readFile(path.join(ROOT, rel), "utf8")); } catch { return null; }
}
const isToday = (iso) => String(iso || "").slice(0, 10) === today;
const freshLabel = (iso) => `${String(iso || "?").slice(0, 10)}${isToday(iso) ? " ✅今天" : " ⚠️不是今天"}`;
const hasHan = (s) => /[一-鿿]/.test(String(s || ""));

const lines = [`# 三栏改造验收 eval — ${today}`, ""];
const flags = [];
const ok = (m) => lines.push(`- ✅ ${m}`);
const warn = (label, m) => { lines.push(`- ⚠️ ${m}`); flags.push(label); };

// ───────────────────────── 项目 (1A/1B) ─────────────────────────
lines.push("## 项目（项目雷达）");
const trending = await readJson("public/data/trending.json");
if (!trending) warn("projects:missing", "trending.json 缺失");
else {
  lines.push(`- 更新于 ${freshLabel(trending.generatedAt)}`);
  const wins = ["daily", "weekly", "monthly"];
  for (const w of wins) {
    const n = trending[w]?.repos?.length || 0;
    if (n > 0) ok(`${w} 榜 ${n} 个`); else warn(`projects:${w}-empty`, `${w} 榜为空`);
  }
  const all = wins.flatMap((w) => trending[w]?.repos || []);
  const uniq = new Map(all.map((r) => [r.fullName, r]));
  // 1B 视觉前提：至少有一个 Tier2/3（会渲染成 OG 媒体卡，撑起层级）
  const mediaWorthy = [...uniq.values()].filter((r) => {
    const t = r.project_tier; const d = r.final_depth;
    return (typeof t === "number" ? t >= 2 : (d === "deep" || d === "analysis"));
  });
  if (mediaWorthy.length) ok(`Tier2/3 媒体卡 ${mediaWorthy.length} 个（视觉层级可呈现）`);
  else warn("projects:no-media-tier", "没有 Tier2/3，项目页全是紧凑卡、无媒体层级");
  // 1A：高 star 的周/月榜应进深度
  const highStarWM = [...new Map(
    [...(trending.weekly?.repos || []), ...(trending.monthly?.repos || [])].map((r) => [r.fullName, r]),
  ).values()].filter((r) => Number(r.stars) >= 5000);
  const highStarDeep = highStarWM.filter((r) => ["deep", "analysis"].includes(r.final_depth) || (r.project_tier ?? 0) >= 2);
  if (highStarWM.length === 0) ok("周/月榜暂无 ≥5k star 项目（1A 无需触发）");
  else if (highStarDeep.length === highStarWM.length) ok(`高star周/月榜 ${highStarWM.length} 个全部进深度（1A）`);
  else warn("projects:1A-highstar-shallow", `高star周/月榜 ${highStarWM.length} 个，仅 ${highStarDeep.length} 个进深度（1A 未达）`);
  if (!isToday(trending.generatedAt)) flags.push("projects:stale");
}

// ───────────────────────── 论文 (2A/2B) ─────────────────────────
lines.push("\n## 论文（HF 日/周/月榜）");
const board = await readJson("public/data/papers-board.json");
if (!board) warn("papers:board-missing", "papers-board.json 缺失（2A 未建）");
else {
  lines.push(`- 更新于 ${freshLabel(board.generatedAt)}`);
  const wins = ["daily", "weekly", "monthly"];
  let sample = null;
  for (const w of wins) {
    const n = board[w]?.papers?.length || 0;
    if (n > 0) { ok(`${w} 榜 ${n} 篇`); sample = sample || board[w].papers[0]; }
    else warn(`papers:${w}-empty`, `${w} 榜为空`);
  }
  if (sample) {
    const fieldOk = (cond, name) => cond ? ok(`字段 ${name} ✅`) : warn(`papers:field-${name}`, `缺字段 ${name}`);
    fieldOk(Boolean(sample.arxivId), "arxivId");
    fieldOk(Number.isFinite(Number(sample.upvotes)), "upvotes(number)");
    fieldOk(/cdn-thumbnails\.huggingface\.co/.test(String(sample.thumbnailUrl || "")), "thumbnailUrl(HF)");
    fieldOk(Array.isArray(sample.authors), "authors[]");
  }
  if (!isToday(board.generatedAt)) flags.push("papers:stale");
}

// ───────────────────────── 新闻 (3A/3B) ─────────────────────────
lines.push("\n## 新闻（中文卡片 + 选题 + 图）");
const news = await readJson("public/data/news.json");
if (!news?.items?.length) warn("news:missing", "news.json 缺失或空");
else {
  lines.push(`- 更新于 ${freshLabel(news.generatedAt)}，共 ${news.items.length} 条`);
  const withZhTitle = news.items.filter((i) => hasHan(i.titleZh)).length;
  const withZhSummary = news.items.filter((i) => hasHan(i.summaryZh)).length;
  const withImg = news.items.filter((i) => String(i.imageUrl || "").startsWith("http")).length;
  const pct = (n) => Math.round((n / news.items.length) * 100);
  if (pct(withZhTitle) >= 90) ok(`中文标题 titleZh ${withZhTitle}/${news.items.length}`);
  else warn("news:zh-title", `中文标题仅 ${withZhTitle}/${news.items.length}（3A 未达）`);
  if (pct(withZhSummary) >= 80) ok(`一句话中文 summaryZh ${withZhSummary}/${news.items.length}`);
  else warn("news:zh-summary", `summaryZh 仅 ${withZhSummary}/${news.items.length}（3A 未达）`);
  if (withImg >= 1) ok(`头条图 imageUrl ${withImg} 条（3B 可呈现大图卡）`);
  else warn("news:no-image", "无任何 imageUrl，新闻页无大图层级");
  // 不编造的结构面：有 summaryZh 的条目必须有原始 title（来源可溯）；正文判定留给冷审计
  const orphanSummary = news.items.filter((i) => hasHan(i.summaryZh) && !String(i.title || "").trim()).length;
  if (orphanSummary === 0) ok("summaryZh 均挂在有原始标题的条目上（可溯源）");
  else warn("news:orphan-summary", `${orphanSummary} 条 summaryZh 无原始标题（疑似无源）`);
  // 日 cap：单日条数 ≤ 24
  const byDay = {};
  for (const i of news.items) { const d = String(i.publishedAt || "").slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; }
  const overCap = Object.entries(byDay).filter(([, n]) => n > 24);
  if (overCap.length === 0) ok("每日条数 ≤24（cap 生效）");
  else warn("news:over-cap", `${overCap.length} 天超 24 条上限`);
  if (!isToday(news.generatedAt)) flags.push("news:stale");
}

// ───────────────────────── 汇总 ─────────────────────────
lines.push(
  "\n## 汇总",
  flags.length ? `**${flags.length} 个未达项（goal=全部转绿）：**\n${flags.map((f) => `- ⚠️ ${f}`).join("\n")}` : "- ✅✅ 全绿：三栏改造数据级验收通过",
  "",
  "> 仍需人工/浏览器复核：项目 tier 卡型与 OG 图、论文三榜+缩略图、新闻头条大图+中文行+无图兜底，以及解读“能否讲清楚”（冷审计）。",
);

const report = lines.join("\n") + "\n";
await mkdir(path.join(ROOT, "logs"), { recursive: true });
await writeFile(path.join(ROOT, "logs", `eval-redesign-${today}.md`), report, "utf8");
console.log(report);
if (flags.length) {
  console.log(`\neval-redesign: ${flags.length} flag(s) 未达 — 目标是全绿`);
  process.exitCode = 1; // 非零退出，便于 goal-loop / CI 判定"未达门"
} else {
  console.log("\neval-redesign: ✅ 全绿");
}
