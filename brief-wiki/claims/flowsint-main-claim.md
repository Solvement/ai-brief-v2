---
text: "Flowsint 是一个开源的 OSINT 图谱探索工具，内置数十种自动数据丰富器。"
slug: "flowsint-main-claim"
kind: "claim"
content: "flowsint"
source_pointer: "README.md 开头介绍"
evidence_strength: "high"
supports:
  - "enricher-pattern"
  - "graph-investigation-loop"
contradicts: []
open_challenges:
  - "未提供丰富器的实现细节或第三方 API 需求列表。"
  - "丰富器依赖外部服务，如服务关停或 API 变更，功能将失效。"
status: "supported"
---

## Claim

用于数字调查的免费工具，能自动查询网站、IP、邮箱等信息并画成关系图。

证据:README 列出了大量域、IP、邮箱等丰富器，并给出模块结构。。边界:未提供丰富器的实现细节或第三方 API 需求列表。。风险:丰富器依赖外部服务，如服务关停或 API 变更，功能将失效。。See [[content/flowsint]]。
