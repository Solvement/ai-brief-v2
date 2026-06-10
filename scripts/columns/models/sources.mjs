#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchWithRetry } from "../../lib/http.mjs";
import { MODEL_REGISTRY, getModelConfig, listModelConfigs } from "./registry.mjs";

const DEFAULT_USER_AGENT = "Mozilla/5.0 ai-brief-models/0.3";
const HF_API_BASE = "https://huggingface.co/api";
const HF_WEB_BASE = "https://huggingface.co";
const OFFLINE_TIMESTAMP = "2026-06-02T00:00:00.000Z";
const SOURCE_TEXT_LIMIT = 32000;

export async function fetchModelStatus(model, options = {}) {
  if (!model) throw new Error("fetchModelStatus requires model config");
  if (options.offline || options.noLlm || options.dryRun) return buildOfflineModelStatus(model, options);
  if (model.kind === "open") return fetchOpenModelStatus(model, options);
  if (model.kind === "closed") return fetchClosedModelStatus(model, options);
  throw new Error(`Unknown model kind: ${model.kind}`);
}

export async function checkAllModelStatuses(models = MODEL_REGISTRY, options = {}) {
  const out = [];
  for (const model of models) out.push(await fetchModelStatus(model, options));
  return out;
}

export async function fetchOpenModelStatus(model, options = {}) {
  if (!model.hfId) throw new Error(`open model ${model.id} requires hfId`);

  const checkedAt = nowIso(options);
  const [modelInfo, orgListing, readme] = await Promise.all([
    fetchHuggingFaceModel(model.hfId, options),
    fetchHuggingFaceOrgListing(model, options).catch((error) => {
      options.logger?.warn?.(`HF org listing failed for ${model.id}: ${error.message}`);
      return [];
    }),
    fetchHuggingFaceReadme(model.hfId, options),
  ]);

  const relatedModels = relatedHfModels(model, modelInfo, orgListing);
  const latest = relatedModels[0] || modelInfo;
  const latestVersion = displayHfModelName(latest?.id || model.hfId);
  const latestVersionVariants = unique(relatedModels.map((item) => displayHfModelName(item.id))).slice(0, 6);
  const license = extractHfLicense(latest || modelInfo) || "unknown";
  const hasEvalData = hasHfEvalData(latest || modelInfo) || Boolean(model.evalSources?.length);
  const evalSources = unique([
    ...(model.evalSources || []),
    ...(hasEvalData ? ["HuggingFace model card"] : []),
  ]);
  const latestReleasedAt = dateOnly(latest?.lastModified || modelInfo?.lastModified || "");
  const changelogUrl = `${HF_WEB_BASE}/${model.hfId}`;

  return {
    model,
    status: compactObject({
      latestVersion,
      latestVersionVariants: latestVersionVariants.length > 1 ? latestVersionVariants : undefined,
      latestReleasedAt,
      latestReleasedAtPrecision: latestReleasedAt ? "approx (HuggingFace lastModified, not guaranteed release date)" : "not_found",
      isOpen: true,
      license,
      hasEvalData,
      evalSources,
      evalThirdPartyPending: model.evalThirdPartyPending || ["LMArena", "OpenLLM Leaderboard"],
      hasChangelog: true,
      changelogUrl,
      lastCheckedAt: checkedAt,
    }),
    sources: [
      { name: `HuggingFace · ${model.hfId}`, url: changelogUrl },
    ],
    modelCardText: buildModelCardText(modelInfo, readme).slice(0, SOURCE_TEXT_LIMIT),
    metadata: {
      downloads: Number(modelInfo?.downloads) || 0,
      likes: Number(modelInfo?.likes) || 0,
      hfId: model.hfId,
      base_model: extractHfBaseModel(latest || modelInfo),
      hfLastModified: modelInfo?.lastModified || null,
      relatedHfModels: latestVersionVariants,
    },
  };
}

export async function fetchClosedModelStatus(model, options = {}) {
  const checkedAt = nowIso(options);
  if (!model.changelogUrl) {
    return {
      model,
      status: {
        latestVersion: model.name,
        latestReleasedAt: "",
        latestReleasedAtPrecision: "not_found (registry changelogUrl TODO)",
        isOpen: false,
        license: "closed",
        hasEvalData: false,
        evalSources: [],
        hasChangelog: false,
        changelogUrl: "",
        lastCheckedAt: checkedAt,
      },
      sources: [],
      changelogText: "",
      metadata: { changelogTodo: model.changelogTodo || "TODO(PM): fill official changelogUrl" },
    };
  }

  // Multi-source union (2026-06-09): flagship releases can land on a vendor news page a day before
  // the docs changelog (Fable 5 did). Fetch every registry releaseUrl, concat, pick highest version.
  const releaseUrls = Array.isArray(model.releaseUrls) && model.releaseUrls.length
    ? model.releaseUrls
    : [model.changelogUrl];
  const texts = [];
  for (const url of releaseUrls) {
    try {
      const html = await fetchText(url, { ...options, accept: "text/html, text/plain" });
      texts.push(htmlToText(html).slice(0, SOURCE_TEXT_LIMIT));
    } catch (error) {
      texts.push("");
    }
  }
  const changelogText = texts.join("\n\n").slice(0, SOURCE_TEXT_LIMIT * releaseUrls.length);
  const detected = detectLatestClosedRelease(changelogText, model);

  // NO-SIGNAL GUARD (2026-06-10): when every source fetch failed or no version pattern matched,
  // `detected` falls back to the bare model name. Returning that as latestVersion made daily.mjs
  // treat "fetch failed" as "new version" and OVERWRITE a good card with an empty-changelog one
  // (GPT-5.5 -> "OpenAI GPT"). Empty latestVersion = no signal today: daily.mjs counts it as
  // unchanged and its status patch keeps the existing (last good) version on the card.
  const hasSignal = detected.source !== "official-changelog-fallback" && Boolean(detected.name);

  return {
    model,
    status: compactObject({
      latestVersion: hasSignal ? detected.name : "",
      latestReleasedAt: detected.date || "",
      latestReleasedAtPrecision: detected.date ? detected.datePrecision : "not_found",
      isOpen: false,
      license: "closed",
      hasEvalData: false,
      evalSources: [],
      hasChangelog: true,
      changelogUrl: model.changelogUrl,
      lastCheckedAt: checkedAt,
    }),
    sources: [
      { name: `${model.vendor} official changelog`, url: model.changelogUrl },
    ],
    changelogText,
    metadata: {
      detectedRelease: detected,
      officialChangelogOnly: true,
      changelogTodo: model.changelogTodo || null,
    },
  };
}

export function buildOfflineModelStatus(model, options = {}) {
  const checkedAt = options.checkedAt || options.generatedAt || OFFLINE_TIMESTAMP;
  const isOpen = model.kind === "open";
  const sourceUrl = isOpen && model.hfId
    ? `${HF_WEB_BASE}/${model.hfId}`
    : model.changelogUrl || "";
  return {
    model,
    status: compactObject({
      latestVersion: model.latestVersionHint || displayHfModelName(model.hfId) || model.name,
      latestVersionVariants: model.latestVersionVariants,
      latestReleasedAt: options.latestReleasedAt || "",
      latestReleasedAtPrecision: "offline stub; no network fetch",
      isOpen,
      license: isOpen ? "unknown (offline stub)" : "closed",
      hasEvalData: false,
      evalSources: [],
      evalThirdPartyPending: isOpen ? (model.evalThirdPartyPending || ["LMArena", "OpenLLM Leaderboard"]) : undefined,
      hasChangelog: Boolean(sourceUrl),
      changelogUrl: sourceUrl,
      lastCheckedAt: checkedAt,
    }),
    sources: sourceUrl ? [{ name: isOpen ? `HuggingFace · ${model.hfId}` : `${model.vendor} official changelog`, url: sourceUrl }] : [],
    modelCardText: isOpen ? "[offline stub] HuggingFace model card not fetched." : "",
    changelogText: !isOpen ? "[offline stub] official changelog not fetched." : "",
    metadata: {
      offline: true,
      downloads: null,
      note: "No network fetch; suitable only for shape/dry-run verification.",
    },
  };
}

async function fetchHuggingFaceModel(hfId, options = {}) {
  return fetchJson(`${HF_API_BASE}/models/${encodeHfRepoId(hfId)}`, options);
}

async function fetchHuggingFaceReadme(hfId, options = {}) {
  for (const branch of ["main", "master"]) {
    const url = `${HF_WEB_BASE}/${encodeHfRepoId(hfId)}/raw/${branch}/README.md`;
    try {
      const text = await fetchText(url, { ...options, accept: "text/plain, text/markdown, */*" });
      if (text && text.trim()) return stripFrontMatter(text);
    } catch (error) {
      options.logger?.warn?.(`HF README fetch failed for ${hfId}@${branch}: ${error.message}`);
    }
  }
  return "";
}

function stripFrontMatter(text) {
  // HF README starts with a YAML front-matter block (---\n...\n---); the prose body is what we want.
  const match = String(text || "").match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return (match ? match[1] : String(text || "")).trim();
}

function buildModelCardText(modelInfo, readme = "") {
  const meta = extractModelCardText(modelInfo);
  const body = String(readme || "").trim();
  if (!body) return meta;
  return `${meta}\n\n=== MODEL CARD README ===\n${body}`;
}

async function fetchHuggingFaceOrgListing(model, options = {}) {
  const org = String(model.hfId || "").split("/")[0];
  if (!org) return [];
  const url = new URL(`${HF_API_BASE}/models`);
  url.searchParams.set("author", org);
  url.searchParams.set("sort", "lastModified");
  url.searchParams.set("direction", "-1");
  url.searchParams.set("limit", String(options.hfOrgLimit || 20));
  if (model.familySearch) url.searchParams.set("search", model.familySearch);
  return fetchJson(url, options);
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithRetry(url, { headers: requestHeaders(options, "application/json", { includeHfToken: true }) }, {
    retries: 0,
    timeoutMs: null,
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetchWithRetry(url, { headers: requestHeaders(options, options.accept || "text/html") }, {
    retries: 0,
    timeoutMs: null,
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.text();
}

function requestHeaders(options = {}, accept = "application/json", { includeHfToken = false } = {}) {
  const headers = {
    accept,
    "user-agent": options.userAgent || DEFAULT_USER_AGENT,
  };
  const token = options.hfToken || process.env.HF_TOKEN;
  if (includeHfToken && token) headers.authorization = `Bearer ${token}`;
  return headers;
}

function encodeHfRepoId(hfId) {
  return String(hfId || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function relatedHfModels(model, modelInfo, listing) {
  const rows = Array.isArray(listing) ? listing : [];
  const family = normalizeFamily(model.familySearch || model.name || model.hfId);
  const filtered = rows.filter((item) => {
    const id = String(item?.id || "");
    if (!id) return false;
    if (model.hfId && id.toLowerCase() === model.hfId.toLowerCase()) return true;
    return normalizeFamily(id).includes(family);
  });
  const merged = [modelInfo, ...filtered].filter(Boolean);
  return uniqueBy(merged, (item) => String(item.id || "").toLowerCase())
    .sort((left, right) => Date.parse(right?.lastModified || "") - Date.parse(left?.lastModified || ""));
}

function normalizeFamily(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[^/]+\//, "")
    .replace(/[^a-z0-9]+/g, "");
}

function displayHfModelName(id) {
  const raw = String(id || "").trim();
  if (!raw) return "";
  return raw.split("/").pop().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function extractHfLicense(modelInfo = {}) {
  const cardData = modelInfo.cardData || {};
  const cardLicense = Array.isArray(cardData.license) ? cardData.license[0] : cardData.license;
  if (cardLicense) return String(cardLicense);
  const tag = (modelInfo.tags || []).find((item) => /^license:/i.test(String(item)));
  return tag ? String(tag).replace(/^license:/i, "") : "";
}

function extractHfBaseModel(modelInfo = {}) {
  const cardData = modelInfo.cardData || {};
  const baseModel = cardData.base_model || cardData.baseModel;
  if (Array.isArray(baseModel)) return baseModel.filter(Boolean).map(String);
  return baseModel ? String(baseModel) : "";
}

function hasHfEvalData(modelInfo = {}) {
  const cardData = modelInfo.cardData || {};
  return Boolean(
    cardData["model-index"] ||
    cardData.model_index ||
    cardData.eval_results ||
    cardData.results ||
    (Array.isArray(modelInfo.tags) && modelInfo.tags.some((tag) => /leaderboard|benchmark|eval/i.test(String(tag)))),
  );
}

function extractModelCardText(modelInfo = {}) {
  const card = modelInfo.cardData || {};
  const parts = [
    modelInfo.id ? `id: ${modelInfo.id}` : "",
    modelInfo.lastModified ? `lastModified: ${modelInfo.lastModified}` : "",
    modelInfo.tags?.length ? `tags: ${modelInfo.tags.join(", ")}` : "",
    card.license ? `license: ${Array.isArray(card.license) ? card.license.join(", ") : card.license}` : "",
    card.base_model ? `base_model: ${Array.isArray(card.base_model) ? card.base_model.join(", ") : card.base_model}` : "",
    card.model_index || card["model-index"] ? `model-index: ${JSON.stringify(card.model_index || card["model-index"]).slice(0, 8000)}` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

export function detectLatestClosedRelease(text, model = {}) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    model.releaseNamePattern,
    // Built-in fallbacks mirror registry.mjs (2026-06-10): versions are single-digit major + optional
    // .minor — "[0-9][0-9.]*" let date fragments ("Gemini 29 May") win the numeric sort over 3.5.
    "\\bClaude\\s+(?:[A-Za-z]+\\s+)?[0-9](?:\\.[0-9]+)?(?![0-9])",
    "\\bGemini[\\s-]*[0-9](?:\\.[0-9]+)?(?:[\\s-]*(?:Pro|Flash-Lite|Flash|Ultra|Nano))?(?![0-9])",
    // o-series arm anchored (see registry.mjs): no trailing letter/digit so minified JS filenames
    // (e.g. "o9z4drghg2r.css") can't masquerade as a model version.
    "\\bGPT[-\\s]?[0-9](?:\\.[0-9]+)?[a-z]?(?![A-Za-z0-9])|\\bo[0-9]{1,2}(?:[-\\s](?:mini|pro|preview))?(?:\\.[0-9]+)?\\b(?![A-Za-z0-9])",
  ].filter(Boolean);

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "gi"); // global: collect ALL matches, not just the first
    const matches = [...cleaned.matchAll(regex)];
    if (!matches.length) continue;
    // Pick the HIGHEST version (the actual "latest"), NOT the first textual match — release-notes
    // pages routinely mention an older version (nav link, "since X.Y") before the newest one, so
    // regex.exec()'s first hit was selecting e.g. "Claude Opus 4.1" over "Claude Opus 4.8".
    // Ties keep the earliest occurrence (usually the most prominent heading).
    let best = matches[0];
    let bestKey = releaseVersionKey(best[0]);
    for (const m of matches) {
      const key = releaseVersionKey(m[0]);
      if (key > bestKey) { best = m; bestKey = key; }
    }
    const around = cleaned.slice(Math.max(0, best.index - 240), Math.min(cleaned.length, best.index + 240));
    const date = detectDate(around);
    return {
      name: cleanReleaseName(best[0]),
      date: date.value,
      datePrecision: date.precision,
      source: "official-changelog-best-effort",
    };
  }

  const date = detectDate(cleaned.slice(0, 800));
  return {
    name: model.name || "",
    date: date.value,
    datePrecision: date.precision,
    source: "official-changelog-fallback",
  };
}

/** Numeric sort key from a release name's version so 4.8 > 4.1 > 4, and 4.10 > 4.9.
 *  e.g. "Claude Opus 4.8" -> 4008000, "Gemini 2.0" -> 2000000. No version -> -1.
 *  Tie-break (2026-06-09): at the SAME numeric version a flagship tier (Pro/Opus) should beat a
 *  small tier (Nano/Flash-Lite) so e.g. "Gemini 3.5 Nano" doesn't outrank "Gemini 3.5 Pro" just by
 *  appearing first in the DOM. Tier adds a small sub-version bonus (< one patch step). */
export function releaseVersionKey(name) {
  const m = /([0-9]+(?:\.[0-9]+)*)/.exec(String(name || ""));
  if (!m) return -1;
  const [major = 0, minor = 0, patch = 0] = m[1].split(".").map((n) => Number(n) || 0);
  return major * 1_000_000 + minor * 1_000 + patch + tierBonus(name);
}

/** Small flagship-tier bonus in [0,1) so it only breaks ties between equal numeric versions. */
function tierBonus(name) {
  const text = String(name || "").toLowerCase();
  if (/\bopus\b|\bultra\b|\bpro\b/.test(text)) return 0.5;     // flagship tiers
  if (/\bsonnet\b/.test(text)) return 0.3;
  if (/\bflash-lite\b/.test(text)) return 0.05;
  if (/\bflash\b|\bhaiku\b/.test(text)) return 0.1;
  if (/\bnano\b/.test(text)) return 0.02;                       // smallest tier
  return 0.2;                                                   // bare family name (no tier word)
}

function cleanReleaseName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function detectDate(text) {
  const iso = String(text || "").match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) return { value: `${iso[1]}-${pad2(iso[2])}-${pad2(iso[3])}`, precision: "day" };

  const month = String(text || "").match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i);
  if (month) {
    const parsed = Date.parse(`${month[1]} ${month[2]}, ${month[3]} UTC`);
    if (!Number.isNaN(parsed)) return { value: new Date(parsed).toISOString().slice(0, 10), precision: "day" };
  }

  return { value: "", precision: "not_found" };
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function dateOnly(value) {
  const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseArgs(argv = []) {
  const options = {};
  const ids = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--kind") options.kind = argv[++index];
    else if (arg === "--offline" || arg === "--dry-run") options.offline = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else ids.push(arg);
  }
  return { ids, options };
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/models/sources.mjs [model-id ...] [--kind open|closed] [--offline]

Stage-1 only: fetches cheap status-card fields. It does not call an LLM.`);
}

async function cli(argv) {
  const { ids, options } = parseArgs(argv);
  if (options.help) {
    printUsage();
    return;
  }
  const models = ids.length
    ? ids.map((id) => getModelConfig(id)).filter(Boolean)
    : listModelConfigs({ kind: options.kind });
  if (!models.length) throw new Error("No models matched");
  const statuses = await checkAllModelStatuses(models, { ...options, logger: console });
  console.log(JSON.stringify({
    generatedAt: nowIso(options),
    models: statuses.map((item) => ({
      id: item.model.id,
      name: item.model.name,
      vendor: item.model.vendor,
      country: item.model.country,
      kind: item.model.kind,
      ...item.status,
      metadata: item.metadata,
    })),
  }, null, 2));
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  cli(process.argv.slice(2)).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
