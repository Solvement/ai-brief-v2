#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateModelEntry } from "./generate.mjs";
import { MODEL_REGISTRY } from "./registry.mjs";
import { fetchModelStatus } from "./sources.mjs";
import { buildCanonicalParadigm, classifyModelParadigm } from "./paradigm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MODELS_FILE = path.join(ROOT, "public", "data", "models.json");

const STATUS_FIELDS = [
  "latestVersion",
  "latestVersionVariants",
  "latestReleasedAt",
  "latestReleasedAtPrecision",
  "isOpen",
  "license",
  "hasEvalData",
  "evalSources",
  "evalThirdPartyPending",
  "hasChangelog",
  "changelogUrl",
  "lastCheckedAt",
];

export async function main(argv = process.argv.slice(2)) {
  await loadEnv();
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return null;
  }

  const startedAt = new Date().toISOString();
  const models = selectModels(options);
  if (!models.length) throw new Error("No models matched");

  const current = await readModelsFile();
  const existingModels = Array.isArray(current.models) ? current.models : [];
  const existingById = new Map(existingModels.map((entry) => [entry.id, entry]));
  const updatesById = new Map();
  const failures = [];

  let checked = 0;
  let newVersions = 0;
  let regenerated = 0;
  let statusRefreshed = 0;

  for (const model of models) {
    const existing = existingById.get(model.id) || null;
    try {
      const fetched = await fetchModelStatus(model, {
        ...options,
        dryRun: false,
        logger: console,
      });
      checked += 1;

      const paradigmClass = classifyModelParadigm({
        model,
        fetched,
        existing,
        libraryRecords: [...MODEL_REGISTRY, ...existingModels],
      });
      if (paradigmClass.branch === "variant_merged") {
        const merged = mergeVariantIntoCanonical(existingModels, updatesById, paradigmClass, fetched);
        console.log(`[models] ${model.id}: ${paradigmClass.tag}; merged variant into ${merged || paradigmClass.variant.canonicalHfId}`);
        continue;
      }

      const changed = isNewOrChangedVersion(existing, fetched, options);
      if (changed) newVersions += 1;

      const shouldRegenerate = changed || options.force;

      if (shouldRegenerate && !options.dryRun) {
        const reason = options.force && !changed ? "forced regenerate" : (existing ? "new version" : "new model");
        console.log(`[models] ${model.id}: ${reason}; regenerating analysis`);
        const generatedEntry = await generateModelEntry({
          model,
          fetched,
          options: {
            ...options,
            generatedAt: startedAt,
            existingEntry: existing,
            libraryRecords: [...MODEL_REGISTRY, ...existingModels],
          },
          logger: console,
        });
        updatesById.set(model.id, generatedEntry);
        regenerated += 1;
      } else if (shouldRegenerate) {
        const reason = options.force && !changed
          ? "forced regenerate"
          : `regenerate analysis (${versionLabel(existing)} -> ${versionLabel(fetched)})`;
        console.log(`[models] ${model.id}: would ${reason}`);
        updatesById.set(model.id, mergeStatusFields(existing, model, fetched, options));
      } else {
        console.log(`[models] ${model.id}: unchanged; refreshing status card`);
        updatesById.set(model.id, mergeStatusFields(existing, model, fetched, options));
        statusRefreshed += 1;
      }
    } catch (error) {
      failures.push({ id: model.id, error });
      console.warn(`[models] ${model.id}: failed (${error.message || String(error)})`);
      if (existing) updatesById.set(model.id, existing);
    }
  }

  const nextModels = mergeModelOrder(existingModels, updatesById, models);
  const nextDoc = {
    ...current,
    generatedAt: startedAt,
    models: nextModels,
  };

  if (options.dryRun) {
    console.log(`[models] dry-run: would write ${MODELS_FILE}`);
  } else if (checked > 0 || regenerated > 0) {
    await writeJson(MODELS_FILE, nextDoc);
    console.log(`[models] wrote ${MODELS_FILE}`);
  }

  const summary = {
    checked,
    newVersions,
    regenerated,
    statusRefreshed,
    failed: failures.length,
    dryRun: Boolean(options.dryRun),
  };

  console.log(
    `models: ${summary.checked} checked, ${summary.newVersions} new versions, ${summary.regenerated} regenerated`
      + (summary.failed ? `, ${summary.failed} failed` : ""),
  );

  if (options.dryRun && summary.newVersions > summary.regenerated) {
    console.log(`[models] dry-run: ${summary.newVersions} entries would regenerate; wrote nothing`);
  }

  return summary;
}

export function parseArgs(argv = []) {
  const options = {
    only: [],
    offline: false,
    dryRun: false,
    force: false,
    cap: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[++index];
    };

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--offline" || arg === "--no-llm") {
      options.offline = true;
      options.noLlm = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force" || arg === "--regenerate") {
      options.force = true;
    } else if (arg === "--only") {
      options.only.push(...splitIds(nextValue()));
    } else if (arg.startsWith("--only=")) {
      options.only.push(...splitIds(valueAfterEquals(arg)));
    } else if (arg === "--cap") {
      options.cap = numberOption(nextValue(), options.cap);
    } else if (arg.startsWith("--cap=")) {
      options.cap = numberOption(valueAfterEquals(arg), options.cap);
    } else if (arg === "--api-timeout-ms") {
      options.apiTimeoutMs = numberOption(nextValue(), options.apiTimeoutMs);
    } else if (arg.startsWith("--api-timeout-ms=")) {
      options.apiTimeoutMs = numberOption(valueAfterEquals(arg), options.apiTimeoutMs);
    } else if (arg === "--max-tokens") {
      options.maxTokens = numberOption(nextValue(), options.maxTokens);
    } else if (arg.startsWith("--max-tokens=")) {
      options.maxTokens = numberOption(valueAfterEquals(arg), options.maxTokens);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (process.env.NO_LLM === "1" || process.env.AI_BRIEF_OFFLINE === "1") {
    options.offline = true;
    options.noLlm = true;
  }

  options.only = [...new Set(options.only)];
  return options;
}

async function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const raw = await readFile(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]] && value) process.env[match[1]] = value;
  }
}

function selectModels(options = {}) {
  const only = new Set(options.only || []);
  const selected = only.size
    ? MODEL_REGISTRY.filter((model) => only.has(model.id))
    : [...MODEL_REGISTRY];
  const cap = Number(options.cap) || 0;
  return cap > 0 ? selected.slice(0, cap) : selected;
}

async function readModelsFile() {
  try {
    return JSON.parse(await readFile(MODELS_FILE, "utf8"));
  } catch {
    return { generatedAt: "", models: [] };
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function isNewOrChangedVersion(existing, fetched = {}, options = {}) {
  if (!existing) return true;
  if (options.offline) return false;
  const latestVersion = cleanString(fetched.status?.latestVersion || fetched.latestVersion);
  if (!latestVersion) return false;
  return !sameVersion(latestVersion, existing.latestVersion);
}

function mergeStatusFields(existing, model, fetched = {}, options = {}) {
  const base = existing || baseEntry(model);
  const statusPatch = options.offline && existing
    ? offlineStatusRefresh(existing, fetched)
    : buildStatusPatch(model, fetched, existing);
  const next = {
    ...base,
    id: model.id,
    name: model.name,
    vendor: model.vendor,
    country: model.country,
    kind: model.kind,
    ...statusPatch,
  };

  next.paradigm = buildCanonicalParadigm({
    model,
    fetched: { ...fetched, status: { ...(fetched.status || fetched || {}), ...statusPatch } },
    analysis: next.analysis,
    changelog: next.changelog,
    existing,
  });

  for (const field of STATUS_FIELDS) {
    if (!(field in statusPatch)) delete next[field];
  }

  return next;
}

function baseEntry(model) {
  return {
    id: model.id,
    name: model.name,
    vendor: model.vendor,
    country: model.country,
    kind: model.kind,
  };
}

function offlineStatusRefresh(existing, fetched = {}) {
  return {
    ...pickStatusFields(existing),
    lastCheckedAt: cleanString(fetched.status?.lastCheckedAt || fetched.lastCheckedAt || new Date().toISOString()),
  };
}

function pickStatusFields(entry = {}) {
  return Object.fromEntries(STATUS_FIELDS.filter((field) => field in entry).map((field) => [field, entry[field]]));
}

function buildStatusPatch(model, fetched = {}, existing = {}) {
  const status = fetched.status || fetched || {};
  const isOpen = model.kind === "open";
  const out = {
    latestVersion: cleanString(status.latestVersion || existing.latestVersion || model.latestVersionHint || model.name),
    latestReleasedAt: cleanString(status.latestReleasedAt || ""),
    latestReleasedAtPrecision: cleanOptionalString(status.latestReleasedAtPrecision),
    isOpen,
    license: cleanString(status.license || (isOpen ? "unknown" : "closed")),
    hasEvalData: Boolean(status.hasEvalData),
    evalSources: normalizeStringArray(status.evalSources),
    evalThirdPartyPending: isOpen ? normalizeStringArray(status.evalThirdPartyPending) : undefined,
    hasChangelog: Boolean(status.hasChangelog),
    changelogUrl: cleanString(status.changelogUrl || ""),
    lastCheckedAt: cleanString(status.lastCheckedAt || new Date().toISOString()),
  };
  if (existing.latestVersion && sameVersion(out.latestVersion, existing.latestVersion)) {
    out.latestVersion = cleanString(existing.latestVersion);
  }
  const variants = normalizeStringArray(status.latestVersionVariants);
  if (variants.length) out.latestVersionVariants = variants;
  return compactObject(out);
}

function mergeModelOrder(existingModels, updatesById, selectedModels) {
  const existingIds = new Set(existingModels.map((entry) => entry.id));
  const out = existingModels.map((entry) => updatesById.get(entry.id) || entry);
  for (const model of selectedModels) {
    if (!existingIds.has(model.id) && updatesById.has(model.id)) {
      out.push(updatesById.get(model.id));
    }
  }
  return out;
}

function mergeVariantIntoCanonical(existingModels, updatesById, classification, fetched = {}) {
  const variant = classification.variant || {};
  const variantName = cleanString(variant.variantName || fetched.status?.latestVersion);
  if (!variantName) return "";
  const canonicalKey = cleanString(variant.canonicalHfId).toLowerCase();
  const candidate = existingModels.find((entry) => {
    const sourceHit = entry.changelogUrl && canonicalKey && entry.changelogUrl.toLowerCase().includes(canonicalKey);
    const variantHit = Array.isArray(entry.latestVersionVariants)
      && entry.latestVersionVariants.some((item) => cleanString(item).toLowerCase() === variantName.toLowerCase());
    return sourceHit || variantHit;
  });
  if (!candidate) return "";
  const current = updatesById.get(candidate.id) || candidate;
  const variants = [...new Set([...(current.latestVersionVariants || []), variantName])];
  updatesById.set(candidate.id, {
    ...current,
    latestVersionVariants: variants,
    paradigm: current.paradigm?.card ? current.paradigm : buildCanonicalParadigm({
      model: { ...current, kind: current.kind },
      fetched: current,
      analysis: current.analysis,
      changelog: current.changelog,
      existing: current,
    }),
  });
  return candidate.id;
}

function versionLabel(input) {
  if (!input) return "(new)";
  return cleanString(input.status?.latestVersion || input.latestVersion || "(unknown)");
}

function sameVersion(left, right) {
  const leftText = cleanString(left);
  const rightText = cleanString(right);
  if (!leftText || !rightText) return leftText === rightText;
  return leftText === rightText || versionKey(leftText) === versionKey(rightText);
}

function versionKey(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/\b(preview|release|version|model)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function splitIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function cleanOptionalString(value) {
  const text = cleanString(value);
  return text || undefined;
}

function cleanString(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function normalizeStringArray(value) {
  return asArray(value).map((item) => cleanString(item)).filter(Boolean);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/models/daily.mjs [--only id,id] [--cap N] [--offline] [--dry-run] [--force|--regenerate]

Runs model daily refresh:
  stage-1 source check for every selected registry model
  stage-2 analysis generation only for new/changed latestVersion, unless forced
  unchanged entries keep existing analysis/changelog and refresh status-card + paradigm fields

Flags:
  --only id,id      Limit to specific model ids
  --cap N           Limit selected registry models after --only filtering
  --offline         No LLM/network; use source/generator offline stubs for new models
  --dry-run         Compute and log what would change; write nothing
  --force           Regenerate selected models even when latestVersion is unchanged
  --regenerate      Alias for --force
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
