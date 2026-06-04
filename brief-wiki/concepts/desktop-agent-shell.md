---
name: "桌面代理壳层"
slug: "desktop-agent-shell"
kind: "concept"
tags:
  - "electron"
  - "agent-shell"
  - "desktop-app"
maturity: "emerging"
first_seen_in: "hermes-desktop"
related_content:
  - "hermes-desktop"
related_concepts: []
explanation: "为 CLI 代理提供 Electron 桌面界面，处理安装、配置、会话和 UI 交互，但不实现代理核心逻辑。通过 HTTP SSE 与后端代理通信。"
examples:
  - "Hermes Desktop 为 Hermes Agent 提供图形化安装和管理界面。"
common_misunderstandings:
  - "不是代理的实现，不包含推理或执行工具的能力。"
open_questions:
  - "如何确保壳层与后端版本兼容？"
  - "多代理后端支持的可能性？"
---

## Explanation

为 CLI 代理提供 Electron 桌面界面，处理安装、配置、会话和 UI 交互，但不实现代理核心逻辑。通过 HTTP SSE 与后端代理通信。 出处:https://github.com/fathah/hermes-desktop。See [[content/hermes-desktop]]。

## Supported by
- [[claims/hermes-desktop-main-claim]]
