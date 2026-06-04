const UNKNOWN_OFFICIAL = "官方未披露";

const VARIANT_NAME_RE = /(?:^|[-_\s.])(?:GGUF|AWQ|GPTQ|4bit|8bit|merge|merged|quant|quantized|bnb|exl2|fp8|nf4)(?:$|[-_\s.])/i;
const FINETUNE_NAME_RE = /(?:^|[-_\s.])(?:lora|adapter|sft|dpo|rlhf|instruct-finetune|chat-finetune)(?:$|[-_\s.])/i;

const COMMERCIAL_LICENSES = new Set([
  "apache-2.0",
  "mit",
  "bsd-2-clause",
  "bsd-3-clause",
  "isc",
  "cc-by-4.0",
]);

const CONDITIONAL_COMMERCIAL_RE = /\b(llama|gemma|qwen|deepseek|mistral|community|openrail|rail|other)\b/i;
const RESEARCH_ONLY_RE = /\b(non[-_\s]?commercial|research|cc-by-nc|nc|academic)\b/i;

export function classifyModelParadigm({ model, fetched = {}, existing = null, libraryRecords = [] } = {}) {
  if (!model) throw new Error("classifyModelParadigm requires model");
  const access = model.kind === "closed" ? "closed" : "open";
  const variant = detectOpenVariant(model, fetched, libraryRecords);
  if (variant.isVariant) {
    return {
      branch: "variant_merged",
      access,
      tag: "[变体·已归并]",
      variant,
    };
  }

  const sameFamily = findSameFamilyRecord(model, libraryRecords);
  const isUpdate = Boolean(existing || sameFamily);
  if (isUpdate) {
    return {
      branch: "update",
      access,
      tag: `[更新｜${access}]`,
      updateSize: estimateUpdateSize(model, fetched, existing),
      previousVersion: existing?.latestVersion || sameFamily?.latestVersion || UNKNOWN_OFFICIAL,
      nextVersion: fetched.status?.latestVersion || fetched.latestVersion || model.latestVersionHint || model.name,
    };
  }

  const tier = scoreNewModelTier(model, fetched);
  return {
    branch: "new_model",
    access,
    tag: `[新模型 Tier${tier}｜${access}]${tier === 3 ? " [需人工确认]" : ""}`,
    tier,
    requiresHumanConfirmation: tier === 3,
  };
}

export function detectOpenVariant(model = {}, fetched = {}, libraryRecords = []) {
  if (model.kind !== "open") return { isVariant: false };
  const status = fetched.status || fetched || {};
  const metadata = fetched.metadata || {};
  const hfId = cleanString(metadata.hfId || model.hfId || "");
  const repoName = cleanString(status.latestVersion || model.name || hfId.split("/").pop());
  const owner = hfId.includes("/") ? hfId.split("/")[0] : "";
  const baseModel = firstString(metadata.base_model || metadata.baseModel || status.base_model || model.base_model);
  const canonicalFromBase = canonicalHfId(baseModel);
  const basePointsElsewhere = Boolean(canonicalFromBase && canonicalFromBase.toLowerCase() !== hfId.toLowerCase());
  const nameLooksVariant = VARIANT_NAME_RE.test(repoName) || VARIANT_NAME_RE.test(hfId);
  const nameLooksFinetune = FINETUNE_NAME_RE.test(repoName) || FINETUNE_NAME_RE.test(hfId);
  const registryOwner = findRegistryOwnerForFamily(model, libraryRecords);
  const thirdPartyOwner = Boolean(owner && registryOwner && owner.toLowerCase() !== registryOwner.toLowerCase());

  if (!basePointsElsewhere && !nameLooksVariant && !(thirdPartyOwner && (nameLooksVariant || nameLooksFinetune))) {
    return { isVariant: false };
  }

  return {
    isVariant: true,
    canonicalHfId: canonicalFromBase || findCanonicalHfIdForFamily(model, libraryRecords) || UNKNOWN_OFFICIAL,
    variantName: repoName || hfId || model.name,
    sourceRepo: hfId || UNKNOWN_OFFICIAL,
    base_model: baseModel || UNKNOWN_OFFICIAL,
    reason: [
      basePointsElsewhere ? "base_model points to another repository" : "",
      nameLooksVariant ? "name contains quant/merge suffix" : "",
      thirdPartyOwner && (nameLooksVariant || nameLooksFinetune) ? "third-party quant/finetune of a canonical family" : "",
    ].filter(Boolean).join("; "),
  };
}

export function buildCanonicalParadigm({ model, fetched = {}, analysis = null, changelog = null, classification = null, existing = null } = {}) {
  const resolved = classification || classifyModelParadigm({ model, fetched, existing });
  if (resolved.branch === "variant_merged") {
    return {
      tag: resolved.tag,
      branch: resolved.branch,
      access: resolved.access,
      variant: resolved.variant,
      template: "variant_merged",
    };
  }

  if (resolved.branch === "update") {
    return {
      tag: resolved.tag,
      branch: resolved.branch,
      access: resolved.access,
      updateSize: resolved.updateSize,
      template: "version_update",
      card: buildNewModelCardTemplate({ model, fetched, analysis }),
      update: buildVersionUpdateTemplate({ model, fetched, changelog, analysis, classification: resolved }),
    };
  }

  return {
    tag: resolved.tag,
    branch: resolved.branch,
    access: resolved.access,
    tier: resolved.tier,
    requiresHumanConfirmation: Boolean(resolved.requiresHumanConfirmation),
    template: "new_model_card",
    card: buildNewModelCardTemplate({ model, fetched, analysis }),
  };
}

export function buildNewModelCardTemplate({ model = {}, fetched = {}, analysis = {} } = {}) {
  const status = fetched.status || fetched || {};
  const metadata = fetched.metadata || {};
  const open = model.kind === "open";
  const license = cleanString(status.license || (open ? UNKNOWN_OFFICIAL : "closed"));
  const commercialUse = open ? licenseCommercialUse(license) : "仅API闭源";
  const benchmarks = normalizeBenchmarksForParadigm(analysis?.benchmark);
  const card = {
    名称: cleanString(status.latestVersion || model.latestVersionHint || model.name) || UNKNOWN_OFFICIAL,
    厂商: cleanString(model.vendor) || UNKNOWN_OFFICIAL,
    发布日: cleanString(status.latestReleasedAt) || UNKNOWN_OFFICIAL,
    开放度标签: open ? opennessLabel(license) : "仅API闭源",
    类型: modelTypeFromText(model, fetched, analysis),
    规模架构: scaleArchitecture(metadata, analysis),
    关键benchmark: benchmarks,
    强弱一句: cleanString(analysis?.oneLineTakeaway) || UNKNOWN_OFFICIAL,
    一句话定位: cleanString(analysis?.whenToUse || analysis?.oneLineTakeaway) || UNKNOWN_OFFICIAL,
    术语注解: [
      "MoE（混合专家模型）: 推理时只激活部分专家参数，用较少计算调用更大的总参数池。",
      "reasoning（推理）: 模型进行多步分析、规划或验证的能力。",
      "context window（上下文窗口）: 单次请求中模型能读取的输入和输出 token 总长度。",
    ],
  };

  if (open) {
    card.许可证 = {
      名称: license || UNKNOWN_OFFICIAL,
      能否商用: commercialUse,
    };
    card.自托管硬件 = selfHostingHardware(metadata, analysis);
    card.可用变体 = normalizeStringArray(status.latestVersionVariants || metadata.relatedHfModels).length
      ? normalizeStringArray(status.latestVersionVariants || metadata.relatedHfModels)
      : [UNKNOWN_OFFICIAL];
    card.base_model = firstString(metadata.base_model || metadata.baseModel) || UNKNOWN_OFFICIAL;
  } else {
    card.价格 = {
      输入每百万token: cleanString(status.price_in || metadata.price_in || model.price_in) || UNKNOWN_OFFICIAL,
      输出每百万token: cleanString(status.price_out || metadata.price_out || model.price_out) || UNKNOWN_OFFICIAL,
    };
    card.知识截止 = cleanString(status.knowledge_cutoff || metadata.knowledge_cutoff || model.knowledge_cutoff) || UNKNOWN_OFFICIAL;
    card["model string"] = cleanString(status.model_string || metadata.model_string || model.model_string || status.latestVersion) || UNKNOWN_OFFICIAL;
    card.速率 = cleanString(status.rate_limit || metadata.rate_limit || model.rate_limit) || UNKNOWN_OFFICIAL;
    card["多模态I/O"] = cleanString(status.modalities || metadata.modalities || model.modalities) || UNKNOWN_OFFICIAL;
  }
  return card;
}

export function buildVersionUpdateTemplate({ model = {}, fetched = {}, changelog = {}, analysis = {}, classification = {} } = {}) {
  const status = fetched.status || fetched || {};
  const next = cleanString(classification.nextVersion || status.latestVersion || model.latestVersionHint || model.name) || UNKNOWN_OFFICIAL;
  const prev = cleanString(classification.previousVersion) || UNKNOWN_OFFICIAL;
  const date = cleanString(status.latestReleasedAt) || UNKNOWN_OFFICIAL;
  const changes = model.kind === "closed"
    ? normalizeClosedChanges(changelog)
    : normalizeOpenChanges(analysis, status);
  const modelStringChanged = Boolean(status.model_string && status.model_string !== prev);
  const oldDeprecated = /deprecat|弃用|sunset|retire/i.test(JSON.stringify(fetched));
  return {
    版本: `${prev}→${next}(${date})`,
    变了什么: changes.length ? changes : [UNKNOWN_OFFICIAL],
    破坏性提醒: {
      "model string变更": modelStringChanged ? "是" : "官方未披露",
      旧版弃用: oldDeprecated ? "是" : "官方未披露",
      需迁移: modelStringChanged || oldDeprecated ? "需要评估迁移" : "官方未披露",
    },
    值不值得切一句: cleanString(changelog?.oneLineTakeaway || analysis?.oneLineTakeaway) || UNKNOWN_OFFICIAL,
  };
}

export function benchmarkAttribution(sourceType) {
  if (sourceType === "third-party") return "实测";
  if (sourceType === "derived") return "实测";
  return "自报";
}

export function licenseCommercialUse(license) {
  const value = cleanString(license).toLowerCase();
  if (!value || value === "unknown" || value.includes("未披露")) return UNKNOWN_OFFICIAL;
  if (RESEARCH_ONLY_RE.test(value)) return "不可商用或仅研究";
  if (COMMERCIAL_LICENSES.has(value)) return "可商用";
  if (CONDITIONAL_COMMERCIAL_RE.test(value)) return "有条件商用，需核对许可证条款";
  return UNKNOWN_OFFICIAL;
}

function opennessLabel(license) {
  const commercial = licenseCommercialUse(license);
  if (commercial === "可商用") return "真开源可商用";
  if (commercial.startsWith("有条件商用")) return "有条件商用";
  if (commercial.startsWith("不可商用")) return "仅研究";
  return "有条件商用";
}

function normalizeBenchmarksForParadigm(benchmark = {}) {
  const items = [
    ...asArray(benchmark?.items).map((item) => ({
      名称: cleanString(item?.label) || UNKNOWN_OFFICIAL,
      分数: cleanString(item?.score) || UNKNOWN_OFFICIAL,
      对手: cleanString(item?.comparator) || UNKNOWN_OFFICIAL,
      标注: benchmarkAttribution(item?.sourceType),
      解读: cleanString(item?.interpretation) || UNKNOWN_OFFICIAL,
    })),
    ...asArray(benchmark?.charts).map((chart) => ({
      名称: cleanString(chart?.title) || UNKNOWN_OFFICIAL,
      分数: asArray(chart?.bars).map((bar) => `${cleanString(bar?.label)} ${cleanString(bar?.display)}`).filter(Boolean).join(" / ") || UNKNOWN_OFFICIAL,
      对手: asArray(chart?.bars).filter((bar) => !bar?.highlight).map((bar) => cleanString(bar?.label)).filter(Boolean).join(" / ") || UNKNOWN_OFFICIAL,
      标注: benchmarkAttribution(chart?.sourceType),
      解读: cleanString(chart?.metric) || UNKNOWN_OFFICIAL,
    })),
  ];
  return items.length ? items : [{
    名称: UNKNOWN_OFFICIAL,
    分数: UNKNOWN_OFFICIAL,
    对手: UNKNOWN_OFFICIAL,
    标注: "自报",
    解读: "没有可核验 benchmark 数字。",
  }];
}

function normalizeClosedChanges(changelog = {}) {
  return asArray(changelog?.newFeatures).map((item) => [
    cleanString(item?.feature),
    cleanString(item?.whatItIs),
    cleanString(item?.forYou),
  ].filter(Boolean).join(": ")).filter(Boolean);
}

function normalizeOpenChanges(analysis = {}, status = {}) {
  return [
    ...asArray(analysis?.whatItUnlocks).map((item) => [
      cleanString(item?.point),
      cleanString(item?.forYou),
    ].filter(Boolean).join(": ")),
    cleanString(status.license) ? `许可证/开放度: ${status.license}` : "",
    cleanString(status.latestReleasedAt) ? `发布日期: ${status.latestReleasedAt}` : "",
  ].filter(Boolean);
}

function scaleArchitecture(metadata = {}, analysis = {}) {
  const text = JSON.stringify({ metadata, analysis });
  const params = matchFirst(text, /\b(\d+(?:\.\d+)?\s*[BM]B?)\s*(?:total\s*)?(?:parameters|params|参数)/i);
  const active = matchFirst(text, /\b(\d+(?:\.\d+)?\s*[BM]B?)\s*(?:active|activated|激活)/i);
  const context = matchFirst(text, /\b(\d+\s*[kKmM]?)\s*(?:context|上下文|tokens?)/i);
  const moe = /\bMoE\b|混合专家|mixture of experts/i.test(text);
  return [
    moe ? `MoE 总参${params || UNKNOWN_OFFICIAL}+激活参${active || UNKNOWN_OFFICIAL}` : `架构${UNKNOWN_OFFICIAL}`,
    `context window（上下文窗口）${context || UNKNOWN_OFFICIAL}`,
  ].join("；");
}

function selfHostingHardware(metadata = {}, analysis = {}) {
  const text = JSON.stringify({ metadata, analysis });
  const hardware = matchFirst(text, /\b(?:H100|H200|B200|A100|A800|RTX\s*4090|RTX\s*3090|MI300X|TPU)[^。；;,."]*/i);
  return hardware || UNKNOWN_OFFICIAL;
}

function modelTypeFromText(model = {}, fetched = {}, analysis = {}) {
  const text = `${model.name} ${fetched.modelCardText || ""} ${JSON.stringify(analysis)}`;
  const out = [];
  if (/base|基座/i.test(text)) out.push("基座");
  if (/instruct|chat|指令/i.test(text)) out.push("指令");
  if (/vision|image|audio|video|multimodal|多模态/i.test(text)) out.push("多模态");
  if (/reasoning|thinking|推理/i.test(text)) out.push("推理");
  return out.length ? [...new Set(out)].join("/") : UNKNOWN_OFFICIAL;
}

function scoreNewModelTier(model = {}, fetched = {}) {
  const text = `${model.name} ${fetched.modelCardText || ""} ${JSON.stringify(fetched.metadata || {})}`;
  const relevant = /\b(llm|language model|multimodal|reasoning|agent|coding|vision|audio|MoE|transformer)\b|大模型|多模态|推理|智能体|代码/i.test(text);
  if (!relevant) return 0;
  let score = 0;
  if (/new architecture|novel|first|MoE|reasoning|frontier|前沿|新架构|大版本/i.test(text)) score += 1;
  if ((Number(fetched.metadata?.downloads) || 0) >= 10000 || (Number(fetched.metadata?.likes) || 0) >= 500) score += 1;
  if (/(OpenAI|Anthropic|Google|DeepMind|Meta|Mistral|Alibaba|Qwen|DeepSeek|Microsoft|xAI)/i.test(`${model.vendor} ${model.hfId || ""}`)) score += 1;
  if (/frontier|大版本|GPT-?\d|Claude|Gemini|Llama\s*\d|Qwen\d|DeepSeek/i.test(text)) return 3;
  return Math.max(1, Math.min(3, score));
}

function estimateUpdateSize(model = {}, fetched = {}, existing = null) {
  const text = `${fetched.changelogText || ""} ${fetched.modelCardText || ""}`;
  if (/breaking|deprecat|迁移|model string|price|pricing|license|context|上下文|许可证|价格/i.test(text)) return "medium";
  const prev = cleanString(existing?.latestVersion);
  const next = cleanString(fetched.status?.latestVersion || fetched.latestVersion);
  if (prev && next && majorVersion(prev) !== majorVersion(next)) return "medium";
  return "light";
}

function findSameFamilyRecord(model = {}, records = []) {
  return records.find((entry) => {
    if (!entry) return false;
    if (!entry.latestVersion && !entry.analysisGeneratedAt && !entry.model_string) return false;
    if (entry.id && model.id && entry.id === model.id) return true;
    if (entry.kind && entry.kind !== model.kind) return false;
    if (entry.vendor && model.vendor && cleanKey(entry.vendor) !== cleanKey(model.vendor)) return false;
    return cleanKey(entry.name || "").includes(cleanKey(model.name || "")) || cleanKey(model.name || "").includes(cleanKey(entry.name || ""));
  }) || null;
}

function findRegistryOwnerForFamily(model = {}, records = []) {
  const direct = findCanonicalHfIdForFamily(model, records);
  return direct?.includes("/") ? direct.split("/")[0] : "";
}

function findCanonicalHfIdForFamily(model = {}, records = []) {
  if (model.canonicalHfId) return model.canonicalHfId;
  const same = records.find((entry) => cleanKey(entry.id || "") === cleanKey(model.id || "") && entry.hfId);
  return same?.hfId || "";
}

function canonicalHfId(baseModel) {
  const base = firstString(baseModel);
  if (!base) return "";
  return base.replace(/^https:\/\/huggingface\.co\//i, "").replace(/^hf:\/\//i, "").trim();
}

function majorVersion(value) {
  const match = cleanString(value).match(/\d+/);
  return match ? match[0] : cleanKey(value);
}

function matchFirst(value, regex) {
  const match = String(value || "").match(regex);
  return match ? cleanString(match[1] || match[0]) : "";
}

function firstString(value) {
  if (Array.isArray(value)) return cleanString(value[0]);
  return cleanString(value);
}

function normalizeStringArray(value) {
  return asArray(value).map((item) => cleanString(item)).filter(Boolean);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanKey(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cleanString(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
