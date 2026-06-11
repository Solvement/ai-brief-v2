// Verify baseline + diff (CMU 反馈块, six-round hardening #5).
//
// Solves "这个失败不是我引入的": snapshot the validate suite BEFORE a change,
// then diff AFTER. The diff reports only validators that NEWLY fail (were
// passing in the baseline) vs newly pass — so责任靠前后报告对比, not叙述.
//
// Granularity is per-validator: each scripts/validate-*.mjs is run as its own
// child process so the baseline records which specific gate moved.
//
// Usage:
//   node scripts/ops/verify-baseline.mjs snapshot   # store baseline
//   node scripts/ops/verify-baseline.mjs diff        # compare current vs baseline
//   node scripts/ops/verify-baseline.mjs run         # just run, print pass/fail
//
// Baseline file: .agent/verify-baseline.json (gitignored, per-machine).
// Exit codes: diff → 1 if any NEW failure; snapshot/run → 0 (informational).

import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const VALIDATE_DIR = path.join(ROOT, "scripts");
const BASELINE = path.join(ROOT, ".agent", "verify-baseline.json");

async function discoverValidators() {
  const names = (await readdir(VALIDATE_DIR))
    .filter((n) => /^validate-.*\.mjs$/.test(n))
    .sort();
  return names;
}

function runValidator(name) {
  const res = spawnSync(process.execPath, [path.join(VALIDATE_DIR, name)], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  // Distinguish a missing-tool/crash (no exit code) from a clean fail.
  let status;
  if (res.error) status = "error";
  else if (res.status === 0) status = "pass";
  else status = "fail";
  const tail = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim().split(/\r?\n/).slice(-3).join(" | ");
  return { status, code: res.status ?? null, tail: tail.slice(0, 300) };
}

async function runAll() {
  const validators = await discoverValidators();
  const results = {};
  for (const name of validators) {
    process.stdout.write(`  ${name} ... `);
    const r = runValidator(name);
    results[name] = r;
    console.log(r.status.toUpperCase());
  }
  return results;
}

const mode = process.argv[2] ?? "run";

if (mode === "snapshot") {
  console.log("Running validate suite for baseline:");
  const results = await runAll();
  await mkdir(path.dirname(BASELINE), { recursive: true });
  await writeFile(BASELINE, JSON.stringify({ takenAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nBaseline written → ${path.relative(ROOT, BASELINE)}`);
  process.exit(0);
}

if (mode === "run") {
  console.log("Running validate suite:");
  const results = await runAll();
  const failed = Object.entries(results).filter(([, r]) => r.status !== "pass");
  console.log(`\n${failed.length === 0 ? "all pass" : `${failed.length} not passing`}`);
  process.exit(0);
}

if (mode === "diff") {
  if (!existsSync(BASELINE)) {
    console.error(`No baseline at ${path.relative(ROOT, BASELINE)} — run \`snapshot\` first.`);
    process.exit(2);
  }
  const base = JSON.parse(await readFile(BASELINE, "utf8"));
  console.log(`Baseline from ${base.takenAt}. Re-running validate suite:`);
  const now = await runAll();

  const newFailures = [];
  const newPasses = [];
  const allNames = new Set([...Object.keys(base.results), ...Object.keys(now)]);
  for (const name of [...allNames].sort()) {
    const was = base.results[name]?.status ?? "absent";
    const is = now[name]?.status ?? "absent";
    const wasOk = was === "pass";
    const isOk = is === "pass";
    // A validator that disappeared (pass → absent) was intentionally removed,
    // not a regression — do not report it as a new failure.
    if (wasOk && !isOk && is !== "absent") newFailures.push(`${name}: ${was} → ${is}  (${now[name]?.tail ?? ""})`);
    else if (!wasOk && isOk) newPasses.push(`${name}: ${was} → ${is}`);
  }

  console.log("");
  if (newPasses.length) {
    console.log(`Fixed (${newPasses.length}):`);
    for (const p of newPasses) console.log(`  + ${p}`);
  }
  if (newFailures.length) {
    console.error(`NEW failures introduced since baseline (${newFailures.length}):`);
    for (const f of newFailures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("No new failures since baseline.");
  process.exit(0);
}

console.error(`Unknown mode "${mode}". Use: snapshot | diff | run`);
process.exit(2);
