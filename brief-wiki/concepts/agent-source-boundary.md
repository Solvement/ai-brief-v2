---
name: "Agent 源码边界"
slug: "agent-source-boundary"
kind: "concept"
tags:
  - "architecture"
  - "compatibility"
  - "risk"
maturity: "emerging"
first_seen_in: "nesquena-hermes-webui"
related_content:
  - "nesquena-hermes-webui"
related_concepts: []
explanation: "人话：WebUI 现在还要读/导入 Hermes Agent 的内部 Python 源码，不只是调用稳定 API。技术定义：`api/streaming.py` 依赖 `run_agent.AIAgent`，profile/model/goal/command/session bridge 依赖 `hermes_cli.*` 或 Agent state schema。"
examples:
  - "`docs/rfcs/agent-source-boundary.md` 把 Browser chat execution 列为 `run_agent.AIAgent` dependency"
  - "two-container compose 把 `hermes-agent-src` 只读挂到 WebUI"
common_misunderstandings:
  - "多容器不等于 API 解耦；文档明确说 source mount 是 compatibility bridge。"
  - "只读挂载降低写风险，但不消除版本耦合。"
open_questions:
  - "Hermes Agent 何时提供稳定的 run/profile/provider/session API？"
---

## Explanation

人话：WebUI 现在还要读/导入 Hermes Agent 的内部 Python 源码，不只是调用稳定 API。技术定义：`api/streaming.py` 依赖 `run_agent.AIAgent`，profile/model/goal/command/session bridge 依赖 `hermes_cli.*` 或 Agent state schema。 出处:https://github.com/nesquena/hermes-webui。See [[content/nesquena-hermes-webui]]。

## Supported by
- [[claims/nesquena-hermes-webui-main-claim]]
