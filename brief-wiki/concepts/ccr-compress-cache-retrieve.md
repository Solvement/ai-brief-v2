---
name: "CCR 可逆压缩"
slug: "ccr-compress-cache-retrieve"
kind: "concept"
tags:
  - "compression"
  - "agent-tools"
  - "retrieval"
maturity: "active"
first_seen_in: "chopratejas-headroom"
related_content:
  - "chopratejas-headroom"
related_concepts: []
explanation: "先压缩给模型看，再把原文存在本地缓存；模型需要细节时用 hash 调 `headroom_retrieve` 取回。它降低丢信息风险，但不等于永久保存。"
examples:
  - "MCP `headroom_compress` 存原文并返回 hash"
  - "proxy `/v1/retrieve` 根据 hash 取回 CompressionStore 条目"
common_misunderstandings:
  - "以为可逆等于永不过期；默认 proxy store TTL 是 300 秒。"
  - "以为不需要工具调用；模型要原文时仍需 retrieval 工具或客户端处理。"
open_questions:
  - "长会话中 TTL 和容量淘汰如何配置才适合生产工作流？"
---

## Explanation

先压缩给模型看，再把原文存在本地缓存；模型需要细节时用 hash 调 `headroom_retrieve` 取回。它降低丢信息风险，但不等于永久保存。 出处:https://github.com/chopratejas/headroom。See [[content/chopratejas-headroom]]。

## Supported by
- [[claims/chopratejas-headroom-main-claim-2]]
