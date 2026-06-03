import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBriefData } from "../../brief/build.mjs";
import { readBriefWikiDeepDivedProjectRepos } from "./sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_WIKI_ROOT = "brief-wiki";

export function isBriefWikiProjectPipeline(options = {}) {
  return Boolean(options.projectBriefWiki || options.briefWikiDaily || options.dailyDeepDive);
}

export function isProjectAlreadyDeepDived(candidate, options = {}) {
  const repo = candidate?.raw || candidate || {};
  const known = readBriefWikiDeepDivedProjectRepos(options.briefWikiContentDir || path.join(resolveWikiRoot(options), "content"));
  return matchesKnownRepo(repo, known);
}

export async function runProjectBriefWikiGuard({ options = {}, logger = console } = {}) {
  const lint = await runBriefLintGuard({ wikiRoot: wikiRoot(options), logger });
  const reviewer = await runReviewerLayerBGuard({ options, logger });
  return {
    verdict: "pass",
    lint,
    reviewer,
  };
}

export async function runBriefLintGuard({ wikiRoot: wikiRootInput = DEFAULT_WIKI_ROOT, logger = console } = {}) {
  const relativeWikiRoot = relativeToRoot(wikiRootInput);
  const result = await spawnProcess(process.execPath, ["scripts/brief/lint.mjs", relativeWikiRoot], { cwd: ROOT });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const summary = parseBriefLintSummary(output);

  if (summary.missingSummary) {
    const suffix = output.trim() ? `: ${lastLine(output)}` : "";
    throw new Error(`brief:lint summary not found${suffix}`);
  }

  if (summary.red > 0) {
    throw new Error(`brief:lint failed with RED ${summary.red} issue(s); brief mirror publish blocked`);
  }

  if (result.code !== 0) {
    const suffix = output.trim() ? `: ${lastLine(output)}` : "";
    throw new Error(`brief:lint exited ${result.code}${suffix}`);
  }

  logger?.info?.(`brief:lint passed RED ${summary.red}, YELLOW ${summary.yellow}, BLUE ${summary.blue}`);
  return {
    ...summary,
    code: result.code,
  };
}

export async function publishBriefMirror({ options = {}, logger = console } = {}) {
  const index = await buildBriefData(relativeToRoot(wikiRoot(options)));
  logger?.info?.(`brief:build refreshed ${Object.keys(index.outputs || {}).length} brief output(s)`);
  return index;
}

export async function runReviewerLayerBGuard() {
  // TODO(project-merge P4): add the reviewer/layer-B groundedness guard for brief-wiki project deep-dives.
  return {
    verdict: "skipped",
    reason: "reviewer layer-B is not wired yet",
  };
}

export function parseBriefLintSummary(output) {
  const match = String(output || "").match(/Summary:\s*RED\s+(\d+),\s*YELLOW\s+(\d+),\s*BLUE\s+(\d+)/i);
  if (!match) {
    return {
      red: 0,
      yellow: 0,
      blue: 0,
      missingSummary: true,
    };
  }
  return {
    red: Number(match[1]) || 0,
    yellow: Number(match[2]) || 0,
    blue: Number(match[3]) || 0,
    missingSummary: false,
  };
}

function spawnProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
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

function wikiRoot(options = {}) {
  return options.wikiRoot || DEFAULT_WIKI_ROOT;
}

function resolveWikiRoot(options = {}) {
  return path.resolve(ROOT, wikiRoot(options));
}

function relativeToRoot(value) {
  const resolved = path.resolve(ROOT, value || DEFAULT_WIKI_ROOT);
  return path.relative(ROOT, resolved) || ".";
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

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function lastLine(value) {
  const lines = String(value || "").trim().split(/\r?\n/).filter(Boolean);
  return lines[lines.length - 1] || "";
}
