---
text: "提供本地 MCP 服务器给代理调用。"
slug: "colbymchenry-codegraph-main-claim"
kind: "claim"
content: "colbymchenry-codegraph"
source_pointer: "README CLI Reference；README MCP Tools；src/bin/codegraph.ts serve command；src/installer/targets/shared.ts getMcpServerConfig"
evidence_strength: "high"
supports:
  - "mcp-code-index"
  - "sqlite-knowledge-graph"
contradicts: []
open_challenges:
  - "不证明所有代理实际都能稳定加载，只证明仓库实现了配置写入和 MCP 入口。"
  - "不同 MCP 客户端的配置格式和权限模型会变；安装目标文件需要持续维护。"
status: "supported"
---

## Claim

代理不是直接读数据库，而是通过 `codegraph serve --mcp` 暴露的一组工具访问索引。

证据:`getMcpServerConfig()` 返回 `{ type: 'stdio', command: 'codegraph', args: ['serve', '--mcp'] }`；README 列出 8 个 MCP 工具。。边界:不证明所有代理实际都能稳定加载，只证明仓库实现了配置写入和 MCP 入口。。风险:不同 MCP 客户端的配置格式和权限模型会变；安装目标文件需要持续维护。。See [[content/colbymchenry-codegraph]]。
