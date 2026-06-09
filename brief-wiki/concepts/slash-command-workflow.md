---
name: "Slash Command Workflow"
slug: "slash-command-workflow"
kind: "concept"
tags:
  - "claude-code"
  - "workflow"
  - "pm"
maturity: "active"
first_seen_in: "phuryn-pm-skills"
related_content:
  - "phuryn-pm-skills"
related_concepts: []
explanation: "用户输入 `/command` 后触发的多步骤工作流；白话说，就是把一次复杂咨询拆成固定剧本。"
examples:
  - "`/discover` 串起想法、假设、排序、实验和 Discovery Plan。"
  - "`/ship-check` 串起文档、agent context、安全审计、性能审计、测试覆盖和 shipping packet。"
common_misunderstandings:
  - "slash command 不是所有 AI 工具都支持；README 自称 Codex 不把它作为 Codex slash command 运行。"
  - "command 文件是 Markdown 指令，不是可测试状态机。"
open_questions:
  - "Claude/Cowork 在长流程中如何处理中途用户选择和上下文长度，仓库未给 transcript。"
---

## Explanation

用户输入 `/command` 后触发的多步骤工作流；白话说，就是把一次复杂咨询拆成固定剧本。 出处:https://github.com/phuryn/pm-skills。See [[content/phuryn-pm-skills]]。

## Supported by
- [[claims/phuryn-pm-skills-main-claim]]
