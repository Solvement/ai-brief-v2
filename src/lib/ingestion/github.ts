import { getEnv } from "../ai/evaluation/env";

export interface GitHubRepoStats {
  full_name: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  open_prs: number;
  contributors_count: number;
  license: string | null;
  default_branch: string;
  last_commit_iso: string;
  last_commit_days_ago: number;
  releases_last_90d: number;
  primary_language: string | null;
  archived: boolean;
  fetched_at: string;
}

const cacheTtlMs = 86_400_000;
const githubCacheRoot = process.env.AIBRIEF_GITHUB_CACHE_DIR ?? ".cache/github";

async function nodeImport(moduleName: string): Promise<unknown> {
  const importer = new Function("moduleName", "return import(moduleName)") as (value: string) => Promise<unknown>;
  return importer(moduleName);
}

function cachePath(owner: string, repo: string): string {
  return `${githubCacheRoot}/${owner.toLowerCase()}__${repo.toLowerCase()}.json`;
}

function isFresh(stats: GitHubRepoStats): boolean {
  return Number.isFinite(Date.parse(stats.fetched_at)) && Date.now() - Date.parse(stats.fetched_at) < cacheTtlMs;
}

async function readCachedStats(owner: string, repo: string): Promise<GitHubRepoStats | null> {
  try {
    const fs = (await nodeImport("node:fs/promises")) as { readFile(path: string, encoding: "utf8"): Promise<string> };
    const parsed = JSON.parse(await fs.readFile(cachePath(owner, repo), "utf8")) as GitHubRepoStats;
    return isFresh(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCachedStats(owner: string, repo: string, stats: GitHubRepoStats): Promise<void> {
  const fs = (await nodeImport("node:fs/promises")) as {
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    writeFile(path: string, value: string, encoding: "utf8"): Promise<void>;
  };
  await fs.mkdir(githubCacheRoot, { recursive: true });
  await fs.writeFile(cachePath(owner, repo), JSON.stringify(stats, null, 2), "utf8");
}

function githubHeaders(): HeadersInit {
  const token = getEnv("GITHUB_TOKEN");
  return {
    accept: "application/vnd.github+json",
    "user-agent": "ai-brief-v2",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchGitHubJson<T>(url: string): Promise<{ value: T | null; headers: Headers }> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) return { value: null, headers: response.headers };
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`GitHub request failed with ${response.status}: ${body}`);
  }
  return { value: (await response.json()) as T, headers: response.headers };
}

function countFromLinkOrArray(headers: Headers, value: unknown[] | null): number {
  const link = headers.get("link") ?? "";
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (match) return Number.parseInt(match[1], 10);
  return value?.length ?? 0;
}

function daysAgo(iso: string): number {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return 9999;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export async function fetchGitHubRepoStats(owner: string, repo: string): Promise<GitHubRepoStats | null> {
  const cached = await readCachedStats(owner, repo);
  if (cached) return cached;

  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const repoResponse = await fetchGitHubJson<{
    full_name: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    license?: { spdx_id?: string; name?: string } | null;
    default_branch: string;
    pushed_at: string;
    language: string | null;
    archived: boolean;
  }>(base);

  if (!repoResponse.value) return null;
  const repoData = repoResponse.value;

  const contributors = await fetchGitHubJson<unknown[]>(`${base}/contributors?per_page=1`);
  const pulls = await fetchGitHubJson<unknown[]>(`${base}/pulls?state=open&per_page=1`);
  const releases = await fetchGitHubJson<Array<{ published_at?: string; created_at?: string }>>(`${base}/releases?per_page=100`);
  const ninetyDaysAgo = Date.now() - 90 * 86_400_000;

  const stats: GitHubRepoStats = {
    full_name: repoData.full_name,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.watchers_count,
    open_issues: repoData.open_issues_count,
    open_prs: countFromLinkOrArray(pulls.headers, pulls.value),
    contributors_count: countFromLinkOrArray(contributors.headers, contributors.value),
    license: repoData.license?.spdx_id && repoData.license.spdx_id !== "NOASSERTION" ? repoData.license.spdx_id : (repoData.license?.name ?? null),
    default_branch: repoData.default_branch,
    last_commit_iso: repoData.pushed_at,
    last_commit_days_ago: daysAgo(repoData.pushed_at),
    releases_last_90d: (releases.value ?? []).filter((release) => Date.parse(release.published_at ?? release.created_at ?? "") >= ninetyDaysAgo).length,
    primary_language: repoData.language,
    archived: repoData.archived,
    fetched_at: new Date().toISOString(),
  };

  await writeCachedStats(owner, repo, stats);
  return stats;
}
