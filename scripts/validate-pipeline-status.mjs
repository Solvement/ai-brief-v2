import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const PUBLIC_STATUS_FILE = path.join(ROOT, "public", "data", "pipeline-status.json");
const MEMORY_DIR = path.join(ROOT, "data", "agent-memory");
const errors = [];

function fail(pathRef, message) {
  errors.push(`${pathRef}: ${message}`);
}

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIso(value) {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isStatus(value) {
  return ["pass", "warning", "fail", "unknown"].includes(value);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function validateQualityGate(gate, pathRef) {
  if (!gate || typeof gate !== "object") {
    fail(pathRef, "qualityGate must be an object");
    return;
  }
  if (!isString(gate.surface)) fail(`${pathRef}.surface`, "must be a non-empty string");
  if (!isStatus(gate.status) || gate.status === "unknown") fail(`${pathRef}.status`, "must be pass, warning, or fail");
  if (!isIso(gate.checkedAt)) fail(`${pathRef}.checkedAt`, "must be an ISO date");
  if (!Array.isArray(gate.checks) || gate.checks.length === 0) {
    fail(`${pathRef}.checks`, "must be a non-empty array");
    return;
  }
  gate.checks.forEach((check, index) => {
    if (!isString(check?.id)) fail(`${pathRef}.checks[${index}].id`, "must be a non-empty string");
    if (!isString(check?.label)) fail(`${pathRef}.checks[${index}].label`, "must be a non-empty string");
    if (!isStatus(check?.status) || check.status === "unknown") fail(`${pathRef}.checks[${index}].status`, "must be pass, warning, or fail");
    if (typeof check?.details !== "string") fail(`${pathRef}.checks[${index}].details`, "must be a string");
  });
}

function validateAgentFlow(flow, pathRef) {
  if (!Array.isArray(flow) || flow.length < 5) {
    fail(pathRef, "agentFlow must contain at least five roles");
    return;
  }
  flow.forEach((step, index) => {
    for (const key of ["role", "responsibility", "signal"]) {
      if (!isString(step?.[key])) fail(`${pathRef}[${index}].${key}`, "must be a non-empty string");
    }
  });
}

function validateTrace(trace, pathRef) {
  if (!trace) return;
  if (typeof trace !== "object") {
    fail(pathRef, "must be an object");
    return;
  }
  if (!trace.summary || typeof trace.summary !== "object") fail(`${pathRef}.summary`, "must be an object");
  if (!Array.isArray(trace.stages)) fail(`${pathRef}.stages`, "must be an array");
}

function validateReflection(reflection, pathRef) {
  if (!reflection) return;
  if (typeof reflection !== "object") {
    fail(pathRef, "must be an object");
    return;
  }
  if (!isString(reflection.summary)) fail(`${pathRef}.summary`, "must be a non-empty string");
  if (!Array.isArray(reflection.nextRunAdjustments)) fail(`${pathRef}.nextRunAdjustments`, "must be an array");
}

function validateMemoryFile(data, pathRef) {
  if (!isString(data?.surface)) fail(`${pathRef}.surface`, "must be a non-empty string");
  if (!isIso(data?.updatedAt)) fail(`${pathRef}.updatedAt`, "must be an ISO date");
  if (!Array.isArray(data?.runs)) {
    fail(`${pathRef}.runs`, "must be an array");
    return;
  }
  data.runs.forEach((run, index) => {
    const runPath = `${pathRef}.runs[${index}]`;
    for (const key of ["id", "surface", "date", "generatedAt"]) {
      if (!isString(run?.[key])) fail(`${runPath}.${key}`, "must be a non-empty string");
    }
    if (!isIso(run?.generatedAt)) fail(`${runPath}.generatedAt`, "must be an ISO date");
    validateAgentFlow(run?.agentFlow, `${runPath}.agentFlow`);
    validateQualityGate(run?.qualityGate, `${runPath}.qualityGate`);
    validateTrace(run?.trace, `${runPath}.trace`);
    validateReflection(run?.reflection, `${runPath}.reflection`);
    if (!Array.isArray(run?.selectedItems)) fail(`${runPath}.selectedItems`, "must be an array");
    if (!Array.isArray(run?.archivedItems)) fail(`${runPath}.archivedItems`, "must be an array");
  });
}

function validatePublicStatus(data) {
  if (!isIso(data?.generatedAt)) fail("$.generatedAt", "must be an ISO date");
  if (!isString(data?.principle)) fail("$.principle", "must be a non-empty string");
  if (!Array.isArray(data?.surfaces)) {
    fail("$.surfaces", "must be an array");
    return;
  }
  data.surfaces.forEach((surface, index) => {
    const pathRef = `$.surfaces[${index}]`;
    if (!isString(surface?.surface)) fail(`${pathRef}.surface`, "must be a non-empty string");
    if (!isIso(surface?.updatedAt)) fail(`${pathRef}.updatedAt`, "must be an ISO date");
    if (!Number.isFinite(surface?.runCount)) fail(`${pathRef}.runCount`, "must be a number");
    if (surface?.latestRun) {
      if (!isString(surface.latestRun.id)) fail(`${pathRef}.latestRun.id`, "must be a non-empty string");
      if (!isStatus(surface.latestRun.qualityStatus)) fail(`${pathRef}.latestRun.qualityStatus`, "must be a supported status");
      if (!Number.isFinite(surface.latestRun.selectedCount)) fail(`${pathRef}.latestRun.selectedCount`, "must be a number");
      if (!Number.isFinite(surface.latestRun.archivedCount)) fail(`${pathRef}.latestRun.archivedCount`, "must be a number");
    }
  });
}

if (existsSync(MEMORY_DIR)) {
  const files = await readdir(MEMORY_DIR);
  for (const name of files.filter((item) => item.endsWith(".json"))) {
    const file = path.join(MEMORY_DIR, name);
    validateMemoryFile(await readJson(file), path.relative(ROOT, file));
  }
}

if (existsSync(PUBLIC_STATUS_FILE)) {
  validatePublicStatus(await readJson(PUBLIC_STATUS_FILE));
}

if (errors.length > 0) {
  throw new Error(`pipeline status validation failed:\n${errors.join("\n")}`);
}

console.log("pipeline status validation passed");
