#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDeepSeekClient } from "../../lib/llm.mjs";
import { getModelConfig } from "./registry.mjs";
import { buildOfflineModelStatus, fetchModelStatus } from "./sources.mjs";
import {
  closedModelSystemPrompt,
  closedModelUserPrompt,
  openModelSystemPrompt,
  openModelUserPrompt,
} from "./prompts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const GOLD_OPEN_FILE = path.join(ROOT, "docs", "superpowers", "specs", "2026-06-02-models-gold-deepseek-v4-pro.json");
const OFFLINE_TIMESTAMP = "2026-06-02T00:00:00.000Z";

export async function generateModelEntry({
  model,
  fetched,
  options = {},
  logger = console,
} = {}) {
  if (!model) throw new Error("generateModelEntry requires model config");
  const offline = isOffline(options);
  const fetchedPayload = fetched || (offline
    ? buildOfflineModelStatus(model, options)
    : await fetchModelStatus(model, options));
  const generatedAt = options.generatedAt || (offline ? OFFLINE_TIMESTAMP : new Date().toISOString());
  const selectedModel = modelAnalysisModel(options.env || process.env);

  let payload;
  if (offline) {
    payload = model.kind === "open"
      ? { analysis: buildOfflineOpenAnalysisStub(model, fetchedPayload) }
      : { changelog: buildOfflineClosedChangelogStub(model, fetchedPayload) };
  } else {
    const chatJson = options.chatJson || createDeepSeekClient({
      apiTimeoutMs: options.apiTimeoutMs,
      logger,
    }).chatJson;
    if (model.kind === "open") {
      const goldStandard = await loadGoldOpenExample();
      payload = await chatJson({
        system: openModelSystemPrompt(),
        user: openModelUserPrompt({ model, fetched: fetchedPayload, goldStandard }),
        model: selectedModel,
        maxTokens: options.maxTokens || Number(process.env.MODEL_ANALYSIS_MAX_TOKENS) || 12000,
      });
    } else {
      payload = await chatJson({
        system: closedModelSystemPrompt(),
        user: closedModelUserPrompt({ model, fetched: fetchedPayload }),
        model: selectedModel,
        maxTokens: options.maxTokens || Number(process.env.MODEL_CHANGELOG_MAX_TOKENS) || 9000,
      });
    }
  }

  return buildEntry({
    model,
    fetched: fetchedPayload,
    payload,
    generatedAt,
    analysisAuthor: offline ? "offline-model-generator-stub" : `DeepSeek:${selectedModel}`,
  });
}

export function modelAnalysisModel(env = process.env) {
  return env.MODEL_ANALYSIS_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-pro";
}

async function loadGoldOpenExample() {
  const gold = JSON.parse(await readFile(GOLD_OPEN_FILE, "utf8"));
  delete gold._note;
  return gold;
}

function buildEntry({ model, fetched, payload, generatedAt, analysisAuthor }) {
  const status = statusFields(model, fetched);
  const base = {
    id: model.id,
    name: model.name,
    vendor: model.vendor,
    country: model.country,
    kind: model.kind,
    ...status,
    analysisGeneratedAt: generatedAt,
    analysisAuthor,
  };

  if (model.kind === "open") {
    const analysis = payload?.analysis || payload;
    if (!analysis || typeof analysis !== "object") throw new Error(`open model ${model.id} generation missing analysis object`);
    return {
      ...base,
      isOpen: true,
      analysis: normalizeOpenAnalysis(analysis),
    };
  }

  const changelog = payload?.changelog || payload;
  if (!changelog || typeof changelog !== "object") throw new Error(`closed model ${model.id} generation missing changelog object`);
  return {
    ...base,
    isOpen: false,
    changelog: normalizeClosedChangelog(changelog),
  };
}

function statusFields(model, fetched = {}) {
  const status = fetched.status || fetched || {};
  const isOpen = model.kind === "open";
  const out = {
    latestVersion: cleanString(status.latestVersion || model.latestVersionHint || model.name),
    latestReleasedAt: cleanString(status.latestReleasedAt || ""),
    latestReleasedAtPrecision: cleanOptionalString(status.latestReleasedAtPrecision),
    isOpen,
    license: cleanString(status.license || (isOpen ? "unknown" : "closed")),
    hasEvalData: Boolean(status.hasEvalData),
    evalSources: normalizeStringArray(status.evalSources),
    evalThirdPartyPending: isOpen ? normalizeStringArray(status.evalThirdPartyPending) : undefined,
    hasChangelog: Boolean(status.hasChangelog),
    changelogUrl: cleanString(status.changelogUrl || ""),
    lastCheckedAt: cleanString(status.lastCheckedAt || OFFLINE_TIMESTAMP),
  };
  const variants = normalizeStringArray(status.latestVersionVariants);
  if (variants.length) out.latestVersionVariants = variants;
  return compactObject(out);
}

function normalizeOpenAnalysis(input = {}) {
  return {
    oneLineTakeaway: cleanString(input.oneLineTakeaway),
    whatItUnlocks: asArray(input.whatItUnlocks).map((item) => ({
      point: cleanString(item?.point),
      forYou: cleanString(item?.forYou),
      evidence: cleanString(item?.evidence),
      confidence: cleanString(item?.confidence),
    })).filter((item) => item.point || item.forYou || item.evidence),
    benchmark: normalizeBenchmark(input.benchmark),
    openSourceMeaning: cleanString(input.openSourceMeaning),
    whenToUse: cleanString(input.whenToUse),
    cost_caveats: cleanString(input.cost_caveats),
    sources: normalizeSources(input.sources),
  };
}

function normalizeClosedChangelog(input = {}) {
  return {
    oneLineTakeaway: cleanString(input.oneLineTakeaway),
    newFeatures: asArray(input.newFeatures).map((item) => ({
      feature: cleanString(item?.feature),
      whatItIs: cleanString(item?.whatItIs),
      forYou: cleanString(item?.forYou),
      howToUse: cleanString(item?.howToUse),
      whenToUse: cleanString(item?.whenToUse),
    })).filter((item) => item.feature || item.whatItIs),
    limitations: cleanString(input.limitations || "官方 changelog 未说明。"),
    sources: normalizeSources(input.sources),
  };
}

function normalizeBenchmark(input = {}) {
  return {
    headline: cleanString(input.headline),
    professorNote: cleanString(input.professorNote),
    charts: asArray(input.charts).map(normalizeBenchmarkChart).filter((chart) => chart.title),
    items: asArray(input.items).map((item) => ({
      label: cleanString(item?.label),
      score: cleanString(item?.score),
      comparator: cleanString(item?.comparator),
      interpretation: cleanString(item?.interpretation),
      sourceType: normalizeSourceType(item?.sourceType),
    })).filter((item) => item.label),
    caveats: normalizeStringArray(input.caveats),
  };
}

function normalizeBenchmarkChart(chart = {}) {
  return {
    title: cleanString(chart.title),
    metric: cleanString(chart.metric),
    unit: cleanString(chart.unit),
    higherIsBetter: Boolean(chart.higherIsBetter),
    sourceType: normalizeSourceType(chart.sourceType),
    ...(Number.isFinite(Number(chart.maxValue)) ? { maxValue: Number(chart.maxValue) } : {}),
    bars: asArray(chart.bars).map((bar) => ({
      label: cleanString(bar?.label),
      display: cleanString(bar?.display),
      value: Number.isFinite(Number(bar?.value)) ? Number(bar.value) : 0,
      ...(typeof bar?.highlight === "boolean" ? { highlight: bar.highlight } : {}),
    })).filter((bar) => bar.label),
  };
}

function buildOfflineOpenAnalysisStub(model, fetched = {}) {
  const source = firstSource(model, fetched);
  return {
    oneLineTakeaway: `[离线 stub] ${model.name} 的分析形状已生成,但没有联网抓 model card、没有调用 LLM,不能当正式结论发布。`,
    whatItUnlocks: [
      {
        point: "离线占位:验证 open analysis JSON shape",
        forYou: "这条只用于 PM dry-run:确认开源模型会产出应用视角的 whatItUnlocks / benchmark / openSourceMeaning / whenToUse / cost_caveats。",
        evidence: "offline stub; no model card or technical report fetched",
        confidence: "low(离线占位,非事实分析)",
      },
    ],
    benchmark: {
      headline: "离线 stub:未核验 benchmark,不输出任何真实分数。",
      professorNote: "正式生成时,只有官方 model card、技术报告或第三方榜单里的数字才能进入 charts/items。",
      charts: [],
      items: [],
      caveats: [
        "离线 stub 没有 benchmark 事实;不要把它发布给读者。",
        "真实输出必须逐项标 sourceType,厂商自评要标 low 并等待第三方榜单。",
      ],
    },
    openSourceMeaning: "离线 stub:正式分析应说明可自部署、可微调、控成本/数据、不锁定,以及部署/运维/硬件代价。",
    whenToUse: "离线 stub:正式分析应给出先 API 试用还是自部署的应用场景建议。",
    cost_caveats: "离线 stub:未核验硬件、价格或吞吐,不写真实成本结论。",
    sources: [source],
  };
}

function buildOfflineClosedChangelogStub(model, fetched = {}) {
  const source = firstSource(model, fetched);
  return {
    oneLineTakeaway: `[离线 stub] ${model.name} 的 changelog 形状已生成,但未抓官方 release notes,不能当正式结论发布。`,
    newFeatures: [
      {
        feature: "离线占位:官方 changelog 未抓取",
        whatItIs: "只用于验证 closed changelog JSON shape。",
        forYou: "正式生成时,这里必须改成官方 release notes 中真实出现的新功能。",
        howToUse: "离线模式不提供使用建议;在线生成要基于官方条目写。",
        whenToUse: "离线模式不判断场景;在线生成要基于官方条目写。",
      },
    ],
    limitations: "离线 stub:官方 changelog 未抓取,限制/价格/配额均不能推断。",
    sources: [source],
  };
}

function firstSource(model, fetched = {}) {
  const source = asArray(fetched.sources)[0];
  if (source?.url) return { name: cleanString(source.name || "source"), url: cleanString(source.url) };
  const fallbackUrl = model.kind === "open" && model.hfId
    ? `https://huggingface.co/${model.hfId}`
    : model.changelogUrl || "https://example.invalid/todo-official-changelog";
  return {
    name: model.kind === "open" ? `HuggingFace · ${model.hfId || model.name}` : "TODO: official vendor changelog",
    url: fallbackUrl,
  };
}

function normalizeSources(value) {
  return asArray(value).map((source) => ({
    name: cleanString(source?.name),
    url: cleanString(source?.url),
  })).filter((source) => source.name || source.url);
}

function normalizeSourceType(value) {
  const raw = cleanString(value);
  return ["official", "third-party", "derived"].includes(raw) ? raw : "official";
}

function isOffline(options = {}, env = process.env) {
  return Boolean(options.offline || options.noLlm || options.dryRun || env.NO_LLM === "1" || env.AI_BRIEF_OFFLINE === "1");
}

function parseArgs(argv = []) {
  const options = {};
  let modelId = "";
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--offline" || arg === "--no-llm" || arg === "--dry-run") {
      options.offline = true;
      options.noLlm = true;
    } else if (arg === "--kind") {
      options.kind = argv[++index];
    } else if (arg === "--api-timeout-ms") {
      options.apiTimeoutMs = Number(argv[++index]);
    } else if (arg === "--max-tokens") {
      options.maxTokens = Number(argv[++index]);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (!modelId) {
      modelId = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return { modelId, options };
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/models/generate.mjs <model-id> [--offline] [--kind open|closed]

Stage-2 generator. Online mode calls DeepSeek chatJson. Offline mode emits a deterministic stub.`);
}

async function cli(argv) {
  const { modelId, options } = parseArgs(argv);
  if (options.help || !modelId) {
    printUsage();
    return;
  }
  const model = getModelConfig(modelId) || {
    id: modelId,
    name: modelId,
    vendor: "unknown",
    country: "unknown",
    kind: options.kind || "open",
  };
  if (options.kind) model.kind = options.kind;
  const entry = await generateModelEntry({ model, options, logger: console });
  console.log(JSON.stringify(entry, null, 2));
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

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  cli(process.argv.slice(2)).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
