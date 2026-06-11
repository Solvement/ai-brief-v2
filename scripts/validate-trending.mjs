import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const file = new URL("../public/data/trending.json", import.meta.url);
let errors = [];
const DATA_INSUFFICIENT = "数据不足";
const CLAIM_ATTRIBUTIONS = new Set(["自报", "已核实", "不适用"]);
const SELF_REPORTED_SOURCE_RE = /README|artifact|官网|self|自述|自称/i;
const SELF_EVO_KEYWORDS = ["记忆", "理解", "自进化"];

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function validateTierTemplateComparison(repo, path) {
  if (![2, 3].includes(repo.project_tier)) return;
  if (!repo.tier_template || typeof repo.tier_template !== "object") return;

  const template = repo.tier_template;
  if (!Object.hasOwn(template, "comparison_table")) return;

  const table = template.comparison_table;
  const tablePath = `${path}.tier_template.comparison_table`;
  if (!Array.isArray(table)) {
    fail(tablePath, "must be an array when present");
    return;
  }

  if (table.length === 0) {
    if (typeof template.comparison !== "string" || template.comparison.trim() !== DATA_INSUFFICIENT) {
      fail(tablePath, `empty comparison_table requires tier_template.comparison to be ${DATA_INSUFFICIENT}`);
    }
    return;
  }

  table.forEach((item, index) => {
    const itemPath = `${tablePath}[${index}]`;
    if (!item || typeof item !== "object") {
      fail(itemPath, "must be an object");
      return;
    }
    for (const key of ["alternative", "difference"]) {
      if (!isNonEmptyString(item[key])) fail(`${itemPath}.${key}`, "must be a non-empty string");
    }
  });
}

function validateClaimLedgerAttribution(repo, path) {
  if (!repo.tier_template || typeof repo.tier_template !== "object") return;

  const ledgers = [];
  if (Array.isArray(repo.claim_ledger)) {
    ledgers.push({ items: repo.claim_ledger, path: `${path}.claim_ledger` });
  }
  if (Array.isArray(repo.tier_template.claim_ledger)) {
    ledgers.push({ items: repo.tier_template.claim_ledger, path: `${path}.tier_template.claim_ledger` });
  }

  for (const ledger of ledgers) {
    ledger.items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      if (!Object.hasOwn(item, "attribution")) return;

      const itemPath = `${ledger.path}[${index}]`;
      if (!CLAIM_ATTRIBUTIONS.has(item.attribution)) {
        fail(`${itemPath}.attribution`, `must be one of ${Array.from(CLAIM_ATTRIBUTIONS).join(", ")}`);
        return;
      }

      if (item.attribution !== "已核实") return;
      if (!isNonEmptyString(item.source) || SELF_REPORTED_SOURCE_RE.test(item.source)) {
        fail(`${itemPath}.source`, "已核实 需具名独立来源，不能来自 README 自述");
      }
    });
  }
}

function validateRepo(repo, path) {
  const requiredStrings = ["fullName", "owner", "name", "url", "ownerAvatarUrl", "tldr", "light"];
  for (const key of requiredStrings) {
    if (typeof repo[key] !== "string" || repo[key].trim() === "") fail(`${path}.${key}`, "must be a non-empty string");
  }

  for (const key of ["stars", "forks", "starsGained", "rank", "worthDeepDive"]) {
    if (!isNumber(repo[key])) fail(`${path}.${key}`, "must be a number");
  }

  if (!Array.isArray(repo.tags)) fail(`${path}.tags`, "must be an array");

  if (repo.rankingReason !== undefined) {
    const rr = repo.rankingReason;
    if (!rr || typeof rr !== "object") {
      fail(`${path}.rankingReason`, "must be an object");
    } else {
      const validDecisions = ["boost", "cap-low-priority", "cap-non-core", "no-change", "deterministic", "gated"];
      if (!validDecisions.includes(rr.decision)) fail(`${path}.rankingReason.decision`, `must be one of ${validDecisions.join(", ")}`);
      for (const numKey of ["rawScore", "finalScore"]) {
        if (!isNumber(rr[numKey]) || rr[numKey] < 0 || rr[numKey] > 100) fail(`${path}.rankingReason.${numKey}`, "must be a number 0-100");
      }
      for (const arrKey of ["matchedBoostTerms", "matchedCapTerms"]) {
        if (!Array.isArray(rr[arrKey])) fail(`${path}.rankingReason.${arrKey}`, "must be an array");
        else if (rr[arrKey].some((t) => typeof t !== "string")) fail(`${path}.rankingReason.${arrKey}`, "must be array of strings");
      }
      if (typeof rr.explanation !== "string" || rr.explanation.trim() === "") fail(`${path}.rankingReason.explanation`, "must be a non-empty string");
    }
  }

  if (repo.depth_band !== undefined && !["deep", "standard", "light", "list_only", "needs_enrichment"].includes(repo.depth_band)) {
    fail(`${path}.depth_band`, "must be deep, standard, light, list_only, or needs_enrichment");
  }
  if (repo.analysis_depth !== undefined && !["deep", "standard", "light", "list_only", "needs_enrichment"].includes(repo.analysis_depth)) {
    fail(`${path}.analysis_depth`, "must be deep, standard, light, list_only, or needs_enrichment");
  }

  if (repo.deep) {
    const deep = repo.deep;
    for (const key of ["atGlance", "howItWorks", "novelty", "ecosystem"]) {
      if (typeof deep[key] !== "string" || deep[key].trim() === "") fail(`${path}.deep.${key}`, "must be a non-empty string");
    }
    if (!Array.isArray(deep.whyItMatters) || deep.whyItMatters.length === 0) fail(`${path}.deep.whyItMatters`, "must have items");
    if (!Array.isArray(deep.keyConcepts)) fail(`${path}.deep.keyConcepts`, "must be an array");
    if (!Array.isArray(deep.limitations)) fail(`${path}.deep.limitations`, "must be an array");
    if (!Array.isArray(deep.tryIt)) fail(`${path}.deep.tryIt`, "must be an array");
    const score = deep.score;
    if (!score || typeof score !== "object") {
      fail(`${path}.deep.score`, "must exist");
    } else {
      for (const key of ["novelty", "engineering", "reproducibility", "timeToValue"]) {
        if (!isNumber(score[key]) || score[key] < 0 || score[key] > 25) fail(`${path}.deep.score.${key}`, "must be 0-25");
      }
    }
  }

  validateTierTemplateComparison(repo, path);
  validateClaimLedgerAttribution(repo, path);
  validateMindPalace(repo.mind_palace, `${path}.mind_palace`);
}

function validateMindPalace(facet, path) {
  if (facet === undefined || facet === null) return;
  if (!facet || typeof facet !== "object" || Array.isArray(facet)) {
    fail(path, "must be an object when present");
    return;
  }
  for (const key of ["problem_solved", "method", "self_evo_use"]) {
    if (!isNonEmptyString(facet[key])) fail(`${path}.${key}`, "must be a non-empty string");
  }
  if (isNonEmptyString(facet.self_evo_use)) {
    for (const keyword of SELF_EVO_KEYWORDS) {
      if (!facet.self_evo_use.includes(keyword)) fail(`${path}.self_evo_use`, `must explicitly cover ${SELF_EVO_KEYWORDS.join("/")}`);
    }
  }
  const cc = facet.core_concepts;
  if (!Array.isArray(cc) || cc.length < 3 || cc.length > 5) {
    fail(`${path}.core_concepts`, "must contain 3-5 items");
  } else {
    cc.forEach((concept, index) => {
      const conceptPath = `${path}.core_concepts[${index}]`;
      if (!concept || typeof concept !== "object" || Array.isArray(concept)) {
        fail(conceptPath, "must be an object");
        return;
      }
      if (!isNonEmptyString(concept.name)) fail(`${conceptPath}.name`, "must be a non-empty string");
      if (!["primary", "supporting", "mentioned"].includes(concept.role)) fail(`${conceptPath}.role`, "must be primary, supporting, or mentioned");
      if (!isNonEmptyString(concept.evidence)) fail(`${conceptPath}.evidence`, "must be a non-empty string");
    });
  }
  const trace = facet.discovery_trace;
  const traceEmpty = trace === undefined || trace === null || (typeof trace === "string" && (!trace.trim() || trace.trim() === DATA_INSUFFICIENT));
  if (!traceEmpty) {
    if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
      fail(`${path}.discovery_trace`, `must be an object or ${DATA_INSUFFICIENT}`);
    } else if (!isNonEmptyString(trace.source_span)) {
      fail(`${path}.discovery_trace.source_span`, "must be non-empty when discovery_trace is not 数据不足");
    }
  }
}

function validateAgentFlow(flow, path) {
  if (flow === undefined) return;
  if (!Array.isArray(flow) || flow.length < 5) {
    fail(path, "must contain at least five agent roles");
    return;
  }
  flow.forEach((step, index) => {
    for (const key of ["role", "responsibility", "signal"]) {
      if (typeof step?.[key] !== "string" || step[key].trim() === "") fail(`${path}[${index}].${key}`, "must be a non-empty string");
    }
  });
}

function validateQualityGate(gate, path) {
  if (gate === undefined) return;
  if (!gate || typeof gate !== "object") {
    fail(path, "must be an object");
    return;
  }
  if (!["pass", "warning", "fail"].includes(gate.status)) fail(`${path}.status`, "must be pass, warning, or fail");
  if (!isIso(gate.checkedAt)) fail(`${path}.checkedAt`, "must be an ISO date");
  if (!Array.isArray(gate.checks) || gate.checks.length === 0) {
    fail(`${path}.checks`, "must be a non-empty array");
    return;
  }
  gate.checks.forEach((check, index) => {
    if (typeof check?.id !== "string" || check.id.trim() === "") fail(`${path}.checks[${index}].id`, "must be a non-empty string");
    if (typeof check?.label !== "string" || check.label.trim() === "") fail(`${path}.checks[${index}].label`, "must be a non-empty string");
    if (!["pass", "warning", "fail"].includes(check?.status)) fail(`${path}.checks[${index}].status`, "must be pass, warning, or fail");
    if (typeof check?.details !== "string") fail(`${path}.checks[${index}].details`, "must be a string");
  });
}

export function validateTrendingData(data) {
  errors = [];

  if (!data || typeof data !== "object") fail("$", "must be an object");
  if (!isIso(data.generatedAt)) fail("$.generatedAt", "must be an ISO date");
  validateAgentFlow(data.agentFlow, "$.agentFlow");
  validateQualityGate(data.qualityGate, "$.qualityGate");

  for (const windowName of ["daily", "weekly", "monthly"]) {
    const board = data[windowName];
    if (!board || typeof board !== "object") {
      fail(`$.${windowName}`, "must exist");
      continue;
    }
    if (board.window !== windowName) fail(`$.${windowName}.window`, `must be ${windowName}`);
    if (!isIso(board.generatedAt)) fail(`$.${windowName}.generatedAt`, "must be an ISO date");
    if (!Array.isArray(board.repos)) {
      fail(`$.${windowName}.repos`, "must be an array");
      continue;
    }
    if (board.repos.length === 0) fail(`$.${windowName}.repos`, "must not be empty");
    board.repos.forEach((repo, index) => validateRepo(repo, `$.${windowName}.repos[${index}]`));
  }

  if (errors.length > 0) {
    throw new Error(`trending.json validation failed:\n${errors.join("\n")}`);
  }

  return data;
}

export async function validateTrendingFile(target = file) {
  const raw = await readFile(target, "utf8");
  const data = JSON.parse(raw);
  validateTrendingData(data);
  console.log("trending.json validation passed");
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await validateTrendingFile();
}
