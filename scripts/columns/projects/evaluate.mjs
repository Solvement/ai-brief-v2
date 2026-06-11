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
const PROJECT_TYPES = new Set(["ai_app", "agent_framework", "agent_skill", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
const AI_RE = /\b(ai|agent|agents|agentic|rag|retrieval|mcp|a2a|memory|llm|lm|multimodal|model|eval|benchmark|embedding|vector|prompt|tool use|function calling|coding agent|generative|claude|openai|anthropic|gemini|tts|onnx|world model|notebook lm)\b/i;
const NON_AI_ENGINEERING_RE = /\b(osint|dossier|username|vpn|tunnel(?:ing)?|dns tunnel(?:ing)?|backup|container(?:s)?|kubernetes|sbom|vulnerabilit(?:y|ies)|misconfigurations?|secrets?|textbook|pdf教材|教材|live[-\s]?chat|live chat|customer support|helpdesk|omni[-\s]?channel|collaboration platform|secure collaboration|chromium|bot detection|fingerprint)\b/i;
const AGENT_AI_CONTEXT_RE = /\b(ai agent|agentic|llm|large language model|autonomous|tool[-\s]?calling|tool use|function calling|multi[-\s]?agent|mcp|model context protocol|coding agent|computer use|planner|agent runtime|agent framework|agent infrastructure|memory framework|rag|retrieval)\b/i;
const AGENT_SKILL_RE = /\b(agent[-\s]?skill|agentic skills?|skills? marketplace|meta[-\s]?skill|prompt collection|prompt collections|prompt library|system prompts?|\.claude|skill modes?|skill file|skills? for (?:ai|claude|coding agents?|real engineers)|commands? and plugins|knowledge[-\s]?work plugins?|plugins? primarily intended|specialized agents?|proven deliverables|taste[-\s]?skill)\b/i;
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
  const result = mergeCachedEvaluation(
    evaluationFromDecision({ candidate, repo, evidence, evidence_signals, ranking, depth_decision, evaluatedAt }),
    repo.cachedAnalysis?.light,
    repo,
  );

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
        maxTokens: options.lightMaxTokens || Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 3000,
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
  const tier = Number(decision.project_tier ?? evaluation.project_tier ?? projectTierForDepth(decision.final_depth || evaluation.final_depth));
  const bucket = decision.project_bucket || evaluation.project_bucket || evaluation.bucket || "无关类";
  const repo = evaluation.repo || {};
  return {
    tldr: evaluation.tldr || deterministicTldr(repo, decision),
    tags: evaluation.tags || tagsFromDecision(decision),
    light: evaluation.light || deterministicRadarText(repo, decision),
    highlight: cleanString(evaluation.highlight || decision.highlight || deterministicHighlight(repo, decision)),
    worthDeepDive: Number(evaluation.worthDeepDive ?? decision.ranking_score ?? evaluation.score ?? 0),
    intent: evaluation.intent || "understanding",
    project_type: evaluation.project_type || "non_ai_eng",
    verdict: evaluation.verdict || legacyVerdictForDepth(decision.final_depth),
    ratings: evaluation.ratings || ratingsFromRanking(decision.ranking || {}),
    rankingReason: publicRankingReason(decision),
    ranking_score: Number(decision.ranking_score ?? evaluation.score ?? 0),
    max_allowed_depth: decision.max_allowed_depth || "list_only",
    final_depth: decision.final_depth || "list_only",
    depth_band: decision.depth_band || (decision.final_depth === "analysis" ? "standard" : decision.final_depth || "light"),
    analysis_depth: decision.analysis_depth || (decision.final_depth === "analysis" ? "standard" : decision.final_depth || "light"),
    project_tier: tier,
    project_tier_label: `Tier ${tier}`,
    project_bucket: bucket,
    bucket,
    informs_our_structure: Boolean(decision.informs_our_structure || evaluation.informs_our_structure),
    self_evo_eligible: Boolean(decision.self_evo_eligible || evaluation.self_evo_eligible),
    model_tier: decision.model_tier || evaluation.model_tier || modelForProjectTier(tier),
    requires_manual_confirmation: Boolean(decision.requires_manual_confirmation || evaluation.requires_manual_confirmation || tier === 3),
    tier_tag: `[Tier ${tier}｜${bucket}]`,
    tier_template: evaluation.tier_template || deterministicTierTemplate(evaluation.repo || {}, decision, { tier, bucket }),
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
  const evidenceSignals = evidence?.evidenceSignals
    || evidence?.evidence_signals
    || evidence?.metadata?.evidenceSignals
    || evidence?.metadata?.evidence_signals
    || triage?.evidence_signals
    || triage?.depth_decision?.evidence_signals
    || {};
  const groundedTldr = deterministicTldr(repo, { ...triage, evidence_signals: evidenceSignals });
  const fallbackTldr = groundedTldr || fallback.tldr || deterministicTldr(repo, triage);
  const tier = Number(triage?.project_tier ?? triage?.depth_decision?.project_tier ?? fallback.project_tier ?? 1);
  const bucket = triage?.project_bucket || triage?.bucket || triage?.depth_decision?.project_bucket || fallback.project_bucket || "真·新项目";
  return {
    tldr: fallbackTldr.slice(0, 120),
    tags: normalizeTags(input?.tags || fallback.tags || tagsFromDecision(triage)),
    light: cleanString(input?.light || input?.summary || fallback.light || deterministicRadarText(repo, triage)),
    highlight: cleanString(input?.highlight || input?.hot_point || input?.why_hot || fallback.highlight || deterministicHighlight(repo, triage)),
    worthDeepDive: Number(triage?.ranking_score ?? triage?.score ?? fallback.worthDeepDive ?? 0),
    intent: normalizeIntent(input?.intent, triage?.intent || classifyProjectIntent({ repo, readme: evidence?.content, light: input?.light, tags: input?.tags })),
    project_type: normalizeProjectType(input?.project_type ?? input?.projectType, triage?.project_type || classifyProjectType({ repo, readme: evidence?.content, light: input?.light, tags: input?.tags })),
    verdict: legacyVerdictForDepth(triage?.final_depth || triage?.depth_decision?.final_depth),
    ratings: triage?.ratings || ratingsFromRanking(triage?.ranking || triage?.depth_decision?.ranking || {}),
    project_tier: tier,
    project_tier_label: `Tier ${tier}`,
    project_bucket: bucket,
    bucket,
    informs_our_structure: Boolean(triage?.informs_our_structure || triage?.depth_decision?.informs_our_structure),
    self_evo_eligible: Boolean(triage?.self_evo_eligible || triage?.depth_decision?.self_evo_eligible),
    model_tier: triage?.model_tier || triage?.depth_decision?.model_tier || modelForProjectTier(tier),
    requires_manual_confirmation: Boolean(triage?.requires_manual_confirmation || triage?.depth_decision?.requires_manual_confirmation || tier === 3),
    tier_tag: `[Tier ${tier}｜${bucket}]`,
    tier_template: normalizeTierTemplate(input?.tier_template || input?.tierTemplate, deterministicTierTemplate(repo, triage, { tier, bucket })),
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

  if (isNonAiEngineeringText(text)) return "non_ai_eng";
  if (isAgentSkillText(text)) return "agent_skill";
  if (!AI_RE.test(text)) return "non_ai_eng";
  const agentTermsOnly = /\bagents?\b/i.test(text) && !AGENT_AI_CONTEXT_RE.test(text);
  if (agentTermsOnly) return "non_ai_eng";
  if (/\b(coding agent|devtool|developer tool|cli|command line|terminal|shell|codemod|code assistant)\b/i.test(text)) return "devtool_cli";
  if (/\b(agent framework|agent runtime|agent infrastructure|agent toolkit|multi-agent|orchestration|planner|tool calling|workflow engine|memory framework|mcp)\b/i.test(text)) return "agent_framework";
  if (/\b(open source,? extensible AI agent|self[-\s]?improving ai framework|autonomously improve .* ai agent|ai agent .* (install|execute|edit|test))\b/i.test(text)) return "agent_framework";
  if (/\b(model infra|world models?|physical ai|serving|inference|fine-tun|finetun|training|checkpoint|quantization|vllm|lora|embedding service|tts|text[-\s]?to[-\s]?speech|onnx)\b/i.test(text)) return "model_infra";
  if (/\b(dataset|benchmark|eval|evaluation|leaderboard|arena|test set|harness)\b/i.test(text)) return "dataset_benchmark";
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
    agent_skill: "agent_skill",
    agent_skills: "agent_skill",
    skill: "agent_skill",
    skills: "agent_skill",
    plugin: "agent_skill",
    plugins: "agent_skill",
    prompt_collection: "agent_skill",
    prompt_collections: "agent_skill",
    meta_skill: "agent_skill",
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
      `depth_band:${depth_decision.depth_band}`,
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
    highlight: deterministicHighlight(repo, depth_decision),
    intent,
    project_type,
    informs_our_structure: Boolean(depth_decision.informs_our_structure),
    self_evo_eligible: Boolean(depth_decision.self_evo_eligible),
    verdict: legacyVerdictForDepth(depth_decision.final_depth),
    ratings: ratingsFromRanking(ranking),
    project_tier: depth_decision.project_tier,
    project_tier_label: depth_decision.project_tier_label,
    project_bucket: depth_decision.project_bucket,
    bucket: depth_decision.project_bucket,
    model_tier: depth_decision.model_tier,
    requires_manual_confirmation: depth_decision.requires_manual_confirmation,
    tier_tag: `[Tier ${depth_decision.project_tier}｜${depth_decision.project_bucket}]`,
    tier_template: deterministicTierTemplate(repo, depth_decision),
    rankingReason: publicRankingReason(depth_decision),
    ranking,
    ranking_score: depth_decision.ranking_score,
    max_allowed_depth: depth_decision.max_allowed_depth,
    final_depth: depth_decision.final_depth,
    depth_band: depth_decision.depth_band,
    analysis_depth: depth_decision.analysis_depth,
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

function mergeCachedEvaluation(result = {}, cached = null, repo = {}) {
  if (!repo?.alreadyAnalyzed || !cached || typeof cached !== "object") return result;
  const cachedDepth = cached.final_depth || cached.depth_band || result.final_depth;
  const merged = {
    ...result,
    ...pickCachedPublicFields(cached),
    repo: result.repo,
    evaluatedAt: result.evaluatedAt,
    decision: result.decision,
    mode: result.mode,
    score: result.score,
    worthDeepDive: Number(cached.worthDeepDive ?? cached.ranking_score ?? result.worthDeepDive ?? result.score ?? 0),
    ranking_score: Number(cached.ranking_score ?? cached.worthDeepDive ?? result.ranking_score ?? result.score ?? 0),
    ranking: result.ranking,
    ranking_reasons: result.ranking_reasons,
    rejection_reasons: result.rejection_reasons,
    evidence_signals: result.evidence_signals,
    evidence_summary: result.evidence_summary,
    reused_analysis: true,
    generated_by: cached.generated_by || "PROJECT_REUSE_CACHE",
    highlight: cleanString(cached.highlight || result.highlight || deterministicHighlight(repo, result.depth_decision || result)),
  };
  merged.depth_decision = {
    ...(result.depth_decision || {}),
    ...(cached.depth_decision || {}),
    ranking_score: merged.ranking_score,
    final_depth: cachedDepth || result.final_depth,
    depth_band: cached.depth_band || cached.analysis_depth || result.depth_band,
    analysis_depth: cached.analysis_depth || cached.depth_band || result.analysis_depth,
  };
  merged.final_depth = merged.depth_decision.final_depth || result.final_depth;
  merged.depth_band = merged.depth_decision.depth_band || result.depth_band;
  merged.analysis_depth = merged.depth_decision.analysis_depth || result.analysis_depth;
  return merged;
}

function pickCachedPublicFields(cached = {}) {
  const keys = [
    "tldr",
    "tags",
    "light",
    "highlight",
    "intent",
    "project_type",
    "verdict",
    "ratings",
    "project_tier",
    "project_tier_label",
    "project_bucket",
    "bucket",
    "model_tier",
    "requires_manual_confirmation",
    "tier_tag",
    "tier_template",
    "mind_palace",
    "recommended_action",
    "needs_enrichment",
    "informs_our_structure",
    "self_evo_eligible",
    "review_verdict",
    "review_issues",
    "rankingReason",
  ];
  return Object.fromEntries(keys.filter((key) => cached[key] !== undefined).map((key) => [key, cached[key]]));
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
    appears_in_tabs: repo.windows || [],
    stars: repo.stars,
    forks: repo.forks,
    stars_today: repo.starsGained,
    stars_in_period: repo.starsGained,
    stars_gained_by_window: repo.starsGainedByWindow || {},
    ranks_by_window: repo.ranksByWindow || {},
    source_provenance: Array.isArray(repo.provenance) ? repo.provenance : [],
    source_count: Array.isArray(repo.provenance) ? new Set(repo.provenance.map((item) => String(item?.source || "").split(":")[0]).filter(Boolean)).size : 0,
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
    has_ci: audit.has_ci === true,
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
  const signals = decision.evidence_signals || {};
  const depth = decision.final_depth || "list_only";
  const description = cleanDescription(repo.description || signals.description);
  if (depth === "needs_enrichment") return `${name} 的 README 抓取失败，需补全证据后再判断。`;
  if (description) return `${name}：${descriptionToChinese(description)}。`;
  const subject = evidenceBackedSubject(repo, signals);
  if (subject) return `${name}：${subject}。`;
  return "证据不足，待补全";
}

function evidenceBackedSubject(repo = {}, signals = {}) {
  const readmeTitle = firstReadmeTitle(signals.raw_readme);
  if (readmeTitle) return `README 标题为“${readmeTitle}”`;
  const topics = unique([
    ...(Array.isArray(repo.topics) ? repo.topics : []),
    ...(Array.isArray(signals.topics) ? signals.topics : []),
  ]).slice(0, 4);
  if (topics.length) return `GitHub topics 包括 ${topics.join("、")}，暂无更具体描述`;
  return "";
}

function descriptionToChinese(value) {
  const text = cleanDescription(value);
  if (!text) return "";
  if (/[\u4e00-\u9fff]/.test(text)) return text;
  const literal = literalChineseDescription(text);
  if (literal) return literal;
  return `GitHub 描述为“${text}”`;
}

function literalChineseDescription(text) {
  if (/^Python tool for converting files and office documents to Markdown$/i.test(text)) {
    return "Python 工具，用于将文件和 Office 文档转换为 Markdown";
  }
  if (/^The agent harness performance optimization system\./i.test(text)) {
    return "agent harness 性能优化系统，包含面向 Claude Code、Codex、Opencode、Cursor 等的 skills、instincts、memory、security 和 research-first development";
  }
  if (/^#1 Persistent memory for AI coding agents based on real-world benchmarks$/i.test(text)) {
    return "基于真实基准测试的 AI 编程智能体持久记忆";
  }
  if (/^The Open-Source Multimodal AI Agent Stack:/i.test(text)) {
    return "开源多模态 AI Agent 技术栈，用于连接前沿 AI 模型和 Agent 基础设施";
  }
  if (/^Compress tool outputs, logs, files, and RAG chunks before they reach the LLM\./i.test(text)) {
    return "在工具输出、日志、文件和 RAG chunks 到达 LLM 前进行压缩；形态包括库、代理和 MCP server";
  }
  if (/^AI Agent Governance Toolkit/i.test(text)) {
    return "AI Agent Governance Toolkit，用于 autonomous AI agents 的策略执行、zero-trust identity、执行沙箱和可靠性工程";
  }
  if (/^An adaptive Web Scraping framework/i.test(text.replace(/^[^\p{L}\p{N}]+/u, ""))) {
    return "自适应 Web Scraping 框架，可处理从单次请求到 full-scale crawl 的抓取任务";
  }
  if (/^MOSS.?TTS Family is an open.?source speech and sound generation model family/i.test(text)) {
    return "MOSS-TTS 开源语音和声音生成模型家族，覆盖长语音、多说话人对话、声音设计、环境音效和实时流式 TTS";
  }
  return "";
}

function firstReadmeTitle(value) {
  const lines = String(value || "").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s{0,3}#\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const title = cleanString(match[1].replace(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g, ""));
    if (title && title.length <= 80) return title;
  }
  return "";
}

function cleanDescription(value) {
  const text = cleanString(value)
    .replace(/\s+/g, " ")
    .replace(/[。.!?]+$/g, "")
    .trim();
  if (!text) return "";
  return text;
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

function deterministicHighlight(repo = {}, decision = {}) {
  const name = repo.fullName || repo.name || decision.evidence_signals?.repo || "这个项目";
  const signals = decision.evidence_signals || {};
  const stars = Number(repo.stars ?? signals.stars ?? signals.total_stars) || 0;
  const gained = Math.max(
    0,
    Number(repo.starsGained ?? signals.stars_today ?? signals.stars_in_period) || 0,
    ...Object.values(repo.starsGainedByWindow || signals.stars_gained_by_window || {}).map((value) => Number(value) || 0),
  );
  const reasons = unique([
    ...(decision.ranking_reasons || []),
    signals.has_agents ? "agent 工作流" : "",
    signals.has_mcp ? "MCP 连接" : "",
    signals.has_skills ? "agent skill/插件" : "",
    signals.has_models ? "模型/RAG 组件" : "",
    signals.has_cli ? "CLI 工具" : "",
  ]).slice(0, 2);
  const heat = gained
    ? `本期新增 ${gained} star`
    : stars ? `累计 ${stars} star` : "本次进入 trending";
  const why = reasons.length ? `，火点在 ${reasons.join("、")}` : "，说明社区正在集中关注它的用途";
  return `${name} ${heat}${why}。`;
}

function tagsFromDecision(decision = {}) {
  const signals = decision.evidence_signals || {};
  return unique([
    decision.project_tier_label,
    decision.project_bucket,
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
  if (isNonAiEngineeringText(text)) return "non_ai_eng";
  if (isAgentSkillText(text) || (signals.has_skills && !signals.has_agents && !signals.has_mcp && !signals.has_models)) return "agent_skill";
  if (!AI_RE.test(text) && !signals.has_agents && !signals.has_mcp && !signals.has_models) return "non_ai_eng";
  const agentTermsOnly = /\bagents?\b/i.test(text) && !AGENT_AI_CONTEXT_RE.test(text) && !signals.has_mcp && !signals.has_models;
  if (agentTermsOnly) return "non_ai_eng";
  if (signals.has_agents || signals.has_mcp) return "agent_framework";
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
    depth_band: decision.depth_band || (decision.final_depth === "analysis" ? "standard" : decision.final_depth || "light"),
    analysis_depth: decision.analysis_depth || (decision.final_depth === "analysis" ? "standard" : decision.final_depth || "light"),
    project_tier: Number(decision.project_tier ?? projectTierForDepth(decision.final_depth)),
    project_tier_label: decision.project_tier_label || `Tier ${projectTierForDepth(decision.final_depth)}`,
    project_bucket: decision.project_bucket || decision.bucket || "无关类",
    bucket: decision.project_bucket || decision.bucket || "无关类",
    project_type: decision.project_type || "non_ai_eng",
    informs_our_structure: Boolean(decision.informs_our_structure),
    self_evo_eligible: Boolean(decision.self_evo_eligible),
    model_tier: decision.model_tier || modelForProjectTier(projectTierForDepth(decision.final_depth)),
    requires_manual_confirmation: Boolean(decision.requires_manual_confirmation || projectTierForDepth(decision.final_depth) === 3),
    ranking_reasons: decision.ranking_reasons || [],
    rejection_reasons: decision.rejection_reasons || [],
    recommended_action: decision.recommended_action || "monitor",
    needs_enrichment: Boolean(decision.needs_enrichment),
    review_verdict: decision.review_verdict || "not_applicable",
    review_issues: decision.review_issues || [],
    evidence_summary: evidenceSummary(decision.evidence_signals || {}),
  };
}

function deterministicTierTemplate(repo = {}, decision = {}, explicit = {}) {
  const tier = Number(explicit.tier ?? decision.project_tier ?? projectTierForDepth(decision.final_depth));
  const bucket = explicit.bucket || decision.project_bucket || decision.bucket || "无关类";
  const signals = decision.evidence_signals || {};
  const base = {
    tier,
    bucket,
    tag: `[Tier ${tier}｜${bucket}]`,
    one_sentence_positioning: deterministicTldr(repo, decision),
    what_it_does: cleanString(repo.description || signals.description || "数据不足"),
    metadata: {
      language: repo.language || signals.language || "数据不足",
      total_stars: Number(repo.stars ?? signals.total_stars ?? signals.stars) || 0,
      stars_in_period: Number(repo.starsGained ?? signals.stars_in_period ?? signals.stars_today) || 0,
      author: repo.owner || signals.owner || "数据不足",
    },
    labels: tagsFromDecision(decision).filter((tag) => !/^Tier /.test(tag) && tag !== bucket).slice(0, 5),
    prose_body: deterministicRadarText(repo, decision),
  };

  if (tier <= 0) {
    return {
      ...base,
      index_only: {
        name: repo.fullName || repo.name || signals.repo || "数据不足",
        url: repo.url || signals.url || "",
        automatic_tags: [bucket, ...(decision.rejection_reasons || [])].filter(Boolean).slice(0, 6),
      },
    };
  }

  if (tier === 1) return base;

  const tier2 = {
    ...base,
    pain_point: "数据不足",
    core_capabilities: capabilityList(signals),
    how_to_run: {
      install_command: signals.has_install ? "见 README 安装说明" : "数据不足",
      minimal_example: signals.has_examples || signals.has_demo ? "见 README/examples 最小示例" : "数据不足",
    },
    maturity_signals: {
      star_velocity: `${base.metadata.stars_in_period} period stars / ${base.metadata.total_stars} total stars`,
      recent_commit: signals.pushed_at || signals.updated_at || "数据不足",
      releases: Number(signals.releases) > 0 ? String(signals.releases) : "数据不足",
      issue_activity: Number(signals.open_issues) > 0 ? `${signals.open_issues} open issues` : "数据不足",
    },
    comparison: "数据不足",
    trajectory_note: trajectoryNote(signals),
  };

  if (tier === 2) return tier2;

  return {
    ...tier2,
    manual_confirmation: true,
    how_it_works_with_analogy: "数据不足",
    essential_design_difference: "数据不足",
    practitioner_meaning: "数据不足",
    cross_links: [],
  };
}

function normalizeTierTemplate(input, fallback) {
  if (!input || typeof input !== "object") return fallback;
  return {
    ...fallback,
    ...input,
    metadata: {
      ...(fallback.metadata || {}),
      ...(input.metadata || {}),
    },
  };
}

function capabilityList(signals = {}) {
  const capabilities = [];
  if (signals.has_agents) capabilities.push("agent 工作流");
  if (signals.has_mcp) capabilities.push("MCP 连接");
  if (signals.has_cli) capabilities.push("CLI 入口");
  if (signals.has_models) capabilities.push("模型/RAG 组件");
  if (signals.has_docs) capabilities.push("文档");
  if (signals.has_examples || signals.has_demo) capabilities.push("示例/demo");
  return (capabilities.length ? capabilities : ["数据不足", "数据不足", "数据不足"]).slice(0, 3);
}

function trajectoryNote(signals = {}) {
  const tabs = unique([
    ...(signals.appears_in_tabs || []),
    ...(signals.trend_sources || []).map((source) => String(source).split(":").pop()),
  ].map((tab) => normalizeTrajectoryTab(tab)).filter(Boolean));
  if (tabs.includes("daily") && tabs.includes("weekly") && tabs.includes("monthly")) return "日周月皆在=持续重要";
  if (tabs.length === 1 && tabs[0] === "daily") return "仅日榜=昙花存疑";
  if (tabs.length > 1) return `${tabs.join("+")} 覆盖=有持续观察价值`;
  return "数据不足";
}

function normalizeTrajectoryTab(value) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("daily")) return "daily";
  if (raw.includes("weekly")) return "weekly";
  if (raw.includes("monthly")) return "monthly";
  return "";
}

function projectTierForDepth(depth) {
  const value = String(depth || "list_only");
  if (value === "deep") return 3;
  if (value === "analysis") return 2;
  if (value === "light") return 1;
  return 0;
}

function modelForProjectTier(tier) {
  if (Number(tier) === 3) return "codex:gpt-5.5;model_reasoning_effort=high";
  if (Number(tier) === 2) return "deepseek-or-light-codex";
  if (Number(tier) === 1) return "cheap-extraction";
  return "none";
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

function isNonAiEngineeringText(text) {
  return NON_AI_ENGINEERING_RE.test(text) && !AGENT_AI_CONTEXT_RE.test(text);
}

function isAgentSkillText(text) {
  return AGENT_SKILL_RE.test(text);
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
