---
name: "事件驱动的 Agent 回路"
slug: "event-driven-agent-loop"
kind: "concept"
tags:
  - "agent-loop"
  - "event-stream"
  - "observability"
maturity: "emerging"
first_seen_in: "ui-tars-desktop"
related_content:
  - "ui-tars-desktop"
related_concepts: []
explanation: "Agent 的每一次感知、推理、行动、结果都作为结构化事件发出，形成一条事件流。这条流不仅用于状态追踪和调试，还直接驱动前端 UI 的实时更新，实现动作执行和用户界面的解耦。同时，事件流经过上下文工程模块压缩后注入模型的上下文，维持任务记忆。"
examples:
  - "Agent TARS 的 Web UI 接收 Event Stream 实时展示 Agent 的思考过程和屏幕操作"
  - "通过 Event Stream Viewer 可以追踪和调试工具调用的时间线和数据流"
common_misunderstandings:
  - "不是简单地打印日志，而是有明确 schema 的协议，可以被程序消费"
  - "Context Engineering 不是简单的历史列表，需要对事件进行筛选、摘要和重排"
open_questions:
  - "事件流的格式是否开源或标准化？"
  - "长任务中如何决定哪些事件保留，哪些丢弃？"
---

## Explanation

Agent 的每一次感知、推理、行动、结果都作为结构化事件发出，形成一条事件流。这条流不仅用于状态追踪和调试，还直接驱动前端 UI 的实时更新，实现动作执行和用户界面的解耦。同时，事件流经过上下文工程模块压缩后注入模型的上下文，维持任务记忆。 出处:https://github.com/bytedance/ui-tars-desktop。See [[content/ui-tars-desktop]]。

## Supported by
- [[claims/ui-tars-desktop-main-claim]]
