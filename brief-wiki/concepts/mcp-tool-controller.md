---
name: "MCP 工具控制器"
slug: "mcp-tool-controller"
kind: "concept"
tags:
  - "mcp"
  - "nestjs"
  - "agent-tools"
maturity: "active"
first_seen_in: "yikart-aitoearn"
related_content:
  - "yikart-aitoearn"
related_concepts: []
explanation: "人话：把后端能力包装成 Agent 能调用的按钮。术语：AiToEarn 用 `@Tool` 标注 NestJS controller 方法，配 Zod schema 和 description，MCP registry 在启动时扫描并注册这些工具。"
examples:
  - "`getAccountGroupList` 返回账号组"
  - "`createDraft` 创建草稿"
  - "`publishPostToYoutube` 创建发布任务并返回 FlowId"
common_misunderstandings:
  - "MCP 工具不是普通 prompt，它会执行真实后端副作用。"
  - "有平台限制表不等于该平台有自动发布工具。"
open_questions:
  - "单独 `/account/mcp`、`/content/mcp`、`/publish/mcp` 模块是否在运行时被导入？"
---

## Explanation

人话：把后端能力包装成 Agent 能调用的按钮。术语：AiToEarn 用 `@Tool` 标注 NestJS controller 方法，配 Zod schema 和 description，MCP registry 在启动时扫描并注册这些工具。 出处:https://github.com/yikart/aitoearn。See [[content/yikart-aitoearn]]。

## Supported by
- [[claims/yikart-aitoearn-main-claim]]
