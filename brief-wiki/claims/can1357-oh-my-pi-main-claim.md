---
text: "README 自称 `32 built-in tools`。"
slug: "can1357-oh-my-pi-main-claim"
kind: "claim"
content: "can1357-oh-my-pi"
source_pointer: "README Whatever the task needs；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS/HIDDEN_TOOLS"
evidence_strength: "medium"
supports:
  - "hashline"
  - "ttsr"
contradicts: []
open_challenges:
  - "不支持把 README 的 32 作为本次独立核实后的精确工具数。"
  - "工具是否默认可用还受 `settings.get(...)`、`enableLsp`、`task.maxRecursionDepth`、memory backend 等门控影响。"
status: "supported"
---

## Claim

作者说盒子里有 32 个工具，但实际代码注册表显示 29 个公开内置工具和 5 个隐藏工具；这说明 README 的统计口径未在代码里直接等同为一个 32 项数组。

证据:代码确有大量内置工具注册；公开注册表 29 项，隐藏注册表 5 项。。边界:不支持把 README 的 32 作为本次独立核实后的精确工具数。。风险:工具是否默认可用还受 `settings.get(...)`、`enableLsp`、`task.maxRecursionDepth`、memory backend 等门控影响。。See [[content/can1357-oh-my-pi]]。
