#!/usr/bin/env node
// Shape validator for the 今日 3 分钟 daily digest (public/data/daily-digest.json
// + any data/digest/<date>.json archives). Keeps the hand-authored reference and
// the generator's output honest. Runs inside `npm run validate`.

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LIVE_FILE = path.join(ROOT, "public", "data", "daily-digest.json");
const ARCHIVE_DIR = path.join(ROOT, "data", "digest");

const KINDS = new Set(["paper", "project", "model", "news", "podcast"]);
const errors = [];

function fail(file, msg) { errors.push(`${path.relative(ROOT, file)}: ${msg}`); }
function isString(v) { return typeof v === "string" && v.trim().length > 0; }
function isIsoDate(v) { return isString(v) && !Number.isNaN(Date.parse(v)); }
function isDate(v) { return isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v); }

function validateItem(file, it, where) {
  if (!it || typeof it !== "object") { fail(file, `${where} must be an object`); return; }
  if (!KINDS.has(it.kind)) fail(file, `${where}.kind must be one of ${[...KINDS].join("|")}`);
  if (!isString(it.title)) fail(file, `${where}.title must be a non-empty string`);
  if (!isString(it.href)) fail(file, `${where}.href must be a non-empty string`);
  // internal links must be absolute paths; external must be http(s)
  if (isString(it.href) && !it.href.startsWith("/") && !/^https?:\/\//.test(it.href)) {
    fail(file, `${where}.href must be an internal path (/...) or an http(s) URL`);
  }
  if ("one_line" in it && it.one_line !== undefined && typeof it.one_line !== "string") {
    fail(file, `${where}.one_line must be a string when present`);
  }
  if ("score" in it && it.score !== undefined && !Number.isFinite(it.score)) {
    fail(file, `${where}.score must be a number when present`);
  }
}

function validateDigest(file, data) {
  if (!isDate(data?.date)) fail(file, "date must be YYYY-MM-DD");
  if (!isIsoDate(data?.generatedAt)) fail(file, "generatedAt must be an ISO date");
  if (!isString(data?.lede)) fail(file, "lede must be a non-empty string");
  if ("readMinutes" in data && !Number.isFinite(data.readMinutes)) fail(file, "readMinutes must be a number");
  if (!data?.audio || typeof data.audio !== "object") {
    fail(file, "audio must be an object");
  } else if (typeof data.audio.available !== "boolean") {
    fail(file, "audio.available must be a boolean");
  }
  if (!Array.isArray(data?.clusters) || data.clusters.length === 0) {
    fail(file, "clusters must be a non-empty array");
    return;
  }
  if (data.clusters.length > 6) fail(file, "clusters must contain at most 6 themes (digest = ~3 min read)");
  const ids = new Set();
  data.clusters.forEach((c, ci) => {
    const w = `clusters[${ci}]`;
    if (!isString(c?.id)) fail(file, `${w}.id must be a non-empty string`);
    else if (ids.has(c.id)) fail(file, `${w}.id "${c.id}" is duplicated`);
    else ids.add(c.id);
    if (!isString(c?.theme)) fail(file, `${w}.theme must be a non-empty string`);
    if ("why_it_matters" in c && c.why_it_matters !== undefined && typeof c.why_it_matters !== "string") {
      fail(file, `${w}.why_it_matters must be a string when present`);
    }
    if (!Array.isArray(c?.items) || c.items.length === 0) {
      fail(file, `${w}.items must be a non-empty array`);
    } else {
      c.items.forEach((it, ii) => validateItem(file, it, `${w}.items[${ii}]`));
    }
  });
}

async function check(file) {
  let data;
  try { data = JSON.parse(await readFile(file, "utf8")); }
  catch (e) { fail(file, `invalid JSON: ${e.message}`); return; }
  validateDigest(file, data);
}

if (existsSync(LIVE_FILE)) {
  await check(LIVE_FILE);
} else {
  console.warn("daily digest: public/data/daily-digest.json not found — skipping (generate it via scripts/columns/digest/daily.mjs)");
}

if (existsSync(ARCHIVE_DIR)) {
  for (const name of await readdir(ARCHIVE_DIR)) {
    if (name.endsWith(".json")) await check(path.join(ARCHIVE_DIR, name));
  }
}

if (errors.length > 0) {
  throw new Error(`daily digest validation failed:\n${errors.join("\n")}`);
}

console.log("daily digest validation passed");
