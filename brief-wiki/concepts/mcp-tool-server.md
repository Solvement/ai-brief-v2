---
name: "MCP 工具服务器"
slug: "mcp-tool-server"
kind: "concept"
tags:
  - "mcp"
  - "tool"
  - "integration"
maturity: "active"
first_seen_in: "agentmemory"
related_content:
  - "agentmemory"
related_concepts: []
explanation: "遵循 Model Context Protocol 的工具提供服务，允许语言模型在对话中动态调用自定义工具。每个工具定义名称、描述和 JSON Schema 参数。"
examples:
  - "agentmemory 提供 store_reasoning_trace（存储推理链）、find_relevant_memories（查找相关记忆）等 53 个 MCP 工具。"
common_misunderstandings:
  - "MCP 工具服务器不处理自然语言，它只接收结构化的工具调用请求并返回结果。"
open_questions:
  - "如何管理工具的数量和粒度，以避免上下文膨胀？"
---

## Explanation

遵循 Model Context Protocol 的工具提供服务，允许语言模型在对话中动态调用自定义工具。每个工具定义名称、描述和 JSON Schema 参数。 出处:https://github.com/rohitg00/agentmemory。See [[content/agentmemory]]。

## Supported by
- [[claims/agentmemory-main-claim]]
