#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "papers");
const REVIEWED_DIR = path.join(DATA_DIR, "reviewed");
const PUBLIC_RADAR_FILE = path.join(ROOT, "public", "data", "paper-radar.json");
const errors = [];

function fail(file, message) {
  errors.push(`${path.relative(ROOT, file)}: ${message}`);
}

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function isNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0;
}

function requiresObservability(data) {
  return (data?.schemaVersion || 1) >= 3 || String(data?.date || "") >= "2026-05-20";
}

function isDecision(value) {
  return ["ignore", "skim", "read", "review", "deep_dive", "implement"].includes(value);
}

function validateStringArray(value, pathRef, min = 0) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    fail(pathRef, "must be an array");
    return;
  }
  if (value.length < min) fail(pathRef, `must have at least ${min} item(s)`);
  value.forEach((item, index) => {
    if (!isString(item)) fail(`${pathRef}[${index}]`, "must be a non-empty string");
  });
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function validateCandidate(file, item, index) {
  const prefix = `candidates[${index}]`;
  for (const key of [
    "id",
    "key",
    "title",
    "source",
    "sourceName",
    "sourceUrl",
    "paperUrl",
    "discoveredAt",
    "version",
  ]) {
    if (!isString(item?.[key])) fail(file, `${prefix}.${key} must be a non-empty string`);
  }
  if (!isIsoDate(item?.discoveredAt)) fail(file, `${prefix}.discoveredAt must be an ISO date`);
  validateStringArray(item?.authors, `${prefix}.authors`, 0);
  validateStringArray(item?.sourceSignals, `${prefix}.sourceSignals`, 1);
  validateStringArray(item?.focusTopics, `${prefix}.focusTopics`, 1);
}

function validateDiscoveryTrace(file, data) {
  if (!Array.isArray(data?.discoveryTrace) || data.discoveryTrace.length === 0) {
    fail(file, "discoveryTrace must be a non-empty array");
    return;
  }
  data.discoveryTrace.forEach((trace, index) => {
    const prefix = `discoveryTrace[${index}]`;
    for (const key of ["source", "sourceName", "status"]) {
      if (!isString(trace?.[key])) fail(file, `${prefix}.${key} must be a non-empty string`);
    }
    if (!["ok", "failed"].includes(trace?.status)) fail(file, `${prefix}.status must be ok or failed`);
    if (!Array.isArray(trace?.sourceSignals) || trace.sourceSignals.length === 0) {
      fail(file, `${prefix}.sourceSignals must be a non-empty array`);
    }
    if (!isNonNegativeNumber(trace?.candidateCount)) fail(file, `${prefix}.candidateCount must be a non-negative number`);
    if (!isNonNegativeNumber(trace?.rawCandidateCount)) fail(file, `${prefix}.rawCandidateCount must be a non-negative number`);
    if ("query" in trace && !isString(trace?.queryLabel)) fail(file, `${prefix}.queryLabel must be present when query is present`);
    if (trace?.status === "failed" && !isString(trace?.failureReason)) fail(file, `${prefix}.failureReason must explain failures`);
  });
}

function validateTriageItem(file, item, index, allowedDecisions, strictFields, pathPrefix = "top", observabilityFields = false) {
  validateCandidate(file, item, index);
  const triage = item?.triage;
  const triageBase = `${pathPrefix}[${index}].triage`;
  if (!triage || typeof triage !== "object") {
    fail(file, `${triageBase} must be an object`);
    return;
  }
  for (const key of ["role_relevance", "architecture_value", "practicality", "novelty", "evaluation_quality", "interview_value", "build_potential"]) {
    if (!isScore(triage[key])) fail(file, `${triageBase}.${key} must be 0-100`);
  }
  if (!isScore(triage.total_score) && !isScore(triage.score)) {
    fail(file, `${triageBase}.total_score or ${triageBase}.score must be 0-100`);
  }
  if (!isDecision(triage.decision)) fail(file, `${triageBase}.decision is invalid`);
  if (allowedDecisions.length > 0 && !allowedDecisions.includes(triage.decision)) {
    fail(file, `${triageBase}.decision must be in triage file decisions`);
  }
  validateStringArray(triage?.matched_topics, `${triageBase}.matched_topics`, strictFields ? 1 : 0);
  if (!isScore(triage.source_quality)) fail(file, `${triageBase}.source_quality must be 0-100`);
  if (strictFields) {
    if (!isString(triage.freshness_signal)) fail(file, `${triageBase}.freshness_signal must be a non-empty string`);
    if (!isString(triage.hotness_signal)) fail(file, `${triageBase}.hotness_signal must be a non-empty string`);
    if (!isString(triage.reason) && !isString(triage.deterministic_reason)) {
      fail(file, `${triageBase}.reason or ${triageBase}.deterministic_reason must be a non-empty string`);
    }
  }
  if (observabilityFields) {
    if (!Array.isArray(triage?.matched_ahe_signals)) fail(file, `${triageBase}.matched_ahe_signals must be an array`);
    if (!isNonNegativeNumber(triage?.freshness_days)) fail(file, `${triageBase}.freshness_days must be a non-negative number`);
    if (!isString(triage?.selection_status)) fail(file, `${triageBase}.selection_status must be a non-empty string`);
    if (!["selected", "rejected", "below_top_cutoff"].includes(triage?.selection_status)) {
      fail(file, `${triageBase}.selection_status is invalid`);
    }
    if (triage?.selection_status === "selected") {
      if (!isString(triage?.selected_reason)) fail(file, `${triageBase}.selected_reason must explain selection`);
    } else if (!isString(triage?.rejection_reason)) {
      fail(file, `${triageBase}.rejection_reason must explain rejection or cutoff`);
    }
  }
}

function validateReview(file, data) {
  for (const key of [
    "id",
    "key",
    "title",
    "sourceUrl",
    "paperUrl",
    "version",
    "reviewedAt",
    "model",
    "abstract_takeaway",
    "motivation",
    "solution",
    "design",
    "evaluation",
    "results",
    "architecture_takeaway",
  ]) {
    if (!isString(data?.[key])) fail(file, `${key} must be a non-empty string`);
  }
  for (const key of ["strengths", "weaknesses", "interview_talking_points", "likely_interview_questions", "project_ideas"]) {
    if (!Array.isArray(data?.[key])) fail(file, `${key} must be an array`);
  }
  if ((data?.schemaVersion || 1) >= 2) {
    if (!isString(data?.professor_lens)) fail(file, "professor_lens must be a non-empty string");
    validateStringArray(data?.what_to_learn, "what_to_learn", 1);
    validateStringArray(data?.good_ideas, "good_ideas", 1);
    validateStringArray(data?.bad_ideas_or_limits, "bad_ideas_or_limits", 1);
    validateStringArray(data?.transferable_patterns, "transferable_patterns", 1);
    validateStringArray(data?.future_work_applications, "future_work_applications", 1);
    validateStringArray(data?.reading_questions, "reading_questions", 1);
    validateStringArray(data?.learning_tasks, "learning_tasks", 1);
  }
}

function validateDailyPaper(file, item, pathPrefix, strictSignals) {
  const prefix = `daily.${pathPrefix}`;
  for (const key of ["id", "title", "sourceName", "sourceUrl", "daily_action", "triage_decision"]) {
    if (!isString(item?.[key])) fail(file, `${prefix}.${key} must be a non-empty string`);
  }
  if (!isDecision(item?.triage_decision)) fail(file, `${prefix}.triage_decision is invalid`);
  if (!isScore(item?.total_score)) fail(file, `${prefix}.total_score must be 0-100`);
  validateStringArray(item?.matched_topics, `${prefix}.matched_topics`, strictSignals ? 1 : 0);
  if (strictSignals) {
    if (!isString(item?.freshness_signal)) fail(file, `${prefix}.freshness_signal must be a non-empty string`);
    if (!isString(item?.hotness_signal)) fail(file, `${prefix}.hotness_signal must be a non-empty string`);
    if (!isString(item?.reason)) fail(file, `${prefix}.reason must be a non-empty string`);
  }
}

function validateAgentFlow(file, flow) {
  if (!Array.isArray(flow) || flow.length < 5) {
    fail(file, "agentFlow must contain at least 5 pipeline roles");
    return;
  }
  flow.forEach((item, index) => {
    for (const key of ["role", "responsibility", "signal"]) {
      if (!isString(item?.[key])) fail(file, `agentFlow[${index}].${key} must be a non-empty string`);
    }
  });
}

function validateRunTrace(file, trace, pathRef = "runTrace") {
  if (!trace || typeof trace !== "object") {
    fail(file, `${pathRef} must be an object`);
    return;
  }
  if (!trace.summary || typeof trace.summary !== "object") fail(file, `${pathRef}.summary must be an object`);
  if (!Array.isArray(trace.stages) || trace.stages.length === 0) {
    fail(file, `${pathRef}.stages must be a non-empty array`);
  } else {
    trace.stages.forEach((stage, index) => {
      if (!isString(stage?.stage)) fail(file, `${pathRef}.stages[${index}].stage must be a non-empty string`);
      if ("durationMs" in stage && !isNonNegativeNumber(stage.durationMs)) fail(file, `${pathRef}.stages[${index}].durationMs must be a non-negative number`);
    });
  }
  if (trace.modelUsage && !isNonNegativeNumber(trace.modelUsage.calls)) fail(file, `${pathRef}.modelUsage.calls must be a non-negative number`);
}

function validateReflection(file, reflection, pathRef = "reflection") {
  if (!reflection || typeof reflection !== "object") {
    fail(file, `${pathRef} must be an object`);
    return;
  }
  if (!isString(reflection.summary)) fail(file, `${pathRef}.summary must be a non-empty string`);
  if (!isNonNegativeNumber(reflection.averageReviewDepth)) fail(file, `${pathRef}.averageReviewDepth must be a non-negative number`);
  validateStringArray(reflection.whatWorked, `${pathRef}.whatWorked`, 1);
  validateStringArray(reflection.whatToWatch, `${pathRef}.whatToWatch`, 0);
  validateStringArray(reflection.selfCorrections, `${pathRef}.selfCorrections`, 1);
  validateStringArray(reflection.nextRunAdjustments, `${pathRef}.nextRunAdjustments`, 1);
}

async function validateCandidates(file) {
  const data = await readJson(file);
  if (!isString(data?.date)) fail(file, "date must be a non-empty string");
  if (!Array.isArray(data?.candidates)) {
    fail(file, "candidates must be an array");
    return;
  }
  if (requiresObservability(data)) validateDiscoveryTrace(file, data);
  if (data?.runTrace) validateRunTrace(file, data.runTrace);
  data.candidates.forEach((item, index) => validateCandidate(file, item, index));
}

async function validateTriage(file) {
  const data = await readJson(file);
  if (!isString(data?.date)) fail(file, "date must be a non-empty string");
  const schemaVersion = data?.schemaVersion || 1;
  const strictFields = schemaVersion >= 2;
  if (!Array.isArray(data?.top)) {
    fail(file, "top must be an array");
    return;
  }
  if (data.top.length > 10) fail(file, "top must contain at most 10 papers");
  const decisions = Array.isArray(data?.decisions) ? data.decisions : [];
  if (decisions.length > 0 && decisions.some((decision) => !isString(decision))) {
    decisions.forEach((decision, index) => {
      if (!isString(decision)) fail(file, `decisions[${index}] must be a non-empty string`);
    });
  }
  if (strictFields && decisions.length === 0) fail(file, "decisions must be a non-empty array");
  const observabilityFields = requiresObservability(data);
  if (observabilityFields) {
    if (data?.runTrace) validateRunTrace(file, data.runTrace);
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      fail(file, "items must be a non-empty array with selected and rejected triage decisions");
    } else {
      data.items.forEach((item, index) => validateTriageItem(file, item, index, decisions, strictFields, "items", true));
      if (!data.items.some((item) => item?.triage?.selection_status !== "selected")) {
        fail(file, "items must include rejected or below_top_cutoff explanations");
      }
    }
  }
  data.top.forEach((item, index) => validateTriageItem(file, item, index, decisions, strictFields, "top", observabilityFields));
}

async function validateDaily(file) {
  const data = await readJson(file);
  if (!isString(data?.date)) fail(file, "date must be a non-empty string");
  if (!data?.one_must_read_paper || typeof data.one_must_read_paper !== "object") {
    fail(file, "one_must_read_paper must be an object");
    return;
  }
  const strictSignals = (data?.schemaVersion || 1) >= 2;
  validateDailyPaper(file, data.one_must_read_paper, "one_must_read_paper", strictSignals);
  if (!Array.isArray(data?.three_skim_papers)) {
    fail(file, "three_skim_papers must be an array");
  } else {
    data.three_skim_papers.forEach((item, index) => validateDailyPaper(file, item, `three_skim_papers[${index}]`, strictSignals));
  }
  if (strictSignals) {
    for (const key of ["one_professor_lesson", "one_good_idea_to_steal", "one_bad_idea_or_risk", "one_transferable_pattern", "one_future_work_application"]) {
      if (!isString(data?.[key])) fail(file, `${key} must be a non-empty string`);
    }
    if (Array.isArray(data?.reviewedFiles) && data.reviewedFiles.length > 0) {
      data.reviewedFiles.forEach((item, index) => {
        if (!isString(item?.id)) fail(file, `reviewedFiles[${index}].id must be a non-empty string`);
        if (!isString(item?.title)) fail(file, `reviewedFiles[${index}].title must be a non-empty string`);
        if (!isString(item?.file)) fail(file, `reviewedFiles[${index}].file must be a non-empty string`);
      });
    } else {
      fail(file, "reviewedFiles must be a non-empty array");
    }
  }
  if (requiresObservability(data)) validateAgentFlow(file, data?.agent_flow);
  if ((data?.schemaVersion || 1) >= 3) {
    validateRunTrace(file, data?.run_trace, "run_trace");
    validateReflection(file, data?.reflection);
  }
}

async function validatePublicRadar(file) {
  const data = await readJson(file);
  if (!isString(data?.date)) fail(file, "date must be a non-empty string");
  if (!isIsoDate(data?.generatedAt)) fail(file, "generatedAt must be an ISO date");
  if (!data?.sourceFiles || !isString(data.sourceFiles.daily) || !isString(data.sourceFiles.triage)) {
    fail(file, "sourceFiles.daily and sourceFiles.triage must be non-empty strings");
  }
  if (!data?.mustRead || typeof data.mustRead !== "object") {
    fail(file, "mustRead must be an object");
  } else {
    validateDailyPaper(file, data.mustRead, "mustRead", true);
  }
  if (!Array.isArray(data?.skim) || data.skim.length > 3) fail(file, "skim must be an array with at most 3 papers");
  (data.skim || []).forEach((item, index) => validateDailyPaper(file, item, `skim[${index}]`, true));
  validateAgentFlow(file, data?.agentFlow);
  if (data?.runTrace) validateRunTrace(file, data.runTrace);
  if (data?.reflection) validateReflection(file, data.reflection);
  for (const key of [
    "professorLesson",
    "goodIdeaToSteal",
    "badIdeaOrRisk",
    "transferablePattern",
    "futureWorkApplication",
    "architectureTakeaway",
    "interviewTalkingPoint",
    "projectIdea",
  ]) {
    if (!isString(data?.[key])) fail(file, `${key} must be a non-empty string`);
  }
  if (!Array.isArray(data?.selectionTrace) || data.selectionTrace.length === 0) {
    fail(file, "selectionTrace must be a non-empty array");
  }
}

if (existsSync(DATA_DIR)) {
  const files = await readdir(DATA_DIR);
  for (const name of files) {
    const file = path.join(DATA_DIR, name);
    if (name.startsWith("candidates-") && name.endsWith(".json")) await validateCandidates(file);
    if (name.startsWith("triage-") && name.endsWith(".json")) await validateTriage(file);
    if (name.startsWith("daily-") && name.endsWith(".json")) await validateDaily(file);
  }
}

if (existsSync(REVIEWED_DIR)) {
  const files = await readdir(REVIEWED_DIR);
  for (const name of files.filter((item) => item.endsWith(".json"))) {
    const file = path.join(REVIEWED_DIR, name);
    await validateReview(file, await readJson(file));
  }
}

if (existsSync(PUBLIC_RADAR_FILE)) {
  await validatePublicRadar(PUBLIC_RADAR_FILE);
}

if (errors.length > 0) {
  throw new Error(`papers radar validation failed:\n${errors.join("\n")}`);
}

console.log("papers radar validation passed");
