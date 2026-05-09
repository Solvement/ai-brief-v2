import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function loadDotEnvLocal() {
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function compileForNode() {
  const tsc = join("node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json"], { stdio: "inherit" });
}

function parseArg(value) {
  const [owner, repo] = (value ?? "anthropics/anthropic-cookbook").split("/");
  if (!owner || !repo) throw new Error("Usage: node scripts/github-smoke.mjs <owner>/<repo>");
  return { owner, repo };
}

loadDotEnvLocal();
compileForNode();

const { owner, repo } = parseArg(process.argv[2]);
const { fetchGitHubRepoStats } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/ingestion/github.js")).href);
const stats = await fetchGitHubRepoStats(owner, repo);
if (!stats) throw new Error(`No public GitHub repository found for ${owner}/${repo}`);

console.log(JSON.stringify(stats, null, 2));
