---
text: "可以通过 MCP 接入多个 agent。"
slug: "colbymchenry-codegraph-main-claim-2"
kind: "claim"
content: "colbymchenry-codegraph"
source_pointer: "src/installer/targets/registry.ts；src/installer/targets/shared.ts"
evidence_strength: "high"
supports:
  - "code-knowledge-graph"
  - "mcp-tool-steering"
contradicts: []
open_challenges:
  - "没有证明这些客户端在 2026-06-09 的最新版本全部可用。"
  - "各 agent 配置格式会变；Antigravity 文件里已写到 unified/legacy config 路径迁移。"
status: "supported"
---

## Claim

不是只给 Claude Code 写死的插件；installer target 是模块化 registry。

证据:ALL_TARGETS 包含 claude、cursor、codex、opencode、hermes、gemini、antigravity、kiro；公共配置返回 command `codegraph` 和 args `serve --mcp`。。边界:没有证明这些客户端在 2026-06-09 的最新版本全部可用。。风险:各 agent 配置格式会变；Antigravity 文件里已写到 unified/legacy config 路径迁移。。See [[content/colbymchenry-codegraph]]。
