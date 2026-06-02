---
title: "Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for Large Language Model Agents"
slug: agemem
kind: content
type: paper
source: arxiv
url: https://arxiv.org/abs/2601.01885
authors_or_creators:
  - Yi Yu
  - Liuyi Yao
  - Yuexiang Xie
  - Qingquan Tan
  - Jiaqi Feng
  - Yaliang Li
  - Libing Wu
date: "2026-01-05"
discovered_at: "2026-06-01"
content_track: AI Engineer
status: deep_dived
tags:
  - agent-memory
  - llm-agents
  - reinforcement-learning
importance: 4
why_discovered: "契合口味(agent-memory 架构);回答了 gap-map 里那个悬而未决的问题——研究型智能体如何持久化长期状态。"
why_selected: "一篇有具体机制的 system/method 论文(把记忆操作做成一等公民的策略动作)+ 一套 RL 训练配方 + 5 个基准的证据。可复用范式价值高。"
relation_to_existing_memory: creates_new_track
---

## Summary

AgeMem 把长期记忆(LTM)和短期记忆(STM)的管理折叠进 LLM 智能体自己的策略里:不再有独立的启发式控制器,智能体把记忆操作当作工具动作来调用,并用 RL 端到端训练,自己决定「何时、把什么」存储、检索、更新、摘要或丢弃。出处:arxiv:2601.01885(abstract)。

## Pipeline
- [[source-packs/agemem-source-pack]]
- [[evidence-packs/agemem-evidence-pack]]
- [[deep-dives/agemem-deep-dive]]

## Methods
- [[methods/step-wise-grpo]]

## Concepts
- [[concepts/agentic-memory]]

## Claims
- [[claims/agemem-unified-beats-modular]]

## Evidence
- [[evidence/agemem-main-results]]

## Artifacts
- [[artifacts/agemem-code]]
