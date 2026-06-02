---
slug: memoryagentbench-results
kind: evidence
content: memoryagentbench
experiment_or_case: "记忆四维(AR/TTL/LRU/CR)横向压测:长上下文 / RAG / 结构增强 RAG / 商用记忆 agent"
dataset: "RULER-QA / NIAH-MQ / ∞-Bench-QA / EventQA / 分类×5 / Movie Recom / ∞-Bench-Sum / FactConsolidation"
baseline: "GPT-4o/4.1-mini, Gemini-2.0-Flash, Claude-3.7; BM25/Contriever/NV-Embed-v2; RAPTOR/GraphRAG/HippoRAG-v2/Mem0/Cognee; Self-RAG/MemGPT"
metric: "SubEM / Recall / ROUGE-F1 / Accuracy / Recall@5 / model-based F1"
result: "AR: NV-Embed RULER-QA 83.0%, BM25 NIAH 100%, GPT-4.1-mini EventQA 82.6%。TTL: GPT-4o 87.6% vs Mem0 3.4%。LRU: Claude-3.7 52.5% vs RAG/agentic 0.4–20.7%。CR: 单跳 GPT-4o 60.0%,多跳全体 ≤6%(o4-mini@32K 14.0%)。"
exactness: exact
sample_size: "EventQA 500 QA / 534K avg;FactConsolidation 32K-262K"
limitations: "数据集主要为合成(作者自承);开放题用 GPT-4o judge;硬件成本未给。"
source_pointer: "arxiv:2507.05257v1 Table 2 / Table 3 / §4.2 / A.1-A.4"
---

## Evidence

数字逐项摘自 v1 正文表格。See [[content/memoryagentbench]] 与 [[claims/memory-no-single-winner]]。
