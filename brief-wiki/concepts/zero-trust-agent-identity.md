---
name: "零信任代理身份"
slug: "zero-trust-agent-identity"
kind: "concept"
tags:
  - "identity"
  - "zero-trust"
  - "agent"
maturity: "active"
first_seen_in: "agent-governance-toolkit"
related_content:
  - "agent-governance-toolkit"
related_concepts: []
explanation: "为每个 AI 代理分配唯一的、可验证的身份（如基于 SPIFFE/DID），并基于该身份授权，而非依赖共享的 API 密钥。"
examples:
  - "AGT 的 Agent Mesh 使用 DID 和 mTLS 来区分同一凭证下的多个代理。"
common_misunderstandings:
  - "零信任不是‘不信任’，而是‘从不假设可信，始终验证’。"
  - "身份本身不保证行为安全，需要结合策略引擎。"
open_questions:
  - "在快速变化的微代理环境中，身份的生命周期管理如何自动化？"
  - "DID 和 SPIFFE 的采用成本对团队有多高？"
---

## Explanation

为每个 AI 代理分配唯一的、可验证的身份（如基于 SPIFFE/DID），并基于该身份授权，而非依赖共享的 API 密钥。 出处:https://github.com/microsoft/agent-governance-toolkit。See [[content/agent-governance-toolkit]]。

## Supported by
- [[claims/agent-governance-toolkit-main-claim]]
