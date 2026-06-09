---
name: "内容路由压缩"
slug: "content-router"
kind: "concept"
tags:
  - "context-engineering"
  - "tool-output"
  - "routing"
maturity: "active"
first_seen_in: "chopratejas-headroom"
related_content:
  - "chopratejas-headroom"
related_concepts: []
explanation: "先判断内容是 JSON、日志、搜索结果、代码、HTML 还是普通文本，再交给不同压缩器；比统一摘要更适合 agent tool output。"
examples:
  - "JSON arrays -> SmartCrusher"
  - "Logs -> LogCompressor"
  - "Search results -> SearchCompressor"
  - "Code -> CodeCompressor 或保护跳过"
common_misunderstandings:
  - "以为所有消息都会压缩；用户消息、系统/开发者消息、小内容、分析代码场景都有保护分支。"
  - "以为路由等于生成摘要；SmartCrusher 默认保留结构样本、异常、首尾项，不只是自然语言总结。"
open_questions:
  - "不同业务工具的字段重要性如何通过 TOIN 或自定义 profile 稳定学习？"
---

## Explanation

先判断内容是 JSON、日志、搜索结果、代码、HTML 还是普通文本，再交给不同压缩器；比统一摘要更适合 agent tool output。 出处:https://github.com/chopratejas/headroom。See [[content/chopratejas-headroom]]。

## Supported by
- [[claims/chopratejas-headroom-main-claim-2]]
