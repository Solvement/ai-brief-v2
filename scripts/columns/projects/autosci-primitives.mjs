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

export async function emitProjectAutoSciPrimitive({
  candidate,
  evidence = {},
  triage = {},
  deepDive = {},
  finalDepth = triage.final_depth || triage.depth_decision?.final_depth,
  options = {},
} = {}) {
  if (finalDepth !== "deep") return null;
  const repo = candidate?.raw || candidate || {};
  const signals = normalizeEvidenceSignals(
    evidence?.evidenceSignals
      || evidence?.evidence_signals
      || evidence?.metadata?.evidenceSignals
      || evidence?.metadata?.evidence_signals
      || triage?.evidence_signals
      || triage?.depth_decision?.evidence_signals
      || {},
  );
  const projectType = normalizeProjectType(deepDive.project_type || triage.project_type);
  if (triage.intent === "teaching") return null;
  if (projectType && !AUTOSCI_PROJECT_TYPES.has(projectType)) return null;
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
    risks: riskList(deepDive),
    status: "extracted",
    extracted_at: options.now?.() || new Date().toISOString(),
  };
}

function reusableText(deepDive = {}) {
  const items = deepDive.tier_template?.reusable_abstractions?.items;
  if (Array.isArray(items) && items.length) {
    return items
      .map((item) => `${clean(item.name)}: ${clean(item.copy || item.why_it_matters || item.skip)}`)
      .filter((item) => item.replace(/[:\s]/g, ""))
      .join(" ");
  }
  return clean(deepDive.tier_template?.reusable_abstractions?.body_md);
}

function componentList({ deepDive = {}, signals = {}, ideaType = "" } = {}) {
  const items = [];
  if (signals.has_agents || ideaType === "agent-infra") items.push("agent_orchestrator");
  if (signals.has_mcp) items.push("tool_protocol_adapter");
  if (signals.has_cli) items.push("developer_control_surface");
  if (signals.has_models) items.push("model_or_retrieval_layer");
  if (signals.has_tests) items.push("validation_harness");
  const abstractions = deepDive.tier_template?.reusable_abstractions?.items || [];
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
  const flow = clean(deepDive.tier_template?.how_it_works?.body_md || deepDive.howItWorks);
  return `Rebuild the ${ideaType} pattern from ${fullName} as a small AutoSci module: extract the control flow, define typed inputs/outputs, run it on one synthetic research task, and log traces plus validation results.${flow ? ` Reference flow: ${flow.slice(0, 500)}` : ""}`;
}

function smallExperiment({ fullName, ideaType } = {}) {
  return `Compare baseline free-form execution against the extracted ${ideaType} pattern from ${fullName} on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.`;
}

function riskList(deepDive = {}) {
  const risks = [];
  const limits = Array.isArray(deepDive.limitations) ? deepDive.limitations : [];
  for (const item of limits) risks.push(clean(item?.body || item?.title || item));
  const dependency = deepDive.tier_template?.dependency_platform_risk?.items || [];
  for (const item of dependency) risks.push(clean(`${item?.dependency || "dependency"}: ${item?.what_if_change || item?.mitigation_or_unknown || ""}`));
  return unique(risks.filter(Boolean)).slice(0, 6).concat(["over_transfer"]).slice(0, 7);
}

function renderYaml(value = {}) {
  const lines = [];
  const scalarKeys = ["primitive_id", "source_project", "source_url", "title", "relevance_level", "audience", "problem_class", "status", "extracted_at"];
  for (const key of scalarKeys) lines.push(`${key}: ${quoteYaml(value[key])}`);
  lines.splice(6, 0, "core_pattern: >", indentFold(value.core_pattern));
  for (const key of ["components", "autosci_modules", "inputs", "outputs", "risks"]) {
    lines.push(`${key}:`);
    for (const item of value[key] || []) lines.push(`  - ${quoteYaml(item)}`);
  }
  lines.push("implementation_idea: >", indentFold(value.implementation_idea));
  lines.push("small_experiment: >", indentFold(value.small_experiment));
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

## Risks
${(value.risks || []).map((risk) => `- ${risk}`).join("\n") || "- not_extracted"}
`;
}

function normalizeProjectType(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
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
