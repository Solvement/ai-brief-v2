---
name: "Grilling Session（盘问会话）"
slug: "grilling-session"
kind: "concept"
tags:
  - "alignment"
  - "requirements-engineering"
  - "agent-interaction"
maturity: "stable"
first_seen_in: "skills"
related_content:
  - "skills"
related_concepts: []
explanation: "在开始编码前，代理向开发者提出一系列详细问题，以澄清需求、边界条件和设计选择。目的是对齐双方的认知模型。"
examples:
  - "/grill-me 对任何计划进行盘问，/grill-with-docs 额外更新 CONTEXT.md 和 ADR。"
common_misunderstandings:
  - "不是简单的 checklist，而是对话式的深度挖掘。"
  - "不仅适用于代码，也适用于通用工作流（/grill-me）。"
open_questions:
  - "如何防止盘问偏移到无关细节？"
  - "盘问会话的耗时是否在大型项目中可接受？"
---

## Explanation

在开始编码前，代理向开发者提出一系列详细问题，以澄清需求、边界条件和设计选择。目的是对齐双方的认知模型。 出处:https://github.com/mattpocock/skills。See [[content/skills]]。

## Supported by
- [[claims/skills-main-claim]]
