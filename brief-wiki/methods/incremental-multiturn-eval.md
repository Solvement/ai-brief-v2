---
name: "增量多轮记忆评测协议"
slug: incremental-multiturn-eval
kind: method
type: evaluation
tags:
  - evaluation
  - agent-memory
  - benchmark
used_by_content:
  - memoryagentbench
realizes_concepts:
  - memory-competencies
problem_solved: "一次性长上下文评测无法反映 agent『逐块吸收、读完再问』的真实记忆流程,导致记忆能力被高估或测不准。"
naive_baseline: "把全文一次性塞进 context,再问问题(LongBench/∞-Bench 式)。"
how_it_works: "把语料切成有序 chunk,逐块喂入并附『请记忆』指令,模型必须自行决定保留什么;读完后再按四维(AR/TTL/LRU/CR)提问。客观题用 SubEM/Recall/F1,开放题用 LLM-judge。"
input: "有序 chunks c_1..c_n + 多个 query q_1..q_m"
output: "按记忆四维分别给出的分数"
tradeoff: "更贴近真实记忆流程,但开放题依赖 LLM-judge,且需要专门构造超长/反事实数据集。"
evidence_strength: high
reusable_pattern: "评测一个有状态系统时,按真实使用时序增量喂入、再正交拆解能力维度,而不是一次性给全量输入测单一指标。"
---

## Mechanism

增量喂入 + 四维正交拆解,是把『记忆』当有状态过程来测的关键。出处:arxiv:2507.05257v1 §3.4 + §3.1。See [[content/memoryagentbench]]。
