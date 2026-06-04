import { readFile } from "node:fs/promises";

const file = new URL("../public/data/models.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const errors = [];

const MODEL_KINDS = new Set(["open", "closed"]);
const SOURCE_TYPES = new Set(["official", "third-party", "derived"]);
const PARADIGM_BRANCHES = new Set(["new_model", "update", "variant_merged"]);
const PARADIGM_TEMPLATES = new Set(["new_model_card", "version_update", "variant_merged"]);

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function isDateish(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isHttpsUrl(value) {
  return typeof value === "string" && /^https:\/\/\S+$/i.test(value);
}

function validateString(value, path) {
  if (!isNonEmptyString(value)) fail(path, "must be a non-empty string");
}

function validateDate(value, path) {
  if (!isDateish(value)) fail(path, "must be a parseable date/ISO string");
}

function validateStringArray(value, path, { min = 0 } = {}) {
  if (!Array.isArray(value)) {
    fail(path, "must be an array");
    return;
  }
  if (value.length < min) fail(path, `must have at least ${min} item(s)`);
  value.forEach((item, index) => validateString(item, `${path}[${index}]`));
}

function validateSources(sources, path, { min = 1 } = {}) {
  if (!Array.isArray(sources)) {
    fail(path, "must be an array");
    return;
  }
  if (sources.length < min) fail(path, `must have at least ${min} source(s)`);
  sources.forEach((source, index) => {
    const sourcePath = `${path}[${index}]`;
    validateString(source?.name, `${sourcePath}.name`);
    validateString(source?.url, `${sourcePath}.url`);
    if (isNonEmptyString(source?.url) && !isHttpsUrl(source.url)) {
      fail(`${sourcePath}.url`, "must be an https URL");
    }
  });
}

function validateStatusCard(model, path) {
  validateString(model?.latestVersion, `${path}.latestVersion`);
  if (model?.latestVersionVariants !== undefined) {
    validateStringArray(model.latestVersionVariants, `${path}.latestVersionVariants`);
  }
  // latestReleasedAt may be "" when the official source gives no parseable date (precision: not_found) — honest unknown, not fabricated.
  if (isNonEmptyString(model?.latestReleasedAt)) {
    validateDate(model.latestReleasedAt, `${path}.latestReleasedAt`);
  }
  if (model?.latestReleasedAtPrecision !== undefined) {
    validateString(model.latestReleasedAtPrecision, `${path}.latestReleasedAtPrecision`);
  }
  if (typeof model?.isOpen !== "boolean") fail(`${path}.isOpen`, "must be a boolean");
  validateString(model?.license, `${path}.license`);
  if (typeof model?.hasEvalData !== "boolean") fail(`${path}.hasEvalData`, "must be a boolean");
  validateStringArray(model?.evalSources, `${path}.evalSources`, { min: model?.hasEvalData ? 1 : 0 });
  if (model?.evalThirdPartyPending !== undefined) {
    validateStringArray(model.evalThirdPartyPending, `${path}.evalThirdPartyPending`);
  }
  if (typeof model?.hasChangelog !== "boolean") fail(`${path}.hasChangelog`, "must be a boolean");
  validateString(model?.changelogUrl, `${path}.changelogUrl`);
  if (isNonEmptyString(model?.changelogUrl) && !isHttpsUrl(model.changelogUrl)) {
    fail(`${path}.changelogUrl`, "must be an https URL");
  }
  validateDate(model?.lastCheckedAt, `${path}.lastCheckedAt`);
}

function validateBenchmarkChart(chart, path) {
  for (const key of ["title", "metric", "unit"]) validateString(chart?.[key], `${path}.${key}`);
  if (typeof chart?.higherIsBetter !== "boolean") fail(`${path}.higherIsBetter`, "must be a boolean");
  if (!SOURCE_TYPES.has(chart?.sourceType)) fail(`${path}.sourceType`, "must be official, third-party, or derived");
  if (chart?.maxValue !== undefined && (!Number.isFinite(chart.maxValue) || chart.maxValue <= 0)) {
    fail(`${path}.maxValue`, "must be a positive number when present");
  }
  if (!Array.isArray(chart?.bars)) {
    fail(`${path}.bars`, "must be an array");
    return;
  }
  chart.bars.forEach((bar, index) => {
    const barPath = `${path}.bars[${index}]`;
    validateString(bar?.label, `${barPath}.label`);
    validateString(bar?.display, `${barPath}.display`);
    if (!Number.isFinite(bar?.value) || bar.value < 0) fail(`${barPath}.value`, "must be a non-negative number");
    if (bar?.highlight !== undefined && typeof bar.highlight !== "boolean") {
      fail(`${barPath}.highlight`, "must be a boolean when present");
    }
  });
}

function validateBenchmarkItem(item, path) {
  for (const key of ["label", "score", "comparator", "interpretation"]) {
    validateString(item?.[key], `${path}.${key}`);
  }
  if (!SOURCE_TYPES.has(item?.sourceType)) fail(`${path}.sourceType`, "must be official, third-party, or derived");
  if (item?.attribution !== undefined && !["自报", "实测"].includes(item.attribution)) {
    fail(`${path}.attribution`, "must be 自报 or 实测 when present");
  }
}

function validateParadigm(paradigm, path, kind) {
  if (paradigm === undefined) {
    fail(path, "must be present");
    return;
  }
  if (!paradigm || typeof paradigm !== "object") {
    fail(path, "must be an object when present");
    return;
  }
  validateString(paradigm.tag, `${path}.tag`);
  if (!PARADIGM_BRANCHES.has(paradigm.branch)) fail(`${path}.branch`, "must be new_model, update, or variant_merged");
  if (paradigm.access !== kind) fail(`${path}.access`, `must match model kind ${kind}`);
  if (!PARADIGM_TEMPLATES.has(paradigm.template)) fail(`${path}.template`, "must be new_model_card, version_update, or variant_merged");
  if (paradigm.branch !== "variant_merged") validateParadigmCard(paradigm.card, `${path}.card`, kind);
  if (paradigm.branch === "new_model") {
    if (![0, 1, 2, 3].includes(paradigm.tier)) fail(`${path}.tier`, "must be 0, 1, 2, or 3 for new_model");
    if (!paradigm.card || typeof paradigm.card !== "object") fail(`${path}.card`, "must be an object for new_model");
  }
  if (paradigm.branch === "update" && (!paradigm.update || typeof paradigm.update !== "object")) {
    fail(`${path}.update`, "must be an object for update");
  }
}

function validateParadigmCard(card, path, kind) {
  if (!card || typeof card !== "object") {
    fail(path, "must be an object");
    return;
  }
  for (const key of ["名称", "厂商", "发布日", "开放度标签", "类型", "规模架构", "强弱一句", "一句话定位"]) {
    validateString(card[key], `${path}.${key}`);
  }
  if (!Array.isArray(card["关键benchmark"]) || card["关键benchmark"].length === 0) {
    fail(`${path}.关键benchmark`, "must have at least one item");
  } else {
    card["关键benchmark"].forEach((item, index) => {
      const itemPath = `${path}.关键benchmark[${index}]`;
      for (const key of ["名称", "分数", "对手", "标注", "解读"]) validateString(item?.[key], `${itemPath}.${key}`);
      if (!["自报", "实测"].includes(item?.["标注"])) fail(`${itemPath}.标注`, "must be 自报 or 实测");
    });
  }
  if (kind === "open") {
    if (!card["许可证"] || typeof card["许可证"] !== "object") {
      fail(`${path}.许可证`, "must be an object for open models");
    } else {
      validateString(card["许可证"]["名称"], `${path}.许可证.名称`);
      validateString(card["许可证"]["能否商用"], `${path}.许可证.能否商用`);
    }
    validateString(card["自托管硬件"], `${path}.自托管硬件`);
    validateStringArray(card["可用变体"], `${path}.可用变体`, { min: 1 });
    validateString(card.base_model, `${path}.base_model`);
  }
  if (kind === "closed") {
    if (!card["价格"] || typeof card["价格"] !== "object") {
      fail(`${path}.价格`, "must be an object for closed models");
    } else {
      validateString(card["价格"]["输入每百万token"], `${path}.价格.输入每百万token`);
      validateString(card["价格"]["输出每百万token"], `${path}.价格.输出每百万token`);
    }
    validateString(card["知识截止"], `${path}.知识截止`);
    validateString(card["model string"], `${path}.model string`);
    validateString(card["速率"], `${path}.速率`);
    validateString(card["多模态I/O"], `${path}.多模态I/O`);
  }
}

function validateBenchmark(benchmark, path) {
  if (!benchmark || typeof benchmark !== "object") {
    fail(path, "must be an object");
    return;
  }
  validateString(benchmark.headline, `${path}.headline`);
  validateString(benchmark.professorNote, `${path}.professorNote`);
  if (!Array.isArray(benchmark.charts)) {
    fail(`${path}.charts`, "must be an array");
  } else {
    benchmark.charts.forEach((chart, index) => validateBenchmarkChart(chart, `${path}.charts[${index}]`));
  }
  if (!Array.isArray(benchmark.items)) {
    fail(`${path}.items`, "must be an array");
  } else {
    benchmark.items.forEach((item, index) => validateBenchmarkItem(item, `${path}.items[${index}]`));
  }
  validateStringArray(benchmark.caveats, `${path}.caveats`, { min: 1 });
}

function validateOpenAnalysis(analysis, path) {
  if (!analysis || typeof analysis !== "object") {
    fail(path, "must be an object");
    return;
  }
  validateString(analysis.oneLineTakeaway, `${path}.oneLineTakeaway`);
  if (!Array.isArray(analysis.whatItUnlocks) || analysis.whatItUnlocks.length === 0) {
    fail(`${path}.whatItUnlocks`, "must have at least one item");
  } else {
    analysis.whatItUnlocks.forEach((item, index) => {
      const itemPath = `${path}.whatItUnlocks[${index}]`;
      for (const key of ["point", "forYou", "evidence", "confidence"]) {
        validateString(item?.[key], `${itemPath}.${key}`);
      }
    });
  }
  validateBenchmark(analysis.benchmark, `${path}.benchmark`);
  for (const key of ["openSourceMeaning", "whenToUse", "cost_caveats"]) {
    validateString(analysis[key], `${path}.${key}`);
  }
  validateSources(analysis.sources, `${path}.sources`);
}

function validateClosedChangelog(changelog, path) {
  if (!changelog || typeof changelog !== "object") {
    fail(path, "must be an object");
    return;
  }
  validateString(changelog.oneLineTakeaway, `${path}.oneLineTakeaway`);
  if (!Array.isArray(changelog.newFeatures) || changelog.newFeatures.length === 0) {
    fail(`${path}.newFeatures`, "must have at least one item");
  } else {
    changelog.newFeatures.forEach((item, index) => {
      const itemPath = `${path}.newFeatures[${index}]`;
      for (const key of ["feature", "whatItIs", "forYou", "howToUse", "whenToUse"]) {
        validateString(item?.[key], `${itemPath}.${key}`);
      }
    });
  }
  validateString(changelog.limitations, `${path}.limitations`);
  validateSources(changelog.sources, `${path}.sources`);
}

function validateModel(model, path) {
  for (const key of ["id", "name", "vendor", "country"]) validateString(model?.[key], `${path}.${key}`);
  if (!MODEL_KINDS.has(model?.kind)) fail(`${path}.kind`, "must be open or closed");
  validateStatusCard(model, path);
  validateDate(model?.analysisGeneratedAt, `${path}.analysisGeneratedAt`);
  validateString(model?.analysisAuthor, `${path}.analysisAuthor`);
  validateParadigm(model?.paradigm, `${path}.paradigm`, model?.kind);

  if (model?.kind === "open") {
    if (model.isOpen !== true) fail(`${path}.isOpen`, "open models must have isOpen=true");
    if (model.changelog !== undefined) fail(`${path}.changelog`, "open models must not include changelog");
    validateOpenAnalysis(model.analysis, `${path}.analysis`);
  }

  if (model?.kind === "closed") {
    if (model.isOpen !== false) fail(`${path}.isOpen`, "closed models must have isOpen=false");
    if (model.analysis !== undefined) fail(`${path}.analysis`, "closed models must not include analysis");
    validateClosedChangelog(model.changelog, `${path}.changelog`);
  }
}

if (!data || typeof data !== "object") fail("$", "must be an object");
validateDate(data?.generatedAt, "$.generatedAt");
if (data?.companies !== undefined) fail("$.companies", "old companies shape is retired; use $.models");
if (!Array.isArray(data?.models) || data.models.length === 0) {
  fail("$.models", "must have at least one model");
} else {
  const seen = new Set();
  data.models.forEach((model, index) => {
    const path = `$.models[${index}]`;
    if (seen.has(model?.id)) fail(`${path}.id`, "must be unique");
    if (isNonEmptyString(model?.id)) seen.add(model.id);
    validateModel(model, path);
  });
}

if (errors.length > 0) {
  throw new Error(`models.json validation failed:\n${errors.join("\n")}`);
}

console.log("models.json validation passed");
