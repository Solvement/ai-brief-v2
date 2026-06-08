---
name: "能力探测式流式传输"
slug: "capabilities-gated-streaming-transport"
kind: "concept"
tags:
  - "sse"
  - "api-compatibility"
  - "streaming"
maturity: "active"
first_seen_in: "fathah-hermes-desktop"
related_content:
  - "fathah-hermes-desktop"
related_concepts: []
explanation: "人话：先问后端支持什么，再决定走新接口还是旧接口。术语：`supportsHermesRunsTransport` 要求 features 和 endpoint path 同时匹配，才走 `/v1/runs` 与 events SSE。"
examples:
  - "`/v1/runs/{run_id}/events` 收到 `message.delta` 后调用 `onChunk(delta)`。"
  - "不满足 capabilities 时回退 `/v1/chat/completions`。"
common_misunderstandings:
  - "有 `/v1/capabilities` 不等于一定支持 runs；代码要求多个 feature 和 path 全部匹配。"
open_questions:
  - "Hermes capabilities schema 是否有版本号，仓库内未说明。"
---

## Explanation

人话：先问后端支持什么，再决定走新接口还是旧接口。术语：`supportsHermesRunsTransport` 要求 features 和 endpoint path 同时匹配，才走 `/v1/runs` 与 events SSE。 出处:https://github.com/fathah/hermes-desktop。See [[content/fathah-hermes-desktop]]。

## Supported by
- [[claims/fathah-hermes-desktop-main-claim]]
