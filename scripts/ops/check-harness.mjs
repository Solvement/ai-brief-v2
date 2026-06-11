// Harness structural integrity gate (CMU four-piece: 约束 + 进化 块).
//
// Scripts the previously-prose RULES that are machine-decidable, so "完成"
// stops depending on the model remembering them:
//   - workflow.yaml stage integrity: every stage has id/role/owner/advance_when;
//     every rollback_to is null or an existing stage id; no duplicate ids.
//   - every workflow stage `role` is a declared role in docs/agents/README.md
//     (流程定义引用的角色契约必须存在 — CMU ch.7 / RULES #17).
//   - cross-file links in RULES.md / workflow.md / agents README resolve
//     (引用不悬空 — RULES #10/#15 活文档).
//   - task-board.md done/delivered entries reference verification evidence
//     (closeout 必须引用验证结果 — CMU ch.8 验收清单, WARN only).
//
// HARD errors (exit 1): broken workflow graph, dangling cross-file links.
// WARN (exit 0): closeout entries lacking evidence. So it is safe to wire
// into `npm run validate` without false-positive build breakage.
//
// Usage: node scripts/ops/check-harness.mjs

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(".");
const errors = [];
const warnings = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const rel = (p) => path.relative(ROOT, p).replaceAll("\\", "/");
const read = (p) => readFile(p, "utf8");

// ---- 1. workflow.yaml stage graph integrity --------------------------------
const WORKFLOW_YAML = path.join(ROOT, "docs", "workflow", "workflow.yaml");
const AGENTS_README = path.join(ROOT, "docs", "agents", "README.md");

let declaredRoles = new Set();

async function checkAgentsRoles() {
  if (!existsSync(AGENTS_README)) {
    fail(rel(AGENTS_README), "missing — workflow roles cannot be validated");
    return;
  }
  const md = await read(AGENTS_README);
  // Roles live in the markdown table as **role** cells.
  for (const m of md.matchAll(/\|\s*\*\*(.+?)\*\*\s*\|/g)) {
    declaredRoles.add(m[1].trim());
  }
  if (declaredRoles.size === 0) {
    warn(rel(AGENTS_README), "no **role** cells parsed — role-reference check skipped");
  }
}

async function checkWorkflow() {
  if (!existsSync(WORKFLOW_YAML)) {
    fail(rel(WORKFLOW_YAML), "missing");
    return;
  }
  let doc;
  try {
    doc = parseYaml(await read(WORKFLOW_YAML));
  } catch (err) {
    fail(rel(WORKFLOW_YAML), `YAML parse error: ${err.message}`);
    return;
  }
  const stages = doc?.stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    fail(rel(WORKFLOW_YAML), "stages must be a non-empty array");
    return;
  }
  const ids = new Set();
  for (const s of stages) {
    if (!s?.id) { fail(rel(WORKFLOW_YAML), "a stage is missing `id`"); continue; }
    if (ids.has(s.id)) fail(rel(WORKFLOW_YAML), `duplicate stage id: ${s.id}`);
    ids.add(s.id);
  }
  for (const s of stages) {
    const at = `${rel(WORKFLOW_YAML)} [stage ${s?.id ?? "?"}]`;
    for (const key of ["role", "owner", "advance_when"]) {
      if (!s?.[key] || String(s[key]).trim() === "") fail(at, `missing \`${key}\``);
    }
    // rollback_to must be null or an existing stage id
    if (s?.rollback_to != null && !ids.has(s.rollback_to)) {
      fail(at, `rollback_to points to unknown stage: ${s.rollback_to}`);
    }
    // role must be a declared role contract (substring match: table cell vs
    // owner-qualified role string like "codex(...) | claude(...)")
    if (declaredRoles.size > 0 && s?.role) {
      const role = String(s.role);
      const known = [...declaredRoles].some((r) => role.includes(r) || r.includes(role));
      if (!known) warn(at, `role "${s.role}" has no contract row in docs/agents/README.md`);
    }
  }
  if (!doc?.routing?.stop_to_human) {
    warn(rel(WORKFLOW_YAML), "routing.stop_to_human not declared");
  }
}

// ---- 2. cross-file link resolution (引用不悬空) ----------------------------
const LINK_SOURCES = [
  path.join(ROOT, "RULES.md"),
  path.join(ROOT, "docs", "workflow", "workflow.md"),
  path.join(ROOT, "docs", "agents", "README.md"),
];

async function checkLinks() {
  for (const src of LINK_SOURCES) {
    if (!existsSync(src)) { warn(rel(src), "missing (link source skipped)"); continue; }
    const md = await read(src);
    const seen = new Set();
    for (const m of md.matchAll(/\]\(([^)]+)\)/g)) {
      let target = m[1].trim();
      target = target.replace(/^<(.+)>$/, "$1").trim();      // [x](<path with space>)
      target = target.replace(/\s+["'].*["']$/, "").trim();  // strip trailing "title"
      if (/^(https?:|mailto:|#)/.test(target)) continue;     // external / anchors
      target = target.split("#")[0].trim();                  // strip in-page anchor
      if (!target) continue;
      const key = `${src}|${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const resolved = path.resolve(path.dirname(src), target);
      if (!existsSync(resolved)) fail(rel(src), `dangling link → ${target}`);
    }
  }
}

// ---- 3. task-board closeout evidence (CMU ch.8) ----------------------------
const TASK_BOARD = path.join(ROOT, "task-board.md");
const EVIDENCE_RX = /(verify|冷审|审计|过审|复核|核对|commit|[0-9a-f]{7,40}\b|门|recall|lighthouse|test|PASS|live|部署|上线|origin\/main)/i;

async function checkCloseout() {
  if (!existsSync(TASK_BOARD)) { warn(rel(TASK_BOARD), "missing"); return; }
  const lines = (await read(TASK_BOARD)).split(/\r?\n/);
  // A closeout claim = a 交付结论 line. Warn when it asserts completion but
  // cites no verification evidence. (The ✅ heading is just a title — evidence
  // lives in the body, so we do not flag headings.)
  lines.forEach((line, i) => {
    // field label "交付结论：" — tolerate bold markers (**交付结论**：) before the
    // colon. Bare prose mentions (交付结论。) are not flagged.
    if (!/交付结论\*{0,2}\s*[：:]/.test(line)) return;
    // explicitly empty / pending conclusions are honest, not unverified claims
    if (/交付结论\*{0,2}\s*[：:]\s*(—|-|待|TBD|$)/.test(line.trim())) return;
    const blob = line + " " + (lines[i + 1] ?? "");
    if (!EVIDENCE_RX.test(blob)) {
      warn(rel(TASK_BOARD), `line ${i + 1}: 交付结论 without verification evidence`);
    }
  });
}

// ---- run --------------------------------------------------------------------
await checkAgentsRoles();
await checkWorkflow();
await checkLinks();
await checkCloseout();

if (warnings.length) {
  console.log(`harness check: ${warnings.length} warning(s)`);
  for (const w of warnings) console.log(`  WARN ${w}`);
}
if (errors.length) {
  console.error(`harness check FAILED: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  ERROR ${e}`);
  process.exit(1);
}
console.log(`harness check passed (${warnings.length} warning(s))`);
