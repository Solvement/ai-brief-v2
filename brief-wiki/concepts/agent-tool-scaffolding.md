---
name: "Agent 工具脚手架"
slug: "agent-tool-scaffolding"
kind: "concept"
tags:
  - "agents"
  - "tooling"
  - "cli"
maturity: "emerging"
first_seen_in: "panniantong-agent-reach"
related_content:
  - "panniantong-agent-reach"
related_concepts: []
explanation: "先人话：不是替 Agent 思考，而是替 Agent 准备可调用工具。术语：把安装、配置、健康检查、命令参考和 Skill 路由打包成一层开发者工具。"
examples:
  - "`agent-reach install --env=auto` 安装核心渠道"
  - "`agent-reach doctor` 检查 channel 状态"
common_misunderstandings:
  - "误以为它是 agent framework"
  - "误以为它代理所有平台请求"
open_questions:
  - "不同 Agent 产品对 Skill 文件的加载规则是否长期稳定"
---

## Explanation

先人话：不是替 Agent 思考，而是替 Agent 准备可调用工具。术语：把安装、配置、健康检查、命令参考和 Skill 路由打包成一层开发者工具。 出处:https://github.com/panniantong/agent-reach。See [[content/panniantong-agent-reach]]。

## Supported by
- [[claims/panniantong-agent-reach-main-claim]]
