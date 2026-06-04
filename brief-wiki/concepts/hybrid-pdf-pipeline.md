---
name: "Hybrid PDF Processing Pipeline"
slug: "hybrid-pdf-pipeline"
kind: "concept"
tags:
  - "agent"
  - "data-pipeline"
  - "pdf"
maturity: "emerging"
first_seen_in: "opendataloader-pdf"
related_content:
  - "opendataloader-pdf"
related_concepts: []
explanation: "一种结合本地确定性解析器和远程 AI 模型的流水线模式，通过动态路由将页面分为简单与复杂两类，简单页面走快速本地处理以节省成本和延迟，复杂页面交由 AI 模型提升精度。"
examples:
  - "opendataloader-pdf 的 hybrid mode"
  - "其他类似工具的 AI 模式如 Docling"
common_misunderstandings:
  - "并非所有页面都会经过 AI，仅由决策模块筛选出的复杂页面"
open_questions:
  - "路由策略如何避免频繁切换开销？"
  - "如何处理跨页的表格或上下文关联？"
---

## Explanation

一种结合本地确定性解析器和远程 AI 模型的流水线模式，通过动态路由将页面分为简单与复杂两类，简单页面走快速本地处理以节省成本和延迟，复杂页面交由 AI 模型提升精度。 出处:https://github.com/opendataloader-project/opendataloader-pdf。See [[content/opendataloader-pdf]]。

## Supported by
- [[claims/opendataloader-pdf-main-claim]]
