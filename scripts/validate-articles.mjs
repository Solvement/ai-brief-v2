import { readFile } from "node:fs/promises";

// Academic 精读伴读 lint (2026-06-01). Validates the two-stage reading-companion schema and
// hard-blocks any residue of the deleted verdict / scorecard / FDE / claimLedger / evidenceMatrix
// / artifactAudit modules, plus the old boilerplate strings.

const FILE = new URL("../public/data/articles.json", import.meta.url);
const REPLACEMENT = /�|ï¿½/;          // mojibake guard
const PLACEHOLDER = /\[占位\]|\b(?:TODO|TBD)\b/i; // [占位] / TODO / TBD

const PAPER_TYPES = new Set(["survey", "theory", "system", "benchmark", "dataset", "industry_case", "evaluation_audit", "tooling", "position_roadmap"]);
const VENUE_STATUSES = new Set(["verified", "unverified", "not_provided"]);
const KEY_RESULT_KINDS = new Set(["figure", "table", "result"]);
const MAX_KEY_RESULTS = 5;
const WEIGHTED_FACTORS = ["venuePrestige", "citationConvergence", "novelty", "recency", "evidenceStrength", "reproducibility"];

// Stage-1 (originalReading) must stay faithful: no editorializing. Conservative, high-confidence
// evaluative tokens only (avoids false positives on factual terms like 强化学习 / state-of-the-art reporting).
const EVALUATIVE_ZH = /值得(?:一读|阅读|深读|精读|推荐)?|不值得|(?:强烈)?推荐|不推荐|我认为|我觉得|个人认为|窃以为|堪称|令人(?:印象深刻|惊艳|赞叹|信服)|叹为观止|无可挑剔|完美无缺|遥遥领先|业界领先|优秀|出色|卓越|杰出之作|绝佳|顶级好文/;
const EVALUATIVE_EN = /\bI (?:think|believe|feel)\b|\bworth (?:a )?read(?:ing)?\b|\b(?:highly |strongly )?recommend(?:ed|able)?\b|\bimpressive\b|\bexcellent\b|\boutstanding work\b|\bmust[- ]read\b/i;

// Keys that belonged to the deleted modules — must not appear anywhere in the published JSON.
const FORBIDDEN_KEYS = ["verdict", "scorecard", "fdeTakeaways", "claimLedger", "evidenceMatrix", "artifactAudit", "contributionLayers", "evidenceChain", "whatWouldInvalidate", "readDecision", "fdeFit"];
const FORBIDDEN_STRINGS = ["not specified in fetched text", "Not higher because the collected evidence"];

const warnings = [];
function fail(msg) { console.error(`articles.json validation failed: ${msg}`); process.exit(1); }
function warn(msg) { warnings.push(msg); }

const data = JSON.parse(await readFile(FILE, "utf8"));
if (!data || typeof data.generatedAt !== "string") fail("missing generatedAt");
if (!Array.isArray(data.papers)) fail("papers must be an array");

for (const [i, p] of data.papers.entries()) {
  const where = `papers[${i}] (${p?.id ?? "?"})`;
  for (const f of ["id", "title", "authors", "venue", "sourceName", "sourceUrl", "verifiedAt", "leadJudgment", "analystNotes"]) {
    if (typeof p?.[f] !== "string" || !p[f]) fail(`${where}: missing ${f}`);
  }
  if (p.tier !== "deep") fail(`${where}: tier must be "deep" (academic papers only produce deep)`);

  validateMeta(p.meta, where);
  validateOriginalReading(p.originalReading, where);
  validateLimits(p.limitsAndFuture, where);
  validateSelection(p.selection, where);
  validateSelectionAudit(p.selectionAudit, p.meta, where);
  if (!p?.provenance?.sourceUrl) fail(`${where}: provenance.sourceUrl`);

  const blob = JSON.stringify(p);
  if (REPLACEMENT.test(blob)) fail(`${where}: mojibake (U+FFFD)`);
  if (PLACEHOLDER.test(blob)) fail(`${where}: placeholder text`);
  for (const key of FORBIDDEN_KEYS) {
    if (blob.includes(`"${key}":`)) fail(`${where}: removed-module key "${key}" must not appear (deleted in 2026-06-01 rebuild)`);
  }
  for (const bad of FORBIDDEN_STRINGS) {
    if (blob.includes(bad)) fail(`${where}: forbidden boilerplate string "${bad}"`);
  }
}

for (const w of warnings) console.warn(`articles.json warning: ${w}`);
console.log(`articles.json validation passed (${data.papers.length} papers${warnings.length ? `, ${warnings.length} warning(s)` : ""})`);

function validateMeta(meta, where) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) fail(`${where}: meta must be an object`);
  if (!PAPER_TYPES.has(meta.paperType)) fail(`${where}: meta.paperType must be a known paper type`);
  if (!VENUE_STATUSES.has(meta.venueStatus)) fail(`${where}: meta.venueStatus must be verified|unverified|not_provided`);
  const reliability = meta.sourceReliability;
  if (!reliability || typeof reliability !== "object" || Array.isArray(reliability)) fail(`${where}: meta.sourceReliability must be an object`);
  requireString(reliability.discoverySource, `${where}.meta.sourceReliability.discoverySource`);
  for (const f of ["primarySourceVerified", "paperHtmlFetched", "pdfFetched", "repoFetched", "appendixFetched"]) {
    if (typeof reliability[f] !== "boolean") fail(`${where}.meta.sourceReliability.${f} must be boolean`);
  }
  if (!Array.isArray(meta.tags)) fail(`${where}: meta.tags must be an array`);
  for (const [j, t] of meta.tags.entries()) requireString(t, `${where}.meta.tags[${j}]`);
}

function validateOriginalReading(value, where) {
  if (!Array.isArray(value) || value.length === 0) fail(`${where}: originalReading empty`);
  let keyResultTotal = 0;
  for (const [j, s] of value.entries()) {
    const sp = `${where}.originalReading[${j}]`;
    requireString(s?.heading, `${sp}.heading`);
    requireString(s?.summary, `${sp}.summary`);
    assertFaithful(s.summary, `${sp}.summary`);
    if (s.keyResults !== undefined) {
      if (!Array.isArray(s.keyResults)) fail(`${sp}.keyResults must be an array`);
      for (const [k, r] of s.keyResults.entries()) {
        const rp = `${sp}.keyResults[${k}]`;
        if (!KEY_RESULT_KINDS.has(r?.kind)) fail(`${rp}.kind must be figure|table|result`);
        requireString(r?.ref, `${rp}.ref`);
        requireString(r?.finding, `${rp}.finding`);
        assertFaithful(r.finding, `${rp}.finding`);
        keyResultTotal += 1;
      }
    }
  }
  if (keyResultTotal > MAX_KEY_RESULTS) fail(`${where}: originalReading has ${keyResultTotal} keyResults (max ${MAX_KEY_RESULTS})`);
}

function assertFaithful(text, path) {
  const value = String(text || "");
  if (EVALUATIVE_ZH.test(value) || EVALUATIVE_EN.test(value)) {
    fail(`${path}: Stage-1 原文 must stay faithful — evaluative/judgment language is not allowed (move it to analystNotes)`);
  }
}

function validateLimits(value, where) {
  if (typeof value?.paperStated !== "string") fail(`${where}: limitsAndFuture.paperStated`);
  if (typeof value?.evidenceNotes !== "string") fail(`${where}: limitsAndFuture.evidenceNotes`);
}

function validateSelection(value, where) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${where}: selection must be an object`);
  if (value.convergence !== undefined && !Array.isArray(value.convergence)) fail(`${where}: selection.convergence must be an array`);
  if (value.track !== undefined && !Array.isArray(value.track)) fail(`${where}: selection.track must be an array`);
}

function validateSelectionAudit(value, meta, where) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${where}: selectionAudit must be an object`);
  for (const f of ["candidateCount", "selectedCount", "selectionScore"]) {
    if (typeof value[f] !== "number") fail(`${where}.selectionAudit.${f} must be a number`);
  }
  requireString(value.selectedReason, `${where}.selectionAudit.selectedReason`);
  if (typeof value.rejectedReasonIfAny !== "string") fail(`${where}.selectionAudit.rejectedReasonIfAny must be a string`);
  const factors = value.weightedFactors;
  if (!factors || typeof factors !== "object" || Array.isArray(factors)) fail(`${where}: selectionAudit.weightedFactors must be an object`);
  for (const f of WEIGHTED_FACTORS) {
    const v = factors[f];
    if (typeof v !== "number" && v !== "unknown") fail(`${where}.selectionAudit.weightedFactors.${f} must be a number or "unknown"`);
  }
  if (factors.evidenceStrength === "unknown") warn(`${where}: selectionAudit.weightedFactors.evidenceStrength still "unknown" (post-deep backfill missed)`);
  if (factors.reproducibility === "unknown") warn(`${where}: selectionAudit.weightedFactors.reproducibility still "unknown" (post-deep backfill missed)`);
  requireString(value.discoverySource, `${where}.selectionAudit.discoverySource`);
  requireString(value.primaryEvidenceSource, `${where}.selectionAudit.primaryEvidenceSource`);
  if (value.discoverySource.trim().toLowerCase() === value.primaryEvidenceSource.trim().toLowerCase()) {
    fail(`${where}: selectionAudit.discoverySource must differ from primaryEvidenceSource (discovery channel is not a fact source)`);
  }
}

function requireString(value, path) {
  if (typeof value !== "string" || !value) fail(`${path}: missing string`);
}
