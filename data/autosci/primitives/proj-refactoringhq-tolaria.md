<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - refactoringhq/tolaria

## Core Pattern
VaultEntry 作为文件图谱投影: 把 Markdown 文件解析成统一 entry：path、title、type、relationships、outgoingLinks、fileKind、workspace provenance。 持久外部 MCP 配置不写 vault path: 外部 config 只保留 stdio command、index.js、`WS_UI_PORT=9711`；active vault 在工具调用时解析。 Adapter-specific permission mapping: UI 只暴露 Safe/Power User，底层按 Claude/Codex/OpenCode/Gemini 各自 CLI 参数映射。 Git-backed disposable cache: cache 存在 `~/.laputa/cache/<vault-hash>.json`，按 HEAD、diff、uncommitted files 增量刷新；cache version 变更强制重扫。 直接模型只给窄工具: OpenAI-compatible 模型只有 active vault 存在时才拿到 `create_note` 工具，且 unsupported tool 会先拒绝。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, validation_harness, vaultentry, mcp-vault-path, adapter-specific-permission-mapping
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from refactoringhq/tolaria on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: VaultEntry 作为文件图谱投影: 把 Markdown 文件解析成统一 entry：path、title、type、relationships、outgoingLinks、fileKind、workspace provenance。 持久外部 MCP 配置不写 vault path: 外部 config 只保留 stdio command、index.js、`WS_UI_PORT=9711`；active vault 在工具调用时解析。 Adapter-specific permission mapping: UI 只暴露 Safe/Power User，底层按 Claude/Codex/OpenCode/Gemini 各自 CLI 参数映射。 Git-backed disposable cache: cache 存在 `~/.laputa/cache/<vault-hash>.json`，按 HEAD、diff、uncommitted files 增量刷新；cache version 变更强制重扫。 直接模型只给窄工具: OpenAI-compatible 模型只有 active vault 存在时才拿到 `create_note` 工具，且 unsupported tool 会先拒绝。
- agent-infra-observable-flow: 真实流：用户打开 `demo-vault-v2/25q2-laputa-v2.md` 这类文件，frontmatter 里有 `type: Project`、`belongs_to`、`related_to`，正文里有 `[[laputa-qa-reference]]`。Rust 扫描后生成 `VaultEntry`，React 显示四栏；AI 面板把 active note、open tabs、note list 和 vault summary 组装成 JSON context；CLI agent 或 MCP tool 再读写同一批文件。（来源：demo-vault-v2/25q2-laputa-v2.md；src-tauri/src/vault/mod.rs；src/utils/ai-context.ts） ```mermaid flowchart TD A[Markdown vault] --> B[Rust 扫描] B --> C[VaultEntry 列表] C --> D[React 四栏 UI] D --> E[AI context JSON] E --> F[CLI agent 适配器] F --> G[MCP tools] G --> H[读写 active vault] H --> A D --> I[UI WebSocket 桥] G --> I ``` 关键点：MCP 的 `create_note` 不覆盖已有文件，fallback 内容会写成 `type: "Project"` 加 H1；多 vault 同名路径会报 ambiguous，要求传 `vaultPath`。（来源：mcp-server/tool-service.test.js） ```bash pnpm install pnpm tauri dev ``` 这是真桌面开发入口；浏览器 mock 用 `pnpm dev`，不覆盖 Tauri/Rust/MCP 全路径。（来源：README Quick start；docs/GETTING-STARTED Quick Start）
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: Tauri v2 + Rust backend: Tauri 插件、WebView、平台权限变化会影响窗口、asset protocol、updater、deep link。.

## Risks
- Tauri v2 + Rust backend: Tauri 插件、WebView、平台权限变化会影响窗口、asset protocol、updater、deep link。
- Node.js 18+ / Bun 1+ for MCP: 外部 AI 工具无法启动 MCP server，Codex adapter 还要求 Node。
- Claude Code/Codex/OpenCode/Pi/Gemini/Kiro CLI: CLI 参数、JSON event schema、权限开关变化会破坏 adapter。
- Git CLI and remotes: 认证、冲突、远端策略失败会影响 sync/history/AutoGit，但不会阻止普通 Markdown 浏览编辑。
- AGPL-3.0-or-later: 商用闭源嵌入或 SaaS 分发需要合规评估。
- PostHog/Sentry opt-in telemetry: 企业环境可能禁用外部 telemetry；若误采集路径/标题会形成隐私风险。
- over_transfer
