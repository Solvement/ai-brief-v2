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
const RESOURCE_NAME_RE = /(?:^|[-_/])awesome[-_/]|[-_/]roadmap(?:$|[-_/])|[-_/]tutorial(?:$|[-_/])|books?|100[-_]?days|interview/i;
const RESOURCE_DESC_RE = /\b(curated\s+list|resources?|roadmap|tutorial|cheat[-\s]?sheet)\b/i;
const EXCLUDED_DEEP_IDENTITY_RE = /\b(awesome|course|courses|tutorial|tutorials|teaching|curriculum|lesson|lessons|book|books|roadmap|dotfiles|cheatsheet|cookbook|clone|starter|template|boilerplate|from[-\s]?scratch|skill|skills)\b/i;
const BIG_TECH_ORG_RE = /^(microsoft|google|google-deepmind|deepmind|openai|anthropics?|meta|facebookresearch|apple|amazon-science|aws|nvidia|huggingface|bytedance|qwenlm|alibaba|baidu|tencent|stanford-oval|stanfordnlp|mit|berkeleyai|openbmb)$/i;
const ARXIV_RE = /\barxiv\.org\b|\barxiv:\s*\d{4}\.\d{4,5}\b/i;

const PACKAGE_FILE_KEYS = [
  "package_json",
  "pyproject_toml",
  "cargo_toml",
  "requirements_txt",
  "docker_compose_yml",
  "dockerfile",
];
const ARCHITECTURE_IDEA_TYPES = new Set(["agent-infra", "functional", "finance_agent", "research", "devtool"]);
const DEEP_WINDOW_SOFT_CAP = 12;
const DEEP_MIN_STARS_GAINED = 3000;   // 本月新增 star 速度门(验证信号,必要不充分);旧值 20 太松→24个深扒
const DEEP_QUALITY_THRESHOLD = 80;    // 质量分门;旧值 75 不区分
const DEEP_ELITE_SCORE = 90;          // ≥90 精英直通(质量极高则放宽 star 速度要求)

export function scoreProject(evidenceSignals = {}) {
  const signals = normalizeEvidenceSignals(evidenceSignals);
  const canonical = scoreCanonicalProject(signals);
  const signal = scoreDeterministicSignals(signals);
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
    signal_score: signal.total,
    signal_subscores: signal.subscores,
    signal_reasons: signal.reasons,
    project_tier: canonical.project_tier,
    project_bucket: canonical.project_bucket,
    bucket: canonical.project_bucket,
    canonical_score: canonical.score,
    canonical_subscores: canonical.subscores,
    canonical_reasons: canonical.reasons,
    requires_manual_confirmation: canonical.requires_manual_confirmation,
    model_tier: canonical.model_tier,
    ranking_reasons: unique([...signal.reasons, ...canonical.reasons, ...reasons]).slice(0, 20),
  };
}

export function decideProjectDepth({ ranking, evidence_signals: inputSignals } = {}) {
  const evidence_signals = normalizeEvidenceSignals(inputSignals);
  const scored = ranking || scoreProject(evidence_signals);
  const canonical = scoreCanonicalProject(evidence_signals);
  const signalScore = Number(scored.signal_score ?? canonical.score ?? scored.total ?? 0);
  const depthGate = depthGateForV2({ signals: evidence_signals, signalScore });
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

  const aiResourceOrTeaching = isAiRelevant(evidence_signals)
    && (isResourceProject(evidence_signals) || isAwesomeCourseTutorialList(evidence_signals) || isExcludedDeepDiveIdentity(evidence_signals));
  if (canonical.project_tier === 0 && !aiResourceOrTeaching) {
    max_allowed_depth = "list_only";
    rejection_reasons.push(`bucket:${canonical.project_bucket}`);
  } else if (canonical.project_tier === 0 && aiResourceOrTeaching) {
    max_allowed_depth = minDepth(max_allowed_depth, "light");
    rejection_reasons.push(`bucket:${canonical.project_bucket}:max_light`);
  }

  const tierDepth = depthGate.depth;
  const final_depth = needs_enrichment && evidence_signals.readme_fetch_failed
    ? "needs_enrichment"
    : minDepth(tierDepth, max_allowed_depth);
  const final_project_tier = projectTierForDepthName(final_depth);
  const final_model_tier = modelForProjectTier(final_project_tier);
  const manualReasons = final_project_tier === 3 ? ["manual_confirmation_required"] : [];

  return {
    ranking_score: signalScore,
    ranking: { ...scored, ...canonical, total: signalScore },
    max_allowed_depth,
    final_depth,
    depth_gate_band: depthGate.band,
    depth_band: final_depth === "analysis" ? "standard" : final_depth,
    analysis_depth: final_depth === "analysis" ? "standard" : final_depth,
    project_tier: final_project_tier,
    project_tier_label: `Tier ${final_project_tier}`,
    scored_project_tier: canonical.project_tier,
    project_bucket: canonical.project_bucket,
    bucket: canonical.project_bucket,
    model_tier: final_model_tier,
    requires_manual_confirmation: final_project_tier === 3,
    ranking_reasons: unique([...(depthGate.reasons || []), ...manualReasons, ...(canonical.reasons || []), ...(scored.ranking_reasons || [])]),
    rejection_reasons: unique([...rejection_reasons, ...(depthGate.rejections || [])]),
    evidence_signals,
    recommended_action: recommendedAction(final_depth, scored.total, needs_enrichment),
    needs_enrichment,
    review_verdict: isBriefDepth(final_depth) ? "pending" : "not_applicable",
    review_issues: [],
  };
}

export function applyDailyDepthTargets(items = [], options = {}) {
  const softCap = numberOption(options.deepWindowSoftCap ?? process.env.PROJECT_DEEP_WINDOW_SOFT_CAP, DEEP_WINDOW_SOFT_CAP);
  const deepCandidates = [...items]
    .filter((item) => normalizeDepth((item.eval || item)?.final_depth || (item.eval || item)?.depth_decision?.final_depth) === "deep")
    .sort((left, right) => {
      const compositeDelta = deepCompositeScore(right) - deepCompositeScore(left);
      if (compositeDelta) return compositeDelta;
      return sourceRank(left) - sourceRank(right);
    });
  const acceptedDeep = new Set();
  const windowCounts = new Map();

  for (const item of deepCandidates) {
    const windows = candidateWindows(item);
    if (windows.some((window) => (windowCounts.get(window) || 0) >= softCap)) continue;
    acceptedDeep.add(itemKey(item));
    for (const window of windows) windowCounts.set(window, (windowCounts.get(window) || 0) + 1);
  }

  for (const item of items) {
    const evalResult = item.eval || item;
    const originalDepth = normalizeDepth(evalResult.final_depth || evalResult.depth_decision?.final_depth);
    const decision = cloneDecision(evalResult.depth_decision || evalResult);
    const finalDepth = originalDepth === "deep" && !acceptedDeep.has(itemKey(item)) ? "analysis" : originalDepth;
    decision.final_depth = finalDepth;
    decision.depth_band = finalDepth === "analysis" ? "standard" : finalDepth;
    decision.analysis_depth = finalDepth === "analysis" ? "standard" : finalDepth;
    if (originalDepth === "deep" && finalDepth !== "deep") {
      decision.rejection_reasons = unique([...asArray(decision.rejection_reasons), "deep_window_soft_cap"]);
      decision.ranking_reasons = unique([...asArray(decision.ranking_reasons), `deep_window_soft_cap:${softCap}`]);
    }
    decision.project_tier = projectTierForDepthName(finalDepth);
    decision.project_tier_label = `Tier ${decision.project_tier}`;
    decision.model_tier = modelForProjectTier(decision.project_tier);
    decision.requires_manual_confirmation = decision.project_tier === 3;
    decision.recommended_action = recommendedAction(finalDepth, Number(decision.ranking_score ?? evalResult.score ?? 0), decision.needs_enrichment);
    evalResult.final_depth = finalDepth;
    evalResult.depth_band = decision.depth_band;
    evalResult.analysis_depth = decision.analysis_depth;
    evalResult.project_tier = decision.project_tier;
    evalResult.project_tier_label = decision.project_tier_label;
    evalResult.model_tier = decision.model_tier;
    evalResult.requires_manual_confirmation = decision.requires_manual_confirmation;
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

export function depthForProjectTier(tier) {
  const value = Number(tier);
  if (value >= 3) return "deep";
  if (value === 2) return "analysis";
  if (value === 1) return "light";
  return "list_only";
}

function projectTierForDepthName(depth) {
  if (depth === "deep") return 3;
  if (depth === "analysis") return 2;
  if (depth === "light") return 1;
  return 0;
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
    owner_type: clean(input.owner_type || input.ownerType),
    repo: clean(input.repo || input.name),
    url: clean(input.url),
    trend_sources: asArray(input.trend_sources || input.trendSources || input.appears_in_tabs || input.appearsInTabs).map(normalizeTrendSource),
    appears_in_tabs: asArray(input.appears_in_tabs || input.appearsInTabs || input.trend_sources || input.trendSources).map(normalizeTab),
    stars: Number(input.stars ?? input.total_stars ?? input.totalStars) || 0,
    total_stars: Number(input.total_stars ?? input.totalStars ?? input.stars) || 0,
    forks: Number(input.forks) || 0,
    stars_today: Number(input.stars_today ?? input.starsToday ?? input.starsGained ?? input.stars_in_period ?? input.starsInPeriod) || 0,
    stars_in_period: Number(input.stars_in_period ?? input.starsInPeriod ?? input.stars_today ?? input.starsToday ?? input.starsGained) || 0,
    stars_gained_by_window: normalizeStarsGainedByWindow(input.stars_gained_by_window || input.starsGainedByWindow),
    ranks_by_window: normalizeRanksByWindow(input.ranks_by_window || input.ranksByWindow || input.current_ranks_by_window || input.currentRanksByWindow),
    source_provenance: asArray(input.source_provenance || input.sourceProvenance || input.provenance),
    source_count: Number(input.source_count ?? input.sourceCount) || 0,
    hn_points: Number(input.hn_points ?? input.hnPoints) || 0,
    hn_comments: Number(input.hn_comments ?? input.hnComments) || 0,
    hf_likes: Number(input.hf_likes ?? input.hfLikes) || 0,
    hf_downloads: Number(input.hf_downloads ?? input.hfDownloads) || 0,
    language: clean(input.language),
    topics: asArray(input.topics).map(clean).filter(Boolean),
    description: clean(input.description),
    created_at: clean(input.created_at || input.createdAt),
    updated_at: clean(input.updated_at || input.updatedAt),
    pushed_at: clean(input.pushed_at || input.pushedAt || input.updated_at || input.updatedAt),
    homepage: clean(input.homepage),
    releases: Number(input.releases) || 0,
    open_issues: Number(input.open_issues ?? input.openIssues) || 0,
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
    has_ci: Boolean(input.has_ci ?? input.hasCi),
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
    has_ci: signals.has_ci,
    has_cli: signals.has_cli,
    has_agents: signals.has_agents,
    has_mcp: signals.has_mcp,
    has_skills: signals.has_skills,
    has_models: signals.has_models,
    has_demo: signals.has_demo,
    package_files: signals.package_files,
    stars_gained_by_window: signals.stars_gained_by_window,
    source_count: effectiveSourceCount(signals),
    signal_subscores: scoreDeterministicSignals(signals).subscores,
    project_tier: signals.project_tier,
    project_bucket: signals.project_bucket,
  };
}

export function scoreCanonicalProject(inputSignals = {}) {
  const signals = normalizeEvidenceSignals(inputSignals);
  const bucket = classifyProjectBucket(signals);
  const deepGate = deepDiveEligibility(signals);
  const reasons = [`bucket:${bucket}`];
  const subscores = {
    relevance_gate: isAiRelevant(signals) ? 1 : 0,
    real_project_gate: bucket === "真·新项目" ? 1 : 0,
    novelty: noveltyAxis(signals, reasons),
    heat_quality: heatQualityAxis(signals, reasons),
    endorsement: endorsementAxis(signals, reasons),
  };

  if (!subscores.relevance_gate || bucket === "无关类") {
    return canonicalResult({ tier: 0, bucket, score: 0, subscores, reasons: [...reasons, "gate:irrelevant_to_ai"] });
  }
  if (bucket === "资源类" || bucket === "老回潮") {
    return canonicalResult({ tier: 0, bucket, score: 10, subscores, reasons: [...reasons, "gate:not_real_new_project"] });
  }

  const realNewProject = isRealNewProject(signals);
  if (realNewProject) reasons.push("gate:real_new_project");

  const score = Math.min(100, Math.round(
    45
      + subscores.novelty
      + subscores.heat_quality
      + subscores.endorsement,
  ));
  let tier = 1;
  const eliteBypass = deepGate.typeEligible && score >= DEEP_ELITE_SCORE; // 质量极高,放宽 star 速度
  if ((deepGate.eligible && score >= DEEP_QUALITY_THRESHOLD) || eliteBypass) {
    tier = 3;
    reasons.push(`deep_gate:type:${deepGate.idea_type}`);
    reasons.push(`deep_gate:stars_gained=${deepGate.maxStarsGained}`);
    reasons.push(eliteBypass && !deepGate.eligible ? `deep_gate:elite_score=${score}` : "deep_gate:quality_pass");
    reasons.push("manual_confirmation_required");
  } else if (realNewProject && isTier2Project({ signals, score, subscores })) {
    tier = 2;
  }
  reasons.push(...deepGate.reasons);

  return canonicalResult({ tier, bucket, score, subscores, reasons });
}

export function classifyProjectBucket(inputSignals = {}) {
  const signals = normalizeEvidenceSignals(inputSignals);
  if (isResourceProject(signals)) return "资源类";
  if (isOldComeback(signals)) return "老回潮";
  if (!isAiRelevant(signals)) return "无关类";
  return "真·新项目";
}

export function minDepth(left, right) {
  return (DEPTH_ORDER[left] ?? 0) <= (DEPTH_ORDER[right] ?? 0) ? left : right;
}

export function classifyArchitectureIdeaType(inputSignals = {}) {
  const signals = normalizeEvidenceSignals(inputSignals);
  const text = [signals.repo, signals.description, signals.raw_readme, ...(signals.topics || [])].join("\n");
  if (/\b(finance|financial|fintech|trading|stock|stocks|crypto|defi|accounting|tax|invoice|payment)\b/i.test(text) && (signals.has_agents || signals.has_mcp)) return "finance_agent";
  if (signals.has_agents || signals.has_mcp || /\b(agent runtime|agent framework|orchestration|workflow engine|tool calling|multi-agent|memory framework)\b/i.test(text)) return "agent-infra";
  if (signals.has_cli || /\b(devtool|developer tool|coding agent|code assistant|cli|command line|terminal|plugin|sdk|api server)\b/i.test(text)) return "devtool";
  if (/\b(research|paper|arxiv|benchmark|eval|evaluation|harness|dataset|leaderboard|experiment)\b/i.test(text)) return "research";
  if (/\b(functional|library|framework|runtime|engine|server|package|workflow|pipeline)\b/i.test(text)) return "functional";
  return "";
}

export function isArchitectureIdeaProject(inputSignals = {}) {
  return ARCHITECTURE_IDEA_TYPES.has(classifyArchitectureIdeaType(inputSignals));
}

export function deepDiveEligibility(inputSignals = {}, options = {}) {
  const signals = normalizeEvidenceSignals(inputSignals);
  const threshold = numberOption(options.deepMinStarsGained ?? process.env.PROJECT_DEEP_MIN_STARS_GAINED, DEEP_MIN_STARS_GAINED);
  const ideaType = classifyArchitectureIdeaType(signals);
  const maxStarsGained = maxWindowStarsGained(signals);
  const reasons = [];
  if (!ideaType) reasons.push("deep_gate:non_architecture_type");
  if (isResourceProject(signals) || isExcludedDeepDiveIdentity(signals)) reasons.push("deep_gate:excluded_resource_teaching_list");
  if (!hasSubstantiveCode(signals)) reasons.push("deep_gate:no_substantive_code");
  if (maxStarsGained < threshold) reasons.push(`deep_gate:stars_gained_below_${threshold}`);
  // typeEligible = 过类型/排除/代码门(不含 star 速度门),供 ≥90 精英直通用
  const typeEligible = Boolean(ideaType && !isResourceProject(signals) && !isExcludedDeepDiveIdentity(signals) && hasSubstantiveCode(signals));
  return {
    eligible: Boolean(typeEligible && maxStarsGained >= threshold),
    typeEligible,
    idea_type: ideaType,
    maxStarsGained,
    threshold,
    reasons,
  };
}

export function scoreDeterministicSignals(inputSignals = {}) {
  const signals = normalizeEvidenceSignals(inputSignals);
  const reasons = [];
  const subscores = {
    star_velocity: starVelocitySubscore(signals, reasons),
    cross_source: crossSourceSubscore(signals, reasons),
    topic_fit: topicFitSubscore(signals, reasons),
    maturity: maturitySubscore(signals, reasons),
    blacklist_penalty: blacklistPenalty(signals, reasons),
  };
  const positive = subscores.star_velocity + subscores.cross_source + subscores.topic_fit + subscores.maturity;
  const total = clampScore(positive - subscores.blacklist_penalty, 0, 100);
  return { total, subscores, reasons: unique(reasons) };
}

function depthGateForV2({ signals, signalScore }) {
  const projectType = projectTypeForDepthGate(signals);
  const monthlyTop10 = Number(signals.ranks_by_window?.monthly) > 0 && Number(signals.ranks_by_window.monthly) <= 10;
  const teachingOrSkill = isAwesomeCourseTutorialList(signals) || isExcludedDeepDiveIdentity(signals) || projectType === "template_boilerplate";
  const architectureType = ["agent_framework", "model_infra", "ai_app"].includes(projectType);
  const standardType = ["devtool_cli", "library_sdk", "dataset_benchmark"].includes(projectType);
  const maturity = scoreDeterministicSignals(signals).subscores.maturity;
  const reasons = [`project_type:${projectType}`, `signal_score:${signalScore}`];
  const rejections = [];

  if (teachingOrSkill) {
    rejections.push("depth_gate:teaching_skill_or_resource_max_light");
    return { band: "light", depth: "light", reasons, rejections };
  }
  if ((architectureType && signalScore >= 78) || monthlyTop10 || (architectureType && hasArxivEndorsement(signals) && signalScore >= 52)) {
    if (monthlyTop10) reasons.push("depth_gate:monthly_top10_default_deep");
    else if (hasArxivEndorsement(signals)) reasons.push("deep_gate:arxiv_backed_architecture_signal");
    else reasons.push("deep_gate:architecture_type_signal_deep");
    return { band: "deep", depth: "deep", reasons, rejections };
  }
  if ((architectureType && signalScore >= 52 && maturity >= 10) || (standardType && signalScore >= 60) || signalScore >= 72) {
    reasons.push("depth_gate:standard_threshold");
    return { band: "standard", depth: "analysis", reasons, rejections };
  }
  reasons.push("depth_gate:light_default");
  return { band: "light", depth: "light", reasons, rejections };
}

function starVelocitySubscore(signals, reasons) {
  const monthly = Math.max(
    Number(signals.stars_gained_by_window?.monthly) || 0,
    Number(signals.stars_in_period) || 0,
    Number(signals.stars_today) || 0,
  );
  const totalStars = Number(signals.total_stars || signals.stars) || 0;
  const velocity = Math.min(24, Math.round((Math.log10(monthly + 1) / Math.log10(5001)) * 24));
  const total = totalStars >= 20000 ? 6 : totalStars >= 5000 ? 4 : totalStars >= 1000 ? 2 : totalStars >= 300 ? 1 : 0;
  if (monthly > 0) reasons.push(`signal:star_velocity:${monthly}`);
  if (total > 0) reasons.push(`signal:total_stars:${totalStars}`);
  return Math.min(30, velocity + total);
}

function crossSourceSubscore(signals, reasons) {
  const count = effectiveSourceCount(signals);
  let score = 0;
  if (count >= 4) score = 20;
  else if (count === 3) score = 16;
  else if (count === 2) score = 12;
  else if (count === 1) score = 4;
  if (score) reasons.push(`signal:cross_source:${count}`);
  if (signals.hn_points > 0) {
    score += Math.min(6, Math.floor(Number(signals.hn_points) / 50) + Math.floor(Number(signals.hn_comments) / 40));
    reasons.push(`signal:hn:${signals.hn_points}pts/${signals.hn_comments}comments`);
  }
  if (signals.hf_likes > 0 || signals.hf_downloads > 0) {
    score += Math.min(4, Math.floor(Number(signals.hf_likes) / 25) + Math.floor(Number(signals.hf_downloads) / 10000));
    reasons.push("signal:huggingface_linked");
  }
  return Math.min(24, score);
}

function topicFitSubscore(signals, reasons) {
  const text = evidenceText(signals);
  let score = 0;
  const matches = [];
  for (const [label, regex, points] of [
    ["agent", AGENT_RE, 8],
    ["memory", /\b(memory|context|long[-\s]?term|recall|episodic)\b/i, 6],
    ["eval", EVAL_RE, 5],
    ["rag", /\b(rag|retrieval|embedding|vector|search)\b/i, 4],
    ["self_evo", /\b(self[-\s]?(improv|evolv)|auto[-\s]?improv|reflection|feedback loop)\b/i, 5],
    ["mcp", MCP_RE, 4],
  ]) {
    if (regex.test(text)) {
      score += points;
      matches.push(label);
    }
  }
  if (matches.length) reasons.push(`signal:topic_fit:${matches.join(",")}`);
  return Math.min(26, score);
}

function maturitySubscore(signals, reasons) {
  let score = 0;
  if (signals.has_tests) { score += 5; reasons.push("signal:maturity:tests"); }
  if (signals.has_ci) { score += 4; reasons.push("signal:maturity:ci"); }
  if (signals.has_docs) { score += 4; reasons.push("signal:maturity:docs"); }
  if (signals.has_examples || signals.has_demo) { score += 3; reasons.push("signal:maturity:examples"); }
  if (signals.has_install) { score += 2; reasons.push("signal:maturity:install"); }
  if (Number(signals.releases) > 0) { score += 2; reasons.push("signal:maturity:release"); }
  return Math.min(20, score);
}

function blacklistPenalty(signals, reasons) {
  let penalty = 0;
  if (isResourceProject(signals) || isAwesomeCourseTutorialList(signals)) {
    penalty += 28;
    reasons.push("signal:penalty:resource_or_course");
  }
  if (isExcludedDeepDiveIdentity(signals)) {
    penalty += 16;
    reasons.push("signal:penalty:excluded_deep_identity");
  }
  if (!isAiRelevant(signals)) {
    penalty += 35;
    reasons.push("signal:penalty:non_ai_eng");
  }
  if (isPlainUiWrapper(signals)) {
    penalty += 18;
    reasons.push("signal:penalty:plain_ui_wrapper");
  }
  return Math.min(50, penalty);
}

function effectiveSourceCount(signals) {
  const families = new Set();
  for (const source of [
    ...(signals.trend_sources || []),
    ...(signals.source_provenance || []).map((item) => item?.source),
  ]) {
    const raw = String(source || "");
    if (raw.startsWith("github-trending")) families.add("github-trending");
    else if (raw.startsWith("hacker-news")) families.add("hacker-news");
    else if (raw.startsWith("github-search")) families.add("github-search");
    else if (raw.startsWith("huggingface")) families.add("huggingface");
    else if (raw) families.add(raw.split(":")[0]);
  }
  return Math.max(Number(signals.source_count) || 0, families.size);
}

function projectTypeForDepthGate(signals) {
  const text = evidenceText(signals);
  if (!isAiRelevant(signals)) return "non_ai_eng";
  if (signals.has_agents || signals.has_mcp || signals.has_skills || /\b(agent framework|agent runtime|orchestration|planner|tool calling|workflow engine|memory framework)\b/i.test(text)) return "agent_framework";
  if (/\b(dataset|benchmark|eval|evaluation|leaderboard|arena|test set|harness)\b/i.test(text)) return "dataset_benchmark";
  if (signals.has_cli || /\b(coding agent|devtool|developer tool|cli|command line|terminal|shell|code assistant)\b/i.test(text)) return "devtool_cli";
  if (signals.has_models || /\b(model infra|serving|inference|fine[-\s]?tun|training|checkpoint|quantization|vllm|lora|embedding service)\b/i.test(text)) return "model_infra";
  if (/\b(frontend|ui|react|vue|svelte|dashboard|component|chat ui|web app)\b/i.test(text)) return "frontend_ui";
  if (/\b(template|boilerplate|starter|scaffold|example app)\b/i.test(text)) return "template_boilerplate";
  if (hasAnyPackageFile(signals)) return "library_sdk";
  return "ai_app";
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

function canonicalResult({ tier, bucket, score, subscores, reasons }) {
  return {
    project_tier: tier,
    project_tier_label: `Tier ${tier}`,
    project_bucket: bucket,
    bucket,
    score,
    subscores,
    reasons: unique(reasons),
    requires_manual_confirmation: tier === 3,
    model_tier: modelForProjectTier(tier),
  };
}

function modelForProjectTier(tier) {
  if (tier === 3) return "codex:gpt-5.5;model_reasoning_effort=high";
  if (tier === 2) return "deepseek-or-light-codex";
  if (tier === 1) return "cheap-extraction";
  return "none";
}

function isResourceProject(signals) {
  const name = signals.repo || "";
  const description = signals.description || "";
  const language = (signals.language || "").trim().toLowerCase();
  return Boolean(
    RESOURCE_NAME_RE.test(name)
      || RESOURCE_DESC_RE.test(description)
      || language === "none"
      || language === "markdown",
  );
}

function isExcludedDeepDiveIdentity(signals) {
  const identityText = [
    signals.repo,
    signals.description,
    ...(signals.topics || []),
  ].join("\n");
  return EXCLUDED_DEEP_IDENTITY_RE.test(identityText);
}

function isOldComeback(signals) {
  const createdYear = yearFromIso(signals.created_at);
  if (!createdYear) return false;
  const ageYears = currentYear() - createdYear;
  const totalStars = Number(signals.total_stars || signals.stars) || 0;
  const periodStars = Number(signals.stars_in_period || signals.stars_today) || 0;
  const relative = totalStars > 0 ? periodStars / totalStars : 0;
  return ageYears >= 4 && totalStars >= 20000 && (periodStars < 800 || relative < 0.015);
}

function isRealNewProject(signals) {
  const createdYear = yearFromIso(signals.created_at);
  const ageYears = createdYear ? currentYear() - createdYear : null;
  return Boolean(
    isAiRelevant(signals)
      && !isResourceProject(signals)
      && !isOldComeback(signals)
      && hasSubstantiveCode(signals)
      && Number(signals.stars_in_period || signals.stars_today) >= 20
      && (ageYears === null || ageYears <= 2 || heatQualityAxis(signals, []) >= 16),
  );
}

function isAiRelevant(signals) {
  const text = [
    signals.repo,
    signals.description,
    signals.raw_readme,
    ...(signals.topics || []),
    ...(signals.key_files || []),
  ].join("\n");
  return Boolean(
    signals.has_agents
      || signals.has_mcp
      || signals.has_skills
      || signals.has_models
      || AI_TERMS_RE.test(text),
  );
}

function hasSubstantiveCode(signals) {
  const language = (signals.language || "").trim().toLowerCase();
  return Boolean(
    language && language !== "none" && language !== "markdown"
      && (hasArchitecturalDirs(signals) || hasAnyPackageFile(signals) || signals.has_install || signals.has_examples || signals.has_tests),
  );
}

function noveltyAxis(signals, reasons) {
  let score = 0;
  const createdYear = yearFromIso(signals.created_at);
  const ageYears = createdYear ? currentYear() - createdYear : null;
  if (ageYears !== null && ageYears <= 1) {
    score += 10;
    reasons.push("novelty:new_repo");
  } else if (ageYears !== null && ageYears <= 2) {
    score += 6;
    reasons.push("novelty:recent_repo");
  }
  const text = evidenceText(signals);
  if (signals.has_agents || signals.has_mcp || /\b(coding agent|computer use|agent memory|multimodal|browser agent|local-first|rag|eval|benchmark)\b/i.test(text)) {
    score += 10;
    reasons.push("novelty:ai_builder_shape");
  }
  if (signals.has_tests || signals.has_examples || signals.has_docs) {
    score += 4;
    reasons.push("novelty:substantive_artifact");
  }
  return Math.min(25, score);
}

function heatQualityAxis(signals, reasons) {
  let score = 0;
  const periodStars = Number(signals.stars_in_period || signals.stars_today) || 0;
  const createdYear = yearFromIso(signals.created_at);
  const ageYears = createdYear ? Math.max(0.25, currentYear() - createdYear) : 1;
  const velocity = periodStars / ageYears;
  if (velocity >= 1000) score += 14;
  else if (velocity >= 300) score += 11;
  else if (velocity >= 100) score += 8;
  else if (periodStars >= 20) score += 4;
  if (periodStars > 0) reasons.push(`heat:stars_in_period=${periodStars}`);

  const tabs = normalizedTabs(signals);
  if (tabs.length >= 3) {
    score += 10;
    reasons.push("heat:daily_weekly_monthly_coverage");
  } else if (tabs.length === 2) {
    score += 6;
    reasons.push("heat:multi_tab_coverage");
  } else if (tabs.length === 1 && tabs[0] === "daily") {
    score -= 5;
    reasons.push("heat:daily_only_flash_penalty");
  }
  return Math.max(0, Math.min(25, score));
}

function endorsementAxis(signals, reasons) {
  let score = 0;
  if (hasMajorOrgEndorsement(signals)) {
    score += 12;
    reasons.push("endorsement:major_org");
  }
  if (hasArxivEndorsement(signals)) {
    score += 12;
    reasons.push("endorsement:arxiv");
  }
  if (signals.releases > 0) {
    score += 3;
    reasons.push("endorsement:release_signal");
  }
  return Math.min(25, score);
}

function tier3StrongSignals(signals) {
  const out = [];
  if (hasArxivEndorsement(signals)) out.push("tier3:strong_signal:arxiv");
  if (hasMajorOrgEndorsement(signals)) out.push("tier3:strong_signal:major_org");
  if (hasExplicitMethodNovelty(signals)) out.push("tier3:strong_signal:method_novelty");
  if (hasSustainedHighVelocity(signals)) out.push("tier3:strong_signal:sustained_three_tab_velocity");
  return out;
}

function hasArxivEndorsement(signals) {
  if (ARXIV_RE.test(signals.homepage || "")) return true;
  const text = [signals.raw_readme, signals.description].join("\n");
  const arxivUrl = String.raw`(?:https?:\/\/)?(?:www\.)?arxiv\.org\/(?:abs|pdf)\/\d{4}\.\d{4,5}[^\s)"'<]*|arxiv:\s*\d{4}\.\d{4,5}`;
  const paperLabel = String.raw`(?:paper|technical report|tech report|research report|publication)`;
  return Boolean(
    new RegExp(String.raw`\[[^\]]*\b${paperLabel}\b[^\]]*\]\([^)]*${arxivUrl}[^)]*\)`, "i").test(text)
      || new RegExp(String.raw`<a\b[^>]*href=["'][^"']*${arxivUrl}[^"']*["'][^>]*>[^<]*\b${paperLabel}\b[^<]*<\/a>`, "i").test(text)
      || new RegExp(String.raw`<a\b[^>]*href=["'][^"']*${arxivUrl}[^"']*["'][^>]*>[\s\S]{0,240}<(?:img|svg)\b[^>]*(?:alt|title)=["'][^"']*\barxiv\b[^"']*["']`, "i").test(text)
  );
}

function hasMajorOrgEndorsement(signals) {
  return (signals.owner_type || "").toLowerCase() === "org" && BIG_TECH_ORG_RE.test(signals.owner || "");
}

function hasExplicitMethodNovelty(signals) {
  const text = [signals.description, signals.raw_readme].join("\n");
  if (!/\b(novel|new method|new approach|new architecture|new algorithm|paper|state[-\s]?of[-\s]?the[-\s]?art|sota|benchmark)\b/i.test(text)) {
    return false;
  }
  return /\b(tokenizer[-\s]?free|non[-\s]?autoregressive|self[-\s]?supervised|contrastive|diffusion|grpo|reinforcement learning|rl|agentic training|execution feedback|tree search|test[-\s]?time scaling|hybrid attention|mixture[-\s]?of[-\s]?experts|moe|world model|latent|reasoning model)\b/i.test(text);
}

function hasSustainedHighVelocity(signals) {
  if (normalizedTabs(signals).length < 3) return false;
  const periodStars = Number(signals.stars_in_period || signals.stars_today) || 0;
  const ageDays = repoAgeDays(signals);
  const starsPerDay = periodStars / Math.max(1, ageDays);
  return periodStars >= 1500 || starsPerDay >= 25;
}

function isTier2Project({ signals, score, subscores }) {
  if (score >= 89 && subscores.heat_quality >= 20 && subscores.novelty >= 16) return true;
  if (score >= 85 && subscores.heat_quality >= 20 && hasArxivEndorsement(signals)) return true;
  if (
    score >= 76
      && subscores.heat_quality >= 16
      && subscores.novelty >= 14
      && normalizedTabs(signals).length >= 2
      && signals.has_install
      && signals.has_examples
      && signals.has_tests
  ) {
    return true;
  }
  return Boolean(
    score >= 62
      && subscores.novelty >= 14
      && subscores.heat_quality >= 3
      && signals.has_agents
      && signals.has_mcp
      && signals.has_skills
      && signals.has_models
      && signals.has_install
      && signals.has_examples
      && signals.has_tests,
  );
}

function normalizedTabs(signals) {
  return unique([
    ...(signals.appears_in_tabs || []),
    ...(signals.trend_sources || []).map(normalizeTab),
  ].map(normalizeTab).filter(Boolean));
}

function maxWindowStarsGained(signals = {}) {
  const byWindow = signals.stars_gained_by_window || {};
  const values = Object.values(byWindow).map(Number).filter(Number.isFinite);
  if (values.length) return Math.max(...values);
  return Number(signals.stars_in_period || signals.stars_today) || 0;
}

function deepCompositeScore(item) {
  const evalResult = item.eval || item;
  const signals = normalizeEvidenceSignals(evalResult.evidence_signals || evalResult.depth_decision?.evidence_signals || {});
  const score = Number(evalResult.ranking_score ?? evalResult.score ?? evalResult.depth_decision?.ranking_score) || 0;
  const velocity = maxWindowStarsGained(signals);
  const totalStars = Number(signals.total_stars || signals.stars) || 0;
  const freshnessRatio = totalStars > 0 ? velocity / totalStars : 0;
  return score * 1000 + Math.min(500, velocity) + Math.min(100, Math.round(freshnessRatio * 1000));
}

function candidateWindows(item) {
  const repo = item.candidate?.raw || item.raw || {};
  const evalResult = item.eval || item;
  const signals = normalizeEvidenceSignals(evalResult.evidence_signals || evalResult.depth_decision?.evidence_signals || {});
  const windows = unique([
    ...(Array.isArray(repo.windows) ? repo.windows : []),
    ...normalizedTabs(signals),
  ].map(normalizeTab).filter(Boolean));
  return windows.length ? windows : ["radar"];
}

function itemKey(item) {
  return item.candidate?.id || item.id || item.candidate?.raw?.fullName || item.raw?.fullName || JSON.stringify(item);
}

function normalizeTrendSource(value) {
  const tab = normalizeTab(value);
  return tab ? `github-trending:${tab}` : clean(value);
}

function normalizeTab(value) {
  const raw = clean(value).toLowerCase();
  if (raw.includes("daily")) return "daily";
  if (raw.includes("weekly")) return "weekly";
  if (raw.includes("monthly")) return "monthly";
  return "";
}

function yearFromIso(value) {
  const match = String(value || "").match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function repoAgeDays(signals) {
  const timestamp = Date.parse(signals.created_at || "");
  if (!Number.isFinite(timestamp)) return 365;
  const now = Date.now();
  if (timestamp > now) return 1;
  return Math.max(1, Math.ceil((now - timestamp) / 86400000));
}

function currentYear() {
  return new Date().getUTCFullYear();
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

function normalizeStarsGainedByWindow(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const tab = normalizeTab(key);
    const gained = Number(value);
    if (tab && Number.isFinite(gained)) out[tab] = gained;
  }
  return out;
}

function normalizeRanksByWindow(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const tab = normalizeTab(key);
    const rank = Number(value);
    if (tab && Number.isFinite(rank)) out[tab] = rank;
  }
  return out;
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
    depth_band: value.depth_band || value.depthBand || "",
    analysis_depth: value.analysis_depth || value.analysisDepth || "",
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

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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
