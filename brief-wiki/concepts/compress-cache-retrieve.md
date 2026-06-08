---
name: "CCR：压缩-缓存-取回"
slug: "compress-cache-retrieve"
kind: "concept"
tags:
  - "retrieval"
  - "mcp"
  - "cache"
  - "context"
maturity: "active"
first_seen_in: "chopratejas-headroom"
related_content:
  - "chopratejas-headroom"
related_concepts: []
explanation: "人话：先把长内容压短，同时把原文存起来；模型需要细节时用 hash 取回。术语：`CompressionStore` 默认 SHA-256[:24] hash、TTL 300 秒、BM25 search；MCP `headroom_retrieve` 接受 `hash` 和可选 `query`。"
examples:
  - "`headroom_compress(content=\"[5000 lines of grep results...]\")` 返回 `hash`"
  - "`headroom_retrieve(hash=\"...\", query=\"authentication errors\")` 搜索缓存原文"
common_misunderstandings:
  - "可取回不等于模型一开始就看过全部原文。"
  - "hash 过期或 proxy/store 不同进程会影响取回。"
open_questions:
  - "长任务中 store TTL 和跨进程持久化策略是否足够稳定？"
---

## Explanation

人话：先把长内容压短，同时把原文存起来；模型需要细节时用 hash 取回。术语：`CompressionStore` 默认 SHA-256[:24] hash、TTL 300 秒、BM25 search；MCP `headroom_retrieve` 接受 `hash` 和可选 `query`。 出处:https://github.com/chopratejas/headroom。See [[content/chopratejas-headroom]]。

## Supported by
- [[claims/chopratejas-headroom-main-claim]]
