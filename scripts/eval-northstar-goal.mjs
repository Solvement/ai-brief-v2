#!/usr/bin/env node
// North-star overnight GOAL eval (Kevin 2026-06-04: "先写清楚裁判 eval 标准再实现").
// Machine DONE for the self-improving-agent lineage deep-reads. The autonomous loop runs
// this each iteration to see what's left; green = goal met. Structural/provenance quality is
// enforced separately by validate-papers-deepread.mjs; the JUDGMENT rubric is the cold-audit
// gate (docs/superpowers/specs/cold-audit-prompt.md). This eval = COVERAGE + artifact completeness.
// Run: node scripts/eval-northstar-goal.mjs   (exit 0 = all targets done, exit 1 = work remains)

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content", "papers");
const PRIMITIVES = path.join(ROOT, "data", "autosci", "primitives");
const SEED_FILE = path.join(ROOT, "data", "papers", "lineage-seed.json");

// Already-blessed gold + the priority-1 lineage Kevin named are the overnight targets.
const EXTRA_TARGETS = [{ arxiv_id: "2606.02060", title: "DRIFT (gold)" }];

async function listContentDirs() {
  try {
    const entries = await readdir(CONTENT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

async function checkTarget(id, dirs) {
  const dir = dirs.find((d) => d.startsWith(`${id}-`) || d === id);
  if (!dir) return { id, done: false, why: "no content dir" };
  const base = path.join(CONTENT, dir);
  const checks = {
    "paper.mdx": await fileExists(path.join(base, "paper.mdx")),
    "career.mdx": await fileExists(path.join(base, "career.mdx")),
    "metadata.json": await fileExists(path.join(base, "metadata.json")),
    "primitive.yaml": await fileExists(path.join(PRIMITIVES, `${id}.yaml`)),
  };
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  return { id, dir, done: missing.length === 0, why: missing.length ? `missing ${missing.join(", ")}` : "ok" };
}

export async function main() {
  const seed = JSON.parse(await readFile(SEED_FILE, "utf8"));
  const p1 = (seed.seeds || []).filter((s) => s.priority === 1);
  const targets = [...EXTRA_TARGETS, ...p1].map((s) => ({ arxiv_id: s.arxiv_id, title: s.title }));

  const dirs = await listContentDirs();
  const results = [];
  for (const t of targets) results.push({ ...t, ...(await checkTarget(t.arxiv_id, dirs)) });

  const done = results.filter((r) => r.done);
  console.log("\n=== North-star GOAL eval — self-improving-agent lineage deep-reads ===");
  for (const r of results) {
    console.log(`  [${r.done ? "✓" : " "}] ${r.id}  ${r.title || ""}  ${r.done ? "" : "→ " + r.why}`);
  }
  console.log(`\n  DONE ${done.length}/${results.length}` + (done.length === results.length ? "  ✅ GOAL GREEN" : "  — work remains"));
  const remaining = results.filter((r) => !r.done).map((r) => r.id);
  if (remaining.length) console.log(`  next: ${remaining.join(", ")}\n`);
  process.exitCode = done.length === results.length ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
