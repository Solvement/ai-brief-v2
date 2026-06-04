---
text: "Agent 内核构建在 MCP 之上，支持挂载外部 MCP 服务器"
slug: "ui-tars-desktop-main-claim"
kind: "claim"
content: "ui-tars-desktop"
source_pointer: "README Core Features: 'MCP Integration - The kernel is built on MCP and also supports mounting MCP Servers'"
evidence_strength: "high"
supports:
  - "mcp-kernel-agent"
  - "event-driven-agent-loop"
contradicts: []
open_challenges:
  - "未说明内核如何实现 MCP，也未列出实际可用的 MCP 服务器列表"
  - "MCP 协议本身仍在发展，兼容性可能随时间变化"
status: "supported"
---

## Claim

这个 Agent 的工具调用不是硬编码的，它使用标准协议 MCP，所以你可以轻松接入任何已支持的第三方工具。

证据:表明工具接口是统一且可扩展的。边界:未说明内核如何实现 MCP，也未列出实际可用的 MCP 服务器列表。风险:MCP 协议本身仍在发展，兼容性可能随时间变化。See [[content/ui-tars-desktop]]。
