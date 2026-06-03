import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOST_TERMS } from "../../lib/project-ranking.mjs";
import { scrapeTrendingBoard } from "../../lib/github-trending.mjs";

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
  "created_at",
  "updated_at",
  "pushed_at",
  "open_issues_count",
  "default_branch",
  "topics",
  "archived",
  "homepage",
  "top_level_entries",
  "top_level_dirs",
  "key_files",
  "package_files",
  "has_src",
  "has_tests",
  "has_docs",
  "has_examples",
  "has_packages",
  "has_install",
  "has_docker",
  "has_cli",
  "has_agents",
  "has_mcp",
  "has_skills",
  "has_models",
  "has_demo",
  "has_ci",
  "latest_release_tag_name",
  "latest_release_published_at",
];

const README_BRANCHES = ["main", "master"];
const README_FILES = ["README.md", "README", "readme.md"];
const KEY_FILE_NAMES = new Set([
  "README.md",
  "README",
  "readme.md",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "requirements.txt",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  "go.mod",
  "setup.py",
  "tsconfig.json",
  "vite.config.ts",
  "next.config.js",
  "pnpm-workspace.yaml",
  "Makefile",
]);
const INSTALL_RE = /\b(install|installation|quickstart|getting started|setup|npm install|pnpm install|pip install|uv pip|cargo install|docker run|docker compose)\b/i;
const CLI_RE = /\b(cli|command line|terminal|npx|console_scripts|entry_points|bin\/|commander|click|typer)\b/i;
const AGENT_RE = /\b(agent|agents|agentic|multi-agent|planner|tool calling|tool use|function calling|workflow|orchestration|coding agent|computer use|browser agent)\b/i;
const MCP_RE = /\b(mcp|model context protocol)\b/i;
const SKILLS_RE = /\b(skill|skills|commands?|hooks?|workflow pack|playbook)\b/i;
const MODEL_RE = /\b(model|models|llm|embedding|vector|checkpoint|hugging ?face|openai|anthropic|gemini|claude|inference|rag|retrieval)\b/i;

export async function discover(ctx = {}) {
  const options = ctx.options || {};
  const limit = numberOption(options.limit, 30);
  const topicLimit = numberOption(options.topicLimit, 0);
  const offline = isOffline(options);
  const discoveredAt = nowIso(options);
  const rows = [];

  if (offline) {
    rows.push(...await loadOfflineTrending({ limit, discoveredAt }));
  } else {
    rows.push(...await discoverTrending({ limit, discoveredAt, logger: ctx.logger }));
    if (topicLimit > 0) rows.push(...await discoverTopicSearch({ topicLimit, discoveredAt, logger: ctx.logger, options }));
  }

  const mergedCandidates = mergeCandidates(rows);
  const deepDivedRepos = readBriefWikiDeepDivedProjectRepos(options.briefWikiContentDir || BRIEF_WIKI_CONTENT);
  const discoveryCap = options.cap == null ? null : numberOption(options.cap, null);
  const notDeepDived = mergedCandidates.filter((candidate) => !matchesKnownRepo(candidate.raw, deepDivedRepos));
  const candidates = notDeepDived.slice(0, discoveryCap || undefined);
  const skipped = mergedCandidates.length - notDeepDived.length;
  const capped = notDeepDived.length - candidates.length;
  if (skipped) ctx.logger?.info?.(`projects discover skipped ${skipped} already deep-dived repo(s) from brief-wiki`);
  if (capped) ctx.logger?.info?.(`projects discover capped ${capped} repo(s) by --cap debug limit`);
  if (options.db) {
    for (const candidate of candidates) options.db.upsertCandidate(candidate);
  }
  return candidates;
}

export async function collectEvidence(candidate, ctx = {}) {
  const options = ctx.options || {};
  const repo = candidate.raw || {};
  const offline = isOffline(options);
  const hasCachedReadme = typeof repo.readme === "string" || typeof repo.cachedReadme === "string";
  const cachedReadme = firstString(repo.readme, repo.cachedReadme);
  let readme = cachedReadme;
  let readmeState = {
    source: hasCachedReadme ? "candidate_cache" : "none",
    readme_found: hasCachedReadme,
    readme_fetch_failed: false,
    readme_empty: hasCachedReadme && cachedReadme.trim().length === 0,
  };

  const repoIdentity = repoIdentityForApi(repo);
  const artifactAudit = offline || !repoIdentity
    ? emptyArtifactAudit(repo)
    : await fetchArtifactAudit(repoIdentity.owner, repoIdentity.name, { options, logger: ctx.logger, repo });

  if (!offline && !options.noReadme && repoIdentity) {
    const result = await fetchGitHubRawReadme(repoIdentity.owner, repoIdentity.name, {
      githubToken: options.githubToken || process.env.GITHUB_TOKEN,
      maxChars: numberOption(options.readmeMaxChars, 14000),
      userAgent: options.userAgent || DEFAULT_USER_AGENT,
    });

    if (result.ok) {
      readme = result.content;
      readmeState = {
        source: result.source,
        readme_found: true,
        readme_fetch_failed: false,
        readme_empty: result.content.trim().length === 0,
      };
    } else if (result.readme_fetch_failed) {
      readmeState = {
        source: result.source || readmeState.source,
        readme_found: Boolean(readme),
        readme_fetch_failed: true,
        readme_empty: false,
      };
      ctx.logger?.warn?.(`README failed ${repo.fullName}: ${result.error?.message || result.status || "fetch failed"}`);
    } else if (!readme) {
      readmeState = {
        source: "not_found",
        readme_found: false,
        readme_fetch_failed: false,
        readme_empty: false,
      };
    }
  }

  const content = String(readme || "").slice(0, numberOption(options.readmeMaxChars, 14000))
    || "[no README content fetched — see evidence_signals flags (offline / fetch_failed / empty)]";
  const evidenceSignals = buildEvidenceSignals(repo, {
    artifactAudit,
    rawReadme: content,
    readmeState,
    source: candidate.source,
  });
  const evidence = {
    candidateId: candidate.id,
    kind: "readme",
    content,
    artifactAudit,
    evidenceSignals,
    evidence_signals: evidenceSignals,
    metadata: {
      artifactAudit,
      evidenceSignals,
      evidence_signals: evidenceSignals,
      readmeSource: readmeState.source,
    },
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
    audit.created_at = valueOrNotFound(data.created_at);
    audit.updated_at = valueOrNotFound(data.updated_at);
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
      const entries = treeResult.data.tree
        .map((entry) => ({ path: entry?.path, type: entry?.type }))
        .filter((entry) => entry.path);
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

function emptyArtifactAudit(repo = {}) {
  const fullName = normalizeRepoFullName(repo.fullName) || parseGitHubFullName(repo.url);
  return {
    ...Object.fromEntries(ARTIFACT_AUDIT_FIELDS.map((field) => [field, NOT_FOUND])),
    repo_full_name: fullName || NOT_FOUND,
    repo_url: normalizeGitHubRepoUrl(repo.url) || (fullName ? `https://github.com/${fullName}` : NOT_FOUND),
    stargazers_count: valueOrNotFound(repo.stars),
    forks_count: valueOrNotFound(repo.forks),
    topics: Array.isArray(repo.topics) ? repo.topics : NOT_FOUND,
    top_level_entries: [],
    top_level_dirs: [],
    key_files: [],
    package_files: emptyPackageFiles(),
  };
}

function treeAudit(entries) {
  const normalized = entries.map((entry) => {
    if (typeof entry === "string") return { path: entry, type: "" };
    return { path: String(entry?.path || ""), type: String(entry?.type || "") };
  }).filter((entry) => entry.path);
  const names = normalized.map((entry) => entry.path);
  const lower = new Set(names.map((entry) => entry.toLowerCase()));
  const topLevelDirs = normalized
    .filter((entry) => entry.type === "tree" || (!entry.type && !entry.path.includes("/") && !entry.path.includes(".")))
    .map((entry) => entry.path)
    .filter((entry) => !entry.includes("/"));
  const keyFiles = normalized
    .filter((entry) => entry.type !== "tree")
    .map((entry) => entry.path)
    .filter((entry) => KEY_FILE_NAMES.has(path.basename(entry)) || KEY_FILE_NAMES.has(entry));
  const packageFiles = packageFilesFromNames(lower);
  return {
    top_level_entries: names,
    top_level_dirs: topLevelDirs,
    key_files: keyFiles,
    package_files: packageFiles,
    has_src: hasAny(lower, ["src", "source", "lib"]),
    has_tests: hasAny(lower, ["test", "tests", "__tests__", "spec", "specs"]),
    has_docs: hasAny(lower, ["doc", "docs", "documentation"]),
    has_examples: hasAny(lower, ["example", "examples", "sample", "samples", "demo", "demos"]),
    has_packages: hasAny(lower, ["packages", "package.json", "pyproject.toml", "setup.py", "cargo.toml", "go.mod", "pom.xml"]),
    has_install: hasAny(lower, ["install.md", "installation.md", "setup.py", "package.json", "pyproject.toml", "requirements.txt", "cargo.toml", "go.mod"]),
    has_docker: packageFiles.dockerfile || packageFiles.docker_compose_yml,
    has_cli: hasAny(lower, ["cli", "cmd", "bin", "commands"]),
    has_agents: hasAny(lower, ["agent", "agents"]),
    has_mcp: hasAny(lower, ["mcp", "mcp-server", "mcp_servers"]),
    has_skills: hasAny(lower, ["skill", "skills", "commands", "hooks"]),
    has_models: hasAny(lower, ["model", "models", "checkpoints"]),
    has_demo: hasAny(lower, ["demo", "demos", "example", "examples"]),
    has_ci: lower.has(".github"),
  };
}

export function buildEvidenceSignals(repo = {}, {
  artifactAudit = {},
  rawReadme = "",
  readmeState = {},
  source = "",
} = {}) {
  const raw = String(rawReadme || "");
  const readmeText = raw.toLowerCase();
  const treeText = [
    ...arrayValue(artifactAudit.top_level_entries),
    ...arrayValue(artifactAudit.top_level_dirs),
    ...arrayValue(artifactAudit.key_files),
  ].join("\n").toLowerCase();
  const topics = arrayValue(artifactAudit.topics === NOT_FOUND ? repo.topics : artifactAudit.topics);
  const packageFiles = {
    ...emptyPackageFiles(),
    ...packageFilesFromAudit(artifactAudit),
  };

  const readmeFound = Boolean(readmeState.readme_found);
  const readmeFetchFailed = Boolean(readmeState.readme_fetch_failed);
  const readmeEmpty = readmeFetchFailed ? false : Boolean(readmeState.readme_empty);
  const hasDocs = boolAudit(artifactAudit.has_docs) || /\b(docs?|documentation)\b/i.test(treeText);
  const hasExamples = boolAudit(artifactAudit.has_examples) || /\b(examples?|samples?)\b/i.test(treeText);
  const hasDemo = boolAudit(artifactAudit.has_demo) || hasExamples || /\b(demo|demos)\b/i.test(`${readmeText}\n${treeText}`);
  const hasInstall = boolAudit(artifactAudit.has_install)
    || INSTALL_RE.test(readmeText)
    || packageFiles.package_json
    || packageFiles.pyproject_toml
    || packageFiles.cargo_toml
    || packageFiles.requirements_txt
    || packageFiles.docker_compose_yml
    || packageFiles.dockerfile;
  const hasDocker = boolAudit(artifactAudit.has_docker)
    || packageFiles.docker_compose_yml
    || packageFiles.dockerfile
    || /\b(docker|container)\b/i.test(readmeText);
  const hasCli = boolAudit(artifactAudit.has_cli) || CLI_RE.test(`${readmeText}\n${treeText}`);
  const hasAgents = boolAudit(artifactAudit.has_agents) || AGENT_RE.test(`${readmeText}\n${treeText}\n${topics.join(" ")}`);
  const hasMcp = boolAudit(artifactAudit.has_mcp) || MCP_RE.test(`${readmeText}\n${treeText}\n${topics.join(" ")}`);
  const hasSkills = boolAudit(artifactAudit.has_skills) || SKILLS_RE.test(`${readmeText}\n${treeText}`);
  const hasModels = boolAudit(artifactAudit.has_models) || MODEL_RE.test(`${readmeText}\n${treeText}\n${topics.join(" ")}`);

  return {
    owner: repo.owner || ownerFromFullName(repo.fullName),
    repo: repo.name || nameFromFullName(repo.fullName),
    url: repo.url || artifactAudit.repo_url || "",
    trend_sources: trendSourcesForRepo(repo, source),
    stars: Number(repo.stars ?? artifactAudit.stargazers_count) || 0,
    forks: Number(repo.forks ?? artifactAudit.forks_count) || 0,
    stars_today: Number(repo.starsGained ?? repo.stars_today ?? repo.starsToday) || 0,
    language: repo.language || "",
    topics,
    description: repo.description || "",
    created_at: firstFound(artifactAudit.created_at, repo.createdAt, repo.created_at),
    updated_at: firstFound(artifactAudit.updated_at, repo.updatedAt, repo.updated_at, artifactAudit.pushed_at),
    license: firstFound(artifactAudit.license_spdx_id, repo.license),
    raw_readme: raw,
    readme_found: readmeFound,
    readme_fetch_failed: readmeFetchFailed,
    readme_empty: readmeEmpty,
    readme_length: raw.length,
    top_level_dirs: arrayValue(artifactAudit.top_level_dirs),
    key_files: arrayValue(artifactAudit.key_files),
    has_docs: hasDocs,
    has_examples: hasExamples,
    has_tests: boolAudit(artifactAudit.has_tests),
    has_install: hasInstall,
    has_docker: hasDocker,
    has_cli: hasCli,
    has_agents: hasAgents,
    has_mcp: hasMcp,
    has_skills: hasSkills,
    has_models: hasModels,
    has_demo: hasDemo,
    package_files: packageFiles,
    needs_enrichment: readmeFetchFailed || (!readmeFound && !raw),
    evidence_basis: evidenceBasis({ raw, artifactAudit, readmeFetchFailed, readmeFound }),
  };
}

async function fetchGitHubRawReadme(owner, name, {
  githubToken = process.env.GITHUB_TOKEN,
  userAgent = DEFAULT_USER_AGENT,
  maxChars = 14000,
} = {}) {
  const headers = {
    accept: "text/plain",
    "user-agent": userAgent,
  };
  if (githubToken) headers.authorization = `Bearer ${githubToken}`;

  for (const branch of README_BRANCHES) {
    for (const fileName of README_FILES) {
      const source = `${branch}/${fileName}`;
      const url = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${encodeURIComponent(branch)}/${fileName}`;
      try {
        const response = await fetch(url, { headers });
        if (response.status === 404) continue;
        if (!response.ok) {
          return { ok: false, source, status: response.status, readme_fetch_failed: true };
        }
        return {
          ok: true,
          source,
          status: response.status,
          content: (await response.text()).slice(0, maxChars),
        };
      } catch (error) {
        return { ok: false, source, error, readme_fetch_failed: true };
      }
    }
  }

  return { ok: false, source: "main/master", status: 404, notFound: true };
}

function hasAny(set, names) {
  return names.some((name) => set.has(name));
}

function packageFilesFromNames(lowerNames) {
  return {
    package_json: lowerNames.has("package.json"),
    pyproject_toml: lowerNames.has("pyproject.toml"),
    cargo_toml: lowerNames.has("cargo.toml"),
    requirements_txt: lowerNames.has("requirements.txt"),
    docker_compose_yml: lowerNames.has("docker-compose.yml") || lowerNames.has("docker-compose.yaml"),
    dockerfile: lowerNames.has("dockerfile"),
  };
}

function packageFilesFromAudit(audit = {}) {
  const packageFiles = audit.package_files && typeof audit.package_files === "object"
    ? audit.package_files
    : {};
  const packageNames = [
    ...arrayValue(audit.top_level_entries),
    ...arrayValue(audit.key_files),
  ].map((entry) => String(entry || "").toLowerCase());
  const fromNames = packageFilesFromNames(new Set(packageNames));
  return {
    ...emptyPackageFiles(),
    ...fromNames,
    ...packageFiles,
  };
}

function emptyPackageFiles() {
  return {
    package_json: false,
    pyproject_toml: false,
    cargo_toml: false,
    requirements_txt: false,
    docker_compose_yml: false,
    dockerfile: false,
  };
}

function boolAudit(value) {
  return value === true;
}

function arrayValue(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function firstFound(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "" && value !== NOT_FOUND) return value;
  }
  return "";
}

function trendSourcesForRepo(repo = {}, source = "") {
  return unique([
    ...(Array.isArray(repo.windows) ? repo.windows.map((window) => `github-trending:${window}`) : []),
    ...String(source || "").split("+").filter(Boolean),
  ]);
}

function evidenceBasis({ raw, artifactAudit, readmeFetchFailed, readmeFound }) {
  const basis = [];
  if (readmeFetchFailed) basis.push("readme_fetch_failed");
  if (readmeFound && raw) basis.push("readme");
  if (arrayValue(artifactAudit.top_level_dirs).length || arrayValue(artifactAudit.key_files).length) basis.push("tree");
  if (arrayValue(artifactAudit.topics).length) basis.push("topics");
  return basis.length ? basis : ["metadata_only"];
}

function ownerFromFullName(fullName) {
  return String(fullName || "").split("/")[0] || "";
}

function nameFromFullName(fullName) {
  return String(fullName || "").split("/")[1] || "";
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string") return value;
  }
  return "";
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
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    createdAt: repo.createdAt || repo.created_at || null,
    updatedAt: repo.updatedAt || repo.updated_at || null,
    license: repo.license || repo.license_spdx_id || null,
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
