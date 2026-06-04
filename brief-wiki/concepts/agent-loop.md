---
name: "智能体主循环"
slug: "agent-loop"
kind: "concept"
tags:
  - "agent"
  - "control-flow"
  - "react"
maturity: "stable"
first_seen_in: "ai-engineering-from-scratch"
related_content:
  - "ai-engineering-from-scratch"
related_concepts: []
explanation: "一种在对话历史中迭代调用 LLM 并执行工具直到产生最终回复的控制流程。核心模式：历史记录、工具调用检测、工具结果反馈。适用于构建自主任务执行器。"
examples:
  - "Phase 14 lesson 01 的 agent_loop.py：纯 Python 实现，使用 history 列表和 tools 字典。"
common_misunderstandings:
  - "不仅仅是 while 循环，必须妥善处理最大步数、超时和异常。"
open_questions:
  - "如何集成流式响应和并行工具调用？"
---

## Explanation

一种在对话历史中迭代调用 LLM 并执行工具直到产生最终回复的控制流程。核心模式：历史记录、工具调用检测、工具结果反馈。适用于构建自主任务执行器。 出处:https://github.com/rohitg00/ai-engineering-from-scratch。See [[content/ai-engineering-from-scratch]]。

## Supported by
- [[claims/ai-engineering-from-scratch-main-claim]]
