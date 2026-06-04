---
name: "基于输出解析的 agent 状态感知"
slug: "ogulcancelik-herdr-agent-awareness-via-output-parsing"
kind: "concept"
tags:
  - "agent-state"
  - "heuristics"
  - "terminal-ui"
maturity: "emerging"
first_seen_in: "ogulcancelik-herdr"
related_content:
  - "ogulcancelik-herdr"
related_concepts: []
explanation: "人话：看 agent 终端里显示了什么，再判断它是在工作、等批准、已完成还是空闲。术语：screen heuristic 从 terminal screen snapshot 和 foreground process 推断 semantic state；hook/plugin report 可以补充或替代部分信号。"
examples:
  - "docs/agents.mdx 的 foreground process detection、terminal output heuristics、integration reports"
  - "src/detect/agents/codex.rs 与 src/detect/agents/claude_code.rs"
common_misunderstandings:
  - "把支持矩阵当成协议级保证；很多状态来自屏幕启发式，外部 UI 变更会影响结果。"
open_questions:
  - "各 agent 最新版本 UI 的回归测试频率未在 README/docs/tree 说明。"
---

## Explanation

人话：看 agent 终端里显示了什么，再判断它是在工作、等批准、已完成还是空闲。术语：screen heuristic 从 terminal screen snapshot 和 foreground process 推断 semantic state；hook/plugin report 可以补充或替代部分信号。 出处:https://github.com/ogulcancelik/herdr。See [[content/ogulcancelik-herdr]]。

## Supported by
- [[claims/ogulcancelik-herdr-main-claim]]
