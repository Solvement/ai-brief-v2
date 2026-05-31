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
    const reason = cleanPublicString(item?.reason);
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
  const limitations = ensureReproducibilityLimitation(
    normalizeNarrativeArray(source.limitations),
    audit,
    fallback.limitsAndFuture,
  );
  const out = {
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
  const fdeTakeaways = normalizeFdeTakeaways(source.fdeTakeaways, { candidate, evidence, evaluation, sections, source });
  if (fdeTakeaways) out.fdeTakeaways = fdeTakeaways;
  return out;
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

function normalizeFdeTakeaways(value, context = {}) {
  if (!isFdeRelevantContext(context)) return null;
  const fallback = fallbackFdeTakeaways(context);
  const provided = normalizeProvidedFdeTakeaways(value, fallback);
  const out = provided || fallback;
  return out ? withLegacyFdeAliases(out) : null;
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
  const roiHypothesis = cleanCompletePublicString(value.roiHypothesis || value.roiRisk, { max: 620 })
    || fallback.roiHypothesis;
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
  const roiHypothesis = `In a customer report, this becomes a readiness and risk-reduction hypothesis for ${scope}: ROI comes from reducing integration, evaluation, and debugging cycles; failure-rate reduction comes from catching contract, permission, workflow, and rollout gaps before deployment; evidence should come from golden tasks, failure logs, latency/cost traces, and human-review samples.`;
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
