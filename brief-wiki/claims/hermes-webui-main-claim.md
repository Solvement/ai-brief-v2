---
text: "Hermes Agent 保持跨会话的持久记忆，包括用户画像、项目上下文和自学习技能。"
slug: "hermes-webui-main-claim"
kind: "claim"
content: "hermes-webui"
source_pointer: "README: Why Hermes 部分列出“Persistent memory”，特性表标注 Hermes 为 Yes。"
evidence_strength: "high"
supports:
  - "self-hosted-agent-ui"
  - "persistent-memory-agent"
contradicts: []
open_challenges:
  - "未说明记忆的具体技术实现（如向量数据库、长期存储策略），也不保证百分百精确回忆。"
  - "记忆容量和准确性可能受模型限制，若 Agent 内部记忆策略失效，WebUI 无法感知。"
status: "supported"
---

## Claim

Agent 不会在每次对话结束时忘记一切，它能记住你是谁、你工作的项目和学会的技能。

证据:表明具有持久记忆机制，这与多数聊天工具形成对比。。边界:未说明记忆的具体技术实现（如向量数据库、长期存储策略），也不保证百分百精确回忆。。风险:记忆容量和准确性可能受模型限制，若 Agent 内部记忆策略失效，WebUI 无法感知。。See [[content/hermes-webui]]。
