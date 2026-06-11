// Token usage telemetry by model / day / session (CMU 反馈块: 遥测/资源观测).
//
// Reads Claude Code's local request logs (~/.claude/projects/**/*.jsonl, each
// line = one event; assistant messages carry message.model + message.usage)
// and aggregates token usage so you can compare models (e.g. Fable 5 vs Opus
// 4.8) per day and locate which sessions/steps burn the most.
//
// NOTE: this measures RAW tokens. Subscription quota debits each model token at
// a model-specific weight that is NOT in these logs — to get the真实倍率, run a
// fixed task under each model and compare /usage deltas (see report).
//
// Usage: node scripts/ops/token-usage-by-model.mjs [--since YYYY-MM-DD]

import { readdirSync, statSync, createReadStream } from "node:fs";
import { join, basename } from "node:path";
import { createInterface } from "node:readline";

const root = join(process.env.USERPROFILE || process.env.HOME, ".claude", "projects");
const sinceArg = process.argv.indexOf("--since");
const since = sinceArg !== -1 ? process.argv[sinceArg + 1] : "2026-06-01";

function* jsonlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* jsonlFiles(p);
    else if (name.endsWith(".jsonl")) yield p;
  }
}

const byModel = new Map();
const byModelDay = new Map();
const bySession = new Map();
// Claude Code writes one JSONL line PER content block (thinking/text/tool_use)
// of a single assistant response, and every such line repeats the same
// message.usage. Counting per line would multiply tokens by the block count
// (which varies by model) — so dedupe by requestId (fallback message.id) and
// count each API response exactly once.
const seenResponses = new Set();

function acc(map, key, u) {
  let r = map.get(key);
  if (!r) { r = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, calls: 0 }; map.set(key, r); }
  r.in += u.input_tokens || 0;
  r.out += u.output_tokens || 0;
  r.cacheRead += u.cache_read_input_tokens || 0;
  r.cacheWrite += u.cache_creation_input_tokens || 0;
  r.calls += 1;
}

for (const file of jsonlFiles(root)) {
  const project = basename(join(file, ".."));
  const rl = createInterface({ input: createReadStream(file, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.includes('"usage"') || !line.includes('"model"')) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    const m = ev.message;
    if (!m || !m.model || !m.usage || m.model === "<synthetic>") continue;
    const responseId = ev.requestId || m.id;
    if (responseId) {
      if (seenResponses.has(responseId)) continue; // already counted this response
      seenResponses.add(responseId);
    }
    const day = (ev.timestamp || "").slice(0, 10) || "unknown";
    acc(byModel, m.model, m.usage);
    acc(byModelDay, `${day}|${m.model}`, m.usage);
    acc(bySession, `${project}|${basename(file, ".jsonl")}|${m.model}`, m.usage);
  }
}

const fmt = (n) => n.toLocaleString("en-US");
function dump(title, map, { sortBy = "out", top = Infinity } = {}) {
  console.log(`\n=== ${title} ===`);
  const rows = [...map.entries()].sort((a, b) => b[1][sortBy] - a[1][sortBy]).slice(0, top);
  for (const [k, r] of rows) {
    const perCall = r.calls ? Math.round(r.out / r.calls) : 0;
    console.log(`${k}\n  calls=${fmt(r.calls)} out=${fmt(r.out)} (avg ${fmt(perCall)}/call) in=${fmt(r.in)} cacheRead=${fmt(r.cacheRead)} cacheWrite=${fmt(r.cacheWrite)}`);
  }
}

dump("TOTAL BY MODEL (all time, all projects)", byModel);
const recent = new Map([...byModelDay].filter(([k]) => k >= since));
dump(`BY DAY x MODEL (since ${since})`, recent, { sortBy: "out" });
dump("TOP 25 SESSIONS BY OUTPUT TOKENS (project|session|model)", bySession, { top: 25 });
