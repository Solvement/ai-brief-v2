#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
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
  const [modelInfo, orgListing] = await Promise.all([
    fetchHuggingFaceModel(model.hfId, options),
    fetchHuggingFaceOrgListing(model, options).catch((error) => {
      options.logger?.warn?.(`HF org listing failed for ${model.id}: ${error.message}`);
      return [];
    }),
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
    modelCardText: extractModelCardText(modelInfo).slice(0, SOURCE_TEXT_LIMIT),
    metadata: {
      downloads: Number(modelInfo?.downloads) || 0,
      likes: Number(modelInfo?.likes) || 0,
      hfId: model.hfId,
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

  const html = await fetchText(model.changelogUrl, {
    ...options,
    accept: "text/html, text/plain",
  });
  const changelogText = htmlToText(html).slice(0, SOURCE_TEXT_LIMIT);
  const detected = detectLatestClosedRelease(changelogText, model);

  return {
    model,
    status: compactObject({
      latestVersion: detected.name || model.name,
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
  const response = await fetch(url, { headers: requestHeaders(options, "application/json", { includeHfToken: true }) });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, { headers: requestHeaders(options, options.accept || "text/html") });
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
    "\\bClaude\\s+(?:Opus|Sonnet|Haiku)?\\s*[0-9.]+\\b",
    "\\bGemini\\s*[0-9.]+(?:\\s*(?:Pro|Flash|Flash-Lite))?\\b",
    "\\b(?:GPT[-\\s]?[0-9A-Za-z.]+|o[0-9][A-Za-z0-9.-]*)\\b",
  ].filter(Boolean);

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const match = regex.exec(cleaned);
    if (!match) continue;
    const around = cleaned.slice(Math.max(0, match.index - 240), Math.min(cleaned.length, match.index + 240));
    const date = detectDate(around);
    return {
      name: cleanReleaseName(match[0]),
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
