---
content: "pbakaus-impeccable"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "impeccable — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "pbakaus/impeccable：GitHub 描述为“The design language that makes your AI harness better at design”。"
  what_it_does: "The design language that makes your AI harness better at design."
  metadata:
    language: "JavaScript"
    total_stars: "35947"
    stars_in_period: "3586"
    author: "pbakaus"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "人话：值得看，不是因为它有神秘模型能力，而是因为它把“设计品味”拆成了可执行流程：先读 PRODUCT.md/DESIGN.md，再按 `/impeccable audit|critique|polish|live` 等命令走固定检查和改造步骤，还能用 CLI 扫出一些常见 AI UI 痕迹。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md；来源：cli/engine/cli/main.mjs） 术语：这是 prompt/tooling 层的 agent 工作流产品，核心资产是 markdown 指令、provider transformer、Node CLI detector 和 live-mode 辅助脚本，不是运行时 SDK。"
  core_capabilities:
    - "单 skill 多子命令路由"
    - "provider transformer"
    - "规则 registry + skill rule markers"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：直接同类不多。它更像“Anthropic frontend-design skill + 本地 detector + 多 harness 打包器 + live design workflow”的组合。 1. Anthropic `frontend-design` skill：README 和 NOTICE 明确说 Impeccable started from/builds on Anthropic original。选 Impeccable：需要 23 个命令、detector、跨 provider 安装、live mode。选原始 frontend-design：只想要较轻的 Claude 设计指导，不想引入 npm CLI 和多目录构建。原始 skill 的当前能力本次未重新抓取，除 Impeccable README/NOTICE 中提到的继承关系外不做额外断言。（来源：README Why Impeccable；来源：NOTICE.md Anthropic frontend-design Skill） 2. Google Stitch DESIGN.md：`reference/document.md` 明确要求生成符合 Google Stitch DESIGN.md format 的 `DESIGN.md`，前置 YAML token schema，正文固定 Overview/Colors/Typography/Elevation/Components/Do's and Don'ts。选 Stitch/DESIGN.md：需要跨工具可读的静态设计 token/spec。选 Impeccable：需要 agent 在 spec 之上执行 audit、critique、polish、live 等流程。Stitch 是设计文档格式，不是此仓库这种 harness skill pack。（来源：skill/reference/document.md） 3. 通用工程检查组合：Stylelint/ESLint/axe/Lighthouse 适合标准 CSS/JS/a11y/perf 质量门禁；Impeccable 适合捕捉它自己定义的 AI UI tells，例如 `side-tab`、`gradient-text`、`cream-palette`、`icon-tile-stack`、`hero-eyebrow-chip`。选通用工具：需要标准化、社区成熟、CI 容易解释的规则。选 Impeccable：需要把设计审美和 AI 生成痕迹纳入 agent 工作流。该对比中的通用工具能力是常见工程实践，不来自本 repo 的验证；Impeccable 侧规则来自 registry 已核实。（来源：cli/engine/registry/antipatterns.mjs） 术语：horizontal judgment 的关键不是“谁更强”，而是 workflow fit：静态规范、标准 lint、agent design workflow 分别解决不同层。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：一个典型流程是：先安装 skill，再让 AI harness 加载 `/impeccable`，skill 首先跑上下文脚本，然后按子命令读取对应参考，必要时调用本地 detector。 具体例子一，安装路径：`npx impeccable skills install` 进入 `cli/bin/cli.js` 的 `skills` 分支，再到 `cli/bin/commands/skills.mjs`。安装逻辑会找项目里已有 provider 目录，或者从全局 `~/.claude`、`~/.codex` 等推断；找不到时默认写 `.claude` 和 `.agents`。它从 `https://impeccable.style/api/download/bundle/universal` 下载 bundle，再把每个 provider 的 compiled skill copy 到对应 `skills/` 目录。（来源：README Installation；来源：cli/bin/cli.js；来源：cli/bin/commands/skills.mjs resolveInstallTargets/downloadAndExtractBundle/copyProviderSkills） 具体例子二，agent 执行 `/impeccable audit checkout`：`skill/SKILL.src.md` 要求先运行 `node {{scripts_path}}/context.mjs`；如果有子命令，就必须读 `reference/audit.md`；还必须读 brand/product register。`reference/audit.md` 把 audit 定义成 5 维检查：Accessibility、Performance、Theming、Responsive Design、Anti-Patterns，总分 20 分，并要求 P0-P3 分级。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md Diagnostic Scan） 具体例子三，detector 的真实输出：本次在 checkout 中运行 `node cli/bin/cli.js detect --json tests/fixtures/antipatterns/typography-should-flag.html`，返回 4 个 findings：`overused-font` line 10 snippet `font-family: 'Inter`，`overused-font` line 7 snippet `Google Fonts: Inter`，`single-font` line 7 snippet `only font used is inter`，`flat-type-hierarchy` line 14 snippet `Sizes: 13px, 14px, 15px, 16px, 18px (ratio 1.4:1)`。CLI 对有 findings 的扫描按设计返回非零退出码。（来源：cli/engine/cli/main.mjs formatFindings/detectCli；来源：tests/fixtures/antipatterns/typography-should-flag.html；来源：本次本地运行输出） 术语：static HTML analysis 是解析 HTML/CSS 后做规则检查；regex fallback 是对 CSS/JSX/TSX 等源码文本做模式匹配；provider-gated rule 是默认不报，只有加 `--gpt` 或 `--gemini` 才启用的规则。"
  essential_design_difference: "人话：最有复用价值的不是某条设计建议，而是把“agent 做设计”拆成可路由的命令、可编译的 provider 产物、可运行的 deterministic scan、以及可恢复的 live session。 术语：这些是 agent-native design tooling patterns。 - 单 skill 多子命令路由；用一个 `SKILL.src.md` 承载入口、setup、routing rules，再把具体动作放到 `reference/<command>.md`；命令列表由 `command-metadata.json` 维护。；如果每个动作需要完全不同权限、模型或生命周期，单入口会变得拥挤。；能让用户记住 `/impeccable` 一个入口，同时保留 `audit/polish/live` 等细分语义。（来源：skill/SKILL.src.md Commands；来源：skill/scripts/command-metadata.json） - provider transformer；保留一个 canonical skill source，构建时按 provider 写不同目录、frontmatter、placeholder 和 subagent 格式。；如果只支持一个 harness，直接维护该 harness 的原生目录更简单。；解决多 AI coding tool 的格式漂移问题，避免手工同步 `.claude/.cursor/.agents/.gemini`。（来源：scripts/lib/transformers/providers.js；来源：scripts/lib/transformers/factory.js） - 规则 registry + skill rule markers；detector registry 用 `id/category/name/description/skillGuideline` 定义规则；skill 文本里有 `<!-- rule:... -->` 标记，把教学条款和机器扫描条款连起来。；如果规则无法确定性检测，只保留为 LLM critique checklist 更诚实。；把“AI UI 味道”从主观评价变成可回归测试的部分信号。（来源：cli/engine/registry/antipatterns.mjs；来源：skill/SKILL.src.md rule markers） - live session journal；live mode 用 `live-status.mjs`、`live-resume.mjs`、`live-complete.mjs` 和 `.impeccable/live/sessions/` 处理中断恢复。；如果只是一次性代码生成，不需要引入 SSE、poll 和 journal。；浏览器内选元素、生成变体、accept/discard 是长事务；没有恢复协议很容易丢状态。（来源：skill/reference/live.md Recovery commands）"
  practitioner_meaning: "人话：建议 clone-and-run，而不是只 read README。原因是 README 的数字和文件结构有明显漂移，真正可复用的东西在 `skill/SKILL.src.md`、`skill/reference/*.md`、`cli/engine/registry/antipatterns.mjs`、`scripts/lib/transformers/*` 和 live scripts 里。对 AI 应用工程师，最值得抽取的是“把设计规范变成 agent 命令 + deterministic detector + provider build”的模式。（来源：README；来源：skill/SKILL.src.md；来源：cli/engine/registry/antipatterns.mjs；来源：scripts/lib/transformers/factory.js） 术语：成熟度给 3，不是因为没有测试，而是因为项目强依赖快速变化的 harness 生态，且文档 count/link 已有 stale signals。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Impeccable 是一个面向 AI 编程工具的前端设计技能包：把“怎么做得不像 AI 生成的 UI”写成一个可安装 skill、23 个子命令、跨工具构建产物和一个本地 anti-pattern detector。"
    body_md: "人话：它不是组件库，也不是生成 UI 的模型，而是一套给 Claude Code、Cursor、Codex、Gemini 等 AI coding harness 读的设计工作规程，外加一个 `impeccable detect` 命令行扫描器。（来源：README Why Impeccable；来源：skill/SKILL.src.md Setup；来源：package.json bin）\n\n术语：这里的 skill 指 AI harness 可加载的指令包；detector 指无需 LLM 的静态/浏览器规则扫描器；harness 指 Claude Code、Cursor、Codex CLI 这类承载 AI coding agent 的工具。"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看，不是因为它有神秘模型能力，而是因为它把“设计品味”拆成了可执行流程：先读 PRODUCT.md/DESIGN.md，再按 `/impeccable audit|critique|polish|live` 等命令走固定检查和改造步骤，还能用 CLI 扫出一些常见 AI UI 痕迹。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md；来源：cli/engine/cli/main.mjs）\n\n术语：这是 prompt/tooling 层的 agent 工作流产品，核心资产是 markdown 指令、provider transformer、Node CLI detector 和 live-mode 辅助脚本，不是运行时 SDK。"
    bullets:
      - "已核实有一个 canonical 源 skill：`skill/SKILL.src.md`；构建脚本注释说明 v3.0 后仓库持有 exactly one user-invocable skill。（来源：scripts/lib/utils.js readSourceFiles）"
      - "已核实 23 个子命令来自 `skill/scripts/command-metadata.json`，包括 `craft/init/document/extract/live/adapt/animate/audit/bolder/clarify/colorize/critique/delight/distill/harden/onboard/layout/optimize/overdrive/polish/quieter/shape/typeset`。（来源：skill/scripts/command-metadata.json）"
      - "已核实 detector registry 当前导出 41 条规则，其中 26 条 `slop`、15 条 `quality`，4 条由 `--gpt` 或 `--gemini` 显式开启；这与 README 中的旧数字存在差异。（来源：cli/engine/registry/antipatterns.mjs）"
      - "已核实安装面不是单一 Claude 插件：provider 配置覆盖 `.cursor`、`.claude`、`.gemini`、`.codex`、`.agents`、`.github`、`.kiro`、`.opencode`、`.pi`、`.qoder`、`.trae-cn`、`.trae`、`.rovodev`。（来源：scripts/lib/transformers/providers.js）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：README 的大方向可信，但数字需要看源码校正。当前源码比 README 文案更新：命令数 23 能核实；规则数 README/README.npm/registry 三处不一致，应以 registry 和构建脚本的 source of truth 为准。（来源：README；来源：README.npm.md；来源：scripts/build.js generateCounts；来源：cli/engine/registry/antipatterns.mjs）\n\n术语：把 README 当 marketing/documentation claim，把 `package.json`、registry、transformer、测试和脚本当 implementation evidence。"
    items:
      - claim: "“1 skill, 23 commands”"
        plain_english: "项目现在把多个设计动作收敛到一个 `/impeccable` skill，下挂 23 个子命令。"
        source: "README opening；skill/SKILL.src.md Commands；skill/scripts/command-metadata.json"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`command-metadata.json` 实际有 23 个 key；`SKILL.src.md` 命令表也列出 23 个 `/impeccable` 子命令。"
        does_not_support: "不证明每个命令都有等量实现深度；部分命令主要是 markdown 工作流参考。"
        threat: "README 和插件版本号更新节奏可能不同，但命令 metadata 是当前构建输入。"
      - claim: "README 自称有 “7 domain reference files”"
        plain_english: "README 表格仍列 `typography.md`、`color-and-contrast.md`、`spatial-design.md`、`motion-design.md`、`responsive-design.md`、`ux-writing.md` 等旧链接。"
        source: "README What's Included；skill/reference tree；skill/reference/typeset.md；skill/reference/colorize.md；skill/reference/adapt.md；skill/reference/clarify.md"
        attribution: "自称"
        evidence_strength: "low"
        supports: "README/NOTICE 文字保留了 7 个 domain reference 的说法。"
        does_not_support: "当前 `skill/reference/` 没有 README 链接的 `typography.md`、`color-and-contrast.md` 等文件；tree 中是 27 个 reference 文件，且若干文件写明旧内容已 inline 到命令参考里。"
        threat: "文档链接过期会误导读者按旧文件结构寻找资料。"
      - claim: "detector 可无需 LLM 扫描文件、目录和 URL"
        plain_english: "`impeccable detect` 是本地 CLI：HTML 走 static HTML/CSS analysis，非 HTML 走 regex，URL 走 Puppeteer 渲染路径。"
        source: "cli/bin/cli.js；cli/engine/cli/main.mjs printUsage/detectCli；package.json optionalDependencies"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "CLI help 明确列 `impeccable detect src/`、`index.html`、`https://example.com`、`--json`；`detectCli` 对 URL 调 `detectUrl`，目录遍历时 HTML 调 `detectHtml`，其他文件调 `detectText`。"
        does_not_support: "URL 扫描依赖 optional `puppeteer`；未证明所有项目框架都能高准确率扫描。"
        threat: "README.npm 仍说 `--fast` 是 regex-only，但 `cli/engine/cli/main.mjs` 写明 `--fast` deprecated and ignored。"
      - claim: "当前 registry 有 41 条 detection rules"
        plain_english: "源码里实际规则数不是 README 的 24/27，而是 registry 导出的 41 个 rule id。"
        source: "cli/engine/registry/antipatterns.mjs；scripts/build.js generateCounts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "本次从 registry 导入统计：41 条；分类为 `slop: 26`、`quality: 15`；gated ids 为 `gpt-thin-border-wide-shadow`、`repeating-stripes-gradient`、`theater-slop-phrase`、`image-hover-transform`。"
        does_not_support: "不证明 41 条都同等成熟；部分规则是 advisory 或 provider-gated。"
        threat: "用户按 README 的 24/27 预期覆盖面会低估或误解当前规则集。"
      - claim: "跨 provider 构建不是简单复制同一份 skill"
        plain_english: "构建系统按 provider 编译 frontmatter、placeholder、provider tag 和 subagent 格式。"
        source: "scripts/lib/transformers/providers.js；scripts/lib/transformers/factory.js；scripts/build.js"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`PROVIDERS` 针对 Claude Code、Cursor、Gemini、Codex、Agents、GitHub、Kiro、OpenCode、Pi、Qoder、Trae、Rovo Dev 配不同 `configDir` 和 frontmatter；factory 会替换 `{{scripts_path}}` 并复制 reference/scripts。"
        does_not_support: "不证明每个外部 harness 的线上版本都已兼容；`HARNESSES.md` 对 Trae 写了 TBD。"
        threat: "外部 harness 技能规范变化会影响安装产物。"
      - claim: "live mode 是浏览器内视觉变体流程"
        plain_english: "`/impeccable live` 会启动 helper、注入页面、poll 事件，并在 `generate` 时用 `live-wrap.mjs` 或 `live-insert.mjs` 包装/插入元素，生成多个可热替换变体。"
        source: "skill/reference/live.md Start/Poll loop/Handle generate；skill/scripts/live.mjs；skill/scripts/live-wrap.mjs；skill/scripts/live-insert.mjs"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "文档给出真实命令：`node {{scripts_path}}/live.mjs`、`node {{scripts_path}}/live-poll.mjs`、`node {{scripts_path}}/live-wrap.mjs --id EVENT_ID --count EVENT_COUNT ...`；`.impeccable/live/config.json` 当前配置 `site/layouts/Base.astro` 和 `insertBefore: </body>`。"
        does_not_support: "未在本次实际启动 dev server 或完整 live session。"
        threat: "流程复杂，依赖 dev server/HMR/browser mutation，失败面比纯 markdown skill 大。"
  how_it_works:
    summary: ""
    body_md: "人话：一个典型流程是：先安装 skill，再让 AI harness 加载 `/impeccable`，skill 首先跑上下文脚本，然后按子命令读取对应参考，必要时调用本地 detector。\n\n具体例子一，安装路径：`npx impeccable skills install` 进入 `cli/bin/cli.js` 的 `skills` 分支，再到 `cli/bin/commands/skills.mjs`。安装逻辑会找项目里已有 provider 目录，或者从全局 `~/.claude`、`~/.codex` 等推断；找不到时默认写 `.claude` 和 `.agents`。它从 `https://impeccable.style/api/download/bundle/universal` 下载 bundle，再把每个 provider 的 compiled skill copy 到对应 `skills/` 目录。（来源：README Installation；来源：cli/bin/cli.js；来源：cli/bin/commands/skills.mjs resolveInstallTargets/downloadAndExtractBundle/copyProviderSkills）\n\n具体例子二，agent 执行 `/impeccable audit checkout`：`skill/SKILL.src.md` 要求先运行 `node {{scripts_path}}/context.mjs`；如果有子命令，就必须读 `reference/audit.md`；还必须读 brand/product register。`reference/audit.md` 把 audit 定义成 5 维检查：Accessibility、Performance、Theming、Responsive Design、Anti-Patterns，总分 20 分，并要求 P0-P3 分级。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md Diagnostic Scan）\n\n具体例子三，detector 的真实输出：本次在 checkout 中运行 `node cli/bin/cli.js detect --json tests/fixtures/antipatterns/typography-should-flag.html`，返回 4 个 findings：`overused-font` line 10 snippet `font-family: 'Inter`，`overused-font` line 7 snippet `Google Fonts: Inter`，`single-font` line 7 snippet `only font used is inter`，`flat-type-hierarchy` line 14 snippet `Sizes: 13px, 14px, 15px, 16px, 18px (ratio 1.4:1)`。CLI 对有 findings 的扫描按设计返回非零退出码。（来源：cli/engine/cli/main.mjs formatFindings/detectCli；来源：tests/fixtures/antipatterns/typography-should-flag.html；来源：本次本地运行输出）\n\n术语：static HTML analysis 是解析 HTML/CSS 后做规则检查；regex fallback 是对 CSS/JSX/TSX 等源码文本做模式匹配；provider-gated rule 是默认不报，只有加 `--gpt` 或 `--gemini` 才启用的规则。"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最有复用价值的不是某条设计建议，而是把“agent 做设计”拆成可路由的命令、可编译的 provider 产物、可运行的 deterministic scan、以及可恢复的 live session。\n\n术语：这些是 agent-native design tooling patterns。"
    items:
      - name: "单 skill 多子命令路由"
        copy: "用一个 `SKILL.src.md` 承载入口、setup、routing rules，再把具体动作放到 `reference/<command>.md`；命令列表由 `command-metadata.json` 维护。"
        skip: "如果每个动作需要完全不同权限、模型或生命周期，单入口会变得拥挤。"
        why_it_matters: "能让用户记住 `/impeccable` 一个入口，同时保留 `audit/polish/live` 等细分语义。（来源：skill/SKILL.src.md Commands；来源：skill/scripts/command-metadata.json）"
      - name: "provider transformer"
        copy: "保留一个 canonical skill source，构建时按 provider 写不同目录、frontmatter、placeholder 和 subagent 格式。"
        skip: "如果只支持一个 harness，直接维护该 harness 的原生目录更简单。"
        why_it_matters: "解决多 AI coding tool 的格式漂移问题，避免手工同步 `.claude/.cursor/.agents/.gemini`。（来源：scripts/lib/transformers/providers.js；来源：scripts/lib/transformers/factory.js）"
      - name: "规则 registry + skill rule markers"
        copy: "detector registry 用 `id/category/name/description/skillGuideline` 定义规则；skill 文本里有 `<!-- rule:... -->` 标记，把教学条款和机器扫描条款连起来。"
        skip: "如果规则无法确定性检测，只保留为 LLM critique checklist 更诚实。"
        why_it_matters: "把“AI UI 味道”从主观评价变成可回归测试的部分信号。（来源：cli/engine/registry/antipatterns.mjs；来源：skill/SKILL.src.md rule markers）"
      - name: "live session journal"
        copy: "live mode 用 `live-status.mjs`、`live-resume.mjs`、`live-complete.mjs` 和 `.impeccable/live/sessions/` 处理中断恢复。"
        skip: "如果只是一次性代码生成，不需要引入 SSE、poll 和 journal。"
        why_it_matters: "浏览器内选元素、生成变体、accept/discard 是长事务；没有恢复协议很容易丢状态。（来源：skill/reference/live.md Recovery commands）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：最大风险不是代码跑不起来，而是外部 harness 和远程分发面变化。它把价值放在 Claude/Cursor/Codex/Gemini 等工具会按预期读取 skill 目录、frontmatter 和 nested agents 上。\n\n术语：这是 platform-coupled tooling。"
    items:
      - dependency: "Node.js >=24"
        what_if_change: "用户环境低于 Node 24 时 CLI 不满足 `engines` 要求。"
        exposure: "medium"
        mitigation_or_unknown: "本次环境 Node `v24.13.1` 可运行 `node cli/bin/cli.js --version` 输出 `2.3.2`；低版本兼容未说明。"
        source: "package.json engines；本次本地运行"
      - dependency: "impeccable.style bundle/version API"
        what_if_change: "`skills install/update/check` 下载或查询失败，复制安装路径受影响。"
        exposure: "high"
        mitigation_or_unknown: "源码支持 submodule/link：`npx impeccable skills link --source=.impeccable --providers=claude,cursor`；但远程 bundle 本次未下载核对。"
        source: "cli/bin/commands/skills.mjs API_BASE/downloadAndExtractBundle；README Installation Option 2"
      - dependency: "AI harness skill directory/spec"
        what_if_change: "Claude/Cursor/Codex/Gemini 等改变 skill frontmatter、目录或 agent discovery，生成产物可能失效。"
        exposure: "high"
        mitigation_or_unknown: "`HARNESSES.md` 记录了各 harness 字段和目录；Trae 文档项写 `TBD`，说明部分平台证据不完整。"
        source: "HARNESSES.md Frontmatter Support/Skill Directory Structure；scripts/lib/transformers/providers.js"
      - dependency: "Puppeteer optional dependency"
        what_if_change: "扫描 URL 时需要浏览器渲染路径，缺少 Puppeteer 会限制 URL scan。"
        exposure: "medium"
        mitigation_or_unknown: "本地文件/目录仍可走 static/regex；URL scan 依赖 optional `puppeteer`。"
        source: "package.json optionalDependencies；cli/engine/cli/main.mjs Detection modes"
      - dependency: "README/docs 与源码同步"
        what_if_change: "用户按 README 中 7 reference links、24/27 detection counts 或 `--fast` 语义操作，会遇到过期信息。"
        exposure: "medium"
        mitigation_or_unknown: "构建脚本有 `generateCounts` 校验部分 stale counts，但 README 当前仍和 registry/tree 不一致。"
        source: "README What's Included/CLI；README.npm.md；scripts/build.js generateCounts；skill/reference tree"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：仓库本身信息足够判断“值得读 docs/clone-and-run”，但还不能证明线上分发、所有 harness 兼容和 detector 准确率。\n\n术语：这些是 evidence gaps，不应补成事实。"
    items:
      - "远程 `https://impeccable.style/api/download/bundle/universal` 的当前 ZIP 内容，本次未下载比对 repo commit。"
      - "README 提到的 case studies 和网站下载包，本次未打开网站验证。"
      - "各外部 harness 当前版本是否完全接受 repo 生成的 frontmatter/agent 格式，未逐一实机验证。"
      - "detector 的 precision/recall、误报率、真实项目 benchmark，README/docs/tree 未给出可引用数字；只看到 `bench:detector` 脚本入口。"
      - "GitHub issues/release 活跃度，本次没有用 GitHub API 重新确认；仅基于 cloned tree 和本地文件写作。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 5
      成熟度: 3
    body_md: "人话：建议 clone-and-run，而不是只 read README。原因是 README 的数字和文件结构有明显漂移，真正可复用的东西在 `skill/SKILL.src.md`、`skill/reference/*.md`、`cli/engine/registry/antipatterns.mjs`、`scripts/lib/transformers/*` 和 live scripts 里。对 AI 应用工程师，最值得抽取的是“把设计规范变成 agent 命令 + deterministic detector + provider build”的模式。（来源：README；来源：skill/SKILL.src.md；来源：cli/engine/registry/antipatterns.mjs；来源：scripts/lib/transformers/factory.js）\n\n术语：成熟度给 3，不是因为没有测试，而是因为项目强依赖快速变化的 harness 生态，且文档 count/link 已有 stale signals。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\pbakaus-impeccable\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\pbakaus-impeccable\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\pbakaus-impeccable\\codex-last-message.json"
  invoked_at: "2026-06-08T14:46:40.202Z"
  completed_at: "2026-06-08T14:51:26.501Z"
  repo: "pbakaus/impeccable"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "The design language that makes your AI harness better at design."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“1 skill, 23 commands”"
    - "README 自称有 “7 domain reference files”"
    - "detector 可无需 LLM 扫描文件、目录和 URL"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "package.json engines；本次本地运行"
    - "cli/bin/commands/skills.mjs API_BASE/downloadAndExtractBundle；README Installation Option 2"
    - "HARNESSES.md Frontmatter Support/Skill Directory Structure；scripts/lib/transformers/providers.js"
    - "package.json optionalDependencies；cli/engine/cli/main.mjs Detection modes"
    - "README What's Included/CLI；README.npm.md；scripts/build.js generateCounts；skill/reference tree"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 5
  maturity: 3
  main_risk: "人话：建议 clone-and-run，而不是只 read README。原因是 README 的数字和文件结构有明显漂移，真正可复用的东西在 `skill/SKILL.src.md`、`skill/reference/*.md`、`cli/engine/registry/antipatterns.mjs`、`scripts/lib/transformers/*` 和 live scripts 里。对 AI 应用工程师，最值得抽取的是“把设计规范变成 agent 命令 + deterministic detector + provider build”的模式。（来源：README；来源：skill/SKILL.src.md；来源：cli/engine/registry/antipatterns.mjs；来源：scripts/lib/transformers/factory.js） 术语：成熟度给 3，不是因为没有测试，而是因为项目强依赖快速变化的 harness 生态，且文档 count/link 已有 stale signals。"
next_actions:
  - "clone-and-run"
unknowns:
  - "远程 `https://impeccable.style/api/download/bundle/universal` 的当前 ZIP 内容，本次未下载比对 repo commit。"
  - "README 提到的 case studies 和网站下载包，本次未打开网站验证。"
  - "各外部 harness 当前版本是否完全接受 repo 生成的 frontmatter/agent 格式，未逐一实机验证。"
  - "detector 的 precision/recall、误报率、真实项目 benchmark，README/docs/tree 未给出可引用数字；只看到 `bench:detector` 脚本入口。"
  - "GitHub issues/release 活跃度，本次没有用 GitHub API 重新确认；仅基于 cloned tree 和本地文件写作。"
builder_reuse:
  pattern: "单 skill 多子命令路由"
  copy: "用一个 `SKILL.src.md` 承载入口、setup、routing rules，再把具体动作放到 `reference/<command>.md`；命令列表由 `command-metadata.json` 维护。"
  skip: "如果每个动作需要完全不同权限、模型或生命周期，单入口会变得拥挤。"
  why_it_matters: "能让用户记住 `/impeccable` 一个入口，同时保留 `audit/polish/live` 等细分语义。（来源：skill/SKILL.src.md Commands；来源：skill/scripts/command-metadata.json）"
dependency_platform_risk:
  dependency: "Node.js >=24"
  what_if_change: "用户环境低于 Node 24 时 CLI 不满足 `engines` 要求。"
  exposure: "medium"
  mitigation_or_unknown: "本次环境 Node `v24.13.1` 可运行 `node cli/bin/cli.js --version` 输出 `2.3.2`；低版本兼容未说明。"
claim_ledger:
  - claim: "“1 skill, 23 commands”"
    plain_english: "项目现在把多个设计动作收敛到一个 `/impeccable` skill，下挂 23 个子命令。"
    source: "README opening；skill/SKILL.src.md Commands；skill/scripts/command-metadata.json"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`command-metadata.json` 实际有 23 个 key；`SKILL.src.md` 命令表也列出 23 个 `/impeccable` 子命令。"
    does_not_support: "不证明每个命令都有等量实现深度；部分命令主要是 markdown 工作流参考。"
    threat: "README 和插件版本号更新节奏可能不同，但命令 metadata 是当前构建输入。"
  - claim: "README 自称有 “7 domain reference files”"
    plain_english: "README 表格仍列 `typography.md`、`color-and-contrast.md`、`spatial-design.md`、`motion-design.md`、`responsive-design.md`、`ux-writing.md` 等旧链接。"
    source: "README What's Included；skill/reference tree；skill/reference/typeset.md；skill/reference/colorize.md；skill/reference/adapt.md；skill/reference/clarify.md"
    attribution: "自称"
    evidence_strength: "low"
    supports: "README/NOTICE 文字保留了 7 个 domain reference 的说法。"
    does_not_support: "当前 `skill/reference/` 没有 README 链接的 `typography.md`、`color-and-contrast.md` 等文件；tree 中是 27 个 reference 文件，且若干文件写明旧内容已 inline 到命令参考里。"
    threat: "文档链接过期会误导读者按旧文件结构寻找资料。"
  - claim: "detector 可无需 LLM 扫描文件、目录和 URL"
    plain_english: "`impeccable detect` 是本地 CLI：HTML 走 static HTML/CSS analysis，非 HTML 走 regex，URL 走 Puppeteer 渲染路径。"
    source: "cli/bin/cli.js；cli/engine/cli/main.mjs printUsage/detectCli；package.json optionalDependencies"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "CLI help 明确列 `impeccable detect src/`、`index.html`、`https://example.com`、`--json`；`detectCli` 对 URL 调 `detectUrl`，目录遍历时 HTML 调 `detectHtml`，其他文件调 `detectText`。"
    does_not_support: "URL 扫描依赖 optional `puppeteer`；未证明所有项目框架都能高准确率扫描。"
    threat: "README.npm 仍说 `--fast` 是 regex-only，但 `cli/engine/cli/main.mjs` 写明 `--fast` deprecated and ignored。"
  - claim: "当前 registry 有 41 条 detection rules"
    plain_english: "源码里实际规则数不是 README 的 24/27，而是 registry 导出的 41 个 rule id。"
    source: "cli/engine/registry/antipatterns.mjs；scripts/build.js generateCounts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "本次从 registry 导入统计：41 条；分类为 `slop: 26`、`quality: 15`；gated ids 为 `gpt-thin-border-wide-shadow`、`repeating-stripes-gradient`、`theater-slop-phrase`、`image-hover-transform`。"
    does_not_support: "不证明 41 条都同等成熟；部分规则是 advisory 或 provider-gated。"
    threat: "用户按 README 的 24/27 预期覆盖面会低估或误解当前规则集。"
  - claim: "跨 provider 构建不是简单复制同一份 skill"
    plain_english: "构建系统按 provider 编译 frontmatter、placeholder、provider tag 和 subagent 格式。"
    source: "scripts/lib/transformers/providers.js；scripts/lib/transformers/factory.js；scripts/build.js"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`PROVIDERS` 针对 Claude Code、Cursor、Gemini、Codex、Agents、GitHub、Kiro、OpenCode、Pi、Qoder、Trae、Rovo Dev 配不同 `configDir` 和 frontmatter；factory 会替换 `{{scripts_path}}` 并复制 reference/scripts。"
    does_not_support: "不证明每个外部 harness 的线上版本都已兼容；`HARNESSES.md` 对 Trae 写了 TBD。"
    threat: "外部 harness 技能规范变化会影响安装产物。"
  - claim: "live mode 是浏览器内视觉变体流程"
    plain_english: "`/impeccable live` 会启动 helper、注入页面、poll 事件，并在 `generate` 时用 `live-wrap.mjs` 或 `live-insert.mjs` 包装/插入元素，生成多个可热替换变体。"
    source: "skill/reference/live.md Start/Poll loop/Handle generate；skill/scripts/live.mjs；skill/scripts/live-wrap.mjs；skill/scripts/live-insert.mjs"
    attribution: "已核实"
    evidence_strength: "medium"
    supports: "文档给出真实命令：`node {{scripts_path}}/live.mjs`、`node {{scripts_path}}/live-poll.mjs`、`node {{scripts_path}}/live-wrap.mjs --id EVENT_ID --count EVENT_COUNT ...`；`.impeccable/live/config.json` 当前配置 `site/layouts/Base.astro` 和 `insertBefore: </body>`。"
    does_not_support: "未在本次实际启动 dev server 或完整 live session。"
    threat: "流程复杂，依赖 dev server/HMR/browser mutation，失败面比纯 markdown skill 大。"
artifact_audit:
  official_repo: "https://github.com/pbakaus/impeccable"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

pbakaus/impeccable：GitHub 描述为“The design language that makes your AI harness better at design”。

（来源：README/artifactAudit）

## 干什么

The design language that makes your AI harness better at design.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | JavaScript |
| total_stars | 35947 |
| stars_in_period | 3586 |
| author | pbakaus |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

人话：值得看，不是因为它有神秘模型能力，而是因为它把“设计品味”拆成了可执行流程：先读 PRODUCT.md/DESIGN.md，再按 `/impeccable audit|critique|polish|live` 等命令走固定检查和改造步骤，还能用 CLI 扫出一些常见 AI UI 痕迹。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md；来源：cli/engine/cli/main.mjs） 术语：这是 prompt/tooling 层的 agent 工作流产品，核心资产是 markdown 指令、provider transformer、Node CLI detector 和 live-mode 辅助脚本，不是运行时 SDK。

## 核心能力

- 单 skill 多子命令路由（来源：数据不足）
- provider transformer（来源：数据不足）
- 规则 registry + skill rule markers（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：直接同类不多。它更像“Anthropic frontend-design skill + 本地 detector + 多 harness 打包器 + live design workflow”的组合。 1. Anthropic `frontend-design` skill：README 和 NOTICE 明确说 Impeccable started from/builds on Anthropic original。选 Impeccable：需要 23 个命令、detector、跨 provider 安装、live mode。选原始 frontend-design：只想要较轻的 Claude 设计指导，不想引入 npm CLI 和多目录构建。原始 skill 的当前能力本次未重新抓取，除 Impeccable README/NOTICE 中提到的继承关系外不做额外断言。（来源：README Why Impeccable；来源：NOTICE.md Anthropic frontend-design Skill） 2. Google Stitch DESIGN.md：`reference/document.md` 明确要求生成符合 Google Stitch DESIGN.md format 的 `DESIGN.md`，前置 YAML token schema，正文固定 Overview/Colors/Typography/Elevation/Components/Do's and Don'ts。选 Stitch/DESIGN.md：需要跨工具可读的静态设计 token/spec。选 Impeccable：需要 agent 在 spec 之上执行 audit、critique、polish、live 等流程。Stitch 是设计文档格式，不是此仓库这种 harness skill pack。（来源：skill/reference/document.md） 3. 通用工程检查组合：Stylelint/ESLint/axe/Lighthouse 适合标准 CSS/JS/a11y/perf 质量门禁；Impeccable 适合捕捉它自己定义的 AI UI tells，例如 `side-tab`、`gradient-text`、`cream-palette`、`icon-tile-stack`、`hero-eyebrow-chip`。选通用工具：需要标准化、社区成熟、CI 容易解释的规则。选 Impeccable：需要把设计审美和 AI 生成痕迹纳入 agent 工作流。该对比中的通用工具能力是常见工程实践，不来自本 repo 的验证；Impeccable 侧规则来自 registry 已核实。（来源：cli/engine/registry/antipatterns.mjs） 术语：horizontal judgment 的关键不是“谁更强”，而是 workflow fit：静态规范、标准 lint、agent design workflow 分别解决不同层。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：一个典型流程是：先安装 skill，再让 AI harness 加载 `/impeccable`，skill 首先跑上下文脚本，然后按子命令读取对应参考，必要时调用本地 detector。 具体例子一，安装路径：`npx impeccable skills install` 进入 `cli/bin/cli.js` 的 `skills` 分支，再到 `cli/bin/commands/skills.mjs`。安装逻辑会找项目里已有 provider 目录，或者从全局 `~/.claude`、`~/.codex` 等推断；找不到时默认写 `.claude` 和 `.agents`。它从 `https://impeccable.style/api/download/bundle/universal` 下载 bundle，再把每个 provider 的 compiled skill copy 到对应 `skills/` 目录。（来源：README Installation；来源：cli/bin/cli.js；来源：cli/bin/commands/skills.mjs resolveInstallTargets/downloadAndExtractBundle/copyProviderSkills） 具体例子二，agent 执行 `/impeccable audit checkout`：`skill/SKILL.src.md` 要求先运行 `node {{scripts_path}}/context.mjs`；如果有子命令，就必须读 `reference/audit.md`；还必须读 brand/product register。`reference/audit.md` 把 audit 定义成 5 维检查：Accessibility、Performance、Theming、Responsive Design、Anti-Patterns，总分 20 分，并要求 P0-P3 分级。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md Diagnostic Scan） 具体例子三，detector 的真实输出：本次在 checkout 中运行 `node cli/bin/cli.js detect --json tests/fixtures/antipatterns/typography-should-flag.html`，返回 4 个 findings：`overused-font` line 10 snippet `font-family: 'Inter`，`overused-font` line 7 snippet `Google Fonts: Inter`，`single-font` line 7 snippet `only font used is inter`，`flat-type-hierarchy` line 14 snippet `Sizes: 13px, 14px, 15px, 16px, 18px (ratio 1.4:1)`。CLI 对有 findings 的扫描按设计返回非零退出码。（来源：cli/engine/cli/main.mjs formatFindings/detectCli；来源：tests/fixtures/antipatterns/typography-should-flag.html；来源：本次本地运行输出） 术语：static HTML analysis 是解析 HTML/CSS 后做规则检查；regex fallback 是对 CSS/JSX/TSX 等源码文本做模式匹配；provider-gated rule 是默认不报，只有加 `--gpt` 或 `--gemini` 才启用的规则。

## 本质不同的设计取舍

人话：最有复用价值的不是某条设计建议，而是把“agent 做设计”拆成可路由的命令、可编译的 provider 产物、可运行的 deterministic scan、以及可恢复的 live session。 术语：这些是 agent-native design tooling patterns。 - 单 skill 多子命令路由；用一个 `SKILL.src.md` 承载入口、setup、routing rules，再把具体动作放到 `reference/<command>.md`；命令列表由 `command-metadata.json` 维护。；如果每个动作需要完全不同权限、模型或生命周期，单入口会变得拥挤。；能让用户记住 `/impeccable` 一个入口，同时保留 `audit/polish/live` 等细分语义。（来源：skill/SKILL.src.md Commands；来源：skill/scripts/command-metadata.json） - provider transformer；保留一个 canonical skill source，构建时按 provider 写不同目录、frontmatter、placeholder 和 subagent 格式。；如果只支持一个 harness，直接维护该 harness 的原生目录更简单。；解决多 AI coding tool 的格式漂移问题，避免手工同步 `.claude/.cursor/.agents/.gemini`。（来源：scripts/lib/transformers/providers.js；来源：scripts/lib/transformers/factory.js） - 规则 registry + skill rule markers；detector registry 用 `id/category/name/description/skillGuideline` 定义规则；skill 文本里有 `<!-- rule:... -->` 标记，把教学条款和机器扫描条款连起来。；如果规则无法确定性检测，只保留为 LLM critique checklist 更诚实。；把“AI UI 味道”从主观评价变成可回归测试的部分信号。（来源：cli/engine/registry/antipatterns.mjs；来源：skill/SKILL.src.md rule markers） - live session journal；live mode 用 `live-status.mjs`、`live-resume.mjs`、`live-complete.mjs` 和 `.impeccable/live/sessions/` 处理中断恢复。；如果只是一次性代码生成，不需要引入 SSE、poll 和 journal。；浏览器内选元素、生成变体、accept/discard 是长事务；没有恢复协议很容易丢状态。（来源：skill/reference/live.md Recovery commands）

## 对从业者意味着什么

人话：建议 clone-and-run，而不是只 read README。原因是 README 的数字和文件结构有明显漂移，真正可复用的东西在 `skill/SKILL.src.md`、`skill/reference/*.md`、`cli/engine/registry/antipatterns.mjs`、`scripts/lib/transformers/*` 和 live scripts 里。对 AI 应用工程师，最值得抽取的是“把设计规范变成 agent 命令 + deterministic detector + provider build”的模式。（来源：README；来源：skill/SKILL.src.md；来源：cli/engine/registry/antipatterns.mjs；来源：scripts/lib/transformers/factory.js） 术语：成熟度给 3，不是因为没有测试，而是因为项目强依赖快速变化的 harness 生态，且文档 count/link 已有 stale signals。

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/pbakaus-impeccable-agent-skill-command-router]]、[[concepts/pbakaus-impeccable-deterministic-antipattern-detector]]。另见 [[content/pbakaus-impeccable]]、[[claims/pbakaus-impeccable-main-claim]]。
