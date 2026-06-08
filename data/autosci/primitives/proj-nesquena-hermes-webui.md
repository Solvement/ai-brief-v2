<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - nesquena/hermes-webui

## Core Pattern
start/observe 分离的聊天协议: 复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。 审批卡片作为运行时控制面: 把危险操作暴露为 pending approval 对象，前端显示 command/description/pattern_keys，响应 API 用 once/session/always/deny。 profile-scoped runtime env: 在进入 Agent run 前显式设置 `HERMES_HOME`、`HERMES_SESSION_ID`、`HERMES_SESSION_PLATFORM`，并在 finally 恢复旧环境。 管理员控制的同源扩展面: 只允许 `HERMES_WEBUI_EXTENSION_DIR` 下的 `/extensions/...` 或 `/static/...` 同源 URL 注入脚本/样式，拒绝 scheme、host、fragment、反斜杠和 path traversal。 工作区 Git 的只读默认 + 显式破坏性开关: 默认只允许 status、branch、diff、fetch、commit-message suggestion；stage/commit/pull/push/checkout 要 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, developer_control_surface, model_or_retrieval_layer, validation_harness, start-observe, project, profile-scoped-runtime-env, git
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from nesquena/hermes-webui on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: start/observe 分离的聊天协议: 复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。 审批卡片作为运行时控制面: 把危险操作暴露为 pending approval 对象，前端显示 command/description/pattern_keys，响应 API 用 once/session/always/deny。 profile-scoped runtime env: 在进入 Agent run 前显式设置 `HERMES_HOME`、`HERMES_SESSION_ID`、`HERMES_SESSION_PLATFORM`，并在 finally 恢复旧环境。 管理员控制的同源扩展面: 只允许 `HERMES_WEBUI_EXTENSION_DIR` 下的 `/extensions/...` 或 `/static/...` 同源 URL 注入脚本/样式，拒绝 scheme、host、fragment、反斜杠和 path traversal。 工作区 Git 的只读默认 + 显式破坏性开关: 默认只允许 status、branch、diff、fetch、commit-message suggestion；stage/commit/pull/push/checkout 要 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`。
- agent-infra-observable-flow: 真实流程示例：用户在浏览器 composer 里按发送。前端 `static/messages.js` 先把 user message 乐观插入 `S.messages`，上传附件时调用 `uploadPendingFiles()`；如果只有附件，会把消息文本构造成 `I've uploaded N file(s): ...`，如果有正文则追加 `[Attached files: ...]`。随后它 POST `/api/chat/start`，body 里包含 `session_id`、`message`、`model`、`workspace`、`model_provider`、`profile`、`explicit_model_pick` 和 `attachments`。（来源：static/messages.js send flow） 后端 `api/routes.py` 的 `_handle_chat_start` 先 `require(body, "session_id")`，找 session，校验 profile id，要求 `message` 非空，最多取 20 个 attachments，然后解析 workspace/model/provider。普通 legacy 路径会进入 `_start_chat_stream_for_session`，生成 stream，浏览器拿到 `stream_id`。（来源：api/routes.py `_handle_chat_start`） 流式部分由 `api/streaming.py` 执行。worker 注册 active run，创建 cancel event，把 `CANCEL_FLAGS[stream_id]`、`STREAM_PARTIAL_TEXT[stream_id]`、`STREAM_REASONING_TEXT[stream_id]`、`STREAM_LIVE_TOOL_CALLS[stream_id]` 放进全局表。跑 Agent 前，它设置线程/进程环境：`TERMINAL_CWD=str(s.workspace)`、`HERMES_EXEC_ASK=1`、`HERMES_SESSION_KEY=session_id`、`HERMES_SESSION_ID=session_id`、`HERMES_SESSION_PLATFORM=webui`；如果有 profile home，还临时设置 `HERMES_HOME`。然后按 Hermes Agent 的签名创建或复用 `AIAgent`，最终调用 `agent.run_conversation(user_message=..., system_message=..., conversation_history=..., task_id=session_id, persist_user_message=msg_text)`。（来源：api/streaming.py `_run_agent_streaming` env mutation and run_conversation） 浏览器侧对 SSE 做事件分发：`token` 追加到 assistantText 并节流渲染 markdown；`approval` 调用 `showApprovalCard`；用户点审批按钮时 `respondApproval(choice)` POST `/api/approval/respond`，body 是 `{session_id, choice, approval_id}`。审批监听优先开 `api/approval/stream?session_id=...` 的 EventSource，失败后回退到 HTTP polling。（来源：static/messages.js `_wireSSE`；static/messages.js `showApprovalCard/respondApproval/startApprovalPolling`） 技术定义：EventSource/SSE 是浏览器长连接；`stream_id` 是一次 Agent run 的观察句柄；`task_id=session_id` 是 WebUI 传给 Hermes Agent 的会话键；`HERMES_HOME` 是 profile/state 的根目录。
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: Hermes Agent Python internals：`run_agent.AIAgent`、`hermes_cli.*`、Agent `state.db` schema: Agent 改模块名、构造参数、配置/状态 schema 后，WebUI 的聊天、profile、model catalog、CLI session bridge 会坏。.

## Risks
- Hermes Agent Python internals：`run_agent.AIAgent`、`hermes_cli.*`、Agent `state.db` schema: Agent 改模块名、构造参数、配置/状态 schema 后，WebUI 的聊天、profile、model catalog、CLI session bridge 会坏。
- Process-local stream state：`STREAMS`、`CANCEL_FLAGS`、`AGENT_INSTANCES`、`ACTIVE_RUNS`: WebUI 进程重启或多进程部署会丢失当前 run 的内存状态，影响 reconnect/cancel/approval。
- Docker volume、UID/GID、agent source mount: 挂载权限不对会导致 `.hermes`、workspace、credential 文件不可读；two-container 下 tool 运行在 WebUI container 而非 agent container。
- 浏览器同源扩展注入: 被注入 JS 可调用登录用户能调用的所有 WebUI API，包括读会话、发消息、改设置、触发工具。
- Workspace Git destructive actions: 启用后浏览器动作可以 stage/commit/pull/push/checkout，并可能触发 Git hooks。
- Model provider/API key/local model Base URL: provider 未配置、Docker 中误用 localhost、API key 缺失或模型列表探测失败，会导致 onboarding 或聊天不可用。
- over_transfer
