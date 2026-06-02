import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOST_TERMS } from "../../lib/project-ranking.mjs";
import { fetchGitHubReadme, scrapeTrendingBoard } from "../../lib/github-trending.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PUBLIC_TRENDING = path.join(ROOT, "public", "data", "trending.json");
const BRIEF_WIKI_CONTENT = path.join(ROOT, "brief-wiki", "content");
const DEFAULT_WINDOWS = ["daily", "weekly", "monthly"];
const SEARCH_TERMS = ["agent", "rag", "mcp", "a2a", "memory", "eval", "ai coding", "coding agent"];
const DEFAULT_USER_AGENT = "Mozilla/5.0 ai-brief-projects/0.3";
const GITHUB_API_BASE = "https://api.github.com";
const NOT_FOUND = "not_found";
const ARTIFACT_AUDIT_FIELDS = [
  "repo_full_name",
  "repo_url",
  "stargazers_count",
  "forks_count",
  "license_spdx_id",
  "pushed_at",
  "open_issues_count",
  "default_branch",
  "topics",
  "archived",
  "homepage",
  "top_level_entries",
  "has_src",
  "has_tests",
  "has_docs",
  "has_examples",
  "has_packages",
  "has_ci",
  "latest_release_tag_name",
  "latest_release_published_at",
];

export async function discover(ctx = {}) {
  const options = ctx.options || {};
  const limit = numberOption(options.limit, 15);
  const topicLimit = numberOption(options.topicLimit, 4);
  const offline = isOffline(options);
  const discoveredAt = nowIso(options);
  const rows = [];

  if (offline) {
    rows.push(...await loadOfflineTrending({ limit, discoveredAt }));
  } else {
    rows.push(...await discoverTrending({ limit, discoveredAt, logger: ctx.logger }));
    rows.push(...await discoverTopicSearch({ topicLimit, discoveredAt, logger: ctx.logger, options }));
  }

  const mergedCandidates = mergeCandidates(rows);
  const deepDivedRepos = readBriefWikiDeepDivedProjectRepos(options.briefWikiContentDir || BRIEF_WIKI_CONTENT);
  const candidates = mergedCandidates.filter((candidate) => !matchesKnownRepo(candidate.raw, deepDivedRepos));
  const skipped = mergedCandidates.length - candidates.length;
  if (skipped) ctx.logger?.info?.(`projects discover skipped ${skipped} already deep-dived repo(s) from brief-wiki`);
  if (options.db) {
    for (const candidate of candidates) options.db.upsertCandidate(candidate);
  }
  return candidates;
}

export async function collectEvidence(candidate, ctx = {}) {
  const options = ctx.options || {};
  const repo = candidate.raw || {};
  const offline = isOffline(options);
  let content = repo.readme || repo.cachedReadme || "";

  if (!content && repo.deep?.howItWorks) content = repo.deep.howItWorks;
  if (!content && repo.light) content = repo.light;
  if (!content && repo.description) content = repo.description;

  const repoIdentity = repoIdentityForApi(repo);
  const artifactAudit = offline || !repoIdentity
    ? emptyArtifactAudit(repo)
    : await fetchArtifactAudit(repoIdentity.owner, repoIdentity.name, { options, logger: ctx.logger, repo });

  if (!offline && !options.noReadme && repoIdentity) {
    try {
      content = await fetchGitHubReadme(repoIdentity.owner, repoIdentity.name, {
        githubToken: options.githubToken || process.env.GITHUB_TOKEN,
        maxChars: numberOption(options.readmeMaxChars, 14000),
      }) || content;
    } catch (error) {
      ctx.logger?.warn?.(`README failed ${repo.fullName}: ${error.message}`);
    }
  }

  const evidence = {
    candidateId: candidate.id,
    kind: "readme",
    content: String(content || repo.description || repo.fullName || "").slice(0, numberOption(options.readmeMaxChars, 14000)),
    artifactAudit,
    metadata: { artifactAudit },
    fetchedAt: nowIso(options),
  };
  if (options.db) options.db.upsertEvidence(evidence);
  return evidence;
}

export function isOffline(options = {}, env = process.env) {
  return Boolean(
    options.dryRun ||
    options.noLlm ||
    env.NO_LLM === "1" ||
    env.AI_BRIEF_OFFLINE === "1",
  );
}

export function readBriefWikiDeepDivedProjectRepos(contentDir = BRIEF_WIKI_CONTENT) {
  const repos = { urls: new Set(), fullNames: new Set() };
  try {
    if (!existsSync(contentDir)) return repos;
    for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      try {
        const file = path.join(contentDir, entry.name);
        const text = readFileSync(file, "utf8");
        const frontmatter = parseFrontmatter(text);
        if (normalizeFrontmatterScalar(frontmatter.type) !== "project") continue;
        if (!isDeepDivedProject(frontmatter, text)) continue;

        const url = normalizeGitHubRepoUrl(frontmatter.url);
        const fullName = parseGitHubFullName(frontmatter.url);
        if (url) repos.urls.add(url);
        if (fullName) repos.fullNames.add(fullName);
      } catch {
        continue;
      }
    }
  } catch {
    return { urls: new Set(), fullNames: new Set() };
  }
  return repos;
}

async function fetchArtifactAudit(owner, name, { options = {}, logger, repo = {} } = {}) {
  const audit = emptyArtifactAudit();
  const fullName = normalizeRepoFullName(`${owner}/${name}`) || normalizeRepoFullName(repo.fullName) || parseGitHubFullName(repo.url);
  if (fullName) {
    audit.repo_full_name = fullName;
    audit.repo_url = `https://github.com/${fullName}`;
  }

  const repoResult = await fetchGitHubApiJson(repoApiPath(owner, name), {
    options,
    logger,
    label: `repo metadata ${owner}/${name}`,
  });

  if (repoResult.ok) {
    const data = repoResult.data || {};
    audit.repo_full_name = normalizeRepoFullName(data.full_name) || audit.repo_full_name;
    audit.repo_url = normalizeGitHubRepoUrl(data.html_url) || audit.repo_url;
    audit.stargazers_count = valueOrNotFound(data.stargazers_count);
    audit.forks_count = valueOrNotFound(data.forks_count);
    audit.license_spdx_id = valueOrNotFound(data.license?.spdx_id);
    audit.pushed_at = valueOrNotFound(data.pushed_at);
    audit.open_issues_count = valueOrNotFound(data.open_issues_count);
    audit.default_branch = valueOrNotFound(data.default_branch);
    audit.topics = Array.isArray(data.topics) ? data.topics : NOT_FOUND;
    audit.archived = valueOrNotFound(data.archived);
    audit.homepage = valueOrNotFound(data.homepage);
  }

  if (audit.default_branch !== NOT_FOUND) {
    const treeResult = await fetchGitHubApiJson(`${repoApiPath(owner, name)}/git/trees/${encodeURIComponent(audit.default_branch)}`, {
      options,
      logger,
      label: `repo tree ${owner}/${name}@${audit.default_branch}`,
    });
    if (treeResult.ok && Array.isArray(treeResult.data?.tree)) {
      const entries = treeResult.data.tree.map((entry) => entry?.path).filter(Boolean);
      Object.assign(audit, treeAudit(entries));
    }
  }

  const releaseResult = await fetchGitHubApiJson(`${repoApiPath(owner, name)}/releases/latest`, {
    options,
    logger,
    label: `latest release ${owner}/${name}`,
    warn404: false,
  });
  if (releaseResult.ok) {
    audit.latest_release_tag_name = valueOrNotFound(releaseResult.data?.tag_name);
    audit.latest_release_published_at = valueOrNotFound(releaseResult.data?.published_at);
  }

  return audit;
}

async function fetchGitHubApiJson(pathname, { options = {}, logger, label = pathname, warn404 = true } = {}) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": options.userAgent || DEFAULT_USER_AGENT,
  };
  const token = options.githubToken || process.env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetch(new URL(pathname, GITHUB_API_BASE), { headers });
    if (!response.ok) {
      if (warn404 || response.status !== 404) logger?.warn?.(`GitHub ${label} failed: ${response.status}`);
      return { ok: false, status: response.status };
    }
    return { ok: true, status: response.status, data: await response.json() };
  } catch (error) {
    logger?.warn?.(`GitHub ${label} failed: ${error.message}`);
    return { ok: false, status: "offline", error };
  }
}

function emptyArtifactAudit() {
  return Object.fromEntries(ARTIFACT_AUDIT_FIELDS.map((field) => [field, NOT_FOUND]));
}

function treeAudit(entries) {
  const names = entries.map((entry) => String(entry || "")).filter(Boolean);
  const lower = new Set(names.map((entry) => entry.toLowerCase()));
  return {
    top_level_entries: names,
    has_src: hasAny(lower, ["src", "source", "lib"]),
    has_tests: hasAny(lower, ["test", "tests", "__tests__", "spec", "specs"]),
    has_docs: hasAny(lower, ["doc", "docs", "documentation"]),
    has_examples: hasAny(lower, ["example", "examples", "sample", "samples", "demo", "demos"]),
    has_packages: hasAny(lower, ["packages", "package.json", "pyproject.toml", "setup.py", "cargo.toml", "go.mod", "pom.xml"]),
    has_ci: lower.has(".github"),
  };
}

function hasAny(set, names) {
  return names.some((name) => set.has(name));
}

function repoApiPath(owner, name) {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function matchesKnownRepo(repo = {}, known = { urls: new Set(), fullNames: new Set() }) {
  const fullNames = unique([
    normalizeRepoFullName(repo.fullName),
    parseGitHubFullName(repo.url),
  ]);
  const urls = unique([
    normalizeGitHubRepoUrl(repo.url),
    ...fullNames.map((fullName) => `https://github.com/${fullName}`),
  ]);
  return fullNames.some((fullName) => known.fullNames.has(fullName)) || urls.some((url) => known.urls.has(url));
}

function repoIdentityForApi(repo = {}) {
  const fullName = normalizeRepoFullName(repo.fullName) || parseGitHubFullName(repo.url);
  if (!fullName) return null;
  const [owner, name] = fullName.split("/");
  return owner && name ? { owner, name } : null;
}

async function discoverTrending({ limit, discoveredAt, logger }) {
  const rows = [];
  for (const window of DEFAULT_WINDOWS) {
    try {
      const repos = await scrapeTrendingBoard(window, { limit });
      repos.forEach((repo, index) => {
        rows.push(toCandidate(repo, {
          source: `github-trending:${window}`,
          window,
          rank: index + 1,
          discoveredAt,
        }));
      });
    } catch (error) {
      logger?.warn?.(`GitHub Trending ${window} failed: ${error.message}`);
      rows.push(...await loadOfflineWindow(window, { limit, discoveredAt, source: `github-trending-cache:${window}` }));
    }
  }
  return rows;
}

async function discoverTopicSearch({ topicLimit, discoveredAt, logger, options }) {
  const rows = [];
  for (const term of SEARCH_TERMS) {
    try {
      const repos = await searchGitHubRepos(term, { limit: topicLimit, options });
      repos.forEach((repo, index) => {
        rows.push(toCandidate(repo, {
          source: `github-search:${term}`,
          window: "daily",
          rank: 1000 + rows.length + index,
          discoveredAt,
          sourceTerm: term,
        }));
      });
    } catch (error) {
      logger?.warn?.(`GitHub search "${term}" failed: ${error.message}`);
    }
  }
  return rows;
}

async function searchGitHubRepos(term, { limit, options }) {
  const query = searchQueryForTerm(term);
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": options.userAgent || DEFAULT_USER_AGENT,
  };
  const token = options.githubToken || process.env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GitHub search ${response.status}`);
  const data = await response.json();
  return (data.items || []).map((item) => ({
    fullName: item.full_name,
    owner: item.owner?.login,
    name: item.name,
    url: item.html_url,
    ownerAvatarUrl: item.owner?.avatar_url || (item.owner?.login ? `https://github.com/${item.owner.login}.png?size=80` : ""),
    description: item.description || null,
    language: item.language || null,
    languageColor: null,
    stars: Number(item.stargazers_count) || 0,
    forks: Number(item.forks_count) || 0,
    starsGained: 0,
  })).filter((repo) => repo.fullName && repo.owner && repo.name);
}

function searchQueryForTerm(term) {
  const normalized = term.toLowerCase();
  if (/^[a-z0-9-]+$/.test(normalized)) return `topic:${normalized} stars:>50`;
  return `"${term}" in:name,description,readme stars:>50`;
}

async function loadOfflineTrending({ limit, discoveredAt }) {
  const rows = [];
  for (const window of DEFAULT_WINDOWS) {
    rows.push(...await loadOfflineWindow(window, { limit, discoveredAt, source: `offline:${window}` }));
  }
  return rows.length ? rows : fallbackRows(discoveredAt);
}

async function loadOfflineWindow(window, { limit, discoveredAt, source }) {
  const data = await readJson(PUBLIC_TRENDING, null);
  const repos = data?.[window]?.repos || [];
  return repos.slice(0, limit).map((repo, index) => toCandidate(repo, {
    source,
    window,
    rank: index + 1,
    discoveredAt,
  }));
}

function fallbackRows(discoveredAt) {
  return [
    toCandidate({
      fullName: "example/agent-memory",
      owner: "example",
      name: "agent-memory",
      url: "https://github.com/example/agent-memory",
      ownerAvatarUrl: "https://github.com/example.png?size=80",
      description: "Reference implementation for agent memory, retrieval, evals, and tool use.",
      language: "TypeScript",
      languageColor: "#3178c6",
      stars: 1200,
      forks: 80,
      starsGained: 140,
    }, { source: "offline:fallback", window: "daily", rank: 1, discoveredAt }),
  ];
}

function toCandidate(repo, { source, window, rank, discoveredAt, sourceTerm = null }) {
  const fullName = String(repo.fullName || repo.full_name || "").trim();
  const [ownerFromName, nameFromFull] = fullName.split("/");
  const owner = repo.owner || ownerFromName;
  const name = repo.name || nameFromFull;
  const raw = normalizeRepo({
    ...repo,
    fullName,
    owner,
    name,
    url: repo.url || (fullName ? `https://github.com/${fullName}` : ""),
    ownerAvatarUrl: repo.ownerAvatarUrl || (owner ? `https://github.com/${owner}.png?size=80` : ""),
    windows: window ? [window] : [],
    ranksByWindow: window ? { [window]: rank } : {},
    sourceTerms: sourceTerm ? [sourceTerm] : [],
    boostTerms: BOOST_TERMS,
  });

  return {
    id: projectCandidateId(raw.fullName),
    column: "projects",
    source,
    raw,
    dedupeKey: raw.fullName.toLowerCase(),
    discoveredAt,
  };
}

function mergeCandidates(candidates) {
  const byKey = new Map();
  for (const candidate of candidates) {
    if (!candidate?.raw?.fullName) continue;
    const key = candidate.dedupeKey || candidate.raw.fullName.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }
    existing.source = mergeSource(existing.source, candidate.source);
    existing.raw = mergeRepoRaw(existing.raw, candidate.raw);
  }
  return [...byKey.values()];
}

function mergeRepoRaw(left, right) {
  return {
    ...left,
    ...Object.fromEntries(Object.entries(right).filter(([, value]) => value !== null && value !== undefined && value !== "")),
    windows: unique([...(left.windows || []), ...(right.windows || [])]),
    sourceTerms: unique([...(left.sourceTerms || []), ...(right.sourceTerms || [])]),
    ranksByWindow: { ...(left.ranksByWindow || {}), ...(right.ranksByWindow || {}) },
    stars: Math.max(Number(left.stars) || 0, Number(right.stars) || 0),
    forks: Math.max(Number(left.forks) || 0, Number(right.forks) || 0),
    starsGained: Math.max(Number(left.starsGained) || 0, Number(right.starsGained) || 0),
  };
}

function normalizeRepo(repo) {
  return {
    fullName: String(repo.fullName || ""),
    owner: String(repo.owner || ""),
    name: String(repo.name || ""),
    url: String(repo.url || ""),
    ownerAvatarUrl: String(repo.ownerAvatarUrl || ""),
    description: repo.description == null ? null : String(repo.description),
    language: repo.language == null ? null : String(repo.language),
    languageColor: repo.languageColor == null ? null : String(repo.languageColor),
    stars: Number(repo.stars) || 0,
    forks: Number(repo.forks) || 0,
    starsGained: Number(repo.starsGained) || 0,
    rank: Number(repo.rank) || 0,
    tldr: repo.tldr,
    tags: repo.tags,
    light: repo.light,
    worthDeepDive: repo.worthDeepDive,
    rankingReason: repo.rankingReason,
    deep: repo.deep,
    windows: repo.windows || [],
    ranksByWindow: repo.ranksByWindow || {},
    sourceTerms: repo.sourceTerms || [],
  };
}

function mergeSource(left, right) {
  return unique(String(left || "").split("+").concat(String(right || "").split("+")).filter(Boolean)).join("+");
}

function parseFrontmatter(text) {
  const match = String(text || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    out[item[1]] = normalizeFrontmatterScalar(item[2]);
  }
  return out;
}

function normalizeFrontmatterScalar(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function isDeepDivedProject(frontmatter, text) {
  const status = normalizeFrontmatterScalar(frontmatter.status);
  return status === "deep_dived" || /\[\[deep-dives\//.test(String(text || ""));
}

function normalizeRepoFullName(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^github\.com\//i, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "");
  const match = raw.match(/^([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  if (!match) return "";
  return `${match[1]}/${match[2]}`.toLowerCase();
}

function parseGitHubFullName(url) {
  return normalizeRepoFullName(url);
}

function normalizeGitHubRepoUrl(url) {
  const fullName = parseGitHubFullName(url);
  return fullName ? `https://github.com/${fullName}` : "";
}

function valueOrNotFound(value) {
  if (value === null || value === undefined) return NOT_FOUND;
  if (typeof value === "string" && value.trim() === "") return NOT_FOUND;
  return value;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function projectCandidateId(fullName) {
  return `project:${String(fullName || "").toLowerCase()}`;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function numberOption(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
