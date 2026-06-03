import { createDeepSeekClient } from "../../lib/llm.mjs";
import {
  analysisSystem,
  analysisUser,
  reviewSystem,
  reviewUser,
  revisionSystem,
  revisionUser,
} from "./prompts.mjs";

// Academic 精读伴读 (reading-companion) analyze stage — 2026-06-01 rebuild.
// Produces the two-stage schema: originalReading[] (faithful) + analystNotes (free-form),
// plus meta + selectionAudit. NO verdict / scorecard / FDE / claimLedger / evidenceMatrix /
// artifactAudit. Academic papers only ever produce the "deep" tier.

const PAPER_TYPES = new Set(["survey", "theory", "system", "benchmark", "dataset", "industry_case", "evaluation_audit", "tooling", "position_roadmap"]);
const VENUE_STATUSES = new Set(["verified", "unverified", "not_provided"]);
const KEY_RESULT_KINDS = new Set(["figure", "table", "result"]);
const MAX_KEY_RESULTS = 5;

export async function analyze(item, evidence, ctx = {}) {
  const options = ctx.options || {};
  const candidate = item?.candidate || item || {};
  const evaluation = item?.eval || item?.evaluation || {};
  const offline = isOffline(options);
  const model = paperModel(options);
  let payload = null;
  let chatJson = options.chatJson || null;

  if (!offline) {
    try {
      chatJson ||= createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx.logger }).chatJson;
      payload = await chatJson({
        system: analysisSystem(),
        user: analysisUser(candidate, evidence, evaluation),
        model,
        maxTokens: maxTokens(options),
      });
    } catch (error) {
      ctx.logger?.warn?.(`[papers:analyze] LLM analysis skipped for ${candidate?.id || "unknown"}: ${error.message}`);
    }
  }

  let normalized = normalizeAnalysis(payload, {
    candidate,
    evidence,
    evaluation,
    now: options.now,
  });
  const reviewed = await reviewAndReviseAnalysis(normalized, {
    analystPayload: payload,
    candidate,
    evidence,
    evaluation,
    options,
    ctx,
    offline,
    chatJson,
    analysisModel: model,
  });
  normalized = reviewed.analysis;

  if (options.db) {
    options.db.insertAnalysis({
      candidateId: candidate?.id || normalized.id,
      tier: normalized.tier,
      payload: normalized,
      model: dbModelLabel({ offline, payload, analysisModel: model, audit: normalized._reviewAudit }),
      generatedAt: normalized.verifiedAt,
    });
  }

  return normalized;
}

async function reviewAndReviseAnalysis(analysis, {
  analystPayload,
  candidate,
  evidence,
  evaluation,
  options,
  ctx,
  offline,
  chatJson,
  analysisModel,
} = {}) {
  if (offline) {
    return {
      analysis: attachReviewAudit(analysis, offlineReviewAudit(options)),
    };
  }

  if (!analystPayload) {
    return {
      analysis: attachReviewAudit(analysis, downgradeAudit({
        model: reviewerModel(options),
        summary: "Analyst LLM did not produce a deep analysis payload.",
        issue: {
          field: "analystNotes",
          problem: "analyst LLM unavailable, so the normalized fallback must not be published as deep analysis",
          evidenceHint: "no analyst payload",
          requiredFix: "rerun with an available analyst LLM",
        },
      })),
    };
  }

  const firstReview = await runReviewPass(analysis, {
    candidate,
    evidence,
    evaluation,
    options,
    ctx,
    chatJson,
    attempt: 1,
  });

  if (firstReview.verdict !== "revise") {
    return { analysis: attachReviewAudit(analysis, firstReview) };
  }

  let revisedPayload = null;
  try {
    const analyst = chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx?.logger }).chatJson;
    revisedPayload = await analyst({
      system: revisionSystem(),
      user: revisionUser(candidate, evidence, evaluation, analysis, firstReview),
      model: analysisModel,
      maxTokens: maxTokens(options),
    });
  } catch (error) {
    ctx?.logger?.warn?.(`[papers:analyze] analyst revision failed for ${candidate?.id || "unknown"}: ${error.message}`);
    return {
      analysis: attachReviewAudit(analysis, downgradeAudit({
        model: firstReview.model || reviewerModel(options),
        summary: "Reviewer requested revision, but the analyst revision failed.",
        issue: {
          field: "analystNotes",
          problem: "reviewer issues were not resolved because analyst revision failed",
          evidenceHint: firstReview.summary || "reviewer requested revision",
          requiredFix: "rerun with analyst LLM available and review issues addressed",
        },
        prior: firstReview,
      })),
    };
  }

  const revised = normalizeAnalysis(revisedPayload, {
    candidate,
    evidence,
    evaluation,
    now: options.now,
  });
  const secondReview = await runReviewPass(revised, {
    candidate,
    evidence,
    evaluation,
    options,
    ctx,
    chatJson,
    attempt: 2,
  });

  if (secondReview.verdict === "revise") {
    return {
      analysis: attachReviewAudit(revised, downgradeAudit({
        model: secondReview.model || reviewerModel(options),
        summary: "Reviewer still requested revision after the one allowed analyst revision.",
        issue: {
          field: "analystNotes",
          problem: "one-revision budget exhausted",
          evidenceHint: secondReview.summary || "reviewer requested another revision",
          requiredFix: "exclude from deep until evidence and analysis can be rebuilt",
        },
        prior: secondReview,
      })),
    };
  }

  return {
    analysis: attachReviewAudit(revised, {
      ...secondReview,
      revisedOnce: true,
      prior: publicReviewAudit(firstReview),
    }),
  };
}

async function runReviewPass(analysis, {
  candidate,
  evidence,
  evaluation,
  options,
  ctx,
  chatJson,
  attempt,
} = {}) {
  const model = reviewerModel(options);
  try {
    const critic = chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx?.logger }).chatJson;
    const payload = await critic({
      system: reviewSystem(),
      user: reviewUser(candidate, evidence, evaluation, analysis),
      model,
      maxTokens: reviewMaxTokens(options),
    });
    return normalizeReviewAudit(payload, { model, attempt });
  } catch (error) {
    ctx?.logger?.warn?.(`[papers:reviewer] review failed for ${candidate?.id || "unknown"}: ${error.message}`);
    return downgradeAudit({
      model,
      summary: "Reviewer pass failed; deep analysis cannot be published without an independent audit.",
      issue: {
        field: "analystNotes",
        problem: "independent reviewer LLM failed",
        evidenceHint: error.message || "reviewer error",
        requiredFix: "rerun reviewer audit",
      },
      attempt,
    });
  }
}

function normalizeReviewAudit(payload, { model, attempt } = {}) {
  const verdict = normalizeReviewVerdict(payload?.verdict) || "downgrade";
  const issues = asArray(payload?.issues).map(normalizeReviewIssue).filter(Boolean);
  if (verdict !== "pass" && issues.length === 0) {
    issues.push({
      field: "analystNotes",
      problem: "reviewer did not provide concrete issues",
      evidenceHint: "missing reviewer issues",
      requiredFix: "rerun review with concrete grounding issues",
    });
  }
  return {
    verdict,
    issues,
    summary: cleanString(payload?.summary || reviewSummaryFallback(verdict, issues)),
    model: cleanString(model || "unknown-review-model"),
    reviewedAt: new Date().toISOString(),
    attempt: numberOr(attempt, 1),
  };
}

function normalizeReviewIssue(issue) {
  if (typeof issue === "string") {
    const problem = cleanString(issue);
    return problem ? { field: "analystNotes", problem, evidenceHint: "", requiredFix: "" } : null;
  }
  if (!issue || typeof issue !== "object") return null;
  const problem = cleanString(issue.problem || issue.message || issue.issue);
  if (!problem) return null;
  return {
    field: normalizeIssueField(issue.field),
    problem,
    evidenceHint: cleanString(issue.evidenceHint || issue.evidence || issue.section || ""),
    requiredFix: cleanString(issue.requiredFix || issue.fix || issue.action || ""),
  };
}

function normalizeIssueField(value) {
  const field = cleanString(value);
  return ["leadJudgment", "originalReading", "analystNotes", "limitsAndFuture", "keyResults", "meta"].includes(field)
    ? field
    : "analystNotes";
}

function normalizeReviewVerdict(value) {
  const verdict = cleanString(value).toLowerCase();
  return ["pass", "revise", "downgrade"].includes(verdict) ? verdict : "";
}

function offlineReviewAudit(options = {}) {
  return {
    verdict: "pass",
    issues: [],
    summary: "Offline reviewer stub: fixture/cached path only; PM should use this to verify wiring, not content depth.",
    model: cleanString(options.papersReviewModel || process.env.PAPERS_REVIEW_MODEL || "offline-papers-reviewer"),
    reviewedAt: options.now?.() || new Date().toISOString(),
    attempt: 0,
    offline: true,
  };
}

function downgradeAudit({ model, summary, issue, prior, attempt } = {}) {
  return {
    verdict: "downgrade",
    issues: [issue, ...asArray(prior?.issues)].map(normalizeReviewIssue).filter(Boolean),
    summary: cleanString(summary || "Reviewer downgraded this item out of deep publication."),
    model: cleanString(model || "unknown-review-model"),
    reviewedAt: new Date().toISOString(),
    attempt: numberOr(attempt, prior?.attempt || 1),
    ...(prior ? { prior: publicReviewAudit(prior) } : {}),
  };
}

function publicReviewAudit(audit = {}) {
  const out = {
    verdict: normalizeReviewVerdict(audit.verdict) || "downgrade",
    issues: asArray(audit.issues).map(normalizeReviewIssue).filter(Boolean),
    summary: cleanString(audit.summary),
    model: cleanString(audit.model),
    reviewedAt: cleanString(audit.reviewedAt),
    attempt: numberOr(audit.attempt, 1),
  };
  if (audit.revisedOnce) out.revisedOnce = true;
  if (audit.offline) out.offline = true;
  if (audit.prior) out.prior = publicReviewAudit(audit.prior);
  return out;
}

function attachReviewAudit(analysis, audit) {
  return {
    ...analysis,
    _reviewAudit: publicReviewAudit(audit),
  };
}

function reviewSummaryFallback(verdict, issues) {
  if (verdict === "pass") return "Reviewer passed grounding, depth, and non-filler checks.";
  return issues[0]?.problem || "Reviewer found grounding or depth issues.";
}

function dbModelLabel({ offline, payload, analysisModel, audit } = {}) {
  const reviewer = audit?.model || (offline ? "offline-papers-reviewer" : reviewerModel());
  if (offline) return `offline-papers-deep+review:${reviewer}`;
  if (!payload) return `${analysisModel || "unknown-analyst"}+review:${reviewer}:downgrade`;
  return `${analysisModel || "unknown-analyst"}+review:${reviewer}`;
}

export function normalizeAnalysis(payload, opts = {}) {
  const candidate = opts.candidate || {};
  const raw = candidate.raw || candidate || {};
  const evidence = opts.evidence || {};
  const evaluation = opts.evaluation || {};
  const verifiedAt = nowIso(opts);
  const evidenceText = cleanString(evidence.content);
  const sourceUrl = cleanString(raw.sourceUrl || raw.paperUrl || payload?.sourceUrl || payload?.provenance?.sourceUrl);
  const title = cleanString(raw.title || payload?.title || "Untitled paper");
  const fallback = offlineFallback({ raw, evidence });

  const originalReading = normalizeOriginalReading(payload?.originalReading || payload?.sections, evidenceText);
  const out = {
    id: cleanString(candidate.id || raw.id || idFromTitle(title)),
    title,
    authors: authorsString(raw.authors || payload?.authors),
    venue: cleanString(raw.venue || payload?.venue || "Venue not provided"),
    sourceName: cleanString(raw.sourceName || raw.source || payload?.sourceName || "papers"),
    sourceUrl,
    verifiedAt,
    tier: "deep",
    leadJudgment: cleanPublicString(payload?.leadJudgment || fallback.leadJudgment),
    meta: normalizeMeta(payload?.meta, payload, { raw, evidence, originalReading }),
    originalReading: originalReading.length ? originalReading : fallback.originalReading,
    analystNotes: normalizeAnalystNotes(payload?.analystNotes, { raw, fallback }),
    limitsAndFuture: normalizeLimits(payload?.limitsAndFuture, fallback.limitsAndFuture),
    selection: normalizeSelection(payload?.selection, evaluation, raw),
    selectionAudit: buildSelectionAudit({ payload: payload?.selectionAudit, evaluation, raw, evidence }),
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

// ---- Stage 1 · originalReading -------------------------------------------------

function normalizeOriginalReading(value, evidenceText) {
  let budget = MAX_KEY_RESULTS;
  const sections = asArray(value)
    .map((item) => {
      const heading = cleanPublicString(item?.heading || item?.title || "");
      const summary = cleanPublicString(item?.summary || item?.body || (typeof item === "string" ? item : ""));
      if (!heading || !summary) return null;
      const section = { heading, summary };
      const keyResults = normalizeKeyResults(item?.keyResults, evidenceText, budget);
      if (keyResults.length) {
        section.keyResults = keyResults;
        budget -= keyResults.length;
      }
      return section;
    })
    .filter(Boolean);
  return sections;
}

function normalizeKeyResults(value, evidenceText, budget) {
  if (budget <= 0) return [];
  const out = [];
  for (const item of asArray(value)) {
    if (out.length >= budget) break;
    const ref = cleanPublicString(item?.ref || item?.label);
    const finding = cleanPublicString(item?.finding || item?.value || item?.result);
    if (!ref || !finding) continue;
    if (hasNumber(finding) && !metricValueSupported(finding, evidenceText)) continue; // RULES §6: no invented numbers
    out.push({ kind: normalizeKeyResultKind(item?.kind), ref, finding });
  }
  return out;
}

function normalizeKeyResultKind(value) {
  const kind = cleanString(value).toLowerCase();
  if (KEY_RESULT_KINDS.has(kind)) return kind;
  if (/fig/i.test(kind)) return "figure";
  if (/tab/i.test(kind)) return "table";
  return "result";
}

// ---- Stage 2 · analystNotes ----------------------------------------------------

function normalizeAnalystNotes(value, { raw = {}, fallback = {} } = {}) {
  const text = cleanMarkdown(value);
  if (text) return text;
  return fallback.analystNotes
    || `根据已收集的证据，《${cleanString(raw.title) || "该论文"}》的正文细节不足以展开深度点评；本轮只能基于已抓取的内容保留客观脉络，待补全证据后再补充批判性分析。`;
}

// ---- meta ----------------------------------------------------------------------

function normalizeMeta(metaValue, payload, context = {}) {
  const meta = metaValue && typeof metaValue === "object" && !Array.isArray(metaValue) ? metaValue : {};
  return {
    paperType: normalizePaperType(meta.paperType ?? payload?.paperType, context),
    venueStatus: normalizeVenueStatus(meta.venueStatus ?? payload?.venueStatus, context.raw),
    sourceReliability: normalizeSourceReliability(meta.sourceReliability, context),
    tags: normalizeStringArray(meta.tags || payload?.tags || context.raw?.tags).slice(0, 8),
  };
}

function normalizeSourceReliability(value, { raw = {} } = {}) {
  const reliability = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const discoverySource = cleanString(reliability.discoverySource || raw.sourceName || raw.source || "unknown discovery source") || "unknown discovery source";
  return {
    discoverySource,
    primarySourceVerified: Boolean(reliability.primarySourceVerified),
    paperHtmlFetched: Boolean(reliability.paperHtmlFetched),
    pdfFetched: Boolean(reliability.pdfFetched),
    repoFetched: Boolean(reliability.repoFetched),
    appendixFetched: Boolean(reliability.appendixFetched),
  };
}

function normalizePaperType(value, context = {}) {
  const explicit = cleanString(value);
  if (PAPER_TYPES.has(explicit)) return explicit;
  const text = textParts([
    context.raw?.title,
    context.raw?.abstract,
    context.raw?.venue,
    context.raw?.tags,
    context.raw?.focusTopics,
    context.evidence?.sections,
    String(context.evidence?.content || "").slice(0, 16000),
    context.originalReading,
  ]).join("\n");
  if (/\b(systematic review|survey|review paper|literature review)\b/i.test(text)) return "survey";
  if (/\b(position paper|roadmap|agenda|vision paper|perspective)\b/i.test(text)) return "position_roadmap";
  if (/\b(theorem|proof|theoretical|theory|formal analysis)\b/i.test(text)) return "theory";
  if (/\b(dataset|corpus|data collection|data release)\b/i.test(text)) return "dataset";
  if (/\b(benchmark|leaderboard|evaluation suite|eval suite|testbed|challenge set)\b/i.test(text)) return "benchmark";
  if (/\b(audit|red[- ]team|evaluation audit|benchmark audit|failure analysis)\b/i.test(text)) return "evaluation_audit";
  if (/\b(industry|production case|case study|deployed|real[- ]world deployment|customer deployment)\b/i.test(text)) return "industry_case";
  if (/\b(toolkit|library|tooling|plugin|workbench|framework|SDK|API tool)\b/i.test(text)) return "tooling";
  return "system";
}

function normalizeVenueStatus(value, raw = {}) {
  const explicit = cleanString(value);
  if (VENUE_STATUSES.has(explicit)) return explicit;
  const venue = cleanString(raw.venue);
  if (!venue || /venue not provided|not provided|unknown/i.test(venue)) return "not_provided";
  const sourceText = `${raw.sourceName || ""} ${raw.source || ""} ${asArray(raw.sourceSignals).join(" ")} ${venue}`;
  if (/\b(arXiv|preprint|under review|submitted|withdrawn|openreview.*under review)\b/i.test(sourceText)) return "unverified";
  if (/\b(ICLR|ICML|NeurIPS|ACL|EMNLP|NAACL|CVPR|ICCV|ECCV|AAAI|TMLR|JMLR|OpenReview|ACL Anthology|CVF|Proceedings|PMLR|ACM|IEEE)\b/i.test(sourceText)) return "verified";
  return "unverified";
}

// ---- selectionAudit ------------------------------------------------------------

function buildSelectionAudit({ payload = {}, evaluation = {}, raw = {}, evidence = {} } = {}) {
  const audit = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const selectionScore = clampScore(evaluation?.score ?? audit.selectionScore ?? 0);
  const convergence = asArray(evaluation?.selection?.convergence || raw.sourceSignals);
  const discoverySource = cleanString(raw.sourceName || raw.source || "unknown discovery source") || "unknown discovery source";
  const primaryEvidenceSource = primaryEvidenceSourceFor(evidence, raw, discoverySource);
  return {
    candidateCount: numberOr(audit.candidateCount, 0),
    selectedCount: numberOr(audit.selectedCount, 0),
    selectionScore,
    selectedReason: cleanString(audit.selectedReason || evaluation?.reason || "selected by academic selection gate"),
    rejectedReasonIfAny: cleanString(audit.rejectedReasonIfAny || ""),
    weightedFactors: {
      venuePrestige: venuePrestigeScore(raw, evaluation),
      citationConvergence: clampScore(Math.min(100, convergence.filter(Boolean).length * 34)),
      novelty: selectionScore,
      recency: recencyScore(raw),
      // backfilled post-deep (CONTEXT 合成方式 A)
      evidenceStrength: "unknown",
      reproducibility: "unknown",
    },
    discoverySource,
    primaryEvidenceSource,
  };
}

function primaryEvidenceSourceFor(evidence = {}, raw = {}, discoverySource = "") {
  const kind = cleanString(evidence.kind);
  const host = hostOf(raw.sourceUrl || raw.paperUrl);
  const label = host ? `paper full text (${host})` : kind ? `paper ${kind}` : "fetched paper full text";
  // discoverySource must differ from primaryEvidenceSource (hard lint rule); keep them distinct.
  return label.toLowerCase() === cleanString(discoverySource).toLowerCase() ? `${label} (primary source)` : label;
}

function venuePrestigeScore(raw = {}, evaluation = {}) {
  const text = `${raw.source || ""} ${raw.sourceName || ""} ${asArray(raw.sourceSignals).join(" ")} ${raw.venue || ""} ${asArray(evaluation?.signals).join(" ")}`;
  let score = 0;
  if (/AI Best Paper|best paper|Outstanding Paper|最佳论文|杰出论文|spotlight|oral/i.test(text)) score += 40;
  if (/OpenReview|ICLR|ICML|NeurIPS/i.test(text)) score += 30;
  if (/ACL Anthology|CVF|CVPR|ICCV|EMNLP|NAACL|TMLR|JMLR/i.test(text)) score += 22;
  if (/OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA/i.test(text)) score += 20;
  if (/Datawhale|科鲸|机器之心|Jiqizhixin|Synced/i.test(text)) score += 14;
  if (/Hugging Face|Papers with Code/i.test(text)) score += 10;
  if (/priority:best_paper/i.test(text)) score += 20;
  return clampScore(score);
}

function recencyScore(raw = {}) {
  const parsed = Date.parse(raw.updatedAt || raw.publishedAt || raw.discoveredAt || "");
  if (!Number.isFinite(parsed)) return 0;
  const days = Math.max(0, (Date.now() - parsed) / 86400000);
  if (days <= 14) return 100;
  if (days <= 60) return 80;
  if (days <= 180) return 55;
  if (days <= 365) return 30;
  return 10;
}

// Post-deep backfill (called by publish): fill evidenceStrength/reproducibility from
// objective cues in the produced analysis. CONTEXT 合成方式 A.
export function backfillSelectionAudit(analysis, { candidateCount, selectedCount } = {}) {
  if (!analysis || typeof analysis !== "object") return analysis;
  const audit = analysis.selectionAudit && typeof analysis.selectionAudit === "object" ? analysis.selectionAudit : {};
  const factors = audit.weightedFactors && typeof audit.weightedFactors === "object" ? audit.weightedFactors : {};
  const reading = asArray(analysis.originalReading);
  const keyResultCount = reading.reduce((sum, section) => sum + asArray(section.keyResults).length, 0);
  const numericFindings = reading.reduce((sum, section) => sum + asArray(section.keyResults).filter((k) => hasNumber(k.finding)).length, 0);
  const blob = JSON.stringify({ reading, limits: analysis.limitsAndFuture, tags: analysis.meta?.tags });
  const reproCue = /github|gitlab|huggingface|open[- ]?source|代码|开源|repository|repo\b|dataset|数据集/i.test(blob);

  factors.evidenceStrength = clampScore(numericFindings * 22 + keyResultCount * 6 + (analysis.meta?.venueStatus === "verified" ? 16 : 0));
  factors.reproducibility = reproCue ? clampScore(45 + Math.min(numericFindings, 3) * 12) : 15;

  analysis.selectionAudit = {
    ...audit,
    candidateCount: Number.isFinite(candidateCount) ? candidateCount : numberOr(audit.candidateCount, 0),
    selectedCount: Number.isFinite(selectedCount) ? selectedCount : numberOr(audit.selectedCount, 0),
    weightedFactors: factors,
  };
  return analysis;
}

// ---- shared sub-normalizers ----------------------------------------------------

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

function offlineFallback({ raw = {}, evidence = {} }) {
  const evidenceText = cleanString(evidence.content);
  const sectionList = normalizeStringArray(evidence.sections);
  const summary = evidenceText
    ? firstChars(evidenceText, 360)
    : sectionList.length
      ? `当前证据只列出论文版块：${sectionList.join("、")}。`
      : "当前离线证据只包含论文元数据，暂不能展开正文细节。";
  return {
    leadJudgment: raw.title
      ? `离线模式下只根据已收集证据保留《${cleanString(raw.title)}》的基础脉络。`
      : "离线模式下只根据已收集证据保留论文的基础脉络。",
    originalReading: [{ heading: "摘要", summary }],
    analystNotes: evidenceText
      ? "离线模式：本轮只抓到论文文本摘要，未做联网核验，暂不展开批判性分析；以上原文部分仅供先行阅读。"
      : "离线模式：论文证据未提供正文或摘要，无法展开深度分析。",
    limitsAndFuture: {
      paperStated: "论文证据未提供限制或未来工作段落。",
      evidenceNotes: evidenceText
        ? "当前分析受限于已收集 evidence.content，未使用证据外信息。"
        : "当前证据不足以判断实验范围、样本范围或外推边界。",
    },
  };
}

// ---- text helpers --------------------------------------------------------------

function textParts(value, out = []) {
  if (typeof value === "string" || typeof value === "number") {
    out.push(String(value));
  } else if (Array.isArray(value)) {
    for (const item of value) textParts(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) textParts(item, out);
  }
  return out;
}

function metricValueSupported(value, evidenceText) {
  const numbers = String(value || "").match(/\d+(?:\.\d+)?%?/g) || [];
  if (numbers.length === 0) return true;
  const haystack = cleanString(evidenceText).replace(/,/g, "");
  return numbers.some((number) => haystack.includes(number.replace(/,/g, "")));
}

function hasNumber(value) {
  return /\d/.test(String(value || ""));
}

function cleanMarkdown(value) {
  // analystNotes keeps markdown structure; only strip control chars + collapse blank runs.
  const text = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text || hasBadTextMarker(text)) return "";
  return text;
}

function cleanCompletePublicString(value, { max = 500 } = {}) {
  const text = cleanPublicString(value);
  if (!text || hasBadTextMarker(text)) return "";
  const bounded = trimToCompleteText(text, max);
  if (!bounded || looksCutOff(bounded)) return "";
  return bounded;
}

function trimToCompleteText(text, max) {
  const value = cleanString(text);
  if (value.length <= max) return value;
  const clipped = value.slice(0, max + 1);
  const boundary = lastCompleteBoundary(clipped);
  return boundary >= Math.max(80, Math.floor(max * 0.45)) ? clipped.slice(0, boundary + 1).trim() : "";
}

function lastCompleteBoundary(text) {
  return Math.max(
    text.lastIndexOf("."),
    text.lastIndexOf("!"),
    text.lastIndexOf("?"),
    text.lastIndexOf("。"),
    text.lastIndexOf("！"),
    text.lastIndexOf("？"),
  );
}

function looksCutOff(value) {
  const text = cleanString(value);
  return /(?:\.\.\.|…)$/.test(text)
    || /[,;:([{]$/.test(text)
    || /\b(?:and|or|of|for|to|with|without|that|which|because|while|where|via|using|including|such as|the|a|an)$/i.test(text);
}

function hasBadTextMarker(value) {
  return /�|\[占位\]|\b(?:TODO|TBD)\b/i.test(String(value || ""));
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

function hostOf(value) {
  try {
    return new URL(cleanString(value)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function firstChars(value, limit) {
  const text = cleanString(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function idFromTitle(title) {
  return cleanString(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "paper-analysis";
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function paperModel(options = {}, env = process.env) {
  return options.papersDeepModel || env.PAPERS_DEEP_MODEL || env.DEEPSEEK_PRO_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-pro";
}

function reviewerModel(options = {}, env = process.env) {
  return options.papersReviewModel || env.PAPERS_REVIEW_MODEL || paperModel(options, env);
}

export function maxTokens(options = {}, env = process.env) {
  // Higher budget so dense, section-by-section translations are not truncated (model has 64K ctx).
  return numberOr(options.paperDeepMaxTokens, Number(env.PAPERS_DEEP_MAX_TOKENS) || 16000);
}

function reviewMaxTokens(options = {}, env = process.env) {
  return numberOr(options.paperReviewMaxTokens, Number(env.PAPERS_REVIEW_MAX_TOKENS) || 2400);
}

function isOffline(options = {}, env = process.env) {
  return Boolean(options.noLlm || options.dryRun || env.NO_LLM === "1" || env.AI_BRIEF_OFFLINE === "1");
}

function nowIso(opts = {}) {
  return opts.now?.() || new Date().toISOString();
}
