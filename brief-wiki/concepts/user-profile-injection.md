---
name: "用户画像注入"
slug: "user-profile-injection"
kind: "concept"
tags:
  - "agent-context"
  - "personalization"
maturity: "active"
first_seen_in: "supermemory"
related_content:
  - "supermemory"
related_concepts: []
explanation: "在每次对话开始时，自动将用户的偏好、长期事实和近期活动列表注入系统提示或上下文，使得 Agent 在不进行搜索的情况下就能立即“认识”用户，减少对话轮次。"
examples:
  - "在 Cursor 或 Claude Code 中通过 /context 命令注入画像。"
  - "API 中 client.profile() 返回 static 和 dynamic 字段，可拼接进 prompt。"
common_misunderstandings:
  - "以为画像只包含用户手动输入的信息，实际是系统自动从历史对话中提取和维护的。"
  - "忘记画像的有效期和刷新机制，可能使用过时信息。"
open_questions:
  - "画像的刷新频率如何？在频繁交互下是否能保证实时性？"
  - "如果用户行为突然改变，画像更新需要多少轮对话才能反映？"
---

## Explanation

在每次对话开始时，自动将用户的偏好、长期事实和近期活动列表注入系统提示或上下文，使得 Agent 在不进行搜索的情况下就能立即“认识”用户，减少对话轮次。 出处:https://github.com/supermemoryai/supermemory。See [[content/supermemory]]。

## Supported by
- [[claims/supermemory-main-claim]]
