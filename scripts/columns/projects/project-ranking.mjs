export const DEPTHS = ["list_only", "light", "analysis", "deep"];
export const DEPTH_ORDER = {
  needs_enrichment: -1,
  list_only: 0,
  light: 1,
  analysis: 2,
  deep_candidate: 3,
  deep: 3,
};

export const RANKING_KEYS = [
  "ai_relevance",
  "evidence_sufficiency",
  "architecture_value",
  "usability",
  "novelty",
  "trend_signal",
];

const AI_TERMS_RE = /\b(ai|agent|agents|agentic|llm|rag|retrieval|mcp|model context protocol|a2a|memory|embedding|vector|eval|evaluation|benchmark|tool use|function calling|coding agent|multimodal|generative|openai|anthropic|gemini|claude)\b/i;
const AGENT_RE = /\b(agent|agents|agentic|multi-agent|planner|tool calling|tool use|function calling|workflow|orchestration|autonomous|coding agent|computer use|browser agent)\b/i;
const MCP_RE = /\b(mcp|model context protocol)\b/i;
const SKILLS_RE = /\b(skill|skills|commands?|hooks?|workflow pack|playbook)\b/i;
const MODEL_RE = /\b(model|models|llm|embedding|vector|checkpoint|hugging ?face|openai|anthropic|gemini|claude|inference|rag|retrieval)\b/i;
const EVAL_RE = /\b(eval|evals|evaluation|benchmark|test harness|leaderboard|scorecard)\b/i;
const INSTALL_RE = /\b(install|installation|quickstart|getting started|setup|npm install|pnpm install|pip install|uv pip|cargo install|docker run|docker compose|clone|run)\b/i;
const CLI_RE = /\b(cli|command line|terminal|npx|console_scripts|entry_points|bin\/|commander|click|typer|args?)\b/i;
const DOCS_RE = /\b(docs?|documentation|guide|manual|reference)\b/i;
const EXAMPLES_RE = /\b(examples?|samples?|demo|demos|cookbook|notebook)\b/i;
const LIST_RE = /\b(awesome|curated list|resource list|resources|course|courses|tutorial|tutorials|curriculum|lessons?|workshop|roadmap|cheatsheet|cookbook)\b/i;
const UI_RE = /\b(ui|frontend|dashboard|chat ui|interface|web app|react|vue|svelte|next\.?js|tailwind)\b/i;
const INFRA_RE = /\b(agent|runtime|workflow|orchestration|memory|rag|retrieval|mcp|tool calling|eval|benchmark|sdk|cli|api|server|plugin|hooks?)\b/i;
const VERTICAL_RE = /\b(finance|financial|legal|healthcare|medical|education|sales|support|enterprise|compliance|insurance)\b/i;

const PACKAGE_FILE_KEYS = [
  "package_json",
  "pyproject_toml",
  "cargo_toml",
  "requirements_txt",
  "docker_compose_yml",
  "dockerfile",
];

export function scoreProject(evidenceSignals = {}) {
  const signals = normalizeEvidenceSignals(evidenceSignals);
  const text = evidenceText(signals);
  const reasons = [];

  const ai_relevance = clampScore(
    boolPoints(signals.has_agents, 6, reasons, "agent/workflow evidence")
      + boolPoints(signals.has_mcp, 5, reasons, "MCP evidence")
      + boolPoints(signals.has_skills, 3, reasons, "skills/hooks evidence")
      + boolPoints(signals.has_models, 3, reasons, "model/RAG evidence")
      + boolPoints(AI_TERMS_RE.test(text), 5, reasons, "AI terms found in README/tree/topics")
      + boolPoints(EVAL_RE.test(text), 3, reasons, "eval/benchmark evidence")
      + weakDescriptionAiPoints(signals, reasons),
    0,
    20,
  );

  const evidence_sufficiency = clampScore(
    readmeEvidencePoints(signals, reasons)
      + boolPoints(signals.top_level_dirs.length > 0, 3, reasons, "repo tree available")
      + boolPoints(signals.key_files.length > 0, 3, reasons, "key files available")
      + boolPoints(signals.has_docs, 3, reasons, "docs signal")
      + boolPoints(signals.has_examples || signals.has_demo, 3, reasons, "examples/demo signal")
      + boolPoints(signals.has_install, 3, reasons, "install/quickstart signal")
      + boolPoints(hasAnyPackageFile(signals), 2, reasons, "package/config files present")
      + boolPoints(signals.has_tests, 2, reasons, "tests signal"),
    0,
    20,
  );

  const architecture_value = clampScore(
    boolPoints(signals.has_agents, 5, reasons, "agent architecture signal")
      + boolPoints(signals.has_mcp, 4, reasons, "MCP connector signal")
      + boolPoints(signals.has_skills, 3, reasons, "skill/hook mechanism signal")
      + boolPoints(signals.has_cli, 2, reasons, "CLI integration signal")
      + boolPoints(signals.has_models, 2, reasons, "model or retrieval component signal")
      + boolPoints(hasArchitecturalDirs(signals), 4, reasons, "source/packages tree signal")
      + boolPoints(signals.has_tests, 2, reasons, "testable engineering signal")
      + boolPoints(signals.has_docker, 1, reasons, "deployment/container signal"),
    0,
    20,
  );

  const usability = clampScore(
    boolPoints(signals.has_install, 4, reasons, "install path")
      + boolPoints(signals.has_examples, 3, reasons, "examples path")
      + boolPoints(signals.has_docs, 2, reasons, "docs path")
      + boolPoints(signals.has_demo, 2, reasons, "demo path")
      + boolPoints(signals.has_cli, 2, reasons, "CLI path")
      + boolPoints(signals.has_docker, 1, reasons, "Docker path")
      + boolPoints(hasAnyPackageFile(signals), 2, reasons, "package manager path"),
    0,
    15,
  );

  const novelty = clampScore(
    boolPoints(signals.has_agents, 4, reasons, "agentic system")
      + boolPoints(signals.has_mcp, 3, reasons, "MCP/workflow pack")
      + boolPoints(signals.has_skills, 2, reasons, "skill pack")
      + boolPoints(EVAL_RE.test(text), 2, reasons, "evaluation angle")
      + boolPoints(/\b(memory|context|rag|retrieval|browser agent|computer use|coding agent|local-first|ai os)\b/i.test(text), 4, reasons, "priority project shape")
      + boolPoints(VERTICAL_RE.test(text) && (signals.has_agents || signals.has_mcp), 2, reasons, "vertical agent workflow"),
    0,
    15,
  );

  const trend_signal = clampScore(
    trendSourcePoints(signals)
      + starsTodayPoints(signals)
      + starsPoints(signals)
      + forksPoints(signals),
    0,
    10,
  );

  const subscores = {
    ai_relevance,
    evidence_sufficiency,
    architecture_value,
    usability,
    novelty,
    trend_signal,
  };
  const total = RANKING_KEYS.reduce((sum, key) => sum + subscores[key], 0);
  const tier = tierForScore(total);

  return {
    ...subscores,
    total,
    tier,
    ranking_reasons: unique(reasons).slice(0, 12),
  };
}

export function decideProjectDepth({ ranking, evidence_signals: inputSignals } = {}) {
  const evidence_signals = normalizeEvidenceSignals(inputSignals);
  const scored = ranking || scoreProject(evidence_signals);
  const rejection_reasons = [];
  let max_allowed_depth = "deep";
  let needs_enrichment = Boolean(evidence_signals.needs_enrichment);

  const capToLight = (reason) => {
    rejection_reasons.push(reason);
    max_allowed_depth = minDepth(max_allowed_depth, "light");
  };

  if (evidence_signals.readme_fetch_failed) {
    needs_enrichment = true;
    capToLight("readme_fetch_failed");
  }
  if (evidence_signals.readme_empty) capToLight("readme_empty");
  if (!evidence_signals.readme_found && !evidence_signals.readme_fetch_failed) {
    needs_enrichment = true;
    capToLight("readme_missing");
  }
  if (isSloganOnly(evidence_signals)) capToLight("slogan_only_readme");
  if (!hasEvidencePath(evidence_signals)) capToLight("no_docs_examples_install_or_demo");
  if (infoMostlyFromNameDescription(evidence_signals)) capToLight("information_mostly_from_name_or_description");
  if (!hasExplicitAiRelevance(evidence_signals, scored)) capToLight("no_explicit_ai_application_relevance");
  if (isAwesomeCourseTutorialList(evidence_signals)) capToLight("awesome_course_tutorial_or_resource_list");
  if (isPlainUiWrapper(evidence_signals)) capToLight("plain_ui_wrapper_without_agent_infra_or_workflow");
  if (!canDesignTestPlan(evidence_signals)) capToLight("cannot_design_practical_test_plan");

  const tierDepth = depthForTier(scored.tier);
  const final_depth = needs_enrichment && evidence_signals.readme_fetch_failed
    ? "needs_enrichment"
    : minDepth(tierDepth, max_allowed_depth);

  return {
    ranking_score: scored.total,
    ranking: scored,
    max_allowed_depth,
    final_depth,
    ranking_reasons: scored.ranking_reasons || [],
    rejection_reasons: unique(rejection_reasons),
    evidence_signals,
    recommended_action: recommendedAction(final_depth, scored.total, needs_enrichment),
    needs_enrichment,
    review_verdict: isBriefDepth(final_depth) ? "pending" : "not_applicable",
    review_issues: [],
  };
}

export function applyDailyDepthTargets(items = [], options = {}) {
  const sorted = [...items].sort((left, right) => {
    const scoreDelta = depthScore(right) - depthScore(left);
    if (scoreDelta) return scoreDelta;
    return sourceRank(left) - sourceRank(right);
  });

  for (const item of sorted) {
    const evalResult = item.eval || item;
    const originalDepth = normalizeDepth(evalResult.final_depth || evalResult.depth_decision?.final_depth);
    const decision = cloneDecision(evalResult.depth_decision || evalResult);
    const finalDepth = originalDepth;
    decision.final_depth = finalDepth;
    decision.recommended_action = recommendedAction(finalDepth, Number(decision.ranking_score ?? evalResult.score ?? 0), decision.needs_enrichment);
    evalResult.final_depth = finalDepth;
    evalResult.depth_decision = decision;
    evalResult.recommended_action = decision.recommended_action;
    evalResult.rejection_reasons = decision.rejection_reasons;
    evalResult.needs_enrichment = Boolean(decision.needs_enrichment);
  }

  return items;
}

export function isContentDepth(depth) {
  return ["light", "analysis", "deep"].includes(String(depth || ""));
}

export function isBriefDepth(depth) {
  return ["analysis", "deep"].includes(String(depth || ""));
}

export function depthAtLeast(depth, minimum) {
  return (DEPTH_ORDER[depth] ?? -1) >= (DEPTH_ORDER[minimum] ?? -1);
}

export function depthForTier(tier) {
  if (tier === "deep_candidate") return "deep";
  if (tier === "analysis") return "analysis";
  if (tier === "light") return "light";
  return "list_only";
}

export function tierForScore(score) {
  const value = Number(score) || 0;
  if (value >= 75) return "deep_candidate";
  if (value >= 60) return "analysis";
  if (value >= 40) return "light";
  return "list_only";
}

export function normalizeEvidenceSignals(input = {}) {
  const packageFiles = normalizePackageFiles(input.package_files || input.packageFiles || input);
  const rawReadme = String(input.raw_readme ?? input.rawReadme ?? input.readme ?? "");
  const readmeLength = Number.isFinite(Number(input.readme_length ?? input.readmeLength))
    ? Number(input.readme_length ?? input.readmeLength)
    : rawReadme.length;
  return {
    owner: clean(input.owner),
    repo: clean(input.repo || input.name),
    url: clean(input.url),
    trend_sources: asArray(input.trend_sources || input.trendSources),
    stars: Number(input.stars) || 0,
    forks: Number(input.forks) || 0,
    stars_today: Number(input.stars_today ?? input.starsToday ?? input.starsGained) || 0,
    language: clean(input.language),
    topics: asArray(input.topics).map(clean).filter(Boolean),
    description: clean(input.description),
    created_at: clean(input.created_at || input.createdAt),
    updated_at: clean(input.updated_at || input.updatedAt),
    license: clean(input.license || input.license_spdx_id),
    raw_readme: rawReadme,
    readme_found: Boolean(input.readme_found ?? input.readmeFound),
    readme_fetch_failed: Boolean(input.readme_fetch_failed ?? input.readmeFetchFailed),
    readme_empty: Boolean(input.readme_empty ?? input.readmeEmpty),
    readme_length: readmeLength,
    top_level_dirs: asArray(input.top_level_dirs || input.topLevelDirs),
    key_files: asArray(input.key_files || input.keyFiles),
    has_docs: Boolean(input.has_docs ?? input.hasDocs),
    has_examples: Boolean(input.has_examples ?? input.hasExamples),
    has_tests: Boolean(input.has_tests ?? input.hasTests),
    has_install: Boolean(input.has_install ?? input.hasInstall),
    has_docker: Boolean((input.has_docker ?? input.hasDocker) || packageFiles.dockerfile || packageFiles.docker_compose_yml),
    has_cli: Boolean(input.has_cli ?? input.hasCli),
    has_agents: Boolean(input.has_agents ?? input.hasAgents),
    has_mcp: Boolean(input.has_mcp ?? input.hasMcp),
    has_skills: Boolean(input.has_skills ?? input.hasSkills),
    has_models: Boolean(input.has_models ?? input.hasModels),
    has_demo: Boolean(input.has_demo ?? input.hasDemo),
    package_files: packageFiles,
    needs_enrichment: Boolean(input.needs_enrichment ?? input.needsEnrichment),
    evidence_basis: asArray(input.evidence_basis || input.evidenceBasis),
  };
}

export function evidenceSummary(evidenceSignals = {}) {
  const signals = normalizeEvidenceSignals(evidenceSignals);
  return {
    readme_found: signals.readme_found,
    readme_fetch_failed: signals.readme_fetch_failed,
    readme_empty: signals.readme_empty,
    readme_length: signals.readme_length,
    top_level_dirs: signals.top_level_dirs.slice(0, 12),
    key_files: signals.key_files.slice(0, 16),
    has_docs: signals.has_docs,
    has_examples: signals.has_examples,
    has_tests: signals.has_tests,
    has_install: signals.has_install,
    has_docker: signals.has_docker,
    has_cli: signals.has_cli,
    has_agents: signals.has_agents,
    has_mcp: signals.has_mcp,
    has_skills: signals.has_skills,
    has_models: signals.has_models,
    has_demo: signals.has_demo,
    package_files: signals.package_files,
  };
}

export function minDepth(left, right) {
  return (DEPTH_ORDER[left] ?? 0) <= (DEPTH_ORDER[right] ?? 0) ? left : right;
}

function readmeEvidencePoints(signals, reasons) {
  if (signals.readme_fetch_failed) return 0;
  if (!signals.readme_found || signals.readme_empty) return 0;
  if (signals.readme_length >= 1600) {
    reasons.push("substantial README");
    return 8;
  }
  if (signals.readme_length >= 700) {
    reasons.push("usable README");
    return 6;
  }
  if (signals.readme_length >= 240) {
    reasons.push("thin README");
    return 3;
  }
  return 1;
}

function weakDescriptionAiPoints(signals, reasons) {
  if (AI_TERMS_RE.test(signals.description || "") && !AI_TERMS_RE.test(evidenceText(signals))) {
    reasons.push("AI appears only in public metadata");
    return 2;
  }
  return 0;
}

function trendSourcePoints(signals) {
  return Math.min(4, signals.trend_sources.length * 2);
}

function starsTodayPoints(signals) {
  const gained = Number(signals.stars_today) || 0;
  if (gained >= 1000) return 4;
  if (gained >= 300) return 3;
  if (gained >= 100) return 2;
  if (gained > 0) return 1;
  return 0;
}

function starsPoints(signals) {
  const stars = Number(signals.stars) || 0;
  if (stars >= 20000) return 3;
  if (stars >= 5000) return 2;
  if (stars >= 500) return 1;
  return 0;
}

function forksPoints(signals) {
  return Number(signals.forks) >= 500 ? 1 : 0;
}

function hasArchitecturalDirs(signals) {
  const dirs = new Set(signals.top_level_dirs.map((dir) => clean(dir).toLowerCase()));
  return ["src", "lib", "packages", "apps", "server", "client", "agents", "mcp", "skills"].some((dir) => dirs.has(dir));
}

function hasAnyPackageFile(signals) {
  return PACKAGE_FILE_KEYS.some((key) => Boolean(signals.package_files?.[key]));
}

function hasEvidencePath(signals) {
  return Boolean(signals.has_docs || signals.has_examples || signals.has_install || signals.has_demo);
}

function hasExplicitAiRelevance(signals, ranking) {
  const text = evidenceText(signals);
  return Boolean(
    signals.has_agents
      || signals.has_mcp
      || signals.has_skills
      || signals.has_models
      || AI_TERMS_RE.test(text)
      || Number(ranking?.ai_relevance) >= 8,
  );
}

function isSloganOnly(signals) {
  if (!signals.readme_found || signals.readme_fetch_failed || signals.readme_empty) return false;
  const text = clean(signals.raw_readme);
  if (!text) return false;
  const nonEmptyLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean).length;
  return signals.readme_length < 220 || (nonEmptyLines.length <= 2 && words <= 45);
}

function infoMostlyFromNameDescription(signals) {
  const evidenceBearing = signals.readme_length >= 300
    || signals.top_level_dirs.length > 0
    || signals.key_files.length > 0
    || signals.has_docs
    || signals.has_examples
    || signals.has_install
    || signals.has_demo;
  return !evidenceBearing && Boolean(signals.description || signals.repo || signals.owner);
}

function isAwesomeCourseTutorialList(signals) {
  const text = [
    signals.repo,
    signals.description,
    signals.raw_readme.slice(0, 3000),
    ...signals.topics,
  ].join("\n");
  if (!LIST_RE.test(text)) return false;
  const runnableInfra = signals.has_mcp
    || signals.has_cli
    || (hasArchitecturalDirs(signals) && signals.has_install && (signals.has_tests || signals.has_examples || signals.has_demo));
  return !runnableInfra;
}

function isPlainUiWrapper(signals) {
  const text = [
    signals.description,
    signals.raw_readme.slice(0, 3000),
    ...signals.topics,
    ...signals.top_level_dirs,
  ].join("\n");
  return UI_RE.test(text) && !INFRA_RE.test(text) && !signals.has_agents && !signals.has_mcp && !signals.has_tests;
}

function canDesignTestPlan(signals) {
  if (signals.readme_fetch_failed || signals.readme_empty || !signals.readme_found) return false;
  return Boolean(
    signals.has_install
      && (signals.has_examples || signals.has_demo || signals.has_tests || signals.has_cli || signals.has_docker),
  );
}

function recommendedAction(depth, score, needsEnrichment) {
  if (needsEnrichment) return "monitor";
  if (depth === "deep") return "deep_dive";
  if (depth === "analysis") return "analyze";
  if (depth === "light") return score >= 55 ? "try" : "monitor";
  return score >= 30 ? "monitor" : "ignore";
}

function evidenceText(signals) {
  return [
    signals.raw_readme,
    ...(signals.topics || []),
    ...(signals.top_level_dirs || []),
    ...(signals.key_files || []),
  ].filter(Boolean).join("\n");
}

function normalizePackageFiles(input = {}) {
  return {
    package_json: Boolean(input.package_json ?? input.packageJson),
    pyproject_toml: Boolean(input.pyproject_toml ?? input.pyprojectToml),
    cargo_toml: Boolean(input.cargo_toml ?? input.cargoToml),
    requirements_txt: Boolean(input.requirements_txt ?? input.requirementsTxt),
    docker_compose_yml: Boolean(input.docker_compose_yml ?? input.dockerComposeYml),
    dockerfile: Boolean(input.dockerfile ?? input.Dockerfile),
  };
}

function boolPoints(condition, points, reasons, reason) {
  if (!condition) return 0;
  reasons.push(reason);
  return points;
}

function cloneDecision(value = {}) {
  return {
    ranking_score: Number(value.ranking_score ?? value.score ?? 0),
    max_allowed_depth: value.max_allowed_depth || "deep",
    final_depth: normalizeDepth(value.final_depth),
    ranking_reasons: asArray(value.ranking_reasons),
    rejection_reasons: asArray(value.rejection_reasons),
    evidence_signals: value.evidence_signals,
    recommended_action: value.recommended_action || "monitor",
    needs_enrichment: Boolean(value.needs_enrichment),
    review_verdict: value.review_verdict || "not_applicable",
    review_issues: asArray(value.review_issues),
  };
}

function normalizeDepth(value) {
  const depth = String(value || "list_only");
  if (depth === "deep_candidate") return "deep";
  return DEPTH_ORDER[depth] !== undefined ? depth : "list_only";
}

function depthScore(item) {
  const evalResult = item.eval || item;
  return Number(evalResult.depth_decision?.ranking_score ?? evalResult.score ?? evalResult.ranking_score ?? 0);
}

function sourceRank(item) {
  const repo = item.candidate?.raw || item.raw || {};
  const ranks = Object.values(repo.ranksByWindow || {}).map(Number).filter(Number.isFinite);
  return ranks.length ? Math.min(...ranks) : Number(repo.rank) || 9999;
}

function clampScore(value, min, max) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
