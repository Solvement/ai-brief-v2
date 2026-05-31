import { createDeepSeekClient } from "../../lib/llm.mjs";
import { analysisSystem, analysisUser } from "./prompts.mjs";

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  const candidate = item?.candidate || item || {};
  const evaluation = item?.eval || item?.evaluation || {};
  const tier = normalizeTier(options.paperAnalysisTier || options.analysisTier || "deep");
  const offline = isOffline(options);
  const model = paperModel(tier, options);
  const externalAudit = tier === "deep" && !offline ? await auditExternalClaims(evidence, ctx) : [];
  let payload = null;

  if (!offline) {
    try {
      const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx.logger }).chatJson;
      payload = await chatJson({
        system: analysisSystem(tier),
        user: analysisUser(candidate, evidence, evaluation, tier, externalAudit),
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
    externalAudit,
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
  if (tier === "deep") {
    out.deepDive = normalizeDeepDive(payload?.deepDive, {
      evidence,
      externalAudit: opts.externalAudit,
      fallback,
      sections: out.sections,
    });
    const scorecard = normalizeScorecard(payload?.scorecard);
    if (scorecard.length) out.scorecard = scorecard;
  }

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

function normalizeScorecard(value) {
  return asArray(value)
    .map((item) => {
      const dimension = cleanPublicString(item?.dimension);
      const score = Number(item?.score);
      const reason = cleanPublicString(item?.reason);
      if (!dimension || !Number.isFinite(score) || !reason) return null;
      return {
        dimension,
        score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
        reason,
      };
    })
    .filter(Boolean);
}

function normalizeDeepDive(value, { evidence = {}, externalAudit = [], fallback = {}, sections = [] } = {}) {
  const source = value || {};
  const evidenceText = cleanString(evidence.content);
  const audit = normalizeAudit([...asArray(source.audit), ...asArray(externalAudit)]);
  const limitations = ensureReproducibilityLimitation(
    normalizeStringArray(source.limitations),
    audit,
    fallback.limitsAndFuture,
  );
  return {
    reframe: cleanPublicString(source.reframe) || "Collected evidence is not sufficient to reframe the paper beyond its metadata and abstract.",
    contributionLayers: normalizeContributionLayers(source.contributionLayers),
    mechanism: cleanPublicString(source.mechanism) || "Collected evidence did not provide enough mechanism detail for a reviewer-style mechanism judgment.",
    evidenceChain: normalizeEvidenceChain(source.evidenceChain, evidenceText),
    audit,
    loadBearingClaim: cleanPublicString(source.loadBearingClaim || firstPresent(sections.map((section) => section.loadBearing))) || "No load-bearing claim was identified from the collected evidence.",
    strongestEvidence: normalizeStringArray(source.strongestEvidence),
    limitations,
    suggestedExperiments: normalizeStringArray(source.suggestedExperiments),
  };
}

function normalizeContributionLayers(value) {
  return asArray(value)
    .map((item) => {
      const layer = cleanPublicString(item?.layer);
      const claim = cleanPublicString(item?.claim);
      const judgment = cleanPublicString(item?.judgment);
      if (!layer || !claim || !judgment) return null;
      return { layer, claim, judgment };
    })
    .filter(Boolean);
}

function normalizeEvidenceChain(value, evidenceText) {
  return asArray(value)
    .map((item) => {
      const component = cleanPublicString(item?.component);
      const reviewerNote = cleanPublicString(item?.reviewerNote);
      const metrics = normalizeEvidenceMetrics(item?.metrics, evidenceText);
      if (!component || !reviewerNote) return null;
      return { component, metrics, reviewerNote };
    })
    .filter(Boolean);
}

function normalizeEvidenceMetrics(value, evidenceText) {
  return asArray(value)
    .map((item) => {
      const label = cleanPublicString(item?.label);
      const metricValue = cleanPublicString(item?.value);
      const note = cleanPublicString(item?.note);
      if (!label || !metricValue || !metricValueSupported(metricValue, evidenceText)) return null;
      const metric = { label, value: metricValue };
      if (note) metric.note = note;
      return metric;
    })
    .filter(Boolean);
}

function metricValueSupported(value, evidenceText) {
  const numbers = String(value || "").match(/\d+(?:\.\d+)?%?/g) || [];
  if (numbers.length === 0) return true;
  const haystack = cleanString(evidenceText).replace(/,/g, "");
  return numbers.some((number) => haystack.includes(number.replace(/,/g, "")));
}

function normalizeAudit(value) {
  const bySourceAndClaim = new Map();
  for (const item of asArray(value)) {
    const claim = cleanPublicString(item?.claim);
    const finding = cleanPublicString(item?.finding);
    const source = cleanString(item?.source);
    if (!claim || !finding) continue;
    const key = `${source}\n${claim}\n${finding}`.toLowerCase();
    if (bySourceAndClaim.has(key)) continue;
    const audit = { claim, finding };
    if (source) audit.source = source;
    bySourceAndClaim.set(key, audit);
  }
  return [...bySourceAndClaim.values()];
}

function ensureReproducibilityLimitation(limitations, audit, fallbackLimits = {}) {
  const out = [...limitations];
  const hasRepro = out.some((item) => /reproduc|replicat|artifact|code|open[- ]?source|可复现|复现/i.test(item));
  if (!hasRepro) {
    const auditNote = audit.length
      ? "Reproducibility note: external project/repository claims were checked in the audit entries above; remaining reproducibility depends on paper artifacts, code, data, and run instructions actually being present."
      : "Reproducibility note: no external project or repository URL was available in the collected evidence, so artifact availability could not be independently checked.";
    out.push(auditNote);
  }
  const fallbackNote = cleanPublicString(fallbackLimits?.evidenceNotes);
  if (out.length === 0 && fallbackNote) out.push(fallbackNote);
  return out;
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

async function auditExternalClaims(evidence = {}, ctx = {}) {
  const options = ctx.options || {};
  const evidenceText = String(evidence.content || "");
  const urls = extractAuditUrls(evidenceText).slice(0, numberOption(options.paperAuditUrlLimit, 5));
  const out = [];
  for (const url of urls) {
    try {
      const page = await fetchAuditPage(url, options);
      const finding = auditFinding(url, page);
      if (!finding) continue;
      out.push({
        claim: sentenceAroundUrl(evidenceText, url) || "Paper mentions an external project/artifact URL.",
        finding,
        source: url,
      });
    } catch (error) {
      ctx.logger?.warn?.(`[papers:analyze] external audit skipped ${url}: ${error.message}`);
    }
  }
  return out;
}

function extractAuditUrls(text = "") {
  const urls = [];
  const seen = new Set();
  for (const match of String(text).matchAll(/https?:\/\/[^\s<>"')\]}，。；;]+/gi)) {
    const url = cleanUrl(match[0]);
    if (!url || seen.has(url) || !isAuditableUrl(url, text, match.index || 0)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function isAuditableUrl(url, text, index) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (/(^|\.)github\.com$|(^|\.)huggingface\.co$|(^|\.)gitlab\.com$|(^|\.)bitbucket\.org$|github\.io$/i.test(host)) return true;
  if (/arxiv\.org|openreview\.net|doi\.org|aclanthology\.org|thecvf\.com|paperswithcode\.com/i.test(host)) return false;
  const context = String(text).slice(Math.max(0, index - 180), index + 240);
  return /\b(project|website|homepage|code|repo(?:sitory)?|artifact|implementation|release|open[- ]?source|dataset|model weights?)\b/i.test(context);
}

async function fetchAuditPage(url, options = {}) {
  const fetchImpl = options.fetch || fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), numberOption(options.paperAuditTimeoutMs, 12000));
  try {
    const res = await fetchImpl(url, {
      headers: {
        "user-agent": options.userAgent || "ai-brief-papers-column/0.1 (paper artifact audit)",
        accept: "text/html,application/json,text/plain;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText || "",
      text: textFromHtml(text).slice(0, 12000),
    };
  } finally {
    clearTimeout(timer);
  }
}

function auditFinding(url, page = {}) {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "external page";
    }
  })();
  const text = page.text || "";
  if (!page.ok) return `${host} returned HTTP ${page.status}${page.statusText ? ` ${page.statusText}` : ""}.`;
  if (/release on hold|code release on hold|data release on hold/i.test(text)) return `${host} is reachable, but the page says release is on hold.`;
  if (/repository has been archived|this repository was archived|read-only archive/i.test(text)) return `${host} is reachable, but the repository is archived/read-only.`;
  if (/not found|page not found|repository not found|model not found|404/i.test(text)) return `${host} is reachable, but the page content indicates not found/unavailable.`;
  if (/access to this (model|dataset)|gated repo|request access|agree to share your contact information|not public/i.test(text)) return `${host} is reachable, but access appears gated or restricted.`;
  if (/github\.com$/i.test(host)) return `${host} repository page is reachable; no obvious archived, not-found, or release-on-hold warning was detected in the fetched page.`;
  if (/huggingface\.co$/i.test(host)) return `${host} artifact page is reachable; no obvious gated, not-found, or release-on-hold warning was detected in the fetched page.`;
  const title = firstTitleLike(text);
  return title ? `${host} project page is reachable: ${title}.` : `${host} project page is reachable.`;
}

function sentenceAroundUrl(text, url) {
  const source = String(text);
  const index = source.indexOf(url);
  if (index < 0) return "";
  const before = source.slice(0, index);
  const previousBreak = Math.max(before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?"), before.lastIndexOf("\n"), before.lastIndexOf("。"), before.lastIndexOf("！"), before.lastIndexOf("？"));
  const after = source.slice(index + url.length);
  const nextBreak = after.search(/[.!?。！？\n]/);
  const start = Math.max(0, previousBreak + 1);
  const end = nextBreak < 0 ? Math.min(source.length, index + url.length + 160) : index + url.length + nextBreak + 1;
  return cleanPublicString(source.slice(start, end)).slice(0, 360);
}

function cleanUrl(value = "") {
  return String(value).replace(/[.,;:!?，。；：！？]+$/g, "").trim();
}

function textFromHtml(value = "") {
  return decodeBasicEntities(String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function firstTitleLike(text = "") {
  const clean = cleanString(text);
  const title = clean.split(/(?:GitHub|Hugging Face|README|Files and versions|Model card)/i)[0]?.trim();
  return title && title.length >= 4 ? title.slice(0, 160) : "";
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

function firstPresent(values) {
  return asArray(values).map(cleanString).find(Boolean) || "";
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
