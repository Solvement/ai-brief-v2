import { readFile } from "node:fs/promises";

const FILE = new URL("../public/data/articles.json", import.meta.url);
const REPLACEMENT = /\uFFFD|\u00ef\u00bf\u00bd/; // mojibake guard (RULES §9)
const PLACEHOLDER = /\[\u5360\u4f4d\]|\b(?:TODO|TBD)\b/i;
const FDE_SCORECARD_DIMENSIONS = new Set([
  "FDE相关性",
  "工程现实感",
  "问题重要性",
  "方法新颖性",
  "证据强度",
  "可复现性",
  "可部署性",
  "安全治理意识",
  "ROI可解释性",
  "职业训练价值",
]);

const PAPER_TYPES = new Set(["survey", "theory", "system", "benchmark", "dataset", "industry_case", "evaluation_audit", "tooling", "position_roadmap"]);
const VENUE_STATUSES = new Set(["verified", "unverified", "not_provided"]);
const READ_DECISIONS = new Set(["must_read", "read", "skim", "watch", "skip"]);
const FDE_FITS = new Set(["high", "medium", "low"]);
const VERDICT_EVIDENCE_STRENGTHS = new Set(["strong", "medium", "weak"]);
const ARTIFACT_STATUSES = new Set(["official", "partial", "third_party_only", "none"]);
const CLAIM_TYPES = new Set(["theoretical", "empirical", "engineering", "fde_extrapolation"]);
const CLAIM_EVIDENCE_STRENGTHS = new Set(["high", "medium", "low"]);
const EXACTNESS_VALUES = new Set(["exact", "estimated_from_figure", "author_claim"]);
const OFFICIAL_CODE_STATUSES = new Set(["verified", "not_found", "partial", "third_party_only"]);
const DATA_STATUSES = new Set(["available", "not_found", "restricted", "not_applicable"]);
const REPRODUCIBILITY_STATUSES = new Set(["full", "partial", "artifact_light", "paper_only", "third_party_only"]);

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
  if (p.paperType !== undefined && !PAPER_TYPES.has(p.paperType)) fail(`${where}: paperType must be a known research-workbench paper type`);
  if (p.venueStatus !== undefined && !VENUE_STATUSES.has(p.venueStatus)) fail(`${where}: venueStatus must be verified|unverified|not_provided`);
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
  const dimensions = new Set();
  for (const [i, item] of value.entries()) {
    const path = `${where}.scorecard[${i}]`;
    requireString(item?.dimension, `${path}.dimension`);
    if (typeof item?.score !== "number" || item.score < 0 || item.score > 10) fail(`${path}.score must be number 0-10`);
    requireString(item?.reason, `${path}.reason`);
    dimensions.add(item.dimension);
  }
  const expandedCount = [...dimensions].filter((dimension) => FDE_SCORECARD_DIMENSIONS.has(dimension)).length;
  if (expandedCount > 0 && expandedCount !== 10 && value.length >= 10) {
    fail(`${where}: expanded scorecard must include all 10 FDE dimensions`);
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
  validateOptionalVerdict(value.verdict, `${where}.deepDive.verdict`);
  validateOptionalClaimLedger(value.claimLedger, `${where}.deepDive.claimLedger`);
  validateOptionalEvidenceMatrix(value.evidenceMatrix, `${where}.deepDive.evidenceMatrix`);
  validateOptionalArtifactAudit(value.artifactAudit, `${where}.deepDive.artifactAudit`);
  if (value.whatWouldInvalidate !== undefined) validateStringArray(value.whatWouldInvalidate, `${where}.deepDive.whatWouldInvalidate`, { nonEmpty: true });
  validateStringArray(value.strongestEvidence, `${where}.deepDive.strongestEvidence`);
  validateStringArray(value.limitations, `${where}.deepDive.limitations`);
  validateStringArray(value.suggestedExperiments, `${where}.deepDive.suggestedExperiments`);
}

function validateOptionalVerdict(value, path) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object`);
  requireEnum(value.readDecision, READ_DECISIONS, `${path}.readDecision`);
  requireEnum(value.fdeFit, FDE_FITS, `${path}.fdeFit`);
  requireEnum(value.evidenceStrength, VERDICT_EVIDENCE_STRENGTHS, `${path}.evidenceStrength`);
  requireEnum(value.artifactStatus, ARTIFACT_STATUSES, `${path}.artifactStatus`);
  requireString(value.oneLineJudgment, `${path}.oneLineJudgment`);
  validateStringArray(value.whyNow, `${path}.whyNow`, { nonEmpty: true });
  validateStringArray(value.whyNotOverclaim, `${path}.whyNotOverclaim`, { nonEmpty: true });
}

function validateOptionalClaimLedger(value, path) {
  if (value === undefined) return;
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    const rowPath = `${path}[${i}]`;
    requireString(item?.claim, `${rowPath}.claim`);
    requireEnum(item?.claimType, CLAIM_TYPES, `${rowPath}.claimType`);
    requireString(item?.evidencePointer, `${rowPath}.evidencePointer`);
    if (!isValidEvidencePointer(item.evidencePointer)) {
      fail(`${rowPath}.evidencePointer must cite Sec/Fig/Table/Appendix/repo or say "not specified in fetched text"`);
    }
    requireEnum(item?.evidenceStrength, CLAIM_EVIDENCE_STRENGTHS, `${rowPath}.evidenceStrength`);
    requireString(item?.threat, `${rowPath}.threat`);
    requireString(item?.fdeTransfer, `${rowPath}.fdeTransfer`);
  }
}

function validateOptionalEvidenceMatrix(value, path) {
  if (value === undefined) return;
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    const rowPath = `${path}[${i}]`;
    requireString(item?.experiment, `${rowPath}.experiment`);
    if (item.sampleSize !== undefined) requireString(item.sampleSize, `${rowPath}.sampleSize`);
    if (item.modelBackend !== undefined) requireString(item.modelBackend, `${rowPath}.modelBackend`);
    requireString(item?.metric, `${rowPath}.metric`);
    requireString(item?.result, `${rowPath}.result`);
    requireEnum(item?.exactness, EXACTNESS_VALUES, `${rowPath}.exactness`);
    requireString(item?.limitation, `${rowPath}.limitation`);
  }
}

function validateOptionalArtifactAudit(value, path) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object`);
  requireEnum(value.officialCode, OFFICIAL_CODE_STATUSES, `${path}.officialCode`);
  requireEnum(value.data, DATA_STATUSES, `${path}.data`);
  if (value.repoStatus !== undefined) requireString(value.repoStatus, `${path}.repoStatus`);
  requireEnum(value.reproducibility, REPRODUCIBILITY_STATUSES, `${path}.reproducibility`);
  validateStringArray(value.notes, `${path}.notes`);
}

function validateContributionLayers(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  for (const [i, item] of value.entries()) {
    requireString(item?.layer, `${path}[${i}].layer`);
    requireString(item?.claim, `${path}[${i}].claim`);
    if (item?.evidence !== undefined || item?.fdeMeaning !== undefined) {
      requireString(item?.evidence, `${path}[${i}].evidence`);
      requireString(item?.fdeMeaning, `${path}[${i}].fdeMeaning`);
    }
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
  requireString(value.customerProblem, `${path}.customerProblem`);
  validateStringArray(value.customerQuestions, `${path}.customerQuestions`, { nonEmpty: true, min: 5, max: 10 });
  validateStringArray(value.artifactsToAudit, `${path}.artifactsToAudit`, { nonEmpty: true });
  validateStringArray(value.implementationChecklist, `${path}.implementationChecklist`, { nonEmpty: true });
  validateStringArray(value.evalPlan, `${path}.evalPlan`, { nonEmpty: true });
  validateStringArray(value.rolloutPlan, `${path}.rolloutPlan`, { nonEmpty: true });
  validateStringArray(value.riskRegister, `${path}.riskRegister`, { nonEmpty: true });
  requireString(value.roiHypothesis, `${path}.roiHypothesis`);
  requireString(value.interviewStory, `${path}.interviewStory`);
}

function validateStringArray(value, path, { nonEmpty = false, min = 0, max = Infinity } = {}) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  if (nonEmpty && value.length === 0) fail(`${path} must not be empty`);
  if (value.length < min) fail(`${path} must contain at least ${min} item(s)`);
  if (value.length > max) fail(`${path} must contain at most ${max} item(s)`);
  for (const [i, item] of value.entries()) requireString(item, `${path}[${i}]`);
}

function requireEnum(value, allowed, path) {
  if (typeof value !== "string" || !allowed.has(value)) fail(`${path}: invalid enum value`);
}

function isValidEvidencePointer(value) {
  return value === "not specified in fetched text"
    || /(?:\bSec(?:tion)?\.?\b|§|\bFig(?:ure)?\.?\b|\bTable\b|\bAppendix\b|\bApp\.?\b|\brepo(?:sitory)?\b|\bREADME\b|\bcode\b|\bdataset\b|https?:\/\/)/i.test(String(value || ""));
}

function requireString(value, path) {
  if (typeof value !== "string" || !value) fail(`${path}: missing string`);
}
