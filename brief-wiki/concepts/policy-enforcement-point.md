---
name: "Policy Enforcement Point"
slug: "policy-enforcement-point"
kind: "concept"
tags:
  - "agent-governance"
  - "security"
  - "runtime"
maturity: "stable"
first_seen_in: "microsoft-agent-governance-toolkit"
related_content:
  - "microsoft-agent-governance-toolkit"
related_concepts: []
explanation: "人话：真正拦住或放行动作的地方。技术词：PEP 是宿主 adapter、中间件或 sidecar，负责拦截 agent action、调用策略决策层，并执行 allow/deny/escalate/transform verdict。"
examples:
  - "AGT host adapters in agent-os intercept the agent loop and enforce returned verdicts."
common_misunderstandings:
  - "把 prompt safety 当成 PEP；prompt 只是输入，不是强制执行点。"
open_questions:
  - "每个 framework adapter 是否完整覆盖所有危险工具调用路径需要逐个验证。"
---

## Explanation

人话：真正拦住或放行动作的地方。技术词：PEP 是宿主 adapter、中间件或 sidecar，负责拦截 agent action、调用策略决策层，并执行 allow/deny/escalate/transform verdict。 出处:https://github.com/microsoft/agent-governance-toolkit。See [[content/microsoft-agent-governance-toolkit]]。

## Supported by
- [[claims/microsoft-agent-governance-toolkit-main-claim]]
