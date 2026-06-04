---
name: "闭环学习循环"
slug: "closed-learning-loop"
kind: "concept"
tags:
  - "agent"
  - "learning"
  - "memory"
maturity: "active"
first_seen_in: "hermes-agent"
related_content:
  - "hermes-agent"
related_concepts: []
explanation: "agent 通过执行任务、创建技能、记忆存储、自我提醒形成持续改进的循环。"
examples:
  - "完成一个代码审查任务后，agent 可能创建一个 skill，并在未来相似任务中自动使用。"
common_misunderstandings:
  - "不是强化学习，而是基于 LLM 的规则和文件管理。"
open_questions:
  - "学习循环的有效性如何评估？"
  - "如何防止错误的技能固化？"
---

## Explanation

agent 通过执行任务、创建技能、记忆存储、自我提醒形成持续改进的循环。 出处:https://github.com/nousresearch/hermes-agent。See [[content/hermes-agent]]。

## Supported by
- [[claims/hermes-agent-main-claim]]
