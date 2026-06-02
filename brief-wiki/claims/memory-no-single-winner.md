---
text: "在记忆四维能力上没有单一系统全面领先,且多跳冲突消解是所有方法的普遍盲区。"
slug: memory-no-single-winner
kind: claim
content: memoryagentbench
source_pointer: "arxiv:2507.05257v1 Table 2 / Table 3 / §4.2"
evidence_strength: high
supports:
  - memory-competencies
open_challenges:
  - "多跳冲突消解全体 ≤6%,究竟是 FactConsolidation 合成构造所致,还是当前记忆范式的根本短板,尚不可分辨。"
  - "开放题由 GPT-4o 评判,排名可能受评判模型偏好影响。"
status: supported
---

## Claim

RAG 赢精确检索(NV-Embed RULER-QA 83.0%)却输长程理解(0.4–20.7%);长上下文赢 TTL/LRU(GPT-4o 87.6%、Claude-3.7 52.5%)但贵;商用 Mem0 在 Movie Recom 仅 3.4%。多跳冲突消解全体 ≤6%(GPT-4o 5.0%、Contriever 7.0%),连 o4-mini@32K 也只 14.0%。出处:arxiv:2507.05257v1 Table 2/3。See [[content/memoryagentbench]] 与 [[evidence/memoryagentbench-results]]。
