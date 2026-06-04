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
import {
  analyze as legacyAnalyze,
  evaluate,
  generateProjectLightAnalysis,
  persistRadarEvaluation,
  publicDeep,
} from "./evaluate.mjs";
import { collectEvidence, discover } from "./sources.mjs";
import { generateProjectDeepDive } from "./deepdive.mjs";
import { qaGate as legacyQaGate } from "./qa.mjs";
import { applyDailyDepthTargets, isBriefDepth, isContentDepth } from "./project-ranking.mjs";
import { projectReviewModel } from "./review.mjs";
import {
  isBriefWikiProjectPipeline,
  isProjectAlreadyDeepDived,
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
  if (!briefWikiPipeline) {
    return defaultSelect(items, {
      threshold: numberOption(options.worthThreshold, 60),
      topN: null,
    });
  }

  const assigned = applyDailyDepthTargets(items, options);
  const assignedAt = nowIso(options);
  for (const item of assigned) {
    if (!item?.candidate?.id || !item.eval) continue;
    persistRadarEvaluation(options.db, item.candidate, item.eval, assignedAt, "deterministic-project-radar");
  }

  return assigned
    .filter((item) => isContentDepth(item.eval?.final_depth || item.eval?.depth_decision?.final_depth))
    .sort((left, right) => Number(right.eval?.ranking_score ?? right.eval?.score ?? 0) - Number(left.eval?.ranking_score ?? left.eval?.score ?? 0));
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
  const finalDepth = triage.final_depth || triage.depth_decision?.final_depth || "list_only";

  if (isProjectAlreadyDeepDived(candidate, options)) {
    ctx.logger?.info?.(`projects brief-wiki skipped ${repoId}: already deep-dived`);
    return {
      tier: "brief-wiki",
      status: "already_deep_dived",
      skipped: true,
      reason: "brief-wiki content already marks this repo as deep_dived",
      candidateId: candidate?.id,
      repo: repoId,
      slug: repo.briefSlug || null,
      final_depth: finalDepth,
      triage: summarizeTriage(triage),
    };
  }

  if (finalDepth === "light") {
    return generateProjectLightAnalysis({
      candidate,
      evidence,
      triage,
      options,
      logger: ctx.logger || console,
    });
  }

  if (options.skipBriefAuthoring || options.noProjectBriefAuthoring) {
    ctx.logger?.info?.(`projects brief-wiki skipped ${repoId}: brief authoring disabled`);
    return {
      tier: "brief-wiki",
      status: "brief_authoring_disabled",
      skipped: true,
      reason: "brief authoring disabled for cheap discovery/light publish verification",
      candidateId: candidate?.id,
      repo: repoId,
      final_depth: finalDepth,
      triage: summarizeTriage(triage),
    };
  }

  if (finalDepth === "deep" && options.codexDeepDiveAuthoring !== false) {
    ctx.logger?.info?.(`projects brief-wiki queued ${repoId}: deep authoring is handled by codex-deepdive pass`);
    return {
      tier: "brief-wiki",
      status: "pending_codex_authoring",
      skipped: true,
      generated: false,
      reason: "deep authoring is decoupled; run scripts/columns/projects/codex-deepdive.mjs",
      candidateId: candidate?.id,
      repo: repoId,
      final_depth: finalDepth,
      depth_decision: triage.depth_decision || null,
      triage: summarizeTriage(triage),
    };
  }

  if (!isBriefDepth(finalDepth)) {
    ctx.logger?.info?.(`projects brief-wiki skipped ${repoId}: final_depth=${finalDepth}`);
    return {
      tier: "brief-wiki",
      status: "skipped",
      reason: "final_depth is not analysis or deep",
      candidateId: candidate?.id,
      repo: repoId,
      final_depth: finalDepth,
      triage: summarizeTriage(triage),
    };
  }

  let generated;
  try {
    generated = await generateProjectDeepDive({
      candidate,
      evidence,
      triage,
      options,
      logger: ctx.logger || console,
    });
  } catch (error) {
    return fallbackAfterDeepDiveFailure({
      candidate,
      evidence,
      triage,
      options,
      ctx,
      repoId,
      error,
    });
  }

  if (generated?.skipped || !generated?.slug) {
    if (generated?.depth_decision) {
      persistRadarEvaluation(options.db, candidate, {
        ...triage,
        final_depth: generated.final_depth || finalDepth,
        depth_decision: generated.depth_decision,
        review_verdict: generated.review?.verdict || generated.depth_decision.review_verdict,
        review_issues: generated.review?.issues || generated.depth_decision.review_issues || [],
      }, nowIso(options), "project-review-depth-update");
    }
    return {
      tier: "brief-wiki",
      status: generated?.status || "skipped",
      skipped: true,
      reason: generated?.reason || "brief generation skipped",
      candidateId: candidate?.id,
      repo: generated?.repo || repoId,
      final_depth: generated?.final_depth || finalDepth,
      depth_decision: generated?.depth_decision || triage.depth_decision || null,
      review: generated?.review || null,
      triage: summarizeTriage(triage),
    };
  }

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
    final_depth: generated.final_depth || finalDepth,
    depth_decision: generated.depth_decision || triage.depth_decision || null,
    review: generated.review || null,
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
  const radar = makeRadar(enriched, options);
  const allRepos = radar.repos;
  const deepRepos = allRepos.filter((repo) => repo.final_depth === "deep" || repo.deep);
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
    evidence: `${enriched.length} README + artifactAudit + evidence_signals records in SQLite`,
    rank: briefWikiPipeline
      ? "canonical Tier 0/1/2/3 rank; Tier 3 has no count cap and is scarce only because the bar is high"
      : `worthDeepDive threshold ${numberOption(options.worthThreshold, 60)}`,
    review: briefWikiPipeline
      ? `${deepDiveCount} brief-wiki project analysis/deep briefs with separate reviewer pass, ${allRepos.length} radar cards`
      : `${deepRepos.length} project deep dives, ${allRepos.length - deepRepos.length} light reads`,
    verify: briefWikiPipeline
      ? "Reviewer LLM pass per analysis/deep brief; BriefGuard layer-A brief:lint after generation"
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
      gateCheck("depth-fields", "every project card has final_depth and ranking_score", allRepos.every((repo) => repo.final_depth && Number.isFinite(repo.ranking_score)), `${allRepos.length} repos checked`),
      gateWarning("daily-radar-target", "radar carries the daily target count", allRepos.length >= 25 && allRepos.length <= numberOption(options.radarLimit, 30), `${allRepos.length} radar repos`),
      gateWarning("deep-quality-gate", "deep count is quality-gate only, not quota-limited", true, `${allRepos.filter((repo) => repo.final_depth === "deep").length} deep candidates`),
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
      `Projects refreshed ${allRepos.length} radar repo cards.`,
      `${deepDiveCount} repos generated analysis/deep brief-wiki output.`,
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
      projectDeep: briefWikiPipeline ? "Tier 3: codex:gpt-5.5;model_reasoning_effort=high" : projectDeepModel(),
      projectReview: projectReviewModel(options),
    },
    pipelineRun: {
      id: pipelineMemory.run.id,
      memoryFile: "data/agent-memory/projects.json",
      statusFile: "public/data/pipeline-status.json",
    },
    ...(briefWiki ? { briefWiki } : {}),
    agentFlow,
    qualityGate,
    radar,
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
  const briefWikiRow = latestTier(analyses, "brief-wiki");
  const briefWiki = briefWikiRow?.payload || null;
  const reviewDecision = briefWiki?.depth_decision || null;
  const mergedLight = reviewDecision
    ? {
        ...(light || {}),
        depth_decision: {
          ...(light?.depth_decision || {}),
          ...reviewDecision,
        },
        final_depth: reviewDecision.final_depth || briefWiki.final_depth || light?.final_depth,
        review_verdict: reviewDecision.review_verdict || briefWiki.review?.verdict || light?.review_verdict,
        review_issues: reviewDecision.review_issues || briefWiki.review?.issues || light?.review_issues || [],
      }
    : light;
  const qa = deepRow ? db.getQaVerdict(deepRow.id) : null;
  const deep = deepRow && (!qa || qa.verdict !== "fail") ? publicDeep(deepRow.payload) : null;
  return {
    candidate,
    repo: candidate.raw,
    eval: db.getEval(candidate.id),
    light: mergedLight,
    deep,
    briefSlug: briefWiki?.slug || candidate.raw?.briefSlug || null,
    briefWiki,
  };
}

function latestTier(analyses, tier) {
  return analyses.find((analysis) => analysis.tier === tier) || null;
}

export function makeBoard(window, items, options = {}) {
  const generatedAt = nowIso(options);
  const nativeItems = items
    .filter((item) => (item.repo.windows || []).includes(window))
    .sort((left, right) => sortForWindow(left, right, window));
  const boardLimit = Number.isFinite(Number(options.boardLimit)) ? Number(options.boardLimit) : null;
  const boardItems = boardLimit == null ? nativeItems : nativeItems.slice(0, boardLimit);
  const repos = boardItems
    .map((item, index) => repoForBoard(item, window, index + 1, options));

  return {
    window,
    generatedAt,
    target: repos.length,
    repos,
  };
}

function makeRadar(items, options = {}) {
  const generatedAt = nowIso(options);
  const limit = numberOption(options.radarLimit, 30);
  const repos = [...items]
    .sort((left, right) => Number(right.light?.ranking_score ?? right.light?.worthDeepDive ?? right.eval?.score ?? 0) - Number(left.light?.ranking_score ?? left.light?.worthDeepDive ?? left.eval?.score ?? 0))
    .slice(0, limit)
    .map((item, index) => repoForBoard(item, "radar", index + 1, options));

  return {
    window: "radar",
    generatedAt,
    target: limit,
    repos,
    depthCounts: depthCounts(repos),
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

function depthCounts(repos = []) {
  return repos.reduce((counts, repo) => {
    const depth = repo.final_depth || "list_only";
    counts[depth] = (counts[depth] || 0) + 1;
    return counts;
  }, {});
}

function repoForBoard(item, window, rank, options = {}) {
  const repo = item.repo;
  const light = item.light || {};
  const depthDecision = light.depth_decision || {};
  const finalDepth = light.final_depth || depthDecision.final_depth || "list_only";
  const rankingScore = Number(light.ranking_score ?? light.worthDeepDive ?? item.eval?.score ?? repo.worthDeepDive ?? 0);
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
    worthDeepDive: Number(light.worthDeepDive ?? rankingScore),
    ranking_score: rankingScore,
    max_allowed_depth: light.max_allowed_depth || depthDecision.max_allowed_depth || "list_only",
    final_depth: finalDepth,
    project_tier: Number(light.project_tier ?? depthDecision.project_tier ?? projectTierForDepth(finalDepth)),
    project_tier_label: light.project_tier_label || depthDecision.project_tier_label || `Tier ${projectTierForDepth(finalDepth)}`,
    project_bucket: light.project_bucket || light.bucket || depthDecision.project_bucket || depthDecision.bucket || "无关类",
    bucket: light.project_bucket || light.bucket || depthDecision.project_bucket || depthDecision.bucket || "无关类",
    tier_tag: light.tier_tag || `[Tier ${Number(light.project_tier ?? depthDecision.project_tier ?? projectTierForDepth(finalDepth))}｜${light.project_bucket || light.bucket || depthDecision.project_bucket || depthDecision.bucket || "无关类"}]`,
    model_tier: light.model_tier || depthDecision.model_tier || modelForProjectTier(light.project_tier ?? depthDecision.project_tier ?? projectTierForDepth(finalDepth)),
    requires_manual_confirmation: Boolean(light.requires_manual_confirmation || depthDecision.requires_manual_confirmation || projectTierForDepth(finalDepth) === 3),
    tier_template: light.tier_template || null,
    recommended_action: light.recommended_action || depthDecision.recommended_action || "monitor",
    needs_enrichment: Boolean(light.needs_enrichment || depthDecision.needs_enrichment),
    ranking_reasons: Array.isArray(light.ranking_reasons) ? light.ranking_reasons : [],
    rejection_reasons: Array.isArray(light.rejection_reasons) ? light.rejection_reasons : [],
    review_verdict: light.review_verdict || depthDecision.review_verdict || "not_applicable",
    review_issues: Array.isArray(light.review_issues) ? light.review_issues : depthDecision.review_issues || [],
    evidence_summary: light.evidence_summary || depthDecision.evidence_summary || null,
    depth_decision: publicDepthDecision(light),
  };
  if (light.project_type) out.project_type = light.project_type;
  if (light.verdict) out.verdict = light.verdict;
  if (light.ratings) out.ratings = light.ratings;
  if (light.rankingReason) out.rankingReason = publicRankingReason(light.rankingReason);
  if (item.briefSlug) out.briefSlug = item.briefSlug;
  if (item.briefSlug) out.brief_slug = item.briefSlug;
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
    final_depth: generated.final_depth || triage.final_depth || triage.depth_decision?.final_depth || null,
    depth_decision: generated.depth_decision || triage.depth_decision || null,
    review: generated.review || null,
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
        finalDepth: generated.final_depth || null,
        reviewVerdict: generated.review?.verdict || null,
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
    ranking_score: Number(triage.ranking_score ?? triage.score ?? 0),
    max_allowed_depth: triage.max_allowed_depth || triage.depth_decision?.max_allowed_depth || null,
    final_depth: triage.final_depth || triage.depth_decision?.final_depth || null,
    recommended_action: triage.recommended_action || triage.depth_decision?.recommended_action || null,
    needs_enrichment: Boolean(triage.needs_enrichment || triage.depth_decision?.needs_enrichment),
    reason: triage.reason || "",
  };
}

function repoLabel(candidate = {}, analysis = {}) {
  return analysis?.repo || candidate?.raw?.fullName || candidate?.id || "unknown-project";
}

function publicRankingReason(value) {
  return {
    decision: ["boost", "cap-low-priority", "cap-non-core", "no-change", "deterministic", "gated"].includes(value.decision) ? value.decision : "no-change",
    rawScore: Number(value.rawScore) || 0,
    finalScore: Number(value.finalScore) || 0,
    matchedBoostTerms: Array.isArray(value.matchedBoostTerms) ? value.matchedBoostTerms : [],
    matchedCapTerms: Array.isArray(value.matchedCapTerms) ? value.matchedCapTerms : [],
    explanation: String(value.explanation || "feature-based project ranking"),
  };
}

function publicDepthDecision(light = {}) {
  const decision = light.depth_decision || {};
  return {
    ranking_score: Number(light.ranking_score ?? decision.ranking_score ?? light.worthDeepDive ?? 0),
    max_allowed_depth: light.max_allowed_depth || decision.max_allowed_depth || "list_only",
    final_depth: light.final_depth || decision.final_depth || "list_only",
    ranking_reasons: Array.isArray(light.ranking_reasons) ? light.ranking_reasons : decision.ranking_reasons || [],
    rejection_reasons: Array.isArray(light.rejection_reasons) ? light.rejection_reasons : decision.rejection_reasons || [],
    recommended_action: light.recommended_action || decision.recommended_action || "monitor",
    needs_enrichment: Boolean(light.needs_enrichment || decision.needs_enrichment),
    review_verdict: light.review_verdict || decision.review_verdict || "not_applicable",
    review_issues: Array.isArray(light.review_issues) ? light.review_issues : decision.review_issues || [],
    evidence_summary: light.evidence_summary || decision.evidence_summary || null,
  };
}

function projectTierForDepth(depth) {
  if (depth === "deep") return 3;
  if (depth === "analysis") return 2;
  if (depth === "light") return 1;
  return 0;
}

function modelForProjectTier(tier) {
  if (Number(tier) === 3) return "codex:gpt-5.5;model_reasoning_effort=high";
  if (Number(tier) === 2) return "deepseek-or-light-codex";
  if (Number(tier) === 1) return "cheap-extraction";
  return "none";
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function fallbackAfterDeepDiveFailure({
  candidate = {},
  evidence = {},
  triage = {},
  options = {},
  ctx = {},
  repoId = "unknown-project",
  error,
} = {}) {
  const message = error?.message || String(error);
  ctx.logger?.warn?.(`projects brief-wiki deep-dive failed ${repoId}: ${message}`);

  const fallbackTriage = deepDiveFailureTriage(triage, message);
  persistRadarEvaluation(options.db, candidate, fallbackTriage, nowIso(options), "project-deep-dive-fallback");

  return {
    tier: "brief-wiki",
    status: "needs_enrichment",
    skipped: true,
    generated: false,
    fallback_tier: "light",
    reason: `deep_dive_failed: ${message}`,
    error: message,
    candidateId: candidate?.id,
    repo: repoId,
    final_depth: fallbackTriage.final_depth,
    depth_decision: fallbackTriage.depth_decision,
    review: {
      verdict: "not_run",
      issues: ["deep_dive_generation_failed"],
      rationale: message,
    },
    triage: summarizeTriage(fallbackTriage),
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
  };
}

function deepDiveFailureTriage(triage = {}, message = "") {
  const decision = triage.depth_decision || {};
  const score = Number(triage.ranking_score ?? decision.ranking_score ?? triage.score ?? triage.worthDeepDive ?? 0);
  const rejectionReasons = unique([
    ...asArray(decision.rejection_reasons),
    ...asArray(triage.rejection_reasons),
    "deep_dive_generation_failed",
  ]);
  const reviewIssues = unique([
    ...asArray(decision.review_issues),
    ...asArray(triage.review_issues),
    "deep_dive_generation_failed",
  ]);
  const depthDecision = {
    ...decision,
    ranking_score: score,
    max_allowed_depth: decision.max_allowed_depth || triage.max_allowed_depth || "deep",
    final_depth: "needs_enrichment",
    ranking_reasons: asArray(decision.ranking_reasons || triage.ranking_reasons),
    rejection_reasons: rejectionReasons,
    recommended_action: "monitor",
    needs_enrichment: true,
    review_verdict: "not_applicable",
    review_issues: reviewIssues,
  };

  return {
    ...triage,
    decision: "needs_enrichment",
    mode: triage.mode || "deterministic-radar",
    score,
    worthDeepDive: Number(triage.worthDeepDive ?? score),
    ranking_score: score,
    reason: `deep_dive_failed: ${message}`,
    signals: unique([
      ...asArray(triage.signals),
      "final_depth:needs_enrichment",
      "deep_dive_generation_failed",
    ]),
    verdict: "skip",
    final_depth: "needs_enrichment",
    max_allowed_depth: depthDecision.max_allowed_depth,
    recommended_action: "monitor",
    needs_enrichment: true,
    rejection_reasons: rejectionReasons,
    review_verdict: "not_applicable",
    review_issues: reviewIssues,
    depth_decision: depthDecision,
  };
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
