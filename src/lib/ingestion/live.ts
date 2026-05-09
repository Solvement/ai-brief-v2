import type { EvaluationResult } from "../ai/evaluation/schema";
import type { AnyContentItem, DetailDepth, DeepDiveStatus } from "../content/types";

function estimateReadingTime(depth: DetailDepth): number {
  if (depth === "deep") return 14;
  if (depth === "standard") return 8;
  if (depth === "brief") return 5;
  return 3;
}

function normalizeDeepDiveStatus(result: EvaluationResult): DeepDiveStatus {
  if (result.deep_dive_status === "generated" && result.deep_dive) return "generated";
  if (result.deep_dive_status === "needs_human_review") return "needs_human_review";
  if (result.deep_dive_status === "needed_not_generated") return "needed_not_generated";
  return "not_needed";
}

function safeRecommendedAction(result: EvaluationResult): EvaluationResult["recommended_action"] {
  if (result.confidence_score < 60 && (result.recommended_action === "try" || result.recommended_action === "use_now")) {
    return "monitor";
  }
  return result.recommended_action;
}

function inferModelProvider(draft: AnyContentItem): string {
  const source = draft.source_name.replace(/\s+(News|Blog|Rankings|Leaderboard)$/i, "").trim();
  if (/anthropic/i.test(`${draft.title} ${draft.source_name}`)) return "Anthropic";
  if (/openai/i.test(`${draft.title} ${draft.source_name}`)) return "OpenAI";
  if (/deepmind|gemini|google/i.test(`${draft.title} ${draft.source_name}`)) return "Google";
  if (/meta|llama/i.test(`${draft.title} ${draft.source_name}`)) return "Meta";
  if (/deepseek/i.test(`${draft.title} ${draft.source_name}`)) return "DeepSeek";
  if (/qwen/i.test(`${draft.title} ${draft.source_name}`)) return "Qwen";
  if (/openrouter/i.test(`${draft.title} ${draft.source_name}`)) return "OpenRouter";
  return source || "Model source";
}

function inferIntegrationTarget(draft: AnyContentItem): string {
  const text = `${draft.title} ${draft.summary} ${draft.tags.join(" ")}`.toLowerCase();
  if (text.includes("mcp")) return "MCP server / agent connector";
  if (text.includes("claude.md") || text.includes("claude code")) return "Claude Code instruction pack";
  if (text.includes("cursor")) return "Cursor rules";
  if (text.includes("hook")) return "Agent hooks";
  if (text.includes("skill")) return "Agent skill pack";
  return "Agent workflow rules";
}

function hasUiScrapeJunk(value = ""): boolean {
  return [
    /\brole=checkbox\b/i,
    /\baria-[a-z-]+=/i,
    /\bdata-testid\b/i,
    /\bclass(Name)?=/i,
    /\bstyle=/i,
    /<\/?(div|span|button|input|script|style|svg|img|a|p|ul|li|section|article|header|footer|main|form|label|select|option|textarea)(\s|>|\/)/i,
    /\b(function|const|let|var)\s+[a-z0-9_$]*\s*[=(]/i,
    /\b(window|document)\./i,
    /\{[^}]{20,}\}/,
    /;\s*(color|font|display|background|transform|position)\s*:/i,
  ].some((pattern) => pattern.test(value));
}

function cleanList(values: string[]): string[] {
  return values.filter((value) => value && !/\bneeds review\b/i.test(value) && !hasUiScrapeJunk(value) && !hasPublicBoilerplate(value));
}

function hasPublicBoilerplate(value = ""): boolean {
  return [
    /需要编辑补充/i,
    /核查来源文本/i,
    /确认事实和判断是否分离/i,
    /是否有清晰\s*README\s*和可运行\s*demo/i,
    /README\s*说得多但无法快速跑通/i,
    /选一个低风险真实任务/i,
    /选择一个小范围真实任务验证判断是否成立/i,
    /热度高但缺少\s*benchmark/i,
    /来源事实明确/i,
    /有安装步骤和验证方法/i,
    /需要基于来源文本补成中文摘要/i,
    /来源文本不足以形成可发布摘要/i,
    /当前只能作为待复核线索/i,
    /发布前需要补齐来源事实/i,
    /待复核线索/i,
  ].some((pattern) => pattern.test(value));
}

function cleanExamples(values: Array<{ scenario: string; explanation: string; expected_value: string }>): Array<{ scenario: string; explanation: string; expected_value: string }> {
  return values.filter((value) => !hasPublicBoilerplate(`${value.scenario} ${value.explanation} ${value.expected_value}`) && !hasUiScrapeJunk(`${value.scenario} ${value.explanation} ${value.expected_value}`));
}

function typeSpecificOverrides(draft: AnyContentItem, result: EvaluationResult): Partial<AnyContentItem> {
  const brief = result.brief_detail;
  const validationMethods = result.action_layer.validation_methods.length > 0 ? result.action_layer.validation_methods : result.next_steps;

  if (draft.content_type === "model") {
    return {
      model_provider: inferModelProvider(draft),
      primary_capability: brief.what_changed || brief.mechanism_explanation || result.one_sentence_takeaway,
      pricing_note: brief.what_to_look_for?.find((point) => /price|pricing|cost|成本|价格/i.test(point)) ?? "来源未给出完整价格信息，切换前需要复核官方定价并用自己的调用量估算成本。",
      latency_note: brief.what_to_look_for?.find((point) => /latency|speed|tokens|速度|延迟/i.test(point)) ?? "来源未给出完整延迟数据，切换前需要用自己的任务测试首 token、吞吐和工具调用往返。",
      benchmark_notes: cleanList([...result.key_facts, ...brief.what_to_look_for]).slice(0, 5),
      test_prompts: validationMethods.slice(0, 3),
    } as Partial<AnyContentItem>;
  }

  if (draft.content_type === "integration") {
    return {
      integration_target: inferIntegrationTarget(draft),
      verification_methods: validationMethods.slice(0, 5),
    } as Partial<AnyContentItem>;
  }

  if (draft.content_type === "article") {
    const coreArgument = hasUiScrapeJunk(result.ai_brief_judgment.main_judgment)
      ? result.one_sentence_takeaway
      : result.ai_brief_judgment.main_judgment;
    const counterpoints = cleanList([
      ...result.ai_brief_judgment.uncertainty,
      ...brief.open_questions,
      ...result.risks,
    ]);
    return {
      core_argument: coreArgument,
      evidence_strength: result.source_confidence >= 80 ? "strong" : result.source_confidence >= 60 ? "medium" : "weak",
      counterpoints: counterpoints.slice(0, 5),
    } as Partial<AnyContentItem>;
  }

  if (draft.content_type === "paper") {
    const limitations = cleanList([...brief.limitations_and_risks, ...result.risks, ...brief.open_questions]);
    return {
      method_summary: brief.mechanism_explanation || result.summary,
      limitations: limitations.slice(0, 5),
      reproducibility: result.practical_confidence >= 75 ? "strong" : "partial",
    } as Partial<AnyContentItem>;
  }

  if (draft.content_type === "course") {
    return {
      provider: draft.source_name,
      duration: "Self-paced",
      learning_outcomes: [result.one_sentence_takeaway, ...result.action_layer.next_steps].slice(0, 5),
      project_based: result.actionability_score >= 70,
    } as Partial<AnyContentItem>;
  }

  return {};
}

export function evaluationToPublishedContentItem(draft: AnyContentItem, result: EvaluationResult): AnyContentItem {
  const detailDepth = result.depth_level;
  const deepDiveStatus = normalizeDeepDiveStatus(result);
  const sourceFacts = [...new Set([...result.source_facts.map((fact) => fact.claim), ...result.key_facts])];
  const actionSummary = result.action_layer.next_steps.join(" ");
  const validationMethods = result.action_layer.validation_methods.length > 0 ? result.action_layer.validation_methods : result.next_steps;
  const recommendedAction = safeRecommendedAction(result);
  const sourceUrl = draft.source_url?.startsWith("http://") ? draft.source_url.replace(/^http:\/\//i, "https://") : draft.source_url;
  const canonicalUrl = draft.canonical_url?.startsWith("http://") ? draft.canonical_url.replace(/^http:\/\//i, "https://") : draft.canonical_url;

  return {
    ...draft,
    source_url: sourceUrl,
    canonical_url: canonicalUrl,
    summary: result.summary,
    one_sentence_takeaway: result.one_sentence_takeaway,
    why_it_matters: result.why_it_matters,
    target_audience: result.target_audience,
    reading_time_minutes: Math.max(draft.reading_time_minutes, estimateReadingTime(detailDepth)),
    status: "published",
    readability_score: result.readability_score,
    impact_score: result.impact_score,
    actionability_score: result.actionability_score,
    confidence_score: result.confidence_score,
    difficulty: result.difficulty,
    recommended_action: recommendedAction,
    key_facts: sourceFacts.length > 0 ? sourceFacts.slice(0, 6) : result.key_facts,
    opportunities: cleanList(result.opportunities),
    risks: cleanList(result.risks),
    next_steps: cleanList(result.action_layer.next_steps.length > 0 ? result.action_layer.next_steps : result.next_steps),
    image_plan: result.image_plan,
    prompt_version: result.prompt_version,
    detail_depth: detailDepth,
    deep_dive_status: deepDiveStatus,
    brief_detail: {
      tldr: result.brief_detail.tldr,
      beginner_explanation: result.brief_detail.beginner_explanation,
      background: result.brief_detail.background,
      key_points: result.source_facts.length > 0 ? result.source_facts.map((fact) => fact.claim).slice(0, 6) : result.key_facts,
      why_it_matters: result.ai_brief_judgment.why_it_matters,
      core_concepts: result.brief_detail.core_concepts,
      terminology: result.brief_detail.terminology,
      mechanism_explanation: result.brief_detail.mechanism_explanation,
      what_changed: result.brief_detail.what_changed,
      why_now: result.brief_detail.why_now,
      innovation_analysis: result.brief_detail.innovation_analysis,
      value_analysis: result.brief_detail.value_analysis,
      impact_by_audience: result.brief_detail.impact_by_audience,
      risks_and_uncertainties: cleanList(result.brief_detail.limitations_and_risks),
      open_questions: cleanList(result.brief_detail.open_questions),
      practical_examples: cleanList(result.brief_detail.practical_examples),
      examples: cleanExamples(result.brief_detail.examples),
      what_to_look_for: cleanList(result.brief_detail.what_to_look_for),
      good_signs: cleanList(result.brief_detail.good_signs),
      watch_outs: cleanList(result.brief_detail.watch_outs),
      adoption_readiness: result.brief_detail.adoption_readiness,
      action_summary: actionSummary,
      validation_methods: validationMethods,
    },
    ...(deepDiveStatus === "generated" && result.deep_dive
      ? {
          deep_dive: {
            core_question: result.deep_dive.core_question,
            background: result.deep_dive.background,
            core_concepts: result.deep_dive.core_concepts,
            mechanism_explanation: result.deep_dive.mechanism_explanation,
            what_changed: result.deep_dive.what_changed,
            comparison_or_alternatives: result.deep_dive.comparison_or_alternatives,
            why_it_matters_deep: result.deep_dive.why_it_matters_deep,
            risks_and_uncertainties: result.deep_dive.risks_and_uncertainties,
            practical_test_plan: result.deep_dive.practical_test_plan,
            validation_methods: result.deep_dive.validation_methods,
            learning_takeaways: result.deep_dive.learning_takeaways,
            related_playbook_idea: result.deep_dive.related_playbook_idea,
          },
        }
      : {}),
    ...typeSpecificOverrides(draft, result),
  } as AnyContentItem;
}
