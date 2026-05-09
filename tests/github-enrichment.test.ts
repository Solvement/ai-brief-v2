import { buildEvaluationPrompt } from "../src/lib/ai/evaluation/prompt";
import { fetchGitHubRepoStats, type GitHubRepoStats } from "../src/lib/ingestion/github";
import { importManualJsonWithEnrichment, type Source } from "../src/lib/ingestion";
import { parseGitHubRepoUrl } from "../src/lib/ingestion/url-router";

declare const process: { cwd(): string; env: Record<string, string | undefined> };
declare function require(moduleName: string): unknown;

const { existsSync, mkdirSync, rmSync, writeFileSync } = require("node:fs") as {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive: boolean }): void;
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  writeFileSync(path: string, value: string, encoding: "utf8"): void;
};
const { join } = require("node:path") as { join(...parts: string[]): string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const parsed = parseGitHubRepoUrl("https://github.com/foo/bar/tree/main");
assert(parsed?.owner === "foo" && parsed.repo === "bar", "GitHub URL parser should extract owner/repo from tree URL");
assert(parseGitHubRepoUrl("https://github.com/foo/bar/")?.repo === "bar", "GitHub URL parser should handle trailing slash");
assert(parseGitHubRepoUrl("https://example.com/foo/bar") === null, "GitHub URL parser should reject non-GitHub URLs");

const stats: GitHubRepoStats = {
  full_name: "fixture/repo",
  stars: 740,
  forks: 51,
  watchers: 740,
  open_issues: 12,
  open_prs: 3,
  contributors_count: 18,
  license: "MIT",
  default_branch: "main",
  last_commit_iso: "2026-05-01T00:00:00Z",
  last_commit_days_ago: 6,
  releases_last_90d: 2,
  primary_language: "TypeScript",
  archived: false,
  fetched_at: new Date().toISOString(),
};

const githubCacheDir = join(process.cwd(), ".tmp", "test-cache", "github-enrichment");
if (existsSync(githubCacheDir)) rmSync(githubCacheDir, { recursive: true, force: true });
mkdirSync(githubCacheDir, { recursive: true });
process.env.AIBRIEF_GITHUB_CACHE_DIR = githubCacheDir;
writeFileSync(join(githubCacheDir, "fixture__repo.json"), JSON.stringify(stats), "utf8");

async function main() {
  const cached = await fetchGitHubRepoStats("fixture", "repo");
  assert(cached?.full_name === "fixture/repo", "GitHub stats should read a fresh cache entry before network");

  const promptWithoutStats = buildEvaluationPrompt({
    content_type: "tool",
    title: "Repo without stats",
    raw_text: "一个没有仓库数据的工具，需要正常构建 prompt。",
    source_type: "github",
    source_count: 1,
    has_official_source: false,
  });
  assert(!promptWithoutStats.user.includes("[仓库客观数据]"), "prompt should omit GitHub stats block when absent");

  const promptWithStats = buildEvaluationPrompt({
    content_type: "tool",
    title: "Repo with stats",
    raw_text: "一个带仓库数据的工具，需要把客观信号提供给模型。",
    source_type: "github",
    source_count: 1,
    has_official_source: false,
    github_stats: stats,
  });
  assert(promptWithStats.user.includes("[仓库客观数据]"), "prompt should include GitHub stats block when present");
  assert(promptWithStats.user.includes("stars: 740"), "prompt should include concrete star count");

  const source: Source = {
    id: "github-source",
    name: "GitHub",
    url: "https://github.com",
    source_type: "github",
    language: "en",
    reliability_level: 4,
    enabled: true,
  };
  const imported = await importManualJsonWithEnrichment(source, [
    {
      title: "Fixture repo",
      url: "https://github.com/fixture/repo",
      summary: "A GitHub repo imported for enrichment.",
      content_type: "project",
      tags: ["Open Source"],
    },
  ]);
  assert(imported.items[0].github_stats?.stars === 740, "GitHub import should attach cached stats");
  assert(imported.items[0].content_type === "project", "enriched import should preserve content type");
}

export default main();
