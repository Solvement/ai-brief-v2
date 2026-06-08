---
name: "上下文压缩层"
slug: "context-compression-layer"
kind: "concept"
tags:
  - "llm"
  - "agent"
  - "compression"
  - "proxy"
maturity: "active"
first_seen_in: "chopratejas-headroom"
related_content:
  - "chopratejas-headroom"
related_concepts: []
explanation: "人话：在消息送进 LLM 之前，先把工具输出、日志、RAG 结果等大块内容缩小。术语：Headroom 把这个层做成 `compress()`、HTTP proxy、MCP server 和 framework adapter，默认入口最后进入 `CacheAligner -> ContentRouter` 管线。"
examples:
  - "`from headroom import compress` 后调用 `compress(messages, model=\"gpt-4o\")`"
  - "`headroom proxy --port 8787` 后设置 `OPENAI_BASE_URL=http://localhost:8787/v1`"
common_misunderstandings:
  - "不是所有内容都会被压缩；user/system/developer、近期代码、小内容默认会跳过。"
  - "TypeScript SDK 不是纯本地算法实现，它默认调用本地 proxy。"
open_questions:
  - "在不同团队真实 agent 流量上，压缩节省和 retrieve 开销的净收益是多少？"
---

## Explanation

人话：在消息送进 LLM 之前，先把工具输出、日志、RAG 结果等大块内容缩小。术语：Headroom 把这个层做成 `compress()`、HTTP proxy、MCP server 和 framework adapter，默认入口最后进入 `CacheAligner -> ContentRouter` 管线。 出处:https://github.com/chopratejas/headroom。See [[content/chopratejas-headroom]]。

## Supported by
- [[claims/chopratejas-headroom-main-claim]]
