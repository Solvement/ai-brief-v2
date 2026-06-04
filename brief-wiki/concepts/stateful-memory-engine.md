---
name: "状态化记忆引擎"
slug: "stateful-memory-engine"
kind: "concept"
tags:
  - "memory"
  - "state-management"
  - "agent-memory"
maturity: "emerging"
first_seen_in: "supermemory"
related_content:
  - "supermemory"
related_concepts: []
explanation: "与无状态的 RAG 不同，状态化记忆引擎持续跟踪和更新关于用户的事实，能处理信息演化（如搬家）、时间过期（如明天考试）和矛盾（新旧事实冲突），始终保留一个准确的用户认知状态。"
examples:
  - "Supermemory 自动将“我使用 Vim”与后来的“我现在用 VS Code”合并，更新用户画像。"
  - "Mem0 和 Zep 也提供类似的状态化记忆，但 Supermemory 在基准上暂时领先。"
common_misunderstandings:
  - "混淆为简单的向量存储或文档 RAG，忽视其事实更新和遗忘逻辑。"
  - "误认为所有记忆都会永久保存，实际上临时和矛盾信息会被自动清除。"
open_questions:
  - "如何决定记住什么和忘记什么？是否有可配置的保留策略？"
  - "如何处理多层次事实冲突（例如多个信息源存在矛盾）？"
---

## Explanation

与无状态的 RAG 不同，状态化记忆引擎持续跟踪和更新关于用户的事实，能处理信息演化（如搬家）、时间过期（如明天考试）和矛盾（新旧事实冲突），始终保留一个准确的用户认知状态。 出处:https://github.com/supermemoryai/supermemory。See [[content/supermemory]]。

## Supported by
- [[claims/supermemory-main-claim]]
