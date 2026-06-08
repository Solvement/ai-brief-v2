---
name: "面向代理的终端多路复用"
slug: "terminal-multiplexing-for-agents"
kind: "concept"
tags:
  - "terminal"
  - "multiplexer"
  - "agent"
  - "workspace"
maturity: "emerging"
first_seen_in: "herdr"
related_content:
  - "herdr"
related_concepts: []
explanation: "将传统终端多路复用器（如 tmux）的工作区、窗格、持久会话概念扩展，加入代理状态栏和自我编排能力，专门为 AI 代理开发场景设计。"
examples:
  - "Herder 允许每个项目一个工作区，包含多个窗格，每个窗格运行不同的代理。"
common_misunderstandings:
  - "代理不是由 Herder 托管的守护进程；只是普通终端进程。"
open_questions:
  - "多个窗格间的剪贴板或上下文共享机制？"
  - "是否支持跨机器的代理迁移？"
---

## Explanation

将传统终端多路复用器（如 tmux）的工作区、窗格、持久会话概念扩展，加入代理状态栏和自我编排能力，专门为 AI 代理开发场景设计。 出处:https://github.com/ogulcancelik/herdr。See [[content/ogulcancelik-herdr]]。

## Supported by
- [[claims/herdr-main-claim]]
