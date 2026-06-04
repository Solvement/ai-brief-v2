---
name: "令牌压缩中间件"
slug: "token-compression-middleware"
kind: "concept"
tags:
  - "cost-optimization"
  - "middleware"
  - "token-saving"
maturity: "active"
first_seen_in: "9router"
related_content:
  - "9router"
related_concepts: []
explanation: "在 API 请求发送前，用规则或小模型自动裁剪工具返回的冗余输出，减少送入主模型的上下文长度，从而节省 token 成本。"
examples:
  - "9Router 的 RTK 将 git diff 的增量部分精简化，保留关键变化行"
common_misunderstandings:
  - "压缩并非无损，会丢失部分原始输出，不适合需要完整工具输出的场景"
open_questions:
  - "如何设定压缩策略以保证代码补全的正确性不受影响？"
---

## Explanation

在 API 请求发送前，用规则或小模型自动裁剪工具返回的冗余输出，减少送入主模型的上下文长度，从而节省 token 成本。 出处:https://github.com/decolua/9router。See [[content/9router]]。

## Supported by
- [[claims/9router-main-claim]]
