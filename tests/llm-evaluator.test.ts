import { contentItems } from "../src/lib/content/seed";
import { evaluateContent, evaluateContentDeterministic } from "../src/lib/ai/evaluation";
import { evaluateContentWithLLM } from "../src/lib/ai/evaluation/evaluator";
import { validateEvaluationResult, type EvaluationInput } from "../src/lib/ai/evaluation/schema";

declare const process: { cwd(): string; env: Record<string, string | undefined> };
declare function require(moduleName: string): unknown;

const { existsSync, mkdirSync, rmSync } = require("node:fs") as {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive: boolean }): void;
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
};
const { join } = require("node:path") as { join(...parts: string[]): string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const testCacheDir = join(process.cwd(), ".tmp", "test-cache", "llm-evaluator");
if (existsSync(testCacheDir)) rmSync(testCacheDir, { recursive: true, force: true });
mkdirSync(testCacheDir, { recursive: true });
process.env.AIBRIEF_EVALUATION_CACHE_PATH = join(testCacheDir, "evaluations.json");

const fixtureInput: EvaluationInput = {
  content_type: "news",
  title: "本地 SVG 生成器进入简报视觉工作流",
  sources: [
    {
      id: "source_official_note",
      source_type: "official",
      source_name: "AI-brief internal note",
      text: "本地 SVG 生成器可以根据内容标题、评分和标签生成封面图。编辑需要审核视觉摘要后再发布。",
    },
  ],
  editorial_context: {
    existing_summary: "AI-brief 现在可以在本地根据内容生成 SVG 封面，不需要调用付费图片 API。",
    editor_note: "这是内部 seed，不是真实新闻正文。",
  },
  metadata: {
    source_type: "official",
    source_count: 1,
    has_official_source: true,
    collected_at: "2026-05-07T12:00:00-04:00",
  },
  input_quality: "mock_fixture",
};

const mockResult = {
  summary: "AI-brief 已经把本地 SVG 封面生成接入内容生产流程，编辑可以在不调用付费图片 API 的情况下获得统一的卡片视觉，并通过审核状态控制公开展示。",
  one_sentence_takeaway: "这让 AI-brief 可以先用低成本方式验证内容视觉工作流。",
  why_it_matters: "图片生产不再依赖外部生成接口，MVP 可以把预算集中在内容评估和真实数据接入上，同时保留后续接入图像模型的接口位置。",
  readability_score: 86,
  impact_score: 74,
  actionability_score: 82,
  confidence_score: 99,
  difficulty: "intermediate",
  recommended_action: "read",
  target_audience: ["pm", "developer"],
  key_facts: ["本地 SVG 可以生成内容封面。", "图片资产需要进入审核状态。", "公开页面只展示已批准图片。"],
  opportunities: ["先验证视觉审核流程是否顺畅。", "降低 MVP 阶段的图片生成成本。"],
  risks: ["本地 SVG 质感可能弱于专业生成图。", "过度依赖占位图会影响媒体产品信任感。"],
  next_steps: ["检查后台媒体审核流程。", "抽样比较卡片封面的点击效果。"],
  input_quality: "mock_fixture",
  depth_level: "standard",
  deep_dive_status: "not_needed",
  card: {
    summary: "AI-brief 已经把本地 SVG 封面生成接入内容生产流程，编辑可以在不调用付费图片 API 的情况下获得统一的卡片视觉，并通过审核状态控制公开展示。",
    one_sentence_takeaway: "这让 AI-brief 可以先用低成本方式验证内容视觉工作流。",
    why_it_matters_short: "图片生产不再依赖外部生成接口，MVP 可以把预算集中在内容评估和真实数据接入上。",
    recommended_action: "read",
    readability_score: 86,
    impact_score: 74,
    actionability_score: 82,
    confidence_score: 99,
    difficulty: "intermediate",
    target_audience: ["pm", "developer"],
  },
  source_facts: [
    { id: "fact_1", claim: "本地 SVG 生成器可以根据标题、评分和标签生成封面图。", source_ids: ["source_official_note"], evidence_text: "本地 SVG 生成器可以根据内容标题、评分和标签生成封面图", confidence: "high" },
    { id: "fact_2", claim: "编辑需要审核视觉摘要后再发布。", source_ids: ["source_official_note"], evidence_text: "编辑需要审核视觉摘要后再发布", confidence: "high" },
  ],
  ai_brief_judgment: {
    main_judgment: "这是一项适合先在内部验证的内容生产能力。",
    why_it_matters: "它可以降低 MVP 阶段的图片生成成本，但真实效果仍需要用发布流程验证。",
    impact_analysis: "产品和开发团队能先验证视觉审核链路，再决定是否接入外部图片模型。",
    based_on_fact_ids: ["fact_1", "fact_2"],
    uncertainty: ["这是 mock fixture，不是真实外部新闻来源。"],
  },
  editorial_diagnosis: {
    content_type: "news",
    depth_level: "standard",
    core_question: "本地视觉工作流是否能支撑 AI-brief 的 MVP 内容生产？",
    why_this_is_worth_covering: "它影响内容卡片的公开质感、编辑成本和媒体审核流程。",
    source_facts_preview: [
      { id: "fact_1", claim: "本地 SVG 生成器可以根据标题、评分和标签生成封面图。", source_ids: ["source_official_note"], evidence_text: "本地 SVG 生成器可以根据内容标题、评分和标签生成封面图", confidence: "high" },
    ],
    recommended_modules: [
      { module: "source_facts", reason: "需要防止把内部 seed 当作外部新闻事实。" },
      { module: "validation_methods", reason: "视觉工作流必须通过审核和前台展示验证。" },
    ],
    modules_to_skip: [{ module: "playbook_conversion", reason: "这是内部管线能力，不需要立即转成大型 Playbook。" }],
    missing_evidence: ["缺少真实用户点击数据。", "缺少与人工配图的质感对比。"],
    playbook_potential: "weak",
    suggested_reader_takeaway: "先保留审核和回退机制，再考虑自动化图片生产。",
    depth_reason: "该输入是 mock fixture，适合标准详情，不应当作真实新闻生成 Deep Dive。",
    learning_value_score: 72,
    learning_focus: ["媒体审核流程", "图片策略与成本控制"],
    confidence_score: 58,
  },
  brief_detail: {
    tldr: "本地 SVG 生成可以先支撑低成本卡片视觉，但必须经过审核后再公开显示。",
    beginner_explanation: "可以把它理解成一个不花 API 费的封面图打样器：它根据标题和标签生成统一风格图，编辑再决定能不能用。",
    background: "AI-brief 的卡片和详情页需要统一的视觉资产，但 MVP 阶段不应把预算全部放在图片 API 上。",
    core_concepts: [
      { name: "本地生成", explanation: "在项目内生成 SVG 资产，不依赖远程图片 API。", why_it_matters_here: "它能控制成本和可重复性。" },
      { name: "审核发布", explanation: "媒体资产先进入待审核状态，只有 approved 才展示。", why_it_matters_here: "避免低质量图像直接影响产品信任。" },
    ],
    terminology: [
      { term: "placeholder", plain_explanation: "没有真实配图时的临时视觉。", why_it_matters: "它决定前台不会出现空白卡片。" },
      { term: "approved media", plain_explanation: "已通过人工审核的媒体资产。", why_it_matters: "公开页面不应展示未审核图。" },
    ],
    mechanism_explanation: "内容字段被转换成 SVG 模板参数，生成后进入媒体审核状态，前台只读取 approved 资产。",
    what_changed: "图片不再只是占位图，而是进入内容生产和审核链路。",
    why_now: "MVP 需要快速展示可用内容，同时避免过早依赖付费图片 API。",
    innovation_analysis: "创新不在图片质量本身，而在把配图、审核和公开展示拆成可控流程。",
    value_analysis: "它让团队先验证视觉资产是否改善内容扫描和点击，再决定是否花钱升级。",
    impact_by_audience: [{ audience: "pm", impact: "可以用它验证卡片视觉是否改善阅读决策。" }],
    limitations_and_risks: ["SVG 质感可能不足。", "mock fixture 不代表真实信源。"],
    open_questions: ["真实内容下视觉策略是否稳定？"],
    practical_examples: ["为一条 News 卡片生成图，然后比较点击和审核通过率。"],
    examples: [
      { scenario: "新闻卡片", explanation: "用统一封面提高扫描效率。", expected_value: "用户更快理解卡片主题。" },
      { scenario: "Playbook 页", explanation: "用流程图暗示步骤。", expected_value: "读者更容易判断是否值得执行。" },
    ],
    what_to_look_for: ["审核通过率", "卡片点击率"],
    good_signs: ["人工修改少", "风格一致"],
    watch_outs: ["术语错误", "封面像广告图"],
    adoption_readiness: "适合 MVP 内部使用，公开发布前需要抽样审核。",
  },
  image_plan: {
    policy: "thumbnail_only",
    reason: "这是内部 mock fixture，只需要卡片级视觉，不需要生成 hero cover。",
    recommended_types: ["rule_card"],
    alt: "一张表示本地封面图审核流程的简洁卡片图。",
  },
  deep_dive: {
    tldr: "本地 SVG 生成适合先作为低成本视觉工作流试点。",
    background: "AI-brief 需要为简报卡片和详情页生成统一视觉资产。",
    core_concepts: [
      { name: "本地生成", explanation: "在项目内生成 SVG 资产，不依赖远程图片 API。", why_it_matters_here: "它能控制成本和可重复性。" },
      { name: "媒体审核", explanation: "生成图进入审核状态后再公开展示。", why_it_matters_here: "它能避免错误视觉直接发布。" },
    ],
    mechanism_explanation: "内容字段被转换成 SVG 模板参数，生成后进入媒体审核状态。",
    what_changed: "图片不再只是占位图，而是进入内容生产流程。",
    impact_by_audience: [{ audience: "pm", impact: "可以验证视觉资产是否提高内容扫描效率。" }],
    limitations_and_risks: ["mock fixture 不能代表真实用户反馈。", "SVG 风格可能不足以支撑高质感媒体首页。"],
    open_questions: ["真实内容接入后生成图是否仍然准确？"],
    practical_examples: ["为一条新闻卡片生成封面并记录点击表现。"],
  },
  action_layer: {
    recommended_action: "read",
    action_type: ["read_only"],
    next_steps: ["检查后台媒体审核流程。", "抽样比较卡片封面的点击效果。"],
    checklist: ["确认生成图有 alt。", "确认公开页面只展示 approved 图片。"],
    validation_methods: ["跑媒体审核页面测试。", "抽样检查卡片视觉一致性。"],
    playbook_candidate: false,
  },
};

async function main() {
  process.env.EVALUATOR_MOCK_LLM_JSON = JSON.stringify(mockResult);
  process.env.DEEPSEEK_API_KEY = "test-key";
  process.env.EVALUATOR_PRIMARY_MODEL = "deepseek-chat";
  process.env.EVALUATOR_TIMEOUT_MS = "100";

  const llmResult = await evaluateContentWithLLM(fixtureInput);
  assert(llmResult.confidence_score !== 99, "hybrid scoring should overwrite LLM confidence");
  assert(llmResult.source_facts.length >= 2, "LLM result should preserve source facts");
  assert(llmResult.ai_brief_judgment.based_on_fact_ids.every((id) => llmResult.source_facts.some((fact) => fact.id === id)), "judgment should cite source facts");
  assert(validateEvaluationResult(llmResult, fixtureInput).length === 0, "LLM result should validate after hybrid scoring");

  const cached = await evaluateContent(fixtureInput, { cacheKeyExtra: "cache-test" });
  delete process.env.EVALUATOR_MOCK_LLM_JSON;
  process.env.EVALUATOR_FAIL_IF_CALLED = "1";
  const cachedAgain = await evaluateContent(fixtureInput, { cacheKeyExtra: "cache-test" });
  assert(cachedAgain.summary === cached.summary, "cache hit should avoid a second LLM call");

  delete process.env.EVALUATOR_FAIL_IF_CALLED;
  delete process.env.DEEPSEEK_API_KEY;
  const fallback = await evaluateContent(fixtureInput, { cacheKeyExtra: "fallback-test" });
  const deterministic = evaluateContentDeterministic(fixtureInput);
  assert(fallback.summary === deterministic.summary, "missing key should return deterministic fallback");

  const snapshotFixtures = ["news", "model", "paper"].map((contentType) => contentItems.find((item) => item.content_type === contentType));
  assert(snapshotFixtures.every(Boolean), "news/model/paper fixtures should exist for smoke snapshots");
}

export default main();
