---
name: "MCP 工具使用引导"
slug: "mcp-tool-steering"
kind: "concept"
tags:
  - "mcp"
  - "agent-workflow"
  - "tool-use"
maturity: "emerging"
first_seen_in: "colbymchenry-codegraph"
related_content:
  - "colbymchenry-codegraph"
related_concepts: []
explanation: "人话：工具不只暴露 API，还要告诉 agent 什么时候该用哪个。术语：CodeGraph 在 MCP initialize response 里发送 SERVER_INSTRUCTIONS。"
examples:
  - "`codegraph_explore` 作为结构问题默认入口"
  - "`codegraph_node` file 模式替代读取源文件"
common_misunderstandings:
  - "只注册 MCP 工具不够；agent 仍可能回到 grep/read。"
  - "过长说明会烧上下文；源码注释也提醒 keep it tight。"
open_questions:
  - "不同 agent 对 initialize 指令的遵循度是否一致，repo 未提供跨客户端实测。"
---

## Explanation

人话：工具不只暴露 API，还要告诉 agent 什么时候该用哪个。术语：CodeGraph 在 MCP initialize response 里发送 SERVER_INSTRUCTIONS。 出处:https://github.com/colbymchenry/codegraph。See [[content/colbymchenry-codegraph]]。

## Supported by
- [[claims/colbymchenry-codegraph-main-claim-2]]
