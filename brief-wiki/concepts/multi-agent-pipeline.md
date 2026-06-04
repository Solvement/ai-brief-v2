---
name: "Multi-Agent Pipeline"
slug: "multi-agent-pipeline"
kind: "concept"
tags:
  - "architecture"
  - "agent"
maturity: "active"
first_seen_in: "vimax"
related_content:
  - "vimax"
related_concepts: []
explanation: "将复杂任务分解为多个串行或并行的步骤，每个步骤由一个专用智能体负责，上游输出作为下游输入，从而降低单点难度并提高可维护性。"
examples:
  - "ViMax 的编剧 Agent → 导演 Agent → 制片 Agent 流水线"
common_misunderstandings:
  - "不是简单的函数调用链，每个 Agent 可以拥有自己的状态、记忆和决策能力。"
open_questions:
  - "流水线中某个 Agent 失败如何回滚或补偿？"
---

## Explanation

将复杂任务分解为多个串行或并行的步骤，每个步骤由一个专用智能体负责，上游输出作为下游输入，从而降低单点难度并提高可维护性。 出处:https://github.com/hkuds/vimax。See [[content/vimax]]。

## Supported by
- [[claims/vimax-main-claim]]
