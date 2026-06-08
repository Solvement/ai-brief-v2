---
content: "can1357-oh-my-pi"
kind: "evidence-pack"
title: "oh-my-pi — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "oh-my-pi 是一个 Bun/TypeScript 终端编码代理，把读文件、hashline 编辑、LSP、DAP、浏览器、MCP、子代理、记忆和本地 Rust native 工具打包成同一个 `omp` CLI/SDK。"
    internal_logic: "人话：一个真实 flow 可以这样走：用户运行 `omp -p \"List all .ts files in src/\"`，`packages/coding-agent/src/cli.ts` 会把非子命令 argv 改写为 `launch`，`packages/coding-agent/src/commands/launch.ts` 定义 `-p/--print`、`--model`、`--tools`、`--no-lsp`、`--approval-mode` 等参数，然后 `runRootCommand` 创建 agent session。session 创建后，`createTools()` 默认注册 `read,bash,edit` 等工具；当模型需要看文件，`read` 对本地文本输出 `¶src/foo.ts#0A1B` 加 `41:def alpha():` 这种 hashline header/行号，并把读取内容写入 `session.fileReadCache`。模型编辑时调用 `edit`，输入像 `¶a.ts#0A3B replace 1..1: +const X = \"b\";`；`edit` 通过 snapshot tag 验证 live file 是否仍匹配，失败时走 snapshot recovery 或返回 mismatch。结构性替换则走 `ast_edit`：输入 `ops: [{ pat, out }], paths: [...]`，先 dry-run 预览，真正落盘必须后续 `resolve(action:\"apply\")`。如果任务很大，`task` 会按 `task.maxConcurrency` 分派子代理，子代理输出 `<id>.md`，父代理再读 `agent://<id>` 汇总。术语：这条链路包含 CLI routing、session discovery、tool registry、read snapshot store、hashline patcher、resolve preview queue、subagent artifact protocol；对应源码/文档锚点是 `packages/coding-agent/src/cli.ts runCli`、`packages/coding-agent/src/commands/launch.ts flags/examples`、`docs/tools/read.md Flow`、`docs/tools/edit.md Worked examples`、`docs/tools/ast-edit.md Flow`、`docs/tools/task.md Flow`。"
    failure_mode: "packages/coding-agent/src/cli.ts MIN_BUN_VERSION check；scripts/install.sh；scripts/install.ps1；package.json packageManager"
    source_pointer: "https://github.com/can1357/oh-my-pi"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/MIT/v15.10.4"
experiments: []
claims:
  - "[[claims/can1357-oh-my-pi-main-claim]]"
artifacts:
  - "[[artifacts/can1357-oh-my-pi-repo]]"
metrics:
  - "stars=11193"
  - "forks=949"
  - "open_issues=192"
  - "latest_release=v15.10.4"
  - "pushed_at=2026-06-08T11:19:22Z"
baselines: []
failure_modes:
  - "packages/coding-agent/src/cli.ts MIN_BUN_VERSION check；scripts/install.sh；scripts/install.ps1；package.json packageManager"
  - "Dockerfile natives-builder；packages/natives/package.json；crates/pi-natives/Cargo.toml"
  - "docs/models.md Auth and credential resolution；docs/sdk.md Model and auth wiring"
  - "docs/tools/web_search.md Flow；packages/coding-agent/src/web/search/types.ts SEARCH_PROVIDER_ORDER"
  - "docs/mcp-config.md File shape；docs/mcp-config.md Validation rules"
  - "packages/coding-agent/src/lsp/defaults.json；docs/tools/lsp.md Flow"
  - "docs/approval-mode.md Modes；docs/approval-mode.md Safety overrides"
missing_details: []
source_pointers:
  - "https://github.com/can1357/oh-my-pi"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/can1357-oh-my-pi-main-claim]],官方 artifact 落库为 [[artifacts/can1357-oh-my-pi-repo]]。See [[content/can1357-oh-my-pi]]。
