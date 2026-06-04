---
name: "MCP 即内核的 Agent"
slug: "mcp-kernel-agent"
kind: "concept"
tags:
  - "agent-architecture"
  - "mcp"
  - "tool-integration"
maturity: "active"
first_seen_in: "ui-tars-desktop"
related_content:
  - "ui-tars-desktop"
related_concepts: []
explanation: "将 Agent 的核心架构基于 MCP（Model Context Protocol）构建，所有工具都以 MCP Server 的形式接入，Agent 运行时通过 MCP 客户端发现和调用工具，实现工具即插即用。这种设计解耦了工具提供与 Agent 调度，大幅降低扩展成本。"
examples:
  - "Agent TARS 的 CLI 就是基于 @agent-tars/cli 包，内部通过 MCP 与浏览器自动化、命令行、第三方 API 工具通信"
common_misunderstandings:
  - "不是说 Agent 替换了 MCP，而是 Agent 的循环调度本身就使用 MCP 协议与各个工具交互"
  - "MCP 不等于工具本身，它只是通信协议"
open_questions:
  - "如何动态发现和管理大量的 MCP 工具而不会让 LLM 上下文过载？"
  - "错误处理与重试机制在 MCP 协议层面如何与 Agent loop 交互？"
---

## Explanation

将 Agent 的核心架构基于 MCP（Model Context Protocol）构建，所有工具都以 MCP Server 的形式接入，Agent 运行时通过 MCP 客户端发现和调用工具，实现工具即插即用。这种设计解耦了工具提供与 Agent 调度，大幅降低扩展成本。 出处:https://github.com/bytedance/ui-tars-desktop。See [[content/ui-tars-desktop]]。

## Supported by
- [[claims/ui-tars-desktop-main-claim]]
