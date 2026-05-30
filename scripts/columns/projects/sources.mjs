import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOST_TERMS } from "../../lib/project-ranking.mjs";
import { fetchGitHubReadme, scrapeTrendingBoard } from "../../lib/github-trending.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PUBLIC_TRENDING = path.join(ROOT, "public", "data", "trending.json");
const DEFAULT_WINDOWS = ["daily", "weekly", "monthly"];
const SEARCH_TERMS = ["agent", "rag", "mcp", "a2a", "memory", "eval", "ai coding", "coding agent"];
const DEFAULT_USER_AGENT = "Mozilla/5.0 ai-brief-projects/0.3";

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

  const candidates = mergeCandidates(rows);
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

  if (!offline && !options.noReadme && repo.owner && repo.name) {
    try {
      content = await fetchGitHubReadme(repo.owner, repo.name, {
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
