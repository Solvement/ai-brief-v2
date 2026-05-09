import { contentItems } from "../src/lib/content/seed";
import {
  evaluateContent,
  evaluateContentDeterministic,
  evaluationRubrics,
  normalizeEvaluationResult,
  validateEvaluationResult,
  type EvaluationInput,
  type EvaluationResult,
} from "../src/lib/ai/evaluation";
import { contentTypes } from "../src/lib/content/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  for (const type of contentTypes) {
    assert(evaluationRubrics[type], `rubric should exist for ${type}`);
    assert(evaluationRubrics[type].criteria.length >= 4, `${type} rubric should define scoring criteria`);
  }

  const fixtures = contentItems.filter((item, index, array) => array.findIndex((candidate) => candidate.content_type === item.content_type) === index);

  for (const item of fixtures) {
    const result = await evaluateContent({
      content_type: item.content_type,
      title: item.title,
      sources: [
        {
          id: `${item.id}-source`,
          title: item.title,
          source_name: item.source_name,
          source_type: item.source_name.includes("AI-brief") ? "official" : "media",
          url: item.source_url,
          text: item.summary,
        },
      ],
      editorial_context: {
        existing_why_it_matters: item.why_it_matters,
        editor_note: "Seed fixture used for schema validation.",
      },
      metadata: {
        source_type: item.source_name.includes("AI-brief") ? "official" : "media",
        source_count: 1,
        has_official_source: item.source_name.includes("AI-brief"),
        collected_at: item.collected_at,
      },
      input_quality: "mock_fixture",
    });

    const issues = validateEvaluationResult(result, {
      content_type: item.content_type,
      title: item.title,
      sources: [
        {
          id: `${item.id}-source`,
          source_type: item.source_name.includes("AI-brief") ? "official" : "media",
          text: item.summary,
        },
      ],
      metadata: {
        source_type: item.source_name.includes("AI-brief") ? "official" : "media",
        source_count: 1,
        has_official_source: item.source_name.includes("AI-brief"),
        collected_at: item.collected_at,
      },
      input_quality: "mock_fixture",
    });
    assert(issues.length === 0, `${item.content_type} evaluation should be valid: ${issues.join(", ")}`);
  }

  const deterministic = evaluateContentDeterministic({
    content_type: contentItems[0].content_type,
    title: contentItems[0].title,
    sources: [{ id: "source_1", source_type: "official", text: contentItems[0].summary }],
    metadata: { source_type: "official", source_count: 1, has_official_source: true, collected_at: contentItems[0].collected_at },
    input_quality: "mock_fixture",
  });
  assert(validateEvaluationResult(deterministic, {
    content_type: contentItems[0].content_type,
    title: contentItems[0].title,
    sources: [{ id: "source_1", source_type: "official", text: contentItems[0].summary }],
    metadata: { source_type: "official", source_count: 1, has_official_source: true, collected_at: contentItems[0].collected_at },
    input_quality: "mock_fixture",
  }).length === 0, "deterministic fallback should remain valid");
}

const invalidScore = {
  summary: "这是一个用于测试的中文摘要，包含足够的信息密度和背景说明，避免因为长度或语言规则失败。",
  one_sentence_takeaway: "这是一个用于测试的明确判断句。",
  why_it_matters: "这个测试对象用于验证 schema 对评分范围和合法枚举的约束是否正常工作。",
  readability_score: 101,
  impact_score: 40,
  actionability_score: 40,
  confidence_score: 40,
  difficulty: "beginner",
  recommended_action: "read",
  target_audience: ["pm"],
  key_facts: ["这是一条长度足够的关键事实。", "这是第二条长度足够的关键事实。"],
  opportunities: ["可以验证 schema 对数组长度的约束。", "可以验证 schema 对文本长度的约束。"],
  risks: ["如果校验过松会放过低质量输出。", "如果校验过严会误伤正常中文输出。"],
  next_steps: ["检查评分字段是否为整数。", "确认非法枚举会被拒绝。"],
  input_quality: "raw_excerpt",
  depth_level: "standard",
  card: {
    summary: "这是一个用于测试的中文摘要，包含足够的信息密度和背景说明，避免因为长度或语言规则失败。",
    one_sentence_takeaway: "这是一个用于测试的明确判断句。",
    why_it_matters_short: "这个测试对象用于验证 schema 对评分范围和合法枚举的约束是否正常工作。",
    recommended_action: "read",
    readability_score: 101,
    impact_score: 40,
    actionability_score: 40,
    confidence_score: 40,
    difficulty: "beginner",
    target_audience: ["pm"],
  },
  source_facts: [
    { id: "fact_1", claim: "来源文本明确提供了一个测试事实。", source_ids: ["source_1"], confidence: "high" },
    { id: "fact_2", claim: "来源文本明确提供了第二个测试事实。", source_ids: ["source_1"], confidence: "medium" },
  ],
  ai_brief_judgment: {
    main_judgment: "这个对象可以用于验证 evaluator 的质量门禁。",
    why_it_matters: "它能防止模型把事实、判断和行动混在同一个摘要字段里。",
    impact_analysis: "如果校验过松，低质量分析会进入卡片和详情页。",
    based_on_fact_ids: ["fact_1", "fact_2"],
    uncertainty: ["这是测试对象，不代表真实内容。"],
  },
  deep_dive: {
    tldr: "这是一个标准深度的测试对象，用来验证 evaluator 输出结构。",
    beginner_explanation: "把 evaluator 想成一个编辑助理：它先读来源文本，找出明确事实，再给出 AI-brief 自己的判断，最后告诉读者下一步怎么验证。",
    background: "旧 evaluator 只有卡片字段，无法承载详情页需要的事实、判断和行动层。",
    core_concepts: [
      { name: "结构化评估", explanation: "把输出拆成固定字段，减少自由文本漂移。", why_it_matters_here: "它让页面和质量门禁都有稳定输入。" },
      { name: "事实绑定", explanation: "判断必须引用事实 id。", why_it_matters_here: "它能避免模型无依据生成建议。" },
    ],
    terminology: [
      { term: "Source Facts", plain_explanation: "来源文本明确说了什么。", why_it_matters: "它是后续判断的证据基础。" },
      { term: "Action Layer", plain_explanation: "给用户的下一步建议和验证方法。", why_it_matters: "它让内容能落地。" },
    ],
    mechanism_explanation: "校验器会检查事实 id、输入质量、深度字段和行动建议是否一致。",
    what_changed: "评估结果从扁平字段升级为分层对象。",
    why_now: "AI-brief 正在从资讯卡片走向决策工作台，详情页需要承载更多解释和判断。",
    innovation_analysis: "创新点不是模型摘要，而是把事实、判断、行动和验证拆成可检查的结构。",
    value_analysis: "它能减少用户读完仍不知道该不该行动的问题，也方便编辑审核模型输出。",
    impact_by_audience: [{ audience: "pm", impact: "产品可以区分卡片摘要和详情页深度内容。" }],
    limitations_and_risks: ["测试数据不能代表真实来源。", "模型仍可能生成看似合理但无证据的判断。"],
    open_questions: ["真实抓取正文接入后阈值是否需要调整？"],
    practical_examples: ["用一条真实新闻检查 source_facts 是否都能回到来源文本。"],
    examples: [
      { scenario: "分析一个 GitHub 项目", explanation: "先看 README 说它解决什么问题，再看 stars、issues、release 判断是否值得试。", expected_value: "用户能决定是否花 20 分钟跑 demo。" },
      { scenario: "分析一篇论文", explanation: "先解释核心术语和方法，再指出能否复现。", expected_value: "用户知道该深读还是先收藏。" },
    ],
    what_to_look_for: ["是否有可运行 demo。", "是否有近期维护记录。"],
    good_signs: ["事实引用清楚。", "行动建议有验证方式。"],
    watch_outs: ["把编辑备注写成来源事实。", "没有证据却给强行动建议。"],
    adoption_readiness: "适合进入标准详情页，但发布前仍需要真实来源抽样复核。",
  },
  action_layer: {
    recommended_action: "read",
    action_type: ["deep_read"],
    next_steps: ["检查评分字段是否为整数。", "确认非法枚举会被拒绝。"],
    checklist: ["确认 source_facts 非空。", "确认判断引用了事实 id。"],
    validation_methods: ["运行 schema 测试。", "用 mock_fixture 检查置信度上限。"],
    playbook_candidate: false,
  },
};

assert(validateEvaluationResult(invalidScore).some((issue) => issue.includes("readability_score")), "validator should reject scores outside 0-100");
assert(
  validateEvaluationResult({ ...invalidScore, readability_score: 50, recommended_action: "publish" as EvaluationResult["recommended_action"] }).some((issue) =>
    issue.includes("recommended_action"),
  ),
  "validator should reject illegal recommended actions",
);

const equalScores = { ...invalidScore, readability_score: 75, impact_score: 75, actionability_score: 75, confidence_score: 75 };
assert(validateEvaluationResult(equalScores).some((issue) => issue.includes("score distribution")), "validator should reject lazy all-equal scores");
const englishOnlySummary = {
  ...equalScores,
  summary: "English only summary with enough characters to pass length but not Chinese language requirement.",
  card: {
    ...equalScores.card,
    summary: "English only summary with enough characters to pass length but not Chinese language requirement.",
  },
};
assert(
  /[\u4e00-\u9fff]/.test(normalizeEvaluationResult(englishOnlySummary).summary) &&
    validateEvaluationResult(englishOnlySummary).every((issue) => !issue.includes("Chinese")),
  "normalizer should repair English-only summaries before validation",
);
assert(validateEvaluationResult({ ...equalScores, one_sentence_takeaway: "这个判断句没有标点" }).some((issue) => issue.includes("punctuation")), "validator should reject takeaway without final punctuation");
assert(validateEvaluationResult({ ...equalScores, next_steps: [] }).some((issue) => issue.includes("next_steps")), "validator should reject missing next steps");

const sourceInput: EvaluationInput = {
  content_type: "paper",
  title: "Agent Memory 论文需要转成可复现实验",
  sources: [{ id: "paper_source", source_type: "paper", text: "论文讨论了 Agent Memory 的实验设置、方法限制和复现难点。" }],
  editorial_context: { editor_note: "AI-brief 希望把论文转成可复现实验，但这不是论文原文事实。" },
  metadata: { source_type: "paper", source_count: 1, has_official_source: false, collected_at: "2026-05-07T12:00:00-04:00" },
  input_quality: "raw_excerpt",
};

const noisyLlmEnums = {
  ...invalidScore,
  readability_score: 70,
  recommended_action: "try_it",
  card: { ...invalidScore.card, readability_score: 70, recommended_action: "try_it" },
  action_layer: { ...invalidScore.action_layer, recommended_action: "try_it" },
  editorial_diagnosis: {
    content_type: "tool",
    depth_level: "standard",
    core_question: "这个工具是否值得进入个人 AI 工具箱？",
    why_this_is_worth_covering: "它提供了可以亲测的 AI 工作流能力，适合判断是否值得试用。",
    source_facts_preview: invalidScore.source_facts,
    recommended_modules: [
      { module: "tool_inventory", reason: "LLM 常会把工具清单写成这个同义词。" },
      { module: "hands_on_validation", reason: "LLM 常会把验证计划写成这个同义词。" },
    ],
    modules_to_skip: [{ module: "pricing_model", reason: "来源没有提供价格信息。" }],
    missing_evidence: ["缺少亲测结果。", "缺少替代品对照。"],
    playbook_potential: "weak",
    suggested_reader_takeaway: "先轻量试用，再决定是否收藏。",
    depth_reason: "来源信息足够做标准详情，但还不足以生成深度解读。",
    learning_value_score: 70,
    learning_focus: ["工具工作流", "验证方法"],
    confidence_score: 68,
  },
};

const normalizedNoisyEnums = normalizeEvaluationResult(noisyLlmEnums, sourceInput);
assert(normalizedNoisyEnums.recommended_action === "try", "normalizer should map common LLM action aliases to legal actions");
assert(
  normalizedNoisyEnums.editorial_diagnosis.recommended_modules.some((choice) => choice.module === "validation_methods") &&
    !normalizedNoisyEnums.editorial_diagnosis.recommended_modules.some((choice) => choice.module === ("hands_on_validation" as never)),
  "normalizer should map common LLM module aliases to legal modules",
);
assert(
  !validateEvaluationResult(noisyLlmEnums, sourceInput).some((issue) => issue.includes("recommended_action") || issue.includes("module choices")),
  "validator should not reject normalizable LLM enum aliases",
);

const noisyToolInput: EvaluationInput = {
  ...sourceInput,
  content_type: "tool",
  title: "AI coding tool with runnable README",
  sources: [{ id: "tool_source", source_type: "github", text: "A GitHub AI coding tool with install steps, README, workflow, and tests." }],
  metadata: { source_type: "github", source_count: 1, has_official_source: false, collected_at: "2026-05-08T12:00:00-04:00" },
};

const thinToolOutput = {
  ...noisyLlmEnums,
  recommended_action: "try",
  actionability_score: 76,
  card: { ...noisyLlmEnums.card, recommended_action: "try", actionability_score: 76 },
  action_layer: { ...noisyLlmEnums.action_layer, recommended_action: "try", playbook_candidate: false },
  editorial_diagnosis: { ...noisyLlmEnums.editorial_diagnosis, depth_reason: "短" },
  deep_dive: {
    ...invalidScore.deep_dive,
    terminology: [{ term: "Tool", plain_explanation: "可安装工具。", why_it_matters: "需要验证。" }],
  },
};

const normalizedThinTool = normalizeEvaluationResult(thinToolOutput, noisyToolInput);
assert(normalizedThinTool.action_layer.playbook_candidate, "try-worthy tool evaluations should be normalized into playbook candidates");
assert(normalizedThinTool.editorial_diagnosis.depth_reason.length >= 20, "short depth reasons should be replaced with a useful fallback");
assert(normalizedThinTool.brief_detail.terminology.length >= 2, "brief detail should backfill terminology explanations");

const factWithAiBrief = {
  ...invalidScore,
  readability_score: 70,
  card: { ...invalidScore.card, readability_score: 70 },
  source_facts: [{ id: "fact_1", claim: "AI-brief 建议把论文转成实验。", source_ids: ["paper_source"], confidence: "high" as const }],
  ai_brief_judgment: { ...invalidScore.ai_brief_judgment, based_on_fact_ids: ["fact_1"] },
};
assert(
  validateEvaluationResult(factWithAiBrief, sourceInput).some((issue) => issue.includes("source_facts must not attribute AI-brief")),
  "validator should reject AI-brief editorial context being written as a source fact",
);

const missingFactReference = {
  ...invalidScore,
  readability_score: 70,
  card: { ...invalidScore.card, readability_score: 70 },
  ai_brief_judgment: { ...invalidScore.ai_brief_judgment, based_on_fact_ids: ["missing_fact"] },
};
assert(
  validateEvaluationResult(missingFactReference, sourceInput).some((issue) => issue.includes("unknown source_fact id")),
  "judgment must cite existing source fact ids",
);

const overconfidentMock = {
  ...invalidScore,
  readability_score: 70,
  confidence_score: 88,
  recommended_action: "use_now" as const,
  input_quality: "mock_fixture" as const,
  card: { ...invalidScore.card, readability_score: 70, confidence_score: 88, recommended_action: "use_now" as const },
  action_layer: { ...invalidScore.action_layer, recommended_action: "use_now" as const },
  deep_dive: { ...invalidScore.deep_dive, open_questions: [] },
};
assert(
  validateEvaluationResult(overconfidentMock, { ...sourceInput, input_quality: "mock_fixture" }).some((issue) => issue.includes("mock_fixture")),
  "mock fixtures should not validate as high-confidence immediate-use analysis",
);

const thinDeepDive = {
  ...invalidScore,
  readability_score: 70,
  depth_level: "deep" as const,
  deep_dive_status: "generated" as const,
  card: { ...invalidScore.card, readability_score: 70 },
  source_facts: invalidScore.source_facts.slice(0, 1),
  deep_dive: { ...invalidScore.deep_dive, core_concepts: [], limitations_and_risks: [], open_questions: [] },
};
const normalizedThinDeepDive = normalizeEvaluationResult(thinDeepDive, sourceInput);
assert(
  normalizedThinDeepDive.depth_level === "standard" &&
    normalizedThinDeepDive.deep_dive_status === "needed_not_generated" &&
    !normalizedThinDeepDive.deep_dive,
  "thin deep dives should be downgraded to standard detail instead of being published as deep",
);

const shallowExplainer = {
  ...invalidScore,
  readability_score: 70,
  card: { ...invalidScore.card, readability_score: 70 },
  deep_dive: {
    ...invalidScore.deep_dive,
    beginner_explanation: "",
    terminology: [],
    examples: [],
    innovation_analysis: "",
    value_analysis: "",
    what_to_look_for: [],
    good_signs: [],
    watch_outs: [],
    adoption_readiness: "",
  },
};
assert(
  validateEvaluationResult(shallowExplainer, sourceInput).some((issue) => issue.includes("explainer")),
  "standard/deep detail pages should require beginner explanation, terminology, examples, value, and reading signals",
);

export default main();
