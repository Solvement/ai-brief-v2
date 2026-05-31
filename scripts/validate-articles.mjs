import { readFile } from "node:fs/promises";

const FILE = new URL("../public/data/articles.json", import.meta.url);
const REPLACEMENT = /\uFFFD|\u00ef\u00bf\u00bd/; // mojibake guard (RULES §9)
const PLACEHOLDER = /\[\u5360\u4f4d\]|\b(?:TODO|TBD)\b/i;

function fail(msg) { console.error(`articles.json validation failed: ${msg}`); process.exit(1); }

const data = JSON.parse(await readFile(FILE, "utf8"));
if (!data || typeof data.generatedAt !== "string") fail("missing generatedAt");
if (!Array.isArray(data.papers)) fail("papers must be an array");

for (const [i, p] of data.papers.entries()) {
  const where = `papers[${i}] (${p?.id ?? "?"})`;
  for (const f of ["id","title","authors","venue","sourceName","sourceUrl","verifiedAt","leadJudgment"]) {
    if (typeof p?.[f] !== "string" || !p[f]) fail(`${where}: missing ${f}`);
  }
  if (!["light","deep"].includes(p.tier)) fail(`${where}: tier must be light|deep`);
  if (!Array.isArray(p.sections) || p.sections.length === 0) fail(`${where}: sections empty`);
  for (const [j, s] of p.sections.entries()) {
    if (typeof s?.heading !== "string" || !s.heading) fail(`${where}.sections[${j}]: missing heading`);
    if (typeof s?.summary !== "string" || !s.summary) fail(`${where}.sections[${j}]: missing summary`);
  }
  if (typeof p?.limitsAndFuture?.paperStated !== "string") fail(`${where}: limitsAndFuture.paperStated`);
  if (typeof p?.limitsAndFuture?.evidenceNotes !== "string") fail(`${where}: limitsAndFuture.evidenceNotes`);
  if (!p?.provenance?.sourceUrl) fail(`${where}: provenance.sourceUrl`);
  validateOptionalScorecard(p.scorecard, where);
  validateOptionalDeepDive(p.deepDive, where);
  const blob = JSON.stringify(p);
  if (REPLACEMENT.test(blob)) fail(`${where}: mojibake (U+FFFD)`);
  if (PLACEHOLDER.test(blob)) fail(`${where}: placeholder text`);
}
console.log(`articles.json validation passed (${data.papers.length} papers)`);

function validateOptionalScorecard(value, where) {
  if (value === undefined) return;
  if (!Array.isArray(value)) fail(`${where}: scorecard must be an array`);
  for (const [i, item] of value.entries()) {
    const path = `${where}.scorecard[${i}]`;
    requireString(item?.dimension, `${path}.dimension`);
    if (typeof item?.score !== "number" || item.score < 0 || item.score > 10) fail(`${path}.score must be number 0-10`);
    requireString(item?.reason, `${path}.reason`);
  }
}

function validateOptionalDeepDive(value, where) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${where}: deepDive must be an object`);
  requireString(value.reframe, `${where}.deepDive.reframe`);
  requireString(value.mechanism, `${where}.deepDive.mechanism`);
  requireString(value.loadBearingClaim, `${where}.deepDive.loadBearingClaim`);
  validateContributionLayers(value.contributionLayers, `${where}.deepDive.contributionLayers`);
  validateEvidenceChain(value.evidenceChain, `${where}.deepDive.evidenceChain`);
  validateAudit(value.audit, `${where}.deepDive.audit`);
  validateOptionalFdeTakeaways(value.fdeTakeaways, `${where}.deepDive.fdeTakeaways`);
  validateStringArray(value.strongestEvidence, `${where}.deepDive.strongestEvidence`);
  validateStringArray(value.limitations, `${where}.deepDive.limitations`);
  validateStringArray(value.suggestedExperiments, `${where}.deepDive.suggestedExperiments`);
}

function validateContributionLayers(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    requireString(item?.layer, `${path}[${i}].layer`);
    requireString(item?.claim, `${path}[${i}].claim`);
    requireString(item?.judgment, `${path}[${i}].judgment`);
  }
}

function validateEvidenceChain(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    requireString(item?.component, `${path}[${i}].component`);
    if (!Array.isArray(item?.metrics)) fail(`${path}[${i}].metrics must be an array`);
    for (const [j, metric] of item.metrics.entries()) {
      requireString(metric?.label, `${path}[${i}].metrics[${j}].label`);
      requireString(metric?.value, `${path}[${i}].metrics[${j}].value`);
      if (metric.note !== undefined) requireString(metric.note, `${path}[${i}].metrics[${j}].note`);
    }
    requireString(item?.reviewerNote, `${path}[${i}].reviewerNote`);
  }
}

function validateAudit(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    requireString(item?.claim, `${path}[${i}].claim`);
    requireString(item?.finding, `${path}[${i}].finding`);
    if (item.source !== undefined) requireString(item.source, `${path}[${i}].source`);
  }
}

function validateOptionalFdeTakeaways(value, path) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object`);
  validateStringArray(value.questions, `${path}.questions`, { nonEmpty: true });
  validateStringArray(value.checklist, `${path}.checklist`, { nonEmpty: true });
  validateStringArray(value.artifactsToAudit, `${path}.artifactsToAudit`, { nonEmpty: true });
  requireString(value.roiRisk, `${path}.roiRisk`);
}

function validateStringArray(value, path, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  if (nonEmpty && value.length === 0) fail(`${path} must not be empty`);
  for (const [i, item] of value.entries()) requireString(item, `${path}[${i}]`);
}

function requireString(value, path) {
  if (typeof value !== "string" || !value) fail(`${path}: missing string`);
}
