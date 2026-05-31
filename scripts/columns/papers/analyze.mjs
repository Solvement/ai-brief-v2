import { createDeepSeekClient } from "../../lib/llm.mjs";
import { analysisSystem, analysisUser } from "./prompts.mjs";

const FDE_SIGNAL_RULES = [
  { label: "customer/production system", patterns: [/\bcustomer\b/i, /\benterprise\b/i, /\bproduction\b/i, /\breal[- ]world\b/i, /\bdeployed\b/i, /\bdeployment\b/i, /\bservice\b/i] },
  { label: "API/tool/MCP integration", patterns: [/\bAPI\b/i, /\bSDK\b/i, /\bendpoint\b/i, /\bwebhook\b/i, /\bconnector\b/i, /\bintegration\b/i, /\btool[- ]?use\b/i, /\bfunction calling\b/i, /\btool calling\b/i, /\bMCP\b/i] },
  { label: "workflow readiness", patterns: [/\bworkflow\b/i, /\bbusiness process\b/i, /\bhuman[- ]in[- ]the[- ]loop\b/i, /\bhandoff\b/i, /\borchestrat/i] },
  { label: "RAG/knowledge system", patterns: [/\bRAG\b/i, /\bretrieval[- ]augmented\b/i, /\bretriev/i, /\bknowledge base\b/i, /\bmemory\b/i, /\bGraphRAG\b/i] },
  { label: "evaluation/reliability gate", patterns: [/\beval(?:uation)? harness\b/i, /\bregression (?:test|gate)\b/i, /\bfailure modes?\b/i, /\breliability\b/i, /\bbenchmark(?:ing)? framework\b/i] },
  { label: "observability/debugging", patterns: [/\bobservability\b/i, /\bmonitoring\b/i, /\blog(?:ging|s)?\b/i, /\btrace(?:s|ability)?\b/i, /\bexecution trace\b/i, /\bdebugg/i] },
  { label: "deployment/runbook", patterns: [/\bdeploy(?:ment|ed)?\b/i, /\brollout\b/i, /\brollback\b/i, /\brunbook\b/i, /\binfrastructure\b/i, /\blatency\b/i, /\bcost\b/i] },
  { label: "governance/permissions", patterns: [/\bgovernance\b/i, /\bpermission(?:s)?\b/i, /\bauth(?:entication|orization)?\b/i, /\bRBAC\b/i, /\bPII\b/i, /\bprivacy\b/i, /\bsecurity\b/i, /\bcompliance\b/i, /\baudit trail\b/i] },
  { label: "artifact-level diagnosis", patterns: [/\bcodebase\b/i, /\brepositor(?:y|ies)\b/i, /\bwebsite\b/i, /\bsite audit\b/i, /\bcustomer data\b/i, /\bdata schema\b/i, /\bdata pipeline\b/i, /\bdata quality\b/i, /\bdatabase\b/i, /\bwarehouse\b/i, /\bticket(?:s)?\b/i, /\banalytics\b/i, /\bartifact(?:s)?\b/i] },
];

const PURE_ALGORITHM_ONLY_PATTERNS = [
  /\bscaling law\b/i,
  /\bmodel scaling\b/i,
  /\bpre[- ]?training\b/i,
  /\btraining recipe\b/i,
  /\boptimizer\b/i,
  /\bloss function\b/i,
  /\battention kernel\b/i,
  /\bsparse attention\b/i,
  /\bMoE routing\b/i,
  /\btokenizer\b/i,
  /\bparameter count\b/i,
  /\bleaderboard[- ]only\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\bSOTA\b/i,
];

const SCORECARD_DIMENSIONS = [
  "FDE相关性",
  "工程现实感",
  "问题重要性",
  "方法新颖性",
  "证据强度",
  "可复现性",
  "可部署性",
  "安全治理意识",
  "ROI可解释性",
  "职业训练价值",
];

const PAPER_TYPES = new Set(["survey", "theory", "system", "benchmark", "dataset", "industry_case", "evaluation_audit", "tooling", "position_roadmap"]);
const VENUE_STATUSES = new Set(["verified", "unverified", "not_provided"]);
const READ_DECISIONS = new Set(["must_read", "read", "skim", "watch", "skip"]);
const FDE_FITS = new Set(["high", "medium", "low"]);
const VERDICT_EVIDENCE_STRENGTHS = new Set(["strong", "medium", "weak"]);
const ARTIFACT_STATUSES = new Set(["official", "partial", "third_party_only", "none"]);
const CLAIM_TYPES = new Set(["theoretical", "empirical", "engineering", "fde_extrapolation"]);
const CLAIM_EVIDENCE_STRENGTHS = new Set(["high", "medium", "low"]);
const EXACTNESS_VALUES = new Set(["exact", "estimated_from_figure", "author_claim"]);
const OFFICIAL_CODE_STATUSES = new Set(["verified", "not_found", "partial", "third_party_only"]);
const DATA_STATUSES = new Set(["available", "not_found", "restricted", "not_applicable"]);
const REPRODUCIBILITY_STATUSES = new Set(["full", "partial", "artifact_light", "paper_only", "third_party_only"]);
const NOT_SPECIFIED_POINTER = "not specified in fetched text";
const FDE_TAG_RE = /^\[(?:论文支持|推论|待验证假设|面试故事|paper[- ]supported|inference|validation[- ]hypothesis|interview[- ]story)\]\s*/i;

const SCORECARD_DIMENSION_ALIASES = new Map([
  ["fde相关性", "FDE相关性"],
  ["fde relevance", "FDE相关性"],
  ["工程现实感", "工程现实感"],
  ["engineering realism", "工程现实感"],
  ["问题重要性", "问题重要性"],
  ["problem importance", "问题重要性"],
  ["方法新颖性", "方法新颖性"],
  ["算法新颖性", "方法新颖性"],
  ["method novelty", "方法新颖性"],
  ["证据强度", "证据强度"],
  ["实验强度", "证据强度"],
  ["evidence strength", "证据强度"],
  ["可复现性", "可复现性"],
  ["reproducibility", "可复现性"],
  ["可部署性", "可部署性"],
  ["deployability", "可部署性"],
  ["安全治理意识", "安全治理意识"],
  ["security governance", "安全治理意识"],
  ["roi可解释性", "ROI可解释性"],
  ["roi explainability", "ROI可解释性"],
  ["职业训练价值", "职业训练价值"],
  ["career training value", "职业训练价值"],
]);

const HARD_SYSTEM_SIGNALS = new Set([
  "customer/production system",
  "API/tool/MCP integration",
  "workflow readiness",
  "observability/debugging",
  "deployment/runbook",
  "governance/permissions",
  "artifact-level diagnosis",
]);

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
  out.paperType = normalizePaperType(payload?.paperType, { raw, evidence, sections: out.sections, payload });
  out.venueStatus = normalizeVenueStatus(payload?.venueStatus, raw);
  if (tier === "deep") {
    out.deepDive = normalizeDeepDive(payload?.deepDive, {
      evidence,
      externalAudit: opts.externalAudit,
      fallback,
      sections: out.sections,
      candidate: raw,
      evaluation: opts.evaluation,
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
  const byDimension = new Map();
  for (const item of asArray(value)) {
    const dimension = canonicalScorecardDimension(item?.dimension);
    const score = Number(item?.score);
    const reason = normalizeScorecardReason(item?.reason);
    if (!dimension || !Number.isFinite(score) || !reason) continue;
    if (!byDimension.has(dimension)) {
      byDimension.set(dimension, {
        dimension,
        score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
        reason,
      });
    }
  }
  return SCORECARD_DIMENSIONS
    .map((dimension) => byDimension.get(dimension))
    .filter(Boolean);
}

function normalizeScorecardReason(value) {
  const reason = cleanCompletePublicString(value, { max: 520 });
  if (!reason) return "";
  if (/\bnot higher\b|\bnot a higher\b|ä¸æ˜¯æ›´é«˜|ä¸ºä»€ä¹ˆä¸æ˜¯æ›´é«˜|ä¸ç»™æ›´é«˜|æœªç»™æ›´é«˜/i.test(reason)) return reason;
  return `${reason} Not higher because the collected evidence still leaves at least one artifact, reproducibility, deployment, or generalization gap for this dimension.`;
}

function canonicalScorecardDimension(value) {
  const dimension = cleanPublicString(value);
  if (!dimension) return "";
  if (SCORECARD_DIMENSIONS.includes(dimension)) return dimension;
  const key = dimension.toLowerCase().replace(/\s+/g, " ").trim();
  return SCORECARD_DIMENSION_ALIASES.get(key) || "";
}

function normalizeDeepDive(value, { evidence = {}, externalAudit = [], fallback = {}, sections = [], candidate = {}, evaluation = {} } = {}) {
  const source = value || {};
  const evidenceText = cleanString(evidence.content);
  const audit = normalizeAudit([...asArray(source.audit), ...asArray(externalAudit)]);
  const pointerText = textParts([evidenceText, audit, source.audit, source.artifactAudit]).join("\n");
  const contributionLayers = normalizeContributionLayers(source.contributionLayers);
  const evidenceChain = normalizeEvidenceChain(source.evidenceChain, evidenceText);
  const limitations = ensureReproducibilityLimitation(
    normalizeNarrativeArray(source.limitations),
    audit,
    fallback.limitsAndFuture,
  );
  const out = {
    reframe: cleanPublicString(source.reframe) || "Collected evidence is not sufficient to reframe the paper beyond its metadata and abstract.",
    contributionLayers,
    mechanism: cleanPublicString(source.mechanism) || "Collected evidence did not provide enough mechanism detail for a reviewer-style mechanism judgment.",
    evidenceChain,
    audit,
    loadBearingClaim: cleanPublicString(source.loadBearingClaim || firstPresent(sections.map((section) => section.loadBearing))) || "No load-bearing claim was identified from the collected evidence.",
    strongestEvidence: normalizeStringArray(source.strongestEvidence),
    limitations,
    suggestedExperiments: normalizeStringArray(source.suggestedExperiments),
  };
  out.artifactAudit = normalizeArtifactAudit(source.artifactAudit, { audit, evidenceText, candidate, source });
  out.claimLedger = normalizeClaimLedger(source.claimLedger, {
    contributionLayers,
    evidenceText: pointerText,
    source,
  });
  out.evidenceMatrix = normalizeEvidenceMatrix(source.evidenceMatrix, { evidenceChain, evidenceText });
  out.whatWouldInvalidate = normalizeWhatWouldInvalidate(source.whatWouldInvalidate, out);
  out.verdict = normalizeVerdict(source.verdict, {
    artifactAudit: out.artifactAudit,
    claimLedger: out.claimLedger,
    evidenceMatrix: out.evidenceMatrix,
    evidenceText,
    candidate,
    evaluation,
    source,
    reframe: out.reframe,
    loadBearingClaim: out.loadBearingClaim,
  });
  const fdeTakeaways = normalizeFdeTakeaways(source.fdeTakeaways, { candidate, evidence, evaluation, sections, source });
  if (fdeTakeaways) out.fdeTakeaways = fdeTakeaways;
  return out;
}

function normalizeVerdict(value, context = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const fdeFit = enumValue(source.fdeFit, FDE_FITS, inferFdeFit(context));
  const evidenceStrength = enumValue(source.evidenceStrength, VERDICT_EVIDENCE_STRENGTHS, inferVerdictEvidenceStrength(context));
  const artifactStatus = enumValue(source.artifactStatus, ARTIFACT_STATUSES, artifactStatusFromAudit(context.artifactAudit));
  const readDecision = enumValue(source.readDecision, READ_DECISIONS, inferReadDecision({ ...context, fdeFit, evidenceStrength, artifactStatus }));
  const oneLineJudgment = cleanCompletePublicString(source.oneLineJudgment, { max: 300 })
    || cleanCompletePublicString(context.reframe, { max: 300 })
    || "The collected evidence supports only a bounded reviewer judgment, not a broad paper verdict.";
  const whyNow = normalizeNarrativeArray(source.whyNow).slice(0, 5);
  const whyNotOverclaim = normalizeNarrativeArray(source.whyNotOverclaim).slice(0, 5);
  return {
    readDecision,
    fdeFit,
    evidenceStrength,
    artifactStatus,
    oneLineJudgment,
    whyNow: whyNow.length ? whyNow : fallbackWhyNow(context),
    whyNotOverclaim: whyNotOverclaim.length ? whyNotOverclaim : fallbackWhyNotOverclaim(context),
  };
}

function normalizeClaimLedger(value, { contributionLayers = [], evidenceText = "", source = {} } = {}) {
  const provided = asArray(value)
    .map((item) => normalizeClaimLedgerItem(item, evidenceText))
    .filter(Boolean);
  const rows = provided.length ? provided : fallbackClaimLedger({ contributionLayers, evidenceText, source });
  return uniqueObjectsBy(rows, (item) => `${item.claimType}\n${item.claim}`.toLowerCase()).slice(0, 12);
}

function normalizeClaimLedgerItem(item, evidenceText) {
  const claim = cleanCompletePublicString(item?.claim, { max: 520 });
  if (!claim) return null;
  const claimType = enumValue(item?.claimType, CLAIM_TYPES, inferClaimType(`${claim} ${item?.evidencePointer || ""}`));
  const evidencePointer = normalizeEvidencePointer(item?.evidencePointer || item?.sourcePointer || item?.pointer, evidenceText);
  const evidenceStrength = normalizeClaimEvidenceStrength(item?.evidenceStrength);
  const threat = cleanCompletePublicString(item?.threat, { max: 420 })
    || "The fetched text does not close all validity, generalization, or artifact risks for this claim.";
  const fdeTransfer = cleanCompletePublicString(item?.fdeTransfer || item?.fdeMeaning || item?.transfer, { max: 420 })
    || (claimType === "fde_extrapolation"
      ? "Treat this as an FDE extrapolation until validated on a customer workflow."
      : "FDE transfer is limited to the scope directly supported by the cited paper evidence.");
  return { claim, claimType, evidencePointer, evidenceStrength, threat, fdeTransfer };
}

function fallbackClaimLedger({ contributionLayers = [], evidenceText = "", source = {} } = {}) {
  const rows = [];
  for (const layer of contributionLayers.slice(0, 4)) {
    const evidencePointer = normalizeEvidencePointer(pointerFromText(`${layer.layer} ${layer.evidence}`), evidenceText);
    rows.push({
      claim: layer.claim,
      claimType: inferClaimType(`${layer.layer} ${layer.claim} ${layer.evidence}`),
      evidencePointer,
      evidenceStrength: claimStrengthFromText(layer.evidence),
      threat: layer.judgment || "The contribution layer is not enough to establish external validity by itself.",
      fdeTransfer: layer.fdeMeaning || "No direct FDE transfer was established by the fetched text.",
    });
    if (layer.fdeMeaning && !/è®ºæ–‡è¯æ®æœªæ˜¾ç¤º|not specified/i.test(layer.fdeMeaning)) {
      rows.push({
        claim: `FDE extrapolation: ${layer.fdeMeaning}`,
        claimType: "fde_extrapolation",
        evidencePointer,
        evidenceStrength: "low",
        threat: "This is an FDE transfer hypothesis, not a result the paper proved.",
        fdeTransfer: layer.fdeMeaning,
      });
    }
  }
  const loadBearing = cleanCompletePublicString(source.loadBearingClaim, { max: 520 });
  if (rows.length === 0 && loadBearing) {
    rows.push({
      claim: loadBearing,
      claimType: inferClaimType(loadBearing),
      evidencePointer: NOT_SPECIFIED_POINTER,
      evidenceStrength: "low",
      threat: "No section, figure, table, appendix, or repo pointer was provided in the fetched text.",
      fdeTransfer: "Use only as a reading hypothesis until a cited evidence location supports it.",
    });
  }
  return rows;
}

function normalizeEvidenceMatrix(value, { evidenceChain = [], evidenceText = "" } = {}) {
  const provided = asArray(value)
    .map((item) => normalizeEvidenceMatrixItem(item, evidenceText))
    .filter(Boolean);
  if (provided.length) return provided.slice(0, 12);
  return fallbackEvidenceMatrix(evidenceChain).slice(0, 12);
}

function normalizeEvidenceMatrixItem(item, evidenceText) {
  const experiment = cleanCompletePublicString(item?.experiment, { max: 360 });
  const metric = cleanCompletePublicString(item?.metric, { max: 220 });
  const result = cleanCompletePublicString(item?.result, { max: 260 });
  const limitation = cleanCompletePublicString(item?.limitation, { max: 360 })
    || "The fetched text does not specify all sampling, baseline, or reproduction limits.";
  if (!experiment || !metric || !result) return null;
  if (hasNumber(result) && !metricValueSupported(result, evidenceText)) return null;
  const row = {
    experiment,
    metric,
    result,
    exactness: normalizeExactness(item?.exactness),
    limitation,
  };
  const sampleSize = cleanCompletePublicString(item?.sampleSize, { max: 120 });
  const modelBackend = cleanCompletePublicString(item?.modelBackend, { max: 160 });
  if (sampleSize) row.sampleSize = sampleSize;
  if (modelBackend) row.modelBackend = modelBackend;
  return row;
}

function fallbackEvidenceMatrix(evidenceChain = []) {
  const rows = [];
  for (const item of evidenceChain) {
    for (const metric of item.metrics || []) {
      rows.push({
        experiment: item.component,
        metric: metric.label,
        result: metric.value,
        exactness: "exact",
        limitation: metric.note || item.reviewerNote || "No separate limitation was specified for this metric.",
      });
    }
  }
  return rows;
}

function normalizeArtifactAudit(value, { audit = [], evidenceText = "", candidate = {}, source = {} } = {}) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const auditText = textParts([evidenceText, audit, raw, source.audit]).join("\n");
  const officialCue = hasOfficialCodeReleaseCue(auditText);
  const thirdPartyCue = hasThirdPartyCodeCue(auditText);
  const reachableRepo = hasReachableRepoAudit(audit);
  let officialCode = enumValue(raw.officialCode, OFFICIAL_CODE_STATUSES, "");
  if (officialCode === "verified" && !officialCue) {
    officialCode = thirdPartyCue || reachableRepo ? "third_party_only" : "not_found";
  }
  if (!officialCode) officialCode = inferOfficialCodeStatus({ audit, auditText, officialCue, thirdPartyCue, reachableRepo });
  const data = enumValue(raw.data, DATA_STATUSES, inferDataStatus(auditText, candidate));
  const repoStatus = cleanCompletePublicString(raw.repoStatus, { max: 420 }) || repoStatusFromAudit(audit);
  let reproducibility = enumValue(raw.reproducibility, REPRODUCIBILITY_STATUSES, inferReproducibility({ officialCode, data, auditText }));
  if (officialCode === "third_party_only") reproducibility = "third_party_only";
  if (officialCode === "not_found" && reproducibility !== "third_party_only") reproducibility = "paper_only";
  if (officialCode === "partial" && reproducibility === "full") reproducibility = "partial";
  const notes = normalizeArtifactNotes(raw.notes, {
    audit,
    officialCode,
    thirdPartyCue,
    reachableRepo,
    officialCue,
  });
  const out = { officialCode, data, reproducibility, notes };
  if (repoStatus) out.repoStatus = repoStatus;
  return out;
}

function normalizeWhatWouldInvalidate(value, context = {}) {
  const provided = normalizeNarrativeArray(value).slice(0, 8);
  if (provided.length) return provided;
  const loadBearing = cleanString(context.loadBearingClaim);
  const rows = [
    loadBearing
      ? `A reproduction or ablation shows the load-bearing claim does not hold: ${loadBearing}`
      : "A reproduction on the paper's stated setup fails to recover the reported direction of the main result.",
    "The measured gain disappears when controlling for benchmark harness, prompt/tool schema, data leakage, reviewer effects, or baseline implementation quality.",
    "A customer-like pilot shows that latency, cost, permissions, reliability, or human-review burden erases the engineering conclusion.",
  ];
  if (context.artifactAudit?.officialCode !== "verified") {
    rows.push("The official artifacts remain unavailable or cannot be run, leaving the engineering conclusion unverifiable beyond the paper text.");
  }
  return rows;
}

function normalizeContributionLayers(value) {
  return asArray(value)
    .map((item) => {
      const layer = cleanPublicString(item?.layer);
      const claim = cleanPublicString(item?.claim);
      const evidence = cleanPublicString(item?.evidence || item?.support || item?.proof);
      const judgment = cleanPublicString(item?.judgment);
      const fdeMeaning = cleanPublicString(item?.fdeMeaning || item?.fde_meaning || item?.fde || item?.meaning);
      if (!layer || !claim || !judgment) return null;
      return {
        layer,
        claim,
        evidence: evidence || "论文证据未提供单独证据列。",
        judgment,
        fdeMeaning: fdeMeaning || "论文证据未显示直接的 FDE 落地意义。",
      };
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
    context.sections,
    context.payload?.leadJudgment,
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

function enumValue(value, allowed, fallback) {
  const text = cleanString(value);
  return allowed.has(text) ? text : fallback;
}

function inferFdeFit(context = {}) {
  const text = fdeContextText({
    candidate: context.candidate,
    evidence: { content: context.evidenceText || "" },
    evaluation: context.evaluation,
    source: context.source,
  });
  const signals = detectFdeSignalsFromText(text);
  const hardSignals = signals.filter((signal) => HARD_SYSTEM_SIGNALS.has(signal));
  if (hardSignals.length >= 2) return "high";
  if (hardSignals.length || signals.length) return "medium";
  return "low";
}

function inferVerdictEvidenceStrength(context = {}) {
  const highClaims = asArray(context.claimLedger).filter((item) => item.evidenceStrength === "high").length;
  const exactRows = asArray(context.evidenceMatrix).filter((item) => item.exactness === "exact").length;
  if (highClaims >= 2 && exactRows >= 2) return "strong";
  if (highClaims || exactRows || cleanString(context.evidenceText).length > 3000) return "medium";
  return "weak";
}

function artifactStatusFromAudit(artifactAudit = {}) {
  if (artifactAudit.officialCode === "verified") return "official";
  if (artifactAudit.officialCode === "partial") return "partial";
  if (artifactAudit.officialCode === "third_party_only") return "third_party_only";
  return "none";
}

function inferReadDecision({ evaluation = {}, fdeFit, evidenceStrength, artifactStatus } = {}) {
  const decision = cleanString(evaluation?.decision || evaluation?.triage?.decision);
  const score = Number(evaluation?.score ?? evaluation?.triage?.total_score);
  if (fdeFit === "high" && evidenceStrength === "strong" && artifactStatus !== "none") return "must_read";
  if (decision === "deep_dive" && fdeFit !== "low") return artifactStatus === "none" ? "read" : "must_read";
  if (decision === "review" || (Number.isFinite(score) && score >= 74)) return fdeFit === "low" ? "skim" : "read";
  if (decision === "read") return "read";
  if (decision === "skim") return "skim";
  if (fdeFit === "low" && evidenceStrength === "weak") return "skip";
  if (artifactStatus === "partial" || artifactStatus === "third_party_only") return "watch";
  return fdeFit === "high" ? "read" : "skim";
}

function fallbackWhyNow(context = {}) {
  const track = asArray(context.evaluation?.selection?.track).map(cleanString).filter(Boolean).slice(0, 2);
  const out = [];
  if (track.length) out.push(`Current triage placed it in ${track.join(", ")}.`);
  if (context.artifactAudit?.officialCode === "verified") out.push("The paper appears to have an official artifact path worth checking.");
  if (!out.length) out.push("It entered the paper feed through the current evidence and selection pipeline.");
  return out;
}

function fallbackWhyNotOverclaim(context = {}) {
  const out = [
    "Treat claims without a section, figure, table, appendix, or repo pointer as not specified in fetched text.",
    "Do not treat reachable referenced or dependency repositories as official reproducibility artifacts.",
  ];
  if (!asArray(context.evidenceMatrix).length) out.push("No normalized experiment row with exactness was available from the fetched text.");
  return out;
}

function inferClaimType(text) {
  const value = cleanString(text);
  if (/\b(FDE|customer|production|deployment|workflow|ROI|business|integration)\b/i.test(value)) return "engineering";
  if (/\b(theorem|proof|bound|formal|theoretical)\b/i.test(value)) return "theoretical";
  if (/\b(experiment|benchmark|ablation|dataset|user study|metric|accuracy|pass@|result)\b/i.test(value)) return "empirical";
  return "engineering";
}

function normalizeClaimEvidenceStrength(value) {
  const text = cleanString(value).toLowerCase();
  if (CLAIM_EVIDENCE_STRENGTHS.has(text)) return text;
  if (text === "strong") return "high";
  if (text === "weak") return "low";
  return "medium";
}

function normalizeEvidencePointer(value, evidenceText = "") {
  const pointer = cleanString(value);
  if (!pointer || /not specified|not provided|not found|paper evidence missing/i.test(pointer)) return NOT_SPECIFIED_POINTER;
  const bounded = pointer.length > 180 ? pointer.slice(0, 180).replace(/\s+\S*$/, "").trim() : pointer;
  if (!hasPointerLocationShape(bounded)) return NOT_SPECIFIED_POINTER;
  if (!pointerLocationSupported(bounded, evidenceText)) return NOT_SPECIFIED_POINTER;
  return bounded;
}

function hasPointerLocationShape(pointer) {
  return /(?:\bSec(?:tion)?\.?\b|§|\bFig(?:ure)?\.?\b|\bTable\b|\bAppendix\b|\bApp\.?\b|\brepo(?:sitory)?\b|\bREADME\b|\bcode\b|\bdataset\b|https?:\/\/)/i.test(pointer);
}

function pointerLocationSupported(pointer, evidenceText = "") {
  const haystack = cleanString(evidenceText);
  if (!haystack) return false;
  const lower = haystack.toLowerCase();
  const pointerLower = pointer.toLowerCase();
  if (lower.includes(pointerLower)) return true;
  const url = pointer.match(/https?:\/\/\S+/i)?.[0];
  if (url && lower.includes(cleanUrl(url).toLowerCase())) return true;
  for (const [, word, number] of pointer.matchAll(/\b(Sec(?:tion)?\.?|Fig(?:ure)?\.?|Table|Appendix|App\.?)\s*([A-Za-z]?\d+(?:\.\d+)?|[A-Z])\b/gi)) {
    const pattern = new RegExp(`\\b${escapeRegExp(word).replace(/\\\./g, "\\.?")}\\s*${escapeRegExp(number)}\\b`, "i");
    if (pattern.test(haystack)) return true;
  }
  if (/\brepo(?:sitory)?\b|\bREADME\b|\bcode\b/i.test(pointer) && /\b(github\.com|gitlab\.com|huggingface\.co|repository|repo|README|source code|code is available)\b/i.test(haystack)) return true;
  const tail = pointer.replace(/^(?:Sec(?:tion)?\.?|§|Fig(?:ure)?\.?|Table|Appendix|App\.?|repo(?:sitory)?|README|code)\s*[:.-]?\s*/i, "").trim();
  if (tail && tail.length >= 4 && lower.includes(tail.toLowerCase())) return true;
  return false;
}

function pointerFromText(value = "") {
  const text = cleanString(value);
  const match = text.match(/\b(?:Sec(?:tion)?\.?|Fig(?:ure)?\.?|Table|Appendix|App\.?|repo(?:sitory)?|README)\s*[:.-]?\s*[A-Za-z]?\d*(?:\.\d+)?[A-Za-z -]*/i);
  return match ? match[0].trim() : "";
}

function claimStrengthFromText(value = "") {
  const text = cleanString(value);
  if (/not specified|not provided|missing|unclear|weak|limited/i.test(text)) return "low";
  if (/\b(Sec(?:tion)?\.?|Fig(?:ure)?\.?|Table|Appendix|experiment|ablation|exact|reported)\b/i.test(text)) return "medium";
  return "low";
}

function normalizeExactness(value) {
  const text = cleanString(value);
  if (EXACTNESS_VALUES.has(text)) return text;
  if (/figure|estimated|approx/i.test(text)) return "estimated_from_figure";
  if (/exact|verbatim/i.test(text)) return "exact";
  return "author_claim";
}

function hasNumber(value) {
  return /\d/.test(String(value || ""));
}

function hasOfficialCodeReleaseCue(text = "") {
  const value = cleanString(text);
  if (!/(github\.com|gitlab\.com|huggingface\.co|source code|code|implementation|repository|repo)/i.test(value)) return false;
  return /\b(?:official (?:code|implementation|repository|repo)|authors? (?:release|released|provide|provided|publish|published|open[- ]source).*?(?:code|implementation|repository|repo)|we (?:release|released|provide|provided|publish|published|open[- ]source).*?(?:code|implementation|repository|repo)|our (?:code|implementation|repository|repo)|(?:source )?code (?:is )?(?:available|released|provided)|implementation (?:is )?(?:available|released|provided))\b/i.test(value);
}

function hasThirdPartyCodeCue(text = "") {
  return /\b(?:uses?|using|based on|depends on|dependency|baseline|built on|fork(?:ed)? from|adapted from|third[- ]party|external|reference(?:d)?).*?(?:github\.com|gitlab\.com|huggingface\.co|repository|repo|code)\b/i.test(cleanString(text));
}

function hasReachableRepoAudit(audit = []) {
  return asArray(audit).some((item) => /repository page is reachable|artifact page is reachable|project page is reachable/i.test(item?.finding || ""));
}

function inferOfficialCodeStatus({ audit = [], auditText = "", officialCue = false, thirdPartyCue = false, reachableRepo = false } = {}) {
  if (/release on hold|partial|coming soon|archived|gated|restricted/i.test(auditText) && officialCue) return "partial";
  if (officialCue && (reachableRepo || /github\.com|gitlab\.com|huggingface\.co/i.test(auditText))) return "verified";
  if (thirdPartyCue || reachableRepo) return "third_party_only";
  if (asArray(audit).length && /not found|unavailable|404/i.test(auditText)) return "not_found";
  return "not_found";
}

function inferDataStatus(text = "", candidate = {}) {
  const value = cleanString(text);
  if (/\b(data|dataset|corpus).{0,80}(request access|gated|restricted|not public|private|license required)\b/i.test(value)) return "restricted";
  if (/\b(data|dataset|corpus).{0,80}(available|released|open[- ]source|download|provided)\b/i.test(value)) return "available";
  if (/\b(survey|theory|position paper|roadmap)\b/i.test(`${candidate.title || ""} ${candidate.abstract || ""} ${value.slice(0, 500)}`)) return "not_applicable";
  return "not_found";
}

function repoStatusFromAudit(audit = []) {
  const findings = asArray(audit)
    .map((item) => cleanCompletePublicString(item?.finding, { max: 220 }))
    .filter(Boolean);
  return findings.slice(0, 2).join(" ");
}

function inferReproducibility({ officialCode, data, auditText = "" } = {}) {
  if (officialCode === "third_party_only") return "third_party_only";
  if (officialCode === "not_found") return "paper_only";
  if (officialCode === "partial") return "partial";
  if (officialCode === "verified" && (data === "available" || data === "not_applicable")) {
    return /\b(README|install|setup|requirements|reproduce|run|demo|config)\b/i.test(auditText) ? "full" : "partial";
  }
  return "artifact_light";
}

function normalizeArtifactNotes(value, { audit = [], officialCode, thirdPartyCue, reachableRepo, officialCue } = {}) {
  const notes = normalizeNarrativeArray(value).slice(0, 8);
  if ((thirdPartyCue || reachableRepo) && officialCode !== "verified") {
    notes.push("Reachable referenced, dependency, or third-party repositories are not treated as the authors' official code release for this paper.");
  }
  if (!officialCue && officialCode !== "verified") {
    notes.push("No fetched text clearly identifies an authors' official code release for this specific paper.");
  }
  if (!asArray(audit).length) {
    notes.push("No external repository or artifact URL was available for independent audit in this run.");
  }
  return unique(notes).slice(0, 8);
}

function normalizeFdeTakeaways(value, context = {}) {
  if (!isFdeRelevantContext(context)) return null;
  const fallback = fallbackFdeTakeaways(context);
  const provided = normalizeProvidedFdeTakeaways(value, fallback);
  const out = provided || fallback;
  return out ? withLegacyFdeAliases(withFdeSourceTags(out)) : null;
}

function normalizeProvidedFdeTakeaways(value, fallback = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const customerProblem = cleanCompletePublicString(value.customerProblem || value.problem, { max: 520 })
    || fallback.customerProblem;
  const customerQuestions = filledFdeArray(value.customerQuestions || value.questions, fallback.customerQuestions, 10);
  const artifactsToAudit = filledFdeArray(value.artifactsToAudit, fallback.artifactsToAudit, 14);
  const implementationChecklist = filledFdeArray(value.implementationChecklist || value.checklist, fallback.implementationChecklist, 12);
  const evalPlan = filledFdeArray(value.evalPlan, fallback.evalPlan, 10);
  const rolloutPlan = filledFdeArray(value.rolloutPlan, fallback.rolloutPlan, 8);
  const riskRegister = filledFdeArray(value.riskRegister, fallback.riskRegister, 10);
  const roiHypothesis = sanitizeRoiHypothesis(
    cleanCompletePublicString(value.roiHypothesis || value.roiRisk, { max: 620 })
      || fallback.roiHypothesis,
    fallback.roiHypothesis,
  );
  const interviewStory = cleanCompletePublicString(value.interviewStory, { max: 720 })
    || fallback.interviewStory;

  if (!customerProblem || customerQuestions.length < 5 || !artifactsToAudit.length || !implementationChecklist.length) return null;
  if (!evalPlan.length || !rolloutPlan.length || !riskRegister.length || !roiHypothesis || !interviewStory) return null;
  return {
    customerProblem,
    customerQuestions,
    artifactsToAudit,
    implementationChecklist,
    evalPlan,
    rolloutPlan,
    riskRegister,
    roiHypothesis,
    interviewStory,
  };
}

function sanitizeRoiHypothesis(value, fallback = "") {
  const text = cleanCompletePublicString(value, { max: 620 });
  const fallbackText = cleanCompletePublicString(fallback, { max: 620 })
    || "ROI is only a hypothesis until validated with an A/B test on task success, human override rate, time-to-resolution, p95 latency, cost per task, and policy or error incidents.";
  if (!text) return fallbackText;
  const hasImprovementPercent = /(?:improv|increase|decrease|reduce|reduction|save|saving|lower|raise|lift|boost|cut|çœ|é™ä½Ž|æå‡|å‡å°‘|èŠ‚çœ|æé«˜).{0,40}\d+(?:\.\d+)?\s*(?:%|percentage points?|ä¸ªç™¾åˆ†ç‚¹)/i.test(text)
    || /\d+(?:\.\d+)?\s*(?:%|percentage points?|ä¸ªç™¾åˆ†ç‚¹).{0,40}(?:improv|increase|decrease|reduce|reduction|save|saving|lower|raise|lift|boost|cut|çœ|é™ä½Ž|æå‡|å‡å°‘|èŠ‚çœ|æé«˜)/i.test(text);
  if (hasImprovementPercent) return fallbackText;
  if (/\b(A\/B|ab test|A-B test|experiment|validate|evidence|metric|golden task|human review)\b/i.test(text)) return text;
  return `${text} Validate it with an A/B test on task success, human override rate, time-to-resolution, p95 latency, cost per task, and policy or error incidents before treating ROI as real.`;
}

function withFdeSourceTags(takeaways) {
  return {
    customerProblem: tagFdeItem(takeaways.customerProblem, "推论"),
    customerQuestions: takeaways.customerQuestions.map((item) => tagFdeItem(item, "推论")),
    artifactsToAudit: takeaways.artifactsToAudit.map((item) => tagFdeItem(item, "待验证假设")),
    implementationChecklist: takeaways.implementationChecklist.map((item) => tagFdeItem(item, "推论")),
    evalPlan: takeaways.evalPlan.map((item) => tagFdeItem(item, "待验证假设")),
    rolloutPlan: takeaways.rolloutPlan.map((item) => tagFdeItem(item, "待验证假设")),
    riskRegister: takeaways.riskRegister.map((item) => tagFdeItem(item, "待验证假设")),
    roiHypothesis: tagFdeItem(takeaways.roiHypothesis, "待验证假设"),
    interviewStory: tagFdeItem(takeaways.interviewStory, "面试故事"),
  };
}

function tagFdeItem(value, tag) {
  const text = cleanString(value);
  if (!text || FDE_TAG_RE.test(text)) return text;
  return `[${tag}] ${text}`;
}

function fallbackFdeTakeaways(context = {}) {
  const text = fdeContextText(context);
  const signals = detectFdeSignalsFromText(text);
  if (!signals.length) return null;
  const selected = uniqueObjectsBy(
    [
      ...FDE_TAKEAWAY_BANK.filter((item) => signals.includes(item.signal)),
      ...FDE_TAKEAWAY_BANK.filter((item) => item.default),
      ...FDE_TAKEAWAY_BANK,
    ],
    (item) => item.signal,
  ).slice(0, 7);
  const scope = fdeScope(signals);
  const customerProblem = `The customer problem is turning ${scope} into a reliable AI application path: interfaces, data access, evaluation, rollout, and operating ownership have to be proven before production.`;
  const customerQuestions = unique(selected.map((item) => item.question)).slice(0, 10);
  const artifactsToAudit = unique([
    ...FDE_CANONICAL_ARTIFACTS,
    ...selected.flatMap((item) => item.artifacts),
  ]).slice(0, 14);
  const implementationChecklist = unique(selected.map((item) => item.checklist)).slice(0, 12);
  const evalPlan = unique([
    ...FDE_BASE_EVAL_PLAN,
    ...selected.map((item) => item.evalPlan),
  ]).slice(0, 10);
  const rolloutPlan = rolloutPlanForScope(scope);
  const riskRegister = unique([
    ...FDE_BASE_RISK_REGISTER,
    ...selected.map((item) => item.risk),
  ]).slice(0, 10);
  const roiHypothesis = `In a customer report, this becomes a readiness and risk-reduction hypothesis for ${scope}: ROI may come from reducing integration, evaluation, and debugging cycles, but it should be validated with an A/B test or staged pilot on task success, human override rate, time-to-resolution, p95 latency, cost per task, failure logs, and policy or error incidents.`;
  const interviewStory = `FDE interview story: I would translate the paper's ${scope} signal into a customer delivery plan by auditing the real artifacts, defining golden tasks and operating budgets, piloting behind human approval, and using the measured failure modes to decide whether the system earns limited production.`;
  return {
    customerProblem,
    customerQuestions,
    artifactsToAudit,
    implementationChecklist,
    evalPlan,
    rolloutPlan,
    riskRegister,
    roiHypothesis,
    interviewStory,
  };
}

const FDE_TAKEAWAY_BANK = [
  {
    signal: "customer/production system",
    default: true,
    question: "Which real customer workflow owns the AI output, and what production constraint would make the system unusable?",
    checklist: "Production owner, success metric, latency/cost budget, fallback path, and rollout boundary are documented.",
    artifacts: ["workflow SOPs", "production runbooks", "service SLOs"],
    evalPlan: "Offline and online evals must include the real production constraint the paper treats as load-bearing.",
    risk: "采用: without a workflow owner and fallback path, the system can be technically correct but operationally unused.",
  },
  {
    signal: "API/tool/MCP integration",
    question: "Which endpoints, tool contracts, inputs, responses, auth scopes, and error states must be explicit before integration?",
    checklist: "Endpoint, input schema, response schema, auth scope, rate limit, timeout, and error handling are documented.",
    artifacts: ["OpenAPI specs", "tool schemas", "MCP server manifests", "auth scope inventory"],
    evalPlan: "Golden tasks should assert the expected tool call, input schema, response handling, auth failure, timeout, and retry behavior.",
    risk: "技术: vague tool contracts shift failures into runtime debugging and make model quality look worse than the integration actually is.",
  },
  {
    signal: "workflow readiness",
    default: true,
    question: "Where does the AI step enter the workflow, who reviews or approves it, and what handoff must remain deterministic?",
    checklist: "Trigger, human approval, escalation, handoff, retry, and exception paths are mapped.",
    artifacts: ["process maps", "support tickets", "approval policies"],
    evalPlan: "Human-review samples should cover normal completion, rejection, escalation, retry, and exception paths.",
    risk: "采用: unclear approval and escalation paths create shadow workflows even when the AI output is accurate.",
  },
  {
    signal: "RAG/knowledge system",
    question: "Which knowledge sources need freshness, access control, retrieval tests, and citation or trace coverage?",
    checklist: "Source ownership, indexing path, chunking policy, retrieval eval set, freshness SLA, and citation trace are present.",
    artifacts: ["knowledge base exports", "index configuration", "retrieval eval logs", "document permission matrix"],
    evalPlan: "Offline retrieval eval should separate answer quality from source freshness, access control, citation coverage, and retrieval miss rate.",
    risk: "数据: stale or permission-mismatched knowledge can produce fluent answers that cannot be trusted in the customer workflow.",
  },
  {
    signal: "evaluation/reliability gate",
    default: true,
    question: "What eval set, pass/fail metric, regression gate, and review sample would prove this works on the customer's real tasks?",
    checklist: "Golden tasks, failure labels, pass/fail thresholds, regression cadence, and owner for eval updates are defined.",
    artifacts: ["eval datasets", "benchmark harness logs", "failure taxonomies"],
    evalPlan: "Regression gates should track pass/fail thresholds, known failure labels, cost, latency, and drift from the customer task distribution.",
    risk: "技术: benchmark gains can hide harness, prompt, data, or reviewer effects unless the eval is tied to real task acceptance.",
  },
  {
    signal: "observability/debugging",
    question: "Which traces, logs, intermediate decisions, and failure labels are required to debug bad outputs after deployment?",
    checklist: "Prompt, retrieved context, tool call, model output, user action, and error trace are logged with privacy controls.",
    artifacts: ["trace logs", "monitoring dashboards", "incident reports"],
    evalPlan: "Online eval should connect production traces to failure labels so regressions can be debugged without exposing private data.",
    risk: "安全: detailed traces improve debugging but can leak prompts, documents, user data, or tool outputs without retention and access controls.",
  },
  {
    signal: "deployment/runbook",
    question: "What rollout, fallback, rollback, versioning, latency, and cost controls decide whether this can run in production?",
    checklist: "Release gate, rollback plan, model/version pinning, cost guardrail, latency budget, and on-call path are ready.",
    artifacts: ["deployment runbooks", "CI/CD config", "cost reports", "latency dashboards"],
    evalPlan: "Limited-production eval should include rollback drills, version pinning, p95 latency, per-task cost, and escalation-rate checks.",
    risk: "成本: model calls, retrieval, monitoring, and human review can exceed the saved labor if budgets are not measured per task.",
  },
  {
    signal: "governance/permissions",
    question: "Which permissions, policy constraints, PII paths, and audit trails govern the AI action?",
    checklist: "RBAC, least-privilege scopes, PII handling, compliance policy, and audit trail are checked before launch.",
    artifacts: ["access-control matrix", "security reviews", "privacy impact assessments", "audit logs"],
    evalPlan: "Permission eval should include allowed, denied, redacted, and audit-only cases before any protected action is automated.",
    risk: "权限: least-privilege scope, RBAC inheritance, and audit coverage are launch blockers for protected customer data.",
  },
  {
    signal: "artifact-level diagnosis",
    question: "Which customer artifacts prove the current bottleneck: code paths, site behavior, data schemas, logs, tickets, or analytics?",
    checklist: "Code/site/data artifacts are sampled, mapped to user-facing failures, and tied to measurable remediation work.",
    artifacts: ["code repositories", "website flows", "data schemas", "analytics exports", "customer tickets"],
    evalPlan: "Artifact-based eval should tie sampled code, data, logs, tickets, or analytics to a before/after remediation metric.",
    risk: "数据: artifact samples can overfit to visible failures unless they cover normal, edge, and recent production cases.",
  },
];

const FDE_CANONICAL_ARTIFACTS = [
  "API spec or tool schema",
  "db schema or data dictionary",
  "logs and traces",
  "prompts and tool-call transcripts",
  "eval set and golden tasks",
  "workflow docs",
  "auth/RBAC matrix",
  "monitoring dashboards",
  "SLAs or SLOs",
  "human-approval flow",
];

const FDE_BASE_EVAL_PLAN = [
  "Offline eval: build golden tasks from the customer workflow and label expected outputs, tool calls, citations, and failure modes.",
  "Online eval: compare task success, human override rate, latency, cost, and error rate against the pre-AI workflow.",
  "Human review: sample accepted, rejected, and escalated cases so reviewers can label correctness, policy fit, and business usefulness.",
  "Latency-cost-error budget: set a launch gate that combines p95 latency, per-task cost, failed tool calls, hallucination or retrieval misses, and escalation rate.",
];

const FDE_BASE_RISK_REGISTER = [
  "技术: integration can fail at tool contracts, orchestration state, retrieval quality, or error handling rather than at the model alone.",
  "数据: stale, missing, or permission-mismatched sources can make apparently correct outputs unusable.",
  "权限: API scopes, RBAC, and audit trails must be checked before the system can act on protected data.",
  "安全: prompts, retrieved context, logs, and tool outputs need controls for PII, leakage, and policy violations.",
  "成本: latency, model calls, retrieval, monitoring, and human review can erase the apparent automation savings.",
  "采用: users need a clear owner, review path, fallback, and escalation rule before trusting the workflow.",
];

const FDE_SCOPE_LABELS = new Map([
  ["customer/production system", "customer-facing production AI workflow"],
  ["API/tool/MCP integration", "API/tool/MCP integration"],
  ["workflow readiness", "workflow automation with human handoff"],
  ["RAG/knowledge system", "RAG or enterprise knowledge retrieval"],
  ["evaluation/reliability gate", "evaluation and reliability gating"],
  ["observability/debugging", "observability and post-deployment debugging"],
  ["deployment/runbook", "deployment, rollout, and rollback operations"],
  ["governance/permissions", "permissions, security, and governance"],
  ["artifact-level diagnosis", "artifact-level diagnosis across code, data, logs, or tickets"],
]);

function filledFdeArray(value, fallback, limit) {
  return unique([
    ...normalizeFdeArray(value, limit),
    ...normalizeFdeArray(fallback, limit),
  ]).slice(0, limit);
}

function fdeScope(signals = []) {
  const labels = signals.map((signal) => FDE_SCOPE_LABELS.get(signal)).filter(Boolean);
  return unique(labels).slice(0, 3).join(", ") || "an AI application workflow";
}

function rolloutPlanForScope(scope) {
  return [
    `PoC: reproduce the paper-relevant ${scope} path on a small representative task set. Acceptance criteria: golden-task pass rate, trace completeness, and obvious failure modes are measurable.`,
    `Pilot: run the workflow with named human reviewers and limited users. Acceptance criteria: reviewers can approve, reject, escalate, and label failures without leaving the operating process.`,
    `Limited prod: enable the workflow for a bounded segment with rollback and monitoring. Acceptance criteria: p95 latency, per-task cost, error rate, override rate, and policy violations stay inside the launch budget.`,
    `Full production: expand only after ownership, monitoring, eval refresh, incident response, and governance reviews are stable. Acceptance criteria: business metric movement and failure-rate reduction are visible in operating data.`,
  ];
}

function withLegacyFdeAliases(takeaways) {
  return Object.defineProperties(takeaways, {
    questions: { get() { return asArray(this.customerQuestions).slice(0, 5); }, enumerable: false },
    checklist: { get() { return this.implementationChecklist; }, enumerable: false },
    roiRisk: { get() { return this.roiHypothesis; }, enumerable: false },
  });
}

function isFdeRelevantContext(context = {}) {
  const text = fdeContextText(context);
  const signals = detectFdeSignalsFromText(text);
  if (!signals.length) return false;
  const pureAlgorithm = PURE_ALGORITHM_ONLY_PATTERNS.some((pattern) => pattern.test(text));
  const hardSystemSignals = signals.filter((signal) => HARD_SYSTEM_SIGNALS.has(signal));
  if (hardSystemSignals.length) return true;
  if (pureAlgorithm) return false;
  return signals.some((signal) => signal === "RAG/knowledge system" || signal === "evaluation/reliability gate");
}

function detectFdeSignalsFromText(text = "") {
  return FDE_SIGNAL_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.label);
}

function fdeContextText({ candidate = {}, evidence = {}, evaluation = {}, sections = [], source = {} } = {}) {
  const sourceFields = {
    reframe: source.reframe,
    mechanism: source.mechanism,
    loadBearingClaim: source.loadBearingClaim,
    contributionLayers: source.contributionLayers,
  };
  return textParts([
    candidate.title,
    candidate.abstract,
    candidate.venue,
    candidate.tags,
    candidate.focusTopics,
    candidate.sourceSignals,
    evaluation.reason,
    evaluation.signals,
    evaluation.selection?.track,
    evidence.sections,
    String(evidence.content || "").slice(0, 12000),
    sections,
    sourceFields,
  ]).join("\n");
}

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

function normalizeFdeArray(value, limit) {
  return unique(asArray(value)
    .map((item) => cleanCompletePublicString(item, { max: 320 }))
    .filter(Boolean))
    .slice(0, limit);
}

function normalizeNarrativeArray(value) {
  return unique(asArray(value)
    .map((item) => cleanCompletePublicString(item, { max: 520 }))
    .filter(Boolean));
}

function normalizeAudit(value) {
  const bySource = new Map();
  const withoutSource = new Map();
  for (const item of asArray(value)) {
    const claim = cleanCompletePublicString(item?.claim, { max: 360 });
    const finding = cleanCompletePublicString(item?.finding, { max: 360 });
    const source = cleanString(item?.source);
    const audit = { claim, finding };
    if (source) audit.source = source;
    if (!claim || !finding || isGarbledClaimText(claim)) continue;
    const sourceKey = source ? canonicalAuditSource(source) : "";
    if (sourceKey) {
      const existing = bySource.get(sourceKey);
      if (!existing || auditSpecificityScore(audit) > auditSpecificityScore(existing)) bySource.set(sourceKey, audit);
      continue;
    }
    const key = `${claim}\n${finding}`.toLowerCase();
    if (!withoutSource.has(key)) withoutSource.set(key, audit);
  }
  return [...bySource.values(), ...withoutSource.values()];
}

function canonicalAuditSource(source) {
  const raw = cleanString(source);
  try {
    const url = new URL(raw);
    url.hash = "";
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function auditSpecificityScore(audit) {
  let score = 0;
  if (/returned HTTP|reachable|archived|gated|not found|release is on hold|restricted/i.test(audit.finding)) score += 4;
  if (!/^Paper mentions an external project\/artifact URL\.$/i.test(audit.claim)) score += 2;
  score += Math.min(cleanString(audit.finding).length, 240) / 120;
  return score;
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
  return /(?:\.\.\.|…|â€¦)$/.test(text)
    || /[,;:([{]$/.test(text)
    || /\b(?:and|or|of|for|to|with|without|that|which|because|while|where|via|using|including|such as|the|a|an)$/i.test(text);
}

function hasBadTextMarker(value) {
  return /\uFFFD|\u00ef\u00bf\u00bd|\[\u5360\u4f4d\]|\b(?:TODO|TBD)\b/i.test(String(value || ""));
}

function isGarbledClaimText(value) {
  const text = cleanString(value);
  if (/^(?:\d+\s+){2,}\d+\b/.test(text)) return true;
  if (/\b(\d+)(?:\s+\1){2,}\b/.test(text)) return true;
  if (/^(?:\d+[\s,;:.-]+){5,}/.test(text)) return true;
  return false;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueObjectsBy(items, keyFn) {
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

function ensureReproducibilityLimitation(limitations, audit, fallbackLimits = {}) {
  const out = [...limitations];
  const hasRepro = out.some((item) => /reproduc|replicat|artifact|code|open[- ]?source|可复现|复现/i.test(item));
  if (!hasRepro) {
    const auditNote = audit.length
      ? "Reproducibility note: external project/repository claims were checked in the audit entries above; remaining reproducibility depends on paper artifacts, code, data, and run instructions actually being present."
      : "Reproducibility note: no external project or repository URL was available in the collected evidence, so artifact availability could not be independently checked.";
    out.push(auditNote);
  }
  const fallbackNote = cleanCompletePublicString(fallbackLimits?.evidenceNotes, { max: 520 });
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
  if (nextBreak < 0) return "";
  const start = Math.max(0, previousBreak + 1);
  const end = index + url.length + nextBreak + 1;
  return cleanCompletePublicString(source.slice(start, end), { max: 360 });
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
  return title && title.length >= 4 && title.length <= 160 ? title : "";
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
