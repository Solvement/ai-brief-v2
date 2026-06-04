---
name: "确定性策略拦截"
slug: "deterministic-policy-interception"
kind: "concept"
tags:
  - "agent"
  - "security"
  - "governance"
maturity: "active"
first_seen_in: "agent-governance-toolkit"
related_content:
  - "agent-governance-toolkit"
related_concepts: []
explanation: "在代理的工具调用或动作执行之前，通过代码检查预先定义的显式规则来决定允许或拒绝，而不是依赖 LLM 的主观判断。"
examples:
  - "AGT 的 `govern()` 函数包装工具，当 action='delete' 且策略中禁止时抛出 GovernanceDenied。"
common_misunderstandings:
  - "不等于禁止所有危险操作，而是要求显式定义哪些操作危险并阻止。"
  - "不能理解业务语义，仅基于字段匹配，可能误拦看似危险实则安全的操作。"
open_questions:
  - "策略表达式能力有限时，如何平衡安全性和灵活性？"
  - "当策略复杂到需要维护人员理解整个系统时，是否会陷入配置泥潭？"
---

## Explanation

在代理的工具调用或动作执行之前，通过代码检查预先定义的显式规则来决定允许或拒绝，而不是依赖 LLM 的主观判断。 出处:https://github.com/microsoft/agent-governance-toolkit。See [[content/agent-governance-toolkit]]。

## Supported by
- [[claims/agent-governance-toolkit-main-claim]]
