export const PROJECT_DEEP_DIVE_OUTPUT_SCHEMA = {
  tier_template: {
    tier: "0|1|2|3",
    bucket: "资源类|无关类|老回潮|真·新项目",
    tag: "[Tier X｜桶]",
    one_sentence_positioning: "是什么/给谁用",
    what_it_does: "1-2句",
    metadata: { language: "string", total_stars: 0, stars_in_period: 0, author: "string" },
    labels: ["agent/推理/工具/数据/infra"],
    pain_point: "Tier2+: 之前怎么做、为什么烦; 信息不足写 数据不足",
    core_capabilities: ["Tier2+: 3条具体功能"],
    how_to_run: { install_command: "真实命令或 数据不足", minimal_example: "真实示例或 数据不足" },
    maturity_signals: { star_velocity: "string", recent_commit: "string", releases: "string", issue_activity: "string" },
    comparison: "Tier2+: 将 comparison_table 汇总成一段中文 prose; 表为空时必须写 数据不足",
    comparison_table: [{
      alternative: "Tier2+: 具名替代品(如 mem0 / Letta); 没有真实依据时留空数组 []",
      difference: "和本项目的具体差异点(机制/范围/接口),不是泛泛而谈; 禁止只点名",
      maturity_vs: "成熟度对比(star/活跃/release/生产就绪 谁更成熟); 证据不足写 数据不足",
      tradeoff: "选它 vs 选本项目的取舍; 证据不足写 数据不足",
    }],
    trajectory_note: "appears_in_tabs 轨迹判断",
    manual_confirmation: "Tier3 必须 true",
    how_it_works_with_analogy: "Tier3+: 核心机制+类比",
    essential_design_difference: "Tier3+: 设计取舍",
    practitioner_meaning: "Tier3+: 对从业者意味着什么",
    cross_links: ["论文/模型交叉链接; 无则 []"],
  },
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
  builder_reuse: {
    pattern: "如果我要造类似的东西,可复用的关键抽象/模式名称; must be specific, not vague",
    copy: "what to copy concretely",
    skip: "what not to copy / where evidence is thin",
    why_it_matters: "what this unlocks for applied AI builders",
  },
  dependency_platform_risk: {
    dependency: "third-party platform/ecosystem/API dependency, or 未在 README/artifact 说明",
    what_if_change: "what concretely breaks if that dependency changes",
    exposure: "high|medium|low|unknown",
    mitigation_or_unknown: "grounded mitigation, or README 未说明",
  },
  unknowns: ["未知与待确认; only list things README/artifact do not document"],
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
    attribution: "自报|已核实|不适用",
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
    ? "Depth contract: deterministic final_depth=analysis / Tier 2. Do not upgrade to Tier 3. Fill tier_template with Tier2 fields: pain point, 3 concrete capabilities, install command + minimal runnable example if present, maturity signals, horizontal comparison_table + comparison prose summary, trajectory note. comparison_table must contain 1-2 named alternatives with real difference/maturity_vs/tradeoff; if no comparable evidence exists, use comparison_table=[] and comparison=\"数据不足\". If any field lacks evidence, write 数据不足."
    : "Depth contract: deterministic final_depth=deep / Tier 3. Deep is quality-gated, not quota-gated. Mark tier_template.manual_confirmation=true and fill all Tier2 fields, including comparison_table + comparison prose summary, plus how it works + analogy, essential design tradeoff, practitioner meaning, and cross-links. Tier3 uses codex GPT-5.5 high in the decoupled path.";

  return `你是 AI-Brief 的 project-analyst,负责把 GitHub 项目写成 brief-wiki typed memory。

${depthContract}

必须使用中文,而且是「大白话两层写法」:
- 第一层先说人话:它解决什么痛点、像什么、为什么有用。
- 第二层再说术语:术语第一次出现必须解释;缩写第一次出现必须展开并解释。
- 数字只服务结论,不要堆热度数字。
- 所有判断必须落在 README 和 artifactAudit 上;不能使用你自己的常识补全。
- 归因纪律:凡是来自 README、官网营销文案、徽章/badge、benchmark、覆盖率、"supports N"、百分比、最快/最佳/唯一等自我宣传的说法,必须写成归因,不能写成事实。写「README 自称覆盖 10/10 OWASP」「README 声称比 Whisper 快 170x」「README 称支持 10+ 平台」,不要写「覆盖 10/10」「快 170x」「支持 14 个平台」。
- claim_ledger.attribution 硬约束:每条带数字/benchmark/覆盖率/百分比/"supports N"/最快/最佳/唯一的 claim_ledger 项必须填写 attribution。README/artifact/官网/徽章/badge/作者自述/项目自称来源 => "自报";只有具名独立来源(第三方 leaderboard/评测/论文,非本项目自己)可写 "已核实";非指标类主张写 "不适用"。只点名来源但不做 attribution 不算落实。
- 数字纪律:绝不发明、四舍五入、补齐或推断数量/指标。必须引用来源的原始措辞;如果 README 写「10+」且列表实际列出 13 个,就写「README 称 10+，列表实际列出 13 个」,不能写 14 个。数不清时只写「至少/约」并带来源。
- 上面两条也适用于 reasoning_trace.top_claims、claim_ledger.claim、claim_ledger.plain_english,不允许在结构化字段里裸写营销数字。
- README/artifact 没写的内容,统一写「未在 README/artifact 说明」。
- unknowns 硬约束正文:任何放进 unknowns / 未知与待确认的对象、机制、计数或实现细节,正文任何地方都不得再当事实断言。只能写「README 未说明其实现/不能确认」或直接省略;body 与 unknowns 不得矛盾。
- 禁止把推断的内部机制写成事实;输出中不要出现「可能/也许/应该/看起来/大概」。证据没有写,就省略或放进 unknowns / 未知与待确认;风险场景用「若 X 改变,则 Y 会坏/会暴露」。
- 不要编造 stars、license、benchmark、硬件、数据规模、API key、安装命令、测试命令或内部源码细节。
- discovery/trending 只能解释为什么被发现,不能当技术证据。
- LLM must not exceed deterministic max_allowed_depth or final_depth. If evidence is thin, stay thin.
- 正文叙述里的每个实质事实断言都必须带短内联来源锚点,格式如「（来源：README Key Features）」「（来源：artifactAudit package_files）」。这包括 one_line_positioning、why_hot、tech_breakdown_md、value_to_us、risks、builder_reuse、dependency_platform_risk、memory_card;不能只在 claim_ledger 里给来源。
- 每个关键结论都必须进入 claim_ledger:claim + plain_english + source + evidence_strength + supports + does_not_support + threat。
- one_line_positioning 是描述性定位;one_line_punchline 是单独的短句 punchline,不能复制 one_line_positioning。
- tech_breakdown_md 只能使用 ### / #### 小标题和加粗,绝不能使用 # 或 ## 标题。
- 必须填写 builder_reuse:回答「如果我要造类似的东西,可复用的关键抽象/模式是什么」。pattern 必须命名具体模式,如 MCP tool-server pattern、token-compression middleware、policy-interception hook,并写清 copy vs skip;不能写泛泛的「可迁移经验」。
- 只被 README 点名、但没有机制说明的功能,不能升级成 builder_reuse.pattern;应写入 builder_reuse.skip 或 unknowns,来源锚点写「README 未说明」。
- 如 README/artifact 显示依赖第三方平台、宿主生态、社交平台或外部 API,必须填写 dependency_platform_risk 的 what-if:该依赖改接口/规则/权限/计费后具体会坏什么、暴露度多高。没有文档证据时写「未在 README/artifact 说明」,不要猜。
- Concreteness contract: every section must contain specific, concrete detail from the actual repo, not only category labels or framework sketches.
- how_it_works / tech_breakdown_md must walk a real flow with a real example. Include actual config/code/commands/file paths where present: policy rule text, function call, CLI command, deny/allow path, package/module path, or test/example path. Do not write "it uses a policy engine/interceptor/workflow" unless you show the concrete mechanism and example.
- claim_ledger and key evidence must state the concrete mechanism, number, config, path, command, or example that supports each claim. Do not write abstract capability claims without the literal source detail.
- Actively pull real snippets, config keys, commands, numbers, module names, and file paths from README + source/docs/examples/config/tests. The output should read like someone inspected the code, not skimmed the README.
- Standard: "more useful than a full translation." Preserve the concrete details a raw translation would carry, then organize and judge them. Any section with only a framework/category and no concrete example/number/snippet/command/path is a failure.
- If a section fails that concreteness standard, add a top-level render_warnings array explaining which section is too abstract and why.
- Concreteness must not reintroduce fabrication. Every concrete specific must be sourced inline and attributed. If a concrete detail cannot be found, write unknown / not explained by README/docs/tree; do not invent.
- Canonical Projects paradigm: every output must include tier_template. Tier2/3 are invalid unless they include maturity judgment + horizontal comparison. Tier2/3 must emit tier_template.comparison_table: 1-2 named alternatives, each with real difference, maturity_vs, and tradeoff; similar projects that are only named without differences do not count as horizontal comparison and are invalid. If no comparable evidence exists, set comparison_table=[] and comparison="数据不足"; do not invent.

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
    instruction: "按 deterministic final_depth 生成 JSON;正文实质断言必须带内联来源锚点;README/营销/badge/benchmark/覆盖率/supports N/百分比/最高最快等说法必须写成 README 自称/声称/称,不能当事实,reasoning_trace 与 claim_ledger 也一样;每条 claim_ledger 必须按来源填写 attribution:README/artifact/官网/徽章/作者自述=>自报,具名第三方=>已核实,非指标=>不适用;不要发明、补齐、四舍五入或推断数量,逐字保留来源数字;所有缺失事实写 未在 README/artifact 说明 或放进 unknowns;unknowns 中的对象/机制/计数不得在正文当事实断言;输出中不要出现 可能/也许/应该/看起来/大概;不准超过 max_allowed_depth。",
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
