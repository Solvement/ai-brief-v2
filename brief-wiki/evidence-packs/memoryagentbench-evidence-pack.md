---
content: memoryagentbench
kind: evidence-pack
title: "MemoryAgentBench — Evidence Pack"
technical_objects:
  - name: "增量多轮协议 (incremental multi-turn)"
    type: benchmark
    input: "chunks c_1..c_n(逐块,附记忆指令)+ queries q_1..q_m"
    output: "各能力维度的分数"
    role: "模拟『边读边记、读完再问』,区别于一次性长上下文评测"
    source_pointer: "arxiv:2507.05257v1 §3.4"
  - name: "四维能力 (AR/TTL/LRU/CR)"
    type: evaluator
    input: "agent 在协议下的回答"
    output: "按维度的正交评分"
    role: "把『记忆好坏』拆成可分别度量的四个正交能力"
    source_pointer: "arxiv:2507.05257v1 §3.1"
  - name: "EventQA 数据集"
    type: dataset
    input: "5 本书 >390K token,抽取 101 事件"
    output: "6 选 1 多选,给最多前 5 个事件"
    role: "测序列事件推理(AR);平均 534K token / 500 QA"
    source_pointer: "arxiv:2507.05257v1 §3.2.1 / A.1.5"
  - name: "FactConsolidation 数据集"
    type: dataset
    input: "MQUAKE 反事实编辑对拼接(32K/64K/262K)"
    output: "单跳(SH)直接回忆 / 多跳(MH)推理"
    role: "显式测冲突消解(CR)"
    source_pointer: "arxiv:2507.05257v1 §3.2.4 / A.4"
pipeline_steps:
  - "逐块喂入 context(每块要求记忆)"
  - "读完后按四维提问"
  - "客观题用 SubEM/Recall/ROUGE-F1/Acc/Recall@5;开放题用 GPT-4o judge"
experiments:
  - "长上下文 / RAG / 结构增强 RAG / 商用记忆 agent 横向压测"
claims:
  - "没有单一记忆方法全面领先;多跳冲突消解是普遍盲区"
artifacts:
  - "MIT 代码 + HuggingFace 数据(含自建 EventQA / FactConsolidation)"
metrics:
  - "SubEM / Recall / ROUGE-F1"
  - "Accuracy / Recall@5"
  - "Model-based F1 + fluency(摘要)"
baselines:
  - "长上下文:GPT-4o / GPT-4.1-mini / Gemini-2.0-Flash / Claude-3.7-Sonnet"
  - "RAG:BM25 / Contriever / NV-Embed-v2 / Text-Embed-3"
  - "结构增强:RAPTOR / GraphRAG / HippoRAG-v2 / Mem0 / Cognee"
  - "agentic:Self-RAG / MemGPT"
failure_modes:
  - "RAG 在长程理解全线塌方(0.4–20.7%)"
  - "多跳冲突消解全体 ≤6%"
  - "Mem0 过度抽取,密集任务/推荐崩盘(Movie Recom 3.4%)"
missing_details:
  - "评测硬件/算力成本"
  - "真实(非合成)对话数据"
source_pointers:
  - "arxiv:2507.05257v1 Table 2 / Table 3 / §4.2 / A.1-A.4 / §5"
---

## Notes

证据先于综合(evidence-first)。四维 + 增量协议 + 两套自建数据集是本文的技术骨架(arxiv:2507.05257v1 §3)。
