---
name: "MCP 代码索引工具"
slug: "mcp-code-index"
kind: "concept"
tags:
  - "mcp"
  - "agent-tools"
  - "code-intelligence"
maturity: "active"
first_seen_in: "colbymchenry-codegraph"
related_content:
  - "colbymchenry-codegraph"
related_concepts: []
explanation: "白话：把代码库先建索引，再作为 MCP 工具给代理调用。术语：CodeGraph 用 stdio MCP server 暴露 `codegraph_explore/search/node/impact` 等工具，agent config 里启动命令是 `codegraph serve --mcp`。"
examples:
  - "`src/installer/targets/shared.ts` 的 `getMcpServerConfig()`"
  - "`src/mcp/tools.ts` 的 `tools` 定义"
common_misunderstandings:
  - "MCP 只是通信接口，不自动带来代码理解；理解来自背后的索引和解析器。"
  - "安装 CLI 不等于代理已接入，README 明确需要 `codegraph install`。"
open_questions:
  - "不同代理是否完整遵守 MCP initialize instructions，需要逐个验证。"
---

## Explanation

白话：把代码库先建索引，再作为 MCP 工具给代理调用。术语：CodeGraph 用 stdio MCP server 暴露 `codegraph_explore/search/node/impact` 等工具，agent config 里启动命令是 `codegraph serve --mcp`。 出处:https://github.com/colbymchenry/codegraph。See [[content/colbymchenry-codegraph]]。

## Supported by
- [[claims/colbymchenry-codegraph-main-claim]]
