---
name: "Connector-First Broker Abstraction"
slug: "connector-first-broker-abstraction"
kind: "concept"
tags:
  - "infra"
  - "trading"
maturity: "active"
first_seen_in: "vibe-trading"
related_content:
  - "vibe-trading"
related_concepts: []
explanation: "交易后端抽象为可选择的连接器 profile，每个连接器明确声明其能力层级：只读、paper 下单、live 下单（受 mandate 保护）。paper/live 隔离通过结构性手段（账号格式、主机分离等）保证。"
examples:
  - "用 `vibe-trading connector use robinhood-paper` 切换到 Robinhood paper 环境，交易工具透明切换。"
common_misunderstandings:
  - "连接器之间不保证统一接口，每个 broker 的 API 特殊性仍可能暴露。"
open_questions:
  - "如何保证 paper 环境与 live 环境的行为一致性？"
  - "连接器配置的复杂度是否对普通用户友好？"
---

## Explanation

交易后端抽象为可选择的连接器 profile，每个连接器明确声明其能力层级：只读、paper 下单、live 下单（受 mandate 保护）。paper/live 隔离通过结构性手段（账号格式、主机分离等）保证。 出处:https://github.com/hkuds/vibe-trading。See [[content/vibe-trading]]。

## Supported by
- [[claims/vibe-trading-main-claim]]
