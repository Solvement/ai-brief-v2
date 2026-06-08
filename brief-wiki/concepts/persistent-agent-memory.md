---
name: "持久代理记忆"
slug: "persistent-agent-memory"
kind: "concept"
tags:
  - "agents"
  - "memory"
  - "mcp"
maturity: "active"
first_seen_in: "rohitg00-agentmemory"
related_content:
  - "rohitg00-agentmemory"
related_concepts: []
explanation: "人话：把代理做过的决定、错误、偏好和会话结果保存下来，下次能查。术语：agentmemory 用 KV scopes 保存 sessions、observations、memories、lessons 等，并通过 MCP/REST 暴露 recall/save/search。"
examples:
  - "`mem::remember` 写 `KV.memories`。"
  - "`memory_smart_search` 返回 compact observation IDs。"
common_misunderstandings:
  - "不是把全部历史塞回 prompt；它先检索再返回相关片段。"
  - "不是完整 agent runtime；它是记忆层。"
open_questions:
  - "默认 embedding 是否真的开箱即用需运行确认。"
---

## Explanation

人话：把代理做过的决定、错误、偏好和会话结果保存下来，下次能查。术语：agentmemory 用 KV scopes 保存 sessions、observations、memories、lessons 等，并通过 MCP/REST 暴露 recall/save/search。 出处:https://github.com/rohitg00/agentmemory。See [[content/rohitg00-agentmemory]]。

## Supported by
- [[claims/rohitg00-agentmemory-main-claim]]
