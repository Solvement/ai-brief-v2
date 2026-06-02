---
title: "Qwen3-Coder-Next Technical Report"
slug: qwen3-coder-next
kind: content
type: paper
source: arxiv
url: https://arxiv.org/abs/2603.00729
authors_or_creators:
  - Qwen Team (Alibaba)
date: "2026-02-28"
discovered_at: "2026-06-01"
content_track: FDE
status: deep_dived
tags:
  - coding-agent
  - open-model
  - agentic-rl
  - moe
importance: 5
why_discovered: "大厂(Alibaba Qwen)最新(2026-02)开源 coding 模型技术报告;直击 FDE 北极星——把 AI 集成进真实软件工程。"
why_selected: "过选稿闸门:Qwen/Alibaba 出身 + 2026-02 很新 + 开源权重可核验。model 类,验证类型分诊的第三种范式(训练配方 + baseline 公平性),与 method([[content/agemem]])、benchmark([[content/memoryagentbench]])三足互补。"
relation_to_existing_memory: creates_new_track
---

## Summary

Qwen3-Coder-Next 是一个 80B 总参、仅激活 3B(80A3)的 MoE coding 模型(基于 Qwen3-Next 的 hybrid attention,262K 上下文)。核心卖点不是堆参数,而是一套 **agentic 训练栈**:大规模合成『可验证编码任务 + 可执行环境』,让模型直接从环境反馈学习;并发布 base + instruct 开源权重。在 SWE-Bench Verified 上达 ~71%,以远小的激活参数足迹逼近更大的开源对手,同时坦承与前沿闭源(Claude-Opus-4.5)仍有差距。出处:arxiv:2603.00729(abstract + §1-6)。

## Pipeline
- [[source-packs/qwen3-coder-next-source-pack]]
- [[evidence-packs/qwen3-coder-next-evidence-pack]]
- [[deep-dives/qwen3-coder-next-deep-dive]]

## Methods
- [[methods/agentic-rl-from-execution]]

## Concepts
- [[concepts/verifiable-task-synthesis]]

## Claims
- [[claims/qwen3-coder-next-training-over-size]]

## Evidence
- [[evidence/qwen3-coder-next-results]]

## Artifacts
- [[artifacts/qwen3-coder-next-weights]]
