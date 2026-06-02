import { readFile } from "node:fs/promises";

const file = new URL("../public/data/models.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const errors = [];

const MODEL_KINDS = new Set(["open", "closed"]);
const SOURCE_TYPES = new Set(["official", "third-party", "derived"]);

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
  validateDate(model?.latestReleasedAt, `${path}.latestReleasedAt`);
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
