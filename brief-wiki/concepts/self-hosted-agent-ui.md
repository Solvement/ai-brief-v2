---
name: "自托管 Agent 界面"
slug: "self-hosted-agent-ui"
kind: "concept"
tags:
  - "self-hosted"
  - "agent"
  - "web-ui"
maturity: "active"
first_seen_in: "hermes-webui"
related_content:
  - "hermes-webui"
related_concepts: []
explanation: "通过自建 Web 服务为本地运行的 AI Agent 提供图形化交互界面，无需依赖云厂商的服务，数据存储在用户自己的机器上。"
examples:
  - "Hermes WebUI"
  - "OpenCode 的 WebUI（部分）"
common_misunderstandings:
  - "不等于代理的‘控制面板’，而是完整的交互前端，可执行与 CLI 相同的操作。"
open_questions:
  - "如何保证 UI 与 Agent 进程之间的低延迟和高可靠通信？"
  - "如何设计离线状态下的任务队列和结果推送？"
---

## Explanation

通过自建 Web 服务为本地运行的 AI Agent 提供图形化交互界面，无需依赖云厂商的服务，数据存储在用户自己的机器上。 出处:https://github.com/nesquena/hermes-webui。See [[content/hermes-webui]]。

## Supported by
- [[claims/hermes-webui-main-claim]]
