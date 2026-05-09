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

loadDotEnvLocal();
compileForNode();

const ingestion = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/ingestion/index.js")).href);

const source = {
  id: "github-smoke",
  name: "GitHub",
  url: "https://github.com",
  source_type: "github",
  language: "en",
  reliability_level: 4,
  enabled: true,
};

const rows = [
  {
    title: "Claude cookbooks",
    url: "https://github.com/anthropics/anthropic-cookbook",
    summary: "Claude cookbook repository imported as a project for AI-brief enrichment.",
    content_type: "project",
    tags: ["Open Source", "AI Coding"],
  },
];

const plain = ingestion.importManualJson(source, rows).items[0];
const enriched = (await ingestion.importManualJsonWithEnrichment(source, rows)).items[0];

console.log(
  JSON.stringify(
    {
      before: {
        title: plain.title,
        content_type: plain.content_type,
        maturity: plain.maturity,
        installation_minutes: plain.installation_minutes,
        github_stats: Boolean(plain.github_stats),
      },
      after: {
        title: enriched.title,
        content_type: enriched.content_type,
        maturity: enriched.maturity,
        installation_minutes: enriched.installation_minutes,
        github_stats: {
          full_name: enriched.github_stats?.full_name,
          stars: enriched.github_stats?.stars,
          contributors_count: enriched.github_stats?.contributors_count,
          last_commit_days_ago: enriched.github_stats?.last_commit_days_ago,
          open_prs: enriched.github_stats?.open_prs,
          license: enriched.github_stats?.license,
        },
      },
    },
    null,
    2,
  ),
);
