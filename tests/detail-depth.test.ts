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

const sourceInput: EvaluationInput = {
  content_type: "project",
  title: "Agent backend platform",
  sources: [
    {
      id: "source_1",
      source_type: "github",
      source_name: "GitHub",
      text: "The project provides database, auth, storage, compute, hosting, AI gateway, and MCP integration for coding agents.",
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
  summary: "这个项目把数据库、认证、存储、计算、部署和 AI 网关放进同一个 agent 后端平台，目标是让 coding agent 不只会写前端代码，也能操作后端资源。",
  one_sentence_takeaway: "它值得先做小范围试用，但还不能直接当作生产基础设施。",
  why_it_matters: "如果 agent 能稳定理解和操作后端资源，全栈应用交付会从生成代码推进到配置真实服务，但这需要安装、权限和维护信号验证。",
  readability_score: 78,
  impact_score: 74,
  actionability_score: 76,
  confidence_score: 62,
  source_confidence: 62,
  judgment_confidence: 58,
  practical_confidence: 52,
  difficulty: "intermediate",
  recommended_action: "try",
  target_audience: ["developer", "pm"],
  key_facts: ["来源说明项目包含数据库和认证等后端能力。", "来源说明项目提供 MCP 集成给 coding agent 使用。"],
  opportunities: ["可以用小 demo 验证 agent 是否更容易完成全栈任务。", "可以比较它和 Supabase/Firebase 的 agent 适配差异。"],
  risks: ["单一 README 来源不足以证明稳定性。", "后端权限配置错误可能带来数据和部署风险。"],
  next_steps: ["本地跑通最小 demo。", "检查 issues、release 和最近提交。"],
  input_quality: "raw_excerpt",
  depth_level: "standard",
  card: {
    summary: "这个项目把数据库、认证、存储、计算、部署和 AI 网关放进同一个 agent 后端平台，目标是让 coding agent 不只会写前端代码，也能操作后端资源。",
    one_sentence_takeaway: "它值得先做小范围试用，但还不能直接当作生产基础设施。",
    why_it_matters_short: "agent-native backend 可能让 coding agent 更接近真实全栈交付，但需要安装和权限验证。",
    recommended_action: "try",
    readability_score: 78,
    impact_score: 74,
    actionability_score: 76,
    confidence_score: 62,
    difficulty: "intermediate",
    target_audience: ["developer", "pm"],
  },
  source_facts: [
    {
      id: "fact_1",
      claim: "项目提供 database、auth、storage、compute、hosting 和 AI gateway。",
      source_ids: ["source_1"],
      evidence_text: "database, auth, storage, compute, hosting, AI gateway",
      confidence: "high",
    },
    {
      id: "fact_2",
      claim: "项目提供 MCP integration 给 coding agents 使用。",
      source_ids: ["source_1"],
      evidence_text: "MCP integration for coding agents",
      confidence: "high",
    },
    {
      id: "fact_3",
      claim: "项目面向 coding agents 的后端操作场景。",
      source_ids: ["source_1"],
      evidence_text: "for coding agents",
      confidence: "medium",
    },
  ],
  ai_brief_judgment: {
    main_judgment: "这个项目的学习价值在于 agent-native backend 设计，而不是普通 BaaS 功能堆叠。",
    why_it_matters: "它把 agent 能不能真正交付全栈应用的问题推到了后端资源操作层。",
    impact_analysis: "如果 MCP 接口稳定，开发者可以用它测试 agent 操作真实后端资源的能力。",
    based_on_fact_ids: ["fact_1", "fact_2", "fact_3"],
    uncertainty: ["缺少 issue/release/真实安装反馈。"],
  },
  editorial_diagnosis: {
    content_type: "project",
    depth_level: "standard",
    core_question: "这个 agent 后端平台是否值得开发者试用？",
    why_this_is_worth_covering: "它代表 coding agent 从写代码走向操作后端资源的方向。",
    source_facts_preview: [],
    recommended_modules: [
      { module: "source_facts", reason: "需要先确认 README 明确承诺了哪些能力。" },
      { module: "practical_test_plan", reason: "项目价值必须通过最小 demo 验证。" },
    ],
    modules_to_skip: [{ module: "playbook_conversion", reason: "当前缺少真实跑通证据，不应强行转大型 Playbook。" }],
    missing_evidence: ["缺少 issues/release 健康度。", "缺少本地安装跑通结果。"],
    playbook_potential: "weak",
    suggested_reader_takeaway: "先试最小 demo，再决定是否持续关注。",
    depth_reason: "单一来源足以生成标准详情，但不足以进入深度解读。",
    learning_value_score: 76,
    learning_focus: ["agent-native backend", "MCP backend operation"],
    confidence_score: 62,
  },
  brief_detail: {
    tldr: "这是一个适合进入标准详情的项目样本，但还不满足深度解读门槛。",
    background: "coding agent 越来越能写应用代码，但后端资源配置仍然是交付瓶颈。",
    key_points: ["项目覆盖常见后端能力。", "项目通过 MCP 面向 coding agent。"],
    why_it_matters: "它可能降低 agent 完成全栈 demo 的摩擦。",
    risks_and_uncertainties: ["缺少真实安装数据。", "缺少维护健康度。"],
    action_summary: "先做最小 demo，不要直接生产采用。",
    validation_methods: ["跑通本地 demo。", "检查 issue 和 release。"],
  },
  deep_dive_status: "needed_not_generated" as const,
  action_layer: {
    recommended_action: "try",
    action_type: ["hands_on_test"],
    next_steps: ["本地跑通最小 demo。", "检查 issues、release 和最近提交。"],
    checklist: ["确认安装成本。", "确认 MCP 权限。"],
    validation_methods: ["跑通本地 demo。", "检查 issue 和 release。"],
    playbook_candidate: false,
  },
};

const longChinese = "这个深度解读段落用于模拟真正的一整页分析。它会解释背景、概念、机制、变化、价值、风险和验证方式，让读者不只是知道项目存在，而是理解它为什么可能改变工作流，以及应该怎样用一个可回滚的小实验判断它是否真的有用。";
const validDeepDive = {
  core_question: "这个 agent 后端平台是否真的能让 coding agent 更可靠地交付全栈应用？",
  background: longChinese.repeat(12),
  core_concepts: [
    { name: "Agent-native backend", explanation: "把后端能力包装成 agent 能理解和操作的接口。", why_it_matters_here: "它决定 agent 是否能越过只写代码的阶段。" },
    { name: "MCP operation layer", explanation: "用标准工具接口暴露后端状态和操作。", why_it_matters_here: "它降低不同 agent 接入后端能力的成本。" },
    { name: "Backend verification loop", explanation: "用真实服务状态验证 agent 操作是否成功。", why_it_matters_here: "它避免只看代码生成结果。" },
  ],
  mechanism_explanation: longChinese.repeat(8),
  what_changed: "agent 从生成代码走向操作数据库、认证、存储和部署等资源。",
  comparison_or_alternatives: ["应与 Supabase/Firebase 的通用 BaaS 方案对比 agent 接入成本、权限边界和验证方式。"],
  why_it_matters_deep: longChinese.repeat(6),
  impact_by_audience: [
    { audience: "developer", impact: "可以用最小 demo 验证 agent 是否能稳定配置后端。" },
    { audience: "pm", impact: "可以把原型交付从前端 mock 推到真实可用流程。" },
  ],
  risks_and_uncertainties: ["MCP 权限配置可能过宽。", "项目维护健康度还需要验证。", "README 承诺不等于真实稳定性。"],
  practical_test_plan: ["用一个 todo app 测试登录、建表、文件上传和部署。"],
  validation_methods: ["记录 agent 完成时间和人工干预次数。", "检查最终服务是否能通过端到端测试。"],
  learning_takeaways: ["学习 agent-native backend 的接口设计。", "学习如何用小实验验证工具价值。", "学习如何把同类替代品纳入采用判断。"],
  related_playbook_idea: "30 分钟评估一个 agent 后端平台是否值得进入工具箱。",
};

async function main() {
  const normalized = normalizeEvaluationResult(baseResult, sourceInput);
  assert(normalized.depth_level === "standard", "standard detail should keep standard depth");
  assert(normalized.brief_detail.tldr.includes("标准详情"), "standard detail should expose BriefDetail");
  assert(normalized.deep_dive_status === "needed_not_generated", "standard detail can declare deep dive is needed but not generated");
  assert(!normalized.deep_dive, "standard detail should not pretend to have generated DeepDive");

  const requestedDeepWithoutGeneratedDive = normalizeEvaluationResult(
    {
      ...baseResult,
      depth_level: "deep" as const,
      editorial_diagnosis: { ...baseResult.editorial_diagnosis, depth_level: "deep" as const },
      deep_dive_status: "needed_not_generated" as const,
    },
    sourceInput,
  );
  assert(
    requestedDeepWithoutGeneratedDive.depth_level === "standard",
    "requested deep detail without a valid DeepDive should be downgraded to standard",
  );
  assert(
    requestedDeepWithoutGeneratedDive.deep_dive_status === "needed_not_generated",
    "downgraded detail should still say deeper analysis is needed",
  );

  const thinDeep = {
    ...baseResult,
    depth_level: "deep" as const,
    editorial_diagnosis: { ...baseResult.editorial_diagnosis, depth_level: "deep" as const },
    deep_dive_status: "generated" as const,
    deep_dive: {
      core_question: "这个项目是否值得深挖？",
      background: "太短。",
      core_concepts: validDeepDive.core_concepts.slice(0, 2),
      mechanism_explanation: "机制解释太短。",
      what_changed: "变化太短。",
      comparison_or_alternatives: [],
      why_it_matters_deep: "重要性太短。",
      impact_by_audience: [{ audience: "developer" as const, impact: "影响太短。" }],
      risks_and_uncertainties: ["风险不足。"],
      practical_test_plan: ["测试不足。"],
      validation_methods: ["验证不足。"],
      learning_takeaways: ["学习点不足。"],
      related_playbook_idea: "Playbook 想法太短。",
    },
  };
  const normalizedThinDeep = normalizeEvaluationResult(thinDeep, sourceInput);
  assert(normalizedThinDeep.depth_level === "standard", "thin generated DeepDive should be downgraded to standard detail");
  assert(normalizedThinDeep.deep_dive_status === "needed_not_generated", "thin generated DeepDive should keep the deeper-analysis-needed status");
  assert(!normalizedThinDeep.deep_dive, "thin generated DeepDive should not be exposed as a valid deep_dive object");

  const validDeep = {
    ...baseResult,
    depth_level: "deep" as const,
    editorial_diagnosis: { ...baseResult.editorial_diagnosis, depth_level: "deep" as const, playbook_potential: "strong" as const },
    deep_dive_status: "generated" as const,
    deep_dive: validDeepDive,
    action_layer: {
      ...baseResult.action_layer,
      action_type: ["hands_on_test", "convert_to_playbook"] as const,
      playbook_candidate: true,
    },
  };
  const validIssues = validateEvaluationResult(validDeep, sourceInput);
  assert(validIssues.length === 0, `valid generated DeepDive should pass validation: ${validIssues.join(", ")}`);
}

export default main();
