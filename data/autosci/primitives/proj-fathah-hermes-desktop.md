<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - fathah/hermes-desktop

## Core Pattern
安装目标预检与显式确认: 复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。 profile-aware gateway port allocator: 默认 profile 固定 `8642`，命名 profile 从 `8643-8742` 分配并持久化到 `platforms.api_server.extra.port`。 capabilities-gated transport selection: 先读 `/v1/capabilities` 再决定是否使用新 `/v1/runs` transport；不满足就回退 `/v1/chat/completions`。 配置写入只改目标 YAML block: 用 block-aware writer 更新 `model:` 子项，避免 loose regex 改到 `personalities.default` 或 `auxiliary.*.api_key`。 Skill 文件读取白名单: 读取 `SKILL.md` 前先确认路径落在 `HERMES_HOME/skills`、`HERMES_REPO/skills` 或合法 profile skills 目录里。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, developer_control_surface, model_or_retrieval_layer, validation_harness, project, profile-aware-gateway-port-allocator, capabilities-gated-transport-selection, yaml-block
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from fathah/hermes-desktop on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: 安装目标预检与显式确认: 复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。 profile-aware gateway port allocator: 默认 profile 固定 `8642`，命名 profile 从 `8643-8742` 分配并持久化到 `platforms.api_server.extra.port`。 capabilities-gated transport selection: 先读 `/v1/capabilities` 再决定是否使用新 `/v1/runs` transport；不满足就回退 `/v1/chat/completions`。 配置写入只改目标 YAML block: 用 block-aware writer 更新 `model:` 子项，避免 loose regex 改到 `personalities.default` 或 `auxiliary.*.api_key`。 Skill 文件读取白名单: 读取 `SKILL.md` 前先确认路径落在 `HERMES_HOME/skills`、`HERMES_REPO/skills` 或合法 profile skills 目录里。
- agent-infra-observable-flow: 人话流程：第一次启动时，安装页先调用 `inspectInstallTarget()` 显示将写入的 `repoPath`，状态是 `fresh`、`update` 或 `replace`；用户点确认后才 `startInstall()`，进度对象固定有 `step`、`totalSteps: 7`、`title`、`detail`、`log`。（来源：src/renderer/src/screens/Install/Install.tsx；src/main/installer.ts inspectInstallTarget） 接着 Setup 页默认选 `openrouter`，如果 provider 需要 key，就把 key 写进对应 env，例如 `OPENROUTER_API_KEY`；如果选 local/custom，则从 base URL 推导 env key，最后调用 `setModelConfig(provider, model, baseUrl)` 写 `config.yaml` 的 `model.provider`、`model.default`、`model.base_url`。（来源：src/renderer/src/screens/Setup/Setup.tsx；src/main/config.ts setEnvValue/setModelConfig；src/shared/url-key-map.ts） 真正聊天时，`sendMessage()` 先区分 local/remote/ssh。local 会探测 API server，不通就 `startGatewayWithRecovery()`；gateway 启动时 spawn `HERMES_PYTHON`，参数来自 `gatewayCliCommandArgs(profile, ["gateway"])`，非默认 profile 会加 `--profile <name>`，stderr 写进 profile log。（来源：src/main/hermes.ts sendMessage/startGatewayDetailed） 消息 API 有三条路：如果 `/v1/capabilities` 同时声明 `run_submission`、`run_events_sse`、`run_stop`、`run_approval_response`、`tool_progress_events`，且 endpoints 精确等于 `/v1/runs`、`/v1/runs/{run_id}/events`、`/v1/runs/{run_id}/approval`、`/v1/runs/{run_id}/stop`，就走 runs transport；否则 POST `/v1/chat/completions`，body 含 `model`、`messages`、`stream: true`、可选 `session_id`；SSE block 按 `\n\n` 分割，`event: hermes.tool.progress` 走 tool event，普通 `data:` 解析 OpenAI-style `choices[0].delta.content` 和 `usage`。（来源：src/main/run-stream.ts supportsHermesRunsTransport；src/main/hermes.ts sendMessageViaRuns/sendMessageViaApi；src/main/sse-parser.ts） 术语定义：OpenAI-compatible 是指用 `/v1/chat/completions` 一类接口对接不同模型服务；gateway 是 Hermes Agent 的本地 HTTP/消息平台进程；SSE block 是服务端推送的一段 `event:`/`data:` 文本。
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: NousResearch/hermes-agent install scripts and CLI: install.sh/install.ps1 参数、venv 结构、`hermes chat`/`gateway` CLI 参数变化会影响安装、启动和 fallback。.

## Risks
- NousResearch/hermes-agent install scripts and CLI: install.sh/install.ps1 参数、venv 结构、`hermes chat`/`gateway` CLI 参数变化会影响安装、启动和 fallback。
- Hermes HTTP API and SSE schema: `/v1/capabilities`、`/v1/runs`、`/v1/chat/completions`、tool event 名称或 usage 字段变化会影响聊天显示。
- Electron/electron-builder/electron-updater: 平台打包、auto-update、Linux sandbox、Windows signing 都依赖 Electron 生态。
- Provider URL to env-key mapping: 新 provider host 或 key 名变化会导致 API key 写入/读取错误。
- SQLite `state.db` schema: `sessions`、`messages`、`messages_fts`、reasoning/tool call 字段变化会影响历史列表、搜索和恢复。
- OpenSSH client and remote account layout: SSH key、BatchMode、known_hosts、远端用户 home 不正确，会让 SSH Tunnel 失败或读错 `~/.hermes`。
- over_transfer
