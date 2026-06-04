---
name: "Policy Decision Point"
slug: "policy-decision-point"
kind: "concept"
tags:
  - "policy"
  - "authorization"
  - "acs"
maturity: "active"
first_seen_in: "microsoft-agent-governance-toolkit"
related_content:
  - "microsoft-agent-governance-toolkit"
related_concepts: []
explanation: "人话：负责判断能不能做的脑子。技术词：PDP 接收完整上下文或 snapshot，按 policy 返回标准 verdict；AGT 的 policy-engine/ACS 是这个角色。"
examples:
  - "policy-engine README 描述 ACS native runtime over Rust core performs deterministic decision."
common_misunderstandings:
  - "PDP 不一定执行动作；它只给决策，执行在 PEP。"
open_questions:
  - "ACS 当前 0.3.1-beta/alpha 口径在文档和包版本之间需要确认。"
---

## Explanation

人话：负责判断能不能做的脑子。技术词：PDP 接收完整上下文或 snapshot，按 policy 返回标准 verdict；AGT 的 policy-engine/ACS 是这个角色。 出处:https://github.com/microsoft/agent-governance-toolkit。See [[content/microsoft-agent-governance-toolkit]]。

## Supported by
- [[claims/microsoft-agent-governance-toolkit-main-claim]]
