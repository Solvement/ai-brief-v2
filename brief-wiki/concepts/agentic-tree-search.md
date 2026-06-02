---
name: "Agentic Tree Search"
slug: "agentic-tree-search"
kind: "concept"
tags:
  - "agent"
  - "tree-search"
  - "best-first"
  - "scientific-discovery"
maturity: "active"
first_seen_in: "ai-scientist-v2"
related_content:
  - "ai-scientist-v2"
related_concepts: []
explanation: "一种由 LLM agent 驱动的最优优先搜索，动态决定探索路径，在每个节点进行实验、评估并生成子节点。"
examples:
  - "AI Scientist-v2 使用此方法探索 ML 研究假设，从根节点开始，由 experiment manager 选择下一个最有希望的实验。"
common_misunderstandings:
  - "它不是简单的蒙特卡洛树搜索，而是由 LLM 作为启发式函数和动作生成器。"
open_questions:
  - "如何保证搜索树的多样性？如何处理实验失败节点的回溯？"
---

## Explanation

一种由 LLM agent 驱动的最优优先搜索，动态决定探索路径，在每个节点进行实验、评估并生成子节点。 出处:https://github.com/sakanaai/ai-scientist-v2。See [[content/ai-scientist-v2]]。

## Supported by
- [[claims/ai-scientist-v2-main-claim]]
