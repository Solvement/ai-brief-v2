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
import { analyze } from "./analyze.mjs";
import { evaluate, select } from "./evaluate.mjs";
import { qaGate } from "./qa.mjs";
import { collectEvidence, discover } from "./sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ARTICLES_FILE = path.join(ROOT, "public", "data", "articles.json");
const RADAR_FILE = path.join(ROOT, "public", "data", "paper-radar.json");
const ALLOWED_RADAR_DECISIONS = new Set(["ignore", "skim", "read", "review", "deep_dive", "implement"]);

export const papersColumnModule = {
  id: "papers",
  discover,
  collectEvidence,
  evaluate,
  select,
  analyze,
  qaGate,
  publish,
  archive,
};

export default papersColumnModule;

export async function publish(qaItems = [], ctx = {}) {
  const options = ctx.options || {};
  const db = options.db;
  if (!db) throw new Error("papers publish requires options.db");

  const generatedAt = nowIso(options);
  const candidateRows = currentCandidateRows(db, ctx, options);
  const currentQa = qaByCandidate(qaItems.length ? qaItems : ctx.result?.qa || []);
  const enriched = candidateRows
    .map((candidate) => enrichFromDb(db, candidate, currentQa))
    .filter((item) => item.analysis);
  const failed = enriched.filter((item) => item.qa?.verdict === "fail");
  const publishable = enriched
    .filter((item) => item.qa?.verdict !== "fail")
    .sort(sortForPublish);
  const papers = publishable.map((item) => publicAnalysis(item.analysis));

  const agentFlow = buildAgentFlow("papers", {
    discover: `${candidateRows.length} paper candidate(s) from the papers kernel`,
    evidence: `${enriched.length} analyzed candidate(s) with paper-text evidence`,
    rank: `${publishable.length} current analysis item(s) available after QA filtering`,
    review: `${papers.length} section-mirroring academic analysis item(s)`,
    verify: `${failed.length} QA failure(s) excluded before publish`,
    publish: "public/data/articles.json and public/data/paper-radar.json",
    archive: "SQLite runs table",
  });

  const qualityGate = createQualityGate({
    surface: "papers",
    checks: [
      gateCheck("papers-present", "articles.json contains at least one paper", papers.length > 0, `${papers.length} paper(s)`),
      gateCheck("section-shape", "every paper has section summaries", papers.every((paper) => Array.isArray(paper.sections) && paper.sections.length > 0), `${papers.length} paper(s) checked`),
      gateCheck("qa-fail-excluded", "QA fail verdicts are not published", !publishable.some((item) => item.qa?.verdict === "fail"), `${failed.length} failed item(s) excluded`),
      gateWarning("qa-warnings", "published papers have no QA warnings", publishable.every((item) => item.qa?.verdict !== "warn"), `${publishable.filter((item) => item.qa?.verdict === "warn").length} warning(s)`),
    ],
  });

  const pipelineRun = await pipelineRunRef({
    ctx,
    options,
    generatedAt,
    agentFlow,
    qualityGate,
    publishable,
    failed,
  });

  const articles = {
    generatedAt,
    papers,
    pipelineRun,
    agentFlow,
    qualityGate,
  };

  await writeJson(ARTICLES_FILE, articles);
  await publishRadarForFrontend(
    buildDailyRadarData({ publishable, agentFlow, qualityGate, pipelineRun, generatedAt }),
    buildTriageData({ publishable, failed }),
  );

  return {
    file: ARTICLES_FILE,
    radarFile: RADAR_FILE,
    paperCount: papers.length,
    excludedQaFailCount: failed.length,
  };
}

export async function archive(result, ctx = {}) {
  const db = ctx.options?.db;
  if (!db) return null;
  for (const stage of result.stages || []) {
    db.recordRun({
      id: `${result.runId}:${stage.stage}`,
      column: "papers",
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

function currentCandidateRows(db, ctx, options = {}) {
  const ids = currentCandidateIds(ctx.result);
  if (ids.size) return [...ids].map((id) => db.getCandidate(id)).filter((candidate) => candidate?.column === "papers");
  return db.listCandidates({ column: "papers", limit: numberOption(options.publishCandidateLimit, 500) });
}

function currentCandidateIds(result = {}) {
  const ids = new Set();
  for (const collection of [result.analyses, result.qa, result.selected, result.evals, result.evidence]) {
    for (const item of collection || []) {
      const id = item?.candidate?.id || item?.candidateId || item?.eval?.candidateId || item?.analysis?.id;
      if (id) ids.add(id);
    }
  }
  return ids;
}

function enrichFromDb(db, candidate, currentQa) {
  const analyses = db.listAnalyses(candidate.id);
  const deepRow = latestTier(analyses, "deep");
  const lightRow = latestTier(analyses, "light");
  const qa = currentQa.get(candidate.id) || (deepRow ? db.getQaVerdict(deepRow.id) : null);
  return {
    candidate,
    eval: db.getEval(candidate.id),
    light: lightRow?.payload || null,
    analysisRow: deepRow,
    analysis: deepRow?.payload || null,
    qa,
  };
}

function latestTier(analyses, tier) {
  return analyses.find((analysis) => analysis.tier === tier) || null;
}

function qaByCandidate(items) {
  const map = new Map();
  for (const item of items || []) {
    const candidateId = item?.candidate?.id || item?.candidateId || item?.eval?.candidateId;
    if (candidateId && item?.qa) map.set(candidateId, item.qa);
  }
  return map;
}

function sortForPublish(left, right) {
  const leftScore = Number(left.eval?.score ?? left.light?.triage?.total_score ?? 0);
  const rightScore = Number(right.eval?.score ?? right.light?.triage?.total_score ?? 0);
  if (rightScore !== leftScore) return rightScore - leftScore;
  return Date.parse(right.analysisRow?.generatedAt || "") - Date.parse(left.analysisRow?.generatedAt || "");
}

function publicAnalysis(analysis) {
  const out = JSON.parse(JSON.stringify(analysis));
  for (const key of Object.keys(out)) {
    if (key.startsWith("_")) delete out[key];
  }
  return out;
}

async function pipelineRunRef({ ctx, options, generatedAt, agentFlow, qualityGate, publishable, failed }) {
  if (options.dryRun) {
    return {
      id: ctx.runId || `papers-${generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`,
      memoryFile: "data/agent-memory/papers.json",
      statusFile: "public/data/pipeline-status.json",
    };
  }

  const pipelineMemory = await rememberPipelineRun({
    surface: "papers",
    date: generatedAt.slice(0, 10),
    sourceFiles: {
      articles: "public/data/articles.json",
      radar: "public/data/paper-radar.json",
      db: "data/ai-brief.db",
    },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(publishable, (item) => ({
      id: item.analysis?.id || item.candidate.id,
      title: item.analysis?.title || item.candidate.raw?.title || item.candidate.id,
      score: Number(item.eval?.score ?? item.light?.triage?.total_score ?? 0),
      reason: item.analysis?.leadJudgment || item.eval?.reason || "published paper analysis",
    })),
    archivedItems: summarizeSelection(failed, (item) => ({
      id: item.analysis?.id || item.candidate.id,
      title: item.analysis?.title || item.candidate.raw?.title || item.candidate.id,
      score: Number(item.eval?.score ?? item.light?.triage?.total_score ?? 0),
      reason: "QA verdict failed",
    })),
    highlights: [
      `Papers published ${publishable.length} article analysis item(s).`,
      `${failed.length} QA failure(s) were excluded.`,
    ],
    nextActions: [
      "Run node scripts/validate-articles.mjs before treating articles.json as stable.",
      "Run node scripts/validate-papers-radar.mjs after publishing radar data.",
    ],
    reusablePatterns: publishable.slice(0, 5).map((item) => ({
      text: `${item.analysis?.title || item.candidate.id}: ${item.analysis?.leadJudgment || item.eval?.reason || "paper analysis"}`,
      source: "papers",
    })),
  });

  return {
    id: pipelineMemory.run.id,
    memoryFile: "data/agent-memory/papers.json",
    statusFile: "public/data/pipeline-status.json",
  };
}

function buildDailyRadarData({ publishable, agentFlow, qualityGate, pipelineRun, generatedAt }) {
  const date = generatedAt.slice(0, 10);
  const radarItems = publishable.map(radarItem).sort((left, right) => Number(right.triage?.total_score || 0) - Number(left.triage?.total_score || 0));
  const mustRead = radarItems[0] || null;
  const skim = radarItems.slice(1, 4);
  const first = publishable[0] || null;
  const narrative = radarNarrative(first);
  return {
    schemaVersion: 3,
    date,
    generatedAt,
    one_must_read_paper: mustRead ? summarizePaper(mustRead, "must_read") : null,
    three_skim_papers: skim.map((item) => summarizePaper(item, "skim")),
    one_professor_lesson: narrative.professorLesson,
    one_good_idea_to_steal: narrative.goodIdeaToSteal,
    one_bad_idea_or_risk: narrative.badIdeaOrRisk,
    one_transferable_pattern: narrative.transferablePattern,
    one_future_work_application: narrative.futureWorkApplication,
    one_architecture_takeaway: narrative.architectureTakeaway,
    one_interview_talking_point: narrative.interviewTalkingPoint,
    one_project_idea: narrative.projectIdea,
    agent_flow: agentFlow,
    quality_gate: qualityGate,
    pipelineRun,
  };
}

function buildTriageData({ publishable, failed }) {
  const items = publishable.map(radarItem).sort((left, right) => Number(right.triage?.total_score || 0) - Number(left.triage?.total_score || 0));
  return {
    top: items.slice(0, 10),
    items: [
      ...items,
      ...failed.map((item) => ({
        ...radarItem(item),
        triage: {
          ...normalizeRadarTriage(item),
          selection_status: "rejected",
          rejection_reason: "QA verdict failed",
        },
      })),
    ],
    triageSummary: {
      candidateCount: publishable.length + failed.length,
      selectedCount: publishable.length,
      rejectedCount: failed.length,
      cutoffScore: items.length ? Number(items[items.length - 1].triage?.total_score || 0) : null,
    },
  };
}

async function publishRadarForFrontend(dailyData, triageData) {
  const top = triageData.top || [];
  const items = triageData.items || top;
  const out = {
    schemaVersion: 2,
    date: dailyData.date,
    generatedAt: dailyData.generatedAt || new Date().toISOString(),
    sourceFiles: {
      daily: `data/papers/daily-${dailyData.date}.json`,
      triage: `data/papers/triage-${dailyData.date}.json`,
    },
    pipelineRun: dailyData.pipelineRun || null,
    qualityGate: dailyData.quality_gate || null,
    runTrace: dailyData.run_trace || null,
    reflection: dailyData.reflection || null,
    memoryVersion: 1,
    triageSummary: triageData.triageSummary || null,
    agentFlow: dailyData.agent_flow || [],
    mustRead: dailyData.one_must_read_paper,
    skim: dailyData.three_skim_papers,
    professorLesson: dailyData.one_professor_lesson,
    goodIdeaToSteal: dailyData.one_good_idea_to_steal,
    badIdeaOrRisk: dailyData.one_bad_idea_or_risk,
    transferablePattern: dailyData.one_transferable_pattern,
    futureWorkApplication: dailyData.one_future_work_application,
    architectureTakeaway: dailyData.one_architecture_takeaway,
    interviewTalkingPoint: dailyData.one_interview_talking_point,
    projectIdea: dailyData.one_project_idea,
    topPapers: top.map((item) => summarizePaper(item, item.id === dailyData.one_must_read_paper?.id ? "must_read" : "skim")),
    selectionTrace: items.slice(0, 24).map((item) => ({
      id: item.id,
      title: item.title,
      score: item.triage?.total_score,
      decision: item.triage?.decision,
      status: item.triage?.selection_status,
      reason: item.triage?.selected_reason || item.triage?.rejection_reason || item.triage?.reason || "",
      aheSignals: item.triage?.matched_ahe_signals || [],
      freshness: item.triage?.freshness_signal || "",
      hotness: item.triage?.hotness_signal || "",
    })),
  };
  await writeJson(RADAR_FILE, out);
}

function summarizePaper(item, dailyAction) {
  return {
    id: item.id,
    title: item.title,
    daily_action: dailyAction,
    triage_decision: item.triage?.decision,
    total_score: item.triage?.total_score,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    matched_topics: item.triage?.matched_topics || item.focusTopics || [],
    freshness_signal: item.triage?.freshness_signal,
    hotness_signal: item.triage?.hotness_signal,
    reason: item.triage?.model_reason || item.triage?.deterministic_reason || item.triage?.reason || "",
  };
}

function radarItem(item) {
  const analysis = item.analysis || {};
  const raw = item.candidate?.raw || {};
  return {
    id: cleanString(analysis.id || raw.id || item.candidate?.id),
    title: cleanString(analysis.title || raw.title || item.candidate?.id),
    sourceName: cleanString(analysis.sourceName || raw.sourceName || raw.source || "papers"),
    sourceUrl: cleanString(analysis.sourceUrl || raw.sourceUrl || raw.paperUrl),
    focusTopics: normalizeArray(analysis.selection?.track || raw.focusTopics || item.eval?.selection?.track),
    triage: normalizeRadarTriage(item),
  };
}

function normalizeRadarTriage(item) {
  const analysis = item.analysis || {};
  const raw = item.candidate?.raw || {};
  const triage = item.light?.triage || {};
  const score = clampScore(triage.total_score ?? triage.score ?? item.eval?.score ?? 0);
  const matchedTopics = normalizeArray(triage.matched_topics || analysis.selection?.track || item.eval?.selection?.track || raw.focusTopics);
  const decision = normalizeRadarDecision(triage.decision) || decisionFromScore(score);
  const reason = cleanString(triage.reason || triage.deterministic_reason || item.eval?.reason || analysis.leadJudgment || "kernel paper selection");
  return {
    ...triage,
    decision,
    total_score: score,
    matched_topics: matchedTopics.length ? matchedTopics : ["papers"],
    source_quality: clampScore(triage.source_quality ?? score),
    freshness_signal: cleanString(triage.freshness_signal || freshnessSignal(raw)),
    hotness_signal: cleanString(triage.hotness_signal || "kernel_selection"),
    deterministic_reason: cleanString(triage.deterministic_reason || reason),
    reason,
    selection_status: item.qa?.verdict === "fail" ? "rejected" : "selected",
    selected_reason: item.qa?.verdict === "fail" ? "" : reason,
    rejection_reason: item.qa?.verdict === "fail" ? "QA verdict failed" : "",
  };
}

function radarNarrative(item) {
  const analysis = item?.analysis || {};
  const section = Array.isArray(analysis.sections) ? analysis.sections[0] || {} : {};
  const selection = analysis.selection || {};
  return {
    professorLesson: cleanString(analysis.leadJudgment || "The paper needs to be read through its own section structure, not as a verdict card."),
    goodIdeaToSteal: cleanString(section.loadBearing || section.summary || "Use the paper's own headings as the reading map before adding interpretation."),
    badIdeaOrRisk: cleanString(analysis.limitsAndFuture?.evidenceNotes || "Keep evidence boundaries visible and avoid adding facts outside collected paper text."),
    transferablePattern: cleanString(section.evidence || "Separate discovery, evidence, ranking, analysis, and QA so paper selection remains auditable."),
    futureWorkApplication: cleanString(analysis.limitsAndFuture?.paperStated || "Track future work from the paper separately from external commentary."),
    architectureTakeaway: cleanString(section.evidence || section.summary || "A paper analysis should expose the claim, the supporting evidence, and the boundary."),
    interviewTalkingPoint: cleanString(selection.ideaSignal || "Explain why this paper entered the feed using convergence, track fit, and idea signal."),
    projectIdea: cleanString(`Build a grounded checklist from ${analysis.title || "the selected paper"} and test it against one agent workflow.`),
  };
}

function normalizeRadarDecision(value) {
  const decision = cleanString(value);
  return ALLOWED_RADAR_DECISIONS.has(decision) ? decision : null;
}

function decisionFromScore(score) {
  if (score >= 84) return "deep_dive";
  if (score >= 74) return "review";
  if (score >= 64) return "read";
  if (score >= 46) return "skim";
  return "ignore";
}

function freshnessSignal(raw = {}) {
  const parsed = Date.parse(raw.updatedAt || raw.publishedAt || raw.discoveredAt || "");
  if (!Number.isFinite(parsed)) return "unknown";
  const days = Math.max(0, (Date.now() - parsed) / 86400000);
  if (days <= 14) return "new";
  if (days <= 90) return "recent";
  return "archive";
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeArray(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).map(cleanString).filter(Boolean);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}
