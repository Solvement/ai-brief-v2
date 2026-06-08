---
name: "SSE 聊天流"
slug: "sse-chat-stream"
kind: "concept"
tags:
  - "web-runtime"
  - "agent-ui"
  - "streaming"
maturity: "stable"
first_seen_in: "nesquena-hermes-webui"
related_content:
  - "nesquena-hermes-webui"
related_concepts: []
explanation: "人话：浏览器先拿到一个 stream_id，然后像订阅直播一样接收 token、tool、approval、done 等事件。技术定义：SSE 是 Server-Sent Events，前端用 EventSource 连接 `/api/chat/stream?stream_id=...`，后端用进程内 stream/channel/queue 推送事件。"
examples:
  - "`POST /api/chat/start` -> `{stream_id}`"
  - "`new EventSource('api/chat/stream?stream_id=...')`"
  - "事件类型包括 token、approval、done、error"
common_misunderstandings:
  - "SSE 不是 WebSocket；它是服务端单向推送。"
  - "stream_id 不是会话 id；它代表一次运行/观察通道。"
open_questions:
  - "RuntimeAdapter/runner-local 完成后，SSE producer 会不会从 WebUI 进程移到独立 runner？"
---

## Explanation

人话：浏览器先拿到一个 stream_id，然后像订阅直播一样接收 token、tool、approval、done 等事件。技术定义：SSE 是 Server-Sent Events，前端用 EventSource 连接 `/api/chat/stream?stream_id=...`，后端用进程内 stream/channel/queue 推送事件。 出处:https://github.com/nesquena/hermes-webui。See [[content/nesquena-hermes-webui]]。

## Supported by
- [[claims/nesquena-hermes-webui-main-claim]]
