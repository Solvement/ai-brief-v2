import { createDeepSeekClient, projectDeepModel } from "../../lib/llm.mjs";

const REVIEW_VERDICTS = new Set(["pass", "revise", "downgrade"]);

export function projectReviewModel(options = {}, env = process.env) {
  return options.projectReviewModel || env.PROJECT_REVIEW_MODEL || projectDeepModel(env);
}

export async function reviewProjectAnalysis({
  candidate,
  evidence,
  triage,
  analysis,
  options = {},
  logger = console,
} = {}) {
  const offline = isOffline(options);
  const model = projectReviewModel(options);
  if (offline) {
    return normalizeReview({
      verdict: "pass",
      issues: [],
      rationale: "offline stub review; PM must run reviewer before paid publication",
    }, { model: "offline-project-review-stub" });
  }

  const chatJson = options.reviewChatJson
    || options.chatJson
    || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger }).chatJson;
  const payload = await chatJson({
    system: PROJECT_REVIEW_SYSTEM,
    user: projectReviewUser({ candidate, evidence, triage, analysis }),
    model,
    maxTokens: options.reviewMaxTokens || Number(process.env.PROJECT_REVIEW_MAX_TOKENS) || 1800,
  });
  return normalizeReview(payload, { model });
}

export function normalizeReview(input = {}, { model = "" } = {}) {
  const verdict = REVIEW_VERDICTS.has(String(input.verdict || "").toLowerCase())
    ? String(input.verdict).toLowerCase()
    : "revise";
  return {
    verdict,
    issues: asArray(input.issues).map((issue) => cleanString(issue)).filter(Boolean).slice(0, 12),
    rationale: cleanString(input.rationale || input.reason || ""),
    model,
  };
}

export function applyReviewToDepthDecision(decision = {}, review = {}, finalDepth = decision.final_depth) {
  return {
    ...decision,
    final_depth: finalDepth || decision.final_depth,
    review_verdict: review.verdict || "not_run",
    review_issues: asArray(review.issues),
  };
}

export function downgradedDepth(depth) {
  if (depth === "deep") return "analysis";
  if (depth === "analysis") return "light";
  return depth || "list_only";
}

export function isReviewableDepth(depth) {
  return depth === "analysis" || depth === "deep";
}

export function projectReviewUser({ candidate, evidence, triage, analysis } = {}) {
  const repo = candidate?.raw || candidate || {};
  return JSON.stringify({
    repo: {
      fullName: repo.fullName,
      url: repo.url,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      starsGained: repo.starsGained,
    },
    depth_decision: triage?.depth_decision || triage || null,
    evidence_signals: evidence?.evidence_signals
      || evidence?.evidenceSignals
      || evidence?.metadata?.evidence_signals
      || evidence?.metadata?.evidenceSignals
      || null,
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
    readme: String(evidence?.content || "").slice(0, 12000),
    analysis,
  });
}

const PROJECT_REVIEW_SYSTEM = `You are the separate Projects Radar reviewer.

Return strict JSON:
{
  "verdict": "pass|revise|downgrade",
  "issues": ["short issue strings"],
  "rationale": "short reason"
}

Audit only analysis/deep project briefs.
- grounding: every substantive claim must be traceable to README, docs/tree/examples/config/artifactAudit, not description-only.
- filler: reject template boilerplate, generic praise, and claims that could fit any repo.
- depth: final_depth must be justified by deterministic evidence and must not exceed max_allowed_depth.
- downgrade if the evidence cannot support the requested depth after one revision.
- revise if the brief is mostly right but has fixable ungrounded/filler sections.
- pass only when the brief is publishable at the requested deterministic depth.`;

function isOffline(options = {}, env = process.env) {
  return Boolean(
    options.dryRun
      || options.noLlm
      || options.offline
      || env.NO_LLM === "1"
      || env.AI_BRIEF_OFFLINE === "1",
  );
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
