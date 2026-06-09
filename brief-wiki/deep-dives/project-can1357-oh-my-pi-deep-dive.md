---
content: "can1357-oh-my-pi"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "oh-my-pi — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "can1357/oh-my-pi：GitHub 描述为“⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more”。"
  what_it_does: "⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more"
  metadata:
    language: "TypeScript"
    total_stars: "11287"
    stars_in_period: "7042"
    author: "can1357"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "它值得看，不是因为 README 写得猛，而是因为仓库里确实有完整工具层：`packages/coding-agent/src/tools/index.ts` 注册公开内置工具，`docs/tools/*.md` 给每个工具写了运行路径，Rust crate 负责搜索、shell、AST、PTY 等底层能力。对 AI 应用开发者，最有价值的是“工具表面怎么设计给模型用”，尤其是 hashline 编辑、`read` 的统一路径接口、`task` 子代理和 MCP 延迟加载。"
  core_capabilities:
    - "Hashline 内容锚编辑"
    - "统一 path 读取协议"
    - "隐藏工具加 BM25 发现"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，它更像“开源、可改造的 Claude Code/Codex CLI 替代 harness”，不是单纯代码补全工具。 - 对 OpenAI Codex CLI：Codex CLI 官方定位是本地终端 coding agent，可读写文件、运行命令，并有审批模式（来源：https://help.openai.com/en/articles/11096431；https://github.com/openai/codex）。取舍：如果团队已经押 OpenAI/Codex 生态，Codex CLI 路径更直接；如果要多 provider、MCP/skills/extensions、hashline 和 Rust native 工具体系，oh-my-pi 更可拆。 - 对 Claude Code：Claude Code 官方文档强调终端/IDE/桌面/浏览器、多表面、MCP、hooks、Agent SDK（来源：https://code.claude.com/docs/en/overview；https://code.claude.com/docs/en/hooks）。取舍：如果你要稳定商业产品和 Anthropic 官方能力，选 Claude Code；如果你要读源码、改工具层、接入非 Anthropic provider，oh-my-pi 的 MIT monorepo 更适合研究和二次开发。 - 对 Aider：Aider 官方定位是终端 AI pair programming，并强调 Git 集成和自动提交（来源：https://aider.chat/；https://aider.chat/docs/）。取舍：如果目标是轻量结对改代码，Aider 更小；如果目标是构建带 LSP、DAP、browser、MCP、子代理和扩展的 agent surface，oh-my-pi 覆盖更宽但复杂度更高。 结论：做 AI 应用的人应该把它当“工具协议和运行时设计样本”读；直接替换团队日常工具前，先 clone-and-run 验证安装、模型登录、审批策略和平台 native 包。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。 ```mermaid flowchart TD A[用户任务] --> B[omp CLI] B --> C[会话运行时] C --> D[模型路由] C --> E[工具注册表] E --> F[read 统一读取] F --> G[哈希锚快照] G --> H[edit 写入] H --> I[LSP 诊断] E --> J[task 子代理] J --> K[隔离工作区] E --> L[MCP 和扩展] E --> M[eval 和 bash] ``` 一个真实编辑例子：`read` 在 hashline 模式会给可变文件加类似 `¶a.ts#0A3B` 的头，`edit` 再消费这个头和行号。（来源：docs/tools/read.md Local text files；docs/tools/edit.md Worked examples） ```text ¶a.ts#0A3B replace 1..1: ``` 这两行的意思是：只替换 `a.ts` 当前快照的第 1 行；如果文件内容已经漂移，`packages/hashline` 会按 snapshot 校验并拒绝或恢复。（来源：packages/hashline/README.md Format；docs/tools/edit.md Limits & Caps） 更完整的 agent loop：CLI 入口 `src/cli.ts` 把非子命令默认路由到 `launch`；`main.ts` 初始化 settings、model registry、session；`createTools` 从 `BUILTIN_TOOLS` 和 MCP/custom/extension 工具生成可调用工具；工具执行结果回到会话，再由模型决定下一步。（来源：packages/coding-agent/DEVELOPMENT.md Boot Sequence；packages/coding-agent/src/tools/index.ts createTools）"
  essential_design_difference: "最值得抽走的不是 UI，而是给模型用的工具契约：少量强工具、明确输入 schema、可追溯输出、失败可恢复。 - Hashline 内容锚编辑；让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。；如果你的应用只写新文件、不修改既有代码，普通 `write` 或 AST rewrite 更简单。；它把模型的 diff 错误从“静默写坏文件”变成“锚不匹配而失败”。（来源：packages/hashline/README.md；docs/tools/edit.md） - 统一 path 读取协议；把文件、URL、SQLite、归档、内部 artifact 都压到 `read({path})`，再用 selector 做分页和范围读取。；如果你的 agent 只面向一个固定数据库，专用查询工具更清楚。；模型学一个读取接口，就能访问 `pr://`、`agent://`、`memory://`、`skill://` 等资源。（来源：docs/tools/read.md Internal URLs） - 隐藏工具加 BM25 发现；默认只暴露 essential 工具；其它工具隐藏但可检索，需要时由 `search_tool_bm25` 激活。；如果工具总数很少，直接暴露全部工具更省实现成本。；它降低模型每轮工具选择负担，同时保留大工具箱。（来源：README Whatever the task needs；packages/coding-agent/src/tools/index.ts filterInitialToolsForDiscoveryAll） - 子代理 artifact 协议；每个子任务输出 `<id>.md` 或 JSON artifact，父代理用 `agent://<id>` 读取，而不是解析长段聊天文本。；如果任务不可并行，单 agent 加 todo 足够。；它让 fan-out/fan-in 有明确边界，适合审查、调研、批量改造。（来源：docs/tools/task.md Outputs/Flow） - 扩展事件拦截；扩展用 `tool_call` 和 `tool_result` 事件包住所有工具；可注册工具、命令、快捷键和 renderer。；如果只需要静态提示词，用 skills 比 extensions 轻。；这给安全策略、团队流程、专用工具留出同一条接入路径。（来源：docs/extensions.md Runtime model；docs/hooks.md Tool events）"
  practitioner_meaning: "建议：先 clone-and-run，不建议盲目替换主力工具。原因是源码和 docs 的工程深度很高，尤其 hashline、统一 read、task 子代理、MCP 延迟工具、扩展拦截都可复用；但默认权限、provider 依赖、native 平台包和高速迭代带来实际采用风险。对 AI 应用团队，最佳动作是抽模式：把 hashline/工具发现/agent:// artifact 这些设计搬进自己的 harness。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "oh-my-pi 是一个终端里的 AI 编程代理框架，把读写文件、命令执行、LSP、DAP 调试、子代理、MCP、技能和扩展放进同一个 `omp` CLI。"
    body_md: "人话：它不是只会改文件的聊天壳，而是把“IDE 能力 + 终端工具 + 多模型路由”做成一个可运行的代理工作台。术语：这是 terminal coding agent harness，即负责把模型、工具、权限、上下文和会话串起来的运行时。（来源：README Install；packages/coding-agent/package.json bin；packages/coding-agent/DEVELOPMENT.md Boot Sequence）"
  why_worth_attention:
    summary: ""
    body_md: "它值得看，不是因为 README 写得猛，而是因为仓库里确实有完整工具层：`packages/coding-agent/src/tools/index.ts` 注册公开内置工具，`docs/tools/*.md` 给每个工具写了运行路径，Rust crate 负责搜索、shell、AST、PTY 等底层能力。对 AI 应用开发者，最有价值的是“工具表面怎么设计给模型用”，尤其是 hashline 编辑、`read` 的统一路径接口、`task` 子代理和 MCP 延迟加载。"
    bullets:
      - "已核实：`omp` 是 npm 包的 CLI bin，入口是 `packages/coding-agent/src/cli.ts`，运行时要求 Bun `>=1.3.14`。（来源：packages/coding-agent/package.json bin/engines；packages/coding-agent/src/cli.ts）"
      - "已核实：公开内置工具注册表包含 `read`、`bash`、`edit`、`lsp`、`debug`、`eval`、`task`、`web_search`、`browser` 等；README 自称“32 built-in tools”，源码注册表和隐藏工具需要按版本口径区分。（来源：packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS；README Whatever the task needs）"
      - "已核实：它不是纯 TypeScript；Rust workspace 包含 `pi-natives`、`pi-shell`、`pi-ast`、`pi-iso`，用于 native addon、shell、AST 和隔离后端。（来源：Cargo.toml workspace；crates/*/Cargo.toml）"
      - "自称：README 给出 Grok、Gemini、MiniMax 等编辑格式 benchmark，但我未运行 benchmark，不能当独立事实。（来源：README Every tool benchmaxxed）"
  key_claims_evidence:
    summary: ""
    body_md: "下面只把“仓库文件能支撑的东西”和“README 自称”分开。没有在 README/docs/tree 说明的能力，一律不补。"
    items:
      - claim: "CLI 可安装并以 `omp` 运行。"
        plain_english: "包名是 `@oh-my-pi/pi-coding-agent`，`bin` 把 `omp` 指到 `src/cli.ts`；README 给出 curl、Homebrew、Bun、Windows PowerShell、mise 五种安装入口。"
        source: "packages/coding-agent/package.json bin；README Install"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`bin: { \"omp\": \"src/cli.ts\" }`；`bun install -g @oh-my-pi/pi-coding-agent`。"
        does_not_support: "我未实际执行安装、登录模型或跑一次真实任务。"
        threat: "安装脚本、平台二进制、模型凭据流程仍需在目标机器复验。"
      - claim: "默认编辑方式是 hashline：用文件内容 hash 锚定补丁，避免模型用旧上下文乱改。"
        plain_english: "先 `read` 拿到 `PATH#TAG`，再 `edit` 用这个 TAG 绑定具体文件版本；live file 不匹配时会拒绝或走恢复。"
        source: "packages/hashline/README.md Quick start/Format；docs/tools/edit.md Hashline mode；packages/hashline/src/snapshots.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "示例里 `Patch.parse` 消费 `[hello.ts#${tag}]`；文档说明 TAG 是 4 位 hex snapshot tag。"
        does_not_support: "README 的“Perfect edits”“61% fewer output tokens”没有被本次复跑验证。"
        threat: "hash 只有会话内 snapshot store 有意义；跨会话、未读先改、或模型复制错误 TAG 都会失败。"
      - claim: "`read` 是统一入口：本地文件、目录、归档、SQLite、URL、内部协议都通过一个 `path` 参数读。"
        plain_english: "模型不用学十几个读取工具；同一个 read 会分流到 URL、internal URL、archive、SQLite、文件系统。"
        source: "docs/tools/read.md Inputs/Flow/Internal URLs；packages/coding-agent/src/tools/read.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文档列出 `agent://`、`artifact://`、`memory://`、`pr://`、`skill://` 等 internal URL；SQLite 选择器支持 `db.sqlite:table?limit=...`。"
        does_not_support: "没有证明所有网站、所有文档格式都能稳定转换。"
        threat: "URL/PDF/Office 文档读取依赖转换器和站点处理；失败时返回不可读提示。"
      - claim: "LSP 和 DAP 是模型可调用工具，不只是 UI 插件。"
        plain_english: "`lsp` 可做 diagnostics、references、rename、rename_file；`debug` 可 launch/attach、断点、step、变量、内存等 DAP 操作。"
        source: "docs/tools/lsp.md Inputs/Flow；docs/tools/debug.md Inputs/Flow"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`lsp.action` 枚举含 `rename_file`，会发送 `workspace/willRenameFiles`/`didRenameFiles`；`debug.action` 枚举含 `launch`、`attach`、`variables`、`read_memory`。"
        does_not_support: "没有证明每种语言服务器或调试适配器都可用。"
        threat: "依赖项目里存在 LSP/DAP binary；自动探测失败时需要配置。"
      - claim: "`task` 子代理支持并发、隔离工作区、结构化输出和 `agent://` 回读。"
        plain_english: "父代理可以拆任务给子代理，子代理输出写成 artifact，父代理用 `agent://<id>` 再读。"
        source: "docs/tools/task.md Flow/Outputs/Limits"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文档写明 `AgentOutputManager.allocateBatch`、`Semaphore(task.maxConcurrency)`、`<id>.md`、`agent://<id>/<path>`、隔离后端 `worktree`/`fuse-overlay`/`fuse-projfs`。"
        does_not_support: "未验证复杂多子代理合并冲突的成功率。"
        threat: "隔离执行要求 git repo；FUSE/ProjFS/Git 操作会带来平台差异。"
      - claim: "MCP 是运行时工具源，并有快速启动和延迟工具机制。"
        plain_english: "启动时发现 MCP server，连接和 `tools/list` 并行；250ms 后可用缓存生成 DeferredMCPTool，晚到连接再刷新。"
        source: "docs/mcp-runtime-lifecycle.md Lifecycle/Connection establishment；docs/mcp-config.md File shape"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`STARTUP_TIMEOUT_MS = 250`；工具名形如 `mcp__<server>_<tool>`；配置支持 `stdio`、`http`、`sse`。"
        does_not_support: "没有证明第三方 MCP server 都安全或稳定。"
        threat: "MCP 工具默认可能按 exec 级别审批；远端工具和 OAuth 凭据需要严格治理。"
      - claim: "README 自称支持 40+ providers、14 个 web search backends、约 27000 行 Rust core。"
        plain_english: "这些是项目宣传口径；仓库中确有 `models.yml` provider 配置文档、web_search provider 表、Rust crates，但数字本次未逐项复算。"
        source: "README Forty-plus providers；README Fourteen backends；README Roughly ~27000 lines of Rust；docs/models.md"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 列出 Frontier APIs、Coding plans、Run it yourself、Search providers 表；Cargo workspace 有 Rust crate。"
        does_not_support: "未证明 provider 数、模型数、Rust LoC 精确等于 README 数字。"
        threat: "provider/API/订阅通道变化快，生产采用要按目标 provider 重新验证。"
  how_it_works:
    summary: ""
    body_md: "核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。\n\n```mermaid\nflowchart TD\n  A[用户任务] --> B[omp CLI]\n  B --> C[会话运行时]\n  C --> D[模型路由]\n  C --> E[工具注册表]\n  E --> F[read 统一读取]\n  F --> G[哈希锚快照]\n  G --> H[edit 写入]\n  H --> I[LSP 诊断]\n  E --> J[task 子代理]\n  J --> K[隔离工作区]\n  E --> L[MCP 和扩展]\n  E --> M[eval 和 bash]\n```\n\n一个真实编辑例子：`read` 在 hashline 模式会给可变文件加类似 `¶a.ts#0A3B` 的头，`edit` 再消费这个头和行号。（来源：docs/tools/read.md Local text files；docs/tools/edit.md Worked examples）\n\n```text\n¶a.ts#0A3B\nreplace 1..1:\n```\n\n这两行的意思是：只替换 `a.ts` 当前快照的第 1 行；如果文件内容已经漂移，`packages/hashline` 会按 snapshot 校验并拒绝或恢复。（来源：packages/hashline/README.md Format；docs/tools/edit.md Limits & Caps）\n\n更完整的 agent loop：CLI 入口 `src/cli.ts` 把非子命令默认路由到 `launch`；`main.ts` 初始化 settings、model registry、session；`createTools` 从 `BUILTIN_TOOLS` 和 MCP/custom/extension 工具生成可调用工具；工具执行结果回到会话，再由模型决定下一步。（来源：packages/coding-agent/DEVELOPMENT.md Boot Sequence；packages/coding-agent/src/tools/index.ts createTools）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得抽走的不是 UI，而是给模型用的工具契约：少量强工具、明确输入 schema、可追溯输出、失败可恢复。"
    items:
      - name: "Hashline 内容锚编辑"
        copy: "让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。"
        skip: "如果你的应用只写新文件、不修改既有代码，普通 `write` 或 AST rewrite 更简单。"
        why_it_matters: "它把模型的 diff 错误从“静默写坏文件”变成“锚不匹配而失败”。（来源：packages/hashline/README.md；docs/tools/edit.md）"
      - name: "统一 path 读取协议"
        copy: "把文件、URL、SQLite、归档、内部 artifact 都压到 `read({path})`，再用 selector 做分页和范围读取。"
        skip: "如果你的 agent 只面向一个固定数据库，专用查询工具更清楚。"
        why_it_matters: "模型学一个读取接口，就能访问 `pr://`、`agent://`、`memory://`、`skill://` 等资源。（来源：docs/tools/read.md Internal URLs）"
      - name: "隐藏工具加 BM25 发现"
        copy: "默认只暴露 essential 工具；其它工具隐藏但可检索，需要时由 `search_tool_bm25` 激活。"
        skip: "如果工具总数很少，直接暴露全部工具更省实现成本。"
        why_it_matters: "它降低模型每轮工具选择负担，同时保留大工具箱。（来源：README Whatever the task needs；packages/coding-agent/src/tools/index.ts filterInitialToolsForDiscoveryAll）"
      - name: "子代理 artifact 协议"
        copy: "每个子任务输出 `<id>.md` 或 JSON artifact，父代理用 `agent://<id>` 读取，而不是解析长段聊天文本。"
        skip: "如果任务不可并行，单 agent 加 todo 足够。"
        why_it_matters: "它让 fan-out/fan-in 有明确边界，适合审查、调研、批量改造。（来源：docs/tools/task.md Outputs/Flow）"
      - name: "扩展事件拦截"
        copy: "扩展用 `tool_call` 和 `tool_result` 事件包住所有工具；可注册工具、命令、快捷键和 renderer。"
        skip: "如果只需要静态提示词，用 skills 比 extensions 轻。"
        why_it_matters: "这给安全策略、团队流程、专用工具留出同一条接入路径。（来源：docs/extensions.md Runtime model；docs/hooks.md Tool events）"
  dependency_platform_risk:
    summary: ""
    body_md: "风险集中在三层：运行时平台、外部 provider/MCP、以及默认权限策略。它功能很满，生产落地要先收窄工具面。"
    items:
      - dependency: "Bun >= 1.3.14"
        what_if_change: "Bun 版本不足时 `src/cli.ts` 会直接报错退出；worker/native 加载也依赖 Bun 行为。"
        exposure: "high"
        mitigation_or_unknown: "固定 Bun 版本；CI 跑 `--smoke-test`。未实际运行 smoke test。"
        source: "packages/coding-agent/package.json engines；packages/coding-agent/src/cli.ts runSmokeTest"
      - dependency: "Rust N-API native crates"
        what_if_change: "平台二进制或 N-API 加载失败会影响 grep、shell、AST、PTY、image、token 等热路径。"
        exposure: "high"
        mitigation_or_unknown: "README 自称支持 `linux-x64`、`linux-arm64`、`darwin-x64`、`darwin-arm64`、`win32-x64`；目标平台需安装验证。"
        source: "README Roughly ~27000 lines of Rust；crates/pi-natives/Cargo.toml"
      - dependency: "模型 provider 与 models.yml"
        what_if_change: "provider API、OAuth、订阅计划或 gateway 字段变化会导致模型不可用或路由失败。"
        exposure: "high"
        mitigation_or_unknown: "使用 `~/.omp/agent/models.yml` 明确 provider、baseUrl、apiKey、api；provider 数和可用性需按当天验证。"
        source: "docs/models.md Provider-level fields/Validation rules"
      - dependency: "MCP server"
        what_if_change: "第三方 MCP server 连接慢、工具变更、OAuth 失效或行为不可信，会影响 agent 工具调用。"
        exposure: "medium"
        mitigation_or_unknown: "用 `.omp/mcp.json` 管理；设置 disabledServers、timeout；对高风险 MCP 工具用审批 deny/prompt。"
        source: "docs/mcp-config.md File shape；docs/mcp-runtime-lifecycle.md Fast startup gate"
      - dependency: "LSP/DAP 外部二进制"
        what_if_change: "语言服务器或调试适配器不在 PATH/项目 bin，`lsp`/`debug` 就只能部分工作。"
        exposure: "medium"
        mitigation_or_unknown: "为项目写 `.omp/lsp.json`；DAP adapter 需要按语言安装。"
        source: "docs/lsp-config.md Auto-detection；docs/tools/debug.md Adapter selection"
      - dependency: "默认审批模式"
        what_if_change: "文档写 `yolo` 是默认，read/write/exec 都自动批准；模型可执行 bash、browser、子代理等高影响工具。"
        exposure: "high"
        mitigation_or_unknown: "把 `tools.approvalMode` 改为 `write` 或 `always-ask`，并对 `bash`、MCP 删除类工具设 prompt/deny。"
        source: "docs/approval-mode.md Modes/User overrides"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不是小问题；它们决定能不能从“好看的 harness”变成团队可用工具。"
    items:
      - "README benchmark 表未复跑：Grok/Gemini/MiniMax 的提升数字只能标为自称。（来源：README Every tool benchmaxxed）"
      - "README 的 `40+ providers`、`32 built-in tools`、`~27k Rust` 未逐项复算；源码证明有多 provider、工具注册表和 Rust crates，但数字口径未知。（来源：README Forty-plus providers；packages/coding-agent/src/tools/index.ts）"
      - "未实际运行 `omp`、未验证 OAuth/API key 登录、未验证 Windows/macOS/Linux 二进制安装。"
      - "扩展、MCP、browser、bash 的安全边界需要团队策略；默认 `yolo` 不适合未隔离生产环境。（来源：docs/approval-mode.md）"
      - "README 引用 `packages/coding-agent/DEVELOPMENT.md` 存在并可读，但整体文档体量大，仍需按目标工作流复核关键路径。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "建议：先 clone-and-run，不建议盲目替换主力工具。原因是源码和 docs 的工程深度很高，尤其 hashline、统一 read、task 子代理、MCP 延迟工具、扩展拦截都可复用；但默认权限、provider 依赖、native 平台包和高速迭代带来实际采用风险。对 AI 应用团队，最佳动作是抽模式：把 hashline/工具发现/agent:// artifact 这些设计搬进自己的 harness。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\can1357-oh-my-pi\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\can1357-oh-my-pi\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\can1357-oh-my-pi\\codex-last-message.json"
  invoked_at: "2026-06-09T00:09:00.955Z"
  completed_at: "2026-06-09T00:18:00.651Z"
  repo: "can1357/oh-my-pi"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "CLI 可安装并以 `omp` 运行。"
    - "默认编辑方式是 hashline：用文件内容 hash 锚定补丁，避免模型用旧上下文乱改。"
    - "`read` 是统一入口：本地文件、目录、归档、SQLite、URL、内部协议都通过一个 `path` 参数读。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "packages/coding-agent/package.json engines；packages/coding-agent/src/cli.ts runSmokeTest"
    - "README Roughly ~27000 lines of Rust；crates/pi-natives/Cargo.toml"
    - "docs/models.md Provider-level fields/Validation rules"
    - "docs/mcp-config.md File shape；docs/mcp-runtime-lifecycle.md Fast startup gate"
    - "docs/lsp-config.md Auto-detection；docs/tools/debug.md Adapter selection"
    - "docs/approval-mode.md Modes/User overrides"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "建议：先 clone-and-run，不建议盲目替换主力工具。原因是源码和 docs 的工程深度很高，尤其 hashline、统一 read、task 子代理、MCP 延迟工具、扩展拦截都可复用；但默认权限、provider 依赖、native 平台包和高速迭代带来实际采用风险。对 AI 应用团队，最佳动作是抽模式：把 hashline/工具发现/agent:// artifact 这些设计搬进自己的 harness。"
next_actions:
  - "clone-and-run"
unknowns:
  - "README benchmark 表未复跑：Grok/Gemini/MiniMax 的提升数字只能标为自称。（来源：README Every tool benchmaxxed）"
  - "README 的 `40+ providers`、`32 built-in tools`、`~27k Rust` 未逐项复算；源码证明有多 provider、工具注册表和 Rust crates，但数字口径未知。（来源：README Forty-plus providers；packages/coding-agent/src/tools/index.ts）"
  - "未实际运行 `omp`、未验证 OAuth/API key 登录、未验证 Windows/macOS/Linux 二进制安装。"
  - "扩展、MCP、browser、bash 的安全边界需要团队策略；默认 `yolo` 不适合未隔离生产环境。（来源：docs/approval-mode.md）"
  - "README 引用 `packages/coding-agent/DEVELOPMENT.md` 存在并可读，但整体文档体量大，仍需按目标工作流复核关键路径。"
builder_reuse:
  pattern: "Hashline 内容锚编辑"
  copy: "让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。"
  skip: "如果你的应用只写新文件、不修改既有代码，普通 `write` 或 AST rewrite 更简单。"
  why_it_matters: "它把模型的 diff 错误从“静默写坏文件”变成“锚不匹配而失败”。（来源：packages/hashline/README.md；docs/tools/edit.md）"
dependency_platform_risk:
  dependency: "Bun >= 1.3.14"
  what_if_change: "Bun 版本不足时 `src/cli.ts` 会直接报错退出；worker/native 加载也依赖 Bun 行为。"
  exposure: "high"
  mitigation_or_unknown: "固定 Bun 版本；CI 跑 `--smoke-test`。未实际运行 smoke test。"
claim_ledger:
  - claim: "CLI 可安装并以 `omp` 运行。"
    plain_english: "包名是 `@oh-my-pi/pi-coding-agent`，`bin` 把 `omp` 指到 `src/cli.ts`；README 给出 curl、Homebrew、Bun、Windows PowerShell、mise 五种安装入口。"
    source: "packages/coding-agent/package.json bin；README Install"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`bin: { \"omp\": \"src/cli.ts\" }`；`bun install -g @oh-my-pi/pi-coding-agent`。"
    does_not_support: "我未实际执行安装、登录模型或跑一次真实任务。"
    threat: "安装脚本、平台二进制、模型凭据流程仍需在目标机器复验。"
  - claim: "默认编辑方式是 hashline：用文件内容 hash 锚定补丁，避免模型用旧上下文乱改。"
    plain_english: "先 `read` 拿到 `PATH#TAG`，再 `edit` 用这个 TAG 绑定具体文件版本；live file 不匹配时会拒绝或走恢复。"
    source: "packages/hashline/README.md Quick start/Format；docs/tools/edit.md Hashline mode；packages/hashline/src/snapshots.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "示例里 `Patch.parse` 消费 `[hello.ts#${tag}]`；文档说明 TAG 是 4 位 hex snapshot tag。"
    does_not_support: "README 的“Perfect edits”“61% fewer output tokens”没有被本次复跑验证。"
    threat: "hash 只有会话内 snapshot store 有意义；跨会话、未读先改、或模型复制错误 TAG 都会失败。"
  - claim: "`read` 是统一入口：本地文件、目录、归档、SQLite、URL、内部协议都通过一个 `path` 参数读。"
    plain_english: "模型不用学十几个读取工具；同一个 read 会分流到 URL、internal URL、archive、SQLite、文件系统。"
    source: "docs/tools/read.md Inputs/Flow/Internal URLs；packages/coding-agent/src/tools/read.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文档列出 `agent://`、`artifact://`、`memory://`、`pr://`、`skill://` 等 internal URL；SQLite 选择器支持 `db.sqlite:table?limit=...`。"
    does_not_support: "没有证明所有网站、所有文档格式都能稳定转换。"
    threat: "URL/PDF/Office 文档读取依赖转换器和站点处理；失败时返回不可读提示。"
  - claim: "LSP 和 DAP 是模型可调用工具，不只是 UI 插件。"
    plain_english: "`lsp` 可做 diagnostics、references、rename、rename_file；`debug` 可 launch/attach、断点、step、变量、内存等 DAP 操作。"
    source: "docs/tools/lsp.md Inputs/Flow；docs/tools/debug.md Inputs/Flow"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`lsp.action` 枚举含 `rename_file`，会发送 `workspace/willRenameFiles`/`didRenameFiles`；`debug.action` 枚举含 `launch`、`attach`、`variables`、`read_memory`。"
    does_not_support: "没有证明每种语言服务器或调试适配器都可用。"
    threat: "依赖项目里存在 LSP/DAP binary；自动探测失败时需要配置。"
  - claim: "`task` 子代理支持并发、隔离工作区、结构化输出和 `agent://` 回读。"
    plain_english: "父代理可以拆任务给子代理，子代理输出写成 artifact，父代理用 `agent://<id>` 再读。"
    source: "docs/tools/task.md Flow/Outputs/Limits"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文档写明 `AgentOutputManager.allocateBatch`、`Semaphore(task.maxConcurrency)`、`<id>.md`、`agent://<id>/<path>`、隔离后端 `worktree`/`fuse-overlay`/`fuse-projfs`。"
    does_not_support: "未验证复杂多子代理合并冲突的成功率。"
    threat: "隔离执行要求 git repo；FUSE/ProjFS/Git 操作会带来平台差异。"
  - claim: "MCP 是运行时工具源，并有快速启动和延迟工具机制。"
    plain_english: "启动时发现 MCP server，连接和 `tools/list` 并行；250ms 后可用缓存生成 DeferredMCPTool，晚到连接再刷新。"
    source: "docs/mcp-runtime-lifecycle.md Lifecycle/Connection establishment；docs/mcp-config.md File shape"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`STARTUP_TIMEOUT_MS = 250`；工具名形如 `mcp__<server>_<tool>`；配置支持 `stdio`、`http`、`sse`。"
    does_not_support: "没有证明第三方 MCP server 都安全或稳定。"
    threat: "MCP 工具默认可能按 exec 级别审批；远端工具和 OAuth 凭据需要严格治理。"
render_warnings:
  - "faithfulness.high_risk_source line 75: 建议：先 clone-and-run，不建议盲目替换主力工具。原因是源码和 docs 的工程深度很高，尤其 hashline、统一 read、task 子代理、MCP 延迟工具、扩展拦截都可复用；但默认权限、provider 依赖、native 平台包和高速迭代带来实际采用..."
  - "faithfulness.unknown_assertion line 34 term \"coding-agent\": 它值得看，不是因为 README 写得猛，而是因为仓库里确实有完整工具层：`packages/coding-agent/src/tools/index.ts` 注册公开内置工具，`docs/tools/*.md` 给每个工具写了运行路径，Rust crate 负责搜索、sh..."
  - "faithfulness.unknown_assertion line 67 term \"coding-agent\": 核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。 ```mermaid flowchart TD A[用户任务] --> B[omp CLI] B --> C[会话运行时] C --> D[模型路由] C --> E[工具注册表] E..."
artifact_audit:
  official_repo: "https://github.com/can1357/oh-my-pi"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

can1357/oh-my-pi：GitHub 描述为“⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more”。

（来源：README/artifactAudit）

## 干什么

⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 11287 |
| stars_in_period | 7042 |
| author | can1357 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

它值得看，不是因为 README 写得猛，而是因为仓库里确实有完整工具层：`packages/coding-agent/src/tools/index.ts` 注册公开内置工具，`docs/tools/*.md` 给每个工具写了运行路径，Rust crate 负责搜索、shell、AST、PTY 等底层能力。对 AI 应用开发者，最有价值的是“工具表面怎么设计给模型用”，尤其是 hashline 编辑、`read` 的统一路径接口、`task` 子代理和 MCP 延迟加载。

（来源：README/artifactAudit）

## 核心能力

- Hashline 内容锚编辑（来源：数据不足）
- 统一 path 读取协议（来源：数据不足）
- 隐藏工具加 BM25 发现（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，它更像“开源、可改造的 Claude Code/Codex CLI 替代 harness”，不是单纯代码补全工具。 - 对 OpenAI Codex CLI：Codex CLI 官方定位是本地终端 coding agent，可读写文件、运行命令，并有审批模式（来源：https://help.openai.com/en/articles/11096431；https://github.com/openai/codex）。取舍：如果团队已经押 OpenAI/Codex 生态，Codex CLI 路径更直接；如果要多 provider、MCP/skills/extensions、hashline 和 Rust native 工具体系，oh-my-pi 更可拆。 - 对 Claude Code：Claude Code 官方文档强调终端/IDE/桌面/浏览器、多表面、MCP、hooks、Agent SDK（来源：https://code.claude.com/docs/en/overview；https://code.claude.com/docs/en/hooks）。取舍：如果你要稳定商业产品和 Anthropic 官方能力，选 Claude Code；如果你要读源码、改工具层、接入非 Anthropic provider，oh-my-pi 的 MIT monorepo 更适合研究和二次开发。 - 对 Aider：Aider 官方定位是终端 AI pair programming，并强调 Git 集成和自动提交（来源：https://aider.chat/；https://aider.chat/docs/）。取舍：如果目标是轻量结对改代码，Aider 更小；如果目标是构建带 LSP、DAP、browser、MCP、子代理和扩展的 agent surface，oh-my-pi 覆盖更宽但复杂度更高。 结论：做 AI 应用的人未确认把它当“工具协议和运行时设计样本”读；直接替换团队日常工具前，先 clone-and-run 验证安装、模型登录、审批策略和平台 native 包。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。 ```mermaid flowchart TD A[用户任务] --> B[omp CLI] B --> C[会话运行时] C --> D[模型路由] C --> E[工具注册表] E --> F[read 统一读取] F --> G[哈希锚快照] G --> H[edit 写入] H --> I[LSP 诊断] E --> J[task 子代理] J --> K[隔离工作区] E --> L[MCP 和扩展] E --> M[eval 和 bash] ``` 一个真实编辑例子：`read` 在 hashline 模式会给可变文件加类似 `¶a.ts#0A3B` 的头，`edit` 再消费这个头和行号。（来源：docs/tools/read.md Local text files；docs/tools/edit.md Worked examples） ```text ¶a.ts#0A3B replace 1..1: ``` 这两行的意思是：只替换 `a.ts` 当前快照的第 1 行；如果文件内容已经漂移，`packages/hashline` 会按 snapshot 校验并拒绝或恢复。（来源：packages/hashline/README.md Format；docs/tools/edit.md Limits & Caps） 更完整的 agent loop：CLI 入口 `src/cli.ts` 把非子命令默认路由到 `launch`；`main.ts` 初始化 settings、model registry、session；`createTools` 从 `BUILTIN_TOOLS` 和 MCP/custom/extension 工具生成可调用工具；工具执行结果回到会话，再由模型决定下一步。（来源：packages/coding-agent/DEVELOPMENT.md Boot Sequence；packages/coding-agent/src/tools/index.ts createTools）

## 本质不同的设计取舍

最值得抽走的不是 UI，而是给模型用的工具契约：少量强工具、明确输入 schema、可追溯输出、失败可恢复。 - Hashline 内容锚编辑；让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。；如果你的应用只写新文件、不修改既有代码，普通 `write` 或 AST rewrite 更简单。；它把模型的 diff 错误从“静默写坏文件”变成“锚不匹配而失败”。（来源：packages/hashline/README.md；docs/tools/edit.md） - 统一 path 读取协议；把文件、URL、SQLite、归档、内部 artifact 都压到 `read({path})`，再用 selector 做分页和范围读取。；如果你的 agent 只面向一个固定数据库，专用查询工具更清楚。；模型学一个读取接口，就能访问 `pr://`、`agent://`、`memory://`、`skill://` 等资源。（来源：docs/tools/read.md Internal URLs） - 隐藏工具加 BM25 发现；默认只暴露 essential 工具；其它工具隐藏但可检索，需要时由 `search_tool_bm25` 激活。；如果工具总数很少，直接暴露全部工具更省实现成本。；它降低模型每轮工具选择负担，同时保留大工具箱。（来源：README Whatever the task needs；packages/coding-agent/src/tools/index.ts filterInitialToolsForDiscoveryAll） - 子代理 artifact 协议；每个子任务输出 `<id>.md` 或 JSON artifact，父代理用 `agent://<id>` 读取，而不是解析长段聊天文本。；如果任务不可并行，单 agent 加 todo 足够。；它让 fan-out/fan-in 有明确边界，适合审查、调研、批量改造。（来源：docs/tools/task.md Outputs/Flow） - 扩展事件拦截；扩展用 `tool_call` 和 `tool_result` 事件包住所有工具；可注册工具、命令、快捷键和 renderer。；如果只需要静态提示词，用 skills 比 extensions 轻。；这给安全策略、团队流程、专用工具留出同一条接入路径。（来源：docs/extensions.md Runtime model；docs/hooks.md Tool events）

## 对从业者意味着什么

建议：先 clone-and-run，不建议盲目替换主力工具。原因是源码和 docs 的工程深度很高，尤其 hashline、统一 read、task 子代理、MCP 延迟工具、扩展拦截都可复用；但默认权限、provider 依赖、native 平台包和高速迭代带来实际采用风险。对 AI 应用团队，最佳动作是抽模式：把 hashline/工具发现/agent:// artifact 这些设计搬进自己的 harness。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/hashline-editing]]、[[concepts/unified-read-path]]。另见 [[content/can1357-oh-my-pi]]、[[claims/can1357-oh-my-pi-main-claim-2]]。
