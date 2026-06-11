#!/usr/bin/env node
// 机器 DONE 定义 — 项目栏全覆盖 + 分类器加固 (plan: docs/plans/2026-06-11-projects-coverage-self-evo.md)
// 审核前先写 (Kevin 2026-06-11 "审核之前需要先写 eval 的标准")。
// 现状会红：agent_skill 品类 + 覆盖挡位未实现 → codex 实现后刷绿。
// Read-only。退出码非 0 = 未达 DONE。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AI_TYPES = new Set([
  "ai_app", "agent_framework", "agent_skill", "devtool_cli",
  "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate",
]);
const fails = [];
const notes = [];

async function readJson(rel) {
  try { return JSON.parse(await readFile(path.join(ROOT, rel), "utf8")); } catch { return null; }
}

// ── Part 1: 分类准确率 (golden fixture) ─────────────────────────────
async function evalClassifier() {
  let classify;
  try {
    ({ classifyProjectType: classify } = await import("./columns/projects/evaluate.mjs"));
  } catch (e) {
    fails.push(`classifier import failed: ${e.message}`);
    return;
  }
  const golden = await readJson("scripts/fixtures/project-type-golden.json");
  if (!golden?.cases?.length) { fails.push("golden fixture missing/empty"); return; }

  let correct = 0;
  let skillAsFramework = 0;
  let nonAiAsAi = 0;
  const wrong = [];
  for (const c of golden.cases) {
    const got = classify({ repo: { name: c.name, fullName: `${c.owner}/${c.name}`, description: c.description, language: c.language } });
    if (got === c.expect) correct++;
    else wrong.push(`${c.owner}/${c.name}: expect ${c.expect} got ${got}`);
    if (c.expect === "agent_skill" && got === "agent_framework") skillAsFramework++;
    if (c.expect === "non_ai_eng" && AI_TYPES.has(got)) nonAiAsAi++;
  }
  const acc = correct / golden.cases.length;
  notes.push(`classifier accuracy ${correct}/${golden.cases.length} = ${acc.toFixed(2)}`);
  if (acc < 0.85) fails.push(`classifier accuracy ${acc.toFixed(2)} < 0.85`);
  if (skillAsFramework > 0) fails.push(`${skillAsFramework} skill(s) misclassified as agent_framework (要 agent_skill 品类)`);
  if (nonAiAsAi > 0) fails.push(`${nonAiAsAi} non-AI repo(s) classified as an AI type`);
  if (wrong.length) notes.push("  wrong: " + wrong.slice(0, 8).join(" | "));
}

// ── Part 2: 覆盖率 + 挡位分布 (trending.json) ───────────────────────
function tierOf(r) { return r.tier ?? r.depth_band ?? r.analysis_depth ?? null; }
function typeOf(r) { return r.project_type || r.bucket || null; }
const HAS_CARD = new Set(["light", "standard", "deep"]);

async function evalCoverage() {
  const t = await readJson("public/data/trending.json");
  if (!t) { fails.push("trending.json missing"); return; }
  const windows = ["daily", "weekly", "monthly"];
  let aiTotal = 0, aiWithCard = 0, listOnlyAi = 0, deepTotalDay = 0;
  for (const w of windows) {
    const node = t[w];
    const repos = Array.isArray(node) ? node : (node?.repos || node?.items || []);
    let deepThisWindow = 0;
    for (const r of repos) {
      const ty = typeOf(r);
      const tier = tierOf(r);
      const isAi = ty && AI_TYPES.has(ty);
      if (isAi) {
        aiTotal++;
        if (HAS_CARD.has(tier)) aiWithCard++;
        if (tier === "list_only") listOnlyAi++;
      }
      if (tier === "deep") deepThisWindow++;
    }
    if (deepThisWindow > 2) fails.push(`${w}: deep=${deepThisWindow} > 2/天质量线`);
    if (w === "daily") deepTotalDay = deepThisWindow;
  }
  notes.push(`coverage: AI repos ${aiWithCard}/${aiTotal} have >=light card; daily deep=${deepTotalDay}; list_only-AI=${listOnlyAi}`);
  if (aiTotal === 0) { notes.push("  (no AI repos in trending yet — run daily first)"); return; }
  if (aiWithCard < aiTotal) fails.push(`coverage gap: ${aiTotal - aiWithCard} AI repo(s) without a light/standard/deep card`);
  if (listOnlyAi > 0) fails.push(`${listOnlyAi} AI repo(s) demoted to list_only (覆盖挡位要求 AI 入榜 >=light)`);
}

await evalClassifier();
await evalCoverage();

console.log("# eval-projects-coverage");
for (const n of notes) console.log("  " + n);
if (fails.length) {
  console.error("\n❌ NOT DONE:");
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
console.log("\n✅ projects coverage DONE");
process.exit(0);
