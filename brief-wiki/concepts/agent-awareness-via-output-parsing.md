---
name: "通过输出解析的代理感知"
slug: "agent-awareness-via-output-parsing"
kind: "concept"
tags:
  - "agent"
  - "status"
  - "terminal"
  - "heuristic"
maturity: "active"
first_seen_in: "herdr"
related_content:
  - "herdr"
related_concepts: []
explanation: "不依赖 API，通过监控进程名和终端输出来推断 AI 代理的状态（阻塞、工作中、完成），实现轻量级且零配置的集成。"
examples:
  - "Herder 检测到 'claude' 进程并解析输出中包含 'waiting for input' 来显示阻塞状态。"
common_misunderstandings:
  - "它并不是真正的语义理解，而是模式匹配。"
open_questions:
  - "如何应对代理输出格式的国际化？"
  - "自定义代理如何注册自己的输出模式？"
---

## Explanation

不依赖 API，通过监控进程名和终端输出来推断 AI 代理的状态（阻塞、工作中、完成），实现轻量级且零配置的集成。 出处:https://github.com/ogulcancelik/herdr。See [[content/herdr]]。

## Supported by
- [[claims/herdr-main-claim]]
