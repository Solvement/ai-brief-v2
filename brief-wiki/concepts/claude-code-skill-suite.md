---
name: "Claude Code Skill 套件"
slug: "claude-code-skill-suite"
kind: "concept"
tags:
  - "claude-code"
  - "agent-framework"
  - "workflow"
maturity: "active"
first_seen_in: "imbad0202-academic-research-skills"
related_content:
  - "imbad0202-academic-research-skills"
related_concepts: []
explanation: "把复杂工作流拆成多个 `SKILL.md`、命令、hooks 和 agent prompt，由 Claude Code runtime 负责发现与执行。白话说，就是给 Claude Code 装一套专业工位，而不是发一段万能 prompt。"
examples:
  - "deep-research/SKILL.md"
  - "academic-paper/SKILL.md"
  - "commands/ars-full.md"
  - "hooks/hooks.json"
common_misunderstandings:
  - "不是普通 Python SDK；`pyproject.toml` 不是产品入口。"
  - "装到 claude.ai Project 只能作为知识读取，不等于执行 Claude Code workflow。"
open_questions:
  - "Claude Code plugin API 变动时，hooks 和 commands 的兼容性如何维护？"
---

## Explanation

把复杂工作流拆成多个 `SKILL.md`、命令、hooks 和 agent prompt，由 Claude Code runtime 负责发现与执行。白话说，就是给 Claude Code 装一套专业工位，而不是发一段万能 prompt。 出处:https://github.com/imbad0202/academic-research-skills。See [[content/imbad0202-academic-research-skills]]。

## Supported by
- [[claims/imbad0202-academic-research-skills-main-claim]]
