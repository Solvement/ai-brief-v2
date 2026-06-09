---
content: "can1357-oh-my-pi"
kind: "evidence-pack"
title: "oh-my-pi — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "oh-my-pi 是一个终端里的 AI 编程代理框架，把读写文件、命令执行、LSP、DAP 调试、子代理、MCP、技能和扩展放进同一个 `omp` CLI。"
    internal_logic: "核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。\n\n```mermaid\nflowchart TD\n  A[用户任务] --> B[omp CLI]\n  B --> C[会话运行时]\n  C --> D[模型路由]\n  C --> E[工具注册表]\n  E --> F[read 统一读取]\n  F --> G[哈希锚快照]\n  G --> H[edit 写入]\n  H --> I[LSP 诊断]\n  E --> J[task 子代理]\n  J --> K[隔离工作区]\n  E --> L[MCP 和扩展]\n  E --> M[eval 和 bash]\n```\n\n一个真实编辑例子：`read` 在 hashline 模式会给可变文件加类似 `¶a.ts#0A3B` 的头，`edit` 再消费这个头和行号。（来源：docs/tools/read.md Local text files；docs/tools/edit.md Worked examples）\n\n```text\n¶a.ts#0A3B\nreplace 1..1:\n```\n\n这两行的意思是：只替换 `a.ts` 当前快照的第 1 行；如果文件内容已经漂移，`packages/hashline` 会按 snapshot 校验并拒绝或恢复。（来源：packages/hashline/README.md Format；docs/tools/edit.md Limits & Caps）\n\n更完整的 agent loop：CLI 入口 `src/cli.ts` 把非子命令默认路由到 `launch`；`main.ts` 初始化 settings、model registry、session；`createTools` 从 `BUILTIN_TOOLS` 和 MCP/custom/extension 工具生成可调用工具；工具执行结果回到会话，再由模型决定下一步。（来源：packages/coding-agent/DEVELOPMENT.md Boot Sequence；packages/coding-agent/src/tools/index.ts createTools）"
    failure_mode: "packages/coding-agent/package.json engines；packages/coding-agent/src/cli.ts runSmokeTest"
    source_pointer: "https://github.com/can1357/oh-my-pi"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/MIT/v15.10.7"
experiments: []
claims:
  - "[[claims/can1357-oh-my-pi-main-claim-2]]"
artifacts:
  - "[[artifacts/project-can1357-oh-my-pi-repo]]"
metrics:
  - "stars=11287"
  - "forks=954"
  - "open_issues=197"
  - "latest_release=v15.10.7"
  - "pushed_at=2026-06-08T23:25:58Z"
baselines: []
failure_modes:
  - "packages/coding-agent/package.json engines；packages/coding-agent/src/cli.ts runSmokeTest"
  - "README Roughly ~27000 lines of Rust；crates/pi-natives/Cargo.toml"
  - "docs/models.md Provider-level fields/Validation rules"
  - "docs/mcp-config.md File shape；docs/mcp-runtime-lifecycle.md Fast startup gate"
  - "docs/lsp-config.md Auto-detection；docs/tools/debug.md Adapter selection"
  - "docs/approval-mode.md Modes/User overrides"
missing_details: []
source_pointers:
  - "https://github.com/can1357/oh-my-pi"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/can1357-oh-my-pi-main-claim-2]],官方 artifact 落库为 [[artifacts/project-can1357-oh-my-pi-repo]]。See [[content/can1357-oh-my-pi]]。
