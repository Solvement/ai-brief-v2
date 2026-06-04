---
name: "本地 API 网关"
slug: "local-api-gateway"
kind: "concept"
tags:
  - "gateway"
  - "routing"
  - "cost-control"
maturity: "active"
first_seen_in: "9router"
related_content:
  - "9router"
related_concepts: []
explanation: "在开发者本机运行的代理服务，统一接收 AI 请求，根据预设路由和实时状态（如配额）将请求分发至不同后端模型。"
examples:
  - "9Router 的三层自动回退：订阅 → 廉价 → 免费"
common_misunderstandings:
  - "网关本身不提供模型，只做路由和格式转换，效果取决于后端模型质量"
open_questions:
  - "如何高效管理 40+ 个适配器的配置和认证？"
---

## Explanation

在开发者本机运行的代理服务，统一接收 AI 请求，根据预设路由和实时状态（如配额）将请求分发至不同后端模型。 出处:https://github.com/decolua/9router。See [[content/9router]]。

## Supported by
- [[claims/9router-main-claim]]
