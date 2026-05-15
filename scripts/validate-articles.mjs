import { readFile } from "node:fs/promises";

const file = new URL("../public/data/articles.json", import.meta.url);
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
    validateString(source?.name, `${path}[${index}].name`);
    validateString(source?.url, `${path}[${index}].url`);
    if (isNonEmptyString(source?.url) && !/^https:\/\/.+/.test(source.url)) {
      fail(`${path}[${index}].url`, "must be an https URL");
    }
  });
}

function validateVersion(version, path) {
  for (const key of ["id", "label", "versionType", "changeSummary", "whyChanged", "readerQuestion", "evidence"]) {
    validateString(version?.[key], `${path}.${key}`);
  }
  if (!isIso(version?.submittedAt)) fail(`${path}.submittedAt`, "must be an ISO date");
  if (!isScore(version?.impactScore)) fail(`${path}.impactScore`, "must be a number from 0 to 100");
}

function validateChart(chart, path) {
  for (const key of ["title", "metric", "unit"]) validateString(chart?.[key], `${path}.${key}`);
  if (chart?.maxValue !== undefined && (!Number.isFinite(chart.maxValue) || chart.maxValue <= 0)) {
    fail(`${path}.maxValue`, "must be a positive number when present");
  }
  if (!Array.isArray(chart?.bars) || chart.bars.length < 2) {
    fail(`${path}.bars`, "must have at least 2 item(s)");
    return;
  }
  chart.bars.forEach((bar, index) => {
    validateString(bar?.label, `${path}.bars[${index}].label`);
    validateString(bar?.display, `${path}.bars[${index}].display`);
    if (!Number.isFinite(bar?.value) || bar.value < 0) {
      fail(`${path}.bars[${index}].value`, "must be a non-negative number");
    }
  });
}

function validatePaper(paper, path) {
  for (const key of [
    "id",
    "title",
    "shortTitle",
    "authors",
    "venue",
    "arxivId",
    "oneSentenceTakeaway",
    "whyItMatters",
    "readingTime",
    "actionLabel",
    "difficulty",
    "recommendedAction",
    "sourceName",
    "sourceUrl",
    "versionQuestion",
    "versionRelation",
  ]) {
    validateString(paper?.[key], `${path}.${key}`);
  }
  if (paper?.contentType !== "paper") fail(`${path}.contentType`, "must be paper");
  if (!isIso(paper?.publishedAt)) fail(`${path}.publishedAt`, "must be an ISO date");
  if (!isIso(paper?.updatedAt)) fail(`${path}.updatedAt`, "must be an ISO date");
  for (const key of ["impactScore", "readabilityScore", "actionabilityScore", "confidenceScore"]) {
    if (!isScore(paper?.[key])) fail(`${path}.${key}`, "must be a number from 0 to 100");
  }
  validateStringArray(paper?.targetAudience, `${path}.targetAudience`, 1);
  validateStringArray(paper?.tags, `${path}.tags`, 1);
  validateStringArray(paper?.conceptMap, `${path}.conceptMap`, 2);
  validateStringArray(paper?.nextSteps, `${path}.nextSteps`, 1);
  validateSources(paper?.sources, `${path}.sources`);
  if (!Array.isArray(paper?.versions) || paper.versions.length < 2) {
    fail(`${path}.versions`, "must have at least 2 versions");
  } else {
    paper.versions.forEach((version, index) => validateVersion(version, `${path}.versions[${index}]`));
  }
  if (!Array.isArray(paper?.charts) || paper.charts.length < 1) {
    fail(`${path}.charts`, "must have at least 1 item");
  } else {
    paper.charts.forEach((chart, index) => validateChart(chart, `${path}.charts[${index}]`));
  }
  for (const key of ["thesis", "background", "method", "experiments", "limitations", "professorLens"]) {
    validateString(paper?.analysis?.[key], `${path}.analysis.${key}`);
  }
  validateStringArray(paper?.analysis?.verificationChecklist, `${path}.analysis.verificationChecklist`, 2);
}

if (!data || typeof data !== "object") fail("$", "must be an object");
if (!isIso(data?.generatedAt)) fail("$.generatedAt", "must be an ISO date");
if (!Array.isArray(data?.papers) || data.papers.length === 0) {
  fail("$.papers", "must have at least one paper");
} else {
  const seen = new Set();
  data.papers.forEach((paper, index) => {
    const path = `$.papers[${index}]`;
    if (seen.has(paper?.id)) fail(`${path}.id`, "must be unique");
    seen.add(paper?.id);
    validatePaper(paper, path);
  });
}

if (errors.length > 0) {
  throw new Error(`articles.json validation failed:\n${errors.join("\n")}`);
}

console.log("articles.json validation passed");
