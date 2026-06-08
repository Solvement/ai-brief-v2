---
name: "OpenAI-compatible local gateway"
slug: "openai-compatible-local-gateway"
kind: "concept"
tags:
  - "llm-gateway"
  - "local-proxy"
  - "api-compatibility"
maturity: "active"
first_seen_in: "decolua-9router"
related_content:
  - "decolua-9router"
related_concepts: []
explanation: "通俗说，就是让不同 AI 工具都对着同一个本地 `/v1` 地址发请求。技术上，9Router 用 Next.js rewrite 把 `/v1/*` 转到 `/api/v1/*`，再在 handler 内做模型解析、格式翻译和上游调用。"
examples:
  - "`OPENAI_BASE_URL=http://localhost:20128`"
  - "`POST /v1/chat/completions`"
  - "`src/app/api/v1/models/route.js` 返回 OpenAI-format model list"
common_misunderstandings:
  - "OpenAI-compatible 不等于所有 OpenAI SDK 功能都完全一致。"
  - "本地网关不等于上游 provider 免费或稳定。"
open_questions:
  - "不同 CLI 对 SSE、tool call、Responses API 的边界兼容性需要真实回归测试。"
---

## Explanation

通俗说，就是让不同 AI 工具都对着同一个本地 `/v1` 地址发请求。技术上，9Router 用 Next.js rewrite 把 `/v1/*` 转到 `/api/v1/*`，再在 handler 内做模型解析、格式翻译和上游调用。 出处:https://github.com/decolua/9router。See [[content/decolua-9router]]。

## Supported by
- [[claims/decolua-9router-main-claim]]
