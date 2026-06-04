import assert from "node:assert/strict";
import test from "node:test";

import { generateModelEntry } from "../columns/models/generate.mjs";
import { buildCanonicalParadigm, classifyModelParadigm, licenseCommercialUse } from "../columns/models/paradigm.mjs";

const openModel = {
  id: "acme-frontier",
  name: "Acme Frontier 2",
  vendor: "Acme AI",
  country: "US",
  kind: "open",
  hfId: "acme/frontier-2",
};

const openFetched = {
  status: {
    latestVersion: "Frontier-2-Instruct",
    latestReleasedAt: "2026-06-03",
    latestReleasedAtPrecision: "day",
    isOpen: true,
    license: "apache-2.0",
    hasEvalData: true,
    evalSources: ["official model card"],
    evalThirdPartyPending: ["LMArena"],
    hasChangelog: true,
    changelogUrl: "https://huggingface.co/acme/frontier-2",
    lastCheckedAt: "2026-06-03T12:00:00.000Z",
    latestVersionVariants: ["Frontier-2-Instruct"],
  },
  sources: [{ name: "HuggingFace · acme/frontier-2", url: "https://huggingface.co/acme/frontier-2" }],
  modelCardText: "Frontier model. MoE 120B parameters with 12B active. 128k context window. reasoning and coding.",
  metadata: {
    hfId: "acme/frontier-2",
    downloads: 25000,
    likes: 800,
    base_model: "",
    relatedHfModels: ["Frontier-2-Instruct"],
  },
};

const openAnalysisPayload = {
  analysis: {
    oneLineTakeaway: "Frontier-2 是一个适合自托管 agent 的 MoE 模型。",
    whatItUnlocks: [{
      point: "长上下文 agent",
      forYou: "可以放入更长任务轨迹。",
      evidence: "official model card",
      confidence: "medium",
    }],
    benchmark: {
      headline: "官方自报 GPQA 72.1，第三方实测 Arena 1290。",
      professorNote: "benchmark 用来判断是否值得迁移。",
      charts: [{
        title: "GPQA Diamond",
        metric: "accuracy",
        unit: "%",
        higherIsBetter: true,
        sourceType: "official",
        maxValue: 100,
        bars: [{ label: "Frontier-2", display: "72.1", value: 72.1, highlight: true }, { label: "Rival-1", display: "70.0", value: 70 }],
      }],
      items: [{
        label: "Arena Elo",
        score: "1290",
        comparator: "vs Rival-1 1260",
        interpretation: "第三方实测更接近线上偏好。",
        sourceType: "third-party",
      }],
      caveats: ["官方分数为自报。"],
    },
    openSourceMeaning: "Apache-2.0 可商用，可自托管。",
    whenToUse: "需要长上下文自托管 agent 时使用。",
    cost_caveats: "官方未披露",
    sources: [{ name: "HuggingFace · acme/frontier-2", url: "https://huggingface.co/acme/frontier-2" }],
  },
};

test("open canonical model produces new-model paradigm card with benchmark attribution and commercial license", async () => {
  const entry = await generateModelEntry({
    model: openModel,
    fetched: openFetched,
    options: {
      chatJson: async () => openAnalysisPayload,
      generatedAt: "2026-06-03T13:00:00.000Z",
    },
  });

  assert.equal(entry.paradigm.branch, "new_model");
  assert.match(entry.paradigm.tag, /^\[新模型 Tier[0-3]｜open\]/);
  assert.equal(entry.paradigm.card["开放度标签"], "真开源可商用");
  assert.equal(entry.paradigm.card["许可证"]["能否商用"], "可商用");
  assert.equal(entry.analysis.benchmark.items[0].attribution, "实测");
  assert.equal(entry.paradigm.card["关键benchmark"][0]["标注"], "实测");
  assert.equal(licenseCommercialUse("apache-2.0"), "可商用");
});

test("open derivative is classified as merged variant and stops before new-model analysis", () => {
  const derivativeModel = {
    ...openModel,
    id: "frontier-2-gguf",
    name: "Frontier-2-GGUF",
    hfId: "quant-lab/frontier-2-GGUF",
  };
  const derivativeFetched = {
    status: { ...openFetched.status, latestVersion: "Frontier-2-GGUF" },
    metadata: {
      hfId: "quant-lab/frontier-2-GGUF",
      base_model: "acme/frontier-2",
    },
  };

  const classification = classifyModelParadigm({
    model: derivativeModel,
    fetched: derivativeFetched,
    libraryRecords: [{ ...openModel, latestVersion: "Frontier-2-Instruct", hfId: "acme/frontier-2" }],
  });
  const paradigm = buildCanonicalParadigm({ model: derivativeModel, fetched: derivativeFetched, classification });

  assert.equal(classification.branch, "variant_merged");
  assert.equal(paradigm.tag, "[变体·已归并]");
  assert.equal(paradigm.variant.canonicalHfId, "acme/frontier-2");
});

test("closed same-family model string change is an update diff template", async () => {
  const closedModel = {
    id: "openai-gpt",
    name: "OpenAI GPT",
    vendor: "OpenAI",
    country: "US",
    kind: "closed",
    changelogUrl: "https://platform.openai.com/docs/changelog",
  };
  const closedFetched = {
    status: {
      latestVersion: "GPT-5.5",
      latestReleasedAt: "2026-06-03",
      latestReleasedAtPrecision: "day",
      isOpen: false,
      license: "closed",
      hasEvalData: false,
      evalSources: [],
      hasChangelog: true,
      changelogUrl: "https://platform.openai.com/docs/changelog",
      lastCheckedAt: "2026-06-03T12:00:00.000Z",
      model_string: "gpt-5.5",
    },
    sources: [{ name: "OpenAI official changelog", url: "https://platform.openai.com/docs/changelog" }],
    changelogText: "GPT-5.5 adds a larger context window and deprecates GPT-5.4.",
  };
  const entry = await generateModelEntry({
    model: closedModel,
    fetched: closedFetched,
    options: {
      existingEntry: { id: "openai-gpt", kind: "closed", latestVersion: "GPT-5.4" },
      chatJson: async () => ({
        changelog: {
          oneLineTakeaway: "值得从 GPT-5.4 迁移到 GPT-5.5 做长上下文任务。",
          newFeatures: [{
            feature: "larger context window",
            whatItIs: "上下文窗口变大。",
            forYou: "可以放入更长文档。",
            howToUse: "指定 gpt-5.5。",
            whenToUse: "长上下文任务。",
          }],
          limitations: "旧版弃用需要迁移。",
          sources: [{ name: "OpenAI official changelog", url: "https://platform.openai.com/docs/changelog" }],
        },
      }),
      generatedAt: "2026-06-03T13:00:00.000Z",
    },
  });

  assert.equal(entry.paradigm.branch, "update");
  assert.equal(entry.paradigm.tag, "[更新｜closed]");
  assert.equal(entry.paradigm.update["版本"], "GPT-5.4→GPT-5.5(2026-06-03)");
  assert.equal(entry.paradigm.update["破坏性提醒"]["model string变更"], "是");
});
