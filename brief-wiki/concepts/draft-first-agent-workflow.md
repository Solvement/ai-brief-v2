---
name: "草稿优先 Agent 流程"
slug: "draft-first-agent-workflow"
kind: "concept"
tags:
  - "agent-workflow"
  - "content-operations"
  - "product-ux"
maturity: "active"
first_seen_in: "yikart-aitoearn"
related_content:
  - "yikart-aitoearn"
related_concepts: []
explanation: "人话：AI 生成完不只是把链接甩给用户，而是先存成产品里的草稿。术语：系统提示词要求内容生成后自动调用 `getDraftGroupInfoByName` 和 `createDraft`，再返回 `navigateToDraft` action。"
examples:
  - "生成视频后创建 `type: VIDEO` 的 draft"
  - "缺账号时返回 `createChannel` 而不是直接失败"
common_misunderstandings:
  - "草稿不是模型记忆，它是业务数据库里的内容对象。"
  - "自动保存草稿不等于自动发布。"
open_questions:
  - "草稿自动保存的失败重试、去重和清理策略未在 README/docs/tree 说明。"
---

## Explanation

人话：AI 生成完不只是把链接甩给用户，而是先存成产品里的草稿。术语：系统提示词要求内容生成后自动调用 `getDraftGroupInfoByName` 和 `createDraft`，再返回 `navigateToDraft` action。 出处:https://github.com/yikart/aitoearn。See [[content/yikart-aitoearn]]。

## Supported by
- [[claims/yikart-aitoearn-main-claim]]
