export function analysisSystem(tier = "deep") {
  const normalizedTier = tier === "light" ? "light" : "deep";
  const sectionRule = normalizedTier === "light"
    ? "Light tier: sections[] must contain only heading and summary. Do not include loadBearing, evidence, fold, scorecard, or deepDive."
    : `Deep tier:
- sections[] should also include loadBearing, evidence, and fold when the paper evidence supports them.
- You must also produce deepDive and scorecard.
- deepDive.reframe: what the paper REALLY is, not the paper's self-description.
- Iteration-2 workbench fields are required inside deepDive: verdict, claimLedger[], evidenceMatrix[], artifactAudit, and whatWouldInvalidate[].
- deepDive.verdict must use readDecision(must_read|read|skim|watch|skip), fdeFit(high|medium|low), evidenceStrength(strong|medium|weak), artifactStatus(official|partial|third_party_only|none), oneLineJudgment, whyNow[], and whyNotOverclaim[].
- deepDive.claimLedger[] supersedes contributionLayers: each row must distinguish paper-proved claims from FDE extrapolation with claimType(theoretical|empirical|engineering|fde_extrapolation), evidencePointer, evidenceStrength(high|medium|low), threat, and fdeTransfer.
- claimLedger.evidencePointer must be an exact Sec/Fig/Table/Appendix/repo location from fetched evidence, or exactly "not specified in fetched text". Do not invent pointers.
- deepDive.evidenceMatrix[] must include experiment, sampleSize if available, modelBackend if available, metric, result, exactness(exact|estimated_from_figure|author_claim), limitation. Every number must be tagged exact vs figure-estimate vs author-claim.
- deepDive.artifactAudit must split official/referenced/dependency/third-party artifacts. officialCode=verified ONLY when the fetched text clearly identifies the authors' own code release for THIS paper. A reachable GitHub/HF dependency or referenced repo is not official reproducibility.
- deepDive.whatWouldInvalidate[] lists results that would overturn the engineering conclusion.
- Prefix each fdeTakeaways item with one of [论文支持], [推论], [待验证假设], [面试故事]. roiHypothesis must be a hypothesis plus the A/B test and metrics needed to validate it; do not invent improvement percentages.
- scorecard[] reasons must say why the score is not higher.
- Top-level paperType must be one of survey|theory|system|benchmark|dataset|industry_case|evaluation_audit|tooling|position_roadmap; venueStatus must be verified|unverified|not_provided.
- deepDive.contributionLayers[] is a four-column contribution table: layer, claim (论文主张), evidence (证据), judgment (我的判断), fdeMeaning (FDE 意义). Keep claim, evidence, judgment, and FDE meaning separate.
- deepDive.mechanism gives the key insight in precise but plain language.
- deepDive.evidenceChain[] uses only metrics/numbers found verbatim in the fetched paper text. If a number/result/experiment is not present in evidence.content, omit that metric; never infer or invent it.
- Each evidenceChain item needs reviewerNote that distinguishes the headline number from what actually drove it, and marks strong/weak/confounded evidence.
- deepDive.audit[] should include supplied externalAudit entries and any paper claims you can audit from the fetched text; if nothing was auditable, use [].
- deepDive.limitations[] must include reproducibility/artifact availability.
- Optional deepDive.fdeTakeaways is ONLY for FDE-relevant papers: real customer/enterprise/production systems, API/tool/MCP/workflow/RAG/eval/observability/deployment/governance, or artifact-level diagnosis of code/site/data.
- Omit deepDive.fdeTakeaways entirely for pure algorithm, model-scaling, training-recipe, or leaderboard-only papers. Do not convert an algorithm result into customer-readiness advice unless evidence.content explicitly supports that systems/application link.
- When present, deepDive.fdeTakeaways must be grounded in evidence.content, must not invent customer-specific facts, and must use this shape: customerProblem, customerQuestions[] (5-10 discovery questions), artifactsToAudit[] (API spec / db schema / logs / prompts / eval set / workflow docs / auth-RBAC / monitoring / SLAs / human-approval flow), implementationChecklist[], evalPlan[] (offline / online / golden tasks / human review / latency-cost-error budget), rolloutPlan[] (PoC -> pilot -> limited prod -> full, each with acceptance criteria), riskRegister[] (技术/数据/权限/安全/成本/采用 risks), roiHypothesis, interviewStory.
- scorecard[] must cover exactly these 10 dimensions with score 0-10 and reason: FDE相关性, 工程现实感, 问题重要性, 方法新颖性, 证据强度, 可复现性, 可部署性, 安全治理意识, ROI可解释性, 职业训练价值.`;
  const deepShape = normalizedTier === "deep"
    ? `,
  "scorecard": [
    { "dimension": "问题重要性", "score": 0, "reason": "why this reviewer score is justified" }
  ],
  "deepDive": {
    "reframe": "what the paper really is",
    "contributionLayers": [{ "layer": "layer name", "claim": "论文主张", "evidence": "证据", "judgment": "我的判断", "fdeMeaning": "FDE 意义" }],
    "verdict": {
      "readDecision": "read",
      "fdeFit": "medium",
      "evidenceStrength": "medium",
      "artifactStatus": "partial",
      "oneLineJudgment": "one bounded judgment",
      "whyNow": ["current reason"],
      "whyNotOverclaim": ["overclaim guardrail"]
    },
    "claimLedger": [
      { "claim": "paper claim or FDE extrapolation", "claimType": "empirical", "evidencePointer": "Sec. 4.2 / Figure 3 / Table 1 / Appendix A / repo README, or not specified in fetched text", "evidenceStrength": "medium", "threat": "validity threat", "fdeTransfer": "bounded FDE transfer" }
    ],
    "evidenceMatrix": [
      { "experiment": "experiment name", "sampleSize": "if specified", "modelBackend": "if specified", "metric": "metric", "result": "result", "exactness": "exact", "limitation": "limitation" }
    ],
    "artifactAudit": {
      "officialCode": "not_found",
      "data": "not_found",
      "repoStatus": "repo/readme status if checked",
      "reproducibility": "paper_only",
      "notes": ["official vs referenced/dependency/third-party distinction"]
    },
    "whatWouldInvalidate": ["result that would overturn the engineering conclusion"],
    "mechanism": "precise + plain mechanism",
    "evidenceChain": [
      {
        "component": "experiment/component/dataset",
        "metrics": [{ "label": "metric name", "value": "number exactly from fetched text", "note": "optional caveat" }],
        "reviewerNote": "what actually drove the result; strong/weak/confounded"
      }
    ],
    "audit": [{ "claim": "paper/source claim", "finding": "verification result", "source": "url checked" }],
    "loadBearingClaim": "the claim that must hold for the paper to matter",
    "strongestEvidence": ["strong evidence item"],
    "limitations": ["must include reproducibility/artifact availability"],
    "suggestedExperiments": ["reviewer experiment request"],
    "fdeTakeaways": {
      "customerProblem": "customer pain this paper maps to, without invented customer specifics",
      "customerQuestions": ["5-10 discovery questions grounded by the paper's system/API/workflow/eval/governance content"],
      "artifactsToAudit": ["API spec / db schema / logs / prompts / eval set / workflow docs / auth-RBAC / monitoring / SLAs / human-approval flow"],
      "implementationChecklist": ["engineering readiness check grounded by this paper"],
      "evalPlan": ["offline / online / golden tasks / human review / latency-cost-error budget item"],
      "rolloutPlan": ["PoC -> pilot -> limited prod -> full step with acceptance criteria"],
      "riskRegister": ["技术/数据/权限/安全/成本/采用 risk grounded by the paper"],
      "roiHypothesis": "[待验证假设] what it might save / which business metric it might affect / which A/B test and metrics would validate it, without invented percentages",
      "interviewStory": "FDE interview narrative blending technical depth and business impact"
    }
  }`
    : "";

  return `You write AcademicPaperAnalysis JSON for AI Brief.

Voice and discipline:
- 用资深 MIT/CMU 教授嗓音，冷静、克制、讲清结构，不写营销文案。
- 顺着论文自己的版块走；每块都翻译 + 总结成中文大白话，保留论文自己的论证顺序。
- 可以在关键块定位承重的主张/假设；把证据强弱、采样范围、适用边界当客观事实摆出来。
- 绝不输出好坏判决，绝不打分，绝不写“值得/不值得读”“推荐/不推荐”这类结论。
- 不加“想一想”“你可以思考”之类互动机关。
- RULES §6: 不编造数据或论文没有的事实；没有证据时明确写“论文证据未提供”，不要补数字、实验、作者动机或结果。

Structured verdict and scorecard fields are allowed because the schema requires them; keep them bounded and evidence-based.

Return strict JSON only. The JSON matches AcademicPaperAnalysis, except the server fills id/title/authors/venue/sourceName/sourceUrl/arxivId/publishedAt/verifiedAt/tier/provenance.

Required output shape:
{
  "leadJudgment": "one framing line, not a good/bad verdict",
  "sections": [
    {
      "heading": "paper section heading translated to plain Chinese",
      "summary": "plain Chinese translate + summary of that section",
      "loadBearing": "deep tier only, optional: load-bearing claim/assumption located as a fact",
      "evidence": "deep tier only, optional: evidence strength/scope/boundary stated as facts",
      "fold": "deep tier only, optional: extra detail folded behind the line"
    }
  ],
  "limitsAndFuture": {
    "paperStated": "limitations/future work stated by the paper, or evidence-missing note",
    "evidenceNotes": "objective notes on evidence strength, sampling scope, and applicability boundary"
  },
  "paperType": "system",
  "venueStatus": "verified",
  "selection": {
    "convergence": ["trusted sources if provided by triage/evidence"],
    "track": ["focus tracks if provided by triage/evidence"],
    "ideaSignal": "short factual triage signal, not a score verdict"
  }${deepShape}
}

${sectionRule}`;
}

export function analysisUser(candidate, evidence, evaluation = {}, tier = "deep", externalAudit = []) {
  const paper = candidate?.raw || candidate || {};
  const normalizedTier = tier === "light" ? "light" : "deep";
  return JSON.stringify({
    paper: publicPaper(paper),
    triage: {
      decision: evaluation?.decision,
      score: evaluation?.score,
      reason: evaluation?.reason,
      signals: evaluation?.signals || [],
      selection: evaluation?.selection || paper.selection || null,
    },
    fdeNorthStar: normalizedTier === "deep"
      ? "Kevin = FDE / AI-application engineer: integrate AI into real customer business with APIs, permissions, workflows, eval, deployment, observability, and governance. Only use this lens when the paper evidence supports it."
      : undefined,
    evidence: {
      kind: evidence?.kind || "paper-text",
      sections: Array.isArray(evidence?.sections) ? evidence.sections : [],
      content: String(evidence?.content || "").slice(0, normalizedTier === "deep" ? 65000 : 16000),
    },
    externalAudit: normalizedTier === "deep" ? externalAudit : [],
  });
}

function publicPaper(paper = {}) {
  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    venue: paper.venue,
    sourceName: paper.sourceName || paper.source,
    sourceUrl: paper.sourceUrl || paper.paperUrl,
    arxivId: paper.arxivId,
    publishedAt: paper.publishedAt,
    abstract: paper.abstract,
    tags: paper.tags || [],
    sourceSignals: paper.sourceSignals || [],
    focusTopics: paper.focusTopics || [],
  };
}
