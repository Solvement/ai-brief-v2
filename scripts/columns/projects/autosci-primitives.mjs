import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyArchitectureIdeaType,
  isArchitectureIdeaProject,
  normalizeEvidenceSignals,
} from "./project-ranking.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT_DIR = path.join(ROOT, "data", "autosci", "primitives");
const AUTOSCI_PROJECT_TYPES = new Set(["agent_framework", "devtool_cli", "model_infra", "dataset_benchmark", "library_sdk", "ai_app"]);
const NON_AUTOSCI_PROJECT_TYPES = new Set(["frontend_ui", "template_boilerplate", "non_ai_eng"]);
const TEACHING_INTENTS = new Set(["teaching", "learning", "education", "course", "tutorial", "resource"]);
const TEACHING_IDENTITY_RE = /\b(awesome|course|courses|tutorial|tutorials|teaching|curriculum|lesson|lessons|book|books|roadmap|cheatsheet|from[-\s]?scratch|starter|template|boilerplate|workshop|playbook)\b/i;
const SKILL_PACK_RE = /\b(skill|skills|workflow pack|prompt pack)\b/i;
const ARCHITECTURE_COUNTERSIGNAL_RE = /\b(runtime|framework|platform|server|sdk|api|orchestration|agent framework|tool server|model context protocol|mcp)\b/i;

export async function emitProjectAutoSciPrimitive({
  candidate,
  evidence = {},
  triage = {},
  deepDive = {},
  finalDepth = triage.final_depth || triage.depth_decision?.final_depth,
  options = {},
} = {}) {
  if (!isDeepFinalDepth(finalDepth)) return null;
  const repo = candidate?.raw || candidate || {};
  const signals = extractEvidenceSignals({ candidate, evidence, triage, deepDive });
  const projectType = normalizeProjectType(
    deepDive.project_type
      || deepDive.projectType
      || deepDive.project_verdict?.project_type
      || deepDive.tier_template?.project_type
      || deepDive.light_spine?.project_type
      || triage.project_type
      || triage.projectType,
  );
  if (!isAutosciProjectType(projectType)) return null;
  if (isTeachingOrSkillProject({ repo, signals, triage, deepDive, projectType })) return null;
  if (!isArchitectureIdeaProject(signals)) return null;

  const primitive = buildPrimitive({ repo, signals, triage, deepDive, options });
  const slug = primitive.primitive_id;
  const outDir = options.autosciPrimitiveDir ? path.resolve(ROOT, options.autosciPrimitiveDir) : OUT_DIR;
  await mkdir(outDir, { recursive: true });
  const yamlPath = path.join(outDir, `${slug}.yaml`);
  const mdPath = path.join(outDir, `${slug}.md`);
  await writeFile(yamlPath, renderYaml(primitive), "utf8");
  await writeFile(mdPath, renderMarkdown(primitive), "utf8");
  return {
    primitive_id: slug,
    paths: {
      yaml: yamlPath,
      md: mdPath,
    },
  };
}

function buildPrimitive({ repo = {}, signals = {}, triage = {}, deepDive = {}, options = {} } = {}) {
  const fullName = repo.fullName || `${signals.owner || "unknown"}/${signals.repo || repo.name || "project"}`;
  const ideaType = classifyArchitectureIdeaType(signals) || "functional";
  const reusable = reusableText(deepDive);
  const title = `${fullName} reusable architecture pattern`;
  const corePattern = reusable
    || clean(deepDive.memory_card?.architecture_pattern)
    || clean(deepDive.tier_template?.how_it_works?.body_md)
    || clean(deepDive.howItWorks)
    || clean(triage.tldr || repo.description)
    || "Reusable project architecture pattern extracted from a deep-analyzed repository.";
  const risks = riskList(deepDive);

  return {
    primitive_id: `proj-${slugify(fullName.replace("/", "-"))}`,
    source_project: fullName,
    source_url: repo.url || signals.url || (fullName.includes("/") ? `https://github.com/${fullName}` : ""),
    title,
    relevance_level: "project_pattern",
    audience: "ai_only",
    core_pattern: corePattern,
    problem_class: problemClassForIdeaType(ideaType),
    components: componentList({ deepDive, signals, ideaType }),
    autosci_modules: autosciModulesForIdeaType(ideaType),
    inputs: ["task_spec", "repo_or_runtime_context", "tool_or_model_interfaces", "budget_and_validation_policy"],
    outputs: ["working_artifact", "execution_trace", "reusable_architecture_notes", "failure_or_risk_report"],
    implementation_idea: implementationIdea({ fullName, ideaType, deepDive }),
    small_experiment: smallExperiment({ fullName, ideaType }),
    design_principles: designPrincipleList({ fullName, ideaType, deepDive, corePattern, risks }),
    risks,
    status: "extracted",
    extracted_at: options.now?.() || new Date().toISOString(),
  };
}

function reusableText(deepDive = {}) {
  const items = reusableAbstractionItems(deepDive);
  if (Array.isArray(items) && items.length) {
    return items
      .map((item) => `${clean(item.name)}: ${clean(item.copy || item.why_it_matters || item.skip)}`)
      .filter((item) => item.replace(/[:\s]/g, ""))
      .join(" ");
  }
  return firstClean(
    deepDive.tier_template?.reusable_abstractions?.body_md,
    deepDive.light_spine?.reusable_abstractions?.body_md,
    deepDive.builder_reuse?.pattern,
    deepDive.builder_reuse?.copy,
    deepDive.memory_card?.reusable_pattern,
    deepDive.reasoning_trace?.transfer_decision,
  );
}

function componentList({ deepDive = {}, signals = {}, ideaType = "" } = {}) {
  const items = [];
  if (signals.has_agents || ideaType === "agent-infra") items.push("agent_orchestrator");
  if (signals.has_mcp) items.push("tool_protocol_adapter");
  if (signals.has_cli) items.push("developer_control_surface");
  if (signals.has_models) items.push("model_or_retrieval_layer");
  if (signals.has_tests) items.push("validation_harness");
  const abstractions = reusableAbstractionItems(deepDive);
  for (const item of abstractions) {
    const name = slugify(item?.name || "");
    if (name) items.push(name);
  }
  return unique(items).slice(0, 8);
}

function autosciModulesForIdeaType(ideaType) {
  const base = ["pattern_library", "experiment_runner"];
  if (ideaType === "agent-infra" || ideaType === "finance_agent") return [...base, "agent_runtime", "tool_governance", "trace_memory"];
  if (ideaType === "devtool") return [...base, "developer_tooling", "feedback_loop"];
  if (ideaType === "research") return [...base, "benchmark_harness", "cold_critic"];
  return [...base, "workflow_controller", "typed_memory"];
}

function problemClassForIdeaType(ideaType) {
  return {
    "agent-infra": "reliable-agent-runtime-and-tool-orchestration",
    finance_agent: "domain-agent-workflow-with-validation-and-controls",
    devtool: "developer-facing-ai-automation-with-observable-feedback",
    research: "research-artifact-to-repeatable-evaluation-harness",
    functional: "reusable-ai-system-component-or-workflow",
  }[ideaType] || "reusable-ai-system-component-or-workflow";
}

function implementationIdea({ fullName, ideaType, deepDive = {} } = {}) {
  const flow = firstClean(
    deepDive.tier_template?.how_it_works?.body_md,
    deepDive.light_spine?.how_it_works?.body_md,
    deepDive.tech_breakdown_md,
    deepDive.howItWorks,
  );
  return `Rebuild the ${ideaType} pattern from ${fullName} as a small AutoSci module: extract the control flow, define typed inputs/outputs, run it on one synthetic research task, and log traces plus validation results.${flow ? ` Reference flow: ${flow.slice(0, 500)}` : ""}`;
}

function smallExperiment({ fullName, ideaType } = {}) {
  return `Compare baseline free-form execution against the extracted ${ideaType} pattern from ${fullName} on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.`;
}

function riskList(deepDive = {}) {
  const risks = [];
  const limits = Array.isArray(deepDive.limitations) ? deepDive.limitations : [];
  for (const item of limits) risks.push(clean(item?.body || item?.title || item));
  const dependency = dependencyRiskItems(deepDive);
  for (const item of dependency) risks.push(clean(`${item?.dependency || "dependency"}: ${item?.what_if_change || item?.mitigation_or_unknown || ""}`));
  if (Array.isArray(deepDive.risks)) {
    for (const item of deepDive.risks) risks.push(clean(item?.body || item?.title || item));
  }
  return unique(risks.filter(Boolean)).slice(0, 6).concat(["over_transfer"]).slice(0, 7);
}

function designPrincipleList({ fullName = "project", ideaType = "functional", deepDive = {}, corePattern = "", risks = [] } = {}) {
  const principles = [];
  const reusable = reusableText(deepDive);
  const flow = firstClean(
    deepDive.tier_template?.how_it_works?.body_md,
    deepDive.light_spine?.how_it_works?.body_md,
    deepDive.tech_breakdown_md,
    deepDive.howItWorks,
    deepDive.memory_card?.architecture_pattern,
  );
  const transfer = firstClean(
    deepDive.reasoning_trace?.transfer_decision,
    deepDive.memory_card?.reusable_pattern,
    deepDive.value_to_us?.to_briefmem,
    deepDive.value_to_us?.to_aibrief,
  );

  const add = (id, principle, transfersTo) => {
    const cleanId = slugify(id);
    const cleanPrinciple = clean(principle);
    if (!cleanId || !cleanPrinciple) return;
    principles.push({
      id: cleanId,
      principle: cleanPrinciple,
      transfers_to: clean(transfersTo) || "AutoSci pattern_library and experiment_runner.",
    });
  };

  add(
    `${ideaType}-boundary-as-module`,
    reusable || corePattern,
    transfer || `Extract the reusable ${ideaType} boundary from ${fullName} into a typed AutoSci module.`,
  );
  add(
    `${ideaType}-observable-flow`,
    flow || `Preserve ${fullName}'s control flow as typed inputs, outputs, traces, and validation checkpoints rather than copying product-specific UI or branding.`,
    "Use the flow as an inspectable experiment harness with logs, checkpoints, and failure reports.",
  );
  if (risks.length) {
    add(
      `${ideaType}-risk-first-transfer`,
      `Transfer the architecture together with its main failure boundary: ${risks[0]}.`,
      "Require an explicit dependency and over-transfer risk review before promoting the pattern into AutoSci.",
    );
  }

  return principles.slice(0, 3);
}

function renderYaml(value = {}) {
  const lines = [];
  const scalarKeys = ["primitive_id", "source_project", "source_url", "title", "relevance_level", "audience", "problem_class", "status", "extracted_at"];
  for (const key of scalarKeys) lines.push(`${key}: ${quoteYaml(value[key])}`);
  lines.splice(6, 0, "core_pattern: >", indentFold(value.core_pattern));
  for (const key of ["components", "autosci_modules", "inputs", "outputs"]) {
    lines.push(`${key}:`);
    for (const item of value[key] || []) lines.push(`  - ${quoteYaml(item)}`);
  }
  lines.push("implementation_idea: >", indentFold(value.implementation_idea));
  lines.push("small_experiment: >", indentFold(value.small_experiment));
  lines.push("design_principles:");
  for (const item of value.design_principles || []) {
    lines.push(`  - id: ${quoteYaml(item.id)}`);
    lines.push(`    principle: ${quoteYaml(item.principle)}`);
    lines.push(`    transfers_to: ${quoteYaml(item.transfers_to)}`);
  }
  lines.push("risks:");
  for (const item of value.risks || []) lines.push(`  - ${quoteYaml(item)}`);
  return `${lines.join("\n")}\n`;
}

function renderMarkdown(value = {}) {
  return `<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - ${value.source_project}

## Core Pattern
${value.core_pattern}

## Mapping
- problem_class: ${value.problem_class}
- components: ${(value.components || []).join(", ") || "not_extracted"}
- autosci_modules: ${(value.autosci_modules || []).join(", ") || "not_extracted"}

## Small Experiment
${value.small_experiment}

## Design Principles
${(value.design_principles || []).map((item) => `- ${item.id}: ${item.principle}`).join("\n") || "- not_extracted"}

## Risks
${(value.risks || []).map((risk) => `- ${risk}`).join("\n") || "- not_extracted"}
`;
}

function extractEvidenceSignals({ candidate, evidence = {}, triage = {}, deepDive = {} } = {}) {
  const repo = candidate?.raw || candidate || {};
  const repoIdentity = repoSignalSource(repo);
  const evidenceReadme = evidence?.content ? { raw_readme: evidence.content, readme: evidence.content, readme_found: true, readme_length: String(evidence.content).length } : {};
  return normalizeEvidenceSignals(mergePlain(
    repoIdentity,
    evidenceReadme,
    evidence?.evidenceSignals,
    evidence?.evidence_signals,
    evidence?.metadata?.evidenceSignals,
    evidence?.metadata?.evidence_signals,
    evidence?.payload?.evidenceSignals,
    evidence?.payload?.evidence_signals,
    evidence?.payload?.metadata?.evidenceSignals,
    evidence?.payload?.metadata?.evidence_signals,
    triage?.evidence_summary,
    triage?.evidence_signals,
    triage?.depth_decision?.evidence_summary,
    triage?.depth_decision?.evidence_signals,
    deepDive?.evidence_signals,
    deepDive?.metadata?.evidenceSignals,
  ));
}

function repoSignalSource(repo = {}) {
  const fullName = clean(repo.fullName || repo.full_name);
  const [ownerFromName, repoFromName] = fullName.includes("/") ? fullName.split("/") : ["", ""];
  return {
    owner: repo.owner || ownerFromName,
    repo: repo.name || repoFromName,
    url: repo.url,
    trend_sources: repo.windows?.map((window) => `github-trending:${window}`) || repo.trend_sources,
    appears_in_tabs: repo.windows || repo.appears_in_tabs,
    stars: repo.stars,
    forks: repo.forks,
    stars_today: repo.starsGained,
    stars_in_period: repo.starsGained,
    stars_gained_by_window: repo.starsGainedByWindow || repo.stars_gained_by_window,
    language: repo.language,
    topics: repo.topics,
    description: repo.description,
    created_at: repo.createdAt || repo.created_at,
    updated_at: repo.updatedAt || repo.updated_at,
    license: repo.license,
  };
}

function mergePlain(...values) {
  const out = {};
  for (const value of values) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined || entry === null || entry === "") continue;
      out[key] = entry;
    }
  }
  return out;
}

function isDeepFinalDepth(value) {
  const raw = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return raw === "deep" || raw === "deep_candidate" || raw === "tier3" || raw === "tier_3" || raw === "3";
}

function isAutosciProjectType(projectType) {
  if (!projectType || NON_AUTOSCI_PROJECT_TYPES.has(projectType)) return false;
  return AUTOSCI_PROJECT_TYPES.has(projectType);
}

function isTeachingOrSkillProject({ repo = {}, signals = {}, triage = {}, deepDive = {}, projectType = "" } = {}) {
  if (NON_AUTOSCI_PROJECT_TYPES.has(projectType)) return true;
  const intent = normalizeToken(triage.intent || deepDive.intent || triage.project_intent || deepDive.project_intent);
  if (TEACHING_INTENTS.has(intent)) return true;
  const identityText = [
    repo.fullName,
    repo.name,
    repo.description,
    signals.repo,
    signals.description,
    ...(signals.topics || []),
  ].filter(Boolean).join("\n");
  if (TEACHING_IDENTITY_RE.test(identityText)) return true;
  return SKILL_PACK_RE.test(identityText) && !ARCHITECTURE_COUNTERSIGNAL_RE.test(identityText);
}

function reusableAbstractionItems(deepDive = {}) {
  return [
    ...asArray(deepDive.tier_template?.reusable_abstractions?.items),
    ...asArray(deepDive.light_spine?.reusable_abstractions?.items),
    ...asArray(deepDive.builder_reuse).map((item) => ({
      name: item?.pattern || item?.name || "builder_reuse",
      copy: item?.copy,
      skip: item?.skip,
      why_it_matters: item?.why_it_matters,
    })),
  ].filter((item) => item && typeof item === "object");
}

function dependencyRiskItems(deepDive = {}) {
  return [
    ...asArray(deepDive.tier_template?.dependency_platform_risk?.items),
    ...asArray(deepDive.light_spine?.dependency_platform_risk?.items),
    ...asArray(deepDive.dependency_platform_risk),
  ].filter((item) => item && typeof item === "object");
}

function normalizeProjectType(value) {
  const raw = normalizeToken(value);
  return {
    app: "ai_app",
    ai_application: "ai_app",
    agent: "agent_framework",
    agent_build: "agent_framework",
    agent_runtime: "agent_framework",
    agent_infra: "agent_framework",
    agent_infrastructure: "agent_framework",
    finance_agent: "agent_framework",
    financial_agent: "agent_framework",
    framework: "agent_framework",
    tool_server: "agent_framework",
    mcp_server: "agent_framework",
    devtool: "devtool_cli",
    cli: "devtool_cli",
    coding_agent: "devtool_cli",
    model_infrastructure: "model_infra",
    infra: "model_infra",
    dataset: "dataset_benchmark",
    benchmark: "dataset_benchmark",
    research: "dataset_benchmark",
    eval_harness: "dataset_benchmark",
    library: "library_sdk",
    sdk: "library_sdk",
    functional: "library_sdk",
    template: "template_boilerplate",
    boilerplate: "template_boilerplate",
    frontend: "frontend_ui",
    ui: "frontend_ui",
    non_ai: "non_ai_eng",
  }[raw] || raw;
}

function indentFold(value) {
  return `\n${wrap(clean(value), 96).map((line) => `  ${line}`).join("\n")}`;
}

function quoteYaml(value) {
  const text = clean(value);
  return JSON.stringify(text);
}

function wrap(value, width) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line.length + word.length + 1) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstClean(...values) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "project";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}
