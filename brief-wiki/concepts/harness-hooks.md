---
name: "Harness Hooks 自动化钩子"
slug: "harness-hooks"
kind: "concept"
tags:
  - "agent-enhancement"
  - "lifecycle-management"
maturity: "stable"
first_seen_in: "ecc"
related_content:
  - "ecc"
related_concepts: []
explanation: "在 AI 编程助手的生命周期关键节点（如会话开始、结束）执行指定脚本，用于注入通用逻辑，实现记忆持久化、安全检查等。"
examples:
  - "SessionStart 钩子加载上次会话摘要"
  - "Stop 钩子保存当前上下文到 SQLite"
common_misunderstandings:
  - "钩子不是独立的 agent，而是助手工作流中的插件；不提供自主决策，只响应事件。"
open_questions:
  - "钩子执行的性能开销如何？"
  - "多个钩子并发或依赖时的协调机制是否健壮？"
---

## Explanation

在 AI 编程助手的生命周期关键节点（如会话开始、结束）执行指定脚本，用于注入通用逻辑，实现记忆持久化、安全检查等。 出处:https://github.com/affaan-m/ecc。See [[content/ecc]]。

## Supported by
- [[claims/ecc-main-claim]]
