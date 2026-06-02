---
name: "可验证任务合成 (verifiable task synthesis)"
slug: verifiable-task-synthesis
kind: concept
tags:
  - agentic-rl
  - coding-agent
  - evaluation
maturity: emerging
first_seen_in: qwen3-coder-next
related_content:
  - qwen3-coder-next
explanation: "大规模合成『带可执行环境、能由执行结果自动判分』的任务,把训练/评测信号从『人标或 LLM 自评』换成『环境客观反馈』。是 agentic RL 可规模化的前提。"
examples:
  - "Qwen3-Coder-Next 跨 9 语言 bug 合成 ~800K 可验证 SWE 任务,模型直接从执行反馈学习。出处:arxiv:2603.00729 §2.1。"
common_misunderstandings:
  - "不是『更多数据』:关键是任务自带可执行的正确性判据,而非数量。"
open_questions:
  - "可验证任务能否覆盖 UI / 安全 / 模糊需求这类难以自动判分的真实场景?"
---

## Explanation

可验证 = 任务带可执行环境,正确与否由运行结果客观决定。这把 agentic RL 从『奖励难定义』里解放出来,也是把『LLM 自评』替换成『执行验证』的基础——对 BriefMem 的 evaluator 设计有直接启发。出处:arxiv:2603.00729 §2.1。See [[content/qwen3-coder-next]]。
