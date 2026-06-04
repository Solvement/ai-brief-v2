---
name: "面向 agent 的终端复用"
slug: "ogulcancelik-herdr-terminal-multiplexing-for-agents"
kind: "concept"
tags:
  - "terminal"
  - "agents"
  - "devtool"
maturity: "active"
first_seen_in: "ogulcancelik-herdr"
related_content:
  - "ogulcancelik-herdr"
related_concepts: []
explanation: "人话：把多个 agent、shell、server、test 放进一个终端界面，随时切换、拆分、保活。术语：terminal multiplexing 是在一个终端会话里管理多个 PTY/pane；Herdr 在这个基础上加了 agent 状态识别和 socket 控制面。"
examples:
  - "Herdr workspace/tab/pane"
  - "detach 后 reattach 到同一个 background session"
common_misunderstandings:
  - "误以为它会替你执行 LLM 推理；实际它管理运行 agent 的终端。"
open_questions:
  - "不同终端和 SSH 组合下的 mouse、clipboard、notification 体验需要实测。"
---

## Explanation

人话：把多个 agent、shell、server、test 放进一个终端界面，随时切换、拆分、保活。术语：terminal multiplexing 是在一个终端会话里管理多个 PTY/pane；Herdr 在这个基础上加了 agent 状态识别和 socket 控制面。 出处:https://github.com/ogulcancelik/herdr。See [[content/ogulcancelik-herdr]]。

## Supported by
- [[claims/ogulcancelik-herdr-main-claim]]
