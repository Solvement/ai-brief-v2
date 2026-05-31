export function analysisSystem(tier = "deep") {
  const normalizedTier = tier === "light" ? "light" : "deep";
  const sectionRule = normalizedTier === "light"
    ? "Light tier: sections[] must contain only heading and summary. Do not include loadBearing, evidence, fold, scorecard, or deepDive."
    : `Deep tier:
- sections[] should also include loadBearing, evidence, and fold when the paper evidence supports them.
- You must also produce deepDive and scorecard.
- deepDive.reframe: what the paper REALLY is, not the paper's self-description.
- deepDive.contributionLayers[] separates layer, claim (论文主张), and judgment (我的判断).
- deepDive.mechanism gives the key insight in precise but plain language.
- deepDive.evidenceChain[] uses only metrics/numbers found verbatim in the fetched paper text. If a number/result/experiment is not present in evidence.content, omit that metric; never infer or invent it.
- Each evidenceChain item needs reviewerNote that distinguishes the headline number from what actually drove it, and marks strong/weak/confounded evidence.
- deepDive.audit[] should include supplied externalAudit entries and any paper claims you can audit from the fetched text; if nothing was auditable, use [].
- deepDive.limitations[] must include reproducibility/artifact availability.
- scorecard[] must cover exactly these dimensions with score 0-10 and reason: 问题重要性, 系统设计, 算法新颖性, 实验强度, 泛化, 可复现性, 影响.`;
  const deepShape = normalizedTier === "deep"
    ? `,
  "scorecard": [
    { "dimension": "问题重要性", "score": 0, "reason": "why this reviewer score is justified" }
  ],
  "deepDive": {
    "reframe": "what the paper really is",
    "contributionLayers": [{ "layer": "layer name", "claim": "论文主张", "judgment": "我的判断" }],
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
    "suggestedExperiments": ["reviewer experiment request"]
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
