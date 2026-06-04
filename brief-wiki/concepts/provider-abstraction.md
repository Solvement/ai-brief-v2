---
name: "供应商抽象层"
slug: "provider-abstraction"
kind: "concept"
tags:
  - "llm-provider"
  - "abstraction"
  - "ui-ux"
maturity: "active"
first_seen_in: "hermes-desktop"
related_content:
  - "hermes-desktop"
related_concepts: []
explanation: "统一管理多个 LLM 供应商的 API 密钥、端点配置和模型列表，通过 UI 切换，无需修改代码。"
examples:
  - "Hermes Desktop 支持 OpenRouter、Anthropic、OpenAI、Ollama 等 11 种供应商。"
common_misunderstandings:
  - "不是只做转发，而是针对每个供应商进行了专门的 UI 配置适配。"
open_questions:
  - "如何在添加新供应商时保持抽象层的简洁性？"
---

## Explanation

统一管理多个 LLM 供应商的 API 密钥、端点配置和模型列表，通过 UI 切换，无需修改代码。 出处:https://github.com/fathah/hermes-desktop。See [[content/hermes-desktop]]。

## Supported by
- [[claims/hermes-desktop-main-claim]]
