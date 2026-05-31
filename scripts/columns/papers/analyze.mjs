import { createDeepSeekClient } from "../../lib/llm.mjs";
import { analysisSystem, analysisUser } from "./prompts.mjs";

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  const candidate = item?.candidate || item || {};
  const evaluation = item?.eval || item?.evaluation || {};
  const tier = normalizeTier(options.paperAnalysisTier || options.analysisTier || "deep");
  const offline = isOffline(options);
  const model = paperModel(tier, options);
  let payload = null;

  if (!offline) {
    try {
      const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx.logger }).chatJson;
      payload = await chatJson({
        system: analysisSystem(tier),
        user: analysisUser(candidate, evidence, evaluation),
        model,
        maxTokens: maxTokens(tier, options),
      });
    } catch (error) {
      ctx.logger?.warn?.(`[papers:analyze] LLM analysis skipped for ${candidate?.id || "unknown"}: ${error.message}`);
    }
  }

  const normalized = normalizeAnalysis(payload, {
    candidate,
    tier,
    evidence,
    evaluation,
    now: options.now,
  });

  if (options.db) {
    options.db.insertAnalysis({
      candidateId: candidate?.id || normalized.id,
      tier: normalized.tier,
      payload: normalized,
      model: payload && !offline ? model : `offline-papers-${normalized.tier}`,
      generatedAt: normalized.verifiedAt,
    });
  }

  return normalized;
}

export function normalizeAnalysis(payload, opts = {}) {
  const candidate = opts.candidate || {};
  const raw = candidate.raw || candidate || {};
  const evidence = opts.evidence || {};
  const tier = normalizeTier(opts.tier || payload?.tier || "deep");
  const verifiedAt = nowIso(opts);
  const sourceUrl = cleanString(raw.sourceUrl || raw.paperUrl || payload?.sourceUrl || payload?.provenance?.sourceUrl);
  const fallback = offlineFallback({ raw, evidence, tier });
  const sections = normalizeSections(payload?.sections, { tier });
  const title = cleanString(raw.title || payload?.title || "Untitled paper");
  const out = {
    id: cleanString(candidate.id || raw.id || idFromTitle(title)),
    title,
    authors: authorsString(raw.authors || payload?.authors),
    venue: cleanString(raw.venue || payload?.venue || "Venue not provided"),
    sourceName: cleanString(raw.sourceName || raw.source || payload?.sourceName || "papers"),
    sourceUrl,
    verifiedAt,
    tier,
    leadJudgment: cleanPublicString(payload?.leadJudgment || fallback.leadJudgment),
    sections: sections.length ? sections : fallback.sections,
    limitsAndFuture: normalizeLimits(payload?.limitsAndFuture, fallback.limitsAndFuture),
    selection: normalizeSelection(payload?.selection, opts.evaluation, raw),
    provenance: {
      sourceUrl,
      evidenceKind: cleanString(evidence.kind || payload?.provenance?.evidenceKind || "paper-text"),
    },
  };

  const arxivId = cleanString(raw.arxivId || payload?.arxivId);
  const publishedAt = cleanString(raw.publishedAt || payload?.publishedAt);
  if (arxivId) out.arxivId = arxivId;
  if (publishedAt) out.publishedAt = publishedAt;

  return out;
}

function normalizeSections(value, { tier }) {
  return asArray(value)
    .map((item) => {
      const heading = cleanPublicString(item?.heading || item?.title || "");
      const summary = cleanPublicString(item?.summary || item?.body || (typeof item === "string" ? item : ""));
      if (!heading || !summary) return null;
      const section = { heading, summary };
      if (tier === "deep") {
        const loadBearing = cleanPublicString(item?.loadBearing);
        const evidence = cleanPublicString(item?.evidence);
        const fold = cleanPublicString(item?.fold);
        if (loadBearing) section.loadBearing = loadBearing;
        if (evidence) section.evidence = evidence;
        if (fold) section.fold = fold;
      }
      return section;
    })
    .filter(Boolean);
}

function normalizeLimits(value, fallback) {
  return {
    paperStated: cleanPublicString(value?.paperStated || fallback.paperStated),
    evidenceNotes: cleanPublicString(value?.evidenceNotes || fallback.evidenceNotes),
  };
}

function normalizeSelection(value, evaluation = {}, raw = {}) {
  const source = value || {};
  const triage = evaluation?.selection || raw.selection || {};
  return {
    convergence: normalizeStringArray(source.convergence || triage.convergence || raw.sourceSignals),
    track: normalizeStringArray(source.track || triage.track || raw.focusTopics),
    ideaSignal: cleanPublicString(source.ideaSignal || triage.ideaSignal || raw.ideaSignal || "triage signal unavailable"),
  };
}

function offlineFallback({ raw = {}, evidence = {}, tier = "deep" }) {
  const evidenceText = cleanString(evidence.content);
  const sectionList = normalizeStringArray(evidence.sections);
  const summary = evidenceText
    ? firstChars(evidenceText, 360)
    : sectionList.length
      ? `当前证据只列出论文版块：${sectionList.join("、")}。`
      : "当前离线证据只包含论文元数据，暂不能展开正文细节。";
  const section = { heading: "摘要", summary };
  if (tier === "deep") {
    section.evidence = evidenceText
      ? "离线 fallback 只使用已收集的 paper-text 证据，不补充证据外事实。"
      : "论文证据未提供正文或摘要。";
  }
  return {
    leadJudgment: raw.title
      ? `离线模式下只根据已收集证据保留《${cleanString(raw.title)}》的基础脉络。`
      : "离线模式下只根据已收集证据保留论文的基础脉络。",
    sections: [section],
    limitsAndFuture: {
      paperStated: "论文证据未提供限制或未来工作段落。",
      evidenceNotes: evidenceText
        ? "当前分析受限于已收集 evidence.content，未使用证据外信息。"
        : "当前证据不足以判断实验范围、样本范围或外推边界。",
    },
  };
}

function cleanPublicString(value) {
  return stripVerdictLanguage(cleanString(value));
}

function stripVerdictLanguage(value) {
  return String(value || "")
    .replace(/\b(?:score|rating)\s*[:：]?\s*\d+(?:\s*\/\s*\d+)?/gi, "")
    .replace(/打分\s*[:：]?\s*\d+(?:\s*\/\s*\d+)?\s*分?/g, "")
    .replace(/\d+\s*\/\s*100\s*分?/g, "")
    .replace(/这是一篇(?:好|坏|优秀|糟糕|很差|顶级)论文[。；;,，]*/g, "")
    .replace(/(?:好|坏)论文[。；;,，]*/g, "")
    .replace(/(?:值得|不值得)(?:一读|阅读|深读|推荐)[。；;,，]*/g, "")
    .replace(/不?推荐(?:阅读|深读|精读|一读)[。；;,，]*/g, "")
    .replace(/我(?:推荐|不推荐)[^。；;]*(?:[。；;]|$)/g, "")
    .replace(/结论[:：]?\s*(?:好|坏|推荐|不推荐)[。；;,，]*/g, "")
    .replace(/想一想[^。；;]*(?:[。；;]|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function authorsString(value) {
  const authors = normalizeStringArray(value);
  return authors.length ? authors.join(", ") : "Authors not provided";
}

function normalizeStringArray(value) {
  return asArray(value).map(cleanString).filter(Boolean);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanString(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstChars(value, limit) {
  const text = cleanString(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function idFromTitle(title) {
  return cleanString(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "paper-analysis";
}

function normalizeTier(value) {
  return value === "light" ? "light" : "deep";
}

function paperModel(tier, options = {}, env = process.env) {
  if (tier === "light") return options.papersLightModel || env.PAPERS_LIGHT_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  return options.papersDeepModel || env.PAPERS_DEEP_MODEL || env.DEEPSEEK_PRO_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-pro";
}

function maxTokens(tier, options = {}, env = process.env) {
  if (tier === "light") return numberOption(options.paperLightMaxTokens, Number(env.PAPERS_LIGHT_MAX_TOKENS) || 2600);
  return numberOption(options.paperDeepMaxTokens, Number(env.PAPERS_DEEP_MAX_TOKENS) || 8000);
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isOffline(options = {}, env = process.env) {
  return Boolean(options.noLlm || options.dryRun || env.NO_LLM === "1" || env.AI_BRIEF_OFFLINE === "1");
}

function nowIso(opts = {}) {
  return opts.now?.() || new Date().toISOString();
}
