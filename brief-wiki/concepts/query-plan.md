---
name: "Query Plan"
slug: "query-plan"
kind: "concept"
tags:
  - "planning"
  - "retrieval"
  - "agent-loop"
maturity: "active"
first_seen_in: "mvanhorn-last30days-skill"
related_content:
  - "mvanhorn-last30days-skill"
related_concepts: []
explanation: "把用户问题拆成多个检索子问题，每个子问题有搜索词、排序问题、目标源和权重。白话说，是先让模型写“搜索作战图”，再让脚本执行。"
examples:
  - "`planner.py` 的 `SubQuery(label, search_query, ranking_query, sources, weight)`"
  - "`--plan <tmpfile>`"
  - "`--competitors-plan <json-or-path>`"
common_misunderstandings:
  - "以为 engine 内部 LLM planner 是必需；SKILL.md 说宿主模型本身就是 planner，named entity 应传 `--plan`。"
  - "把 JSON inline 到 shell；项目已改成 tmpfile 以避开 apostrophe 破坏引用。"
open_questions:
  - "不同宿主模型生成 plan 的质量差异没有基准表。"
---

## Explanation

把用户问题拆成多个检索子问题，每个子问题有搜索词、排序问题、目标源和权重。白话说，是先让模型写“搜索作战图”，再让脚本执行。 出处:https://github.com/mvanhorn/last30days-skill。See [[content/mvanhorn-last30days-skill]]。

## Supported by
- [[claims/mvanhorn-last30days-skill-main-claim]]
