---
name: "基于 hook 的观察采集"
slug: "hook-based-observation-capture"
kind: "concept"
tags:
  - "hooks"
  - "observability"
  - "agent-workflow"
maturity: "active"
first_seen_in: "rohitg00-agentmemory"
related_content:
  - "rohitg00-agentmemory"
related_concepts: []
explanation: "人话：代理每次开始会话、提交提示、读写文件、工具完成时，顺手把事件发给记忆服务。术语：Claude 插件的 `plugin/hooks/hooks.json` 把生命周期事件映射到 `plugin/scripts/*.mjs`，REST `/agentmemory/observe` 再进入 `mem::observe`。"
examples:
  - "`PostToolUse` 调 `post-tool-use.mjs`。"
  - "`PreToolUse` matcher 是 `Edit|Write|Read|Glob|Grep`。"
common_misunderstandings:
  - "hook 采集不等于自动注入上下文；`AGENTMEMORY_INJECT_CONTEXT` 默认关闭。"
open_questions:
  - "不同 MCP/agent 客户端 hook 语义是否长期稳定未知。"
---

## Explanation

人话：代理每次开始会话、提交提示、读写文件、工具完成时，顺手把事件发给记忆服务。术语：Claude 插件的 `plugin/hooks/hooks.json` 把生命周期事件映射到 `plugin/scripts/*.mjs`，REST `/agentmemory/observe` 再进入 `mem::observe`。 出处:https://github.com/rohitg00/agentmemory。See [[content/rohitg00-agentmemory]]。

## Supported by
- [[claims/rohitg00-agentmemory-main-claim]]
