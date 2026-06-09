---
name: "MCP vault tools"
slug: "mcp-vault-tools"
kind: "concept"
tags:
  - "mcp"
  - "agent-tools"
  - "local-files"
maturity: "active"
first_seen_in: "refactoringhq-tolaria"
related_content:
  - "refactoringhq-tolaria"
related_concepts: []
explanation: "把 vault 读写能力封装成 Model Context Protocol 工具，让外部 AI 客户端通过 stdio 调用。"
examples:
  - "mcp-server/index.js 暴露 `search_notes`、`get_note`、`create_note`、`open_note`"
  - "tests/smoke/mcp-config-copy.spec.ts 验证复制出的 config 含 `mcpServers.tolaria`"
common_misunderstandings:
  - "持久 MCP config 不绑定某一个 vault path；active vault 在调用时解析。"
  - "`create_note` 是窄写入能力，不等于任意文件编辑器。"
open_questions:
  - "不同 MCP client 对 annotations、stdio 生命周期和配置格式兼容性仍需实测。"
---

## Explanation

把 vault 读写能力封装成 Model Context Protocol 工具，让外部 AI 客户端通过 stdio 调用。 出处:https://github.com/refactoringhq/tolaria。See [[content/refactoringhq-tolaria]]。

## Supported by
- [[claims/refactoringhq-tolaria-main-claim]]
