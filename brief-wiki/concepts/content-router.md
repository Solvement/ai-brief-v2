---
name: "ContentRouter"
slug: "content-router"
kind: "concept"
tags:
  - "routing"
  - "compression"
  - "pipeline"
maturity: "active"
first_seen_in: "headroom"
related_content:
  - "headroom"
related_concepts: []
explanation: "内容路由器，负责检测输入内容的类型（JSON、代码、自然语言等），并将它们分发给最合适的压缩器，比如 SmartCrusher 处理 JSON，CodeCompressor 处理代码。"
examples:
  - "当输入是一段 Python 代码时，ContentRouter 将其导向 CodeCompressor；而当输入是一个大型 JSON 数组时，则导向 SmartCrusher。"
common_misunderstandings:
  - "它只做路由，不做压缩。"
  - "路由规则需要预先定义，可能无法处理未知混合内容。"
open_questions:
  - "检测依据的具体规则是怎样的？"
  - "如果内容混合（如代码和评论），如何处理？"
---

## Explanation

内容路由器，负责检测输入内容的类型（JSON、代码、自然语言等），并将它们分发给最合适的压缩器，比如 SmartCrusher 处理 JSON，CodeCompressor 处理代码。 出处:https://github.com/chopratejas/headroom。See [[content/headroom]]。

## Supported by
- [[claims/headroom-main-claim]]
