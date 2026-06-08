---
text: "提供本地 OpenAI-compatible `/v1` API 给 AI 编程工具使用。"
slug: "decolua-9router-main-claim"
kind: "claim"
content: "decolua-9router"
source_pointer: "README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js POST"
evidence_strength: "high"
supports:
  - "openai-compatible-local-gateway"
  - "combo-fallback-routing"
contradicts: []
open_challenges:
  - "不证明所有第三方 CLI 在当前版本都无 bug 可用。"
  - "不同客户端的非标准请求、SSE 细节或 tool-call 行为仍可能破坏兼容性。"
status: "supported"
---

## Claim

客户端可以把 base URL 指到 `http://localhost:20128/v1`；Next.js rewrite 会把 `/v1/chat/completions` 转到 `/api/v1/chat/completions`，route 再调用 `handleChat`。

证据:`source: "/v1/:path*" destination: "/api/v1/:path*"`；README 示例给出 Endpoint `http://localhost:20128/v1` 与 Model `kr/claude-sonnet-4.5`。。边界:不证明所有第三方 CLI 在当前版本都无 bug 可用。。风险:不同客户端的非标准请求、SSE 细节或 tool-call 行为仍可能破坏兼容性。。See [[content/decolua-9router]]。
