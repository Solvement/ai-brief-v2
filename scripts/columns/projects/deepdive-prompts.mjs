export const PROJECT_DEEP_DIVE_OUTPUT_SCHEMA = {
  one_line_positioning: "大白话一句话定位; missing facts must say 未在 README/artifact 说明",
  one_line_punchline: "短促有力的一句话,必须不同于 one_line_positioning;没有就留空字符串",
  why_hot: ["3-5 bullets; each bullet may be a string or {title, body}"],
  artifact_audit_rows: [{ item: "README/src/tests/license/...", status: "available|not_found|partial", evidence: "README/artifact pointer" }],
  tech_breakdown_md: "Markdown body for 技术拆解, dispatched by project_type; only use ###/#### headings and bold, never # or ##",
  value_to_us: {
    learn: "能学什么",
    to_aibrief: "迁移到 AI-Brief",
    to_briefmem: "迁移到 BriefMem",
    resume: "简历故事",
  },
  risks: ["grounded risks only"],
  next_actions: ["skip|star|read-docs|clone-and-run|write-deepdive|extract-pattern(...)"],
  memory_card: {
    problem_pattern: "problem pattern",
    architecture_pattern: "architecture pattern",
    reusable_pattern: "reusable pattern",
    risk_pattern: "risk pattern",
    similar_projects: "similar projects, or 未在 README/artifact 说明",
  },
  reasoning_trace: {
    paper_type_decision: "why this project_type/shape",
    central_contribution: "central contribution as a string, not an object",
    inspected: ["README/artifact fields actually inspected"],
    top_claims: ["top grounded claims"],
    evidence_needed: ["what evidence settles each claim"],
    main_threats: ["main threats"],
    transfer_decision: "what to reuse / not reuse",
  },
  project_verdict: {
    verdict: "skip|watch|L1|deep_dive|clone_and_run",
    relevance_to_ai_engineer: 1,
    engineering_depth: 1,
    reuse_value: 1,
    maturity: 1,
    main_risk: "main risk",
  },
  claim_ledger: [{
    claim: "claim text",
    plain_english: "大白话翻译",
    source: "README/artifact source pointer",
    evidence_strength: "high|medium|low|none",
    supports: "what the evidence supports",
    does_not_support: "boundary",
    threat: "risk/threat",
  }],
  concepts: [{
    slug: "lowercase-hyphen-slug",
    name: "concept name",
    explanation: "reusable pattern explanation",
    tags: ["tag"],
    maturity: "stable|active|emerging|deprecated",
    examples: ["grounded example"],
    common_misunderstandings: ["boundary"],
    open_questions: ["question"],
  }],
  artifact: {
    slug: "repo artifact slug",
    artifact_type: "repo",
    url: "repo URL or not_found",
    official_or_third_party: "official|third_party|referenced",
    status: "available|partial|on_hold|missing|broken",
    license: "SPDX/license or 未在 README/artifact 说明",
    runnable: "yes|no|unknown",
    missing_parts: ["missing parts"],
    last_checked: "YYYY-MM-DD",
    summary: "artifact audit summary",
  },
};

export const PROJECT_TYPE_TECH_FOCUS = {
  ai_app: "判断它只是 wrapper 还是有真实工作流、状态管理、部署路径和错误处理。",
  agent_framework: "拆 agent loop、tool interface、state/memory、planner、sandbox、安全边界。",
  devtool_cli: "拆它嵌入开发流的位置、命令入口、配置、插件/扩展、错误处理。",
  model_infra: "拆性能、成本、部署、benchmark、可观测性和运维边界。",
  frontend_ui: "拆交互、组件、状态管理、可迁移的 UI/UX 模式。",
  dataset_benchmark: "拆数据来源、规模、泄漏风险、license、可复用的评测协议。",
  library_sdk: "拆 API 设计、抽象边界、依赖、扩展点和兼容性。",
  template_boilerplate: "拆脚手架覆盖范围、可改点、默认配置和上手成本。",
  non_ai_eng: "拆非 AI 工程价值:开发流、可靠性、维护性、安全性,并说明为什么仍然值得/不值得 AI 工程师看。",
};

const OUTPUT_SCHEMA_TEXT = JSON.stringify(PROJECT_DEEP_DIVE_OUTPUT_SCHEMA, null, 2);

export function projectDeepDiveSystemPrompt(projectType = "", finalDepth = "deep") {
  const focus = PROJECT_TYPE_TECH_FOCUS[projectType] || "先按 project_type 判断技术拆解重点;不能确定时写 未在 README/artifact 说明。";
  const depthContract = finalDepth === "analysis"
    ? "Depth contract: deterministic final_depth=analysis. Do not upgrade to deep. Write 600-1000 Chinese characters total. Include: problem solved, core functions, directory/tree signals, usage scenario, toolbox fit, a 30-minute test plan, risks/gaps, and recommended_action=analyze/try/extract. Keep the brief-wiki JSON shape, but keep each field concise and grounded."
    : "Depth contract: deterministic final_depth=deep. Deep is quality-gated, not quota-gated. Write 1500-3000 Chinese characters total, grounded in README/docs/tree/examples/config. Include the full deep section list: one-sentence judgment, real engineering problem, why now, architecture breakdown, key modules, similar-project comparison, deploy/try path, risks/limits, what I can learn, interview/project talking points, 60-second interview pitch, and whether it can become my project or playbook.";

  return `你是 AI-Brief 的 project-analyst,负责把 GitHub 项目写成 brief-wiki typed memory。

${depthContract}

必须使用中文,而且是「大白话两层写法」:
- 第一层先说人话:它解决什么痛点、像什么、为什么有用。
- 第二层再说术语:术语第一次出现必须解释;缩写第一次出现必须展开并解释。
- 数字只服务结论,不要堆热度数字。
- 所有判断必须落在 README 和 artifactAudit 上;不能使用你自己的常识补全。
- README/artifact 没写的内容,统一写「未在 README/artifact 说明」。
- 不要编造 stars、license、benchmark、硬件、数据规模、API key、安装命令、测试命令或内部源码细节。
- discovery/trending 只能解释为什么被发现,不能当技术证据。
- LLM must not exceed deterministic max_allowed_depth or final_depth. If evidence is thin, stay thin.
- 每个关键结论都必须进入 claim_ledger:claim + plain_english + source + evidence_strength + supports + does_not_support + threat。
- one_line_positioning 是描述性定位;one_line_punchline 是单独的短句 punchline,不能复制 one_line_positioning。
- tech_breakdown_md 只能使用 ### / #### 小标题和加粗,绝不能使用 # 或 ## 标题。

技术拆解必须按 project_type 分诊。本项目 project_type=${projectType || "unknown"};本次重点:${focus}

project_type 分诊表:
- ai_app: wrapper vs real workflow/state/deploy/error handling。
- agent_framework: agent loop/tool interface/state/memory/planner/sandbox/safety。
- devtool_cli: 嵌入开发流位置/命令/配置/插件/错误处理。
- model_infra: 性能/成本/部署/benchmark/可观测。
- frontend_ui: 交互/组件/状态/可迁移。
- dataset_benchmark: 数据来源/规模/泄漏/license/可复用。
- library_sdk: API 设计/抽象/依赖。
- template_boilerplate: 脚手架范围/可改点。
- non_ai_eng: 工程价值。

只输出一个严格 JSON object,不要 markdown fence,不要注释,不要尾随逗号。JSON schema:
${OUTPUT_SCHEMA_TEXT}`;
}

export function projectDeepDiveUser(candidate, evidence, triage, options = {}) {
  const repo = candidate?.raw || candidate || {};
  const maxReadmeChars = Number(options.readmeMaxChars) || 24000;
  return JSON.stringify({
    repo: publicRepo(repo),
    candidate: {
      id: candidate?.id || "",
      source: candidate?.source || "",
      discoveredAt: candidate?.discoveredAt || "",
    },
    triage: publicTriage(triage),
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
    depth_decision: triage?.depth_decision || triage || null,
    evidence_signals: evidence?.evidenceSignals || evidence?.evidence_signals || evidence?.metadata?.evidenceSignals || evidence?.metadata?.evidence_signals || null,
    readme: String(evidence?.content || "").slice(0, maxReadmeChars),
    review_issues_to_fix: Array.isArray(options.reviewIssues) ? options.reviewIssues : [],
    instruction: "按 deterministic final_depth 生成 JSON;所有缺失事实写 未在 README/artifact 说明;不准超过 max_allowed_depth。",
  });
}

function publicRepo(repo = {}) {
  return {
    fullName: repo.fullName,
    owner: repo.owner,
    name: repo.name,
    url: repo.url,
    description: repo.description,
    language: repo.language,
    stars: repo.stars,
    forks: repo.forks,
    starsGained: repo.starsGained,
    windows: repo.windows || [],
    sourceTerms: repo.sourceTerms || [],
  };
}

function publicTriage(triage = {}) {
  return {
    tldr: triage.tldr,
    tags: triage.tags || [],
    light: triage.light,
    reason: triage.reason,
    worthDeepDive: triage.worthDeepDive,
    intent: triage.intent,
    project_type: triage.project_type,
    verdict: triage.verdict,
    ratings: triage.ratings,
    rankingReason: triage.rankingReason,
    ranking_score: triage.ranking_score,
    max_allowed_depth: triage.max_allowed_depth,
    final_depth: triage.final_depth,
    recommended_action: triage.recommended_action,
    needs_enrichment: triage.needs_enrichment,
    ranking_reasons: triage.ranking_reasons || [],
    rejection_reasons: triage.rejection_reasons || [],
  };
}
