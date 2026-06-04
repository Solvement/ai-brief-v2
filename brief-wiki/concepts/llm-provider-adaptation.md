---
name: "LLM 提供商适配"
slug: "llm-provider-adaptation"
kind: "concept"
tags:
  - "llm"
  - "integration"
maturity: "stable"
first_seen_in: "moneyprinterturbo"
related_content:
  - "moneyprinterturbo"
related_concepts: []
explanation: "通过配置文件动态切换不同的 LLM 服务，实现后端模型无侵入变更，降低对单一供应商的依赖。"
examples:
  - "MoneyPrinterTurbo 支持 OpenAI、Gemini、DeepSeek 等，通过修改 config.toml 中的 llm_provider 字段即可切换。"
common_misunderstandings:
  - "所有模型输出可直接互换使用；但实际上不同模型的文案风格、长度可能差异较大，需要后续适配提示词。"
open_questions:
  - "如何统一不同模型的输出质量？是否有自动评分和选择机制？"
---

## Explanation

通过配置文件动态切换不同的 LLM 服务，实现后端模型无侵入变更，降低对单一供应商的依赖。 出处:https://github.com/harry0703/moneyprinterturbo。See [[content/moneyprinterturbo]]。

## Supported by
- [[claims/moneyprinterturbo-main-claim]]
