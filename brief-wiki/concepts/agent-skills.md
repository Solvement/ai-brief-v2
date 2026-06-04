---
name: "代理技能"
slug: "agent-skills"
kind: "concept"
tags:
  - "agent"
  - "skills"
  - "learning"
maturity: "active"
first_seen_in: "hermes-agent"
related_content:
  - "hermes-agent"
related_concepts: []
explanation: "代理可从对话中自动创建可复用的技能，技能在使用中自我改进，并以文件形式持久化。"
examples:
  - "用户通过复杂命令序列，agent 自动生成一个 skill 文件，此后可用 `/<skill-name>` 调用。"
common_misunderstandings:
  - "并非所有任务都会生成技能，触发条件未公开。"
open_questions:
  - "技能如何避免冲突和保证安全性？"
  - "技能自我改进的准确率如何？"
---

## Explanation

代理可从对话中自动创建可复用的技能，技能在使用中自我改进，并以文件形式持久化。 出处:https://github.com/nousresearch/hermes-agent。See [[content/hermes-agent]]。

## Supported by
- [[claims/hermes-agent-main-claim]]
