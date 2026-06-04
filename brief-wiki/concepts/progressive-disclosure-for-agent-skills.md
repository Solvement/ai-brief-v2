---
name: "Progressive Disclosure for Agent Skills"
slug: "progressive-disclosure-for-agent-skills"
kind: "concept"
tags:
  - "agent"
  - "knowledge-management"
  - "token-efficiency"
maturity: "active"
first_seen_in: "anthropic-cybersecurity-skills"
related_content:
  - "anthropic-cybersecurity-skills"
related_concepts: []
explanation: "一种设计模式，将 AI 代理需要的专业知识分为轻量元数据（YAML frontmatter）和详细工作流（Markdown body），代理先通过元数据扫描快速匹配相关条目，再按需加载执行步骤，从而在大规模知识库中保持低 token 消耗。"
examples:
  - "每个技能如 performing-memory-forensics-with-volatility3，其 SKILL.md 的 YAML frontmatter 约 30 token，完整文档约 500-2000 token。"
common_misunderstandings:
  - "并非所有技能都必须遵循此结构；技能的实际 token 数可能因长描述而异。"
open_questions:
  - "代理如何确定加载哪些完整工作流？是否有评分机制？"
---

## Explanation

一种设计模式，将 AI 代理需要的专业知识分为轻量元数据（YAML frontmatter）和详细工作流（Markdown body），代理先通过元数据扫描快速匹配相关条目，再按需加载执行步骤，从而在大规模知识库中保持低 token 消耗。 出处:https://github.com/mukul975/anthropic-cybersecurity-skills。See [[content/anthropic-cybersecurity-skills]]。

## Supported by
- [[claims/anthropic-cybersecurity-skills-main-claim]]
