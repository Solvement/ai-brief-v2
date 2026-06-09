---
name: "Agent 技能文件"
slug: "agent-skill-file"
kind: "concept"
tags:
  - "agent"
  - "skill"
  - "prompt-engineering"
maturity: "emerging"
first_seen_in: "leonxlnx-taste-skill"
related_content:
  - "leonxlnx-taste-skill"
related_concepts: []
explanation: "一种可移植的 Markdown 文件，包含 Agent 在生成输出时应遵循的指令或约束，通常通过 CLI 工具或直接复制到项目中使用。"
examples:
  - "本项目的 taste-skill、minimalist-skill 等。"
common_misunderstandings:
  - "误认为技能文件是插件或可以强制改变模型输出；实际只是建议性指令，模型可能不遵循。"
open_questions:
  - "如何验证技能文件被 Agent 完整且正确地执行？"
---

## Explanation

一种可移植的 Markdown 文件，包含 Agent 在生成输出时应遵循的指令或约束，通常通过 CLI 工具或直接复制到项目中使用。 出处:https://github.com/leonxlnx/taste-skill。See [[content/leonxlnx-taste-skill]]。

## Supported by
- [[claims/leonxlnx-taste-skill-main-claim]]
