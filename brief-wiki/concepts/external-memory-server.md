---
name: "外部记忆服务器"
slug: "external-memory-server"
kind: "concept"
tags:
  - "memory"
  - "server"
  - "agent"
maturity: "active"
first_seen_in: "agentmemory"
related_content:
  - "agentmemory"
related_concepts: []
explanation: "作为独立进程运行，为 AI 代理提供持久记忆的读写服务。代理通过 RPC（如 MCP）或 REST API 与之交互，实现记忆与代理逻辑解耦。"
examples:
  - "agentmemory 启动后，Claude Code 通过 MCP 工具 store_memory、recall_memory 存取记忆。"
common_misunderstandings:
  - "记忆服务器不是向量数据库，它内部封装了存储和搜索逻辑，对外暴露高层语义工具。"
open_questions:
  - "如何设计记忆的过期与清理策略？"
---

## Explanation

作为独立进程运行，为 AI 代理提供持久记忆的读写服务。代理通过 RPC（如 MCP）或 REST API 与之交互，实现记忆与代理逻辑解耦。 出处:https://github.com/rohitg00/agentmemory。See [[content/agentmemory]]。

## Supported by
- [[claims/agentmemory-main-claim]]
