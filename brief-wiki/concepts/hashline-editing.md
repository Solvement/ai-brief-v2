---
name: "Hashline 内容锚编辑"
slug: "hashline-editing"
kind: "concept"
tags:
  - "agent-tools"
  - "editing"
  - "safety"
maturity: "active"
first_seen_in: "can1357-oh-my-pi"
related_content:
  - "can1357-oh-my-pi"
related_concepts: []
explanation: "先读文件生成短 TAG，再用 TAG 和行号写补丁；白话说，就是让模型改“刚刚读到的那份文件”，不是凭记忆乱套 diff。"
examples:
  - "`¶a.ts#0A3B` 加 `replace 1..1:` 是 docs/tools/edit.md 的最小编辑形态。"
  - "`packages/hashline/src/snapshots.ts` 维护每个 path 的短历史版本。"
common_misunderstandings:
  - "它不是普通 unified diff。"
  - "4 位 TAG 不是全局文件 hash，只在当前 snapshot store 中有意义。"
open_questions:
  - "跨长会话、多人同时改同一文件时，恢复成功率需要实测。"
---

## Explanation

先读文件生成短 TAG，再用 TAG 和行号写补丁；白话说，就是让模型改“刚刚读到的那份文件”，不是凭记忆乱套 diff。 出处:https://github.com/can1357/oh-my-pi。See [[content/can1357-oh-my-pi]]。

## Supported by
- [[claims/can1357-oh-my-pi-main-claim-2]]
