---
content: "fathah-hermes-desktop"
kind: "evidence-pack"
title: "hermes-desktop — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Hermes Desktop 是 Hermes Agent 的 Electron 桌面控制台：负责安装 Hermes、写入模型/API 配置，并把聊天、会话、技能、记忆、网关和远程 SSH 管理做成 GUI。"
    internal_logic: "人话流程：第一次启动时，安装页先调用 `inspectInstallTarget()` 显示将写入的 `repoPath`，状态是 `fresh`、`update` 或 `replace`；用户点确认后才 `startInstall()`，进度对象固定有 `step`、`totalSteps: 7`、`title`、`detail`、`log`。（来源：src/renderer/src/screens/Install/Install.tsx；src/main/installer.ts inspectInstallTarget）\n\n接着 Setup 页默认选 `openrouter`，如果 provider 需要 key，就把 key 写进对应 env，例如 `OPENROUTER_API_KEY`；如果选 local/custom，则从 base URL 推导 env key，最后调用 `setModelConfig(provider, model, baseUrl)` 写 `config.yaml` 的 `model.provider`、`model.default`、`model.base_url`。（来源：src/renderer/src/screens/Setup/Setup.tsx；src/main/config.ts setEnvValue/setModelConfig；src/shared/url-key-map.ts）\n\n真正聊天时，`sendMessage()` 先区分 local/remote/ssh。local 会探测 API server，不通就 `startGatewayWithRecovery()`；gateway 启动时 spawn `HERMES_PYTHON`，参数来自 `gatewayCliCommandArgs(profile, [\"gateway\"])`，非默认 profile 会加 `--profile <name>`，stderr 写进 profile log。（来源：src/main/hermes.ts sendMessage/startGatewayDetailed）\n\n消息 API 有三条路：如果 `/v1/capabilities` 同时声明 `run_submission`、`run_events_sse`、`run_stop`、`run_approval_response`、`tool_progress_events`，且 endpoints 精确等于 `/v1/runs`、`/v1/runs/{run_id}/events`、`/v1/runs/{run_id}/approval`、`/v1/runs/{run_id}/stop`，就走 runs transport；否则 POST `/v1/chat/completions`，body 含 `model`、`messages`、`stream: true`、可选 `session_id`；SSE block 按 `\\n\\n` 分割，`event: hermes.tool.progress` 走 tool event，普通 `data:` 解析 OpenAI-style `choices[0].delta.content` 和 `usage`。（来源：src/main/run-stream.ts supportsHermesRunsTransport；src/main/hermes.ts sendMessageViaRuns/sendMessageViaApi；src/main/sse-parser.ts）\n\n术语定义：OpenAI-compatible 是指用 `/v1/chat/completions` 一类接口对接不同模型服务；gateway 是 Hermes Agent 的本地 HTTP/消息平台进程；SSE block 是服务端推送的一段 `event:`/`data:` 文本。"
    failure_mode: "src/main/installer.ts；src/main/hermes.ts；README Notes"
    source_pointer: "https://github.com/fathah/hermes-desktop"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.5.8"
experiments: []
claims:
  - "[[claims/fathah-hermes-desktop-main-claim]]"
artifacts:
  - "[[artifacts/fathah-hermes-desktop-repo]]"
metrics:
  - "stars=11119"
  - "forks=1287"
  - "open_issues=264"
  - "latest_release=v0.5.8"
  - "pushed_at=2026-06-08T09:30:36Z"
baselines: []
failure_modes:
  - "src/main/installer.ts；src/main/hermes.ts；README Notes"
  - "src/main/run-stream.ts；src/main/hermes.ts；src/main/sse-parser.ts"
  - "README Install；electron-builder.yml；package.json dependencies"
  - "src/shared/url-key-map.ts；src/main/provider-registry.ts；src/renderer/src/constants.ts"
  - "src/main/sessions.ts"
  - "docs/SSH-TUNNEL-VPS.md；src/main/ssh-tunnel.ts"
missing_details: []
source_pointers:
  - "https://github.com/fathah/hermes-desktop"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/fathah-hermes-desktop-main-claim]],官方 artifact 落库为 [[artifacts/fathah-hermes-desktop-repo]]。See [[content/fathah-hermes-desktop]]。
