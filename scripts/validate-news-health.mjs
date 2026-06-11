#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const FILE = path.join(ROOT, "public", "data", "news-health.json");
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
  return value === "pass" || value === "fail";
}

if (!existsSync(FILE)) {
  fail("public/data/news-health.json", "file is missing; run npm run news:daily");
} else {
  const data = JSON.parse(await readFile(FILE, "utf8"));
  if (data?.schemaVersion !== 1) fail("$.schemaVersion", "must be 1");
  if (!isIso(data?.generatedAt)) fail("$.generatedAt", "must be an ISO date");
  if (data?.column !== "news") fail("$.column", "must be news");
  if (data?.dataFile !== "public/data/news.json") fail("$.dataFile", "must point at public/data/news.json");
  if (!isIso(data?.dataGeneratedAt)) fail("$.dataGeneratedAt", "must be an ISO date");
  if (typeof data?.ok !== "boolean") fail("$.ok", "must be a boolean");
  if (!isStatus(data?.status)) fail("$.status", "must be pass or fail");
  if (data?.ok !== (data?.status === "pass")) fail("$.ok", "must match status");
  for (const key of ["maxAgeDays", "totalDiscovered", "totalPublished", "totalPublishedForGeneratedDay", "sourceCount", "successfulSourceCount", "failedSourceCount"]) {
    if (!Number.isFinite(data?.[key])) fail(`$.${key}`, "must be a number");
  }
  if (!(data?.maxAgeDays > 0)) fail("$.maxAgeDays", "must be positive");
  if (!(data?.ageDays === null || Number.isFinite(data?.ageDays))) fail("$.ageDays", "must be a number or null");
  if (!Array.isArray(data?.failedSources)) fail("$.failedSources", "must be an array");
  if (!Array.isArray(data?.checks) || data.checks.length === 0) {
    fail("$.checks", "must be a non-empty array");
  } else {
    data.checks.forEach((check, index) => {
      if (!isString(check?.id)) fail(`$.checks[${index}].id`, "must be a non-empty string");
      if (!isString(check?.label)) fail(`$.checks[${index}].label`, "must be a non-empty string");
      if (!isStatus(check?.status)) fail(`$.checks[${index}].status`, "must be pass or fail");
      if (typeof check?.details !== "string") fail(`$.checks[${index}].details`, "must be a string");
    });
  }
  if (!Array.isArray(data?.failures)) fail("$.failures", "must be an array");
  if (data?.status === "pass" && data?.failures?.length) fail("$.failures", "must be empty when status is pass");
  if (data?.status === "fail" && !data?.failures?.length) fail("$.failures", "must explain fail status");
  if (data?.status !== "pass") fail("$.status", `news health is ${data.status}: ${(data.failures || []).join("; ")}`);
}

if (errors.length > 0) {
  throw new Error(`news health validation failed:\n${errors.join("\n")}`);
}

console.log("news health validation passed");
