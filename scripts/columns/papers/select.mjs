#!/usr/bin/env node
// HF paper curation — STEP 2: score (DeepSeek, idea-first rubric) + select.
//   read today's candidates → keep high-upvote NEW (not already deep-read) →
//   batch-score 8-dim rubric via DeepSeek (cheap layer) → weighted final →
//   select 1-3 deep-read candidates (category-diversity capped) + 5-10 idea radar →
//   write content/radar/<date>.md + content/deep-dive-candidates/<date>.md +
//   data/papers/<date>-selection.json + update ledger (scores, status=radar).
// "只挑高赞；无高赞当日空着，不硬凑。" 深读正文由强模型(Claude)另写，本步只选不写。
// Run: node scripts/columns/papers/select.mjs [--date YYYY-MM-DD] [--min-upvotes N] [--cap N]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDeepSeekClient } from "../../lib/llm.mjs";
import { readLedger, writeLedger, ledgerKey, isDone } from "./ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAPERS_DIR = path.join(ROOT, "data", "papers");
const RADAR_DIR = path.join(ROOT, "content", "radar");
const DEEPCAND_DIR = path.join(ROOT, "content", "deep-dive-candidates");

// curation rubric weights (Kevin spec 2026-06-04), sum = 1.00
const WEIGHTS = {
  idea_novelty: 0.20,
  system_design_value: 0.20,
  transferability_to_autosci: 0.15,
  breadth_value: 0.15,
  ai_engineering_value: 0.10,
  buildability: 0.10,
  evaluation_value: 0.05,
  evidence_quality: 0.05,
};
const DIMS = Object.keys(WEIGHTS);

const DEFAULT_MIN_UPVOTES = 20;   // 高赞门槛
const DEFAULT_SCORE_CAP = 30;     // 至多评分多少条(控成本)
const DEEP_MAX = 3;
const RADAR_MAX = 10;
const BATCH = 4;                  // 4 篇/批,避免 8 维分批输出撞 max_tokens 截断

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function weighted(scores) {
  let s = 0;
  for (const d of DIMS) s += (Number(scores?.[d]) || 0) * WEIGHTS[d];
  return Math.round(s * 100) / 100;
}

const SYSTEM = `你是 Kevin 的 AI 研究策展助手。Kevin 在建 AutoSci(自我进化的研究 agent)并准备 AI 工程求职。
评分要 idea-first,不是只看 agent 论文:偏好能教会"可迁移系统模式"的论文(架构/工作流/评测方法/工具使用/数据管线/训练范式/多模态接口/可产品化的工程模式)。
不要因为热门就给高分;不要因为"不是 agent 论文"就压低分。只依据给定的标题+摘要,信息不足就给保守分。
对每篇论文按 0-10 打 8 个维度,并给一个简短中文 one_line(它教了什么可迁移的东西)、category(粗分类,如 agent/rag/training/inference/eval/multimodal/data/systems/theory/other)、autosci_relevance(direct|indirect|inspiration|none)。
只输出一个 JSON 对象 {"items":[{"index":int,"scores":{"idea_novelty":..,"system_design_value":..,"transferability_to_autosci":..,"breadth_value":..,"ai_engineering_value":..,"buildability":..,"evaluation_value":..,"evidence_quality":..},"category":"..","autosci_relevance":"..","one_line":".."}]},不要 markdown。`;

function buildUser(batch) {
  const lines = batch.map((c, i) => `[${i}] 标题: ${c.title}\n摘要: ${(c.summary || "").slice(0, 600)}`);
  return `给这 ${batch.length} 篇论文打分(index 从 0 开始,与输入对应):\n\n${lines.join("\n\n")}`;
}

async function scoreBatch(client, batch) {
  const out = await client.chatJson({ system: SYSTEM, user: buildUser(batch), maxTokens: 2000 });
  const items = Array.isArray(out?.items) ? out.items : [];
  const byIndex = new Map(items.map((it) => [Number(it.index), it]));
  return batch.map((c, i) => {
    const r = byIndex.get(i) || {};
    return {
      ...c,
      scores: r.scores || {},
      final_score: weighted(r.scores || {}),
      category: String(r.category || "other"),
      autosci_relevance: String(r.autosci_relevance || "none"),
      one_line: String(r.one_line || "").trim(),
    };
  });
}

/** greedy deep pick: top by score, ≤2 per category, ≤DEEP_MAX total */
function pickDeep(scored) {
  const deep = [];
  const catCount = {};
  for (const c of scored) {
    if (deep.length >= DEEP_MAX) break;
    if ((catCount[c.category] || 0) >= 2) continue;
    deep.push(c);
    catCount[c.category] = (catCount[c.category] || 0) + 1;
  }
  return deep;
}

function radarMd(date, deep, radar) {
  const row = (c) => `- ▲${c.upvotes} **[${c.title}](https://huggingface.co/papers/${c.arxiv_id})** \`${c.final_score}\` · ${c.category} · AutoSci:${c.autosci_relevance}\n  ${c.one_line}`;
  return `# 想法雷达 · ${date}\n\n> HF 日/周/月榜的高赞新论文,按 idea-first rubric 打分排序。深读候选另见 deep-dive-candidates/${date}.md。\n\n## 深读候选(${deep.length})\n${deep.map(row).join("\n") || "- (今日无)"}\n\n## 雷达(${radar.length})\n${radar.map(row).join("\n") || "- (今日无)"}\n`;
}

function deepCandMd(date, deep) {
  if (!deep.length) return `# 深读候选 · ${date}\n\n今日无高赞新论文达标,空。\n`;
  const block = (c, i) => `## ${i + 1}. ${c.title}\n- arXiv: ${c.arxiv_id} · ▲${c.upvotes} · final \`${c.final_score}\` · ${c.category} · AutoSci:${c.autosci_relevance}\n- 一句话: ${c.one_line}\n- 维度分: ${DIMS.map((d) => `${d.split("_")[0]}=${c.scores[d] ?? "?"}`).join(" ")}\n- HF: https://huggingface.co/papers/${c.arxiv_id}\n`;
  return `# 深读候选 · ${date}\n\n> 强模型(Claude)读全文写三栏深读时,从这里取。\n\n${deep.map(block).join("\n")}`;
}

export async function main() {
  const date = arg("--date", new Date().toISOString().slice(0, 10));
  const minUpvotes = Number(arg("--min-upvotes", String(DEFAULT_MIN_UPVOTES)));
  const cap = Number(arg("--cap", String(DEFAULT_SCORE_CAP)));

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn("[select] 无 DEEPSEEK_API_KEY → 跳过评分(榜单仍由 curate/build-index 产出)");
    return;
  }

  const candFile = path.join(PAPERS_DIR, `${date}-candidates.json`);
  let cand;
  try {
    cand = JSON.parse(await readFile(candFile, "utf8"));
  } catch {
    console.error(`[select] no candidates file for ${date} — run curate.mjs first`);
    process.exitCode = 1;
    return;
  }

  // 资格 = 未 done(deep_read/analyzed/published)且高赞。不要求"首次见到":
  // 未深读的高赞论文每天都该是候选,直到被深读为止(spec)。
  // 按"实时 ledger"复核 done 状态(候选文件里的 already_done 是 curate 时快照,可能过期)。
  const ledger = await readLedger();
  const eligible = (cand.candidates || [])
    .filter((c) => Number(c.upvotes) >= minUpvotes && !isDone(ledger.get(ledgerKey(c))))
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, cap);

  await mkdir(RADAR_DIR, { recursive: true });
  await mkdir(DEEPCAND_DIR, { recursive: true });

  if (eligible.length === 0) {
    console.log(`[select] 今日无高赞新论文(≥${minUpvotes}赞)——当日空着,不硬凑。`);
    await writeFile(path.join(RADAR_DIR, `${date}.md`), radarMd(date, [], []), "utf8");
    await writeFile(path.join(DEEPCAND_DIR, `${date}.md`), deepCandMd(date, []), "utf8");
    await writeFile(path.join(PAPERS_DIR, `${date}-selection.json`), JSON.stringify({ date, empty: true, reason: `no new paper with ≥${minUpvotes} upvotes` }, null, 2) + "\n", "utf8");
    return;
  }

  console.log(`[select] scoring ${eligible.length} high-upvote not-yet-deep candidates (≥${minUpvotes}) via DeepSeek…`);
  const client = createDeepSeekClient();
  const scored = [];
  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH);
    try {
      scored.push(...await scoreBatch(client, batch));
    } catch (e) {
      console.warn(`[select] batch ${i / BATCH} failed (${e.message}); keeping unscored`);
      scored.push(...batch.map((c) => ({ ...c, scores: {}, final_score: 0, category: "other", autosci_relevance: "none", one_line: "" })));
    }
  }
  scored.sort((a, b) => b.final_score - a.final_score || b.upvotes - a.upvotes);

  const deep = pickDeep(scored);
  const deepKeys = new Set(deep.map((c) => c.ledger_key));
  const radar = scored.filter((c) => !deepKeys.has(c.ledger_key)).slice(0, RADAR_MAX);

  // write artifacts
  await writeFile(path.join(RADAR_DIR, `${date}.md`), radarMd(date, deep, radar), "utf8");
  await writeFile(path.join(DEEPCAND_DIR, `${date}.md`), deepCandMd(date, deep), "utf8");
  await writeFile(path.join(PAPERS_DIR, `${date}-selection.json`), JSON.stringify({
    date, generatedAt: new Date().toISOString(), minUpvotes, scoredCount: scored.length,
    deep: deep.map((c) => ({ arxiv_id: c.arxiv_id, title: c.title, final_score: c.final_score, category: c.category, autosci_relevance: c.autosci_relevance, scores: c.scores, one_line: c.one_line })),
    radar: radar.map((c) => ({ arxiv_id: c.arxiv_id, title: c.title, final_score: c.final_score, category: c.category, one_line: c.one_line })),
  }, null, 2) + "\n", "utf8");

  // update ledger: scored items get scores + status "radar" (deep_read only when analyzed)
  for (const c of scored) {
    const rec = ledger.get(ledgerKey(c));
    if (!rec || isDone(rec)) continue;
    rec.scores = c.scores;
    rec.tags = [c.category, `autosci:${c.autosci_relevance}`];
    rec.notes = c.one_line;
    rec.status = "radar";
  }
  await writeLedger(ledger);

  console.log(`[select] deep候选 ${deep.length} · 雷达 ${radar.length} · 评分 ${scored.length}`);
  console.log(`  深读候选: ${deep.map((c) => `${c.arxiv_id}(${c.final_score})`).join(", ") || "无"}`);
  console.log(`[select] wrote content/radar/${date}.md + content/deep-dive-candidates/${date}.md + selection.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[select] FAILED: ${e.message}`); process.exitCode = 1; });
}
