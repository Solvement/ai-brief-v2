#!/usr/bin/env node
/**
 * Run ingest if public/data/trending.json is older than INGEST_INTERVAL_HOURS.
 * Used as a pre-step before `npm run dev`: if data is fresh, skip; else re-ingest.
 *
 * Env:
 *   INGEST_INTERVAL_HOURS   default 18
 */
import { statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "public", "data", "trending.json");
const HOURS = Number(process.env.INGEST_INTERVAL_HOURS) || 18;

function ageHours() {
  if (!existsSync(DATA)) return Infinity;
  const ms = Date.now() - statSync(DATA).mtimeMs;
  return ms / 3600_000;
}

const age = ageHours();
if (age < HOURS) {
  console.log(`[maybe-ingest] trending.json ${age.toFixed(1)}h 旧 < ${HOURS}h 阈值，跳过 ingest。`);
  process.exit(0);
}

console.log(`[maybe-ingest] trending.json ${Number.isFinite(age) ? age.toFixed(1) + "h" : "不存在"}，超过 ${HOURS}h 阈值，触发 ingest…`);

const child = spawn(process.execPath, ["--no-warnings", path.join(__dirname, "ingest.mjs")], {
  stdio: "inherit",
  cwd: ROOT,
});
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => { console.error(err); process.exit(1); });
