---
name: "记忆四维能力 (AR/TTL/LRU/CR)"
slug: memory-competencies
kind: concept
tags:
  - agent-memory
  - evaluation
maturity: emerging
first_seen_in: memoryagentbench
related_content:
  - memoryagentbench
explanation: "把 agent『记忆好坏』拆成四个正交能力:精确检索(AR)、测试时学习(TTL)、长程理解(LRU)、冲突消解(CR)。任一系统可能赢某维而输另一维,故不存在单一『最佳记忆系统』。"
examples:
  - "MemoryAgentBench 用增量多轮协议分别度量这四维:RAG 强 AR 弱 LRU,长上下文反之。出处:arxiv:2507.05257v1 §3.1。"
common_misunderstandings:
  - "记忆≠检索:AR 只是其一;TTL/LRU/CR 衡量的是『用记忆做事』而非『取回片段』。"
open_questions:
  - "多跳冲突消解为何全行业 ≤6%?是评测构造问题,还是当前记忆范式的根本短板?"
---

## Explanation

四维把模糊的『记忆能力』变成可分别度量的正交轴,从而能定位某系统具体弱在哪一维,而不是给一个笼统排名。其中冲突消解(CR)直接对应知识图谱里的矛盾检测。出处:arxiv:2507.05257v1 §3.1。See [[content/memoryagentbench]]。
