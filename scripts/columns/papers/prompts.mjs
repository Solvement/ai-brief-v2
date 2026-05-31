export function analysisSystem(tier = "deep") {
  const normalizedTier = tier === "light" ? "light" : "deep";
  const sectionRule = normalizedTier === "light"
    ? "Light tier: sections[] must contain only heading and summary. Do not include loadBearing, evidence, or fold."
    : "Deep tier: sections[] should also include loadBearing, evidence, and fold when the paper evidence supports them.";

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
  }
}

${sectionRule}`;
}

export function analysisUser(candidate, evidence, evaluation = {}) {
  const paper = candidate?.raw || candidate || {};
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
      content: String(evidence?.content || "").slice(0, 16000),
    },
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
