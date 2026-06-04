---
name: "Shared Language Memory（共享语言记忆）"
slug: "shared-language-memory"
kind: "concept"
tags:
  - "ddd"
  - "ubiquitous-language"
  - "memory"
  - "context"
maturity: "stable"
first_seen_in: "skills"
related_content:
  - "skills"
related_concepts: []
explanation: "通过维护一个 CONTEXT.md 文件，定义项目中的领域术语和缩写，使代理和开发者使用同一套词汇表，减少歧义和 token 消耗。"
examples:
  - "将'有材料化级联问题'简化为'materialization cascade'。"
common_misunderstandings:
  - "不是简单的术语表，而是需要与代理共同演化的活的文档。"
  - "不是一次性创建，而是通过 /grill-with-docs 持续更新。"
open_questions:
  - "如何确保共享语言的一致性在多个代理间保持？"
  - "共享语言是否对非英语团队同样有效？"
---

## Explanation

通过维护一个 CONTEXT.md 文件，定义项目中的领域术语和缩写，使代理和开发者使用同一套词汇表，减少歧义和 token 消耗。 出处:https://github.com/mattpocock/skills。See [[content/skills]]。

## Supported by
- [[claims/skills-main-claim]]
