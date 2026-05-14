import { readFile } from "node:fs/promises";

const file = new URL("../public/data/models.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const errors = [];

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isScore(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function validateString(value, path) {
  if (!isNonEmptyString(value)) fail(path, "must be a non-empty string");
}

function validateStringArray(value, path, min = 1) {
  if (!Array.isArray(value)) {
    fail(path, "must be an array");
    return;
  }
  if (value.length < min) fail(path, `must have at least ${min} item(s)`);
  value.forEach((item, index) => validateString(item, `${path}[${index}]`));
}

function validateSources(sources, path) {
  if (!Array.isArray(sources) || sources.length === 0) {
    fail(path, "must include at least one source");
    return;
  }
  sources.forEach((source, index) => {
    const sourcePath = `${path}[${index}]`;
    validateString(source?.name, `${sourcePath}.name`);
    validateString(source?.url, `${sourcePath}.url`);
    if (isNonEmptyString(source?.url) && !/^https:\/\/.+/.test(source.url)) {
      fail(`${sourcePath}.url`, "must be an https URL");
    }
  });
}

function validateRelease(release, path, releaseIds) {
  for (const key of [
    "id",
    "name",
    "kind",
    "positioning",
    "oneSentenceTakeaway",
    "problemSolved",
    "whyChanged",
    "howSolved",
    "teacherNote",
  ]) {
    validateString(release?.[key], `${path}.${key}`);
  }
  if (!isIso(release?.publishedAt)) fail(`${path}.publishedAt`, "must be an ISO date");
  validateStringArray(release?.keyChanges, `${path}.keyChanges`, 2);
  validateStringArray(release?.tradeoffs, `${path}.tradeoffs`, 1);
  validateStringArray(release?.studentTakeaways, `${path}.studentTakeaways`, 1);
  validateStringArray(release?.experiments, `${path}.experiments`, 1);
  validateSources(release?.sources, `${path}.sources`);

  if (release?.api) {
    validateStringArray(release.api.modelNames, `${path}.api.modelNames`, 1);
    validateString(release.api.contextWindow, `${path}.api.contextWindow`);
    validateString(release.api.maxOutput, `${path}.api.maxOutput`);
    validateStringArray(release.api.modes, `${path}.api.modes`, 1);
  }

  if (release?.nextRelation) {
    const rel = release.nextRelation;
    validateString(rel.toReleaseId, `${path}.nextRelation.toReleaseId`);
    if (isNonEmptyString(rel.toReleaseId) && !releaseIds.has(rel.toReleaseId)) {
      fail(`${path}.nextRelation.toReleaseId`, "must point to a release in the same series");
    }
    for (const key of ["summary", "inherits", "changes", "why", "solvedBy", "teacherNote"]) {
      validateString(rel[key], `${path}.nextRelation.${key}`);
    }
  }
}

function validateCompany(company, path) {
  for (const key of [
    "id",
    "name",
    "shortName",
    "country",
    "oneSentenceTakeaway",
    "whyItMatters",
    "contentType",
    "readingTime",
    "actionLabel",
    "difficulty",
    "recommendedAction",
    "sourceName",
    "sourceUrl",
  ]) {
    validateString(company?.[key], `${path}.${key}`);
  }
  if (!isIso(company?.updatedAt)) fail(`${path}.updatedAt`, "must be an ISO date");
  if (!isIso(company?.publishedAt)) fail(`${path}.publishedAt`, "must be an ISO date");
  for (const key of ["impactScore", "readabilityScore", "actionabilityScore", "confidenceScore"]) {
    if (!isScore(company?.[key])) fail(`${path}.${key}`, "must be a number from 0 to 100");
  }
  validateStringArray(company?.targetAudience, `${path}.targetAudience`, 1);
  validateStringArray(company?.tags, `${path}.tags`, 1);
  validateStringArray(company?.nextSteps, `${path}.nextSteps`, 1);
  validateSources(company?.sources, `${path}.sources`);

  if (!Array.isArray(company?.learningPath) || company.learningPath.length === 0) {
    fail(`${path}.learningPath`, "must have items");
  } else {
    company.learningPath.forEach((item, index) => {
      validateString(item?.title, `${path}.learningPath[${index}].title`);
      validateString(item?.body, `${path}.learningPath[${index}].body`);
    });
  }

  if (!Array.isArray(company?.series) || company.series.length === 0) {
    fail(`${path}.series`, "must have items");
  } else {
    company.series.forEach((series, index) => {
      const seriesPath = `${path}.series[${index}]`;
      validateString(series?.id, `${seriesPath}.id`);
      validateString(series?.title, `${seriesPath}.title`);
      validateString(series?.summary, `${seriesPath}.summary`);
      validateString(series?.teacherNote, `${seriesPath}.teacherNote`);
      if (!Array.isArray(series?.releases) || series.releases.length === 0) {
        fail(`${seriesPath}.releases`, "must have items");
        return;
      }
      const releaseIds = new Set(series.releases.map((release) => release?.id).filter(isNonEmptyString));
      series.releases.forEach((release, releaseIndex) => {
        validateRelease(release, `${seriesPath}.releases[${releaseIndex}]`, releaseIds);
      });
    });
  }

  if (!Array.isArray(company?.updates)) {
    fail(`${path}.updates`, "must be an array");
  } else {
    company.updates.forEach((update, index) => {
      const updatePath = `${path}.updates[${index}]`;
      for (const key of ["id", "title", "kind", "summary", "whyItMatters", "studentTakeaway"]) {
        validateString(update?.[key], `${updatePath}.${key}`);
      }
      if (!isIso(update?.publishedAt)) fail(`${updatePath}.publishedAt`, "must be an ISO date");
      validateSources(update?.sources, `${updatePath}.sources`);
    });
  }
}

if (!data || typeof data !== "object") fail("$", "must be an object");
if (!isIso(data?.generatedAt)) fail("$.generatedAt", "must be an ISO date");
if (!Array.isArray(data?.companies) || data.companies.length === 0) {
  fail("$.companies", "must have at least one company");
} else {
  const seen = new Set();
  data.companies.forEach((company, index) => {
    const path = `$.companies[${index}]`;
    if (seen.has(company?.id)) fail(`${path}.id`, "must be unique");
    seen.add(company?.id);
    validateCompany(company, path);
  });
}

if (errors.length > 0) {
  throw new Error(`models.json validation failed:\n${errors.join("\n")}`);
}

console.log("models.json validation passed");
