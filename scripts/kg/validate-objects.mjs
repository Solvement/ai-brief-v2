import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = process.cwd();
// slug 段允许点号：arxiv-id slug 形如 2606.05405，对象 ID = 2606.05405.c1（KG-4 波次2，2026-06-12）。
// slug 前缀的精确匹配由下方 id.startsWith(`${slug}.`) 守，这里只校验「以字母数字开头 + 末尾是 {c|m|a|f}{n} 后缀」。
const OBJECT_ID_RE = /^[a-z0-9][a-z0-9.-]*\.(c|m|a|f)\d+$/;
const CLAIM_TYPES = new Set(["fact", "author_claim", "interpretation", "inference"]);
const EXAM_TYPES = new Set(["counterfactual", "boundary", "transfer"]);
const SELF_EVO_STATES = new Set(["apply", "queue", "no"]);
const USE_TYPES = new Set(["directly_usable", "design_inspiration", "background_reference"]);
// 默认前端只渲染 human 块；这些 AI-内部记号若漏进人话层=受众分离破功，硬门拦截（KG-5）。
const HUMAN_LEAK_RE = /\b(paper\/|project\/|derived_by|canonical|conflicts_assumption|distinct_from|\.c\d|\.m\d|\.a\d|\.f\d)\b/;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

async function readYamlFile(file) {
  const text = await readFile(file, "utf8");
  return parseYaml(text) ?? {};
}

async function listYamlFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => path.join(dir, entry.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadRegistry(root) {
  const registryDir = path.join(root, "data", "knowledge-graph", "registry");
  const readIds = async (name) => {
    const file = path.join(registryDir, `${name}.yaml`);
    try {
      const data = await readYamlFile(file);
      return new Set(asArray(data).map((item) => item?.id).filter(Boolean));
    } catch (error) {
      if (error.code === "ENOENT") return new Set();
      throw error;
    }
  };

  return {
    problems: await readIds("problems"),
    concepts: await readIds("concepts"),
    benchmarks: await readIds("benchmarks"),
  };
}

function idAllowed(id, registered, proposed) {
  return registered.has(id) || proposed.has(id);
}

function validateCanonical(object, registry, errors) {
  const canonical = object.canonical || {};
  const problems = asArray(canonical.problems);
  const concepts = asArray(canonical.concepts);
  const benchmarks = asArray(canonical.benchmarks);
  const proposedProblems = new Set(asArray(canonical.proposed_problems));
  const proposedConcepts = new Set(asArray(canonical.proposed_concepts));

  if (!hasItems(problems)) errors.push("canonical.problems must contain at least 1 id");
  if (!hasItems(concepts)) errors.push("canonical.concepts must contain at least 1 id");

  for (const id of problems) {
    if (!idAllowed(id, registry.problems, proposedProblems)) {
      errors.push(`canonical.problems orphan id: ${id}`);
    }
  }
  for (const id of concepts) {
    if (!idAllowed(id, registry.concepts, proposedConcepts)) {
      errors.push(`canonical.concepts orphan id: ${id}`);
    }
  }
  for (const id of benchmarks) {
    if (!registry.benchmarks.has(id)) errors.push(`canonical.benchmarks orphan id: ${id}`);
  }
}

function validateScopedId(item, slug, kind, globalIds, errors) {
  const id = item?.id;
  if (!nonEmptyString(id)) {
    errors.push(`${kind} missing id`);
    return;
  }
  if (!OBJECT_ID_RE.test(id) || !id.startsWith(`${slug}.`)) {
    errors.push(`${kind} id must match {slug}.{c|m|a|f}{n}: ${id}`);
  }
  if (globalIds.has(id)) errors.push(`duplicate object id across files: ${id}`);
  globalIds.add(id);
}

function validateClaims(object, globalIds, errors) {
  const claims = asArray(object.claims);
  if (!hasItems(claims)) errors.push("claims must contain at least 1 claim");

  for (const claim of claims) {
    validateScopedId(claim, object.slug, "claim", globalIds, errors);
    if (!CLAIM_TYPES.has(claim?.type)) errors.push(`claim ${claim?.id || "(missing id)"} has invalid type`);
    if (!hasItems(claim?.cannot_prove)) errors.push(`claim ${claim?.id || "(missing id)"} cannot_prove is empty`);
    if (!nonEmptyString(claim?.confidence_reason)) errors.push(`claim ${claim?.id || "(missing id)"} confidence_reason is empty`);
    const evidence = asArray(claim?.evidence);
    if (!hasItems(evidence)) errors.push(`claim ${claim?.id || "(missing id)"} evidence is empty`);
    for (const [index, item] of evidence.entries()) {
      if (!nonEmptyString(item?.anchor)) errors.push(`claim ${claim?.id || "(missing id)"} evidence[${index}].anchor is empty`);
      if (!nonEmptyString(item?.quote)) errors.push(`claim ${claim?.id || "(missing id)"} evidence[${index}].quote is empty`);
    }
  }
}

function validateMechanisms(object, registry, globalIds, errors) {
  const canonical = object.canonical || {};
  const proposedProblems = new Set(asArray(canonical.proposed_problems));
  const proposedConcepts = new Set(asArray(canonical.proposed_concepts));

  for (const mechanism of asArray(object.mechanisms)) {
    validateScopedId(mechanism, object.slug, "mechanism", globalIds, errors);
    if (!nonEmptyString(mechanism?.input)) errors.push(`mechanism ${mechanism?.id || "(missing id)"} input is empty`);
    if (!nonEmptyString(mechanism?.output)) errors.push(`mechanism ${mechanism?.id || "(missing id)"} output is empty`);
    if (!hasItems(mechanism?.operations)) errors.push(`mechanism ${mechanism?.id || "(missing id)"} operations is empty`);
    if (!nonEmptyString(mechanism?.anchor)) errors.push(`mechanism ${mechanism?.id || "(missing id)"} anchor is empty`);
    if (mechanism?.canonical_concept && !idAllowed(mechanism.canonical_concept, registry.concepts, proposedConcepts)) {
      errors.push(`mechanism ${mechanism.id} canonical_concept orphan id: ${mechanism.canonical_concept}`);
    }
    if (mechanism?.problem && !idAllowed(mechanism.problem, registry.problems, proposedProblems)) {
      errors.push(`mechanism ${mechanism.id} problem orphan id: ${mechanism.problem}`);
    }
  }
}

function validateAssumptionsAndFailures(object, globalIds, errors, warnings) {
  const assumptions = asArray(object.assumptions);
  const failureModes = asArray(object.failure_modes);
  if (!hasItems(assumptions)) warnings.push("assumptions is empty");
  if (!hasItems(failureModes)) warnings.push("failure_modes is empty");

  for (const assumption of assumptions) {
    validateScopedId(assumption, object.slug, "assumption", globalIds, errors);
    if (assumption?.kind === "explicit" && !nonEmptyString(assumption?.anchor)) {
      warnings.push(`explicit assumption ${assumption?.id || "(missing id)"} missing anchor`);
    }
  }
  for (const failureMode of failureModes) {
    validateScopedId(failureMode, object.slug, "failure_mode", globalIds, errors);
  }
}

function validateTriggerHooks(object, errors) {
  const hooks = asArray(object.trigger_hooks);
  if (!hasItems(hooks)) errors.push("trigger_hooks must contain at least 1 hook");
  for (const [index, hook] of hooks.entries()) {
    if (!nonEmptyString(hook?.symptom)) errors.push(`trigger_hooks[${index}].symptom is empty`);
    if (!nonEmptyString(hook?.why_recall)) errors.push(`trigger_hooks[${index}].why_recall is empty`);
  }
}

function validateExamQuestions(object, errors) {
  const questions = asArray(object.exam_questions);
  if (questions.length < 3) errors.push("exam_questions must contain at least 3 questions");
  const coveredTypes = new Set();
  for (const [index, question] of questions.entries()) {
    if (EXAM_TYPES.has(question?.type)) coveredTypes.add(question.type);
    else errors.push(`exam_questions[${index}].type is invalid`);
  }
  if (coveredTypes.size < 2) errors.push("exam_questions must cover at least 2 types");
}

function validateSelfEvo(object, errors) {
  const state = object.self_evo_verdict?.state;
  if (!SELF_EVO_STATES.has(state)) {
    errors.push("self_evo_verdict.state must be one of apply, queue, no");
  }
}

// KG-5 受众分离：默认前端只渲染 human 块——必须存在、非空、use_type 合法、不泄露 AI-内部记号。
// 仅 kind=paper 强制：项目对象已移出星图（Kevin 2026-06-12），不作卡片渲染，只在命题证据审计层出现，免 human 门。
function validateHuman(object, errors) {
  if (object.kind === "project") return;
  const human = object.human;
  if (!human || typeof human !== "object") {
    errors.push("human block is required (KG-5 受众分离：默认前端只渲染 human 块)");
    return;
  }
  if (!nonEmptyString(human.headline)) errors.push("human.headline is empty");
  if (!nonEmptyString(human.plain_summary)) errors.push("human.plain_summary is empty");
  if (!nonEmptyString(human.how_to_use)) errors.push("human.how_to_use is empty");
  if (!USE_TYPES.has(human.use_type)) {
    errors.push("human.use_type must be one of directly_usable, design_inspiration, background_reference");
  }
  if (!hasItems(human.can_borrow)) errors.push("human.can_borrow must contain at least 1 item");
  // 泄露扫描：把所有人话文本拼起来，命中 AI-内部记号即判失败。
  const blob = [human.headline, human.plain_summary, human.how_to_use, human.use_type_reason, human.maturity,
    ...asArray(human.can_borrow), ...asArray(human.cannot_borrow)].filter(nonEmptyString).join(" \n ");
  const leak = blob.match(HUMAN_LEAK_RE);
  if (leak) errors.push(`human block leaks AI-internal token "${leak[0]}" (受众分离：内部记号只进审计层，不进人话层)`);
}

function validateObject(object, { file, registry, globalIds }) {
  const errors = [];
  const warnings = [];

  if (object.schema !== "ros-v1") errors.push("schema must be ros-v1");
  if (!nonEmptyString(object.slug)) errors.push("slug is empty");
  if (!nonEmptyString(object.one_sentence_thesis)) errors.push("one_sentence_thesis is empty");

  validateCanonical(object, registry, errors);
  validateHuman(object, errors);
  validateClaims(object, globalIds, errors);
  validateMechanisms(object, registry, globalIds, errors);
  validateAssumptionsAndFailures(object, globalIds, errors, warnings);
  validateTriggerHooks(object, errors);
  validateExamQuestions(object, errors);
  validateSelfEvo(object, errors);

  return {
    file,
    slug: object.slug || path.basename(file, path.extname(file)),
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export async function validateObjects({ root = ROOT } = {}) {
  const objectsDir = path.join(root, "data", "knowledge-graph", "objects");
  const files = await listYamlFiles(objectsDir);
  const registry = await loadRegistry(root);
  const globalIds = new Set();
  const results = [];

  for (const file of files) {
    try {
      const object = await readYamlFile(file);
      results.push(validateObject(object, { file, registry, globalIds }));
    } catch (error) {
      results.push({
        file,
        slug: path.basename(file, path.extname(file)),
        ok: false,
        errors: [`failed to parse YAML: ${error.message}`],
        warnings: [],
      });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);
  return {
    ok: failed === 0,
    summary: {
      objects: files.length,
      passed: files.length - failed,
      failed,
      warnings: warningCount,
    },
    results,
  };
}

export function renderTextReport(report) {
  const lines = [];
  if (report.summary.objects === 0) {
    lines.push("PASS 0 objects found");
  }
  for (const result of report.results) {
    lines.push(`${result.ok ? "PASS" : "FAIL"} ${path.relative(ROOT, result.file)}`);
    for (const error of result.errors) lines.push(`  error: ${error}`);
    for (const warning of result.warnings) lines.push(`  warning: ${warning}`);
  }
  lines.push(`Summary: ${report.summary.passed}/${report.summary.objects} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    root: argv.find((arg) => arg.startsWith("--root="))?.slice("--root=".length) || ROOT,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const report = await validateObjects({ root: options.root });
  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(renderTextReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
