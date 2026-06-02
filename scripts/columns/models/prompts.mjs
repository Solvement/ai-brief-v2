export const MODEL_READER_PERSONA = `读者是一个要成为 AI PM / FDE / AI 应用开发者、平时会 vibe coding 的人。所有分析都必须从 applied-builder 角度写:这对我做 AI 应用有什么用、能解锁什么以前做不了的东西、我要不要用、怎么用。不要解释内部机制或数学原理。必须中文输出;术语只在必要时出现,第一次出现要用日常语言解释。`;

export const MODEL_BENCHMARK_SCHEMA = {
  headline: "中文一句话说明 benchmark 结论,只说已核验的事实",
  professorNote: "给应用开发者看的解释:这些指标为什么影响选型/落地",
  charts: [{
    title: "chart title",
    metric: "metric name",
    unit: "分|%|tokens|...",
    higherIsBetter: true,
    sourceType: "official|third-party|derived",
    maxValue: 100,
    bars: [{ label: "model", display: "73.5", value: 73.5, highlight: true }],
  }],
  items: [{
    label: "benchmark name",
    score: "score text",
    comparator: "verified comparator",
    interpretation: "what this means for builders",
    sourceType: "official|third-party|derived",
  }],
  caveats: ["missing third-party eval / self-claim caveat"],
};

export const OPEN_MODEL_OUTPUT_SCHEMA = {
  id: "model-family-id",
  name: "model family name",
  vendor: "vendor",
  country: "country",
  kind: "open",
  latestVersion: "latest version only",
  latestVersionVariants: ["optional variant names"],
  latestReleasedAt: "YYYY-MM-DD or ISO",
  latestReleasedAtPrecision: "optional precision note",
  isOpen: true,
  license: "license",
  hasEvalData: true,
  evalSources: ["verified official/third-party eval sources"],
  evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  hasChangelog: true,
  changelogUrl: "official model card / release URL",
  lastCheckedAt: "YYYY-MM-DD or ISO",
  analysis: {
    oneLineTakeaway: "中文: one practical builder takeaway",
    whatItUnlocks: [{
      point: "capability/change",
      forYou: "what this unlocks for AI app builders",
      evidence: "source-backed evidence pointer",
      confidence: "high|medium|low plus reason",
    }],
    benchmark: MODEL_BENCHMARK_SCHEMA,
    openSourceMeaning: "what open source means for deployment/cost/data/control",
    whenToUse: "when to use and how to start",
    cost_caveats: "real cost/hardware/API caveats",
    sources: [{ name: "source name", url: "https://..." }],
  },
  analysisGeneratedAt: "YYYY-MM-DD or ISO",
  analysisAuthor: "model/pipeline author",
};

export const CLOSED_MODEL_OUTPUT_SCHEMA = {
  id: "model-family-id",
  name: "model family name",
  vendor: "vendor",
  country: "country",
  kind: "closed",
  latestVersion: "latest named release only",
  latestVersionVariants: ["optional variant names"],
  latestReleasedAt: "YYYY-MM-DD or ISO",
  latestReleasedAtPrecision: "optional precision note",
  isOpen: false,
  license: "closed",
  hasEvalData: false,
  evalSources: [],
  hasChangelog: true,
  changelogUrl: "official changelog URL",
  lastCheckedAt: "YYYY-MM-DD or ISO",
  changelog: {
    oneLineTakeaway: "中文: what this update means for AI app builders",
    newFeatures: [{
      feature: "official feature name",
      whatItIs: "plain-language explanation",
      forYou: "practical benefit for builders",
      howToUse: "how to use it in an app/workflow",
      whenToUse: "when it is worth using",
    }],
    limitations: "pricing/limits/edge cases from official notes only",
    sources: [{ name: "official changelog", url: "https://..." }],
  },
  analysisGeneratedAt: "YYYY-MM-DD or ISO",
  analysisAuthor: "model/pipeline author",
};

const OPEN_SCHEMA_TEXT = JSON.stringify(OPEN_MODEL_OUTPUT_SCHEMA, null, 2);
const CLOSED_SCHEMA_TEXT = JSON.stringify(CLOSED_MODEL_OUTPUT_SCHEMA, null, 2);

export function openModelSystemPrompt() {
  return `${MODEL_READER_PERSONA}

你是 AI-Brief Models 栏目的开源模型分析员。你只写给应用构建者,不写模型论文审稿。

硬规则:
- 只分析这个模型家族的最新版本,不要写历史家谱。
- 功能/规格/benchmark 事实只能来自官方 model card、官方技术报告或明确给出的第三方榜单。
- 每条 whatItUnlocks 和每个 benchmark 数字都必须带来源。不能核验就省略,并写进 caveats。
- 厂商自称的能力必须标 confidence="low(...厂商自评...)" 并放入 evalThirdPartyPending,等待 LMArena/OpenLLM 等第三方核验。
- 不解释内部机制、数学原理或训练细节;只解释它对做 AI 应用有什么实际用处。
- 只输出严格 JSON object,不要 markdown fence,不要注释,不要尾随逗号。

输出必须匹配这个 JSON shape:
${OPEN_SCHEMA_TEXT}`;
}

export function closedModelSystemPrompt() {
  return `${MODEL_READER_PERSONA}

你是 AI-Brief Models 栏目的闭源模型 changelog 分析员。你的工作不是猜机制,而是把官方 release notes 翻译成应用开发者能用的选型/使用建议。

硬规则:
- newFeatures 必须来自厂商官方 changelog / release notes 的具体条目。官方没有写的功能,不能收录。
- 第三方媒体、机器之心、Datawhale 只能作为“发现有新版本”的信号,绝不能作为 feature 事实来源。
- 不写内部机制或数学推断,因为闭源模型无法核验。
- 每个 feature 都要说明 whatItIs / forYou / howToUse / whenToUse,全部从应用构建角度写。
- 限制、价格、配额、地区等只写官方 notes 中能支持的内容;缺失就写“官方 changelog 未说明”。
- 只输出严格 JSON object,不要 markdown fence,不要注释,不要尾随逗号。

输出必须匹配这个 JSON shape:
${CLOSED_SCHEMA_TEXT}`;
}

export function openModelUserPrompt({ model, fetched, goldStandard }) {
  return JSON.stringify({
    persona: MODEL_READER_PERSONA,
    model: publicModel(model),
    fetched: publicFetched(fetched),
    fewShotGoldStandard: goldStandard,
    instruction: "参考 fewShotGoldStandard 的字段、语气、应用视角和来源标注,生成这个模型家族最新版本的完整 ModelEntry JSON。不要复制 gold 的事实到别的模型。没有一手证据的数字不要写。",
  }, null, 2);
}

export function closedModelUserPrompt({ model, fetched }) {
  return JSON.stringify({
    persona: MODEL_READER_PERSONA,
    model: publicModel(model),
    fetched: publicFetched(fetched),
    officialChangelogOnly: true,
    instruction: "只根据 fetched.changelogText / fetched.sources 里的官方 changelog 生成完整 ModelEntry JSON。newFeatures 每条都必须能追溯到官方 changelog;官方未写则不要补。",
  }, null, 2);
}

function publicModel(model = {}) {
  return {
    id: model.id,
    name: model.name,
    vendor: model.vendor,
    country: model.country,
    kind: model.kind,
    hfId: model.hfId,
    changelogUrl: model.changelogUrl,
  };
}

function publicFetched(fetched = {}) {
  const status = fetched.status || fetched;
  return {
    latestVersion: status.latestVersion,
    latestVersionVariants: status.latestVersionVariants,
    latestReleasedAt: status.latestReleasedAt,
    latestReleasedAtPrecision: status.latestReleasedAtPrecision,
    isOpen: status.isOpen,
    license: status.license,
    hasEvalData: status.hasEvalData,
    evalSources: status.evalSources,
    evalThirdPartyPending: status.evalThirdPartyPending,
    hasChangelog: status.hasChangelog,
    changelogUrl: status.changelogUrl,
    lastCheckedAt: status.lastCheckedAt,
    sources: fetched.sources || [],
    modelCardText: truncate(fetched.modelCardText, 28000),
    technicalReportText: truncate(fetched.technicalReportText, 18000),
    changelogText: truncate(fetched.changelogText, 28000),
    metadata: fetched.metadata || {},
  };
}

function truncate(value, maxChars) {
  const text = String(value || "");
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n...[truncated]` : text;
}
