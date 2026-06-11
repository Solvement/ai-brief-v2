#!/usr/bin/env node
// Live progress board for background tasks (Claude runs + codex agents).
// Problem it solves (Kevin 2026-06-11): background `codex exec` / pipeline runs stream to
// .agent/*.log, NOT the terminal — so you can't tell "still running" from "stuck". The signal
// is log freshness: a live task keeps writing; a stuck one's log mtime stops advancing.
//
// Usage:
//   node scripts/ops/progress.mjs              one-shot snapshot
//   node scripts/ops/progress.mjs --watch      refresh every 3s (Ctrl+C to quit)
//   node scripts/ops/progress.mjs --watch --secs 5 --dir .agent --stuck 180
//
// Status: RUN (wrote <45s ago) · SLOW (45–stuck s) · STUCK? (>stuck s, no exit marker) · DONE
import { readdirSync, statSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const WATCH = has("--watch");
const SECS = Number(val("--secs", "3"));
const STUCK = Number(val("--stuck", "180"));
const DIR = val("--dir", ".agent");
const DONE_RE = /\bexit=\d|\bexit code\b|✅|all pass|DONE\b|finished|completed/i;

function lastMeaningfulLine(file) {
  let text = "";
  try { text = readFileSync(file, "utf8"); } catch { return ""; }
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.length ? lines[lines.length - 1] : "";
}

function snapshot() {
  let files = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".log")).map((f) => path.join(DIR, f));
  } catch { return [{ name: `(${DIR} not found)`, age: 0, status: "—", last: "" }]; }
  const now = Date.now();
  return files.map((file) => {
    const age = Math.round((now - statSync(file).mtimeMs) / 1000);
    const last = lastMeaningfulLine(file);
    // STUCK? only flags the suspicious window (recently went quiet → maybe hung right now).
    // A log quiet for >15min with no exit marker is treated as ENDED (process long gone), not
    // "stuck this instant" — avoids false alarms on hours-old finished codex runs.
    let status;
    if (DONE_RE.test(last)) status = "DONE";
    else if (age < 45) status = "RUN";
    else if (age < STUCK) status = "SLOW";
    else if (age < 900) status = "STUCK?";
    else status = "ENDED";
    return { name: path.basename(file), age, status, last };
  }).sort((a, b) => a.age - b.age);
}

function render() {
  const rows = snapshot();
  const icon = { RUN: "🟢", SLOW: "🟡", "STUCK?": "🔴", DONE: "⚪", ENDED: "·", "—": "·" };
  const lines = [`progress board · ${new Date().toLocaleTimeString()} · stuck>${STUCK}s${WATCH ? ` · every ${SECS}s (Ctrl+C quit)` : ""}`, ""];
  for (const r of rows) {
    const tail = r.last.length > 88 ? r.last.slice(0, 88) + "…" : r.last;
    lines.push(`${icon[r.status] || "·"} ${r.status.padEnd(6)} ${String(r.age).padStart(5)}s  ${r.name.padEnd(28)} ${tail}`);
  }
  if (!rows.length) lines.push("(no .agent/*.log files)");
  return lines.join("\n");
}

if (WATCH) {
  const loop = () => { process.stdout.write("\x1b[2J\x1b[H" + render() + "\n"); };
  loop();
  setInterval(loop, SECS * 1000);
} else {
  console.log(render());
}
