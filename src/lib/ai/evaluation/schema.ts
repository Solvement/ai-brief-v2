import {
  actionLabels,
  audiences,
  contentTypes,
  imagePolicies,
  isScore,
  recommendedImageTypes,
  type ActionLabel,
  type Audience,
  type ContentType,
  type Difficulty,
  type ImagePlan,
  type ImagePolicy,
  type RecommendedImageType,
} from "../../content/types";
import type { GitHubRepoStats } from "../../ingestion/github";

export type SourceType = "official" | "media" | "community" | "github" | "paper" | "course" | "manual" | "unknown";
export type InputQuality = "raw_full_text" | "raw_excerpt" | "multi_source_summary" | "editorial_seed" | "mock_fixture" | "unknown";
export type FactConfidence = "high" | "medium" | "low";
export type DetailDepth = "card_only" | "brief" | "standard" | "deep";
export type DepthLevel = DetailDepth;
export type DeepDiveStatus = "not_needed" | "needed_not_generated" | "generated" | "needs_human_review";
export type AnalysisModule =
  | "source_facts"
  | "ai_brief_judgment"
  | "background"
  | "core_concepts"
  | "mechanism_explanation"
  | "what_changed"
  | "impact_by_audience"
  | "risks_and_uncertainties"
  | "practical_test_plan"
  | "action_checklist"
  | "validation_methods"
  | "alternatives"
  | "implementation_notes"
  | "playbook_conversion"
  | "learning_notes"
  | "problem_solved"
  | "workflow"
  | "architecture"
  | "setup_cost"
  | "permission_safety"
  | "maintenance"
  | "hands_on_test_plan"
  | "should_add_to_toolbox"
  | "capability_changes"
  | "benchmark_meaning"
  | "cost_latency"
  | "context_window"
  | "tool_use"
  | "migration_advice"
  | "test_prompts"
  | "best_use_cases"
  | "core_thesis"
  | "research_question"
  | "method"
  | "evidence"
  | "limitations"
  | "compared_with_prior_work"
  | "practical_translation"
  | "what_to_learn"
  | "outcome"
  | "prerequisites"
  | "steps"
  | "prompt_copy"
  | "expected_result"
  | "common_failure"
  | "fallback"
  | "install_decision"
  | "skill_inventory"
  | "trigger_rules"
  | "quick_validation_test";
export type PlaybookPotential = "none" | "weak" | "strong";
export type SkillInstallVerdict = "install" | "try" | "extract" | "skip" | "monitor";
export type ActionType =
  | "read_only"
  | "monitor"
  | "deep_read"
  | "hands_on_test"
  | "defensive_lab"
  | "convert_to_playbook"
  | "use_now"
  | "learning_playbook";

export interface SourceDocument {
  id: string;
  title?: string;
  url?: string;
  source_name?: string;
  source_type: SourceType;
  published_at?: string;
  text: string;
}

export interface EditorialContext {
  existing_summary?: string;
  existing_why_it_matters?: string;
  editor_note?: string;
}

export interface EvaluationMetadata {
  source_type: SourceType;
  source_count: number;
  has_official_source: boolean;
  collected_at: string;
}

export interface EvaluationInput {
  content_type: ContentType;
  title: string;
  sources?: SourceDocument[];
  editorial_context?: EditorialContext;
  metadata?: EvaluationMetadata;
  input_quality?: InputQuality;
  github_stats?: GitHubRepoStats;

  /** @deprecated Use sources[].text. Kept for older import/test callers. */
  raw_text?: string;
  /** @deprecated Use metadata.source_type. */
  source_type?: SourceType;
  /** @deprecated Use metadata.source_count. */
  source_count?: number;
  /** @deprecated Use metadata.has_official_source. */
  has_official_source?: boolean;
}

export interface EvaluationCard {
  summary: string;
  one_sentence_takeaway: string;
  why_it_matters_short: string;
  recommended_action: ActionLabel;
  readability_score: number;
  impact_score: number;
  actionability_score: number;
  confidence_score: number;
  difficulty: Difficulty;
  target_audience: Audience[];
}

export interface SourceFact {
  id: string;
  claim: string;
  source_ids: string[];
  evidence_text?: string;
  confidence: FactConfidence;
}

export interface AiBriefJudgment {
  main_judgment: string;
  why_it_matters: string;
  impact_analysis: string;
  based_on_fact_ids: string[];
  uncertainty: string[];
}

export interface ModuleChoice {
  module: AnalysisModule;
  reason: string;
}

export interface EditorialDiagnosis {
  content_type: ContentType;
  depth_level: DetailDepth;
  core_question: string;
  why_this_is_worth_covering: string;
  source_facts_preview: SourceFact[];
  recommended_modules: ModuleChoice[];
  modules_to_skip: ModuleChoice[];
  missing_evidence: string[];
  playbook_potential: PlaybookPotential;
  suggested_reader_takeaway: string;
  depth_reason: string;
  learning_value_score: number;
  learning_focus: string[];
  confidence_score: number;
}

export interface CoreConcept {
  name: string;
  explanation: string;
  why_it_matters_here: string;
}

export interface BriefDetail {
  tldr: string;
  beginner_explanation: string;
  background: string;
  core_concepts: CoreConcept[];
  terminology: Array<{ term: string; plain_explanation: string; why_it_matters: string }>;
  mechanism_explanation: string;
  what_changed: string;
  why_now: string;
  innovation_analysis: string;
  value_analysis: string;
  impact_by_audience: Array<{ audience: Audience; impact: string }>;
  limitations_and_risks: string[];
  open_questions: string[];
  practical_examples: string[];
  examples: Array<{ scenario: string; explanation: string; expected_value: string }>;
  what_to_look_for: string[];
  good_signs: string[];
  watch_outs: string[];
  adoption_readiness: string;
}

export interface DeepDive {
  core_question: string;
  background: string;
  core_concepts: CoreConcept[];
  mechanism_explanation: string;
  what_changed: string;
  comparison_or_alternatives: string[];
  why_it_matters_deep: string;
  impact_by_audience: Array<{ audience: Audience; impact: string }>;
  risks_and_uncertainties: string[];
  practical_test_plan: string[];
  validation_methods: string[];
  learning_takeaways: string[];
  related_playbook_idea: string;
}

export interface ActionLayer {
  recommended_action: ActionLabel;
  action_type: ActionType[];
  next_steps: string[];
  checklist: string[];
  validation_methods: string[];
  playbook_candidate: boolean;
  safety_boundary?: string;
}

export interface SkillInventoryItem {
  name: string;
  purpose: string;
  trigger: string;
  best_rules: string[];
  weak_points: string[];
}

export interface SkillRuleAssessment {
  rule: string;
  why_it_matters: string;
  evidence?: string;
}

export interface QuickValidationTest {
  title: string;
  estimated_minutes: number;
  steps: string[];
  expected_signals: string[];
  failure_signals: string[];
}

export interface SkillAnalysis {
  install_verdict: SkillInstallVerdict;
  supported_tools: string[];
  use_cases: string[];
  not_for: string[];
  skill_inventory: SkillInventoryItem[];
  best_rules: SkillRuleAssessment[];
  weak_rules: SkillRuleAssessment[];
  design_takeaways: string[];
  installation_steps: string[];
  quick_validation_test: QuickValidationTest;
  install_worthiness_score: number;
  trigger_clarity_score: number;
  behavior_specificity_score: number;
  verification_score: number;
  context_cost_score: number;
  conflict_risk_score: number;
  contains_reusable_engineering_workflow: boolean;
}

export interface EvaluationResult {
  // Compatibility fields used by cards and existing content import paths.
  summary: string;
  one_sentence_takeaway: string;
  why_it_matters: string;
  readability_score: number;
  impact_score: number;
  actionability_score: number;
  confidence_score: number;
  source_confidence: number;
  judgment_confidence: number;
  practical_confidence: number;
  difficulty: Difficulty;
  recommended_action: ActionLabel;
  target_audience: Audience[];
  key_facts: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];

  input_quality: InputQuality;
  depth_level: DetailDepth;
  card: EvaluationCard;
  source_facts: SourceFact[];
  ai_brief_judgment: AiBriefJudgment;
  editorial_diagnosis: EditorialDiagnosis;
  brief_detail: BriefDetail;
  deep_dive_status: DeepDiveStatus;
  deep_dive?: DeepDive;
  action_layer: ActionLayer;
  skill_analysis?: SkillAnalysis;
  /** AI-suggested image plan. Always emitted; editors decide whether to act. */
  image_plan: ImagePlan;
  /**
   * Stamp identifying which generation produced this result.
   * - `eval-v\d+` — produced by the LLM evaluator under that prompt version.
   * - `deterministic-v\d+` — produced by the deterministic fallback.
   * The LLM is NOT asked to fill this; the evaluator stamps it server-side.
   */
  prompt_version: string;
}

/** Source of truth for the deterministic fallback's stamp. */
export const DETERMINISTIC_PROMPT_VERSION = "deterministic-v1" as const;
const promptVersionPattern = /^(eval-v\d+|deterministic-v\d+)$/;

type EvaluationResultDraft = Partial<Record<keyof EvaluationResult, any>> & {
  card?: Record<string, any>;
  source_facts?: any[];
  ai_brief_judgment?: Record<string, any>;
  editorial_diagnosis?: Record<string, any>;
  brief_detail?: Record<string, any>;
  deep_dive?: Record<string, any>;
  deep_dive_status?: DeepDiveStatus;
  action_layer?: Record<string, any>;
  skill_analysis?: Record<string, any>;
  image_plan?: Record<string, any>;
  prompt_version?: string;
};

const lowInputQualities: InputQuality[] = ["mock_fixture", "editorial_seed", "unknown"];
const analysisModules: AnalysisModule[] = [
  "source_facts",
  "ai_brief_judgment",
  "background",
  "core_concepts",
  "mechanism_explanation",
  "what_changed",
  "impact_by_audience",
  "risks_and_uncertainties",
  "practical_test_plan",
  "action_checklist",
  "validation_methods",
  "alternatives",
  "implementation_notes",
  "playbook_conversion",
  "learning_notes",
  "problem_solved",
  "workflow",
  "architecture",
  "setup_cost",
  "permission_safety",
  "maintenance",
  "hands_on_test_plan",
  "should_add_to_toolbox",
  "capability_changes",
  "benchmark_meaning",
  "cost_latency",
  "context_window",
  "tool_use",
  "migration_advice",
  "test_prompts",
  "best_use_cases",
  "core_thesis",
  "research_question",
  "method",
  "evidence",
  "limitations",
  "compared_with_prior_work",
  "practical_translation",
  "what_to_learn",
  "outcome",
  "prerequisites",
  "steps",
  "prompt_copy",
  "expected_result",
  "common_failure",
  "fallback",
  "install_decision",
  "skill_inventory",
  "trigger_rules",
  "quick_validation_test",
];
const playbookPotentials: PlaybookPotential[] = ["none", "weak", "strong"];
const skillInstallVerdicts: SkillInstallVerdict[] = ["install", "try", "extract", "skip", "monitor"];
const actionTypes: ActionType[] = ["read_only", "monitor", "deep_read", "hands_on_test", "defensive_lab", "convert_to_playbook", "use_now", "learning_playbook"];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function textOrFallback(value: unknown, fallback: string, minLength = 1): string {
  return typeof value === "string" && value.trim().length >= minLength ? value.trim() : fallback;
}

function ensureArray<T>(value: T[] | undefined, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

function ensureMinArray<T>(value: T[] | undefined, fallback: T[], minLength: number): T[] {
  const current = Array.isArray(value) ? value : [];
  if (current.length >= minLength) return current;
  const merged = [...current, ...fallback];
  return merged.slice(0, Math.max(minLength, Math.min(merged.length, 6)));
}

function clampText(value: string, maxLength = 200): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function hasMostlyChineseText(value: string): boolean {
  const cjkCharacters = value.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  return value.length === 0 || cjkCharacters / value.length >= 0.3;
}

function chineseSummaryFallback(input: EvaluationInput | undefined, fallback: string): string {
  if (hasMostlyChineseText(fallback) && fallback.trim().length >= 60) return fallback;
  const title = input?.title ? `《${input.title}》` : "这条内容";
  if (input?.content_type === "course") {
    return `${title}的来源文本没有提供足够的中文课程说明，当前只能保留为待复核线索；发布前需要补齐适合人群、学习产出、时间成本和项目练习证据。`;
  }
  return `${title}的来源文本不足以形成可发布摘要，当前只能作为待复核线索；发布前需要补齐来源事实、AI-brief 判断和可验证行动。`;
}

function normalizeStringList(value: string[] | undefined, fallback: string[], minLength: number): string[] {
  const cleaned = (Array.isArray(value) ? value : [])
    .filter((item) => typeof item === "string" && item.trim().length >= 6)
    .map((item) => clampText(item));
  const cleanedFallback = fallback
    .filter((item) => typeof item === "string" && item.trim().length >= 6)
    .map((item) => clampText(item));
  return ensureMinArray(cleaned, cleanedFallback, minLength)
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => clampText(item))
    .slice(0, 6);
}

function defaultLearningFocus(input: EvaluationInput | undefined, briefDetail: BriefDetail): string[] {
  const concepts = briefDetail.core_concepts.map((concept) => concept.name).filter(nonEmpty);
  if (concepts.length >= 2) return concepts.slice(0, 5);
  if (!input) return ["事实判断分离", "可验证行动建议"];
  if (["tool", "project", "integration"].includes(input.content_type)) return ["工作流机制", "安装和权限成本", "亲测验证方法"];
  if (input.content_type === "paper" || input.content_type === "article") return ["核心论点", "证据强度", "实践转译"];
  if (input.content_type === "model") return ["能力变化", "成本速度", "适用场景"];
  return ["影响判断", "行动边界"];
}

function defaultActionTypes(input: EvaluationInput | undefined, action: ActionLabel, actionability: number, playbookCandidate: boolean): ActionType[] {
  if (action === "use_now") return ["use_now"];
  if (action === "monitor" || action === "avoid") return ["monitor"];
  if (!input) return ["deep_read"];
  if (["tool", "project", "integration", "guide"].includes(input.content_type) && actionability >= 70) {
    return playbookCandidate ? ["hands_on_test", "convert_to_playbook"] : ["hands_on_test"];
  }
  if (input.content_type === "article" || input.content_type === "paper") return ["deep_read", "learning_playbook"];
  if (input.content_type === "news") return ["deep_read"];
  return ["read_only"];
}

function isSecurityAdjacent(input: EvaluationInput | undefined): boolean {
  if (!input) return false;
  const sourceText = getEvaluationSourceText(input);
  return /security|vulnerability|exploit|sandbox|cyber|安全|漏洞|攻击|沙箱|Firefox|harness/i.test(`${input.title}\n${sourceText}`);
}

export function isSkillLikeInput(input: EvaluationInput | undefined): boolean {
  if (!input) return false;
  const text = `${input.title}\n${getEvaluationSourceText(input)}`;
  return /\bskill(?:s)?\b|skill pack|SKILL\.md|slash command|agent skill|rules file|verification gate|anti-rationalization|技能包|规则文件|触发条件|验证门禁/i.test(text);
}

function hasReusableEngineeringWorkflow(input: EvaluationInput | undefined, skillAnalysis?: Record<string, any>): boolean {
  if (typeof skillAnalysis?.contains_reusable_engineering_workflow === "boolean") {
    return skillAnalysis.contains_reusable_engineering_workflow;
  }
  if (!input) return false;
  const text = `${input.title}\n${getEvaluationSourceText(input)}`;
  if (/does not define (?:a )?reusable|not a reusable|no reusable engineering workflow|single-purpose|single purpose/i.test(text)) {
    return false;
  }
  return /workflow|workflows|quality gate|verification gate|checkpoint|exit criteria|TDD|test-driven|spec|plan|build|review|ship|engineering lifecycle|anti-rationalization|工程流程|验证门禁|工作流/i.test(text);
}

function scoreOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && isScore(value) ? value : fallback;
}

function normalizeDetailDepth(value: unknown, fallback: DetailDepth): DetailDepth {
  if (value === "quick") return "brief";
  if (value === "card_only" || value === "brief" || value === "standard" || value === "deep") return value;
  return fallback;
}

function isRequestedDeepDive(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && "core_question" in value && "why_it_matters_deep" in value;
}

function cjkLength(value: string): number {
  return value.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
}

function deepDiveChineseLength(deepDive: DeepDive): number {
  return cjkLength(
    [
      deepDive.core_question,
      deepDive.background,
      deepDive.mechanism_explanation,
      deepDive.what_changed,
      ...deepDive.comparison_or_alternatives,
      deepDive.why_it_matters_deep,
      deepDive.related_playbook_idea,
      ...deepDive.core_concepts.flatMap((concept) => [concept.name, concept.explanation, concept.why_it_matters_here]),
      ...deepDive.impact_by_audience.map((item) => item.impact),
      ...deepDive.risks_and_uncertainties,
      ...deepDive.practical_test_plan,
      ...deepDive.validation_methods,
      ...deepDive.learning_takeaways,
    ].join("\n"),
  );
}

function hasGeneratedDeepDive(deepDive: DeepDive | undefined): deepDive is DeepDive {
  if (!deepDive) return false;
  return (
    deepDiveChineseLength(deepDive) >= 1500 &&
    deepDive.core_concepts.length >= 3 &&
    nonEmpty(deepDive.mechanism_explanation) &&
    deepDive.comparison_or_alternatives.length >= 1 &&
    deepDive.practical_test_plan.length >= 1 &&
    deepDive.validation_methods.length >= 2 &&
    deepDive.risks_and_uncertainties.length >= 3 &&
    deepDive.learning_takeaways.length >= 3
  );
}

function inferSupportedTools(input: EvaluationInput | undefined, provided: unknown): string[] {
  if (Array.isArray(provided) && provided.every((tool) => typeof tool === "string") && provided.length > 0) {
    return provided;
  }
  const text = input ? `${input.title}\n${getEvaluationSourceText(input)}` : "";
  const knownTools = ["Claude Code", "Cursor", "Gemini CLI", "Windsurf", "OpenCode", "GitHub Copilot", "Codex", "OpenAI Codex", "VS Code"];
  const matches = knownTools.filter((tool) => new RegExp(tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text));
  return matches.length > 0 ? [...new Set(matches.map((tool) => (tool === "OpenAI Codex" ? "Codex" : tool)))] : ["需要从 README 或安装文档确认"];
}

function inferSkillInventory(input: EvaluationInput | undefined, provided: unknown): SkillInventoryItem[] {
  if (Array.isArray(provided) && provided.length > 0) {
    return provided.map((item, index) => ({
      name: nonEmpty(item?.name) ? item.name : `skill_${index + 1}`,
      purpose: nonEmpty(item?.purpose) ? item.purpose : "需要从 skill 文档确认用途。",
      trigger: nonEmpty(item?.trigger) ? item.trigger : "触发条件需要人工确认。",
      best_rules: ensureArray(item?.best_rules, ["规则需要能改变 agent 的具体行为。"]),
      weak_points: ensureArray(item?.weak_points, ["仍需要实测是否被 agent 稳定遵守。"]),
    }));
  }
  const text = input ? getEvaluationSourceText(input) : "";
  const slashCommands = [...new Set(text.match(/\/[a-z][a-z-]*/gi) ?? [])].slice(0, 8);
  if (slashCommands.length > 0) {
    return slashCommands.map((command) => ({
      name: command,
      purpose: `围绕 ${command} 对应阶段约束 agent 行为。`,
      trigger: `当任务进入 ${command.replace("/", "")} 相关阶段时触发。`,
      best_rules: ["把任务拆成步骤，并要求留下验证证据。"],
      weak_points: ["需要确认当前 agent 工具是否支持按阶段加载或调用该 skill。"],
    }));
  }
  return [
    {
      name: "primary_skill",
      purpose: "约束 agent 在特定任务中的行为。",
      trigger: "触发条件需要从 SKILL.md 或 README 中确认。",
      best_rules: ["应包含明确步骤、触发条件和验证方式。"],
      weak_points: ["如果只有抽象原则，安装价值会下降。"],
    },
  ];
}

function normalizeRuleAssessments(value: unknown, fallback: SkillRuleAssessment[]): SkillRuleAssessment[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.map((item) => ({
    rule: nonEmpty(item?.rule) ? item.rule : "未命名规则",
    why_it_matters: nonEmpty(item?.why_it_matters) ? item.why_it_matters : "需要说明它如何改变 agent 行为。",
    evidence: nonEmpty(item?.evidence) ? item.evidence : undefined,
  }));
}

function normalizeQuickValidationTest(value: unknown): QuickValidationTest {
  const record = (typeof value === "object" && value !== null ? value : {}) as Record<string, any>;
  return {
    title: nonEmpty(record.title) ? record.title : "10-20 分钟轻量验证 skill 是否改变 agent 行为",
    estimated_minutes: typeof record.estimated_minutes === "number" && record.estimated_minutes > 0 ? Math.round(record.estimated_minutes) : 20,
    steps: ensureArray(record.steps, [
      "选择一个低风险小任务，先在不加载 skill 的情况下运行一次。",
      "加载或临时复制该 skill 后，用同一任务再运行一次。",
      "比较两次输出中的步骤、验证证据、diff 范围和人工提醒次数。",
    ]),
    expected_signals: ensureArray(record.expected_signals, [
      "agent 明确触发了 skill 中的规则。",
      "输出包含更具体的步骤、验证命令或证据。",
    ]),
    failure_signals: ensureArray(record.failure_signals, [
      "agent 完全没有提到或遵守 skill 规则。",
      "启用后只增加上下文长度，没有改善结果。",
    ]),
  };
}

function normalizeSkillAnalysis(result: EvaluationResultDraft, input: EvaluationInput | undefined, card: EvaluationCard): SkillAnalysis | undefined {
  const rawSkill = result.skill_analysis;
  const skillLike = isSkillLikeInput(input) || Boolean(rawSkill);
  if (!skillLike) return undefined;

  const reusableWorkflow = hasReusableEngineeringWorkflow(input, rawSkill);
  const installVerdict = skillInstallVerdicts.includes(rawSkill?.install_verdict)
    ? (rawSkill.install_verdict as SkillInstallVerdict)
    : card.confidence_score < 45
      ? "monitor"
      : card.actionability_score >= 78
        ? "try"
        : "extract";

  return {
    install_verdict: installVerdict,
    supported_tools: inferSupportedTools(input, rawSkill?.supported_tools),
    use_cases: ensureArray(rawSkill?.use_cases, [
      "在低风险 coding agent 任务中测试它是否改变 agent 的默认行为。",
      "抽取其中最具体的触发规则、验证门禁和反偷懒规则。",
    ]),
    not_for: ensureArray(rawSkill?.not_for, [
      "不适合未经验证就全量安装到生产级 agent 工作流。",
      "不适合替代系统级权限、sandbox 或人工 code review。",
    ]),
    skill_inventory: inferSkillInventory(input, rawSkill?.skill_inventory),
    best_rules: normalizeRuleAssessments(rawSkill?.best_rules, [
      {
        rule: "把抽象工程原则写成触发条件、步骤和验证证据。",
        why_it_matters: "这能让用户判断 skill 是否真的改变 agent 行为。",
      },
      {
        rule: "要求 agent 留下测试、diff、日志或检查清单等可审核证据。",
        why_it_matters: "没有证据的 skill 很难证明安装价值。",
      },
    ]),
    weak_rules: normalizeRuleAssessments(rawSkill?.weak_rules, [
      {
        rule: "触发条件过宽或过窄都会降低安装价值。",
        why_it_matters: "过宽会增加上下文成本，过窄会让 skill 很少被调用。",
      },
      {
        rule: "如果只写理念、不写验证方式，应该优先 extract 而不是 install。",
        why_it_matters: "AI-brief 的第一目标是判断能否安装和使用。",
      },
    ]),
    design_takeaways: ensureArray(rawSkill?.design_takeaways, [
      "好的 skill 先服务安装判断，再服务机制学习。",
      "触发条件、行为规则和验证方式比抽象原则更重要。",
      "只有包含可复用工程流程的 skill pack 才应升级成大型 Playbook。",
    ]),
    installation_steps: ensureArray(rawSkill?.installation_steps, installVerdict === "install" || installVerdict === "try"
      ? [
          "确认当前 agent 工具支持该 skill 或规则文件格式。",
          "先只安装或复制一个最相关 skill，不要一次性全量启用。",
          "用 quick_validation_test 中的小任务验证行为变化。",
        ]
      : ["暂不安装；先抽取规则或继续观察维护状态。"]),
    quick_validation_test: normalizeQuickValidationTest(rawSkill?.quick_validation_test),
    install_worthiness_score: scoreOrFallback(rawSkill?.install_worthiness_score, Math.min(100, Math.round(card.actionability_score * 0.65 + card.confidence_score * 0.25 + (reusableWorkflow ? 10 : 0)))),
    trigger_clarity_score: scoreOrFallback(rawSkill?.trigger_clarity_score, /trigger|when|触发|slash command|\/[a-z]/i.test(input ? getEvaluationSourceText(input) : "") ? 78 : 55),
    behavior_specificity_score: scoreOrFallback(rawSkill?.behavior_specificity_score, /step|steps|checkpoint|verification|gate|evidence|步骤|验证|证据/i.test(input ? getEvaluationSourceText(input) : "") ? 82 : 58),
    verification_score: scoreOrFallback(rawSkill?.verification_score, /test|verify|validation|evidence|gate|测试|验证|证据/i.test(input ? getEvaluationSourceText(input) : "") ? 82 : 52),
    context_cost_score: scoreOrFallback(rawSkill?.context_cost_score, reusableWorkflow ? 62 : 42),
    conflict_risk_score: scoreOrFallback(rawSkill?.conflict_risk_score, reusableWorkflow ? 58 : 40),
    contains_reusable_engineering_workflow: reusableWorkflow,
  };
}

export function getEvaluationMetadata(input: EvaluationInput): EvaluationMetadata {
  return {
    source_type: input.metadata?.source_type ?? input.source_type ?? "unknown",
    source_count: input.metadata?.source_count ?? input.source_count ?? input.sources?.length ?? (input.raw_text ? 1 : 0),
    has_official_source: input.metadata?.has_official_source ?? input.has_official_source ?? input.sources?.some((source) => source.source_type === "official") ?? false,
    collected_at: input.metadata?.collected_at ?? new Date(0).toISOString(),
  };
}

export function getInputQuality(input: EvaluationInput): InputQuality {
  if (input.input_quality) return input.input_quality;
  if (input.sources && input.sources.length > 1) return "multi_source_summary";
  if (input.sources && input.sources.length === 1) return "raw_excerpt";
  if (input.raw_text) return "unknown";
  return "unknown";
}

export function getSourceDocuments(input: EvaluationInput): SourceDocument[] {
  if (input.sources?.length) return input.sources;
  if (input.raw_text) {
    return [
      {
        id: "legacy_raw_text",
        source_type: input.source_type ?? "unknown",
        text: input.raw_text,
      },
    ];
  }
  return [];
}

export function getEvaluationSourceText(input: EvaluationInput): string {
  return getSourceDocuments(input)
    .map((source) => source.text)
    .join("\n\n")
    .trim();
}

function defaultSourceFacts(input?: EvaluationInput): SourceFact[] {
  const sources = input ? getSourceDocuments(input) : [];
  if (sources.length === 0) {
    return [{ id: "fact_1", claim: "当前输入没有提供可核查来源文本，需要编辑补充真实来源。", source_ids: ["unknown_source"], confidence: "low" }];
  }
  return sources.slice(0, 3).map((source, index) => ({
    id: `fact_${index + 1}`,
    claim: source.text.slice(0, 90) || "来源文本为空，需要编辑复核。",
    source_ids: [source.id],
    evidence_text: source.text.slice(0, 120),
    confidence: source.source_type === "official" ? "high" : "medium",
  }));
}

function defaultAudience(input?: EvaluationInput): Audience[] {
  if (!input) return ["pm"];
  if (["model", "tool", "project", "integration"].includes(input.content_type)) return ["developer", "pm"];
  if (input.content_type === "paper") return ["researcher", "developer"];
  if (input.content_type === "course") return ["developer", "operator"];
  return ["pm", "operator"];
}

function defaultAction(input?: EvaluationInput): ActionLabel {
  if (!input) return "read";
  if (["tool", "project", "model", "integration"].includes(input.content_type)) return "try";
  if (["paper", "article", "course"].includes(input.content_type)) return "read";
  return "monitor";
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function coerceActionLabel(value: unknown): ActionLabel | undefined {
  if (typeof value !== "string") return undefined;
  if ((actionLabels as readonly string[]).includes(value)) return value as ActionLabel;
  const normalized = normalizeToken(value);
  const aliases: Record<string, ActionLabel> = {
    know_only: "know",
    just_know: "know",
    read_more: "read",
    deep_read: "read",
    worth_reading: "read",
    try_it: "try",
    test: "try",
    test_it: "try",
    hands_on_test: "try",
    install: "try",
    evaluate: "try",
    use: "use_now",
    use_now: "use_now",
    adopt: "use_now",
    save_for_later: "save",
    bookmark: "save",
    watch: "monitor",
    observe: "monitor",
    keep_watching: "monitor",
    skip: "avoid",
    ignore: "avoid",
    avoid_it: "avoid",
  };
  return aliases[normalized];
}

function normalizeActionLabel(value: unknown, fallback: ActionLabel): ActionLabel {
  return coerceActionLabel(value) ?? fallback;
}

function coerceAudience(value: unknown): Audience | undefined {
  if (typeof value !== "string") return undefined;
  if ((audiences as readonly string[]).includes(value)) return value as Audience;
  const normalized = normalizeToken(value);
  const aliases: Record<string, Audience> = {
    product_manager: "pm",
    product: "pm",
    business_user: "operator",
    business: "operator",
    marketer: "operator",
    marketing: "operator",
    ops: "operator",
    operations: "operator",
    manager: "enterprise",
    leader: "enterprise",
    team_lead: "enterprise",
    enterprise_user: "enterprise",
    student: "developer",
    learner: "developer",
    educator: "researcher",
    teacher: "researcher",
    analyst: "operator",
    ai_builder: "developer",
    builder: "developer",
    engineer: "developer",
    researcher_user: "researcher",
    startup: "founder",
    entrepreneur: "founder",
    content_creator: "creator",
  };
  return aliases[normalized];
}

function normalizeAudienceList(value: unknown, fallback: Audience[]): Audience[] {
  const raw = Array.isArray(value) ? value : fallback;
  const normalized = raw.map(coerceAudience).filter((audience): audience is Audience => Boolean(audience));
  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

function coerceAnalysisModule(value: unknown): AnalysisModule | undefined {
  if (typeof value !== "string") return undefined;
  if ((analysisModules as readonly string[]).includes(value)) return value as AnalysisModule;
  const normalized = normalizeToken(value);
  const aliases: Record<string, AnalysisModule> = {
    use_case_clarity: "problem_solved",
    use_cases: "problem_solved",
    connected_system: "workflow",
    readme_clarity: "implementation_notes",
    hands_on_validation: "validation_methods",
    validation_plan: "validation_methods",
    test_plan: "practical_test_plan",
    practical_validation: "validation_methods",
    tool_inventory: "implementation_notes",
    pricing_model: "alternatives",
    price: "cost_latency",
    pricing: "cost_latency",
    maintenance_health: "maintenance",
    repo_health: "maintenance",
    permission_model: "permission_safety",
    safety: "permission_safety",
    security: "permission_safety",
    architecture_notes: "architecture",
    implementation_detail: "implementation_notes",
    implementation_details: "implementation_notes",
    reproducibility: "validation_methods",
    evidence_quality: "evidence",
    core_claim: "core_thesis",
    thesis: "core_thesis",
    problem: "research_question",
    method_summary: "method",
    benchmark: "benchmark_meaning",
    benchmarks: "benchmark_meaning",
    migration: "migration_advice",
    install_decision: "install_decision",
    installation: "setup_cost",
    trigger_clarity: "trigger_rules",
    rules_inventory: "skill_inventory",
    skill_rules: "skill_inventory",
    design_lessons: "learning_notes",
    design_takeaways: "learning_notes",
    playbook_potential: "playbook_conversion",
  };
  return aliases[normalized];
}

function coerceContentType(value: unknown, fallback: ContentType): ContentType {
  if (typeof value === "string" && (contentTypes as readonly string[]).includes(value)) return value as ContentType;
  if (typeof value !== "string") return fallback;
  const normalized = normalizeToken(value);
  const aliases: Record<string, ContentType> = {
    skill: "integration",
    skills: "integration",
    skill_pack: "integration",
    mcp: "integration",
    mcp_server: "integration",
    hook: "integration",
    hooks: "integration",
    rules: "integration",
    paper_review: "paper",
    research_paper: "paper",
    model_update: "model",
  };
  return aliases[normalized] ?? fallback;
}

function coerceActionType(value: unknown): ActionType | undefined {
  if (typeof value !== "string") return undefined;
  if ((actionTypes as readonly string[]).includes(value)) return value as ActionType;
  const normalized = normalizeToken(value);
  const aliases: Record<string, ActionType> = {
    try: "hands_on_test",
    test: "hands_on_test",
    install: "hands_on_test",
    validate: "hands_on_test",
    read: "deep_read",
    deepdive: "deep_read",
    deep_dive: "deep_read",
    observe: "monitor",
    watch: "monitor",
    save: "read_only",
    extract: "learning_playbook",
    learn: "learning_playbook",
    playbook: "convert_to_playbook",
  };
  return aliases[normalized];
}

function normalizeActionTypes(value: unknown, fallback: ActionType[]): ActionType[] {
  const raw = Array.isArray(value) ? value : fallback;
  const normalized = raw.map(coerceActionType).filter((actionType): actionType is ActionType => Boolean(actionType));
  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

function normalizeModuleChoices(value: unknown, fallback: ModuleChoice[]): ModuleChoice[] {
  const rawChoices = Array.isArray(value) ? value : fallback;
  const normalized = rawChoices
    .map((choice) => {
      const module = coerceAnalysisModule(choice?.module);
      if (!module) return undefined;
      return {
        module,
        reason: nonEmpty(choice?.reason) ? choice.reason : "LLM chose this module; editor should verify the fit.",
      };
    })
    .filter((choice): choice is ModuleChoice => Boolean(choice));
  if (normalized.length >= 2) return normalized;
  const merged = [...normalized, ...fallback.filter((fallbackChoice) => !normalized.some((choice) => choice.module === fallbackChoice.module))];
  return merged.slice(0, Math.max(2, Math.min(merged.length, 6)));
}

/**
 * Deterministic image-policy chooser. Implements the matrix in
 * `docs/image-policy.md`: which content types need a cover, which can lean on
 * a logo or screenshot, which should not be illustrated at all. The LLM is
 * asked to confirm or override this; if it can't, this is what we ship.
 */
function defaultImagePolicy(input: EvaluationInput | undefined, depth: DetailDepth, card: EvaluationCard): ImagePolicy {
  if (!input) return "thumbnail_only";
  // Skill-like content uses a rule card, never a glamour cover.
  if (isSkillLikeInput(input)) return "thumbnail_only";
  // Low-confidence items shouldn't pretend to be authoritative with a hero.
  if (card.confidence_score < 45 || card.recommended_action === "avoid") return "none";
  switch (input.content_type) {
    case "guide":
      return "step_images";
    case "tool":
    case "project":
    case "integration":
      return "screenshot_required";
    case "model":
      return depth === "deep" ? "cover_and_diagram" : "logo_only";
    case "paper":
    case "article":
      return depth === "deep" ? "cover_and_diagram" : "thumbnail_only";
    case "news":
      return "thumbnail_only";
    case "course":
      return "logo_only";
    default:
      return "thumbnail_only";
  }
}

function recommendedTypesFor(policy: ImagePolicy): RecommendedImageType[] {
  switch (policy) {
    case "none":
      return [];
    case "logo_only":
      return ["logo"];
    case "thumbnail_only":
      return ["rule_card", "diagram"];
    case "cover":
      return ["cover"];
    case "cover_and_diagram":
      return ["cover", "diagram"];
    case "screenshot_required":
      return ["screenshot", "logo"];
    case "step_images":
      return ["screenshot", "diagram", "cover"];
  }
}

function defaultImagePrompt(input: EvaluationInput | undefined, policy: ImagePolicy, card: EvaluationCard): string | undefined {
  if (policy === "none" || policy === "logo_only" || policy === "screenshot_required" || policy === "step_images") {
    return undefined;
  }
  const title = input?.title ?? "AI-brief item";
  const idea = card.one_sentence_takeaway;
  const aspect = policy === "thumbnail_only" ? "4:3" : "16:9";
  return [
    `Create a ${aspect} editorial illustration for AI-brief, a Chinese AI intelligence product.`,
    `Topic: ${title}`,
    `Core idea: ${idea}`,
    "Style: Clean modern editorial, off-white background, restrained blue/violet/cyan accents, professional newsletter aesthetic, soft depth.",
    "Constraints: No readable text. No real brand logos. No real person likeness. No fake UI. No cyberpunk clichés.",
  ].join("\n");
}

function defaultImageReason(policy: ImagePolicy, input?: EvaluationInput): string {
  switch (policy) {
    case "none":
      return "可信度较低或不需要图，强行配图会误导用户。";
    case "logo_only":
      return "用品牌或平台 logo 即可识别，不需要额外大图。";
    case "thumbnail_only":
      return "卡片和列表场景需要小缩略图帮助识别，不需要大封面。";
    case "cover":
      return "首页或详情页需要一张主视觉，建立专题感。";
    case "cover_and_diagram":
      return "深度内容需要封面 + 一张机制/对比图来辅助理解。";
    case "screenshot_required":
      return `${input?.content_type ?? "content"} 类内容用真实截图或 README 视图比抽象插画更有说服力。`;
    case "step_images":
      return "Playbook 必须配步骤截图，证明每一步真的能跑通。";
  }
}

function normalizeImagePlan(
  raw: Record<string, any> | undefined,
  input: EvaluationInput | undefined,
  depth: DetailDepth,
  card: EvaluationCard,
): ImagePlan {
  const fallbackPolicy = defaultImagePolicy(input, depth, card);
  const policy: ImagePolicy = imagePolicies.includes(raw?.policy) ? (raw!.policy as ImagePolicy) : fallbackPolicy;
  const recommendedRaw: unknown[] = Array.isArray(raw?.recommended_types) ? raw!.recommended_types : [];
  const recommended: RecommendedImageType[] = recommendedRaw
    .filter((value): value is RecommendedImageType => typeof value === "string" && (recommendedImageTypes as readonly string[]).includes(value));
  const recommended_types = recommended.length > 0 ? recommended : recommendedTypesFor(policy);
  const reason = nonEmpty(raw?.reason) ? raw!.reason : defaultImageReason(policy, input);
  const prompt = nonEmpty(raw?.prompt) ? raw!.prompt : defaultImagePrompt(input, policy, card);
  const fallbackAlt = `${input?.title ?? "AI-brief item"}：${card.one_sentence_takeaway}`.slice(0, 140);
  const alt = nonEmpty(raw?.alt) ? raw!.alt : fallbackAlt;
  return prompt ? { policy, reason, recommended_types, prompt, alt } : { policy, reason, recommended_types, alt };
}

function validateImagePlan(plan: ImagePlan, input: EvaluationInput | undefined, issues: string[]): void {
  if (!imagePolicies.includes(plan.policy)) {
    issues.push("image_plan.policy must be a legal ImagePolicy.");
  }
  if (!plan.reason || plan.reason.length < 6) {
    issues.push("image_plan.reason must explain why this policy was chosen.");
  }
  if (!plan.alt || plan.alt.length < 4) {
    issues.push("image_plan.alt is required and must be human-readable.");
  }
  for (const type of plan.recommended_types) {
    if (!(recommendedImageTypes as readonly string[]).includes(type)) {
      issues.push(`image_plan.recommended_types contains illegal value: ${type}.`);
      break;
    }
  }
  // News that's a quick hit should not have a heavy cover requirement.
  const isQuickHit = input?.content_type === "news" && plan.policy === "cover_and_diagram";
  if (isQuickHit) {
    issues.push("news quick hits should not require cover_and_diagram; downgrade to thumbnail_only.");
  }
  if ((plan.policy === "cover" || plan.policy === "cover_and_diagram") && !plan.prompt) {
    issues.push("image_plan with cover policy must include a prompt for the editor to use.");
  }
  // Skill-like content should never demand a glamorous cover.
  if (isSkillLikeInput(input) && (plan.policy === "cover" || plan.policy === "cover_and_diagram")) {
    issues.push("Skill-like content should use rule_card or diagram, not a hero cover.");
  }
}

export function normalizeEvaluationResult(result: EvaluationResultDraft, input?: EvaluationInput): EvaluationResult {
  const inputQuality = result.input_quality ?? (input ? getInputQuality(input) : "unknown");
  const fallbackSummary =
    result.summary ??
    result.card?.summary ??
    (input ? `这条内容围绕「${input.title}」展开，但当前来源信息有限，需要先完成事实核查再发布。` : "当前评估结果缺少摘要，需要编辑复核。");
  const fallbackTakeaway = result.one_sentence_takeaway ?? result.card?.one_sentence_takeaway ?? "这条内容需要先核查事实，再决定是否行动。";
  const fallbackWhy = result.why_it_matters ?? result.card?.why_it_matters_short ?? result.ai_brief_judgment?.why_it_matters ?? "这会影响内容能否从信息转成可验证行动。";
  const normalizedSummary = chineseSummaryFallback(input, textOrFallback(result.card?.summary, fallbackSummary, 60));
  const recommendedAction = normalizeActionLabel(
    result.recommended_action ?? result.card?.recommended_action ?? result.action_layer?.recommended_action,
    defaultAction(input),
  );
  const targetAudience = normalizeAudienceList(result.target_audience ?? result.card?.target_audience, defaultAudience(input));
  const sourceFacts = ensureArray(result.source_facts, defaultSourceFacts(input));
  const factIds = sourceFacts.map((fact) => fact.id);
  const card: EvaluationCard = {
    summary: normalizedSummary,
    one_sentence_takeaway: textOrFallback(result.card?.one_sentence_takeaway, fallbackTakeaway, 18),
    why_it_matters_short: textOrFallback(result.card?.why_it_matters_short, fallbackWhy, 35),
    recommended_action: normalizeActionLabel(result.card?.recommended_action, recommendedAction),
    readability_score: result.card?.readability_score ?? result.readability_score ?? 70,
    impact_score: result.card?.impact_score ?? result.impact_score ?? 55,
    actionability_score: result.card?.actionability_score ?? result.actionability_score ?? 45,
    confidence_score: result.card?.confidence_score ?? result.confidence_score ?? (lowInputQualities.includes(inputQuality) ? 50 : 65),
    difficulty: result.card?.difficulty ?? result.difficulty ?? "intermediate",
    target_audience: targetAudience,
  };
  const skillLike = isSkillLikeInput(input) || Boolean(result.skill_analysis);
  const skillReusableWorkflow = hasReusableEngineeringWorkflow(input, result.skill_analysis);
  const skillAnalysis = normalizeSkillAnalysis(result, input, card);
  const defaultPlaybookCandidate =
    card.actionability_score >= 70 &&
    (!input || ["tool", "project", "integration", "guide"].includes(input.content_type)) &&
    recommendedAction !== "monitor" &&
    recommendedAction !== "avoid" &&
    (!skillLike || skillReusableWorkflow);

  const rawBriefDetail = result.brief_detail ?? (isRequestedDeepDive(result.deep_dive) ? undefined : result.deep_dive);
  const rawDeepDive = isRequestedDeepDive(result.deep_dive) ? result.deep_dive : undefined;
  result = { ...result, deep_dive: rawBriefDetail };
  const fallbackDepth: DetailDepth = inputQuality === "raw_full_text" ? "standard" : inputQuality === "unknown" ? "card_only" : "brief";
  const requestedDepth = normalizeDetailDepth(result.depth_level ?? result.editorial_diagnosis?.depth_level, fallbackDepth);

  const briefDetail: BriefDetail = {
    tldr: textOrFallback(rawBriefDetail?.tldr, fallbackSummary, 30),
    beginner_explanation:
      textOrFallback(
        rawBriefDetail?.beginner_explanation,
        `如果把「${input?.title ?? "这条内容"}」讲给刚接触 AI 工具的人，核心是先弄清它解决什么问题、怎么工作、有没有真实证据，以及是否值得花时间试。`,
        50,
      ),
    background: textOrFallback(result.deep_dive?.background, "当前来源只提供有限上下文，详情页应补充背景、对比材料和交叉来源。", 12),
    core_concepts: ensureArray(result.deep_dive?.core_concepts, [
      { name: "事实核查", explanation: "先确认来源文本明确支持哪些事实。", why_it_matters_here: "它能避免把编辑判断写成原文事实。" },
      { name: "行动验证", explanation: "每个建议都需要有验证方法。", why_it_matters_here: "它让读者知道做完后如何判断是否成功。" },
    ]),
    terminology: ensureMinArray(result.deep_dive?.terminology, [
      { term: "Source Facts", plain_explanation: "来源文本明确说了什么。", why_it_matters: "它是判断和行动建议的证据基础。" },
      { term: "Validation", plain_explanation: "做完之后如何判断是否成功。", why_it_matters: "它能避免只看宣传而不看真实效果。" },
    ], 2),
    mechanism_explanation: textOrFallback(result.deep_dive?.mechanism_explanation, "评估链路先抽取事实，再形成 AI-brief 判断，最后生成行动和验证方法。", 12),
    what_changed: textOrFallback(result.deep_dive?.what_changed, fallbackTakeaway, 12),
    why_now: textOrFallback(result.deep_dive?.why_now, "这个方向正在被更多开发者关注，但仍需要用真实来源和可运行验证判断价值。", 12),
    innovation_analysis: textOrFallback(result.deep_dive?.innovation_analysis, "当前信息不足以确认技术或产品创新，需要进一步对比同类方案。", 12),
    value_analysis: textOrFallback(result.deep_dive?.value_analysis, "它的实际价值取决于是否能节省时间、降低成本、提升质量，或让一个过去难做的流程变得可执行。", 12),
    impact_by_audience: ensureArray(result.deep_dive?.impact_by_audience, targetAudience.slice(0, 2).map((audience) => ({ audience, impact: fallbackWhy }))),
    limitations_and_risks: ensureArray(result.deep_dive?.limitations_and_risks, result.risks ?? ["来源文本不足时容易误判。", "行动建议需要真实任务验证。"]),
    open_questions: ensureArray(result.deep_dive?.open_questions, lowInputQualities.includes(inputQuality) ? ["需要用真实来源文本重新评估。"] : ["还需要更多来源交叉验证。"]),
    practical_examples: ensureArray(result.deep_dive?.practical_examples, ["选择一个小范围真实任务验证判断是否成立。"]),
    examples: ensureArray(result.deep_dive?.examples, [
      { scenario: "小范围试用", explanation: "选一个低风险真实任务，把项目接入现有流程跑一次。", expected_value: "判断它是否真的节省时间或降低错误率。" },
      { scenario: "替代方案对比", explanation: "拿它和当前工具或同类开源项目做同一任务。", expected_value: "看清它的独特价值，而不是只看热度。" },
    ]),
    what_to_look_for: ensureArray(result.deep_dive?.what_to_look_for, ["是否有清晰 README 和可运行 demo。", "是否有近期维护、release 或真实用户反馈。"]),
    good_signs: ensureArray(result.deep_dive?.good_signs, ["来源事实明确。", "有安装步骤和验证方法。"]),
    watch_outs: ensureArray(result.deep_dive?.watch_outs, ["热度高但缺少 benchmark。", "README 说得多但无法快速跑通。"]),
    adoption_readiness: result.deep_dive?.adoption_readiness ?? "适合先小范围验证，不宜直接进入生产流程。",
  };

  const deepDive: DeepDive | undefined = rawDeepDive
    ? {
        core_question: rawDeepDive.core_question ?? result.editorial_diagnosis?.core_question ?? "Should this item receive a deeper analysis?",
        background: rawDeepDive.background ?? "",
        core_concepts: ensureArray(rawDeepDive.core_concepts, []),
        mechanism_explanation: rawDeepDive.mechanism_explanation ?? "",
        what_changed: rawDeepDive.what_changed ?? "",
        comparison_or_alternatives: ensureArray(rawDeepDive.comparison_or_alternatives, []),
        why_it_matters_deep: rawDeepDive.why_it_matters_deep ?? "",
        impact_by_audience: ensureArray(rawDeepDive.impact_by_audience, []),
        risks_and_uncertainties: ensureArray(rawDeepDive.risks_and_uncertainties, []),
        practical_test_plan: ensureArray(rawDeepDive.practical_test_plan, []),
        validation_methods: ensureArray(rawDeepDive.validation_methods, []),
        learning_takeaways: ensureArray(rawDeepDive.learning_takeaways, []),
        related_playbook_idea: rawDeepDive.related_playbook_idea ?? "",
      }
    : undefined;

  const deepDiveGenerated = hasGeneratedDeepDive(deepDive);
  const finalDepth: DetailDepth = requestedDepth === "deep" && !deepDiveGenerated ? "standard" : requestedDepth;
  const deepDiveStatus: DeepDiveStatus = deepDiveGenerated
    ? "generated"
    : result.deep_dive_status === "needs_human_review"
      ? "needs_human_review"
      : requestedDepth === "deep" || result.deep_dive_status === "generated"
          ? "needed_not_generated"
          : result.deep_dive_status ?? "not_needed";

  const judgment: AiBriefJudgment = {
    main_judgment: result.ai_brief_judgment?.main_judgment ?? fallbackTakeaway,
    why_it_matters: result.ai_brief_judgment?.why_it_matters ?? fallbackWhy,
    impact_analysis: result.ai_brief_judgment?.impact_analysis ?? fallbackWhy,
    based_on_fact_ids: ensureArray(result.ai_brief_judgment?.based_on_fact_ids, factIds.slice(0, 2)),
    uncertainty: ensureArray(result.ai_brief_judgment?.uncertainty, briefDetail.open_questions),
  };

  const learningFocus = result.editorial_diagnosis?.learning_focus ?? defaultLearningFocus(input, briefDetail);
  const learningValueScore =
    result.editorial_diagnosis?.learning_value_score ??
    Math.max(35, Math.min(100, Math.round(card.impact_score * 0.45 + card.actionability_score * 0.25 + card.confidence_score * 0.15 + learningFocus.length * 5)));
  const playbookPotential: PlaybookPotential =
    result.editorial_diagnosis?.playbook_potential ?? (defaultPlaybookCandidate ? "strong" : card.actionability_score >= 55 ? "weak" : "none");
  const diagnosis: EditorialDiagnosis = {
    content_type: coerceContentType(result.editorial_diagnosis?.content_type, input?.content_type ?? "article"),
    depth_level: finalDepth,
    core_question: result.editorial_diagnosis?.core_question ?? "这条内容最值得用户理解的核心问题是什么，以及它能否从信息转成可验证行动？",
    why_this_is_worth_covering: result.editorial_diagnosis?.why_this_is_worth_covering ?? judgment.why_it_matters,
    source_facts_preview: ensureArray(result.editorial_diagnosis?.source_facts_preview, sourceFacts.slice(0, 3)),
    recommended_modules: normalizeModuleChoices(result.editorial_diagnosis?.recommended_modules, [
        { module: "source_facts", reason: "先把来源明确支持的信息和编辑判断分开。" },
        { module: "ai_brief_judgment", reason: "AI-brief 需要说明自己的判断基于哪些事实。" },
        { module: "validation_methods", reason: "读者需要知道如何验证行动是否有效。" },
      ]),
    modules_to_skip: normalizeModuleChoices(result.editorial_diagnosis?.modules_to_skip, [
        { module: "alternatives", reason: "当前来源不足时不强行比较替代方案。" },
      ]),
    missing_evidence: normalizeStringList(
      result.editorial_diagnosis?.missing_evidence,
      [
        "还需要人工抽样核对 source_facts 是否能回到来源文本。",
        "还需要用真实任务验证行动建议是否可执行。",
      ],
      2,
    ),
    playbook_potential: playbookPotential,
    suggested_reader_takeaway: result.editorial_diagnosis?.suggested_reader_takeaway ?? fallbackTakeaway,
    depth_reason:
      (nonEmpty(result.editorial_diagnosis?.depth_reason) && result.editorial_diagnosis!.depth_reason.length >= 20
        ? result.editorial_diagnosis!.depth_reason
        : undefined) ??
      (result.depth_level === "deep"
        ? "这条内容不仅有信息价值，还包含机制、风险和可验证行动，适合进入深度解读。"
        : "当前信息适合先做标准判断，后续根据来源质量和行动价值决定是否升级深度。"),
    learning_value_score: learningValueScore,
    learning_focus: learningFocus,
    confidence_score: result.editorial_diagnosis?.confidence_score ?? card.confidence_score,
  };

  const actionLayer: ActionLayer = {
    recommended_action: normalizeActionLabel(result.action_layer?.recommended_action, recommendedAction),
    action_type: normalizeActionTypes(
      result.action_layer?.action_type,
      skillLike
        ? (defaultActionTypes(input, recommendedAction, card.actionability_score, defaultPlaybookCandidate).filter((actionType) => actionType !== "convert_to_playbook") as ActionType[]).concat(defaultPlaybookCandidate ? (["convert_to_playbook"] as ActionType[]) : [])
        : defaultActionTypes(input, recommendedAction, card.actionability_score, defaultPlaybookCandidate),
    ),
    next_steps: ensureArray(result.action_layer?.next_steps ?? result.next_steps, ["打开原始链接复核两条关键事实。", "补充一个小范围可验证测试。"]),
    checklist: ensureArray(result.action_layer?.checklist, ["每条关键事实都能回到原始来源。", "AI-brief 判断明确标注为编辑观点。"]),
    validation_methods: ensureArray(result.action_layer?.validation_methods, ["抽样打开来源链接核对关键事实。", "记录执行后是否得到可观察结果。"]),
    playbook_candidate: skillLike && !skillReusableWorkflow ? false : Boolean(result.action_layer?.playbook_candidate) || defaultPlaybookCandidate,
    safety_boundary:
      result.action_layer?.safety_boundary ??
      (isSecurityAdjacent(input)
        ? "只在自有代码、授权环境或 intentionally vulnerable toy repo 中做防御性学习实验，不扫描第三方真实目标，不生成或传播可武器化利用步骤。"
        : "在低风险、可回滚、可人工审核的小范围任务中验证，不直接进入生产流程。"),
  };

  const imagePlan = normalizeImagePlan(result.image_plan, input, finalDepth, card);
  // prompt_version is stamped server-side; the LLM is not asked for it. If the
  // result already has a legal stamp (e.g. test fixture or pipeline rerun),
  // keep it; otherwise fall back to the deterministic version. The evaluator
  // overwrites this with PROMPT_VERSION after a successful LLM call.
  const promptVersion =
    typeof result.prompt_version === "string" && promptVersionPattern.test(result.prompt_version)
      ? result.prompt_version
      : DETERMINISTIC_PROMPT_VERSION;

  return {
    summary: card.summary,
    one_sentence_takeaway: card.one_sentence_takeaway,
    why_it_matters: judgment.why_it_matters,
    readability_score: card.readability_score,
    impact_score: card.impact_score,
    actionability_score: card.actionability_score,
    confidence_score: card.confidence_score,
    source_confidence: scoreOrFallback(result.source_confidence, card.confidence_score),
    judgment_confidence: scoreOrFallback(result.judgment_confidence, Math.min(card.confidence_score, Math.round((card.impact_score + card.confidence_score) / 2))),
    practical_confidence: scoreOrFallback(result.practical_confidence, Math.min(card.confidence_score, card.actionability_score)),
    difficulty: card.difficulty,
    recommended_action: actionLayer.recommended_action,
    target_audience: targetAudience,
    key_facts: normalizeStringList(result.key_facts, sourceFacts.map((fact) => fact.claim).slice(0, 5), 2),
    opportunities: normalizeStringList(result.opportunities, [judgment.impact_analysis, judgment.why_it_matters, ...actionLayer.next_steps].filter(nonEmpty), 2),
    risks: normalizeStringList(result.risks, briefDetail.limitations_and_risks, 2),
    next_steps: normalizeStringList(actionLayer.next_steps, ["打开原始链接复核两条关键事实。", "补充一个小范围可验证测试。"], 2),
    input_quality: inputQuality,
    depth_level: finalDepth,
    card,
    source_facts: sourceFacts,
    ai_brief_judgment: judgment,
    editorial_diagnosis: diagnosis,
    brief_detail: briefDetail,
    deep_dive_status: deepDiveStatus,
    ...(deepDiveGenerated ? { deep_dive: deepDive } : {}),
    action_layer: actionLayer,
    ...(skillAnalysis ? { skill_analysis: skillAnalysis } : {}),
    image_plan: imagePlan,
    prompt_version: promptVersion,
  };
}

function validateStringArray(result: EvaluationResult, field: "key_facts" | "opportunities" | "risks" | "next_steps", issues: string[]): void {
  if (!Array.isArray(result[field]) || result[field].length < 2 || result[field].length > 6) {
    issues.push(`${field} must contain 2-6 items.`);
    return;
  }
  for (const item of result[field]) {
      if (item.length < 6 || item.length > 200) {
        issues.push(`${field} items must be 6-200 characters.`);
      break;
    }
  }
}

function validateFactReferences(ids: string[], factIds: Set<string>, field: string, issues: string[]): void {
  for (const id of ids) {
    if (!factIds.has(id)) issues.push(`${field} references unknown source_fact id: ${id}.`);
  }
}

function validateSkillAnalysis(result: EvaluationResult, input: EvaluationInput | undefined, issues: string[]): void {
  const shouldHaveSkillAnalysis = isSkillLikeInput(input) || Boolean(result.skill_analysis);
  if (!shouldHaveSkillAnalysis) return;
  const analysis = result.skill_analysis;
  if (!analysis) {
    issues.push("skill_analysis is required for skill-like content.");
    return;
  }

  if (!skillInstallVerdicts.includes(analysis.install_verdict)) issues.push("skill_analysis.install_verdict must be legal.");
  for (const field of [
    "install_worthiness_score",
    "trigger_clarity_score",
    "behavior_specificity_score",
    "verification_score",
    "context_cost_score",
    "conflict_risk_score",
  ] as const) {
    if (!isScore(analysis[field])) issues.push(`skill_analysis.${field} must be 0-100.`);
  }
  if (analysis.supported_tools.length < 1) issues.push("skill_analysis.supported_tools must not be empty.");
  if (analysis.use_cases.length < 1) issues.push("skill_analysis.use_cases must not be empty.");
  if (analysis.not_for.length < 1) issues.push("skill_analysis.not_for must not be empty.");
  if (analysis.skill_inventory.length < 1) issues.push("skill_analysis.skill_inventory must not be empty.");
  if (analysis.best_rules.length < 1) issues.push("skill_analysis.best_rules must not be empty.");
  if (analysis.weak_rules.length < 1) issues.push("skill_analysis.weak_rules must not be empty.");
  if (analysis.design_takeaways.length < 1) issues.push("skill_analysis.design_takeaways must not be empty.");
  if ((analysis.install_verdict === "install" || analysis.install_verdict === "try") && analysis.installation_steps.length < 1) {
    issues.push("skill_analysis.installation_steps are required for install/try verdicts.");
  }
  for (const item of analysis.skill_inventory) {
    if (!item.name || !item.purpose || !item.trigger) issues.push("skill_analysis.skill_inventory items must include name, purpose, and trigger.");
    if (item.best_rules.length < 1 || item.weak_points.length < 1) issues.push("skill_analysis.skill_inventory items must include best_rules and weak_points.");
  }
  for (const rule of [...analysis.best_rules, ...analysis.weak_rules]) {
    if (!rule.rule || !rule.why_it_matters) issues.push("skill_analysis rules must include rule and why_it_matters.");
  }
  if (
    !analysis.quick_validation_test.title ||
    analysis.quick_validation_test.estimated_minutes <= 0 ||
    analysis.quick_validation_test.steps.length < 1 ||
    analysis.quick_validation_test.expected_signals.length < 1 ||
    analysis.quick_validation_test.failure_signals.length < 1
  ) {
    issues.push("skill_analysis.quick_validation_test must include title, time, steps, expected signals, and failure signals.");
  }
  if (result.action_layer.playbook_candidate && !analysis.contains_reusable_engineering_workflow) {
    issues.push("skill_analysis must not force a playbook unless the skill pack contains a reusable engineering workflow.");
  }
}

function containsPublicFallbackText(value = ""): boolean {
  return /需要编辑补充|可以转成更清晰的事实-判断-行动链路|可以沉淀为后续 Brief|核查来源文本|确认事实和判断是否分离/i.test(value);
}

function sourceIdsForInput(input?: EvaluationInput): Set<string> | undefined {
  if (!input?.sources?.length) return undefined;
  return new Set(input.sources.map((source) => source.id));
}

export function validateRawEvaluationResult(rawResult: EvaluationResultDraft, input?: EvaluationInput): string[] {
  const issues: string[] = [];
  const requiredLayeredFields: Array<keyof EvaluationResult> = [
    "card",
    "source_facts",
    "ai_brief_judgment",
    "editorial_diagnosis",
    "brief_detail",
    "action_layer",
    "image_plan",
    "input_quality",
    "depth_level",
  ];

  for (const field of requiredLayeredFields) {
    if (rawResult[field] === undefined || rawResult[field] === null) {
      issues.push(`raw output missing ${String(field)}.`);
    }
  }

  if (!rawResult.card) {
    issues.push("raw output card is required.");
  } else {
    const card = rawResult.card;
    for (const field of ["summary", "one_sentence_takeaway", "why_it_matters_short", "recommended_action", "difficulty", "target_audience"] as const) {
      if (card[field] === undefined || card[field] === null) {
        issues.push(`raw output card.${field} is required.`);
      }
    }
    for (const field of ["readability_score", "impact_score", "actionability_score", "confidence_score"] as const) {
      if (!isScore(card[field])) {
        issues.push(`raw output card.${field} must be an integer between 0 and 100.`);
      }
    }
    for (const field of ["summary", "one_sentence_takeaway", "why_it_matters_short"] as const) {
      const value = card[field];
      if (typeof value !== "string" || value.trim().length < 12 || containsPublicFallbackText(value)) {
        issues.push(`raw output card.${field} contains generic fallback or weak text.`);
      }
    }
    if (!Array.isArray(card.target_audience) || card.target_audience.length === 0) {
      issues.push("raw output card.target_audience must not be empty.");
    }
  }

  const judgment = rawResult.ai_brief_judgment;
  if (!judgment) {
    issues.push("raw output ai_brief_judgment is required.");
  } else {
    for (const field of ["main_judgment", "why_it_matters", "impact_analysis"] as const) {
      const value = judgment[field];
      if (typeof value !== "string" || value.trim().length < 16 || containsPublicFallbackText(value)) {
        issues.push(`raw output ai_brief_judgment.${field} contains generic fallback or weak text.`);
      }
    }
    if (!Array.isArray(judgment.based_on_fact_ids) || judgment.based_on_fact_ids.length === 0) {
      issues.push("raw output ai_brief_judgment.based_on_fact_ids must not be empty.");
    }
    if (!Array.isArray(judgment.uncertainty) || judgment.uncertainty.length === 0) {
      issues.push("raw output ai_brief_judgment.uncertainty must not be empty.");
    }
  }

  const diagnosis = rawResult.editorial_diagnosis;
  if (!diagnosis) {
    issues.push("raw output editorial_diagnosis is required.");
  } else {
    if (!["card_only", "brief", "standard", "deep"].includes(diagnosis.depth_level as string)) {
      issues.push("raw output editorial_diagnosis.depth_level must be legal.");
    }
    for (const field of ["core_question", "why_this_is_worth_covering", "depth_reason", "suggested_reader_takeaway"] as const) {
      const value = diagnosis[field];
      if (typeof value !== "string" || value.trim().length < 12 || containsPublicFallbackText(value)) {
        issues.push(`raw output editorial_diagnosis.${field} contains generic fallback or weak text.`);
      }
    }
    if (!Array.isArray(diagnosis.recommended_modules) || diagnosis.recommended_modules.length < 2) {
      issues.push("raw output editorial_diagnosis.recommended_modules must include at least 2 choices.");
    }
    if (Array.isArray(diagnosis.recommended_modules) && diagnosis.recommended_modules.some((choice: Partial<ModuleChoice> | undefined) => !choice?.module || typeof choice.reason !== "string" || choice.reason.trim().length < 2)) {
      issues.push("raw output editorial_diagnosis.recommended_modules must include concrete reasons.");
    }
    if (!Array.isArray(diagnosis.missing_evidence) || diagnosis.missing_evidence.length < 1) {
      issues.push("raw output editorial_diagnosis.missing_evidence must include evidence gaps.");
    }
    if (!isScore(diagnosis.learning_value_score) || !isScore(diagnosis.confidence_score)) {
      issues.push("raw output editorial_diagnosis scores must be 0-100.");
    }
  }

  const briefDetail = rawResult.brief_detail;
  if (!briefDetail) {
    issues.push("raw output brief_detail is required.");
  }

  const actionLayer = rawResult.action_layer;
  if (!actionLayer) {
    issues.push("raw output action_layer is required.");
  }

  const legalSourceIds = sourceIdsForInput(input);
  if (!Array.isArray(rawResult.source_facts) || rawResult.source_facts.length === 0) {
    issues.push("raw output source_facts must not be empty.");
  } else {
    for (const fact of rawResult.source_facts) {
      if (!fact?.id || !fact?.claim || !Array.isArray(fact.source_ids) || fact.source_ids.length === 0) {
        issues.push("raw output source_facts must include id, claim, and source_ids.");
        continue;
      }
      for (const sourceId of fact.source_ids) {
        if (legalSourceIds && !legalSourceIds.has(sourceId)) {
          issues.push(`raw output source_fact ${fact.id} references unknown source id: ${sourceId}.`);
        }
      }
      if (["high", "medium"].includes(fact.confidence) && (!fact.evidence_text || fact.evidence_text.trim().length < 12)) {
        issues.push(`raw output source_fact ${fact.id} needs evidence_text for ${fact.confidence} confidence.`);
      }
      if (containsPublicFallbackText(fact.claim)) {
        issues.push(`raw output source_fact ${fact.id} contains public fallback text.`);
      }
    }
  }

  return issues;
}

export function validateEvaluationResult(rawResult: EvaluationResultDraft, input?: EvaluationInput): string[] {
  const preNormalizeIssues: string[] = [];
  if (rawResult.recommended_action && !coerceActionLabel(rawResult.recommended_action)) {
    preNormalizeIssues.push("recommended_action must be legal.");
  }
  if (rawResult.card?.recommended_action && !coerceActionLabel(rawResult.card.recommended_action)) {
    preNormalizeIssues.push("card.recommended_action must be legal.");
  }
  if (Array.isArray(rawResult.next_steps) && rawResult.next_steps.length === 0) {
    preNormalizeIssues.push("next_steps must contain 2-6 items.");
  }
  if (Array.isArray(rawResult.action_layer?.next_steps) && rawResult.action_layer.next_steps.length === 0) {
    preNormalizeIssues.push("action_layer.next_steps must contain items.");
  }
  if (
    rawResult.skill_analysis &&
    ["install", "try"].includes(rawResult.skill_analysis.install_verdict) &&
    Array.isArray(rawResult.skill_analysis.installation_steps) &&
    rawResult.skill_analysis.installation_steps.length === 0
  ) {
    preNormalizeIssues.push("skill_analysis.installation_steps are required for install/try verdicts.");
  }
  if (
    rawResult.skill_analysis?.quick_validation_test &&
    Array.isArray(rawResult.skill_analysis.quick_validation_test.steps) &&
    rawResult.skill_analysis.quick_validation_test.steps.length === 0
  ) {
    preNormalizeIssues.push("skill_analysis.quick_validation_test must include steps.");
  }
  if (rawResult.depth_level && !["card_only", "brief", "standard", "deep"].includes(rawResult.depth_level as string)) {
    preNormalizeIssues.push("depth_level must be a legal DetailDepth.");
  }
  if (rawResult.editorial_diagnosis?.depth_level && !["card_only", "brief", "standard", "deep"].includes(rawResult.editorial_diagnosis.depth_level as string)) {
    preNormalizeIssues.push("editorial_diagnosis.depth_level must be a legal DetailDepth.");
  }
  for (const field of ["recommended_modules", "modules_to_skip"] as const) {
    const choices = rawResult.editorial_diagnosis?.[field];
    if (Array.isArray(choices) && choices.some((choice) => typeof choice?.reason !== "string" || choice.reason.trim().length < 2)) {
      preNormalizeIssues.push("editorial_diagnosis recommended_modules and modules_to_skip must include reasons.");
    }
  }
  const result = normalizeEvaluationResult(rawResult, input);
  const issues: string[] = [...preNormalizeIssues];

  for (const field of ["summary", "one_sentence_takeaway", "why_it_matters"] as const) {
    if (!result[field]) issues.push(`${field} is required.`);
  }

  for (const field of ["readability_score", "impact_score", "actionability_score", "confidence_score", "source_confidence", "judgment_confidence", "practical_confidence"] as const) {
    if (!isScore(result[field])) issues.push(`${field} must be an integer between 0 and 100.`);
  }

  const scoreSet = new Set([result.impact_score, result.actionability_score, result.confidence_score]);
  if (scoreSet.size === 1) {
    issues.push("score distribution must not be lazy all-equal values.");
  }

  if (result.summary.length < 60 || result.summary.length > 600) {
    issues.push("summary must be 60-600 characters.");
  }

  const cjkCharacters = result.summary.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  if (result.summary.length > 0 && cjkCharacters / result.summary.length < 0.3) {
    issues.push("summary must be mostly Chinese.");
  }

  if (result.one_sentence_takeaway.length < 15 || result.one_sentence_takeaway.length > 120) {
    issues.push("one_sentence_takeaway must be 15-120 characters.");
  }

  if (!/[。？！.!?]$/.test(result.one_sentence_takeaway)) {
    issues.push("one_sentence_takeaway must end with final punctuation.");
  }

  if (!["beginner", "intermediate", "advanced"].includes(result.difficulty)) {
    issues.push("difficulty must be legal.");
  }
  if (!actionLabels.includes(result.recommended_action)) {
    issues.push("recommended_action must be legal.");
  }
  if (!result.target_audience.length || result.target_audience.some((audience) => !audiences.includes(audience))) {
    issues.push("target_audience must contain legal audience values.");
  }
  for (const field of ["key_facts", "opportunities", "risks", "next_steps"] as const) {
    validateStringArray(result, field, issues);
  }

  if (!["raw_full_text", "raw_excerpt", "multi_source_summary", "editorial_seed", "mock_fixture", "unknown"].includes(result.input_quality)) {
    issues.push("input_quality must be legal.");
  }
  if (!["card_only", "brief", "standard", "deep"].includes(result.depth_level)) {
    issues.push("depth_level must be legal.");
  }
  if (!["not_needed", "needed_not_generated", "generated", "needs_human_review"].includes(result.deep_dive_status)) {
    issues.push("deep_dive_status must be legal.");
  }
  if (result.source_facts.length === 0) issues.push("source_facts must not be empty.");
  const factIds = new Set(result.source_facts.map((fact) => fact.id));
  const legalSourceIds = sourceIdsForInput(input);
  const sourceText = input ? getEvaluationSourceText(input) : "";
  for (const fact of result.source_facts) {
    if (!fact.id || !fact.claim || fact.source_ids.length === 0) issues.push("source_facts must include id, claim, and source_ids.");
    if (!["high", "medium", "low"].includes(fact.confidence)) issues.push("source_facts confidence must be legal.");
    for (const sourceId of fact.source_ids) {
      if (legalSourceIds && !legalSourceIds.has(sourceId)) {
        issues.push(`source_facts reference unknown source id: ${sourceId}.`);
      }
    }
    if (["high", "medium"].includes(fact.confidence) && (!fact.evidence_text || fact.evidence_text.trim().length < 12)) {
      issues.push("source_facts high/medium confidence claims require evidence_text.");
    }
    if (containsPublicFallbackText(fact.claim)) {
      issues.push("source_facts must not contain public fallback/editorial boilerplate.");
    }
    if (/AI-brief/i.test(fact.claim) && input && !/AI-brief/i.test(sourceText)) {
      issues.push("source_facts must not attribute AI-brief editorial context to source text.");
    }
  }

  validateFactReferences(result.ai_brief_judgment.based_on_fact_ids, factIds, "ai_brief_judgment", issues);
  if (result.ai_brief_judgment.uncertainty.length === 0) issues.push("ai_brief_judgment must include uncertainty.");

  if (!contentTypes.includes(result.editorial_diagnosis.content_type)) issues.push("editorial_diagnosis.content_type must be legal.");
  if (!["card_only", "brief", "standard", "deep"].includes(result.editorial_diagnosis.depth_level)) issues.push("editorial_diagnosis.depth_level must be legal.");
  if (result.editorial_diagnosis.depth_level !== result.depth_level) issues.push("editorial_diagnosis.depth_level must match depth_level.");
  if (!result.editorial_diagnosis.core_question || result.editorial_diagnosis.core_question.length < 12) issues.push("editorial_diagnosis.core_question must be explicit.");
  if (!result.editorial_diagnosis.why_this_is_worth_covering || result.editorial_diagnosis.why_this_is_worth_covering.length < 20) {
    issues.push("editorial_diagnosis.why_this_is_worth_covering must explain coverage value.");
  }
  if (!result.editorial_diagnosis.depth_reason || result.editorial_diagnosis.depth_reason.length < 20) issues.push("editorial_diagnosis.depth_reason must explain the selected depth.");
  if (!isScore(result.editorial_diagnosis.learning_value_score)) issues.push("editorial_diagnosis.learning_value_score must be 0-100.");
  if (!isScore(result.editorial_diagnosis.confidence_score)) issues.push("editorial_diagnosis.confidence_score must be 0-100.");
  if (result.editorial_diagnosis.learning_focus.length < 2) issues.push("editorial_diagnosis.learning_focus must include at least 2 focus areas.");
  if (result.editorial_diagnosis.missing_evidence.length < 2) issues.push("editorial_diagnosis.missing_evidence must include at least 2 evidence gaps.");
  if (!playbookPotentials.includes(result.editorial_diagnosis.playbook_potential)) issues.push("editorial_diagnosis.playbook_potential must be legal.");
  if (!result.editorial_diagnosis.source_facts_preview.length) issues.push("editorial_diagnosis.source_facts_preview must not be empty.");
  for (const choice of [...result.editorial_diagnosis.recommended_modules, ...result.editorial_diagnosis.modules_to_skip]) {
    if (!analysisModules.includes(choice.module)) issues.push("editorial_diagnosis module choices must use legal modules.");
    if (!choice.reason || choice.reason.trim().length < 2) issues.push("editorial_diagnosis recommended_modules and modules_to_skip must include reasons.");
  }
  if (result.editorial_diagnosis.recommended_modules.length < 2) issues.push("editorial_diagnosis.recommended_modules must include at least 2 module choices.");

  if (result.brief_detail.core_concepts.length < 1) issues.push("brief_detail must include core_concepts.");
  if (!result.brief_detail.background || !result.brief_detail.mechanism_explanation) issues.push("brief_detail must include background and mechanism_explanation.");
  if (result.brief_detail.limitations_and_risks.length < 1) issues.push("brief_detail must include limitations_and_risks.");
  if (result.action_layer.validation_methods.length < 1) issues.push("action_layer must include validation_methods.");
  if (!result.action_layer.action_type.length) issues.push("action_layer.action_type must not be empty.");
  for (const actionType of result.action_layer.action_type) {
    if (!actionTypes.includes(actionType)) issues.push("action_layer.action_type values must be legal.");
  }
  if (
    isSecurityAdjacent(input) &&
    result.action_layer.action_type.some((actionType) => ["hands_on_test", "defensive_lab", "use_now"].includes(actionType)) &&
    (!result.action_layer.safety_boundary || result.action_layer.safety_boundary.length < 20)
  ) {
    issues.push("action_layer.safety_boundary is required for security-adjacent hands-on actions.");
  }
  validateSkillAnalysis(result, input, issues);
  if (
    ["tool", "project", "integration"].includes(input?.content_type ?? "") &&
    !isSkillLikeInput(input) &&
    result.actionability_score >= 70 &&
    result.recommended_action === "try" &&
    !result.action_layer.playbook_candidate
  ) {
    issues.push("actionable tool/project/integration evaluations should be playbook_candidate.");
  }

  if (result.depth_level !== "card_only" && result.depth_level !== "brief") {
    if (result.brief_detail.beginner_explanation.length < 50) issues.push("explainer detail requires beginner_explanation.");
    if (result.brief_detail.terminology.length < 2) issues.push("explainer detail requires terminology explanations.");
    if (result.brief_detail.examples.length < 2) issues.push("explainer detail requires concrete examples.");
    if (!result.brief_detail.innovation_analysis || !result.brief_detail.value_analysis) issues.push("explainer detail requires innovation_analysis and value_analysis.");
    if (result.brief_detail.what_to_look_for.length < 2 || result.brief_detail.good_signs.length < 2 || result.brief_detail.watch_outs.length < 2) {
      issues.push("explainer detail requires what_to_look_for, good_signs, and watch_outs.");
    }
    if (!result.brief_detail.adoption_readiness) issues.push("explainer detail requires adoption_readiness.");
  }

  if (lowInputQualities.includes(result.input_quality)) {
    if (result.confidence_score > 60 || result.card.confidence_score > 60) issues.push(`${result.input_quality} confidence_score must not exceed 60.`);
    if (result.recommended_action === "use_now" || result.action_layer.recommended_action === "use_now") {
      issues.push(`${result.input_quality} must not recommend use_now.`);
    }
    if (result.brief_detail.open_questions.length === 0) issues.push(`${result.input_quality} must include open_questions about source validation.`);
  }

  if (result.depth_level === "deep") {
    if (result.source_facts.length < 3) issues.push("deep evaluation requires at least 3 source_facts.");
    if (result.deep_dive_status !== "generated") issues.push("deep evaluation requires deep_dive_status generated.");
    if (!result.deep_dive) {
      issues.push("deep evaluation requires generated DeepDive.");
    } else {
      if (deepDiveChineseLength(result.deep_dive) < 1500) issues.push("DeepDive must include at least 1500 Chinese characters.");
      if (result.deep_dive.core_concepts.length < 3) issues.push("DeepDive requires at least 3 core concepts.");
      if (!result.deep_dive.mechanism_explanation) issues.push("DeepDive requires mechanism explanation.");
      if (result.deep_dive.comparison_or_alternatives.length < 1) issues.push("DeepDive requires at least 1 comparison or alternative.");
      if (result.deep_dive.practical_test_plan.length < 1) issues.push("DeepDive requires at least 1 practical test plan.");
      if (result.deep_dive.validation_methods.length < 2) issues.push("DeepDive requires at least 2 validation methods.");
      if (result.deep_dive.risks_and_uncertainties.length < 3) issues.push("DeepDive requires at least 3 risks or uncertainties.");
      if (result.deep_dive.learning_takeaways.length < 3) issues.push("DeepDive requires at least 3 learning takeaways.");
    }
  }

  if (!contentTypes.length) issues.push("content types are not configured.");

  validateImagePlan(result.image_plan, input, issues);

  if (!result.prompt_version || !promptVersionPattern.test(result.prompt_version)) {
    issues.push("prompt_version must match /^(eval-v\\d+|deterministic-v\\d+)$/.");
  }

  return issues;
}
