---
name: "Procedural Memory / Skills"
slug: "procedural-memory-skills"
kind: "concept"
tags:
  - "skills"
  - "memory"
  - "agents"
maturity: "active"
first_seen_in: "nousresearch-hermes-agent"
related_content:
  - "nousresearch-hermes-agent"
related_concepts: []
explanation: "普通话说：skill 是把“这类事以后怎么做”写成可复用说明，而不是只记住一个事实。技术定义：Hermes 用 `SKILL.md` 加 references/templates/scripts/assets 表示技能，`skill_view` 负责按需加载，`skill_manage` 负责创建、编辑、patch 和写支持文件。"
examples:
  - "skills/software-development/test-driven-development/SKILL.md"
  - "tools/skill_manager_tool.py MAX_SKILL_CONTENT_CHARS = 100_000"
common_misunderstandings:
  - "把 skill 当成普通偏好记忆；skill 更适合过程和操作步骤。"
  - "以为 agent-created skill 默认强安全扫描；源码显示 `skills.guard_agent_created` 默认 false。"
open_questions:
  - "自动创建和自我改进 skill 的真实触发策略需要运行后确认。"
---

## Explanation

普通话说：skill 是把“这类事以后怎么做”写成可复用说明，而不是只记住一个事实。技术定义：Hermes 用 `SKILL.md` 加 references/templates/scripts/assets 表示技能，`skill_view` 负责按需加载，`skill_manage` 负责创建、编辑、patch 和写支持文件。 出处:https://github.com/nousresearch/hermes-agent。See [[content/nousresearch-hermes-agent]]。

## Supported by
- [[claims/nousresearch-hermes-agent-main-claim]]
