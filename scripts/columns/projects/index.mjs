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
import { analyze as legacyAnalyze, evaluate, publicDeep } from "./evaluate.mjs";
import { collectEvidence, discover } from "./sources.mjs";
import { generateProjectDeepDive } from "./deepdive.mjs";
import { qaGate as legacyQaGate } from "./qa.mjs";
import {
  isBriefWikiProjectPipeline,
  isProjectAlreadyDeepDived,
  isProjectDeepDiveVerdict,
  publishBriefMirror,
  runProjectBriefWikiGuard,
} from "./brief-pipeline.mjs";

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
  const options = ctx.options || {};
  const briefWikiPipeline = isBriefWikiProjectPipeline(options);
  return defaultSelect(items, {
    threshold: briefWikiPipeline ? null : numberOption(options.worthThreshold, 60),
    topN: numberOption(options.cap, 6),
  });
}

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  if (!isBriefWikiProjectPipeline(options)) {
    return legacyAnalyze(item, evidence, ctx);
  }

  const candidate = item.candidate || item;
  const triage = item.eval || {};
  const repo = candidate?.raw || candidate || {};
  const repoId = repo.fullName || repo.url || candidate?.id || "unknown-project";

  if (!isProjectDeepDiveVerdict(triage.verdict)) {
    ctx.logger?.info?.(`projects brief-wiki skipped ${repoId}: verdict=${triage.verdict || "unknown"}`);
    return {
      tier: "brief-wiki",
      status: "skipped",
      reason: "verdict is not deep_dive or clone_and_run",
      candidateId: candidate?.id,
      repo: repoId,
      triage: summarizeTriage(triage),
    };
  }

  if (isProjectAlreadyDeepDived(candidate, options)) {
    ctx.logger?.info?.(`projects brief-wiki skipped ${repoId}: already deep-dived`);
    return {
      tier: "brief-wiki",
      status: "already_deep_dived",
      skipped: true,
      reason: "brief-wiki content already marks this repo as deep_dived",
      candidateId: candidate?.id,
      repo: repoId,
      triage: summarizeTriage(triage),
    };
  }

  const generated = await generateProjectDeepDive({
    candidate,
    evidence,
    triage,
    options,
    logger: ctx.logger || console,
  });
  const bookkeeping = recordBriefWikiBookkeeping({
    db: options.db,
    ctx,
    candidate,
    evidence,
    triage,
    generated,
    options,
  });

  return {
    tier: "brief-wiki",
    status: "generated",
    generated: true,
    candidateId: candidate?.id,
    repo: generated.repo || repoId,
    slug: generated.slug,
    paths: generated.paths,
    entitySlugs: generated.entitySlugs,
    offline: generated.offline,
    model: generated.model,
    triage: summarizeTriage(triage),
    bookkeeping,
  };
}

export async function qaGate(analysis, evidence, ctx = {}) {
  if (!isBriefWikiProjectPipeline(ctx.options || {})) {
    return legacyQaGate(analysis, evidence, ctx);
  }

  return {
    structuralPass: true,
    groundedScore: null,
    flags: analysis?.skipped
      ? [{ id: "brief-wiki-skip", message: analysis.reason || analysis.status || "skipped" }]
      : [],
    verdict: "pass",
    checks: [
      {
        id: "brief-wiki-layer-a",
        status: "deferred",
        label: "brief:lint runs once after all generated project entities",
      },
    ],
    grounded: {
      verdict: "skipped",
      groundedScore: null,
      flags: [],
    },
  };
}

export async function publish(_qaItems = [], ctx = {}) {
  const options = ctx.options || {};
  const db = options.db;
  if (!db) throw new Error("projects publish requires options.db");
  const briefWikiPipeline = isBriefWikiProjectPipeline(options);

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
  const generatedBriefWiki = briefWikiAnalyses(ctx.result?.analyses);
  const generatedBriefWikiRepos = new Set(generatedBriefWiki.map((item) => repoLabel(item.candidate, item.analysis).toLowerCase()));
  const archivedLightRepos = allRepos.filter((repo) => (
    !repo.deep &&
    (!briefWikiPipeline || !generatedBriefWikiRepos.has(String(repo.fullName || "").toLowerCase()))
  ));
  const deepDiveCount = briefWikiPipeline ? generatedBriefWiki.length : deepRepos.length;
  const generatedAt = nowIso(options);

  const agentFlow = buildAgentFlow("projects", {
    discover: `${enriched.length} repos from GitHub Trending plus topic/search supplements`,
    evidence: `${enriched.length} README + artifactAudit evidence records in SQLite`,
    rank: briefWikiPipeline
      ? `verdict-gated deep_dive/clone_and_run, cap ${numberOption(options.cap, 6)}`
      : `worthDeepDive threshold ${numberOption(options.worthThreshold, 60)}, cap ${numberOption(options.cap, 6)}`,
    review: briefWikiPipeline
      ? `${deepDiveCount} brief-wiki project deep dives, ${allRepos.length} light radar cards`
      : `${deepRepos.length} project deep dives, ${allRepos.length - deepRepos.length} light reads`,
    verify: briefWikiPipeline
      ? "BriefGuard layer-A brief:lint; reviewer layer-B TODO hook"
      : "projects qaGate + validate-trending + text encoding gate",
    publish: briefWikiPipeline
      ? "brief:build public/data/brief/*.json + public/data/trending.json"
      : "public/data/trending.json",
    archive: briefWikiPipeline
      ? "brief-wiki status:deep_dived + SQLite runs + data/agent-memory/projects.json"
      : "SQLite + data/agent-memory/projects.json",
  });

  const qualityGate = createQualityGate({
    surface: "projects",
    checks: [
      gateCheck("boards-present", "daily / weekly / monthly boards exist", WINDOWS.every((window) => boards[window]?.repos?.length > 0), `windows=${WINDOWS.join(",")}`),
      gateCheck("cards-have-tldr", "every project card has a TL;DR", allRepos.every((repo) => repo.tldr && repo.light), `${allRepos.length} repos checked`),
      gateCheck("worth-scores", "every project has a numeric worthDeepDive score", allRepos.every((repo) => Number.isFinite(repo.worthDeepDive)), `${allRepos.length} repos checked`),
      gateWarning("deep-dive-coverage", "at least one high-value project gets a deep dive", deepDiveCount > 0, `${deepDiveCount} deep dives selected`),
    ],
  });

  const briefWiki = briefWikiPipeline
    ? await publishBriefWikiMirror({ options, logger: ctx.logger })
    : null;

  const pipelineMemory = await rememberPipelineRun({
    surface: "projects",
    date: generatedAt.slice(0, 10),
    sourceFiles: {
      public: "public/data/trending.json",
      db: "data/ai-brief.db",
      ...(briefWikiPipeline ? { briefWiki: "brief-wiki", briefMirror: "public/data/brief" } : {}),
    },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(briefWikiPipeline ? generatedBriefWiki : deepRepos, (item) => ({
      id: briefWikiPipeline ? repoLabel(item.candidate, item.analysis) : item.fullName,
      title: briefWikiPipeline ? repoLabel(item.candidate, item.analysis) : item.fullName,
      score: briefWikiPipeline ? Number(item.eval?.worthDeepDive || item.eval?.score || 0) : item.worthDeepDive,
      reason: briefWikiPipeline ? `brief-wiki:${item.analysis?.slug || "generated"}` : item.tldr,
    })),
    archivedItems: summarizeSelection(archivedLightRepos.slice(0, 12), (repo) => ({
      id: repo.fullName,
      title: repo.fullName,
      score: repo.worthDeepDive,
      reason: "light read or below deep-dive threshold",
    })),
    highlights: [
      `Projects refreshed ${allRepos.length} repo cards.`,
      `${deepDiveCount} repos generated deep-dive output.`,
    ],
    nextActions: [
      briefWikiPipeline ? "Run npm run brief:lint before treating the brief mirror as clean." : "Run npm run validate before treating the refresh as published.",
      briefWikiPipeline ? "Point project deep cards to the brief-wiki mirror in the frontend." : "Spot-check Projects detail pages for the selected deep dives.",
    ],
    reusablePatterns: (briefWikiPipeline ? generatedBriefWiki : deepRepos).slice(0, 5).map((item) => ({
      text: briefWikiPipeline
        ? `${repoLabel(item.candidate, item.analysis)}: brief-wiki/${item.analysis?.slug || "generated"}`
        : `${item.fullName}: ${item.tldr}`,
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
    ...(briefWiki ? { briefWiki } : {}),
    agentFlow,
    qualityGate,
    daily: boards.daily,
    weekly: boards.weekly,
    monthly: boards.monthly,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  return { file: OUT_FILE, repoCount: allRepos.length, deepCount: deepDiveCount, briefWiki };
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
    .map((item, index) => repoForBoard(item, window, index + 1, options));

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

function repoForBoard(item, window, rank, options = {}) {
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
  if (light.project_type) out.project_type = light.project_type;
  if (light.verdict) out.verdict = light.verdict;
  if (light.ratings) out.ratings = light.ratings;
  if (light.rankingReason) out.rankingReason = publicRankingReason(light.rankingReason);
  if (!isBriefWikiProjectPipeline(options) && item.deep) out.deep = item.deep;
  return out;
}

async function publishBriefWikiMirror({ options = {}, logger = console } = {}) {
  const guard = await runProjectBriefWikiGuard({ options, logger });
  const build = await publishBriefMirror({ options, logger });
  return {
    guard,
    build: {
      wikiRoot: build.wikiRoot,
      namespace: build.namespace,
      outputs: build.outputs,
      summary: build.summary,
    },
  };
}

function briefWikiAnalyses(items = []) {
  return (items || []).filter((item) => item?.analysis?.tier === "brief-wiki" && item.analysis.generated);
}

function recordBriefWikiBookkeeping({ db, ctx = {}, candidate = {}, evidence = {}, triage = {}, generated = {}, options = {} } = {}) {
  if (!db) return null;

  const generatedAt = nowIso(options);
  const candidateId = candidate.id;
  const repo = generated.repo || candidate?.raw?.fullName || candidateId;
  const payload = {
    repo,
    slug: generated.slug,
    paths: generated.paths,
    entitySlugs: generated.entitySlugs,
    offline: generated.offline,
    triage: summarizeTriage(triage),
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
  };
  let analysisId = null;
  let runId = null;

  if (candidateId && typeof db.insertAnalysis === "function") {
    const row = db.insertAnalysis({
      candidateId,
      tier: "brief-wiki",
      payload,
      model: generated.model || "project-brief-wiki",
      generatedAt,
    });
    analysisId = row.id;
  }

  if (typeof db.recordRun === "function") {
    const row = db.recordRun({
      id: `${ctx.runId || "projects"}:${candidateId || repo}:brief-wiki`,
      column: "projects",
      stage: "deep-dive",
      status: "pass",
      metrics: {
        candidateId,
        repo,
        slug: generated.slug,
        offline: Boolean(generated.offline),
        model: generated.model || "project-brief-wiki",
      },
      ranAt: generatedAt,
    });
    runId = row.id;
  }

  return { analysisId, runId };
}

function summarizeTriage(triage = {}) {
  return {
    project_type: triage.project_type || null,
    verdict: triage.verdict || null,
    ratings: triage.ratings || null,
    worthDeepDive: Number(triage.worthDeepDive ?? triage.score ?? 0),
    reason: triage.reason || "",
  };
}

function repoLabel(candidate = {}, analysis = {}) {
  return analysis?.repo || candidate?.raw?.fullName || candidate?.id || "unknown-project";
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
