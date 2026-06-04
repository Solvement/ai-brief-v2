#!/usr/bin/env node
// Data-level daily self-check for the 3 eval points Kevin defined (2026-06-03):
//   1. (visual — needs a browser; not covered here, flagged for manual review)
//   2. analysis present + density per column (light/deep)
//   3. freshness: is the content from TODAY's run, not stale
// Writes logs/eval-report-<date>.md and prints a summary. Read-only; never throws on content gaps (reports them).

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

const lines = [`# Daily eval report — ${today}`, ""];
const flags = [];

// ---- Models ----
const models = await readJson("public/data/models.json");
if (!models) { lines.push("## 模型\n- ⚠️ models.json 缺失"); flags.push("models missing"); }
else {
  const withContent = models.models.filter((m) => (m.kind === "open" ? m.analysis : m.changelog));
  lines.push("## 模型", `- 更新于 ${freshLabel(models.generatedAt)}`, `- ${models.models.length} 个,有分析/changelog 的 ${withContent.length} 个`);
  if (!isToday(models.generatedAt)) flags.push("models stale");
}

// ---- Projects (radar) ----
const trending = await readJson("public/data/trending.json");
if (!trending) { lines.push("\n## 项目\n- ⚠️ trending.json 缺失"); flags.push("projects missing"); }
else {
  const repos = [...new Map([...(trending.daily?.repos||[]), ...(trending.weekly?.repos||[]), ...(trending.monthly?.repos||[])].map((r)=>[r.fullName, r])).values()];
  const byDepth = {};
  for (const r of repos) { const d = r.final_depth || (r.deep ? "deep" : "list_only"); byDepth[d] = (byDepth[d]||0)+1; }
  const withBrief = repos.filter((r)=>r.briefSlug || r.brief_slug).length;
  lines.push("\n## 项目", `- 更新于 ${freshLabel(trending.generatedAt)}`, `- ${repos.length} 个,分层 ${JSON.stringify(byDepth)},接 brief 深读 ${withBrief} 个`);
  if (!isToday(trending.generatedAt)) flags.push("projects stale");
  if (!repos.some((r)=>["analysis","deep"].includes(r.final_depth))) flags.push("projects: no analysis/deep tier today");
}

// ---- Articles (papers) ----
const articles = await readJson("public/data/articles.json");
if (!articles) { lines.push("\n## 文章\n- ⚠️ articles.json 缺失"); flags.push("articles missing"); }
else {
  const deep = articles.papers.filter((p)=>Array.isArray(p.originalReading) && p.originalReading.length>0 && p.analystNotes);
  const avgLen = articles.papers.length ? Math.round(articles.papers.reduce((s,p)=>s+(p.analystNotes?.length||0),0)/articles.papers.length) : 0;
  lines.push("\n## 文章", `- 更新于 ${freshLabel(articles.generatedAt)}`, `- ${articles.papers.length} 篇,有深度分析(originalReading+analystNotes)的 ${deep.length} 篇,analystNotes 平均 ${avgLen} 字`);
  if (!isToday(articles.generatedAt)) flags.push("articles stale");
  if (deep.length === 0) flags.push("articles: NO deep analysis (originalReading empty)");
}

lines.push("\n## 标记", flags.length ? flags.map((f)=>`- ⚠️ ${f}`).join("\n") : "- ✅ 无数据级问题", "", "> 视觉效果 + “能否给别人讲清楚”需人工开浏览器复核(下次会话)。");

const report = lines.join("\n") + "\n";
await mkdir(path.join(ROOT, "logs"), { recursive: true });
await writeFile(path.join(ROOT, "logs", `eval-report-${today}.md`), report, "utf8");
// also write into public/data so the daily CI commit (git add public/data) persists it + it deploys
await writeFile(path.join(ROOT, "public", "data", "eval-report.md"), report, "utf8");
console.log(report);
if (flags.length) console.log(`eval: ${flags.length} flag(s) — see logs/eval-report-${today}.md`);
