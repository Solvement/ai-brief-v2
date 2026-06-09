---
name: "ReAct Agent Loop"
slug: "react-agent-loop"
kind: "concept"
tags:
  - "agents"
  - "tools"
maturity: "stable"
first_seen_in: "rohitg00-ai-engineering-from-scratch"
related_content:
  - "rohitg00-ai-engineering-from-scratch"
related_concepts: []
explanation: "让模型在“想、调工具、读结果、继续”之间循环；白话就是别让 LLM 一口气瞎答。"
examples:
  - "ToolRegistry.dispatch"
  - "AgentLoop.max_turns=10"
common_misunderstandings:
  - "只有用了 LangGraph/CrewAI 才叫 agent loop"
open_questions:
  - "真实 provider 的 tool schema 适配未在该 lesson 中完成"
---

## Explanation

让模型在“想、调工具、读结果、继续”之间循环；白话就是别让 LLM 一口气瞎答。 出处:https://github.com/rohitg00/ai-engineering-from-scratch。See [[content/rohitg00-ai-engineering-from-scratch]]。

## Supported by
- [[claims/rohitg00-ai-engineering-from-scratch-main-claim]]
