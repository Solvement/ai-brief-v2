#!/usr/bin/env node
// 机器 DONE 定义 — Mind Palace 关系引擎 (plan: docs/plans/2026-06-11-mind-palace-relation-engine.md)
// taxonomy: docs/paradigms/relation-taxonomy.md。审核前先写(eval-first)。现状会红→codex 刷绿。
// Read-only。非 0 = 未达 DONE。
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 8 组 taxonomy 的 typed 边型(relation-taxonomy.md)
const TYPED = new Set([
  "composes_with", "layers_with", "complements", "supersedes", "replaces", "cheaper_alt",
  "compares_with", "contradicts", "tension_with", "precedes", "lineage_anchor",
  "validates", "isomorphic_with", "evaluates",
  // KG-2 既有保留(过渡兼容)
  "improves_on", "extends", "implements", "applies", "tool_for", "shares_method", "builds_on",
]);
// 机械边:不得出现在主边层(应隐藏/secondary)
const MECHANICAL = new Set(["references", "same_track", "shares_tag"]);
const fails = [];
const notes = [];

function readJson(rel) {
  try { return JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")); } catch { return null; }
}

const g = readJson("public/data/brief/graph.json");
if (!g) { console.error("# eval-relation-engine\n❌ graph.json missing"); process.exit(1); }
const edges = g.edges || g.links || [];
// 主边层 = 非机械层。引擎产物应给 typed 边带 evidence+use,并把机械边放进 hidden/secondary 字段。
const primary = edges.filter((e) => !(e.layer === "mechanical" || e.hidden === true));
const typedPrimary = primary.filter((e) => TYPED.has(e.type || e.rel || e.kind));
const mechPrimary = primary.filter((e) => MECHANICAL.has(e.type || e.rel || e.kind));

notes.push(`edges total=${edges.length} · primary=${primary.length} · typed-primary=${typedPrimary.length} · mechanical-in-primary=${mechPrimary.length}`);

// ① 机械边不在主边层
if (mechPrimary.length > 0) fails.push(`${mechPrimary.length} 机械边(references/same_track)仍在主边层 → 应 layer:"mechanical"/hidden`);

// ② 主边层应以 typed 为主体(>=80%)
if (primary.length > 0) {
  const ratio = typedPrimary.length / primary.length;
  notes.push(`typed 占主边层 ${(ratio * 100).toFixed(0)}%`);
  if (ratio < 0.8) fails.push(`主边层 typed 占比 ${(ratio * 100).toFixed(0)}% < 80%`);
}

// ③ 每条 typed 边带 evidence + use(怎么利用)——外脑原则
const missingEvidence = typedPrimary.filter((e) => !String(e.evidence || "").trim());
const missingUse = typedPrimary.filter((e) => !String(e.use || e.how_to_use || "").trim());
if (typedPrimary.length === 0) fails.push("无 typed 主边 → 边引擎未产出");
if (missingEvidence.length) fails.push(`${missingEvidence.length} 条 typed 边缺 evidence(出处)`);
if (missingUse.length) fails.push(`${missingUse.length} 条 typed 边缺 use(怎么利用动作)`);

// ④ 边型必须 ∈ taxonomy(无野生型)
const wild = [...new Set(typedPrimary.map((e) => e.type || e.rel || e.kind).filter((t) => !TYPED.has(t)))];
// (typedPrimary 已过滤为 TYPED, 此处检查 primary 里非机械非 typed 的野型)
const wildPrimary = [...new Set(primary.map((e) => e.type || e.rel || e.kind).filter((t) => !TYPED.has(t) && !MECHANICAL.has(t)))];
if (wildPrimary.length) fails.push(`主边层有 taxonomy 外野生边型: ${wildPrimary.join(", ")}`);

console.log("# eval-relation-engine");
for (const n of notes) console.log("  " + n);
if (fails.length) {
  console.error("\n❌ NOT DONE:");
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
console.log("\n✅ relation engine DONE");
process.exit(0);
