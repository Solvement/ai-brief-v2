---
content: "ogulcancelik-herdr"
kind: "deep-dive"
schema_version: "project-light-spine/v1"
shape: "howto-use"
project_type: "devtool_cli"
title: "herdr — 深度拆解"
light_spine:
  schema_version: "project-light-spine/v1"
  one_sentence:
    summary: "Herdr 是一个面向 AI coding agents 的 Rust 终端复用器，用 workspace/tab/pane、后台 session server、agent 状态识别和本地 socket API，把多个终端里的 agent 工作流放在一个 TUI 里管理。"
    body_md: "人话：它更像“给 AI agent 用的 tmux + 状态看板”，不是一个替你调用模型的 agent 框架。你在终端里开多个 pane 跑 Claude Code、Codex、Copilot CLI 等工具，Herdr 负责保活、切换、拆分、读取输出、等待状态、远程 attach。术语：terminal multiplexer 指把多个终端会话组织在一个界面里；agent awareness 指从进程、屏幕文本或 hook/plugin 上报中判断 agent 是 working、blocked、done、idle。项目 Cargo 描述为“terminal workspace manager for AI coding agents”，版本为 0.6.7。（来源：Cargo.toml package）"
  why_worth_attention:
    summary: ""
    body_md: "人话：Herdr 的价值不在模型能力，而在“多 agent 并行工作时怎么不丢现场、怎么知道谁卡住、怎么让脚本或 agent 控制终端布局”。这类问题在 AI coding workflow 里很实际。术语：它提供 CLI wrapper 和 raw socket API；raw socket API 使用 Unix domain socket 上的 newline-delimited JSON；官方集成可以提供 session identity 或 semantic state report。（来源：docs/next/website/src/content/docs/socket-api.mdx Socket transport；docs/next/website/src/content/docs/integrations.mdx How Herdr uses integrations）"
    bullets:
      - "已核实：源码树包含 Rust TUI/PTY/API/session/integration/detect 模块，以及 tests 目录；这不是只有 README 的概念项目。（来源：src/ tree；tests/ tree）"
      - "已核实：CLI 子命令覆盖 server、workspace、worktree、tab、agent、terminal、pane、wait、integration、session。（来源：src/cli.rs maybe_run）"
      - "自称：README 说 pane processes survive client detach，server restart 后恢复 session shape 但不保留任意旧进程；docs 对 detach、snapshot restore、native agent session restore、live handoff 做了边界说明。（来源：README What you get；docs/session-state.mdx What Survives）"
      - "已核实：SKILL.md 是给 agent 的可复用指令文件，要求先检查 HERDR_ENV=1，再通过 herdr CLI 控制同一个 Herdr session。（来源：SKILL.md；docs/agent-skill.mdx Safety rule）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：README 的强卖点要分开看。能从源码/配置确认的是 Rust CLI、socket method schema、agent 检测模块、集成安装资产、许可和文档；“体验更好”“single binary”“支持多少 agent”的实际效果仍依赖运行环境和各 agent UI 变化。术语：evidence_strength high 表示仓库源码或 docs 明确存在；medium 表示 README/docs 自称且有部分源码结构支撑；low 表示未运行验证。"
    items:
      - claim: "Herdr 是面向 AI coding agents 的终端 workspace manager。"
        plain_english: "它管理终端里的 agent 进程和布局，而不是自己实现 LLM agent loop。"
        source: "Cargo.toml package；README opening"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Cargo.toml description 写明“terminal workspace manager for AI coding agents”；源码包含 src/pty、src/ui、src/session、src/detect、src/integration。"
        does_not_support: "没有证明它是模型推理框架、RAG 框架或多 agent 调度器核心。"
        threat: "项目定位容易被 radar 标签误读为 agent_framework。"
      - claim: "Herdr 提供 workspace、tab、pane，并且 pane 是真实 terminal processes。"
        plain_english: "它不是重画 agent UI，而是在真实终端里托管 shell/agent/server/test 进程。"
        source: "README core concepts；docs/concepts.mdx；src/workspace.rs；src/pane.rs；src/pty/"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 明确说 panes are real terminal processes；源码有 workspace、pane、pty backend/actor。"
        does_not_support: "未在本机运行 UI 验证交互体验。"
        threat: "不同终端、SSH、tmux、mouse protocol 对实际体验有影响。"
      - claim: "本地 Unix socket 可让 agents/scripts 创建 workspace、拆 pane、读输出、等待状态。"
        plain_english: "外部脚本或 pane 内 agent 可以通过 CLI 或 socket 控制 Herdr。"
        source: "README agents can use herdr too；docs/socket-api.mdx What you can control；src/api/schema.rs Method"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 列出 workspace/tab/pane/agent/events/integration 方法；src/api/schema.rs 定义对应 Method enum。"
        does_not_support: "未证明所有 API 在当前 OS 上都能成功执行。"
        threat: "API 操作依赖已有运行中的 Herdr server 和 Unix socket；Windows 原生不支持。"
      - claim: "自动 agent detection 支持 Pi、Claude Code、Codex、Droid、Amp、OpenCode、Grok CLI、Hermes Agent、Kilo Code CLI、Cursor Agent、Antigravity CLI、Kimi Code CLI、Kiro CLI、GitHub Copilot CLI、Qoder CLI；Gemini CLI 和 Cline 是 detected but less thoroughly tested。"
        plain_english: "README/docs 说它能识别多种 coding agent 的 idle/working/blocked 状态，但覆盖质量按 agent 不同。"
        source: "README supported agents；docs/agents.mdx Supported agents；src/detect/agents/mod.rs；src/detect/mod.rs Agent enum"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "docs 有支持矩阵；源码有对应 detect 模块和 Agent enum。"
        does_not_support: "未实测这些外部 agent 的最新 UI；README/docs 的支持矩阵仍是项目自称。"
        threat: "agent CLI UI 改版会让 screen heuristics 失效。"
      - claim: "官方集成分工不同：Claude Code、Codex、OpenCode 提供 session identity；Pi、GitHub Copilot CLI、Hermes Agent 提供 semantic state 和 session identity；OMP、Qoder CLI 提供 state 但不提供 native session restore。"
        plain_english: "不是所有集成都能恢复对话；有的只上报状态，有的只上报会话身份。"
        source: "docs/integrations.mdx How Herdr uses integrations；src/integration/mod.rs constants"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 明确区分三类信号；src/integration/mod.rs 含各集成安装资产、环境变量和版本常量，如 CODEX_INTEGRATION_VERSION=5。"
        does_not_support: "未验证第三方 agent hook/plugin 当前仍兼容。"
        threat: "外部 agent 配置目录、hook 格式和 resume 命令变化会破坏集成。"
      - claim: "Herdr ships as a single binary for Linux and macOS；Native Windows support is not available yet；use WSL for now。"
        plain_english: "官方文档说它主要面向 Linux/macOS，Windows 用户走 WSL。"
        source: "docs/install.mdx Install；docs/install.mdx Requirements"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "docs/install.mdx 列出 Linux x86_64、Linux aarch64、macOS Intel、macOS Apple silicon assets；Cargo 项目是 Rust。"
        does_not_support: "本机没有 cargo，未编译或运行 release binary。"
        threat: "平台可用性要以 release asset 和目标终端能力为准。"
      - claim: "Herdr 是 AGPL-3.0-or-later，同时提供商业许可。"
        plain_english: "开源使用要注意 AGPL；不能遵守 AGPL 的组织可联系商业许可。"
        source: "Cargo.toml license；LICENSE header；README license"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Cargo.toml license 为 AGPL-3.0-or-later；LICENSE 开头写 dual-licensed，商业许可联系 hey@herdr.dev。"
        does_not_support: "未说明商业许可条款价格或范围。"
        threat: "将它嵌入闭源网络服务或分发改版时需要法律审查。"
  how_it_works:
    summary: ""
    body_md: "人话：Herdr 启动后默认连到一个后台 server；client 可以 detach，server 继续托管 pane 进程。界面上把项目组织成 workspaces，workspace 里有 tabs，tab 里有 panes。agent 状态来自三路信号：前台进程识别、终端屏幕启发式、hook/plugin/socket 上报。agent 或脚本优先用 CLI wrapper；需要长连接或精细控制时才用 raw socket。术语：Unix domain socket 是本机进程通信通道；newline-delimited JSON 是一行一个 JSON request/response；semantic state 是影响 wait、notification、rollup 的状态字段，不等同于 UI 上的 custom_status。（来源：README core concepts；docs/socket-api.mdx Choose an integration layer / Socket transport / Agent state reporting；docs/integrations.mdx How Herdr uses integrations）"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最值得复用的不是 TUI 皮肤，而是“终端真实进程 + 可脚本化控制面 + 状态上报协议”的组合。术语：control plane 是让外部工具操作系统的 API；rollup 是把 pane 状态汇总到 tab/workspace。"
    items:
      - name: "CLI-first socket API"
        copy: "先给人和脚本提供 CLI wrapper，再把同一能力暴露为 raw socket method；docs 也建议大多数自动化先用 CLI。"
        skip: "不要一开始只设计 raw protocol，否则用户和 agent 都要自己拼 JSON。"
        why_it_matters: "CLI examples、SKILL.md 和 socket schema 共享控制面，降低 agent 使用门槛。（来源：docs/socket-api.mdx Choose an integration layer；src/api/schema.rs Method）"
      - name: "Agent state authority split"
        copy: "把进程识别、屏幕启发式、integration event 分开，并区分 lifecycle state 与 display-only metadata。"
        skip: "不要让任意 hook 覆盖所有状态，否则 stale hook 会让 UI 和 wait 逻辑失真。"
        why_it_matters: "docs 说明 metadata 是 display-only，semantic state 才影响 waits、notifications、rollups。（来源：docs/integrations.mdx Custom status labels；docs/socket-api.mdx Agent state reporting）"
      - name: "Session restore matrix"
        copy: "把 detach、server restart、pane history replay、native agent session restore、live handoff 的保真度写成明确矩阵。"
        skip: "不要笼统宣传“持久化”，因为进程保活、布局恢复、屏幕历史、agent 对话恢复是不同问题。"
        why_it_matters: "docs/session-state.mdx 明确 server restart 不保留任意运行中 shells/servers/tests，避免用户误解。（来源：docs/session-state.mdx Live persistence / Snapshot restore / What Survives）"
      - name: "Agent skill guardrail"
        copy: "让 agent 指令文件先检查 HERDR_ENV=1，只有在 Herdr-managed pane 内才允许控制 session。"
        skip: "不要让外部 agent 盲目操控用户当前 Herdr pane。"
        why_it_matters: "这是最小但实用的权限边界，适合所有“agent 控制宿主工具”的设计。（来源：SKILL.md；docs/agent-skill.mdx Safety rule）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：Herdr 的风险主要来自终端生态和外部 agent CLI，而不是云 API。只要 agent UI 文案、hook 配置或终端协议变了，状态识别和交互体验就会受影响。术语：PTY 是伪终端；screen heuristic 是从屏幕文本推断状态。"
    items:
      - dependency: "外部 agent CLI 的屏幕 UI 和 hook/plugin 格式"
        what_if_change: "Claude Code、Codex、OpenCode 等 UI 文案或 hook/session 格式变化，会影响 blocked/working/idle 推断或 native session restore。"
        exposure: "high"
        mitigation_or_unknown: "源码含各 agent detect 模块和大量 detection 测试样例，但未证明能覆盖未来版本 UI。（来源：src/detect/agents/；src/detect/mod.rs tests；docs/integrations.mdx How Herdr uses integrations）"
        source: "src/detect/agents/mod.rs；docs/integrations.mdx"
      - dependency: "Unix domain socket 和 Linux/macOS 终端能力"
        what_if_change: "原生 Windows 不支持会限制使用；SSH、tmux、mouse protocol、clipboard、notifications 在不同终端表现不同。"
        exposure: "medium"
        mitigation_or_unknown: "docs 要求 Windows 用 WSL；配置文档列出通知、声音、mouse capture、remote keepalive 等选项。（来源：docs/install.mdx Requirements；docs/configuration.mdx UI and sidebar / Notifications / Sound）"
        source: "docs/install.mdx；docs/configuration.mdx"
      - dependency: "AGPL-3.0-or-later / 商业许可"
        what_if_change: "组织如果不能接受 AGPL 分发或网络服务义务，需要商业许可或避免集成。"
        exposure: "medium"
        mitigation_or_unknown: "LICENSE 写明 dual-licensed，商业许可联系 hey@herdr.dev；具体商业条款未知。"
        source: "LICENSE header；Cargo.toml license"
      - dependency: "Rust toolchain"
        what_if_change: "本地没有 cargo 时无法从源码构建或运行测试。"
        exposure: "low"
        mitigation_or_unknown: "README development 使用 cargo build --release；本次检查环境中 cargo 未安装，未完成本地测试。"
        source: "README development；本次 shell: cargo command not found"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：仓库证据足以判断设计方向，但不足以证明它在你的终端和你的 agent 组合里稳定好用。术语：以下都是 README/docs/tree 未能完全证明的运行态事实。"
    items:
      - "本机未跑通 cargo test：当前 PowerShell 找不到 cargo，因此 runnable 未做源码级验证。"
      - "未验证 release binary、Homebrew、mise、Nix 安装链路。"
      - "未实测 supported agents 表中每个 agent 的最新 CLI UI 和 hook/plugin 是否仍兼容。"
      - "未验证 remote attach、live handoff、desktop notification、sound、clipboard 在 Linux/macOS/WSL/SSH/tmux 的组合表现。"
      - "商业许可的价格、限制和适用范围未在 README/docs/tree 说明。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 5
      成熟度: 3
    body_md: "人话：值得 AI 工程师关注，尤其是已经在一个项目里并行跑多个 coding agent、测试、server、日志的人。下一步不是读营销表格，而是在 Linux/macOS 或 WSL 里装 binary，开两个真实 agent pane，验证 detach/reattach、blocked/done 识别、pane read/wait、integration status。术语：我给成熟度 3，是因为 changelog 到 0.6.7 很活跃、测试和 docs 丰富，但 agent screen heuristic 和 live handoff 这类能力天然依赖外部环境，且本次未能本地编译测试。（来源：CHANGELOG.md 0.6.7；docs/session-state.mdx Live handoff；本次 cargo 不可用）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "medium"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"medium\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-p2p-20260603-authoring\\\\ogulcancelik-herdr\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-p2p-20260603-authoring\\ogulcancelik-herdr\\prompt.md"
  raw_response: "logs\\codex-deepdive-p2p-20260603-authoring\\ogulcancelik-herdr\\codex-last-message.json"
  invoked_at: "2026-06-03T21:33:12.281Z"
  completed_at: "2026-06-03T21:38:20.256Z"
  repo: "ogulcancelik/herdr"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "agent multiplexer that lives in your terminal."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "Herdr 是面向 AI coding agents 的终端 workspace manager。"
    - "Herdr 提供 workspace、tab、pane，并且 pane 是真实 terminal processes。"
    - "本地 Unix socket 可让 agents/scripts 创建 workspace、拆 pane、读输出、等待状态。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "src/detect/agents/mod.rs；docs/integrations.mdx"
    - "docs/install.mdx；docs/configuration.mdx"
    - "LICENSE header；Cargo.toml license"
    - "README development；本次 shell: cargo command not found"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 5
  maturity: 3
  main_risk: "人话：值得 AI 工程师关注，尤其是已经在一个项目里并行跑多个 coding agent、测试、server、日志的人。下一步不是读营销表格，而是在 Linux/macOS 或 WSL 里装 binary，开两个真实 agent pane，验证 detach/reattach、blocked/done 识别、pane read/wait、integration status。术语：我给成熟度 3，是因为 changelog 到 0.6.7 很活跃、测试和 docs 丰富，但 agent screen heuristic 和 live handoff 这类能力天然依赖外部环境，且本次未能本地编译测试。（来源：CHANGELOG.md 0.6.7；docs/session-state.mdx Live handoff；本次 cargo 不可用）"
next_actions:
  - "clone-and-run"
unknowns:
  - "本机未跑通 cargo test：当前 PowerShell 找不到 cargo，因此 runnable 未做源码级验证。"
  - "未验证 release binary、Homebrew、mise、Nix 安装链路。"
  - "未实测 supported agents 表中每个 agent 的最新 CLI UI 和 hook/plugin 是否仍兼容。"
  - "未验证 remote attach、live handoff、desktop notification、sound、clipboard 在 Linux/macOS/WSL/SSH/tmux 的组合表现。"
  - "商业许可的价格、限制和适用范围未在 README/docs/tree 说明。"
builder_reuse:
  pattern: "CLI-first socket API"
  copy: "先给人和脚本提供 CLI wrapper，再把同一能力暴露为 raw socket method；docs 也建议大多数自动化先用 CLI。"
  skip: "不要一开始只设计 raw protocol，否则用户和 agent 都要自己拼 JSON。"
  why_it_matters: "CLI examples、SKILL.md 和 socket schema 共享控制面，降低 agent 使用门槛。（来源：docs/socket-api.mdx Choose an integration layer；src/api/schema.rs Method）"
dependency_platform_risk:
  dependency: "外部 agent CLI 的屏幕 UI 和 hook/plugin 格式"
  what_if_change: "Claude Code、Codex、OpenCode 等 UI 文案或 hook/session 格式变化，会影响 blocked/working/idle 推断或 native session restore。"
  exposure: "high"
  mitigation_or_unknown: "源码含各 agent detect 模块和大量 detection 测试样例，但未证明能覆盖未来版本 UI。（来源：src/detect/agents/；src/detect/mod.rs tests；docs/integrations.mdx How Herdr uses integrations）"
claim_ledger:
  - claim: "Herdr 是面向 AI coding agents 的终端 workspace manager。"
    plain_english: "它管理终端里的 agent 进程和布局，而不是自己实现 LLM agent loop。"
    source: "Cargo.toml package；README opening"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "Cargo.toml description 写明“terminal workspace manager for AI coding agents”；源码包含 src/pty、src/ui、src/session、src/detect、src/integration。"
    does_not_support: "没有证明它是模型推理框架、RAG 框架或多 agent 调度器核心。"
    threat: "项目定位容易被 radar 标签误读为 agent_framework。"
  - claim: "Herdr 提供 workspace、tab、pane，并且 pane 是真实 terminal processes。"
    plain_english: "它不是重画 agent UI，而是在真实终端里托管 shell/agent/server/test 进程。"
    source: "README core concepts；docs/concepts.mdx；src/workspace.rs；src/pane.rs；src/pty/"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 明确说 panes are real terminal processes；源码有 workspace、pane、pty backend/actor。"
    does_not_support: "未在本机运行 UI 验证交互体验。"
    threat: "不同终端、SSH、tmux、mouse protocol 对实际体验有影响。"
  - claim: "本地 Unix socket 可让 agents/scripts 创建 workspace、拆 pane、读输出、等待状态。"
    plain_english: "外部脚本或 pane 内 agent 可以通过 CLI 或 socket 控制 Herdr。"
    source: "README agents can use herdr too；docs/socket-api.mdx What you can control；src/api/schema.rs Method"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "docs 列出 workspace/tab/pane/agent/events/integration 方法；src/api/schema.rs 定义对应 Method enum。"
    does_not_support: "未证明所有 API 在当前 OS 上都能成功执行。"
    threat: "API 操作依赖已有运行中的 Herdr server 和 Unix socket；Windows 原生不支持。"
  - claim: "自动 agent detection 支持 Pi、Claude Code、Codex、Droid、Amp、OpenCode、Grok CLI、Hermes Agent、Kilo Code CLI、Cursor Agent、Antigravity CLI、Kimi Code CLI、Kiro CLI、GitHub Copilot CLI、Qoder CLI；Gemini CLI 和 Cline 是 detected but less thoroughly tested。"
    plain_english: "README/docs 说它能识别多种 coding agent 的 idle/working/blocked 状态，但覆盖质量按 agent 不同。"
    source: "README supported agents；docs/agents.mdx Supported agents；src/detect/agents/mod.rs；src/detect/mod.rs Agent enum"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "docs 有支持矩阵；源码有对应 detect 模块和 Agent enum。"
    does_not_support: "未实测这些外部 agent 的最新 UI；README/docs 的支持矩阵仍是项目自称。"
    threat: "agent CLI UI 改版会让 screen heuristics 失效。"
  - claim: "官方集成分工不同：Claude Code、Codex、OpenCode 提供 session identity；Pi、GitHub Copilot CLI、Hermes Agent 提供 semantic state 和 session identity；OMP、Qoder CLI 提供 state 但不提供 native session restore。"
    plain_english: "不是所有集成都能恢复对话；有的只上报状态，有的只上报会话身份。"
    source: "docs/integrations.mdx How Herdr uses integrations；src/integration/mod.rs constants"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "docs 明确区分三类信号；src/integration/mod.rs 含各集成安装资产、环境变量和版本常量，如 CODEX_INTEGRATION_VERSION=5。"
    does_not_support: "未验证第三方 agent hook/plugin 当前仍兼容。"
    threat: "外部 agent 配置目录、hook 格式和 resume 命令变化会破坏集成。"
  - claim: "Herdr ships as a single binary for Linux and macOS；Native Windows support is not available yet；use WSL for now。"
    plain_english: "官方文档说它主要面向 Linux/macOS，Windows 用户走 WSL。"
    source: "docs/install.mdx Install；docs/install.mdx Requirements"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "docs/install.mdx 列出 Linux x86_64、Linux aarch64、macOS Intel、macOS Apple silicon assets；Cargo 项目是 Rust。"
    does_not_support: "本机没有 cargo，未编译或运行 release binary。"
    threat: "平台可用性要以 release asset 和目标终端能力为准。"
artifact_audit:
  official_repo: "https://github.com/ogulcancelik/herdr"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "NOASSERTION"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## 一句话

人话：它更像“给 AI agent 用的 tmux + 状态看板”，不是一个替你调用模型的 agent 框架。你在终端里开多个 pane 跑 Claude Code、Codex、Copilot CLI 等工具，Herdr 负责保活、切换、拆分、读取输出、等待状态、远程 attach。术语：terminal multiplexer 指把多个终端会话组织在一个界面里；agent awareness 指从进程、屏幕文本或 hook/plugin 上报中判断 agent 是 working、blocked、done、idle。项目 Cargo 描述为“terminal workspace manager for AI coding agents”，版本为 0.6.7。（来源：Cargo.toml package）

## 为什么值得看

人话：Herdr 的价值不在模型能力，而在“多 agent 并行工作时怎么不丢现场、怎么知道谁卡住、怎么让脚本或 agent 控制终端布局”。这类问题在 AI coding workflow 里很实际。术语：它提供 CLI wrapper 和 raw socket API；raw socket API 使用 Unix domain socket 上的 newline-delimited JSON；官方集成可以提供 session identity 或 semantic state report。（来源：docs/next/website/src/content/docs/socket-api.mdx Socket transport；docs/next/website/src/content/docs/integrations.mdx How Herdr uses integrations）

## 关键主张与证据

| 主张 | 大白话 | 来源 | 归因 | 强度 |
| --- | --- | --- | --- | --- |
| Herdr 是面向 AI coding agents 的终端 workspace manager。（来源：README/artifactAudit） | 它管理终端里的 agent 进程和布局，而不是自己实现 LLM agent loop。（来源：README/artifactAudit） | Cargo.toml package；README opening | 已核实 | high |
| Herdr 提供 workspace、tab、pane，并且 pane 是真实 terminal processes。（来源：README/artifactAudit） | 它不是重画 agent UI，而是在真实终端里托管 shell/agent/server/test 进程。（来源：README/artifactAudit） | README core concepts；docs/concepts.mdx；src/workspace.rs；src/pane.rs；src/pty/ | 已核实 | high |
| 本地 Unix socket 可让 agents/scripts 创建 workspace、拆 pane、读输出、等待状态。（来源：README/artifactAudit） | 外部脚本或 pane 内 agent 可以通过 CLI 或 socket 控制 Herdr。（来源：README/artifactAudit） | README agents can use herdr too；docs/socket-api.mdx What you can control；src/api/schema.rs Method | 已核实 | high |
| 自动 agent detection 支持 Pi、Claude Code、Codex、Droid、Amp、OpenCode、Grok CLI、Hermes Agent、Kilo Code CLI、Cursor Agent、Antigravity CLI、Kimi Code CLI、Kiro CLI、GitHub Copilot CLI、Qoder CLI；Gemini CLI 和 Cline 是 detected but less thoroughly tested。（来源：README/artifactAudit） | README/docs 说它能识别多种 coding agent 的 idle/working/blocked 状态，但覆盖质量按 agent 不同。（来源：README/artifactAudit） | README supported agents；docs/agents.mdx Supported agents；src/detect/agents/mod.rs；src/detect/mod.rs Agent enum | 自称 | medium |
| 官方集成分工不同：Claude Code、Codex、OpenCode 提供 session identity；Pi、GitHub Copilot CLI、Hermes Agent 提供 semantic state 和 session identity；OMP、Qoder CLI 提供 state 但不提供 native session restore。（来源：README/artifactAudit） | 不是所有集成都能恢复对话；有的只上报状态，有的只上报会话身份。（来源：README/artifactAudit） | docs/integrations.mdx How Herdr uses integrations；src/integration/mod.rs constants | 已核实 | high |
| Herdr ships as a single binary for Linux and macOS；Native Windows support is not available yet；use WSL for now。（来源：README/artifactAudit） | 官方文档说它主要面向 Linux/macOS，Windows 用户走 WSL。（来源：README/artifactAudit） | docs/install.mdx Install；docs/install.mdx Requirements | 自称 | medium |
| Herdr 是 AGPL-3.0-or-later，同时提供商业许可。（来源：README/artifactAudit） | 开源使用要注意 AGPL；不能遵守 AGPL 的组织可联系商业许可。（来源：README/artifactAudit） | Cargo.toml license；LICENSE header；README license | 已核实 | high |


人话：README 的强卖点要分开看。能从源码/配置确认的是 Rust CLI、socket method schema、agent 检测模块、集成安装资产、许可和文档；“体验更好”“single binary”“支持多少 agent”的实际效果仍依赖运行环境和各 agent UI 变化。术语：evidence_strength high 表示仓库源码或 docs 明确存在；medium 表示 README/docs 自称且有部分源码结构支撑；low 表示未运行验证。

（来源：README/artifactAudit）

## 它怎么work

人话：Herdr 启动后默认连到一个后台 server；client 可以 detach，server 继续托管 pane 进程。界面上把项目组织成 workspaces，workspace 里有 tabs，tab 里有 panes。agent 状态来自三路信号：前台进程识别、终端屏幕启发式、hook/plugin/socket 上报。agent 或脚本优先用 CLI wrapper；需要长连接或精细控制时才用 raw socket。术语：Unix domain socket 是本机进程通信通道；newline-delimited JSON 是一行一个 JSON request/response；semantic state 是影响 wait、notification、rollup 的状态字段，不等同于 UI 上的 custom_status。（来源：README core concepts；docs/socket-api.mdx Choose an integration layer / Socket transport / Agent state reporting；docs/integrations.mdx How Herdr uses integrations）

## 复用什么抽象

人话：最值得复用的不是 TUI 皮肤，而是“终端真实进程 + 可脚本化控制面 + 状态上报协议”的组合。术语：control plane 是让外部工具操作系统的 API；rollup 是把 pane 状态汇总到 tab/workspace。

（来源：README/artifactAudit）

## 依赖平台风险

人话：Herdr 的风险主要来自终端生态和外部 agent CLI，而不是云 API。只要 agent UI 文案、hook 配置或终端协议变了，状态识别和交互体验就会受影响。术语：PTY 是伪终端；screen heuristic 是从屏幕文本推断状态。

（来源：README/artifactAudit）

## 未知与待确认

人话：仓库证据足以判断设计方向，但不足以证明它在你的终端和你的 agent 组合里稳定好用。术语：以下都是 README/docs/tree 未能完全证明的运行态事实。

（来源：README/artifactAudit）

## 判断

| 项 | 值 |
| --- | --- |
| action | clone-and-run |
| 相关度 | 5/5 |
| 工程深度 | 4/5 |
| 复用价值 | 5/5 |
| 成熟度 | 3/5 |

人话：值得 AI 工程师关注，尤其是已经在一个项目里并行跑多个 coding agent、测试、server、日志的人。下一步不是读营销表格，而是在 Linux/macOS 或 WSL 里装 binary，开两个真实 agent pane，验证 detach/reattach、blocked/done 识别、pane read/wait、integration status。术语：我给成熟度 3，是因为 changelog 到 0.6.7 很活跃、测试和 docs 丰富，但 agent screen heuristic 和 live handoff 这类能力天然依赖外部环境，且本次未能本地编译测试。（来源：CHANGELOG.md 0.6.7；docs/session-state.mdx Live handoff；本次 cargo 不可用）

可复用范式落库:[[concepts/ogulcancelik-herdr-terminal-multiplexing-for-agents]]、[[concepts/ogulcancelik-herdr-agent-awareness-via-output-parsing]]。另见 [[content/ogulcancelik-herdr]]、[[claims/ogulcancelik-herdr-main-claim]]。
