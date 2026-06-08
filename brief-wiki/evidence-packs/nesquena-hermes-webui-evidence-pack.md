---
content: "nesquena-hermes-webui"
kind: "evidence-pack"
title: "hermes-webui — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Hermes WebUI 是给 Hermes Agent 用的自托管浏览器工作台：用 Python 标准库 HTTP 服务和 vanilla JS，把聊天、会话、工作区文件、审批、任务、技能、记忆和多 profile 管理放到一个 Web UI 里。"
    internal_logic: "真实流程示例：用户在浏览器 composer 里按发送。前端 `static/messages.js` 先把 user message 乐观插入 `S.messages`，上传附件时调用 `uploadPendingFiles()`；如果只有附件，会把消息文本构造成 `I've uploaded N file(s): ...`，如果有正文则追加 `[Attached files: ...]`。随后它 POST `/api/chat/start`，body 里包含 `session_id`、`message`、`model`、`workspace`、`model_provider`、`profile`、`explicit_model_pick` 和 `attachments`。（来源：static/messages.js send flow）\n\n后端 `api/routes.py` 的 `_handle_chat_start` 先 `require(body, \"session_id\")`，找 session，校验 profile id，要求 `message` 非空，最多取 20 个 attachments，然后解析 workspace/model/provider。普通 legacy 路径会进入 `_start_chat_stream_for_session`，生成 stream，浏览器拿到 `stream_id`。（来源：api/routes.py `_handle_chat_start`）\n\n流式部分由 `api/streaming.py` 执行。worker 注册 active run，创建 cancel event，把 `CANCEL_FLAGS[stream_id]`、`STREAM_PARTIAL_TEXT[stream_id]`、`STREAM_REASONING_TEXT[stream_id]`、`STREAM_LIVE_TOOL_CALLS[stream_id]` 放进全局表。跑 Agent 前，它设置线程/进程环境：`TERMINAL_CWD=str(s.workspace)`、`HERMES_EXEC_ASK=1`、`HERMES_SESSION_KEY=session_id`、`HERMES_SESSION_ID=session_id`、`HERMES_SESSION_PLATFORM=webui`；如果有 profile home，还临时设置 `HERMES_HOME`。然后按 Hermes Agent 的签名创建或复用 `AIAgent`，最终调用 `agent.run_conversation(user_message=..., system_message=..., conversation_history=..., task_id=session_id, persist_user_message=msg_text)`。（来源：api/streaming.py `_run_agent_streaming` env mutation and run_conversation）\n\n浏览器侧对 SSE 做事件分发：`token` 追加到 assistantText 并节流渲染 markdown；`approval` 调用 `showApprovalCard`；用户点审批按钮时 `respondApproval(choice)` POST `/api/approval/respond`，body 是 `{session_id, choice, approval_id}`。审批监听优先开 `api/approval/stream?session_id=...` 的 EventSource，失败后回退到 HTTP polling。（来源：static/messages.js `_wireSSE`；static/messages.js `showApprovalCard/respondApproval/startApprovalPolling`）\n\n技术定义：EventSource/SSE 是浏览器长连接；`stream_id` 是一次 Agent run 的观察句柄；`task_id=session_id` 是 WebUI 传给 Hermes Agent 的会话键；`HERMES_HOME` 是 profile/state 的根目录。"
    failure_mode: "README Compatibility；docs/rfcs/agent-source-boundary.md"
    source_pointer: "https://github.com/nesquena/hermes-webui"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v0.51.293"
experiments: []
claims:
  - "[[claims/nesquena-hermes-webui-main-claim]]"
artifacts:
  - "[[artifacts/nesquena-hermes-webui-repo]]"
metrics:
  - "stars=13589"
  - "forks=1663"
  - "open_issues=249"
  - "latest_release=v0.51.293"
  - "pushed_at=2026-06-06T07:19:34Z"
baselines: []
failure_modes:
  - "README Compatibility；docs/rfcs/agent-source-boundary.md"
  - "api/config.py stream globals；docs/rfcs/hermes-run-adapter-contract.md Problem/Current Gate State"
  - "docker-compose.yml；docker-compose.two-container.yml；README Docker Common failure modes"
  - "docs/EXTENSIONS.md Trust model/URL rules"
  - "docs/workspace-git.md"
  - "docs/onboarding.md Choosing a provider/Base URL rules"
missing_details: []
source_pointers:
  - "https://github.com/nesquena/hermes-webui"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/nesquena-hermes-webui-main-claim]],官方 artifact 落库为 [[artifacts/nesquena-hermes-webui-repo]]。See [[content/nesquena-hermes-webui]]。
