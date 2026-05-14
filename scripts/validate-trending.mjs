import { readFile } from "node:fs/promises";

const file = new URL("../public/data/trending.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const errors = [];

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateRepo(repo, path) {
  const requiredStrings = ["fullName", "owner", "name", "url", "ownerAvatarUrl", "tldr", "light"];
  for (const key of requiredStrings) {
    if (typeof repo[key] !== "string" || repo[key].trim() === "") fail(`${path}.${key}`, "must be a non-empty string");
  }

  for (const key of ["stars", "forks", "starsGained", "rank", "worthDeepDive"]) {
    if (!isNumber(repo[key])) fail(`${path}.${key}`, "must be a number");
  }

  if (!Array.isArray(repo.tags)) fail(`${path}.tags`, "must be an array");

  if (repo.deep) {
    const deep = repo.deep;
    for (const key of ["atGlance", "howItWorks", "novelty", "ecosystem"]) {
      if (typeof deep[key] !== "string" || deep[key].trim() === "") fail(`${path}.deep.${key}`, "must be a non-empty string");
    }
    if (!Array.isArray(deep.whyItMatters) || deep.whyItMatters.length === 0) fail(`${path}.deep.whyItMatters`, "must have items");
    if (!Array.isArray(deep.keyConcepts)) fail(`${path}.deep.keyConcepts`, "must be an array");
    if (!Array.isArray(deep.limitations)) fail(`${path}.deep.limitations`, "must be an array");
    if (!Array.isArray(deep.tryIt)) fail(`${path}.deep.tryIt`, "must be an array");
    const score = deep.score;
    if (!score || typeof score !== "object") {
      fail(`${path}.deep.score`, "must exist");
    } else {
      for (const key of ["novelty", "engineering", "reproducibility", "timeToValue"]) {
        if (!isNumber(score[key]) || score[key] < 0 || score[key] > 25) fail(`${path}.deep.score.${key}`, "must be 0-25");
      }
    }
  }
}

if (!data || typeof data !== "object") fail("$", "must be an object");
if (!isIso(data.generatedAt)) fail("$.generatedAt", "must be an ISO date");

for (const windowName of ["daily", "weekly", "monthly"]) {
  const board = data[windowName];
  if (!board || typeof board !== "object") {
    fail(`$.${windowName}`, "must exist");
    continue;
  }
  if (board.window !== windowName) fail(`$.${windowName}.window`, `must be ${windowName}`);
  if (!isIso(board.generatedAt)) fail(`$.${windowName}.generatedAt`, "must be an ISO date");
  if (!Array.isArray(board.repos)) {
    fail(`$.${windowName}.repos`, "must be an array");
    continue;
  }
  if (board.repos.length === 0) fail(`$.${windowName}.repos`, "must not be empty");
  board.repos.forEach((repo, index) => validateRepo(repo, `$.${windowName}.repos[${index}]`));
}

if (errors.length > 0) {
  throw new Error(`trending.json validation failed:\n${errors.join("\n")}`);
}

console.log("trending.json validation passed");
