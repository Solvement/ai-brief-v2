---
name: "Experiment Manager Agent"
slug: "experiment-manager-agent"
kind: "concept"
tags:
  - "agent"
  - "manager"
  - "planner"
maturity: "active"
first_seen_in: "ai-scientist-v2"
related_content:
  - "ai-scientist-v2"
related_concepts: []
explanation: "在树搜索中扮演类似 critic 的角色，评估实验节点并决定下一步方向（如继续实验、修改代码或终止）。"
examples:
  - "AI Scientist-v2 的 experiment manager 分析当前实验结果，生成代码变体或停止搜索。"
common_misunderstandings:
  - "它不是一个简单的固定策略，而是通过 LLM 语义理解实验结果的 agent。"
open_questions:
  - "如何训练或微调 experiment manager 以提高决策质量？"
---

## Explanation

在树搜索中扮演类似 critic 的角色，评估实验节点并决定下一步方向（如继续实验、修改代码或终止）。 出处:https://github.com/sakanaai/ai-scientist-v2。See [[content/ai-scientist-v2]]。

## Supported by
- [[claims/ai-scientist-v2-main-claim]]
