---
name: "Agent Skill"
slug: "phuryn-pm-skills-agent-skill"
kind: "concept"
tags:
  - "agent"
  - "prompt-engineering"
  - "workflow"
maturity: "active"
first_seen_in: "phuryn-pm-skills"
related_content:
  - "phuryn-pm-skills"
related_concepts: []
explanation: "给 agent 自动加载的一块领域知识或操作流程；白话说，就是把专家做事方法写成可触发的 Markdown 指令。"
examples:
  - "`pm-product-discovery/skills/prioritize-assumptions/SKILL.md` 用 Impact x Risk 排序假设。"
  - "`pm-ai-shipping/skills/intended-vs-implemented/SKILL.md` 定义如何比较文档意图和代码实现。"
common_misunderstandings:
  - "skill 不是函数库；它没有强制执行逻辑。"
  - "skill 自动加载不等于模型一定完全遵守。"
open_questions:
  - "不同宿主 agent 对 SKILL.md 的加载和截断策略是否一致，仓库未说明。"
---

## Explanation

给 agent 自动加载的一块领域知识或操作流程；白话说，就是把专家做事方法写成可触发的 Markdown 指令。 出处:https://github.com/phuryn/pm-skills。See [[content/phuryn-pm-skills]]。

## Supported by
- [[claims/phuryn-pm-skills-main-claim]]
