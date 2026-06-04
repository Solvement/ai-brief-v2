---
name: "图谱调查循环"
slug: "graph-investigation-loop"
kind: "concept"
tags:
  - "agent-loop"
  - "exploration"
  - "graph-db"
maturity: "active"
first_seen_in: "flowsint"
related_content:
  - "flowsint"
related_concepts: []
explanation: "用户选择一个节点（种子），平台自动调用相关丰富器扩展图谱，新发现的节点可继续作为种子，形成迭代探索闭环。"
examples:
  - "从域名出发，获取其 IP、子域名、WHOIS 记录，再对 IP 进行地理定位和关联域名查询。"
common_misunderstandings:
  - "循环并非全自动，当前版本由用户决策下一步，非自主规划。"
open_questions:
  - "能否引入简单的规划器让系统自动推荐高价值下一步？"
---

## Explanation

用户选择一个节点（种子），平台自动调用相关丰富器扩展图谱，新发现的节点可继续作为种子，形成迭代探索闭环。 出处:https://github.com/reconurge/flowsint。See [[content/flowsint]]。

## Supported by
- [[claims/flowsint-main-claim]]
