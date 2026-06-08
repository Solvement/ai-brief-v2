---
text: "Agent awareness works by reading foreground process and terminal output, zero config, no hooks required."
slug: "herdr-main-claim"
kind: "claim"
content: "herdr"
source_pointer: "README.md 'agent awareness' section"
evidence_strength: "medium"
supports:
  - "agent-awareness-via-output-parsing"
  - "terminal-multiplexing-for-agents"
contradicts: []
open_challenges:
  - "未提供检测算法细节、准确率或边缘案例处理。"
  - "针对特定代理 CLI 的启发式可能在升级后失效，导致状态误报。"
status: "supported"
---

## Claim

代理状态检测通过读取进程名和终端输出实现，无需任何配置或钩子。

证据:项目描述和列表显示支持多个代理开箱即用。。边界:未提供检测算法细节、准确率或边缘案例处理。。风险:针对特定代理 CLI 的启发式可能在升级后失效，导致状态误报。。See [[content/ogulcancelik-herdr]]。
