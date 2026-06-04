---
name: "MCP 工具集成"
slug: "mcp-tool-integration"
kind: "concept"
tags:
  - "mcp"
  - "tool-calling"
  - "integration"
maturity: "active"
first_seen_in: "codegraph"
related_content:
  - "codegraph"
related_concepts: []
explanation: "通过 Model Context Protocol 将自定义工具注册到 AI 助手的工具列表中，使 LLM 能直接调用本地功能。CodeGraph 借此让 agent 用自然语言查询代码结构，而非笨拙的文件操作。"
examples:
  - "`codegraph serve --mcp` 启动 MCP 服务器，`codegraph install` 自动将其配置到 Claude Code、Cursor 等，agent 随后可调用 `codegraph_explore`。"
common_misunderstandings:
  - "MCP 不是取代 API 调用，而是标准化工具描述和传输。"
  - "CodeGraph 的 MCP 服务器只提供代码探索，不提供其他工具；它不是通用 MCP 网关。"
open_questions:
  - "MCP 协议未来变化会不会导致 CodeGraph 的集成方式过时？"
  - "非 MCP 原生 agent 如何接入？"
---

## Explanation

通过 Model Context Protocol 将自定义工具注册到 AI 助手的工具列表中，使 LLM 能直接调用本地功能。CodeGraph 借此让 agent 用自然语言查询代码结构，而非笨拙的文件操作。 出处:https://github.com/colbymchenry/codegraph。See [[content/codegraph]]。

## Supported by
- [[claims/codegraph-main-claim]]
