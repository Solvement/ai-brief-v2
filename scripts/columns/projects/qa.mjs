import { judgeGroundedness, runStructuralQa } from "../../lib/qa-base.mjs";

const REQUIRED_DEEP_FIELDS = [
  "atGlance",
  "whyItMatters",
  "keyConcepts",
  "howItWorks",
  "novelty",
  "ecosystem",
  "limitations",
  "tryIt",
  "score",
  "provenance.sourceUrl",
  "verifiedAt",
];

export async function qaGate(analysis, evidence, ctx = {}) {
  const options = ctx.options || {};
  const structural = runStructuralQa(analysis, {
    requiredFields: REQUIRED_DEEP_FIELDS,
    requireSources: true,
    requireVerifiedAtForLatest: true,
  });
  const grounded = await judgeGroundedness({
    analysis,
    evidence,
    enabled: options.groundedQa ?? process.env.AI_BRIEF_LLM_JUDGE === "1",
    chatJson: options.chatJson,
  });
  const verdict = structural.verdict === "fail" || grounded.verdict === "fail"
    ? "fail"
    : grounded.verdict === "warn"
      ? "warn"
      : "pass";
  const result = {
    structuralPass: structural.structuralPass,
    groundedScore: grounded.groundedScore,
    flags: [
      ...structural.flags,
      ...grounded.flags.map((flag) => ({ id: "groundedness", message: String(flag) })),
    ],
    verdict,
    checks: structural.checks,
    grounded,
  };

  const analysisId = analysis?._analysisId || ctx.item?.analysis?._analysisId;
  if (options.db && analysisId) {
    options.db.upsertQaVerdict({
      analysisId,
      structuralPass: result.structuralPass,
      groundedScore: result.groundedScore,
      flags: result.flags,
      verdict: result.verdict,
    });
  }
  return result;
}
