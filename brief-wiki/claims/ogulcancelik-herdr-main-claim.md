---
text: "Herdr 是面向 AI coding agents 的终端 workspace manager。"
slug: "ogulcancelik-herdr-main-claim"
kind: "claim"
content: "ogulcancelik-herdr"
source_pointer: "Cargo.toml package；README opening"
evidence_strength: "high"
supports:
  - "ogulcancelik-herdr-terminal-multiplexing-for-agents"
  - "ogulcancelik-herdr-agent-awareness-via-output-parsing"
contradicts: []
open_challenges:
  - "没有证明它是模型推理框架、RAG 框架或多 agent 调度器核心。"
  - "项目定位容易被 radar 标签误读为 agent_framework。"
status: "supported"
---

## Claim

它管理终端里的 agent 进程和布局，而不是自己实现 LLM agent loop。

证据:Cargo.toml description 写明“terminal workspace manager for AI coding agents”；源码包含 src/pty、src/ui、src/session、src/detect、src/integration。。边界:没有证明它是模型推理框架、RAG 框架或多 agent 调度器核心。。风险:项目定位容易被 radar 标签误读为 agent_framework。。See [[content/ogulcancelik-herdr]]。
