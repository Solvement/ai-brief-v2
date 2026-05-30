import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAgentFlow,
  createQualityGate,
  gateCheck,
  gateWarning,
  rememberPipelineRun,
  summarizeSelection,
} from "../../lib/agentic-pipeline.mjs";
import { projectDeepModel, projectLightModel } from "../../lib/llm.mjs";
import { defaultSelect } from "../../lib/pipeline-kernel.mjs";
import { analyze, evaluate, publicDeep } from "./evaluate.mjs";
import { collectEvidence, discover } from "./sources.mjs";
import { qaGate } from "./qa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT_FILE = path.join(ROOT, "public", "data", "trending.json");
const WINDOWS = ["daily", "weekly", "monthly"];

export const projectsColumnModule = {
  id: "projects",
  discover,
  collectEvidence,
  evaluate,
  select,
  analyze,
  qaGate,
  publish,
  archive,
};

export default projectsColumnModule;

export function select(items, ctx = {}) {
  return defaultSelect(items, {
    threshold: numberOption(ctx.options?.worthThreshold, 60),
    topN: numberOption(ctx.options?.cap, 6),
  });
}

export async function publish(_qaItems = [], ctx = {}) {
  const options = ctx.options || {};
  const db = options.db;
  if (!db) throw new Error("projects publish requires options.db");

  const failed = (ctx.result?.qa || []).filter((item) => item.qa?.verdict === "fail");
  if (failed.length) {
    throw new Error(`projects QA failed for ${failed.map((item) => item.candidate?.raw?.fullName || item.candidate?.id).join(", ")}`);
  }

  const currentIds = new Set((ctx.result?.evals || []).map((item) => item.candidate?.id).filter(Boolean));
  const candidateRows = currentIds.size
    ? [...currentIds].map((id) => db.getCandidate(id)).filter(Boolean)
    : db.listCandidates({ column: "projects", limit: numberOption(options.publishCandidateLimit, 500) });
  const enriched = candidateRows.map((candidate) => enrichFromDb(db, candidate)).filter((item) => item.light);
  const boards = Object.fromEntries(WINDOWS.map((window) => [window, makeBoard(window, enriched, options)]));
  const allRepos = WINDOWS.flatMap((window) => boards[window].repos);
  const deepRepos = allRepos.filter((repo) => repo.deep);
  const generatedAt = nowIso(options);

  const agentFlow = buildAgentFlow("projects", {
    discover: `${enriched.length} repos from GitHub Trending plus topic/search supplements`,
    evidence: `${enriched.length} README evidence records in SQLite`,
    rank: `worthDeepDive threshold ${numberOption(options.worthThreshold, 60)}, cap ${numberOption(options.cap, 6)}`,
    review: `${deepRepos.length} project deep dives, ${allRepos.length - deepRepos.length} light reads`,
    verify: "projects qaGate + validate-trending + text encoding gate",
    publish: "public/data/trending.json",
    archive: "SQLite + data/agent-memory/projects.json",
  });

  const qualityGate = createQualityGate({
    surface: "projects",
    checks: [
      gateCheck("boards-present", "daily / weekly / monthly boards exist", WINDOWS.every((window) => boards[window]?.repos?.length > 0), `windows=${WINDOWS.join(",")}`),
      gateCheck("cards-have-tldr", "every project card has a TL;DR", allRepos.every((repo) => repo.tldr && repo.light), `${allRepos.length} repos checked`),
      gateCheck("worth-scores", "every project has a numeric worthDeepDive score", allRepos.every((repo) => Number.isFinite(repo.worthDeepDive)), `${allRepos.length} repos checked`),
      gateWarning("deep-dive-coverage", "at least one high-value project gets a deep dive", deepRepos.length > 0, `${deepRepos.length} deep dives selected`),
    ],
  });

  const pipelineMemory = await rememberPipelineRun({
    surface: "projects",
    date: generatedAt.slice(0, 10),
    sourceFiles: {
      public: "public/data/trending.json",
      db: "data/ai-brief.db",
    },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(deepRepos, (repo) => ({
      id: repo.fullName,
      title: repo.fullName,
      score: repo.worthDeepDive,
      reason: repo.tldr,
    })),
    archivedItems: summarizeSelection(allRepos.filter((repo) => !repo.deep).slice(0, 12), (repo) => ({
      id: repo.fullName,
      title: repo.fullName,
      score: repo.worthDeepDive,
      reason: "light read or below deep-dive threshold",
    })),
    highlights: [
      `Projects refreshed ${allRepos.length} repo cards.`,
      `${deepRepos.length} repos passed the deep-dive threshold.`,
    ],
    nextActions: [
      "Run npm run validate before treating the refresh as published.",
      "Spot-check Projects detail pages for the selected deep dives.",
    ],
    reusablePatterns: deepRepos.slice(0, 5).map((repo) => ({
      text: `${repo.fullName}: ${repo.tldr}`,
      source: "projects",
    })),
  });

  const out = {
    generatedAt,
    analysisModels: {
      projectLight: projectLightModel(),
      projectDeep: projectDeepModel(),
    },
    pipelineRun: {
      id: pipelineMemory.run.id,
      memoryFile: "data/agent-memory/projects.json",
      statusFile: "public/data/pipeline-status.json",
    },
    agentFlow,
    qualityGate,
    daily: boards.daily,
    weekly: boards.weekly,
    monthly: boards.monthly,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  return { file: OUT_FILE, repoCount: allRepos.length, deepCount: deepRepos.length };
}

export async function archive(result, ctx = {}) {
  const db = ctx.options?.db;
  if (!db) return null;
  for (const stage of result.stages || []) {
    db.recordRun({
      id: `${result.runId}:${stage.stage}`,
      column: "projects",
      stage: stage.stage,
      status: stage.status,
      metrics: {
        count: stage.count,
        error: stage.error || null,
      },
      ranAt: stage.finishedAt || nowIso(ctx.options),
    });
  }
  return { stages: result.stages?.length || 0 };
}

function enrichFromDb(db, candidate) {
  const analyses = db.listAnalyses(candidate.id);
  const light = latestTier(analyses, "light")?.payload;
  const deepRow = latestTier(analyses, "deep");
  const qa = deepRow ? db.getQaVerdict(deepRow.id) : null;
  const deep = deepRow && (!qa || qa.verdict !== "fail") ? publicDeep(deepRow.payload) : null;
  return {
    candidate,
    repo: candidate.raw,
    eval: db.getEval(candidate.id),
    light,
    deep,
  };
}

function latestTier(analyses, tier) {
  return analyses.find((analysis) => analysis.tier === tier) || null;
}

function makeBoard(window, items, options = {}) {
  const generatedAt = nowIso(options);
  const repos = items
    .filter((item) => (item.repo.windows || []).includes(window))
    .sort((left, right) => sortForWindow(left, right, window))
    .map((item, index) => repoForBoard(item, window, index + 1));

  return {
    window,
    generatedAt,
    repos,
  };
}

function sortForWindow(left, right, window) {
  const leftRank = Number(left.repo.ranksByWindow?.[window] || left.repo.rank || 9999);
  const rightRank = Number(right.repo.ranksByWindow?.[window] || right.repo.rank || 9999);
  const leftSupplement = leftRank >= 1000;
  const rightSupplement = rightRank >= 1000;
  if (leftSupplement !== rightSupplement) return leftSupplement ? 1 : -1;
  if (!leftSupplement && leftRank !== rightRank) return leftRank - rightRank;
  return Number(right.light?.worthDeepDive || right.eval?.score || 0) - Number(left.light?.worthDeepDive || left.eval?.score || 0);
}

function repoForBoard(item, window, rank) {
  const repo = item.repo;
  const light = item.light || {};
  const out = {
    fullName: repo.fullName,
    owner: repo.owner,
    name: repo.name,
    url: repo.url,
    ownerAvatarUrl: repo.ownerAvatarUrl,
    description: repo.description,
    language: repo.language,
    languageColor: repo.languageColor,
    stars: Number(repo.stars) || 0,
    forks: Number(repo.forks) || 0,
    starsGained: Number(repo.starsGained) || 0,
    rank,
    tldr: String(light.tldr || repo.tldr || repo.description || repo.fullName),
    tags: Array.isArray(light.tags) ? light.tags : [],
    light: String(light.light || repo.light || repo.description || repo.fullName),
    worthDeepDive: Number(light.worthDeepDive ?? item.eval?.score ?? repo.worthDeepDive ?? 0),
  };
  if (light.rankingReason) out.rankingReason = publicRankingReason(light.rankingReason);
  if (item.deep) out.deep = item.deep;
  return out;
}

function publicRankingReason(value) {
  return {
    decision: ["boost", "cap-low-priority", "cap-non-core", "no-change"].includes(value.decision) ? value.decision : "no-change",
    rawScore: Number(value.rawScore) || 0,
    finalScore: Number(value.finalScore) || 0,
    matchedBoostTerms: Array.isArray(value.matchedBoostTerms) ? value.matchedBoostTerms : [],
    matchedCapTerms: Array.isArray(value.matchedCapTerms) ? value.matchedCapTerms : [],
    explanation: String(value.explanation || "feature-based project ranking"),
  };
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}
