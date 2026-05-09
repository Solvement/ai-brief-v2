import {
  normalizeEvaluationResult,
  validateEvaluationResult,
  type EvaluationInput,
} from "../src/lib/ai/evaluation/schema";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const projectInput: EvaluationInput = {
  content_type: "project",
  title: "agent-skills",
  sources: [
    {
      id: "github_repo",
      source_type: "github",
      source_name: "GitHub",
      text:
        "Agent Skills are production-grade engineering skills for AI coding agents. Skills encode workflows, quality gates, and best practices that senior engineers use when building software.",
    },
    {
      id: "author_article",
      source_type: "official",
      source_name: "Addy Osmani",
      text:
        "AI coding agents default to the shortest path to done. A skill is a workflow with checkpoints, evidence, and exit criteria, not just reference documentation.",
    },
  ],
  metadata: {
    source_type: "github",
    source_count: 2,
    has_official_source: true,
    collected_at: "2026-05-08T12:00:00-04:00",
  },
  input_quality: "multi_source_summary",
};

const baseResult = {
  summary:
    "agent-skills 把高级工程师常用的 spec、TDD、review、ship 等流程整理成 AI coding agent 可加载的技能，让 agent 不只是写代码，也能按阶段留下验证证据。",
  one_sentence_takeaway: "它的价值是把工程纪律变成 agent 不容易跳过的流程门禁。",
  why_it_matters:
    "AI coding agent 越能长时间工作，越需要明确的需求澄清、测试、审查和发布门禁，否则输出会变成难以审核的代码堆积。",
  readability_score: 78,
  impact_score: 88,
  actionability_score: 86,
  confidence_score: 82,
  difficulty: "intermediate",
  recommended_action: "try",
  target_audience: ["developer", "pm"],
  key_facts: [
    "仓库将工程流程整理成 AI coding agent 可加载的 skills。",
    "作者文章强调 skill 是 workflow，而不是普通参考文档。",
  ],
  opportunities: [
    "可以用它测试 agent 是否更愿意遵守 TDD 和 review 流程。",
    "可以把有效规则沉淀进 AI-brief 自己的 AGENTS.md。",
  ],
  risks: [
    "GitHub 热度不等于不同 agent 环境里的真实遵守效果。",
    "skill 仍然是指令层约束，不等于系统级权限或 sandbox。",
  ],
  next_steps: [
    "用同一个小 bug 做无 skill 和有 skill 的对照实验。",
    "记录测试、diff、验证证据和人工提醒次数。",
  ],
  input_quality: "multi_source_summary",
  depth_level: "standard",
  card: {
    summary:
      "agent-skills 把高级工程师常用的 spec、TDD、review、ship 等流程整理成 AI coding agent 可加载的技能，让 agent 不只是写代码，也能按阶段留下验证证据。",
    one_sentence_takeaway: "它的价值是把工程纪律变成 agent 不容易跳过的流程门禁。",
    why_it_matters_short: "AI coding agent 越能长时间工作，越需要需求澄清、测试、审查和发布门禁。",
    recommended_action: "try",
    readability_score: 78,
    impact_score: 88,
    actionability_score: 86,
    confidence_score: 82,
    difficulty: "intermediate",
    target_audience: ["developer", "pm"],
  },
  source_facts: [
    {
      id: "fact_1",
      claim: "Agent Skills are production-grade engineering skills for AI coding agents.",
      source_ids: ["github_repo"],
      evidence_text: "production-grade engineering skills for AI coding agents",
      confidence: "high",
    },
    {
      id: "fact_2",
      claim: "Skills encode workflows, quality gates, and best practices used by senior engineers.",
      source_ids: ["github_repo"],
      evidence_text: "workflows, quality gates, and best practices",
      confidence: "high",
    },
    {
      id: "fact_3",
      claim: "Addy Osmani describes a skill as a workflow with checkpoints, evidence, and exit criteria.",
      source_ids: ["author_article"],
      evidence_text: "workflow with checkpoints, evidence, and exit criteria",
      confidence: "high",
    },
  ],
  ai_brief_judgment: {
    main_judgment:
      "agent-skills 最值得学习的是如何把隐性工程经验编码成 agent 不容易跳过的工作流，而不是它收集了多少提示词。",
    why_it_matters:
      "这能帮助 AI-brief 判断一个 agent 项目的价值是否来自真实流程约束，而不是来自仓库热度。",
    impact_analysis:
      "如果它能降低人工提醒次数并提高验证证据质量，就说明 skill 机制正在改变 agent 行为。",
    based_on_fact_ids: ["fact_1", "fact_2", "fact_3"],
    uncertainty: [
      "还没有在 Claude Code、Cursor、Codex 等不同环境里做对照实验。",
      "还没有量化加载 skill 后人工提醒次数是否下降。",
    ],
  },
  deep_dive: {
    tldr:
      "agent-skills 的重点不是提示词合集，而是把工程流程做成 agent 可加载、可验证、可复用的工作流模块。",
    beginner_explanation:
      "如果把 AI coding agent 当成会写代码的协作者，agent-skills 就像给它一本工程操作手册。它不只是提醒 agent 要写好代码，而是要求它在 spec、plan、build、test、review、ship 每个阶段按流程留下证据。",
    background:
      "AI coding agent 经常能快速生成代码，但容易跳过需求澄清、失败测试、代码审查和发布验证。",
    core_concepts: [
      {
        name: "Workflow over prose",
        explanation: "把工程习惯写成步骤、检查点和退出标准，而不是只写原则。",
        why_it_matters_here: "流程比口号更容易被 agent 执行和审核。",
      },
      {
        name: "Verification gate",
        explanation: "每个阶段必须有测试、日志、截图或 diff 等证据。",
        why_it_matters_here: "它能防止 agent 用看起来完成替代真正完成。",
      },
    ],
    terminology: [
      {
        term: "Skill",
        plain_explanation: "一个可加载的工作流说明文件。",
        why_it_matters: "它把经验变成 agent 可重复执行的步骤。",
      },
      {
        term: "Anti-rationalization",
        plain_explanation: "提前写出常见偷懒借口并反驳。",
        why_it_matters: "它能减少 agent 跳过测试或 review 的概率。",
      },
    ],
    mechanism_explanation:
      "系统根据任务阶段加载对应 SKILL.md，agent 按技能里的步骤、检查点和验证要求执行任务。",
    what_changed: "规则文件从泛泛建议升级成阶段化 workflow。",
    why_now: "AI coding agent 正在承担更长任务，缺少流程门禁会让输出更难审核。",
    innovation_analysis:
      "它的新意在于把高级工程师的隐性流程拆成可移植的 Markdown skill，而不是依赖单一 IDE 或模型。",
    value_analysis:
      "如果能减少人工提醒、缩小 diff、增加测试和验证证据，它就能直接提升 agent 交付质量。",
    impact_by_audience: [
      {
        audience: "developer",
        impact: "可以把个人工程习惯沉淀成 agent 规则。",
      },
      {
        audience: "pm",
        impact: "可以把需求澄清和验收标准前置到 agent workflow。",
      },
    ],
    limitations_and_risks: [
      "skill 是文本约束，不是系统权限控制。",
      "不同 agent 是否严格执行 skill 需要实测。",
    ],
    open_questions: [
      "加载 skill 后人工提醒次数是否显著减少？",
      "完整 workflow 是否会占用过多上下文？",
    ],
    practical_examples: [
      "用同一个 bug 分别在无 skill 和有 TDD skill 下运行 agent。",
      "比较两个结果的测试数量、diff 范围和验证证据。",
    ],
    examples: [
      {
        scenario: "修复一个小 bug",
        explanation: "无 skill 时 agent 可能直接改代码；有 TDD skill 时应该先写失败测试。",
        expected_value: "验证 skill 是否改变 agent 行为。",
      },
      {
        scenario: "做一次 PR review",
        explanation: "有 review skill 时 agent 应该先列风险和证据，而不是只总结改动。",
        expected_value: "提高 review 的可操作性。",
      },
    ],
    what_to_look_for: ["是否先写测试。", "是否留下验证证据。"],
    good_signs: ["diff 更小。", "人工提醒次数下降。"],
    watch_outs: ["skill 被 agent 忽略。", "上下文过长导致重点丢失。"],
    adoption_readiness: "适合先做 30 分钟对照实验，再决定是否沉淀进长期规则。",
  },
  action_layer: {
    recommended_action: "try",
    next_steps: [
      "用同一个小 bug 跑无 skill 和有 skill 的对照实验。",
      "记录测试、diff、验证证据和人工提醒次数。",
    ],
    checklist: [
      "确认 agent 是否先澄清需求。",
      "确认 agent 是否先写失败测试。",
      "确认 agent 是否运行验证命令。",
    ],
    validation_methods: [
      "比较无 skill 和有 skill 的人工提醒次数。",
      "比较最终 diff 是否更小且更容易 review。",
    ],
    playbook_candidate: true,
  },
};

async function main() {
  const normalized = normalizeEvaluationResult(baseResult, projectInput);

  assert(normalized.editorial_diagnosis.depth_reason.length > 20, "diagnosis should explain why this depth was selected");
  assert(normalized.editorial_diagnosis.learning_value_score >= 80, "diagnosis should preserve learning value");
  assert(normalized.editorial_diagnosis.learning_focus.length >= 2, "diagnosis should name learning focus areas");
  assert(normalized.editorial_diagnosis.missing_evidence.length >= 2, "diagnosis should keep missing evidence explicit");
  assert(normalized.action_layer.action_type.includes("hands_on_test"), "project action layer should classify hands-on tests");
  assert(validateEvaluationResult(normalized, projectInput).length === 0, "normalized editorial diagnosis should validate");

  const missingDiagnosis = {
    ...normalized,
    editorial_diagnosis: {
      ...normalized.editorial_diagnosis,
      missing_evidence: [],
      recommended_modules: [{ module: "source_facts" as const, reason: "" }],
    },
  };
  const issues = validateEvaluationResult(missingDiagnosis, projectInput);
  assert(normalizeEvaluationResult(missingDiagnosis, projectInput).editorial_diagnosis.missing_evidence.length >= 2, "normalizer should repair missing evidence gaps");
  assert(!issues.some((issue) => issue.includes("missing_evidence")), "validator should accept normalized missing evidence gaps");
  assert(issues.some((issue) => issue.includes("recommended_modules")), "validator should reject module choices without reasons");

  const unsafeSecurityAction = {
    ...normalized,
    action_layer: {
      ...normalized.action_layer,
      action_type: ["hands_on_test" as const],
      safety_boundary: "",
    },
  };
  const securityInput: EvaluationInput = { ...projectInput, content_type: "article", title: "AI security harness" };
  const securityIssues = validateEvaluationResult(unsafeSecurityAction, securityInput);
  assert(
    securityIssues.some((issue) => issue.includes("safety_boundary")),
    "security-adjacent hands-on actions should include a safety boundary",
  );
}

export default main();
