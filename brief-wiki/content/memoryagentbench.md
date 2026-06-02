---
title: "Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions (MemoryAgentBench)"
slug: memoryagentbench
kind: content
type: paper
source: arxiv
url: https://arxiv.org/abs/2507.05257
authors_or_creators:
  - Yuanzhe Hu (HUST)
  - Yu Wang
  - Julian McAuley (UC San Diego)
date: "2025-07-07"
discovered_at: "2026-06-01"
content_track: AI Engineer
status: deep_dived
tags:
  - agent-memory
  - evaluation
  - benchmark
  - llm-agents
importance: 4
why_discovered: "顶会信号(ICLR 2026)+ 知名 AI 学者(Julian McAuley, UCSD);补 gap-map 里『如何评测 agent 记忆是否真的有效』这一缺口。"
why_selected: "过选稿闸门:ICLR 2026 收录 + McAuley 背书,MIT 代码+数据可核验。评测类(benchmark),与方法类的 [[content/agemem]] 互补——AgeMem 提记忆方法,本文压测记忆方法,且 Mem0 同时是两篇的对象。能验证新模板的 paper_type 分叉。"
relation_to_existing_memory: extends_existing
---

## Summary

MemoryAgentBench 把「记忆」当作 agent 的一等组件来评测:用**增量多轮**协议(逐块喂入、要求记忆,再提问),按四个能力维度——精确检索(AR)、测试时学习(TTL)、长程理解(LRU)、冲突消解(CR)——对长上下文模型、RAG、结构增强 RAG 与商用记忆 agent 做系统压测,并新建 EventQA / FactConsolidation 两套数据集。结论:没有单一方法全面领先,且多跳冲突消解是普遍盲区。出处:arxiv:2507.05257(abstract + §3-4)。

## Pipeline
- [[source-packs/memoryagentbench-source-pack]]
- [[evidence-packs/memoryagentbench-evidence-pack]]
- [[deep-dives/memoryagentbench-deep-dive]]

## Methods
- [[methods/incremental-multiturn-eval]]

## Concepts
- [[concepts/memory-competencies]]

## Claims
- [[claims/memory-no-single-winner]]

## Evidence
- [[evidence/memoryagentbench-results]]

## Artifacts
- [[artifacts/memoryagentbench-code]]
