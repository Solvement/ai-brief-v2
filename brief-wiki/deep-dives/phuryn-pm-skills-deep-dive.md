---
content: "phuryn-pm-skills"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "pm-skills — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "phuryn/pm-skills：GitHub 描述为“PM Skills Marketplace: 100+ agentic skills, commands, and plugins — from discovery to strategy, execution, launch, and growth”。"
  what_it_does: "PM Skills Marketplace: 100+ agentic skills, commands, and plugins — from discovery to strategy, execution, launch, and growth."
  metadata:
    language: "数据不足"
    total_stars: "12641"
    stars_in_period: "506"
    author: "phuryn"
  labels:
    - "Tier 2"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "值得看的是结构，不是技术栈。仓库实测有 9 个插件、68 个 `SKILL.md`、42 个 command，且 `python validate_plugins.py` 全部通过、0 warnings；这说明它是一个维护过的提示词/工作流包，而不是零散 prompt 集。（来源：validate_plugins.py report；CLAUDE.md Project Overview）"
  core_capabilities:
    - "command 编排多个 skill"
    - "意图先行的交付审计"
    - "轻量 manifest 与 frontmatter 校验"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，它不是 LangChain/AutoGen 这种 agent runtime；它更像“可安装的 PM 工作流提示词市场”。 1. 对比 Anthropic `security-guidance` plugin：`security-audit-static.md` 自称方法改编自 Anthropic 官方 `claude-plugins-official` 的 Apache-2.0 `security-guidance` 插件。取舍：如果只要安全审计提示词，用原安全插件更窄；如果要“文档意图 -> 安全/性能 -> 测试覆盖 -> shipping packet”，选 `pm-ai-shipping`。（来源：pm-ai-shipping/commands/security-audit-static.md；pm-ai-shipping/commands/ship-check.md） 2. 对比 Claude Code/Cowork 自建 slash commands：自建命令适合公司内部流程；pm-skills 的优势是现成 42 个 workflow、68 个 skill 和 validator。取舍：需要私有流程、专有术语、内部系统路径时自建；需要快速把 PM 工作流塞进 agent 时用 pm-skills。（来源：CLAUDE.md Key Design Rules；validate_plugins.py report） 3. 对比 Gemini CLI/OpenCode/Cursor/Kiro 的 skills-only 拷贝做法：README 明确这些工具主要复制 `skills/*/SKILL.md`，commands 是 Claude-specific。取舍：跨工具可移植时只拿 skill；需要 `/discover`、`/write-prd`、`/ship-check` 这种链式命令体验时优先 Claude/Cowork。（来源：README Other AI assistants；README Codex CLI）"
  trajectory_note: ""
  manual_confirmation: false
  how_it_works_with_analogy: "真实流以 `/discover` 为例： ```mermaid flowchart TD A[marketplace.json] --> B[pm-product-discovery plugin] B --> C[commands discover.md] C --> D[判断新产品或现有产品] D --> E[brainstorm ideas skill] E --> F[identify assumptions skill] F --> G[prioritize assumptions skill] G --> H[brainstorm experiments skill] H --> I[Discovery Plan markdown] I --> J[建议 PRD interview metrics] ``` 安装入口写在 README： `claude plugin marketplace add phuryn/pm-skills` `claude plugin install pm-product-discovery@pm-skills` 这表示宿主平台加载 `.claude-plugin/marketplace.json`，再按 `source: ./pm-product-discovery` 找到插件目录。（来源：README Claude Code CLI；.claude-plugin/marketplace.json） `/discover` 的具体输入例子是 `/discover Smart notification system for our project management tool`；它要求先问用户已有研究、客户反馈、数据和本次决策目标，再让用户在 10 个想法中选 3-5 个继续压力测试。（来源：pm-product-discovery/commands/discover.md Invocation / Workflow） 关键机制不是代码调用，而是 Markdown 指令组合：command 文件用粗体 skill 名引用同插件 skill；validator 会检查 command 里 `**skill-name** skill` 这种引用是否在同一插件中存在。（来源：validate_plugins.py validate_cross_references）"
  essential_design_difference: "最可复用的是“把专家流程拆成 command 编排 + skill 知识块 + validator 形状检查”。这套模式适合迁移到自己的 AI 应用内置工作流。 - command 编排多个 skill；复制 `/discover` 这种结构：输入、步骤、检查点、最终文档、下一步建议。每一步只调用同插件 skill。；如果需要严格状态机、权限控制或可观测性，不能只靠 Markdown command。；`/discover` 把发散、假设、排序、实验串起来，减少模型一次性生成大段空泛建议。（来源：pm-product-discovery/commands/discover.md Workflow） - 意图先行的交付审计；借鉴 `pm-ai-shipping`：先生成 `architecture.md`、`flows.md`、`permissions.md`、`variables.md`，再做 intended-vs-implemented 审计，最后派生 `tests.md`。；如果项目已有成熟 SAST/DAST/CI，这个模式应作为产品意图层补充，不替代安全工具。；它让 agent 审计有“应当如此”的基线，而不是只在代码里找通用漏洞。（来源：pm-ai-shipping/skills/shipping-artifacts/SKILL.md；pm-ai-shipping/skills/intended-vs-implemented/SKILL.md） - 轻量 manifest 与 frontmatter 校验；保留 `.claude-plugin/plugin.json` + `SKILL.md` frontmatter + command frontmatter，并跑 `python3 validate_plugins.py`。；如果 skill 描述需要复杂 YAML、嵌套字段或 schema 版本化，当前简易 parser 不够。；它把目录名、skill name、command argument hint、同插件引用这些易错点自动挡住。（来源：validate_plugins.py REQUIRED_*；CONTRIBUTING.md Guidelines）"
  practitioner_meaning: "建议抽模式，不建议当基础框架依赖。对 AI 应用团队，最值得拿的是三件事：command 链式编排、skill frontmatter 触发描述、`document -> audit -> tests -> packet` 的交付检查顺序。成熟度给 3，是因为结构完整、validator 通过、MIT 许可明确；但没有运行时、CI、真实执行测试或平台兼容报告。（来源：CLAUDE.md Key Design Rules；validate_plugins.py report；LICENSE）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "pm-skills 是一套面向产品经理和 AI 应用交付者的 Claude/Codex 技能与工作流市场，不是模型或运行时框架。"
    body_md: "人话：它把 PRD、发现、策略、发布检查等 PM 工作拆成可安装的 skill 和 slash command。术语：skill 是可自动加载的领域提示词，command 是用户输入 `/discover` 这类命令后串起多个 skill 的工作流。（来源：README How It Works；.claude-plugin/marketplace.json）"
  why_worth_attention:
    summary: ""
    body_md: "值得看的是结构，不是技术栈。仓库实测有 9 个插件、68 个 `SKILL.md`、42 个 command，且 `python validate_plugins.py` 全部通过、0 warnings；这说明它是一个维护过的提示词/工作流包，而不是零散 prompt 集。（来源：validate_plugins.py report；CLAUDE.md Project Overview）"
    bullets:
      - "对做 AI 应用的人：`pm-ai-shipping` 把“先写系统意图文档，再做安全/性能/测试覆盖审计”做成固定顺序，可直接借鉴到 agent 交付流程。（来源：pm-ai-shipping/commands/ship-check.md）"
      - "对 PM 场景：`/discover` 明确串起 brainstorm ideas、identify assumptions、prioritize assumptions、brainstorm experiments，并在中间设置选择检查点。（来源：pm-product-discovery/commands/discover.md Workflow）"
      - "对跨工具使用：README 自称 Claude 支持 skills + slash commands；Codex/Gemini/OpenCode/Cursor/Kiro 主要是 skills-only 路径，工作流命令能力不等价。（来源：README Codex CLI；README Other AI assistants）"
  key_claims_evidence:
    summary: ""
    body_md: "下面只把能从真实仓库文件或本地脚本验证的内容当“已核实”；README 的平台安装和兼容性按“自称”处理。"
    items:
      - claim: "仓库包含 9 个插件、68 个 skills、42 个 commands。"
        plain_english: "这不是单个 prompt，而是一个多插件市场包。"
        source: "validate_plugins.py report；.claude-plugin/marketplace.json plugins"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "本地运行 `python validate_plugins.py` 输出 Plugins: 9, Skills: 68, Commands: 42, Total: 110 components。"
        does_not_support: "不证明这些 workflow 在真实产品团队中有效，也不证明平台安装一定成功。"
        threat: "数量容易制造完整感；质量仍取决于每个 SKILL.md 的具体指令和模型执行。"
      - claim: "`/discover` 是一个真实的链式产品发现 workflow。"
        plain_english: "它不是只说“做 discovery”，而是规定先判断新/旧产品，再发散想法、找假设、排序、设计实验、输出 Discovery Plan。"
        source: "pm-product-discovery/commands/discover.md Workflow"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文件明确引用 `brainstorm-ideas-existing/new`、`identify-assumptions-existing/new`、`prioritize-assumptions`、`brainstorm-experiments-existing/new`。"
        does_not_support: "不保证 Claude 一定按顺序执行，也不提供自动状态机或测试。"
        threat: "这是 Markdown 指令，执行稳定性依赖宿主 agent。"
      - claim: "`pm-ai-shipping` 提供 AI 代码交付前的文档、审计、测试覆盖、交付包顺序。"
        plain_english: "它把“能不能发版”拆成文档基线、agent 上下文、安全审计、性能审计、测试覆盖、shipping packet。"
        source: "pm-ai-shipping/commands/ship-check.md The shipping sequence；pm-ai-shipping/skills/shipping-artifacts/SKILL.md Core documents"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "命令要求生成或刷新 `CLAUDE.md`/`AGENTS.md`，并把 `architecture.md`、`flows.md`、`permissions.md`、`variables.md`、`tests.md` 纳入交付包。"
        does_not_support: "不等于真正跑了安全扫描器、SAST、动态测试或 CI。"
        threat: "如果模型只写文档不读代码，交付包会变成形式主义；该仓库本身也提醒缺少文档时审计不完整。"
      - claim: "仓库有维护规则和本地结构校验器。"
        plain_english: "作者给出了贡献约束，并提供脚本检查 manifest、frontmatter、同插件 skill 引用。"
        source: "CONTRIBUTING.md Guidelines；validate_plugins.py Validators；CLAUDE.md Validation"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "规则包括 skill 需要 `name` + `description`，command 需要 `description` + `argument-hint`，skill name 必须匹配目录名，禁止 command 跨插件硬引用。"
        does_not_support: "不检查 prompt 质量、事实正确性、链接可用性或端到端执行结果。"
        threat: "validator 是轻量 Python 脚本，主要保证形状，不保证业务效果。"
      - claim: "Codex 可安装同一 marketplace，但 slash commands 不作为 Codex slash commands 运行。"
        plain_english: "在 Codex 里更像可调用技能库，不是完整的 `/discover` 命令体验。"
        source: "README Codex CLI"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确写 Codex 读取同一 marketplace file，并给出 `codex plugin marketplace add phuryn/pm-skills` 与 `codex plugin add pm-product-discovery@pm-skills`。"
        does_not_support: "本次未实际执行 Codex 安装，也未验证 Codex 当前版本行为。"
        threat: "Codex 插件能力变化会影响可用性；README 自称 slash commands 安装但不以 Codex slash command 运行。"
      - claim: "仓库没有常规软件包运行时。"
        plain_english: "没有 package.json、pyproject、requirements、Dockerfile；核心资产是 Markdown skill/command 和 JSON manifest。"
        source: "repo tree；rg --files；package file scan"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "实测文件主要为 123 个 `.md`、10 个 `.json`、1 个 `validate_plugins.py`，未发现 package manager 或 Docker 文件。"
        does_not_support: "不说明它不能被 Claude/Codex 安装；只说明它不是传统可运行 SDK。"
        threat: "如果团队期待库、API、CLI 二进制或自动测试，这个仓库不满足。"
  how_it_works:
    summary: ""
    body_md: "真实流以 `/discover` 为例：\n```mermaid\nflowchart TD\nA[marketplace.json] --> B[pm-product-discovery plugin]\nB --> C[commands discover.md]\nC --> D[判断新产品或现有产品]\nD --> E[brainstorm ideas skill]\nE --> F[identify assumptions skill]\nF --> G[prioritize assumptions skill]\nG --> H[brainstorm experiments skill]\nH --> I[Discovery Plan markdown]\nI --> J[建议 PRD interview metrics]\n```\n安装入口写在 README：\n`claude plugin marketplace add phuryn/pm-skills`\n`claude plugin install pm-product-discovery@pm-skills`\n这表示宿主平台加载 `.claude-plugin/marketplace.json`，再按 `source: ./pm-product-discovery` 找到插件目录。（来源：README Claude Code CLI；.claude-plugin/marketplace.json）\n\n`/discover` 的具体输入例子是 `/discover Smart notification system for our project management tool`；它要求先问用户已有研究、客户反馈、数据和本次决策目标，再让用户在 10 个想法中选 3-5 个继续压力测试。（来源：pm-product-discovery/commands/discover.md Invocation / Workflow）\n\n关键机制不是代码调用，而是 Markdown 指令组合：command 文件用粗体 skill 名引用同插件 skill；validator 会检查 command 里 `**skill-name** skill` 这种引用是否在同一插件中存在。（来源：validate_plugins.py validate_cross_references）"
  reusable_abstractions:
    summary: ""
    body_md: "最可复用的是“把专家流程拆成 command 编排 + skill 知识块 + validator 形状检查”。这套模式适合迁移到自己的 AI 应用内置工作流。"
    items:
      - name: "command 编排多个 skill"
        copy: "复制 `/discover` 这种结构：输入、步骤、检查点、最终文档、下一步建议。每一步只调用同插件 skill。"
        skip: "如果需要严格状态机、权限控制或可观测性，不能只靠 Markdown command。"
        why_it_matters: "`/discover` 把发散、假设、排序、实验串起来，减少模型一次性生成大段空泛建议。（来源：pm-product-discovery/commands/discover.md Workflow）"
      - name: "意图先行的交付审计"
        copy: "借鉴 `pm-ai-shipping`：先生成 `architecture.md`、`flows.md`、`permissions.md`、`variables.md`，再做 intended-vs-implemented 审计，最后派生 `tests.md`。"
        skip: "如果项目已有成熟 SAST/DAST/CI，这个模式应作为产品意图层补充，不替代安全工具。"
        why_it_matters: "它让 agent 审计有“应当如此”的基线，而不是只在代码里找通用漏洞。（来源：pm-ai-shipping/skills/shipping-artifacts/SKILL.md；pm-ai-shipping/skills/intended-vs-implemented/SKILL.md）"
      - name: "轻量 manifest 与 frontmatter 校验"
        copy: "保留 `.claude-plugin/plugin.json` + `SKILL.md` frontmatter + command frontmatter，并跑 `python3 validate_plugins.py`。"
        skip: "如果 skill 描述需要复杂 YAML、嵌套字段或 schema 版本化，当前简易 parser 不够。"
        why_it_matters: "它把目录名、skill name、command argument hint、同插件引用这些易错点自动挡住。（来源：validate_plugins.py REQUIRED_*；CONTRIBUTING.md Guidelines）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险来自宿主 agent 平台，而不是依赖库。仓库本身几乎没有运行时代码。"
    items:
      - dependency: "Claude Code / Claude Cowork plugin marketplace"
        what_if_change: "如果 marketplace schema、slash command 行为或 skill 自动加载策略变化，9 个插件的主要体验会受影响。"
        exposure: "high"
        mitigation_or_unknown: "仓库有 `.claude-plugin/marketplace.json` 和 per-plugin `plugin.json`，但未提供平台兼容测试；只能靠 README/validator 形状检查。"
        source: "README Installation；.claude-plugin/marketplace.json；validate_plugins.py"
      - dependency: "OpenAI Codex CLI plugin support"
        what_if_change: "README 自称 Codex 可读同一 marketplace，但 slash commands 不作为 Codex slash commands 运行；如果 Codex 插件 API 变动，安装路径和 skill 暴露方式会变。"
        exposure: "medium"
        mitigation_or_unknown: "README 建议用自然语言复述 workflow，或让 Codex 把 command 文件转成 skill；这是 best-effort，不是已验证转换器。"
        source: "README Codex CLI"
      - dependency: "Gemini CLI / OpenCode / Cursor / Kiro skills folder conventions"
        what_if_change: "这些工具若改变 skills 目录或 SKILL.md 格式，复制安装路径会失效。"
        exposure: "medium"
        mitigation_or_unknown: "README 只给复制路径示例，未提供各工具的自动安装器或兼容测试。"
        source: "README Other AI assistants"
      - dependency: "Product Compass 外部文章和模板链接"
        what_if_change: "如果文章、Google Slides/Sheets 模板链接失效，Further Reading 和模板资产会缺失。"
        exposure: "low"
        mitigation_or_unknown: "核心 skill 指令仍在仓库内；模板链接可用性本次未逐一验证。"
        source: "pm-execution/skills/prioritization-frameworks/SKILL.md Templates；pm-product-strategy/skills/product-strategy/SKILL.md Templates"
      - dependency: "validate_plugins.py 的简易 YAML frontmatter parser"
        what_if_change: "复杂 YAML 语法可能无法正确解析，因为脚本只按平面 `key: value` 正则读取。"
        exposure: "low"
        mitigation_or_unknown: "当前仓库 frontmatter 很简单并通过校验；若扩展字段复杂化，应换成正式 YAML parser。"
        source: "validate_plugins.py parse_yaml_frontmatter"
  unknowns_to_confirm:
    summary: ""
    body_md: "仓库证明了内容结构，但没有证明实际使用效果。"
    items:
      - "未在本次检查中实际执行 Claude/Codex 插件安装；README 的安装体验仍需平台端验证。（来源：README Installation）"
      - "未看到端到端测试或示例运行 transcript；只有 `validate_plugins.py` 做形状校验。（来源：repo tree；validate_plugins.py）"
      - "未看到 package.json、pyproject、Dockerfile 或 CI 配置；这不是传统软件包。（来源：repo tree package scan）"
      - "skill 中的外部文章、Google 模板、Product Compass 链接未逐一验证可用性。（来源：多个 SKILL.md Further Reading / Templates）"
      - "README/CLAUDE.md 自称兼容 Gemini CLI、Cursor、Codex 等，但仓库未提供跨工具自动化兼容报告。（来源：README Other AI assistants；CLAUDE.md Project Overview）"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 4
      工程深度: 3
      复用价值: 4
      成熟度: 3
    body_md: "建议抽模式，不建议当基础框架依赖。对 AI 应用团队，最值得拿的是三件事：command 链式编排、skill frontmatter 触发描述、`document -> audit -> tests -> packet` 的交付检查顺序。成熟度给 3，是因为结构完整、validator 通过、MIT 许可明确；但没有运行时、CI、真实执行测试或平台兼容报告。（来源：CLAUDE.md Key Design Rules；validate_plugins.py report；LICENSE）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\phuryn-pm-skills\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\phuryn-pm-skills\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\phuryn-pm-skills\\codex-last-message.json"
  invoked_at: "2026-06-09T00:28:10.059Z"
  completed_at: "2026-06-09T00:32:25.244Z"
  repo: "phuryn/pm-skills"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "PM Skills Marketplace: 100+ agentic skills, commands, and plugins — from discovery to strategy, execution, launch, and growth."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "仓库包含 9 个插件、68 个 skills、42 个 commands。"
    - "`/discover` 是一个真实的链式产品发现 workflow。"
    - "`pm-ai-shipping` 提供 AI 代码交付前的文档、审计、测试覆盖、交付包顺序。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "README Installation；.claude-plugin/marketplace.json；validate_plugins.py"
    - "README Codex CLI"
    - "README Other AI assistants"
    - "pm-execution/skills/prioritization-frameworks/SKILL.md Templates；pm-product-strategy/skills/product-strategy/SKILL.md Templates"
    - "validate_plugins.py parse_yaml_frontmatter"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 4
  engineering_depth: 3
  reuse_value: 4
  maturity: 3
  main_risk: "建议抽模式，不建议当基础框架依赖。对 AI 应用团队，最值得拿的是三件事：command 链式编排、skill frontmatter 触发描述、`document -> audit -> tests -> packet` 的交付检查顺序。成熟度给 3，是因为结构完整、validator 通过、MIT 许可明确；但没有运行时、CI、真实执行测试或平台兼容报告。（来源：CLAUDE.md Key Design Rules；validate_plugins.py report；LICENSE）"
next_actions:
  - "extract-pattern"
unknowns:
  - "未在本次检查中实际执行 Claude/Codex 插件安装；README 的安装体验仍需平台端验证。（来源：README Installation）"
  - "未看到端到端测试或示例运行 transcript；只有 `validate_plugins.py` 做形状校验。（来源：repo tree；validate_plugins.py）"
  - "未看到 package.json、pyproject、Dockerfile 或 CI 配置；这不是传统软件包。（来源：repo tree package scan）"
  - "skill 中的外部文章、Google 模板、Product Compass 链接未逐一验证可用性。（来源：多个 SKILL.md Further Reading / Templates）"
  - "README/CLAUDE.md 自称兼容 Gemini CLI、Cursor、Codex 等，但仓库未提供跨工具自动化兼容报告。（来源：README Other AI assistants；CLAUDE.md Project Overview）"
builder_reuse:
  pattern: "command 编排多个 skill"
  copy: "复制 `/discover` 这种结构：输入、步骤、检查点、最终文档、下一步建议。每一步只调用同插件 skill。"
  skip: "如果需要严格状态机、权限控制或可观测性，不能只靠 Markdown command。"
  why_it_matters: "`/discover` 把发散、假设、排序、实验串起来，减少模型一次性生成大段空泛建议。（来源：pm-product-discovery/commands/discover.md Workflow）"
dependency_platform_risk:
  dependency: "Claude Code / Claude Cowork plugin marketplace"
  what_if_change: "如果 marketplace schema、slash command 行为或 skill 自动加载策略变化，9 个插件的主要体验会受影响。"
  exposure: "high"
  mitigation_or_unknown: "仓库有 `.claude-plugin/marketplace.json` 和 per-plugin `plugin.json`，但未提供平台兼容测试；只能靠 README/validator 形状检查。"
claim_ledger:
  - claim: "仓库包含 9 个插件、68 个 skills、42 个 commands。"
    plain_english: "这不是单个 prompt，而是一个多插件市场包。"
    source: "validate_plugins.py report；.claude-plugin/marketplace.json plugins"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "本地运行 `python validate_plugins.py` 输出 Plugins: 9, Skills: 68, Commands: 42, Total: 110 components。"
    does_not_support: "不证明这些 workflow 在真实产品团队中有效，也不证明平台安装一定成功。"
    threat: "数量容易制造完整感；质量仍取决于每个 SKILL.md 的具体指令和模型执行。"
  - claim: "`/discover` 是一个真实的链式产品发现 workflow。"
    plain_english: "它不是只说“做 discovery”，而是规定先判断新/旧产品，再发散想法、找假设、排序、设计实验、输出 Discovery Plan。"
    source: "pm-product-discovery/commands/discover.md Workflow"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文件明确引用 `brainstorm-ideas-existing/new`、`identify-assumptions-existing/new`、`prioritize-assumptions`、`brainstorm-experiments-existing/new`。"
    does_not_support: "不保证 Claude 一定按顺序执行，也不提供自动状态机或测试。"
    threat: "这是 Markdown 指令，执行稳定性依赖宿主 agent。"
  - claim: "`pm-ai-shipping` 提供 AI 代码交付前的文档、审计、测试覆盖、交付包顺序。"
    plain_english: "它把“能不能发版”拆成文档基线、agent 上下文、安全审计、性能审计、测试覆盖、shipping packet。"
    source: "pm-ai-shipping/commands/ship-check.md The shipping sequence；pm-ai-shipping/skills/shipping-artifacts/SKILL.md Core documents"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "命令要求生成或刷新 `CLAUDE.md`/`AGENTS.md`，并把 `architecture.md`、`flows.md`、`permissions.md`、`variables.md`、`tests.md` 纳入交付包。"
    does_not_support: "不等于真正跑了安全扫描器、SAST、动态测试或 CI。"
    threat: "如果模型只写文档不读代码，交付包会变成形式主义；该仓库本身也提醒缺少文档时审计不完整。"
  - claim: "仓库有维护规则和本地结构校验器。"
    plain_english: "作者给出了贡献约束，并提供脚本检查 manifest、frontmatter、同插件 skill 引用。"
    source: "CONTRIBUTING.md Guidelines；validate_plugins.py Validators；CLAUDE.md Validation"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "规则包括 skill 需要 `name` + `description`，command 需要 `description` + `argument-hint`，skill name 必须匹配目录名，禁止 command 跨插件硬引用。"
    does_not_support: "不检查 prompt 质量、事实正确性、链接可用性或端到端执行结果。"
    threat: "validator 是轻量 Python 脚本，主要保证形状，不保证业务效果。"
  - claim: "Codex 可安装同一 marketplace，但 slash commands 不作为 Codex slash commands 运行。"
    plain_english: "在 Codex 里更像可调用技能库，不是完整的 `/discover` 命令体验。"
    source: "README Codex CLI"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确写 Codex 读取同一 marketplace file，并给出 `codex plugin marketplace add phuryn/pm-skills` 与 `codex plugin add pm-product-discovery@pm-skills`。"
    does_not_support: "本次未实际执行 Codex 安装，也未验证 Codex 当前版本行为。"
    threat: "Codex 插件能力变化会影响可用性；README 自称 slash commands 安装但不以 Codex slash command 运行。"
  - claim: "仓库没有常规软件包运行时。"
    plain_english: "没有 package.json、pyproject、requirements、Dockerfile；核心资产是 Markdown skill/command 和 JSON manifest。"
    source: "repo tree；rg --files；package file scan"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "实测文件主要为 123 个 `.md`、10 个 `.json`、1 个 `validate_plugins.py`，未发现 package manager 或 Docker 文件。"
    does_not_support: "不说明它不能被 Claude/Codex 安装；只说明它不是传统可运行 SDK。"
    threat: "如果团队期待库、API、CLI 二进制或自动测试，这个仓库不满足。"
render_warnings:
  - "faithfulness.unknown_assertion line 55 term \"Cursor\": 横向看，它不是 LangChain/AutoGen 这种 agent runtime；它更像“可安装的 PM 工作流提示词市场”。 1. 对比 Anthropic `security-guidance` plugin：`security-audit-static.md` 自..."
artifact_audit:
  official_repo: "https://github.com/phuryn/pm-skills"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

phuryn/pm-skills：GitHub 描述为“PM Skills Marketplace: 100+ agentic skills, commands, and plugins — from discovery to strategy, execution, launch, and growth”。

（来源：README/artifactAudit）

## 干什么

PM Skills Marketplace: 100+ agentic skills, commands, and plugins — from discovery to strategy, execution, launch, and growth.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | 数据不足 |
| total_stars | 12641 |
| stars_in_period | 506 |
| author | phuryn |

## 标签

- Tier 2（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

值得看的是结构，不是技术栈。仓库实测有 9 个插件、68 个 `SKILL.md`、42 个 command，且 `python validate_plugins.py` 全部通过、0 warnings；这说明它是一个维护过的提示词/工作流包，而不是零散 prompt 集。（来源：validate_plugins.py report；CLAUDE.md Project Overview）

## 核心能力

- command 编排多个 skill（来源：数据不足）
- 意图先行的交付审计（来源：数据不足）
- 轻量 manifest 与 frontmatter 校验（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，它不是 LangChain/AutoGen 这种 agent runtime；它更像“可安装的 PM 工作流提示词市场”。 1. 对比 Anthropic `security-guidance` plugin：`security-audit-static.md` 自称方法改编自 Anthropic 官方 `claude-plugins-official` 的 Apache-2.0 `security-guidance` 插件。取舍：如果只要安全审计提示词，用原安全插件更窄；如果要“文档意图 -> 安全/性能 -> 测试覆盖 -> shipping packet”，选 `pm-ai-shipping`。（来源：pm-ai-shipping/commands/security-audit-static.md；pm-ai-shipping/commands/ship-check.md） 2. 对比 Claude Code/Cowork 自建 slash commands：自建命令适合公司内部流程；pm-skills 的优势是现成 42 个 workflow、68 个 skill 和 validator。取舍：需要私有流程、专有术语、内部系统路径时自建；需要快速把 PM 工作流塞进 agent 时用 pm-skills。（来源：CLAUDE.md Key Design Rules；validate_plugins.py report） 3. 对比 Gemini CLI/OpenCode/Cursor/Kiro 的 skills-only 拷贝做法：README 明确这些工具主要复制 `skills/*/SKILL.md`，commands 是 Claude-specific。取舍：跨工具可移植时只拿 skill；需要 `/discover`、`/write-prd`、`/ship-check` 这种链式命令体验时优先 Claude/Cowork。（来源：README Other AI assistants；README Codex CLI）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

可复用范式落库:[[concepts/phuryn-pm-skills-agent-skill]]、[[concepts/slash-command-workflow]]。另见 [[content/phuryn-pm-skills]]、[[claims/phuryn-pm-skills-main-claim]]。
