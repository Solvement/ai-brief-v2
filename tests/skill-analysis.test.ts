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

const skillPackInput: EvaluationInput = {
  content_type: "project",
  title: "addyosmani/agent-skills",
  sources: [
    {
      id: "github_repo",
      source_type: "github",
      source_name: "GitHub",
      text:
        "Agent Skills are production-grade engineering skills for AI coding agents. The pack includes /spec, /plan, /build, /test, /review, and /ship workflows with steps, verification gates, and anti-rationalization tables. It lists support for Claude Code, Cursor, Gemini CLI, Windsurf, OpenCode, GitHub Copilot, and Codex.",
    },
  ],
  metadata: {
    source_type: "github",
    source_count: 1,
    has_official_source: false,
    collected_at: "2026-05-08T12:00:00-04:00",
  },
  input_quality: "raw_excerpt",
};

const narrowSkillInput: EvaluationInput = {
  content_type: "project",
  title: "single lint-fix SKILL.md",
  sources: [
    {
      id: "skill_file",
      source_type: "github",
      source_name: "GitHub",
      text:
        "This SKILL.md tells an agent to run npm run lint before answering. Trigger: when the user asks for lint cleanup. It does not define a reusable engineering workflow or multi-step delivery process.",
    },
  ],
  metadata: {
    source_type: "github",
    source_count: 1,
    has_official_source: false,
    collected_at: "2026-05-08T12:00:00-04:00",
  },
  input_quality: "raw_excerpt",
};

const baseResult = {
  summary:
    "这个 skill pack 把 AI coding agent 常见的软件交付流程拆成可加载的规则文件，重点不是抽象讲工程理念，而是让用户判断它是否值得安装、试用、抽取规则，或继续观察。",
  one_sentence_takeaway: "先判断是否值得安装，再拆解规则、触发场景和验证方式。",
  why_it_matters:
    "Skill Pack 会直接改变 agent 的上下文和行为，如果只写成理论文章，用户无法判断安装成本、触发是否清晰、规则是否具体，以及是否会和现有规则冲突。",
  readability_score: 76,
  impact_score: 84,
  actionability_score: 82,
  confidence_score: 72,
  difficulty: "intermediate",
  recommended_action: "try",
  target_audience: ["developer", "pm"],
  key_facts: [
    "来源文本把该项目称为 production-grade engineering skills for AI coding agents。",
    "来源文本列出了 /spec、/plan、/build、/test、/review、/ship 等工作流。",
  ],
  opportunities: [
    "可以通过轻量对照实验判断 skill 是否真的改变 agent 行为。",
    "可以抽取其中最有效的规则沉淀到本项目的工作流里。",
  ],
  risks: [
    "Skill 仍然是指令层约束，不等于系统级权限控制。",
    "全量安装可能增加上下文成本并和已有 AGENTS.md 规则冲突。",
  ],
  next_steps: [
    "先阅读 skill 清单，判断哪些规则和当前工具兼容。",
    "用一个小任务做无 skill 和有 skill 的对照实验。",
  ],
  input_quality: "raw_excerpt",
  depth_level: "standard",
  card: {
    summary:
      "这个 skill pack 把 AI coding agent 常见的软件交付流程拆成可加载的规则文件，重点不是抽象讲工程理念，而是让用户判断它是否值得安装、试用、抽取规则，或继续观察。",
    one_sentence_takeaway: "先判断是否值得安装，再拆解规则、触发场景和验证方式。",
    why_it_matters_short: "Skill Pack 会直接改变 agent 的上下文和行为，必须先看安装价值、规则具体度和验证方式。",
    recommended_action: "try",
    readability_score: 76,
    impact_score: 84,
    actionability_score: 82,
    confidence_score: 72,
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
      claim: "The pack includes /spec, /plan, /build, /test, /review, and /ship workflows.",
      source_ids: ["github_repo"],
      evidence_text: "/spec, /plan, /build, /test, /review, and /ship workflows",
      confidence: "high",
    },
    {
      id: "fact_3",
      claim: "The source lists support for Claude Code, Cursor, Gemini CLI, Windsurf, OpenCode, GitHub Copilot, and Codex.",
      source_ids: ["github_repo"],
      evidence_text: "Claude Code, Cursor, Gemini CLI, Windsurf, OpenCode, GitHub Copilot, and Codex",
      confidence: "high",
    },
  ],
  ai_brief_judgment: {
    main_judgment:
      "这类内容应首先被当作可安装的 agent 行为包评估，而不是当作普通思想文章处理。",
    why_it_matters:
      "用户真正需要知道的是它是否值得安装、适合哪些工具、会触发什么行为、如何快速验证是否有效。",
    impact_analysis:
      "如果规则具体且验证门禁清楚，它可能减少反复提醒 agent 的成本；如果触发模糊，则会增加上下文和冲突风险。",
    based_on_fact_ids: ["fact_1", "fact_2", "fact_3"],
    uncertainty: [
      "还没有在不同 agent 工具中实测规则执行稳定性。",
      "还没有量化安装后上下文成本和冲突风险。",
    ],
  },
  editorial_diagnosis: {
    content_type: "project",
    depth_level: "standard",
    core_question: "这个 skill pack 是否值得安装或试用，哪些规则真正会改变 agent 行为？",
    why_this_is_worth_covering:
      "它不是普通开源项目，而是会直接进入 agent 指令上下文的规则包，需要优先判断安装价值和行为影响。",
    source_facts_preview: [],
    recommended_modules: [
      { module: "setup_cost", reason: "Skill 内容首先要判断安装和启用成本。" },
      { module: "validation_methods", reason: "安装后必须用轻量任务验证 agent 行为是否改变。" },
    ],
    modules_to_skip: [
      { module: "alternatives", reason: "Skill pack 当前不需要优先分析商业模式或同类替代品。" },
    ],
    missing_evidence: [
      "缺少不同工具中的安装实测。",
      "缺少启用前后的 agent 行为对照数据。",
    ],
    playbook_potential: "strong",
    suggested_reader_takeaway: "先小范围 try，再决定全量安装或只抽取最有效规则。",
    depth_reason: "它包含可复用工程流程，因此可以进入标准分析并成为 Playbook 候选。",
    learning_value_score: 90,
    learning_focus: ["skill 触发设计", "agent 行为验证", "工程流程规则化"],
    confidence_score: 72,
  },
  deep_dive: {
    tldr: "这个 skill pack 需要以安装价值为第一判断对象，而不是先写成抽象理论文章。",
    beginner_explanation:
      "Skill 就像给 AI coding agent 加一套工作习惯。好的 skill 不只是告诉 agent 要写好代码，而是告诉它什么时候触发、按什么步骤做、做完要留下什么证据，以及用户如何验证它真的改变了行为。",
    background: "AI coding agent 越能自主执行任务，越需要可加载的流程规则来限制它跳过需求、测试和 review。",
    core_concepts: [
      {
        name: "Trigger clarity",
        explanation: "Skill 要说明什么时候应该被调用。",
        why_it_matters_here: "触发不清楚会导致 agent 忽略规则或错误加载规则。",
      },
      {
        name: "Verification gate",
        explanation: "Skill 要要求 agent 留下可检查证据。",
        why_it_matters_here: "否则用户无法判断规则是否真的改善交付质量。",
      },
    ],
    terminology: [
      {
        term: "Skill Pack",
        plain_explanation: "一组可加载到 agent 上下文中的规则文件。",
        why_it_matters: "它会影响 agent 的行为和上下文成本。",
      },
      {
        term: "Context cost",
        plain_explanation: "规则越长，占用的上下文越多。",
        why_it_matters: "上下文成本过高会挤压项目源码和任务信息。",
      },
    ],
    mechanism_explanation:
      "Skill pack 通过规则文件把任务阶段、触发条件、步骤和验证要求放入 agent 上下文，让 agent 在执行时更倾向于遵守这些流程。",
    what_changed: "分析重点从抽象设计理念转向安装判断、规则拆解和快速验证。",
    why_now: "AI coding agent 正在承担更长任务，用户需要判断哪些 skill 真能降低人工监督成本。",
    innovation_analysis: "新意在于把工程流程变成可加载的 agent 行为约束，而不是只写成团队文档。",
    value_analysis: "价值取决于它是否能减少人工提醒、缩小 diff、增加测试和 review 证据。",
    impact_by_audience: [
      { audience: "developer", impact: "可以把个人工程习惯转成 agent 可执行规则。" },
      { audience: "pm", impact: "可以把验收标准前置到 agent 工作流。" },
    ],
    limitations_and_risks: [
      "Skill 是指令层约束，不是权限控制。",
      "全量安装可能带来上下文成本和规则冲突。",
    ],
    open_questions: [
      "不同工具是否都能稳定加载这些 skill？",
      "启用后是否真的减少人工提醒次数？",
    ],
    practical_examples: [
      "用同一个小 bug 对比无 skill 和有 skill 的输出。",
      "记录 agent 是否先写测试、是否运行验证命令。",
    ],
    examples: [
      {
        scenario: "修复一个小 bug",
        explanation: "有 TDD skill 时 agent 应该先写失败测试。",
        expected_value: "验证 skill 是否改变 agent 的默认最短路径。",
      },
      {
        scenario: "做一次 code review",
        explanation: "有 review skill 时 agent 应先列风险和证据。",
        expected_value: "验证 review 是否更可执行。",
      },
    ],
    what_to_look_for: ["是否有清晰触发条件。", "是否有验证门禁。"],
    good_signs: ["规则短而具体。", "每个步骤有成功信号。"],
    watch_outs: ["规则太长导致上下文成本高。", "触发条件模糊。"],
    adoption_readiness: "适合先小范围 try，再决定安装、抽取或跳过。",
  },
  action_layer: {
    recommended_action: "try",
    action_type: ["hands_on_test"],
    next_steps: [
      "按 README 安装或临时复制少量 skill 到当前 agent 工具。",
      "用一个小 bug 运行无 skill / 有 skill 对照测试。",
    ],
    checklist: [
      "确认支持当前 agent 工具。",
      "确认 skill 触发条件清楚。",
      "确认验证方式轻量可执行。",
    ],
    validation_methods: [
      "比较两次输出中是否多了测试、diff 控制和验证证据。",
      "记录人工提醒次数是否下降。",
    ],
    playbook_candidate: true,
  },
};

async function main() {
  const normalized = normalizeEvaluationResult(baseResult, skillPackInput);

  assert(normalized.skill_analysis, "skill-like content should include skill_analysis");
  assert(["install", "try", "extract", "skip", "monitor"].includes(normalized.skill_analysis.install_verdict), "install_verdict should be legal");
  assert(normalized.skill_analysis.supported_tools.includes("Codex"), "supported_tools should preserve or infer concrete tools");
  assert(normalized.skill_analysis.use_cases.length >= 1, "skill_analysis should include use_cases");
  assert(normalized.skill_analysis.not_for.length >= 1, "skill_analysis should include not_for");
  assert(normalized.skill_analysis.skill_inventory.length >= 1, "skill_analysis should include skill_inventory");
  assert(normalized.skill_analysis.best_rules.length >= 1, "skill_analysis should include best_rules");
  assert(normalized.skill_analysis.weak_rules.length >= 1, "skill_analysis should include weak_rules");
  assert(normalized.skill_analysis.design_takeaways.length >= 1, "skill_analysis should include design_takeaways");
  assert(normalized.skill_analysis.installation_steps.length >= 1, "install/try skill should include installation_steps");
  assert(normalized.skill_analysis.quick_validation_test.steps.length >= 1, "install/try skill should include quick validation steps");
  assert(normalized.skill_analysis.install_worthiness_score >= 0 && normalized.skill_analysis.install_worthiness_score <= 100, "skill scores should be 0-100");
  assert(normalized.skill_analysis.contains_reusable_engineering_workflow, "agent-skills should be marked as reusable engineering workflow");
  assert(validateEvaluationResult(normalized, skillPackInput).length === 0, "skill pack analysis should validate");

  const narrowNormalized = normalizeEvaluationResult(
    {
      ...baseResult,
      action_layer: { ...baseResult.action_layer, playbook_candidate: true },
      source_facts: [
        {
          id: "fact_1",
          claim: "This SKILL.md tells an agent to run npm run lint before answering.",
          source_ids: ["skill_file"],
          evidence_text: "run npm run lint before answering",
          confidence: "high",
        },
        {
          id: "fact_2",
          claim: "Trigger: when the user asks for lint cleanup.",
          source_ids: ["skill_file"],
          evidence_text: "Trigger: when the user asks for lint cleanup",
          confidence: "high",
        },
      ],
      editorial_diagnosis: {
        ...baseResult.editorial_diagnosis,
        playbook_potential: "weak",
        depth_reason: "This is a narrow single-purpose skill, so it should not be promoted into a large playbook by default.",
      },
    },
    narrowSkillInput,
  );

  assert(narrowNormalized.skill_analysis, "narrow skill should still get skill_analysis");
  assert(!narrowNormalized.skill_analysis.contains_reusable_engineering_workflow, "narrow skill should not be reusable workflow");
  assert(!narrowNormalized.action_layer.playbook_candidate, "narrow install/try skill should not be forced into a playbook");

  const incompleteSkill = {
    ...normalized,
    skill_analysis: {
      ...normalized.skill_analysis,
      installation_steps: [],
      quick_validation_test: { ...normalized.skill_analysis.quick_validation_test, steps: [] },
    },
  };
  const issues = validateEvaluationResult(incompleteSkill, skillPackInput);
  assert(issues.some((issue) => issue.includes("skill_analysis.installation_steps")), "validator should reject missing install steps");
  assert(issues.some((issue) => issue.includes("quick_validation_test")), "validator should reject missing quick validation");
}

export default main();
