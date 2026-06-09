---
content: "refactoringhq-tolaria"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "ai_app"
title: "tolaria — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "refactoringhq/tolaria：GitHub 描述为“Desktop app to manage markdown knowledge bases”。"
  what_it_does: "Desktop app to manage markdown knowledge bases"
  metadata:
    language: "TypeScript"
    total_stars: "13556"
    stars_in_period: "649"
    author: "refactoringhq"
  labels:
    - "Tier 2"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "值得看的是它把“知识库即上下文”做成了产品级工作流：Markdown/YAML 是源数据，Git 是版本与同步层，AI 通过 CLI agent 或 MCP 进入同一套 vault。对做 AI 应用的人，重点不是 UI，而是如何让本地文件、权限、上下文截断、多工作区和外部 agent 协作不打架。（来源：docs/ARCHITECTURE Design Principles；docs/adr/0062-selectable-cli-ai-agents.md；docs/adr/0074-explicit-external-ai-tool-setup-and-least-privilege-desktop-scope.md）"
  core_capabilities:
    - "VaultEntry 作为文件图谱投影"
    - "持久外部 MCP 配置不写 vault path"
    - "Adapter-specific permission mapping"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，Tolaria 的差异不在“能写 Markdown”，而在“把 vault 设计成 AI agent 工作区”。 Obsidian：官方文档把 vault 定义为本地文件夹，Sync 是可选远端同步服务（来源：https://obsidian.md/help/Obsidian%2BSync/Local%2Band%2Bremote%2Bvaults）。选 Obsidian：插件生态、成熟笔记体验优先。选 Tolaria：想把 Git、MCP、CLI agent 权限、AGENTS.md 指南作为一等产品能力；代价是生态和成熟度不如 Obsidian。 Logseq：官方 docs 强调 graph、Markdown 文件、block/page references（来源：https://docs.logseq.com/）。选 Logseq：大纲式块编辑、双链图谱、学习曲线能接受。选 Tolaria：更偏文件级 Markdown、Git 版本工作流、外部 agent 读写 vault；代价是块级知识模型不是主轴。 Anytype：官方 docs 自称 encrypted local-first、对象空间和 AnySync（来源：https://doc.anytype.io/anytype-docs）。选 Anytype：端到端加密对象库、同步协作优先。选 Tolaria：希望数据保持普通 Markdown/YAML/Git、能被 CLI 和 MCP 工具直接理解；代价是协作/加密同步不是内置核心。"
  trajectory_note: ""
  manual_confirmation: false
  how_it_works_with_analogy: "真实流：用户打开 `demo-vault-v2/25q2-laputa-v2.md` 这类文件，frontmatter 里有 `type: Project`、`belongs_to`、`related_to`，正文里有 `「laputa-qa-reference」(Obsidian 式双链)`。Rust 扫描后生成 `VaultEntry`，React 显示四栏；AI 面板把 active note、open tabs、note list 和 vault summary 组装成 JSON context；CLI agent 或 MCP tool 再读写同一批文件。（来源：demo-vault-v2/25q2-laputa-v2.md；src-tauri/src/vault/mod.rs；src/utils/ai-context.ts） ```mermaid flowchart TD A[Markdown vault] --> B[Rust 扫描] B --> C[VaultEntry 列表] C --> D[React 四栏 UI] D --> E[AI context JSON] E --> F[CLI agent 适配器] F --> G[MCP tools] G --> H[读写 active vault] H --> A D --> I[UI WebSocket 桥] G --> I ``` 关键点：MCP 的 `create_note` 不覆盖已有文件，fallback 内容会写成 `type: \"Project\"` 加 H1；多 vault 同名路径会报 ambiguous，要求传 `vaultPath`。（来源：mcp-server/tool-service.test.js） ```bash pnpm install pnpm tauri dev ``` 这是真桌面开发入口；浏览器 mock 用 `pnpm dev`，不覆盖 Tauri/Rust/MCP 全路径。（来源：README Quick start；docs/GETTING-STARTED Quick Start）"
  essential_design_difference: "最可复用的是“让普通文件变成 agent 可操作对象”的边界设计，不是 UI 组件本身。 - VaultEntry 作为文件图谱投影；把 Markdown 文件解析成统一 entry：path、title、type、relationships、outgoingLinks、fileKind、workspace provenance。；如果你的应用数据本来在数据库里，没必要绕回文件投影。；Agent 不需要理解每个用户的文件夹习惯，只需要读一个稳定的图谱接口。（来源：docs/ABSTRACTIONS VaultEntry；src-tauri/src/vault/mod.rs） - 持久外部 MCP 配置不写 vault path；外部 config 只保留 stdio command、index.js、`WS_UI_PORT=9711`；active vault 在工具调用时解析。；如果你的 MCP server 是单项目固定路径，动态解析会增加复杂度。；减少切 vault 时把第三方工具悄悄指向旧路径的风险。（来源：src-tauri/src/mcp.rs build_mcp_entry；tests/smoke/mcp-config-copy.spec.ts） - Adapter-specific permission mapping；UI 只暴露 Safe/Power User，底层按 Claude/Codex/OpenCode/Gemini 各自 CLI 参数映射。；如果只集成一个 agent，先用原生权限模型更简单。；多 agent 产品不能假装权限语义一致；Tolaria 用 ADR 和测试把差异写死。（来源：docs/adr/0103；src-tauri/src/codex_cli.rs；src-tauri/src/gemini_config.rs） - Git-backed disposable cache；cache 存在 `~/.laputa/cache/<vault-hash>.json`，按 HEAD、diff、uncommitted files 增量刷新；cache version 变更强制重扫。；小数据量或无 Git 场景可先用全量扫描。；本地优先 AI 应用经常被大文件夹拖慢；这套模式把“快启动”和“磁盘为真”分开。（来源：docs/adr/0014；src-tauri/src/vault/cache.rs） - 直接模型只给窄工具；OpenAI-compatible 模型只有 active vault 存在时才拿到 `create_note` 工具，且 unsupported tool 会先拒绝。；需要复杂文件编辑时，直接用 CLI agent/MCP 更合适。；给 hosted model 一个窄 create-only 能力，比开放本地 shell 更容易解释和审计。（来源：src-tauri/src/ai_model_tools.rs）"
  practitioner_meaning: "建议抽模式，不建议直接押生产。它对 AI 应用工程的价值在“本地知识库 + MCP + CLI adapter + 权限模式 + Git cache”的组合设计；如果你在做 agent 工作区、AI 知识库、企业本地文档工具，值得 clone-and-run。若只是找成熟笔记软件，Obsidian/Logseq/Anytype 更稳；若只是找 agent framework，Tolaria 太产品化。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Tolaria 是一个本地优先的 Markdown 知识库桌面应用，把 vault 文件、Git、MCP 和多种 CLI/模型 AI 入口接在一起。"
    body_md: "人话：它更像“给 AI 可读的个人/团队 Markdown vault 管理器”，不是单纯笔记 App，也不是通用 agent framework。术语上，它用 Tauri + React 做桌面壳，用 Rust 扫描/写入 vault，用 Node MCP server 给 Claude/Codex/Gemini/OpenCode 等工具暴露读写入口。（来源：README Principles；docs/ARCHITECTURE System Overview；mcp-server/index.js TOOLS）"
  why_worth_attention:
    summary: ""
    body_md: "值得看的是它把“知识库即上下文”做成了产品级工作流：Markdown/YAML 是源数据，Git 是版本与同步层，AI 通过 CLI agent 或 MCP 进入同一套 vault。对做 AI 应用的人，重点不是 UI，而是如何让本地文件、权限、上下文截断、多工作区和外部 agent 协作不打架。（来源：docs/ARCHITECTURE Design Principles；docs/adr/0062-selectable-cli-ai-agents.md；docs/adr/0074-explicit-external-ai-tool-setup-and-least-privilege-desktop-scope.md）"
    bullets:
      - "已核实支持桌面开发路径：`pnpm dev` 跑浏览器 mock，`pnpm tauri dev` 跑完整桌面应用。（来源：README Quick start；docs/GETTING-STARTED Quick Start）"
      - "已核实 MCP server 暴露 `search_notes`、`get_note`、`create_note`、`open_note`、`refresh_vault` 等工具，且通过 `WS_UI_PORT=9711` 和前端 UI 桥通信。（来源：mcp-server/index.js TOOLS；src-tauri/src/mcp.rs）"
      - "已核实 AI 目标不只 Claude：前端注册 Claude Code、Codex、OpenCode、Pi、Gemini CLI、Kiro；另有 OpenAI、Anthropic、Gemini、OpenRouter、Ollama、LM Studio 等模型 provider catalog。（来源：src/lib/aiAgents.ts；src/shared/aiModelProviderCatalog.json）"
      - "成熟度信号强但仍新：仓库有 133 个 smoke spec、24 个 e2e spec、403 个前端 test 文件；最新本地提交为 2026-06-08 23:30:07 +0200，标签含 `alpha-v2026.6.8-alpha.0018`。（来源：tests/smoke tree；e2e tree；git log；git tag）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把“自称”和“已核实”分开。README 的口号只算自称；源码、配置、测试里能看到的机制算已核实。"
    items:
      - claim: "本地文件优先、无导出锁定"
        plain_english: "笔记是普通 `.md` 文件，YAML frontmatter 承载 `type`、`status`、关系等字段；解析入口是 Rust 的 `parse_md_file()`。"
        source: "README Principles；src-tauri/src/vault/mod.rs parse_md_file；docs/ABSTRACTIONS Document Model"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`parse_md_file()` 读取磁盘文件、解析 YAML frontmatter、提取 H1、wikilinks、word_count、file_kind。"
        does_not_support: "不证明所有 Markdown 扩展都能无损往返；编辑器序列化仍依赖 BlockNote/CodeMirror 适配。"
        threat: "富文本编辑器、Mermaid、tldraw、PDF/媒体预览会引入应用层约定；跨工具无损需要逐项验证。"
      - claim: "Git-first，但非 Git vault 也可打开"
        plain_english: "Git 是同步/历史能力，不再是打开 vault 的硬门槛；非 Git 模式隐藏 commit/sync 等功能。"
        source: "docs/adr/0085-non-git-vault-support.md；docs/ABSTRACTIONS Vault Git Capability"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "ADR-0085 明确 plain folder 可浏览、编辑、搜索；Git 初始化通过显式命令启用。"
        does_not_support: "不证明非 Git 模式在大 vault 下性能等同 Git-backed cache。"
        threat: "团队协作仍依赖用户自己的 Git 远端和认证；冲突体验要按真实仓库测试。"
      - claim: "AI-first but not AI-only"
        plain_english: "AI 不是强绑定云服务；应用可用 CLI agents，也能配置 API/local model provider。"
        source: "README Principles；src/lib/aiAgents.ts；src/shared/aiModelProviderCatalog.json；src-tauri/src/ai_models.rs"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "agent 列表含 6 个 CLI；provider catalog 含 OpenAI/Anthropic/Gemini/OpenRouter/Ollama/LM Studio/custom provider。"
        does_not_support: "不证明每个 provider 的流式、工具调用、视觉能力都已完整实现。"
        threat: "`ai_models.rs` 当前 OpenAI-compatible 请求使用 `stream: false` 后再发 TextDelta，和真正 token streaming 不同。"
      - claim: "MCP 让外部 AI 工具操作 vault"
        plain_english: "MCP server 是 Node stdio server；工具调用时从 `VAULT_PATH`、`VAULT_PATHS` 或 app 的 `vaults.json` 解析 active vault。"
        source: "mcp-server/index.js；mcp-server/vault-path.js；mcp-server/tool-service.js；tests/smoke/mcp-config-copy.spec.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "copy config 测试要求 `mcpServers.tolaria.type=stdio`、`env.WS_UI_PORT=9711`，且不写 `VAULT_PATH` 到持久外部配置。"
        does_not_support: "不证明所有 MCP client 都兼容；只证明代码生成标准片段并覆盖部分 UI 测试。"
        threat: "运行时依赖 Node.js 18+ 或 Bun 1+；Linux AppImage 还有稳定路径抽取逻辑，部署面较宽。"
      - claim: "Vault Safe / Power User 权限模型"
        plain_english: "同一个 UI 模式按 adapter 映射成不同 CLI 参数：Codex Safe 是 read-only + untrusted，Power User 是 workspace-write + never。"
        source: "src-tauri/src/codex_cli.rs codex_sandbox/codex_approval_policy；src-tauri/src/gemini_config.rs approval_mode；docs/adr/0103-adapter-specific-ai-permission-semantics.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Codex 明确禁止 dangerous bypass；Gemini Safe 排除 `run_shell_command`，Power User 映射 `yolo`。"
        does_not_support: "不等于统一安全语义；不同 CLI 的权限粒度不同。"
        threat: "Power User 仍会放大本地写入/命令风险；每个 adapter 升级后都需要重测。"
      - claim: "作者自称可承载 10,000+ notes"
        plain_english: "README 说作者用一个 10,000+ notes 的 workspace；ADR-0014 提到 9000+ Markdown 文件扫描痛点。"
        source: "README intro；docs/adr/0014-git-based-vault-cache.md"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "源码有 Git-based cache、cache version、同 HEAD 增量更新、untracked file 覆盖测试。"
        does_not_support: "没有公开 benchmark、机器配置、P95 启动耗时。"
        threat: "大 vault 性能需要用自己的笔记数量、文件大小、Git 状态和平台复测。"
  how_it_works:
    summary: ""
    body_md: "真实流：用户打开 `demo-vault-v2/25q2-laputa-v2.md` 这类文件，frontmatter 里有 `type: Project`、`belongs_to`、`related_to`，正文里有 `「laputa-qa-reference」(Obsidian 式双链)`。Rust 扫描后生成 `VaultEntry`，React 显示四栏；AI 面板把 active note、open tabs、note list 和 vault summary 组装成 JSON context；CLI agent 或 MCP tool 再读写同一批文件。（来源：demo-vault-v2/25q2-laputa-v2.md；src-tauri/src/vault/mod.rs；src/utils/ai-context.ts）\n\n```mermaid\nflowchart TD\n  A[Markdown vault] --> B[Rust 扫描]\n  B --> C[VaultEntry 列表]\n  C --> D[React 四栏 UI]\n  D --> E[AI context JSON]\n  E --> F[CLI agent 适配器]\n  F --> G[MCP tools]\n  G --> H[读写 active vault]\n  H --> A\n  D --> I[UI WebSocket 桥]\n  G --> I\n```\n\n关键点：MCP 的 `create_note` 不覆盖已有文件，fallback 内容会写成 `type: \"Project\"` 加 H1；多 vault 同名路径会报 ambiguous，要求传 `vaultPath`。（来源：mcp-server/tool-service.test.js）\n\n```bash\npnpm install\npnpm tauri dev\n```\n这是真桌面开发入口；浏览器 mock 用 `pnpm dev`，不覆盖 Tauri/Rust/MCP 全路径。（来源：README Quick start；docs/GETTING-STARTED Quick Start）"
  reusable_abstractions:
    summary: ""
    body_md: "最可复用的是“让普通文件变成 agent 可操作对象”的边界设计，不是 UI 组件本身。"
    items:
      - name: "VaultEntry 作为文件图谱投影"
        copy: "把 Markdown 文件解析成统一 entry：path、title、type、relationships、outgoingLinks、fileKind、workspace provenance。"
        skip: "如果你的应用数据本来在数据库里，没必要绕回文件投影。"
        why_it_matters: "Agent 不需要理解每个用户的文件夹习惯，只需要读一个稳定的图谱接口。（来源：docs/ABSTRACTIONS VaultEntry；src-tauri/src/vault/mod.rs）"
      - name: "持久外部 MCP 配置不写 vault path"
        copy: "外部 config 只保留 stdio command、index.js、`WS_UI_PORT=9711`；active vault 在工具调用时解析。"
        skip: "如果你的 MCP server 是单项目固定路径，动态解析会增加复杂度。"
        why_it_matters: "减少切 vault 时把第三方工具悄悄指向旧路径的风险。（来源：src-tauri/src/mcp.rs build_mcp_entry；tests/smoke/mcp-config-copy.spec.ts）"
      - name: "Adapter-specific permission mapping"
        copy: "UI 只暴露 Safe/Power User，底层按 Claude/Codex/OpenCode/Gemini 各自 CLI 参数映射。"
        skip: "如果只集成一个 agent，先用原生权限模型更简单。"
        why_it_matters: "多 agent 产品不能假装权限语义一致；Tolaria 用 ADR 和测试把差异写死。（来源：docs/adr/0103；src-tauri/src/codex_cli.rs；src-tauri/src/gemini_config.rs）"
      - name: "Git-backed disposable cache"
        copy: "cache 存在 `~/.laputa/cache/<vault-hash>.json`，按 HEAD、diff、uncommitted files 增量刷新；cache version 变更强制重扫。"
        skip: "小数据量或无 Git 场景可先用全量扫描。"
        why_it_matters: "本地优先 AI 应用经常被大文件夹拖慢；这套模式把“快启动”和“磁盘为真”分开。（来源：docs/adr/0014；src-tauri/src/vault/cache.rs）"
      - name: "直接模型只给窄工具"
        copy: "OpenAI-compatible 模型只有 active vault 存在时才拿到 `create_note` 工具，且 unsupported tool 会先拒绝。"
        skip: "需要复杂文件编辑时，直接用 CLI agent/MCP 更合适。"
        why_it_matters: "给 hosted model 一个窄 create-only 能力，比开放本地 shell 更容易解释和审计。（来源：src-tauri/src/ai_model_tools.rs）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险来自桌面跨平台、外部 CLI、MCP runtime 和许可证，而不是模型算法。"
    items:
      - dependency: "Tauri v2 + Rust backend"
        what_if_change: "Tauri 插件、WebView、平台权限变化会影响窗口、asset protocol、updater、deep link。"
        exposure: "high"
        mitigation_or_unknown: "项目锁定 Tauri 2.10.0，且有 tauri.conf CSP、capabilities、平台 release workflow；未实际运行本地构建验证。"
        source: "package.json dependencies；src-tauri/Cargo.toml；src-tauri/tauri.conf.json"
      - dependency: "Node.js 18+ / Bun 1+ for MCP"
        what_if_change: "外部 AI 工具无法启动 MCP server，Codex adapter 还要求 Node。"
        exposure: "high"
        mitigation_or_unknown: "src-tauri/src/mcp.rs 优先找 Node，再找 Bun；Codex 走 `find_node()`，不走 Bun fallback。"
        source: "src-tauri/src/mcp.rs find_mcp_runtime/find_node；docs/GETTING-STARTED Starter Vaults And Remotes"
      - dependency: "Claude Code/Codex/OpenCode/Pi/Gemini/Kiro CLI"
        what_if_change: "CLI 参数、JSON event schema、权限开关变化会破坏 adapter。"
        exposure: "high"
        mitigation_or_unknown: "有 per-agent adapter 和事件映射测试；仍需要跟随外部 CLI 版本持续维护。"
        source: "src-tauri/src/ai_agents.rs；src-tauri/src/codex_cli.rs；src-tauri/src/gemini_cli.rs"
      - dependency: "Git CLI and remotes"
        what_if_change: "认证、冲突、远端策略失败会影响 sync/history/AutoGit，但不会阻止普通 Markdown 浏览编辑。"
        exposure: "medium"
        mitigation_or_unknown: "ADR-0085 支持 non-git mode；Git 功能被 capability-gated。"
        source: "docs/adr/0085-non-git-vault-support.md；docs/ABSTRACTIONS Vault Git Capability"
      - dependency: "AGPL-3.0-or-later"
        what_if_change: "商用闭源嵌入或 SaaS 分发需要合规评估。"
        exposure: "medium"
        mitigation_or_unknown: "许可证已在 package.json、Cargo.toml、LICENSE 中声明；法律合规未在仓库文档展开。"
        source: "package.json license；src-tauri/Cargo.toml license；LICENSE"
      - dependency: "PostHog/Sentry opt-in telemetry"
        what_if_change: "企业环境可能禁用外部 telemetry；若误采集路径/标题会形成隐私风险。"
        exposure: "low"
        mitigation_or_unknown: "文档称 opt-in，payload 不含 vault 内容/路径；源码里有 settings 与 scrubber，但未做流量审计。"
        source: "docs/ARCHITECTURE Telemetry；src-tauri/src/telemetry.rs"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点在 README/docs/tree 里没有足够证据，不能当事实写。"
    items:
      - "未运行 `pnpm tauri dev` 或安装 release，实际桌面可用性、MCP bridge 端口冲突、CLI 登录状态未验证。"
      - "README/ADR 提到 10,000+ 或 9000+ notes 使用场景，但未找到公开 benchmark、测试机器、启动耗时数据。"
      - "未在仓库内找到稳定版 release 验收报告；本地 tag 显示 alpha 频繁发布，稳定渠道成熟度仍需用 GitHub Releases/安装包实测确认。"
      - "直接模型 provider 的能力 catalog 有 streaming/tools/vision 字段，但 `ai_models.rs` 的 OpenAI-compatible payload 是 `stream: false`；真实流式能力未确认。"
      - "MCP ADR-0011 旧文档写过 14 tools 和自动注册；当前源码 TOOLS 是 8 个，ADR-0074 已把自动注册改成显式 setup。读旧 ADR 时要看 superseding/后续 ADR。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 4
      工程深度: 5
      复用价值: 4
      成熟度: 3
    body_md: "建议抽模式，不建议直接押生产。它对 AI 应用工程的价值在“本地知识库 + MCP + CLI adapter + 权限模式 + Git cache”的组合设计；如果你在做 agent 工作区、AI 知识库、企业本地文档工具，值得 clone-and-run。若只是找成熟笔记软件，Obsidian/Logseq/Anytype 更稳；若只是找 agent framework，Tolaria 太产品化。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\refactoringhq-tolaria\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\refactoringhq-tolaria\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\refactoringhq-tolaria\\codex-last-message.json"
  invoked_at: "2026-06-09T00:58:10.453Z"
  completed_at: "2026-06-09T01:04:13.960Z"
  repo: "refactoringhq/tolaria"
reasoning_trace:
  paper_type_decision: "project_type = ai_app; evidence from README/artifactAudit only."
  central_contribution: "Desktop app to manage markdown knowledge bases"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "本地文件优先、无导出锁定"
    - "Git-first，但非 Git vault 也可打开"
    - "AI-first but not AI-only"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "package.json dependencies；src-tauri/Cargo.toml；src-tauri/tauri.conf.json"
    - "src-tauri/src/mcp.rs find_mcp_runtime/find_node；docs/GETTING-STARTED Starter Vaults And Remotes"
    - "src-tauri/src/ai_agents.rs；src-tauri/src/codex_cli.rs；src-tauri/src/gemini_cli.rs"
    - "docs/adr/0085-non-git-vault-support.md；docs/ABSTRACTIONS Vault Git Capability"
    - "package.json license；src-tauri/Cargo.toml license；LICENSE"
    - "docs/ARCHITECTURE Telemetry；src-tauri/src/telemetry.rs"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 4
  engineering_depth: 5
  reuse_value: 4
  maturity: 3
  main_risk: "建议抽模式，不建议直接押生产。它对 AI 应用工程的价值在“本地知识库 + MCP + CLI adapter + 权限模式 + Git cache”的组合设计；如果你在做 agent 工作区、AI 知识库、企业本地文档工具，值得 clone-and-run。若只是找成熟笔记软件，Obsidian/Logseq/Anytype 更稳；若只是找 agent framework，Tolaria 太产品化。"
next_actions:
  - "extract-pattern"
unknowns:
  - "未运行 `pnpm tauri dev` 或安装 release，实际桌面可用性、MCP bridge 端口冲突、CLI 登录状态未验证。"
  - "README/ADR 提到 10,000+ 或 9000+ notes 使用场景，但未找到公开 benchmark、测试机器、启动耗时数据。"
  - "未在仓库内找到稳定版 release 验收报告；本地 tag 显示 alpha 频繁发布，稳定渠道成熟度仍需用 GitHub Releases/安装包实测确认。"
  - "直接模型 provider 的能力 catalog 有 streaming/tools/vision 字段，但 `ai_models.rs` 的 OpenAI-compatible payload 是 `stream: false`；真实流式能力未确认。"
  - "MCP ADR-0011 旧文档写过 14 tools 和自动注册；当前源码 TOOLS 是 8 个，ADR-0074 已把自动注册改成显式 setup。读旧 ADR 时要看 superseding/后续 ADR。"
builder_reuse:
  pattern: "VaultEntry 作为文件图谱投影"
  copy: "把 Markdown 文件解析成统一 entry：path、title、type、relationships、outgoingLinks、fileKind、workspace provenance。"
  skip: "如果你的应用数据本来在数据库里，没必要绕回文件投影。"
  why_it_matters: "Agent 不需要理解每个用户的文件夹习惯，只需要读一个稳定的图谱接口。（来源：docs/ABSTRACTIONS VaultEntry；src-tauri/src/vault/mod.rs）"
dependency_platform_risk:
  dependency: "Tauri v2 + Rust backend"
  what_if_change: "Tauri 插件、WebView、平台权限变化会影响窗口、asset protocol、updater、deep link。"
  exposure: "high"
  mitigation_or_unknown: "项目锁定 Tauri 2.10.0，且有 tauri.conf CSP、capabilities、平台 release workflow；未实际运行本地构建验证。"
claim_ledger:
  - claim: "本地文件优先、无导出锁定"
    plain_english: "笔记是普通 `.md` 文件，YAML frontmatter 承载 `type`、`status`、关系等字段；解析入口是 Rust 的 `parse_md_file()`。"
    source: "README Principles；src-tauri/src/vault/mod.rs parse_md_file；docs/ABSTRACTIONS Document Model"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`parse_md_file()` 读取磁盘文件、解析 YAML frontmatter、提取 H1、wikilinks、word_count、file_kind。"
    does_not_support: "不证明所有 Markdown 扩展都能无损往返；编辑器序列化仍依赖 BlockNote/CodeMirror 适配。"
    threat: "富文本编辑器、Mermaid、tldraw、PDF/媒体预览会引入应用层约定；跨工具无损需要逐项验证。"
  - claim: "Git-first，但非 Git vault 也可打开"
    plain_english: "Git 是同步/历史能力，不再是打开 vault 的硬门槛；非 Git 模式隐藏 commit/sync 等功能。"
    source: "docs/adr/0085-non-git-vault-support.md；docs/ABSTRACTIONS Vault Git Capability"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "ADR-0085 明确 plain folder 可浏览、编辑、搜索；Git 初始化通过显式命令启用。"
    does_not_support: "不证明非 Git 模式在大 vault 下性能等同 Git-backed cache。"
    threat: "团队协作仍依赖用户自己的 Git 远端和认证；冲突体验要按真实仓库测试。"
  - claim: "AI-first but not AI-only"
    plain_english: "AI 不是强绑定云服务；应用可用 CLI agents，也能配置 API/local model provider。"
    source: "README Principles；src/lib/aiAgents.ts；src/shared/aiModelProviderCatalog.json；src-tauri/src/ai_models.rs"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "agent 列表含 6 个 CLI；provider catalog 含 OpenAI/Anthropic/Gemini/OpenRouter/Ollama/LM Studio/custom provider。"
    does_not_support: "不证明每个 provider 的流式、工具调用、视觉能力都已完整实现。"
    threat: "`ai_models.rs` 当前 OpenAI-compatible 请求使用 `stream: false` 后再发 TextDelta，和真正 token streaming 不同。"
  - claim: "MCP 让外部 AI 工具操作 vault"
    plain_english: "MCP server 是 Node stdio server；工具调用时从 `VAULT_PATH`、`VAULT_PATHS` 或 app 的 `vaults.json` 解析 active vault。"
    source: "mcp-server/index.js；mcp-server/vault-path.js；mcp-server/tool-service.js；tests/smoke/mcp-config-copy.spec.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "copy config 测试要求 `mcpServers.tolaria.type=stdio`、`env.WS_UI_PORT=9711`，且不写 `VAULT_PATH` 到持久外部配置。"
    does_not_support: "不证明所有 MCP client 都兼容；只证明代码生成标准片段并覆盖部分 UI 测试。"
    threat: "运行时依赖 Node.js 18+ 或 Bun 1+；Linux AppImage 还有稳定路径抽取逻辑，部署面较宽。"
  - claim: "Vault Safe / Power User 权限模型"
    plain_english: "同一个 UI 模式按 adapter 映射成不同 CLI 参数：Codex Safe 是 read-only + untrusted，Power User 是 workspace-write + never。"
    source: "src-tauri/src/codex_cli.rs codex_sandbox/codex_approval_policy；src-tauri/src/gemini_config.rs approval_mode；docs/adr/0103-adapter-specific-ai-permission-semantics.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "Codex 明确禁止 dangerous bypass；Gemini Safe 排除 `run_shell_command`，Power User 映射 `yolo`。"
    does_not_support: "不等于统一安全语义；不同 CLI 的权限粒度不同。"
    threat: "Power User 仍会放大本地写入/命令风险；每个 adapter 升级后都需要重测。"
  - claim: "作者自称可承载 10,000+ notes"
    plain_english: "README 说作者用一个 10,000+ notes 的 workspace；ADR-0014 提到 9000+ Markdown 文件扫描痛点。"
    source: "README intro；docs/adr/0014-git-based-vault-cache.md"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "源码有 Git-based cache、cache version、同 HEAD 增量更新、untracked file 覆盖测试。"
    does_not_support: "没有公开 benchmark、机器配置、P95 启动耗时。"
    threat: "大 vault 性能需要用自己的笔记数量、文件大小、Git 状态和平台复测。"
artifact_audit:
  official_repo: "https://github.com/refactoringhq/tolaria"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "AGPL-3.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

refactoringhq/tolaria：GitHub 描述为“Desktop app to manage markdown knowledge bases”。

（来源：README/artifactAudit）

## 干什么

Desktop app to manage markdown knowledge bases

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 13556 |
| stars_in_period | 649 |
| author | refactoringhq |

## 标签

- Tier 2（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

值得看的是它把“知识库即上下文”做成了产品级工作流：Markdown/YAML 是源数据，Git 是版本与同步层，AI 通过 CLI agent 或 MCP 进入同一套 vault。对做 AI 应用的人，重点不是 UI，而是如何让本地文件、权限、上下文截断、多工作区和外部 agent 协作不打架。（来源：docs/ARCHITECTURE Design Principles；docs/adr/0062-selectable-cli-ai-agents.md；docs/adr/0074-explicit-external-ai-tool-setup-and-least-privilege-desktop-scope.md）

## 核心能力

- VaultEntry 作为文件图谱投影（来源：数据不足）
- 持久外部 MCP 配置不写 vault path（来源：数据不足）
- Adapter-specific permission mapping（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，Tolaria 的差异不在“能写 Markdown”，而在“把 vault 设计成 AI agent 工作区”。 Obsidian：官方文档把 vault 定义为本地文件夹，Sync 是可选远端同步服务（来源：https://obsidian.md/help/Obsidian%2BSync/Local%2Band%2Bremote%2Bvaults）。选 Obsidian：插件生态、成熟笔记体验优先。选 Tolaria：想把 Git、MCP、CLI agent 权限、AGENTS.md 指南作为一等产品能力；代价是生态和成熟度不如 Obsidian。 Logseq：官方 docs 强调 graph、Markdown 文件、block/page references（来源：https://docs.logseq.com/）。选 Logseq：大纲式块编辑、双链图谱、学习曲线能接受。选 Tolaria：更偏文件级 Markdown、Git 版本工作流、外部 agent 读写 vault；代价是块级知识模型不是主轴。 Anytype：官方 docs 自称 encrypted local-first、对象空间和 AnySync（来源：https://doc.anytype.io/anytype-docs）。选 Anytype：端到端加密对象库、同步协作优先。选 Tolaria：希望数据保持普通 Markdown/YAML/Git、能被 CLI 和 MCP 工具直接理解；代价是协作/加密同步不是内置核心。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

可复用范式落库:[[concepts/markdown-vault]]、[[concepts/mcp-vault-tools]]。另见 [[content/refactoringhq-tolaria]]、[[claims/refactoringhq-tolaria-main-claim]]。
