---
name: "Agent Tool Scaffolding"
slug: "tool-scaffolding"
kind: "concept"
tags:
  - "agent"
  - "integration"
  - "patterns"
maturity: "active"
first_seen_in: "agent-reach"
related_content:
  - "agent-reach"
related_concepts: []
explanation: "一种为 AI Agent 预先集成和配置命令行工具的范式，通过技能映射文件（SKILL.md）和渠道健康检查器，让 Agent 在运行时能够自动选择并执行正确的工具，而不需要开发者逐个编写胶水代码。"
examples:
  - "Agent Reach 的 channels/ 目录和 SKILL.md 注册流程"
  - "类似 pattern 也可用于将数据库客户端、云服务 CLI 集成给 Agent"
common_misunderstandings:
  - "不是 Agent 框架，它不实现 agent loop 或规划"
open_questions:
  - "如何动态发现新工具而不重启 Agent？"
  - "如何保证技能映射（SKILL.md）与工具版本同步？"
---

## Explanation

一种为 AI Agent 预先集成和配置命令行工具的范式，通过技能映射文件（SKILL.md）和渠道健康检查器，让 Agent 在运行时能够自动选择并执行正确的工具，而不需要开发者逐个编写胶水代码。 出处:https://github.com/panniantong/agent-reach。See [[content/agent-reach]]。

## Supported by
- [[claims/agent-reach-main-claim]]
