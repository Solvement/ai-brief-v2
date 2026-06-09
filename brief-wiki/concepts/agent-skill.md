---
name: "Agent Skill"
slug: "agent-skill"
kind: "concept"
tags:
  - "agent"
  - "skill"
  - "distribution"
maturity: "emerging"
first_seen_in: "mvanhorn-last30days-skill"
related_content:
  - "mvanhorn-last30days-skill"
related_concepts: []
explanation: "一种给 agent 宿主加载的能力包：`SKILL.md` 告诉模型怎么调用工具，同级 `scripts/` 放真正执行代码。白话说，它是“提示词合约 + 可执行工具”的打包单元。"
examples:
  - "`skills/last30days/SKILL.md`"
  - "`npx skills add mvanhorn/last30days-skill -g`"
  - "`/plugin marketplace add mvanhorn/last30days-skill`"
common_misunderstandings:
  - "把它当普通 CLI；项目文档明确 slash command 是主路径，Python CLI 是 fallback。"
  - "以为安装一次就能自动覆盖所有宿主；README 说明 Claude Code marketplace 和 npx 安装可并存且会出现两个入口。"
open_questions:
  - "50+ host 的持续兼容性是否有集中 CI 未在仓库看到。"
---

## Explanation

一种给 agent 宿主加载的能力包：`SKILL.md` 告诉模型怎么调用工具，同级 `scripts/` 放真正执行代码。白话说，它是“提示词合约 + 可执行工具”的打包单元。 出处:https://github.com/mvanhorn/last30days-skill。See [[content/mvanhorn-last30days-skill]]。

## Supported by
- [[claims/mvanhorn-last30days-skill-main-claim]]
