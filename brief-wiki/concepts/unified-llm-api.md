---
name: "统一 LLM API 抽象 (unified multi-provider LLM API)"
slug: unified-llm-api
kind: concept
tags:
  - llm-api
  - architecture
maturity: stable
first_seen_in: pi-agent
related_content:
  - pi-agent
explanation: "用一层接口抹平不同厂商(OpenAI/Anthropic/Google…)模型的调用差异,业务/agent 逻辑只对接这一层,从而能自由换模型、比模型,而不改上层代码。"
examples:
  - "pi 的 pi-ai 包:统一多 provider LLM API。出处:github.com/badlogic/pi-mono(@earendil-works/pi-ai)。"
common_misunderstandings:
  - "统一抽象常以『最小公约数』为代价——各家高级/独有能力可能在抽象层丢失或需特例。"
open_questions:
  - "AI-Brief 调用各家模型时,自建薄封装 vs 直接用 pi-ai / LiteLLM 这类现成统一层,哪个更省心?"
---

## Explanation

把 provider 差异收敛到一层,是任何要『换模型/比模型/防供应商锁定』的系统的基础件——对 AI-Brief 的模型调用层直接适用。代价是边角能力的损耗。出处:github.com/badlogic/pi-mono。See [[content/pi-agent]]。
