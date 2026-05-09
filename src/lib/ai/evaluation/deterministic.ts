import type { ActionLabel, Audience, Difficulty } from "../../content/types";
import { evaluationRubrics } from "./rubrics";
import {
  DETERMINISTIC_PROMPT_VERSION,
  getEvaluationMetadata,
  getEvaluationSourceText,
  getInputQuality,
  getSourceDocuments,
  normalizeEvaluationResult,
  type EvaluationInput,
  type EvaluationResult,
} from "./schema";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function targetAudienceFor(input: EvaluationInput): Audience[] {
  if (input.content_type === "model" || input.content_type === "tool" || input.content_type === "project") return ["developer", "pm"];
  if (input.content_type === "course") return ["developer", "operator"];
  if (input.content_type === "paper") return ["researcher", "developer"];
  if (input.content_type === "integration") return ["developer", "enterprise"];
  if (input.content_type === "guide") return ["developer", "operator"];
  return ["pm", "operator"];
}

function recommendedActionFor(input: EvaluationInput, confidence: number, actionability: number): ActionLabel {
  if (confidence < 45) return "monitor";
  if (input.content_type === "guide" && actionability >= 80) return "use_now";
  if (["tool", "project", "model", "integration"].includes(input.content_type) && actionability >= 70) return "try";
  if (["article", "paper", "course"].includes(input.content_type)) return "read";
  return confidence >= 70 ? "read" : "monitor";
}

function difficultyFor(input: EvaluationInput): Difficulty {
  if (input.content_type === "paper") return "advanced";
  if (["model", "integration", "project"].includes(input.content_type)) return "intermediate";
  return "beginner";
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function makeSummary(input: EvaluationInput): string {
  const text = cleanText(getEvaluationSourceText(input)).slice(0, 220);
  if (!text) {
    return `这条${input.content_type}内容围绕「${input.title}」展开，但当前没有提供可核查来源文本，只能作为低置信度线索进入人工复核，不能发布为事实判断。`;
  }
  const base = `这条${input.content_type}内容围绕「${input.title}」展开，核心信息是：${text}`;
  if (base.length >= 60) return base.slice(0, 600);
  return `${base}。目前信息仍需要编辑复核来源、影响对象和下一步动作，避免把未验证内容直接发布。`;
}

export function deterministicConfidenceScore(input: EvaluationInput): number {
  const metadata = getEvaluationMetadata(input);
  const qualityPenalty = ["mock_fixture", "editorial_seed", "unknown"].includes(getInputQuality(input)) ? 35 : 0;
  return clampScore(42 + metadata.source_count * 12 + (metadata.has_official_source ? 28 : 0) - qualityPenalty);
}

export function evaluateContentDeterministic(input: EvaluationInput): EvaluationResult {
  const rubric = evaluationRubrics[input.content_type];
  const sourceText = getEvaluationSourceText(input);
  const lengthPenalty = sourceText.length > 900 ? 10 : sourceText.length < 120 ? 8 : 0;
  const confidence = deterministicConfidenceScore(input);
  const actionability = clampScore(52 + (["guide", "tool", "project", "integration", "model"].includes(input.content_type) ? 24 : 8));
  const impact = clampScore(58 + (["news", "model", "integration"].includes(input.content_type) ? 18 : 10));
  const readability = clampScore(84 - lengthPenalty - (input.content_type === "paper" ? 14 : 0));
  const metadata = getEvaluationMetadata(input);
  const sources = getSourceDocuments(input);
  const sourceFacts = sources.slice(0, 3).map((source, index) => ({
    id: `fact_${index + 1}`,
    claim: cleanText(source.text).slice(0, 90) || "来源文本为空，需要编辑复核。",
    source_ids: [source.id],
    evidence_text: cleanText(source.text).slice(0, 120),
    confidence: source.source_type === "official" ? "high" as const : "medium" as const,
  }));
  const fallbackFacts = sourceFacts.length > 0 ? sourceFacts : [{ id: "fact_1", claim: "当前输入没有提供可核查来源文本，需要编辑补充真实来源。", source_ids: ["unknown_source"], confidence: "low" as const }];
  const recommendedAction = recommendedActionFor(input, confidence, actionability);

  return normalizeEvaluationResult({
    summary: makeSummary(input),
    one_sentence_takeaway: `这条内容需要先按「${rubric.criteria[0]}」判断，再决定是否行动。`,
    why_it_matters: `它关系到 AI-brief 是否能把${input.content_type}内容从信息转成判断和行动，编辑需要同时检查事实、可信度、适用人群和可验证下一步。`,
    readability_score: readability,
    impact_score: impact,
    actionability_score: actionability,
    confidence_score: confidence,
    difficulty: difficultyFor(input),
    recommended_action: recommendedAction,
    target_audience: targetAudienceFor(input),
    key_facts: [
      `内容类型是 ${input.content_type}，需要套用对应 rubric。`,
      `来源类型是 ${metadata.source_type}，来源数量为 ${metadata.source_count}。`,
      `当前首要评估维度是 ${rubric.criteria[0]}。`,
    ],
    opportunities: [
      `可以用它补强「${rubric.criteria[0]}」相关判断。`,
      "可以转成编辑审核清单，提升发布前质量控制。",
    ],
    risks: [
      `如果不检查${rubric.criteria[rubric.criteria.length - 1]}，行动建议可能失真。`,
      "如果来源证据不足，置信度需要降低并进入人工审核。",
    ],
    next_steps: [
      "核对原始来源和发布时间。",
      `按 ${input.content_type} rubric 复核评分。`,
      "决定应该阅读、试用、保存还是继续监控。",
    ],
    input_quality: getInputQuality(input),
    depth_level: getInputQuality(input) === "raw_full_text" ? "standard" : "brief",
    card: {
      summary: makeSummary(input),
      one_sentence_takeaway: `这条内容需要先按「${rubric.criteria[0]}」判断，再决定是否行动。`,
      why_it_matters_short: `它关系到 AI-brief 是否能把${input.content_type}内容从信息转成判断和行动。`,
      recommended_action: recommendedAction,
      readability_score: readability,
      impact_score: impact,
      actionability_score: actionability,
      confidence_score: confidence,
      difficulty: difficultyFor(input),
      target_audience: targetAudienceFor(input),
    },
    source_facts: fallbackFacts,
    ai_brief_judgment: {
      main_judgment: `这条内容需要先按「${rubric.criteria[0]}」判断，再决定是否行动。`,
      why_it_matters: `它关系到 AI-brief 是否能把${input.content_type}内容从信息转成判断和行动，编辑需要同时检查事实、可信度、适用人群和可验证下一步。`,
      impact_analysis: `如果${rubric.criteria[0]}判断不清，后续推荐动作会失真。`,
      based_on_fact_ids: fallbackFacts.slice(0, 2).map((fact) => fact.id),
      uncertainty: getInputQuality(input) === "mock_fixture" ? ["当前输入是 mock fixture，需要真实来源验证。"] : ["当前输入仍需要更多来源交叉验证。"],
    },
    deep_dive: {
      tldr: makeSummary(input),
      beginner_explanation: `把「${input.title}」当成一个候选线索看：先确认它到底解决什么问题，再看它如何工作，最后用小任务验证是否真的节省时间或降低风险。`,
      background: "当前 evaluator 先抽取来源事实，再给出 AI-brief 判断和行动建议。",
      core_concepts: [
        { name: "Source Facts", explanation: "只记录来源文本明确支持的信息。", why_it_matters_here: "它避免把编辑判断写成原文事实。" },
        { name: "Action Validation", explanation: "行动建议必须能被验证。", why_it_matters_here: "它让读者知道做完后如何判断成功。" },
      ],
      terminology: [
        { term: "Source Facts", plain_explanation: "来源文本明确说了什么。", why_it_matters: "它决定判断是否有依据。" },
        { term: "Validation", plain_explanation: "用什么方法确认它真的有效。", why_it_matters: "它避免只被热度或宣传带着走。" },
      ],
      mechanism_explanation: "deterministic fallback 根据来源数量、官方源和输入质量生成保守评估。",
      what_changed: `这条内容被归入 ${input.content_type} rubric。`,
      why_now: "当前 AI 工具和模型变化很快，任何看起来重要的项目都需要先进入结构化评估。",
      innovation_analysis: "当前 fallback 不能判断真实创新，只能提示编辑去比较同类工具、实现机制和可验证结果。",
      value_analysis: "如果它能在真实任务里减少时间、成本或错误率，就值得继续跟进；否则只应监控。",
      impact_by_audience: targetAudienceFor(input).slice(0, 2).map((audience) => ({ audience, impact: "需要先看事实证据，再决定是否行动。" })),
      limitations_and_risks: ["deterministic fallback 不能替代真实 LLM 分析。", "低质量输入必须进入人工复核。"],
      open_questions: getInputQuality(input) === "mock_fixture" ? ["需要用真实来源文本重新评估。"] : ["是否有更多来源能交叉验证？"],
      practical_examples: ["选择一条真实内容，核对每个 fact 是否能回到来源文本。"],
      examples: [
        { scenario: "跑一个最小 demo", explanation: "选择低风险任务，用最短路径验证它是否能工作。", expected_value: "知道它是不是值得进入工具箱。" },
        { scenario: "和当前方案对比", explanation: "用同一个任务比较新项目和现有工具。", expected_value: "判断优势来自真实能力还是只是热度。" },
      ],
      what_to_look_for: ["README 是否能让人快速跑通。", "是否有近期提交、release 和问题响应。"],
      good_signs: ["来源事实清楚。", "有验证方法和失败处理。"],
      watch_outs: ["缺少 benchmark。", "热度高但 issue 堆积。"],
      adoption_readiness: "只适合作为候选项进入小范围验证。",
    },
    action_layer: {
      recommended_action: recommendedAction,
      next_steps: [
        "核对原始来源和发布时间。",
        `按 ${input.content_type} rubric 复核评分。`,
        "决定应该阅读、试用、保存还是继续监控。",
      ],
      checklist: ["事实都有 source id。", "判断引用了 fact id。", "行动建议有验证方式。"],
      validation_methods: ["运行 schema validation。", "人工抽样核对 source_facts。"],
      playbook_candidate: actionability >= 70,
    },
    prompt_version: DETERMINISTIC_PROMPT_VERSION,
  }, input);
}
