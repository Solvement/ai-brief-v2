import { createDeepSeekClient, projectDeepModel, projectLightModel } from "../../lib/llm.mjs";
import { deepSystem, deepUser, LIGHT_SYS, lightUser } from "./prompts.mjs";
import {
  decideProjectDepth,
  evidenceSummary,
  isBriefDepth,
  normalizeEvidenceSignals,
  scoreProject,
} from "./project-ranking.mjs";

const INTENTS = new Set(["understanding", "teaching", "tool"]);
const PROJECT_TYPES = new Set(["ai_app", "agent_framework", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
const AI_RE = /\b(ai|agent|agents|rag|retrieval|mcp|a2a|memory|llm|multimodal|model|eval|benchmark|embedding|vector|prompt|tool use|function calling|coding agent|generative)\b/i;
const TOOL_RE = /\b(cli|sdk|api|server|plugin|app|framework|library|package|install|usage|quickstart|deploy|docker|npm|pip|run|command|configure|integration|workflow)\b/i;
const TEACHING_RE = /\b(course|lesson|tutorial|workshop|curriculum|exercise|notebook|learn|learning|roadmap|class|chapter|hands-on|awesome|resource list)\b/i;
const UNDERSTANDING_RE = /\b(understand|understanding|explain|explaining|visual|graph|map|architecture|concept|internals|deep dive|guide|notes|analysis|codebase)\b/i;
const COMMAND_RE = /^\s*(?:npm|pnpm|yarn|npx|pip|uv|python|node|docker|git|go|cargo|bun|deno|curl|wget|claude|codex)\b/i;

export async function evaluate(candidate, evidence, ctx = {}) {
  const options = ctx.options || {};
  const repo = candidate.raw || candidate;
  const evidence_signals = evidenceSignalsFrom(repo, evidence);
  const ranking = scoreProject(evidence_signals);
  const depth_decision = decideProjectDepth({ ranking, evidence_signals });
  const evaluatedAt = nowIso(options);
  const result = evaluationFromDecision({ candidate, repo, evidence, evidence_signals, ranking, depth_decision, evaluatedAt });

  persistRadarEvaluation(options.db, candidate, result, evaluatedAt, "deterministic-project-radar");
  return result;
}

export async function generateProjectLightAnalysis({ candidate, evidence, triage, options = {}, logger = console } = {}) {
  const repo = candidate?.raw || candidate || {};
  const finalDepth = triage?.final_depth || triage?.depth_decision?.final_depth;
  if (finalDepth !== "light") {
    return skippedAnalysis("light", "final_depth is not light", { candidate, triage, options });
  }

  const offline = isOffline(options);
  if (offline && !options.lightPayload) {
    return skippedAnalysis("light", "offline_no_llm", { candidate, triage, options });
  }

  const model = options.projectLightModel || projectLightModel();
  let payload = options.lightPayload || null;

  if (!payload) {
    try {
      const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger }).chatJson;
      payload = await chatJson({
        system: LIGHT_SYS,
        user: lightUser(repo, evidence, triage),
        model,
        maxTokens: options.lightMaxTokens || Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 1200,
      });
    } catch (error) {
      logger?.warn?.(`project light analysis failed ${repo.fullName || repo.name || candidate?.id}: ${error.message}`);
      return skippedAnalysis("light", "llm_failed", { candidate, triage, options, error });
    }
  }

  const normalized = normalizeLightResult(payload, repo, evidence, triage);
  const generatedAt = nowIso(options);
  const merged = {
    ...radarCardPayload(triage),
    ...normalized,
    final_depth: "light",
    generated_by: "PROJECT_LIGHT_MODEL",
  };

  let analysisId = null;
  if (options.db) {
    const row = options.db.insertAnalysis({
      candidateId: candidate.id,
      tier: "light",
      payload: merged,
      model,
      generatedAt,
    });
    analysisId = row.id;
  }

  return {
    tier: "light",
    status: "generated",
    generated: true,
    candidateId: candidate?.id,
    repo: repo.fullName || repo.name || "",
    model,
    payload: merged,
    _analysisId: analysisId,
  };
}

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  const candidate = item.candidate || item;
  const repo = candidate?.raw || candidate || {};
  const evaluation = item.eval || {};
  const finalDepth = evaluation.final_depth || evaluation.depth_decision?.final_depth;

  if (finalDepth === "light") {
    return generateProjectLightAnalysis({ candidate, evidence, triage: evaluation, options, logger: ctx.logger || console });
  }

  if (!isBriefDepth(finalDepth)) {
    return skippedAnalysis("deep", "final_depth is not analysis/deep", { candidate, triage: evaluation, options });
  }

  const offline = isOffline(options);
  if (offline) return skippedAnalysis(finalDepth, "offline_no_llm", { candidate, triage: evaluation, options });

  const intent = normalizeIntent(evaluation.intent, classifyProjectIntent({ repo, readme: evidence?.content, light: evaluation.light, tags: evaluation.tags }));
  const model = options.projectDeepModel || projectDeepModel();
  let payload = null;

  try {
    const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs }).chatJson;
    payload = await chatJson({
      system: deepSystem(intent),
      user: deepUser(repo, evidence, evaluation),
      model,
      maxTokens: options.deepMaxTokens || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 8000,
    });
  } catch (error) {
    ctx.logger?.warn?.(`project ${finalDepth} analysis failed ${repo.fullName}: ${error.message}`);
    return skippedAnalysis(finalDepth, "llm_failed", { candidate, triage: evaluation, options, error });
  }

  const normalized = normalizeDeepAnalysis(payload, { repo, evidence, intent, options });
  if (options.db) {
    const row = options.db.insertAnalysis({
      candidateId: candidate.id,
      tier: "deep",
      payload: normalized,
      model,
      generatedAt: normalized.generatedAt,
    });
    normalized._analysisId = row.id;
    normalized._model = row.model;
  }
  return normalized;
}

export function radarCardPayload(evaluation = {}) {
  const decision = evaluation.depth_decision || evaluation;
  const evidence_signals = decision.evidence_signals || evaluation.evidence_signals || {};
  return {
    tldr: evaluation.tldr || deterministicTldr(evaluation.repo || {}, decision),
    tags: evaluation.tags || tagsFromDecision(decision),
    light: evaluation.light || deterministicRadarText(evaluation.repo || {}, decision),
    worthDeepDive: Number(evaluation.worthDeepDive ?? decision.ranking_score ?? evaluation.score ?? 0),
    intent: evaluation.intent || "understanding",
    project_type: evaluation.project_type || "non_ai_eng",
    verdict: evaluation.verdict || legacyVerdictForDepth(decision.final_depth),
    ratings: evaluation.ratings || ratingsFromRanking(decision.ranking || {}),
    rankingReason: publicRankingReason(decision),
    ranking_score: Number(decision.ranking_score ?? evaluation.score ?? 0),
    max_allowed_depth: decision.max_allowed_depth || "list_only",
    final_depth: decision.final_depth || "list_only",
    ranking_reasons: decision.ranking_reasons || [],
    rejection_reasons: decision.rejection_reasons || [],
    recommended_action: decision.recommended_action || "monitor",
    needs_enrichment: Boolean(decision.needs_enrichment),
    evidence_summary: evidenceSummary(evidence_signals),
    depth_decision: publicDepthDecision(decision),
  };
}

export function normalizeLightResult(input = {}, repo = {}, evidence = {}, triage = {}) {
  const fallback = radarCardPayload(triage);
  return {
    tldr: cleanString(input?.tldr || fallback.tldr || deterministicTldr(repo, triage)).slice(0, 120),
    tags: normalizeTags(input?.tags || fallback.tags || tagsFromDecision(triage)),
    light: cleanString(input?.light || input?.summary || fallback.light || deterministicRadarText(repo, triage)),
    worthDeepDive: Number(triage?.ranking_score ?? triage?.score ?? fallback.worthDeepDive ?? 0),
    intent: normalizeIntent(input?.intent, triage?.intent || classifyProjectIntent({ repo, readme: evidence?.content, light: input?.light, tags: input?.tags })),
    project_type: normalizeProjectType(input?.project_type ?? input?.projectType, triage?.project_type || classifyProjectType({ repo, readme: evidence?.content, light: input?.light, tags: input?.tags })),
    verdict: legacyVerdictForDepth(triage?.final_depth || triage?.depth_decision?.final_depth),
    ratings: triage?.ratings || ratingsFromRanking(triage?.ranking || triage?.depth_decision?.ranking || {}),
  };
}

export function normalizeDeepAnalysis(input, { repo = {}, evidence = {}, intent = "understanding", options = {} } = {}) {
  const generatedAt = nowIso(options);
  return {
    atGlance: cleanString(input?.atGlance || input?.at_glance || ""),
    whyItMatters: normalizeWhyItMatters(input?.whyItMatters || input?.why_it_matters),
    keyConcepts: normalizeKeyConcepts(input?.keyConcepts || input?.key_concepts),
    howItWorks: cleanString(input?.howItWorks || input?.how_it_works || ""),
    novelty: cleanString(input?.novelty || ""),
    ecosystem: cleanString(input?.ecosystem || ""),
    limitations: normalizeLimitations(input?.limitations),
    tryIt: normalizeTryIt(input?.tryIt || input?.try_it, intent),
    score: normalizeScore(input?.score),
    intent,
    provenance: {
      sourceUrl: repo.url || `https://github.com/${repo.fullName || ""}`,
      evidenceKind: evidence?.kind || "readme",
      candidate: repo.fullName || "",
    },
    verifiedAt: generatedAt,
    generatedAt,
  };
}

export function publicDeep(payload = {}) {
  return {
    atGlance: payload.atGlance,
    whyItMatters: payload.whyItMatters || [],
    keyConcepts: payload.keyConcepts || [],
    howItWorks: payload.howItWorks,
    novelty: payload.novelty,
    ecosystem: payload.ecosystem,
    limitations: payload.limitations || [],
    tryIt: payload.tryIt || [],
    score: payload.score || { novelty: 0, engineering: 0, reproducibility: 0, timeToValue: 0 },
  };
}

export function classifyProjectIntent(input = {}) {
  const repo = input.repo || input;
  const text = [
    repo.fullName,
    repo.name,
    repo.description,
    input.readme,
    input.light,
    ...(Array.isArray(input.tags) ? input.tags : []),
  ].filter(Boolean).join("\n");

  const scores = {
    understanding: scoreRegex(text, UNDERSTANDING_RE),
    teaching: scoreRegex(text, TEACHING_RE),
    tool: scoreRegex(text, TOOL_RE),
  };

  if (scores.tool > scores.teaching && scores.tool >= scores.understanding) return "tool";
  if (scores.teaching > scores.understanding) return "teaching";
  if (scores.understanding > 0) return "understanding";
  if (scores.tool > 0) return "tool";
  if (scores.teaching > 0) return "teaching";
  return "understanding";
}

export function classifyProjectType(input = {}) {
  const repo = input.repo || input;
  const text = [
    repo.fullName,
    repo.name,
    repo.description,
    repo.language,
    input.readme,
    input.light,
    ...(Array.isArray(input.tags) ? input.tags : []),
  ].filter(Boolean).join("\n");

  if (!AI_RE.test(text)) return "non_ai_eng";
  if (/\b(coding agent|devtool|developer tool|cli|command line|terminal|shell|codemod|code assistant)\b/i.test(text)) return "devtool_cli";
  if (/\b(dataset|benchmark|eval|evaluation|leaderboard|arena|test set|harness)\b/i.test(text)) return "dataset_benchmark";
  if (/\b(agent framework|agent runtime|agent infrastructure|agent toolkit|multi-agent|orchestration|planner|tool calling|workflow engine|memory framework|mcp)\b/i.test(text)) return "agent_framework";
  if (/\b(model infra|serving|inference|fine-tun|finetun|training|checkpoint|quantization|vllm|lora|embedding service)\b/i.test(text)) return "model_infra";
  if (/\b(frontend|ui|react|vue|svelte|dashboard|component|chat ui|web app)\b/i.test(text)) return "frontend_ui";
  if (/\b(sdk|library|package|api client|framework|client library)\b/i.test(text)) return "library_sdk";
  if (/\b(template|boilerplate|starter|scaffold|example app)\b/i.test(text)) return "template_boilerplate";
  return "ai_app";
}

export function normalizeIntent(value, fallback = "understanding") {
  const raw = String(value || "").trim().toLowerCase();
  const mapped = {
    understanding: "understanding",
    concept: "understanding",
    teaching: "teaching",
    tutorial: "teaching",
    tool: "tool",
    utility: "tool",
  }[raw];
  return INTENTS.has(mapped) ? mapped : INTENTS.has(fallback) ? fallback : "understanding";
}

export function normalizeProjectType(value, fallback = "non_ai_eng") {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = {
    ai_app: "ai_app",
    app: "ai_app",
    agent_framework: "agent_framework",
    agent_runtime: "agent_framework",
    framework: "agent_framework",
    devtool: "devtool_cli",
    devtool_cli: "devtool_cli",
    cli: "devtool_cli",
    coding_agent: "devtool_cli",
    model_infra: "model_infra",
    infra: "model_infra",
    frontend: "frontend_ui",
    frontend_ui: "frontend_ui",
    ui: "frontend_ui",
    dataset: "dataset_benchmark",
    benchmark: "dataset_benchmark",
    dataset_benchmark: "dataset_benchmark",
    library: "library_sdk",
    sdk: "library_sdk",
    library_sdk: "library_sdk",
    template: "template_boilerplate",
    boilerplate: "template_boilerplate",
    template_boilerplate: "template_boilerplate",
    non_ai: "non_ai_eng",
    non_ai_eng: "non_ai_eng",
  }[raw];
  if (PROJECT_TYPES.has(mapped)) return mapped;
  return PROJECT_TYPES.has(fallback) ? fallback : "non_ai_eng";
}

export function persistRadarEvaluation(db, candidate, evaluation, evaluatedAt = nowIso(), model = "deterministic-project-radar") {
  if (!db || !candidate?.id) return null;
  db.upsertEval({
    candidateId: candidate.id,
    decision: evaluation.decision,
    mode: evaluation.mode,
    score: evaluation.score,
    signals: evaluation.signals,
    reason: evaluation.reason,
    evaluatedAt,
  });
  const row = db.insertAnalysis({
    candidateId: candidate.id,
    tier: "light",
    payload: radarCardPayload(evaluation),
    model,
    generatedAt: evaluatedAt,
  });
  return row;
}

function evaluationFromDecision({ candidate, repo, evidence_signals, ranking, depth_decision, evaluatedAt }) {
  const project_type = projectTypeFromSignals(evidence_signals);
  const intent = intentFromSignals(evidence_signals);
  const tldr = deterministicTldr(repo, depth_decision);
  const light = deterministicRadarText(repo, depth_decision);
  const tags = tagsFromDecision(depth_decision);
  const reason = depth_decision.rejection_reasons.length
    ? `${depth_decision.final_depth}: ${depth_decision.rejection_reasons.join(", ")}`
    : `${depth_decision.final_depth}: ${depth_decision.ranking_reasons.slice(0, 3).join(", ")}`;

  return {
    candidateId: candidate.id,
    decision: depth_decision.final_depth === "needs_enrichment" ? "needs_enrichment" : "radar",
    mode: "deterministic-radar",
    score: depth_decision.ranking_score,
    worthDeepDive: depth_decision.ranking_score,
    reason,
    signals: unique([
      `tier:${ranking.tier}`,
      `final_depth:${depth_decision.final_depth}`,
      `max_allowed_depth:${depth_decision.max_allowed_depth}`,
      `recommended_action:${depth_decision.recommended_action}`,
      ...depth_decision.ranking_reasons,
      ...depth_decision.rejection_reasons,
    ]),
    provenance: {
      evaluator: "deterministic-project-radar",
      source: candidate.source,
    },
    repo,
    tldr,
    tags,
    light,
    intent,
    project_type,
    verdict: legacyVerdictForDepth(depth_decision.final_depth),
    ratings: ratingsFromRanking(ranking),
    rankingReason: publicRankingReason(depth_decision),
    ranking,
    ranking_score: depth_decision.ranking_score,
    max_allowed_depth: depth_decision.max_allowed_depth,
    final_depth: depth_decision.final_depth,
    ranking_reasons: depth_decision.ranking_reasons,
    rejection_reasons: depth_decision.rejection_reasons,
    recommended_action: depth_decision.recommended_action,
    needs_enrichment: depth_decision.needs_enrichment,
    evidence_signals,
    evidence_summary: evidenceSummary(evidence_signals),
    depth_decision,
    evaluatedAt,
  };
}

function evidenceSignalsFrom(repo = {}, evidence = {}) {
  const fromEvidence = evidence?.evidenceSignals
    || evidence?.evidence_signals
    || evidence?.metadata?.evidenceSignals
    || evidence?.metadata?.evidence_signals;
  if (fromEvidence) return normalizeEvidenceSignals(fromEvidence);

  const audit = evidence?.artifactAudit || evidence?.metadata?.artifactAudit || {};
  const rawReadme = String(evidence?.content || "");
  return normalizeEvidenceSignals({
    owner: repo.owner,
    repo: repo.name,
    url: repo.url,
    trend_sources: repo.windows?.map((window) => `github-trending:${window}`) || [],
    stars: repo.stars,
    forks: repo.forks,
    stars_today: repo.starsGained,
    language: repo.language,
    topics: Array.isArray(audit.topics) ? audit.topics : repo.topics || [],
    description: repo.description,
    created_at: audit.created_at || repo.createdAt,
    updated_at: audit.updated_at || repo.updatedAt || audit.pushed_at,
    license: audit.license_spdx_id || repo.license,
    raw_readme: rawReadme,
    readme_found: Boolean(rawReadme),
    readme_fetch_failed: false,
    readme_empty: Boolean(rawReadme) && rawReadme.trim().length === 0,
    readme_length: rawReadme.length,
    top_level_dirs: audit.top_level_dirs || [],
    key_files: audit.key_files || [],
    has_docs: audit.has_docs === true,
    has_examples: audit.has_examples === true,
    has_tests: audit.has_tests === true,
    has_install: audit.has_install === true,
    has_docker: audit.has_docker === true,
    has_cli: audit.has_cli === true,
    has_agents: audit.has_agents === true,
    has_mcp: audit.has_mcp === true,
    has_skills: audit.has_skills === true,
    has_models: audit.has_models === true,
    has_demo: audit.has_demo === true,
    package_files: audit.package_files || {},
  });
}

function deterministicTldr(repo = {}, decision = {}) {
  const name = repo.fullName || repo.name || decision.evidence_signals?.repo || "project";
  const depth = decision.final_depth || "list_only";
  if (depth === "needs_enrichment") return `${name}: README fetch failed; needs enrichment before analysis`;
  if (depth === "deep") return `${name}: deep radar candidate with agent/tooling evidence`;
  if (depth === "analysis") return `${name}: analysis candidate with enough repo evidence`;
  if (depth === "light") return `${name}: light radar item; useful but hard-gated`;
  return `${name}: radar mention only`;
}

function deterministicRadarText(repo = {}, decision = {}) {
  const name = repo.fullName || repo.name || decision.evidence_signals?.repo || "project";
  const score = Number(decision.ranking_score || 0);
  const reasons = (decision.ranking_reasons || []).slice(0, 2).join(", ") || "trend signal";
  const rejection = (decision.rejection_reasons || [])[0];
  if (decision.final_depth === "needs_enrichment") {
    return `${name} 进入 Radar，但 README 抓取失败，不能当作空 README 处理；先补抓 README/tree，再决定是否分析。`;
  }
  if (rejection) {
    return `${name} 得分 ${score}，信号是 ${reasons}；暂不深挖，因为 ${rejection}。建议 ${decision.recommended_action || "monitor"}。`;
  }
  return `${name} 得分 ${score}，信号是 ${reasons}。按确定性深度门控进入 ${decision.final_depth || "list_only"}，建议 ${decision.recommended_action || "monitor"}。`;
}

function tagsFromDecision(decision = {}) {
  const signals = decision.evidence_signals || {};
  return unique([
    signals.has_agents ? "agents" : "",
    signals.has_mcp ? "mcp" : "",
    signals.has_skills ? "skills" : "",
    signals.has_models ? "models" : "",
    signals.has_cli ? "cli" : "",
    signals.has_docs ? "docs" : "",
    decision.final_depth,
  ]).slice(0, 5);
}

function intentFromSignals(signals = {}) {
  if (signals.has_install || signals.has_cli || signals.has_demo) return "tool";
  if (/\b(course|tutorial|lesson|curriculum|awesome|resource list)\b/i.test(`${signals.description}\n${signals.raw_readme}`)) return "teaching";
  return "understanding";
}

function projectTypeFromSignals(signals = {}) {
  const text = `${signals.raw_readme || ""}\n${signals.description || ""}\n${(signals.topics || []).join(" ")}`;
  if (!AI_RE.test(text) && !signals.has_agents && !signals.has_mcp && !signals.has_models) return "non_ai_eng";
  if (signals.has_agents || signals.has_mcp || signals.has_skills) return "agent_framework";
  if (signals.has_cli) return "devtool_cli";
  if (/\b(eval|benchmark|dataset|leaderboard)\b/i.test(text)) return "dataset_benchmark";
  if (signals.has_models) return "model_infra";
  if (/\b(frontend|ui|react|vue|dashboard|chat ui)\b/i.test(text)) return "frontend_ui";
  if (signals.package_files?.package_json || signals.package_files?.pyproject_toml || signals.package_files?.cargo_toml) return "library_sdk";
  return "ai_app";
}

function ratingsFromRanking(ranking = {}) {
  return {
    relevance_to_ai_engineer: partToRating(ranking.ai_relevance, 20),
    engineering_depth: partToRating(ranking.architecture_value, 20),
    reuse_value: partToRating((Number(ranking.usability) || 0) + (Number(ranking.evidence_sufficiency) || 0), 35),
    maturity: partToRating((Number(ranking.evidence_sufficiency) || 0) + (Number(ranking.trend_signal) || 0), 30),
  };
}

function partToRating(value, max) {
  const ratio = Math.max(0, Math.min(1, (Number(value) || 0) / max));
  return Math.max(1, Math.min(5, Math.ceil(ratio * 5)));
}

function legacyVerdictForDepth(depth) {
  if (depth === "deep") return "clone_and_run";
  if (depth === "analysis") return "deep_dive";
  if (depth === "light") return "L1";
  return "skip";
}

function publicRankingReason(decision = {}) {
  return {
    decision: decision.rejection_reasons?.length ? "gated" : "deterministic",
    rawScore: Number(decision.ranking_score || 0),
    finalScore: Number(decision.ranking_score || 0),
    matchedBoostTerms: decision.ranking_reasons || [],
    matchedCapTerms: decision.rejection_reasons || [],
    explanation: [
      `score=${Number(decision.ranking_score || 0)}`,
      `max=${decision.max_allowed_depth || "list_only"}`,
      `final=${decision.final_depth || "list_only"}`,
    ].join("; "),
  };
}

function publicDepthDecision(decision = {}) {
  return {
    ranking_score: Number(decision.ranking_score || 0),
    max_allowed_depth: decision.max_allowed_depth || "list_only",
    final_depth: decision.final_depth || "list_only",
    ranking_reasons: decision.ranking_reasons || [],
    rejection_reasons: decision.rejection_reasons || [],
    recommended_action: decision.recommended_action || "monitor",
    needs_enrichment: Boolean(decision.needs_enrichment),
    review_verdict: decision.review_verdict || "not_applicable",
    review_issues: decision.review_issues || [],
    evidence_summary: evidenceSummary(decision.evidence_signals || {}),
  };
}

function skippedAnalysis(tier, reason, { candidate = {}, triage = {}, options = {}, error = null } = {}) {
  return {
    tier,
    status: "skipped",
    skipped: true,
    reason,
    candidateId: candidate?.id,
    repo: candidate?.raw?.fullName || candidate?.raw?.name || candidate?.id || "",
    final_depth: triage?.final_depth || triage?.depth_decision?.final_depth || tier,
    offline: isOffline(options),
    ...(error ? { error: error.message || String(error) } : {}),
  };
}

function isOffline(options = {}, env = process.env) {
  return Boolean(
    options.dryRun
      || options.noLlm
      || options.offline
      || env.NO_LLM === "1"
      || env.AI_BRIEF_OFFLINE === "1",
  );
}

function normalizeWhyItMatters(value) {
  return asArray(value).slice(0, 3).map((item) => ({
    title: cleanString(item?.title || "Why it matters").slice(0, 24),
    body: cleanString(item?.body || item || ""),
  })).filter((item) => item.body);
}

function normalizeKeyConcepts(value) {
  return asArray(value).slice(0, 5).map((item) => ({
    term: cleanString(item?.term || ""),
    explain: cleanString(item?.explain || ""),
  })).filter((item) => item.term && item.explain);
}

function normalizeLimitations(value) {
  if (typeof value === "string") return [{ title: "Limit", body: cleanString(value) }].filter((item) => item.body);
  return asArray(value).slice(0, 6).map((item) => ({
    title: cleanString(item?.title || "Limit").slice(0, 24),
    body: cleanString(item?.body || item || ""),
  })).filter((item) => item.body);
}

function normalizeTryIt(value, intent) {
  const steps = asArray(value).slice(0, intent === "tool" ? 5 : 4).map((item) => {
    const step = cleanString(item?.step || item || "");
    const cmd = cleanString(item?.cmd || "");
    const note = cleanString(item?.note || "");
    const out = { step };
    if (intent === "tool" && cmd && commandLike(cmd)) out.cmd = cmd;
    if (note) out.note = note;
    return out;
  }).filter((item) => item.step);

  if (intent !== "tool") {
    return steps.map((item) => ({
      step: commandLike(item.step) ? `Study the idea behind: ${item.step.replace(COMMAND_RE, "").trim()}` : item.step,
      ...(item.note ? { note: item.note } : {}),
    }));
  }
  return steps;
}

function normalizeScore(value = {}) {
  return {
    novelty: clampPart(value?.novelty),
    engineering: clampPart(value?.engineering),
    reproducibility: clampPart(value?.reproducibility),
    timeToValue: clampPart(value?.timeToValue),
  };
}

function scoreRegex(text, regex) {
  const matches = String(text || "").match(new RegExp(regex.source, "gi"));
  return matches ? matches.length : 0;
}

function normalizeTags(value) {
  return asArray(value).map((tag) => cleanString(tag)).filter(Boolean).slice(0, 5);
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function commandLike(value) {
  return COMMAND_RE.test(String(value || ""));
}

function clampPart(value) {
  const number = Math.round(Number(value));
  return Math.max(0, Math.min(25, Number.isFinite(number) ? number : 0));
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}
