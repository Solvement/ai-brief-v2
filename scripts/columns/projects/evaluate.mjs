import { BOOST_TERMS, CAP_TERMS } from "../../lib/project-ranking.mjs";
import { createDeepSeekClient, projectDeepModel, projectLightModel } from "../../lib/llm.mjs";
import { deepSystem, deepUser, LIGHT_SYS, lightUser } from "./prompts.mjs";

const INTENTS = new Set(["understanding", "teaching", "tool"]);
const PROJECT_TYPES = new Set(["ai_app", "agent_framework", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
const VERDICTS = new Set(["skip", "watch", "L1", "deep_dive", "clone_and_run"]);
const DEEP_DIVE_VERDICTS = new Set(["deep_dive", "clone_and_run"]);
const RATING_KEYS = ["relevance_to_ai_engineer", "engineering_depth", "reuse_value", "maturity"];
const NOT_FOUND = "not_found";
const AI_RE = /\b(ai|agent|agents|rag|retrieval|mcp|a2a|memory|llm|multimodal|model|eval|benchmark|embedding|vector|prompt|tool use|function calling|coding agent|generative)\b/i;
const TOOL_RE = /\b(cli|sdk|api|server|plugin|app|framework|library|package|install|usage|quickstart|deploy|docker|npm|pip|run|command|configure|integration|workflow)\b/i;
const TEACHING_RE = /\b(course|lesson|tutorial|workshop|curriculum|exercise|notebook|learn|learning|roadmap|class|chapter|hands-on)\b/i;
const UNDERSTANDING_RE = /\b(understand|understanding|explain|explaining|visual|graph|map|architecture|concept|internals|deep dive|guide|notes|analysis|codebase)\b/i;
const COMMAND_RE = /^\s*(?:npm|pnpm|yarn|npx|pip|uv|python|node|docker|git|go|cargo|bun|deno|curl|wget|claude|codex)\b/i;

export async function evaluate(candidate, evidence, ctx = {}) {
  const options = ctx.options || {};
  const repo = candidate.raw || candidate;
  const offline = options.noLlm || options.dryRun || process.env.NO_LLM === "1";
  const projectRanking = projectRankingInputSignals(repo, evidence);
  let light = null;

  if (!offline) {
    try {
      const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs }).chatJson;
      light = await chatJson({
        system: LIGHT_SYS,
        user: lightUser(repo, evidence, projectRanking),
        model: options.projectLightModel || projectLightModel(),
        maxTokens: options.lightMaxTokens || Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 1200,
      });
    } catch (error) {
      ctx.logger?.warn?.(`light evaluate failed ${repo.fullName}: ${error.message}`);
    }
  }

  const normalized = normalizeLightResult(light, repo, evidence);
  const scored = scoreProjectTriage(repo, evidence, normalized);
  const selectedByVerdict = DEEP_DIVE_VERDICTS.has(normalized.verdict);
  const result = {
    candidateId: candidate.id,
    decision: selectedByVerdict ? "select" : "skip",
    mode: "rank",
    score: scored.score,
    worthDeepDive: scored.score,
    reason: normalized.reason || scored.rankingReason.explanation,
    signals: unique([
      ...scored.signals,
      `project_type:${normalized.project_type}`,
      `verdict:${normalized.verdict}`,
    ]),
    provenance: {
      evaluator: offline ? "heuristic-offline" : "llm+heuristic-features",
      source: candidate.source,
    },
    tldr: normalized.tldr,
    tags: normalized.tags,
    light: normalized.light,
    intent: normalized.intent,
    project_type: normalized.project_type,
    verdict: normalized.verdict,
    ratings: normalized.ratings,
    rankingReason: scored.rankingReason,
    evaluatedAt: nowIso(options),
  };

  if (options.db) {
    options.db.upsertEval({
      candidateId: candidate.id,
      decision: result.decision,
      mode: result.mode,
      score: result.score,
      signals: result.signals,
      reason: result.reason,
      evaluatedAt: result.evaluatedAt,
    });
    options.db.insertAnalysis({
      candidateId: candidate.id,
      tier: "light",
      payload: {
        tldr: result.tldr,
        tags: result.tags,
        light: result.light,
        worthDeepDive: result.worthDeepDive,
        intent: result.intent,
        project_type: result.project_type,
        verdict: result.verdict,
        ratings: result.ratings,
        rankingReason: result.rankingReason,
        provenance: result.provenance,
      },
      model: result.provenance.evaluator,
      generatedAt: result.evaluatedAt,
    });
  }

  return result;
}

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  const repo = item.candidate?.raw || item.raw || {};
  const evaluation = item.eval || {};
  const intent = normalizeIntent(evaluation.intent, classifyProjectIntent({ repo, readme: evidence?.content, light: evaluation.light, tags: evaluation.tags }));
  const offline = options.noLlm || options.dryRun || process.env.NO_LLM === "1";
  let payload = null;
  let model = options.projectDeepModel || projectDeepModel();

  if (!offline) {
    try {
      const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs }).chatJson;
      payload = await chatJson({
        system: deepSystem(intent),
        user: deepUser(repo, evidence, evaluation),
        model,
        maxTokens: options.deepMaxTokens || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 8000,
      });
    } catch (error) {
      ctx.logger?.warn?.(`deep analyze failed ${repo.fullName}: ${error.message}`);
    }
  }

  const normalized = normalizeDeepAnalysis(payload || repo.deep || offlineDeep(repo, intent), { repo, evidence, intent, options });
  if (options.db) {
    const row = options.db.insertAnalysis({
      candidateId: item.candidate.id,
      tier: "deep",
      payload: normalized,
      model: offline ? "offline-projects" : model,
      generatedAt: normalized.generatedAt,
    });
    normalized._analysisId = row.id;
    normalized._model = row.model;
  }
  return normalized;
}

export function normalizeLightResult(input, repo = {}, evidence = {}) {
  const fallback = offlineLight(repo, evidence);
  const intent = normalizeIntent(input?.intent, classifyProjectIntent({
    repo,
    readme: evidence?.content,
    light: input?.light || repo.light,
    tags: input?.tags || repo.tags,
  }));
  const projectType = normalizeProjectType(input?.project_type ?? input?.projectType ?? repo.project_type, fallback.project_type);
  const ratings = normalizeRatings(input?.ratings ?? input?.project_verdict ?? repo.ratings, fallback.ratings);
  const worthDeepDive = clampScore(input?.worthDeepDive ?? repo.worthDeepDive ?? fallback.worthDeepDive);
  const verdict = normalizeVerdict(
    input?.verdict ?? input?.project_verdict?.verdict ?? repo.verdict,
    inferVerdict({ worthDeepDive, project_type: projectType, ratings, intent }),
  );

  return {
    tldr: cleanString(input?.tldr || repo.tldr || fallback.tldr),
    tags: normalizeTags(input?.tags || repo.tags || fallback.tags),
    light: cleanString(input?.light || repo.light || fallback.light),
    worthDeepDive,
    intent,
    project_type: projectType,
    verdict,
    ratings,
    reason: cleanString(input?.reason || ""),
  };
}

export function scoreProjectTriage(repo = {}, evidence = {}, light = {}) {
  const text = projectSignalText(repo, evidence?.content, light);
  const publicText = projectSignalText(repo, "", light);
  const matchedBoostTerms = matchedTerms(text, BOOST_TERMS);
  const matchedCapTerms = matchedTerms(publicText, CAP_TERMS);
  const rawScore = clampScore(light.worthDeepDive);
  const boost = Math.min(22, matchedBoostTerms.length * 4);
  const penalty = Math.min(20, matchedCapTerms.length * 4);
  const popularity = popularityBoost(repo);
  const intentAdjustment = light.intent === "tool" ? 4 : light.intent === "understanding" ? 2 : 0;
  const finalScore = clampScore(rawScore + boost + popularity + intentAdjustment - penalty);

  return {
    score: finalScore,
    signals: unique([
      ...matchedBoostTerms,
      ...matchedCapTerms,
      ...(repo.sourceTerms || []),
      `intent:${light.intent}`,
    ]),
    rankingReason: {
      decision: finalScore > rawScore ? "boost" : "no-change",
      rawScore,
      finalScore,
      matchedBoostTerms,
      matchedCapTerms,
      explanation: featureExplanation({ rawScore, finalScore, matchedBoostTerms, matchedCapTerms, popularity, intent: light.intent }),
    },
  };
}

export function projectRankingInputSignals(repo = {}, evidence = {}) {
  const text = projectSignalText(repo, evidence?.content, {});
  const publicText = projectSignalText(repo, "", {});
  return {
    boostTerms: matchedTerms(text, BOOST_TERMS),
    capTerms: matchedTerms(publicText, CAP_TERMS),
    sourceTerms: Array.isArray(repo.sourceTerms) ? repo.sourceTerms : [],
    popularityBoost: popularityBoost(repo),
    note: "Cheap keyword/popularity signal only; final triage should follow AI-engineering value.",
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
  if (/\b(agent framework|agent runtime|agent infrastructure|agent toolkit|multi-agent|orchestration|planner|tool calling|workflow engine|memory framework)\b/i.test(text)) return "agent_framework";
  if (/\b(model infra|serving|inference|fine-tun|finetun|training|checkpoint|quantization|vllm|lora|embedding service)\b/i.test(text)) return "model_infra";
  if (/\b(frontend|ui|react|vue|svelte|dashboard|component|chat ui|web app)\b/i.test(text)) return "frontend_ui";
  if (/\b(sdk|library|package|api client|framework|client library)\b/i.test(text)) return "library_sdk";
  if (/\b(template|boilerplate|starter|scaffold|example app)\b/i.test(text)) return "template_boilerplate";
  return "ai_app";
}

export function normalizeIntent(value, fallback = "understanding") {
  const raw = String(value || "").trim().toLowerCase();
  const mapped = {
    "理解型": "understanding",
    "understanding": "understanding",
    "concept": "understanding",
    "teaching": "teaching",
    "教学型": "teaching",
    "tutorial": "teaching",
    "tool": "tool",
    "工具型": "tool",
    "utility": "tool",
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

export function normalizeVerdict(value, fallback = "watch") {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = {
    skip: "skip",
    watch: "watch",
    watchlist: "watch",
    watchlisted: "watch",
    l1: "L1",
    light: "L1",
    light_read: "L1",
    deep: "deep_dive",
    deep_dive: "deep_dive",
    deepdive: "deep_dive",
    clone: "clone_and_run",
    clone_run: "clone_and_run",
    clone_and_run: "clone_and_run",
    run: "clone_and_run",
  }[raw];
  if (VERDICTS.has(mapped)) return mapped;
  return VERDICTS.has(fallback) ? fallback : "watch";
}

export function normalizeRatings(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const out = {};
  for (const key of RATING_KEYS) out[key] = clampRating(source[key] ?? fallback[key] ?? 3);
  return out;
}

export function normalizeDeepAnalysis(input, { repo = {}, evidence = {}, intent = "understanding", options = {} } = {}) {
  const fallback = offlineDeep(repo, intent);
  const generatedAt = nowIso(options);
  return {
    atGlance: cleanString(input?.atGlance || fallback.atGlance),
    whyItMatters: normalizeWhyItMatters(input?.whyItMatters || fallback.whyItMatters),
    keyConcepts: normalizeKeyConcepts(input?.keyConcepts || fallback.keyConcepts),
    howItWorks: cleanString(input?.howItWorks || fallback.howItWorks),
    novelty: cleanString(input?.novelty || fallback.novelty),
    ecosystem: cleanString(input?.ecosystem || fallback.ecosystem),
    limitations: normalizeLimitations(input?.limitations || fallback.limitations),
    tryIt: normalizeTryIt(input?.tryIt || fallback.tryIt, intent),
    score: normalizeScore(input?.score || fallback.score),
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

function offlineLight(repo, evidence) {
  const description = cleanString(repo.description || evidence?.content || "Open-source AI engineering project.");
  const intent = classifyProjectIntent({ repo, readme: evidence?.content });
  const project_type = classifyProjectType({ repo, readme: evidence?.content, light: repo.light, tags: repo.tags });
  const worthDeepDive = clampScore(repo.worthDeepDive ?? heuristicWorth(repo, evidence));
  const ratings = inferRatings(repo, evidence, { intent, project_type, worthDeepDive });
  return {
    tldr: cleanString(repo.tldr || `${repo.fullName || repo.name || "This repo"} focuses on ${description.slice(0, 72)}.`),
    tags: normalizeTags(repo.tags || [repo.language, intent, "AI engineering"]),
    light: cleanString(repo.light || `${description.slice(0, 220)}${repo.starsGained ? ` It gained ${repo.starsGained} stars in the current discovery window.` : ""}`),
    worthDeepDive,
    intent,
    project_type,
    verdict: inferVerdict({ worthDeepDive, project_type, ratings, intent }),
    ratings,
  };
}

function inferRatings(repo = {}, evidence = {}, light = {}) {
  const audit = evidence?.artifactAudit || evidence?.metadata?.artifactAudit || {};
  const text = projectSignalText(repo, evidence?.content, light);
  const boostCount = matchedTerms(text, BOOST_TERMS).length;
  const projectType = normalizeProjectType(light.project_type, classifyProjectType({
    repo,
    readme: evidence?.content,
    light: light.light,
    tags: light.tags,
  }));
  const relevance = projectType === "non_ai_eng"
    ? 1
    : clampRating(2 + Math.min(2, boostCount) + (AI_RE.test(text) ? 1 : 0));
  const engineeringDepth = clampRating(
    1 +
    boolPoint(audit.has_src) +
    boolPoint(audit.has_tests) +
    boolPoint(audit.has_ci) +
    boolPoint(audit.has_packages) +
    (["agent_framework", "devtool_cli", "model_infra", "library_sdk"].includes(projectType) ? 1 : 0),
  );
  const reuseValue = clampRating(
    1 +
    Math.min(2, boostCount) +
    boolPoint(audit.has_docs) +
    boolPoint(audit.has_examples) +
    (["agent_framework", "devtool_cli", "library_sdk", "model_infra", "dataset_benchmark"].includes(projectType) ? 1 : 0),
  );
  const maturity = clampRating(
    1 +
    foundPoint(audit.license_spdx_id) +
    foundPoint(audit.pushed_at) +
    foundPoint(audit.latest_release_tag_name) +
    boolPoint(audit.has_tests) +
    boolPoint(audit.has_ci) +
    (Number(repo.stars) >= 2000 ? 1 : 0) -
    (audit.archived === true ? 2 : 0),
  );

  return {
    relevance_to_ai_engineer: relevance,
    engineering_depth: engineeringDepth,
    reuse_value: reuseValue,
    maturity,
  };
}

function inferVerdict({ worthDeepDive = 50, project_type = "non_ai_eng", ratings = {}, intent = "understanding" } = {}) {
  const normalizedRatings = normalizeRatings(ratings);
  if (project_type === "non_ai_eng" || normalizedRatings.relevance_to_ai_engineer <= 1) return "skip";
  if (
    worthDeepDive >= 82 &&
    intent === "tool" &&
    normalizedRatings.relevance_to_ai_engineer >= 4 &&
    normalizedRatings.engineering_depth >= 4 &&
    normalizedRatings.reuse_value >= 4 &&
    normalizedRatings.maturity >= 3
  ) return "clone_and_run";
  if (
    worthDeepDive >= 70 &&
    normalizedRatings.relevance_to_ai_engineer >= 4 &&
    normalizedRatings.engineering_depth >= 3 &&
    normalizedRatings.reuse_value >= 4
  ) return "deep_dive";
  if (worthDeepDive >= 55) return "L1";
  if (worthDeepDive >= 35) return "watch";
  return "skip";
}

function offlineDeep(repo, intent) {
  const name = repo.fullName || repo.name || "This project";
  const description = cleanString(repo.description || "The README gives limited detail, so this offline analysis stays conservative.");
  const conceptualTryIt = [
    { step: "Identify the core problem the project is trying to solve and the AI system boundary it assumes." },
    { step: "Trace the main data or context flow from input to model/tool call to output." },
    { step: "Extract one reusable pattern and compare it with your own agent or RAG workflow." },
  ];
  const toolTryIt = [
    { step: "Read the README quickstart and verify the required runtime, API keys, and integration points." },
    { step: "Run the smallest documented example, then inspect which model, tool, or retrieval path it exercises." },
    { step: "Extend one input, tool, or eval case so the project teaches a reusable workflow rather than a demo only." },
  ];

  return {
    atGlance: `${name} is worth a closer look if you care about ${description.slice(0, 90)}.`,
    whyItMatters: [
      { title: "Reusable idea", body: "The useful part is the system pattern: how context, tools, memory, or evaluation are wired together." },
      { title: "Engineering signal", body: "Stars and recent discovery are treated as signals, but the deep value comes from transferable implementation choices." },
      { title: "Reading path", body: "Start from the README architecture or quickstart, then map the pieces to your own AI workflow." },
    ],
    keyConcepts: [
      { term: "System boundary", explain: "The point where the project turns user input, repository state, or external data into model-ready context." },
      { term: "Transferable pattern", explain: "A design move that can be reused outside this repository, such as memory retrieval, tool routing, or eval loops." },
    ],
    howItWorks: `## One-sentence model\n${description}\n\n## Workflow\nRead the README as an input-to-output path: what enters the system, what components transform it, and where model calls or tools appear.\n\n## Verification point\nThe project is most valuable when the README shows a concrete path you can adapt, not only a feature list.`,
    novelty: "The offline path cannot verify all implementation details, so it focuses on conservative transfer value. Look for whether the project combines familiar pieces in a way that reduces integration work or exposes a clearer mental model.\n\nIf the README shows only marketing language, keep it as a light read. If it exposes architecture, evals, memory, or tool boundaries, it may deserve a deeper manual pass.",
    ecosystem: "Treat this repository as one node in the agent/RAG/tooling ecosystem. Compare its abstractions with LangChain, AutoGen, MCP servers, vector stores, or coding-agent workflows depending on the README scope.",
    limitations: [
      { title: "Evidence bound", body: "Offline analysis only uses cached metadata or README text. Claims about internals should be rechecked against source files before publication." },
      { title: "Popularity bias", body: "Trending and stars can overrate demos. The selection score therefore also looks for reusable AI engineering signals." },
    ],
    tryIt: intent === "tool" ? toolTryIt : conceptualTryIt,
    score: { novelty: 12, engineering: 12, reproducibility: intent === "tool" ? 14 : 8, timeToValue: 10 },
  };
}

function heuristicWorth(repo, evidence) {
  const text = projectSignalText(repo, evidence?.content, {});
  const boosts = matchedTerms(text, BOOST_TERMS).length;
  const caps = matchedTerms(projectSignalText(repo, "", {}), CAP_TERMS).length;
  const score = 45 + boosts * 8 + popularityBoost(repo) - caps * 4;
  return clampScore(score);
}

function normalizeWhyItMatters(value) {
  return asArray(value).slice(0, 3).map((item) => ({
    title: cleanString(item?.title || "Why it matters").slice(0, 24),
    body: cleanString(item?.body || item || "The README does not give enough detail."),
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
    if (intent === "tool" && cmd && !isDangerousOrInventedCommand(cmd)) out.cmd = cmd;
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

function normalizeScore(value) {
  return {
    novelty: clampPart(value?.novelty),
    engineering: clampPart(value?.engineering),
    reproducibility: clampPart(value?.reproducibility),
    timeToValue: clampPart(value?.timeToValue),
  };
}

function projectSignalText(repo, readme, light) {
  return [
    repo.fullName,
    repo.name,
    repo.description,
    repo.language,
    light?.tldr,
    light?.light,
    ...(Array.isArray(light?.tags) ? light.tags : []),
    readme ? String(readme).slice(0, 5000) : "",
  ].filter(Boolean).join("\n").toLowerCase();
}

function matchedTerms(text, terms) {
  const out = [];
  const normalized = String(text || "").toLowerCase();
  for (const term of terms) {
    const pattern = new RegExp(`\\b${escapeRegex(term).replace(/\\ /g, "\\s+")}\\b`, "i");
    if (pattern.test(normalized)) out.push(term);
  }
  return out;
}

function featureExplanation({ rawScore, finalScore, matchedBoostTerms, matchedCapTerms, popularity, intent }) {
  const parts = [`raw ${rawScore}`, `final ${finalScore}`, `intent ${intent}`];
  if (matchedBoostTerms.length) parts.push(`boost: ${matchedBoostTerms.join(", ")}`);
  if (matchedCapTerms.length) parts.push(`penalty features: ${matchedCapTerms.join(", ")}`);
  if (popularity) parts.push(`popularity +${popularity}`);
  return parts.join("; ");
}

function popularityBoost(repo) {
  const gained = Number(repo.starsGained) || 0;
  const stars = Number(repo.stars) || 0;
  if (gained >= 1000) return 8;
  if (gained >= 300) return 6;
  if (gained >= 100) return 4;
  if (stars >= 10000) return 4;
  if (stars >= 2000) return 2;
  return 0;
}

function scoreRegex(text, regex) {
  const matches = String(text || "").match(new RegExp(regex.source, "gi"));
  return matches ? matches.length : 0;
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTags(value) {
  return asArray(value).map((tag) => cleanString(tag)).filter(Boolean).slice(0, 5);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function clampScore(value) {
  const number = Math.round(Number(value));
  return Math.max(0, Math.min(100, Number.isFinite(number) ? number : 50));
}

function clampPart(value) {
  const number = Math.round(Number(value));
  return Math.max(0, Math.min(25, Number.isFinite(number) ? number : 0));
}

function clampRating(value) {
  const number = Math.round(Number(value));
  return Math.max(1, Math.min(5, Number.isFinite(number) ? number : 3));
}

function boolPoint(value) {
  return value === true ? 1 : 0;
}

function foundPoint(value) {
  return value !== undefined && value !== null && value !== "" && value !== NOT_FOUND ? 1 : 0;
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isDangerousOrInventedCommand(cmd) {
  return !commandLike(cmd);
}

function commandLike(value) {
  return COMMAND_RE.test(String(value || ""));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}
