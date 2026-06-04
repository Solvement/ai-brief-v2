---
name: "CacheAligner"
slug: "cachealigner"
kind: "concept"
tags:
  - "caching"
  - "optimization"
  - "prompt-engineering"
maturity: "active"
first_seen_in: "headroom"
related_content:
  - "headroom"
related_concepts: []
explanation: "一种前缀稳定化技术，确保经过压缩的提示在传递给 LLM 时，其前缀与提供商的 KV 缓存布局对齐，从而提高缓存命中率，降低首 token 延迟。"
examples:
  - "在对一系列相似请求进行压缩时，CacheAligner 保证相同前缀在 token 序列中位置固定，使 Anthropic 或 OpenAI 的缓存生效。"
common_misunderstandings:
  - "它并不压缩内容本身，而是调整已压缩内容的序列化方式。"
  - "只有使用支持 KV 缓存的提供商的 API 时才有意义。"
open_questions:
  - "在多个代理并发时，缓存对齐的一致性如何保证？"
  - "对齐策略是否依赖特定模型版本？"
---

## Explanation

一种前缀稳定化技术，确保经过压缩的提示在传递给 LLM 时，其前缀与提供商的 KV 缓存布局对齐，从而提高缓存命中率，降低首 token 延迟。 出处:https://github.com/chopratejas/headroom。See [[content/headroom]]。

## Supported by
- [[claims/headroom-main-claim]]
