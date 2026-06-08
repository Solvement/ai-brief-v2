---
name: "Combo fallback routing"
slug: "combo-fallback-routing"
kind: "concept"
tags:
  - "routing"
  - "fallback"
  - "resilience"
maturity: "active"
first_seen_in: "decolua-9router"
related_content:
  - "decolua-9router"
related_concepts: []
explanation: "通俗说，就是把多个模型排成一个候补队列，第一个失败就试第二个。技术上，`open-sse/services/combo.js` 接收 `models` 数组，支持 `fallback` 与 `round-robin`，并用 `checkFallbackError` 判断是否继续。"
examples:
  - "README combo 示例：`cc/claude-opus-4-7` → `glm/glm-5.1` → `minimax/MiniMax-M2.7`"
  - "`settingsRepo.js` 默认 `comboStrategy: \"fallback\"`、`comboStickyRoundRobinLimit: 1`"
common_misunderstandings:
  - "Fallback 不是零停机保证；它只是在错误可分类时换路。"
  - "Round-robin 不等于负载均衡 SLA。"
open_questions:
  - "不同 provider 的错误文本变化后，fallback 规则需要持续维护。"
---

## Explanation

通俗说，就是把多个模型排成一个候补队列，第一个失败就试第二个。技术上，`open-sse/services/combo.js` 接收 `models` 数组，支持 `fallback` 与 `round-robin`，并用 `checkFallbackError` 判断是否继续。 出处:https://github.com/decolua/9router。See [[content/decolua-9router]]。

## Supported by
- [[claims/decolua-9router-main-claim]]
