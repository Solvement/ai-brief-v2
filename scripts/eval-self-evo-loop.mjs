#!/usr/bin/env node
// 机器 DONE 定义 — 真·L1 自进化闭环 (plan: docs/plans/2026-06-11-projects-coverage-self-evo.md)
// 深读后拿知识判断"是否更强/适合自己/替换优化自己" → verify 门 → 非红线应用+日志/红线排队。
// 审核前先写 (Kevin 2026-06-11)。现状会红：scripts/kg/self-evo.mjs 未实现 → codex 实现后刷绿。
// 关键安全断言：会让 verify 红的改动必须被回退不应用；红线候选必须排队不自动应用。
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const notes = [];

const CANDIDATE_FIELDS = ["source", "claim", "our_current", "proposed_change", "applies_to", "red_line", "evidence"];
const APPLIES_TO = new Set(["harness", "memory", "writing", "eval", "paradigm", "pipeline", "frontend", "other"]);

let mod;
try {
  mod = await import("./kg/self-evo.mjs");
} catch (e) {
  console.error("# eval-self-evo-loop\n❌ NOT DONE:\n  - scripts/kg/self-evo.mjs 未实现 (" + e.message + ")");
  process.exit(1);
}

const need = ["validateCandidate", "judgeCandidate", "applyCandidate"];
for (const fn of need) if (typeof mod[fn] !== "function") fails.push(`self-evo.mjs missing export: ${fn}()`);
if (fails.length) { report(); }

// ── 1. 候选 schema 校验 ──────────────────────────────────────────
if (typeof mod.validateCandidate === "function") {
  const good = {
    source: "rohitg00/agentmemory", claim: "benchmark-backed persistent memory",
    our_current: "Mind Palace hybrid recall (BM25+e5+RRF)", proposed_change: "试其检索策略，对比 recall-bench",
    applies_to: "memory", red_line: false, evidence: "README benchmark table",
  };
  const goodRes = mod.validateCandidate(good);
  if (!goodRes?.ok) fails.push("validateCandidate rejected a valid candidate: " + JSON.stringify(goodRes?.errors));
  const badRes = mod.validateCandidate({ source: "x" });
  if (badRes?.ok) fails.push("validateCandidate accepted a candidate missing required fields");
  for (const f of CANDIDATE_FIELDS) {
    const partial = { ...good }; delete partial[f];
    if (mod.validateCandidate(partial)?.ok) fails.push(`validateCandidate accepted candidate missing '${f}'`);
  }
  if (mod.validateCandidate({ ...good, applies_to: "nonsense" })?.ok) fails.push("validateCandidate accepted unknown applies_to");
  notes.push("candidate schema checks ran");
}

// ── 2. judge 产 verdict ──────────────────────────────────────────
if (typeof mod.judgeCandidate === "function") {
  const v = await mod.judgeCandidate({
    source: "t", claim: "c", our_current: "o", proposed_change: "p",
    applies_to: "writing", red_line: false, evidence: "e",
  }, { dryRun: true });
  if (!v || !["stronger", "weaker", "unclear"].includes(v.verdict)) {
    fails.push("judgeCandidate must return verdict in {stronger,weaker,unclear}, got " + JSON.stringify(v));
  } else notes.push(`judge verdict shape ok (${v.verdict})`);
}

// ── 3. verify 门：会让 verify 红的改动必须被回退不应用 ─────────────
if (typeof mod.applyCandidate === "function") {
  // 注入一个 verify 必红的假改动 (poison)：应被检测并回退，applied=false
  const poison = {
    source: "eval-self-evo-test", claim: "poison", our_current: "x",
    proposed_change: "inject syntax error", applies_to: "other", red_line: false, evidence: "test",
    _test_mutation: { kind: "poison-verify" },
  };
  try {
    const res = await mod.applyCandidate(poison, { verdict: "stronger", dryRun: true, simulateVerifyFail: true });
    if (res?.applied === true) fails.push("applyCandidate APPLIED a change that fails verify (verify 门失效!)");
    else notes.push("verify gate blocks verify-failing change ✓");
  } catch (e) {
    notes.push("applyCandidate(poison) threw (acceptable if it means not-applied): " + e.message);
  }

  // 红线候选：必须排队，不自动应用，即使 verdict=stronger
  const redline = {
    source: "eval", claim: "schema change", our_current: "x",
    proposed_change: "alter db schema", applies_to: "paradigm", red_line: true, evidence: "test",
  };
  const r2 = await mod.applyCandidate(redline, { verdict: "stronger", dryRun: true });
  if (r2?.applied === true) fails.push("applyCandidate auto-applied a RED-LINE candidate (必须排队等 Kevin!)");
  else if (r2?.queued || r2?.status === "queued_for_review") notes.push("red-line candidate queued, not applied ✓");
  else notes.push("red-line not applied (status=" + JSON.stringify(r2?.status) + ")");
}

report();

function report() {
  console.log("# eval-self-evo-loop");
  for (const n of notes) console.log("  " + n);
  if (fails.length) {
    console.error("\n❌ NOT DONE:");
    for (const f of fails) console.error("  - " + f);
    process.exit(1);
  }
  console.log("\n✅ self-evo loop DONE");
  process.exit(0);
}
