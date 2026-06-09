---
content: "refactoringhq-tolaria"
kind: "evidence-pack"
title: "tolaria — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Tolaria 是一个本地优先的 Markdown 知识库桌面应用，把 vault 文件、Git、MCP 和多种 CLI/模型 AI 入口接在一起。"
    internal_logic: "真实流：用户打开 `demo-vault-v2/25q2-laputa-v2.md` 这类文件，frontmatter 里有 `type: Project`、`belongs_to`、`related_to`，正文里有 `「laputa-qa-reference」(Obsidian 式双链)`。Rust 扫描后生成 `VaultEntry`，React 显示四栏；AI 面板把 active note、open tabs、note list 和 vault summary 组装成 JSON context；CLI agent 或 MCP tool 再读写同一批文件。（来源：demo-vault-v2/25q2-laputa-v2.md；src-tauri/src/vault/mod.rs；src/utils/ai-context.ts）\n\n```mermaid\nflowchart TD\n  A[Markdown vault] --> B[Rust 扫描]\n  B --> C[VaultEntry 列表]\n  C --> D[React 四栏 UI]\n  D --> E[AI context JSON]\n  E --> F[CLI agent 适配器]\n  F --> G[MCP tools]\n  G --> H[读写 active vault]\n  H --> A\n  D --> I[UI WebSocket 桥]\n  G --> I\n```\n\n关键点：MCP 的 `create_note` 不覆盖已有文件，fallback 内容会写成 `type: \"Project\"` 加 H1；多 vault 同名路径会报 ambiguous，要求传 `vaultPath`。（来源：mcp-server/tool-service.test.js）\n\n```bash\npnpm install\npnpm tauri dev\n```\n这是真桌面开发入口；浏览器 mock 用 `pnpm dev`，不覆盖 Tauri/Rust/MCP 全路径。（来源：README Quick start；docs/GETTING-STARTED Quick Start）"
    failure_mode: "package.json dependencies；src-tauri/Cargo.toml；src-tauri/tauri.conf.json"
    source_pointer: "https://github.com/refactoringhq/tolaria"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/AGPL-3.0/v2026-06-06"
experiments: []
claims:
  - "[[claims/refactoringhq-tolaria-main-claim]]"
artifacts:
  - "[[artifacts/refactoringhq-tolaria-repo]]"
metrics:
  - "stars=13556"
  - "forks=951"
  - "open_issues=30"
  - "latest_release=v2026-06-06"
  - "pushed_at=2026-06-08T21:50:52Z"
baselines: []
failure_modes:
  - "package.json dependencies；src-tauri/Cargo.toml；src-tauri/tauri.conf.json"
  - "src-tauri/src/mcp.rs find_mcp_runtime/find_node；docs/GETTING-STARTED Starter Vaults And Remotes"
  - "src-tauri/src/ai_agents.rs；src-tauri/src/codex_cli.rs；src-tauri/src/gemini_cli.rs"
  - "docs/adr/0085-non-git-vault-support.md；docs/ABSTRACTIONS Vault Git Capability"
  - "package.json license；src-tauri/Cargo.toml license；LICENSE"
  - "docs/ARCHITECTURE Telemetry；src-tauri/src/telemetry.rs"
missing_details: []
source_pointers:
  - "https://github.com/refactoringhq/tolaria"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/refactoringhq-tolaria-main-claim]],官方 artifact 落库为 [[artifacts/refactoringhq-tolaria-repo]]。See [[content/refactoringhq-tolaria]]。
