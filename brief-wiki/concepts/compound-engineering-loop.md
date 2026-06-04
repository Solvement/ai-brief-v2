---
name: "Compound Engineering Loop"
slug: "compound-engineering-loop"
kind: "concept"
tags:
  - "agent-design"
  - "workflow"
  - "knowledge-management"
maturity: "active"
first_seen_in: "compound-engineering-plugin"
related_content:
  - "compound-engineering-plugin"
related_concepts: []
explanation: "一个固定的 AI 辅助开发循环：需求分析（brainstorm）→ 实现计划（plan）→ 执行（work）→ 审查（review）→ 知识固化（compound），每步产出可被后续步骤甚至后续项目复用的文档。"
examples:
  - "README 中的 Quick Example：/ce-brainstorm → /ce-plan → /ce-work → /ce-code-review → /ce-compound"
common_misunderstandings:
  - "不是非此即彼的退出机制，而是所有步骤都产生落地的 artifact，即使中途停止也能保留部分成果。"
open_questions:
  - "当知识库膨胀时，Agent 如何高效检索相关笔记？"
  - "循环如何适应需要快速试错的探索性任务？"
---

## Explanation

一个固定的 AI 辅助开发循环：需求分析（brainstorm）→ 实现计划（plan）→ 执行（work）→ 审查（review）→ 知识固化（compound），每步产出可被后续步骤甚至后续项目复用的文档。 出处:https://github.com/everyinc/compound-engineering-plugin。See [[content/compound-engineering-plugin]]。

## Supported by
- [[claims/compound-engineering-plugin-main-claim]]
