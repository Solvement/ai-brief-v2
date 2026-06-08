---
name: "Hashline"
slug: "hashline"
kind: "concept"
tags:
  - "editing"
  - "agent-harness"
  - "patch-format"
maturity: "active"
first_seen_in: "can1357-oh-my-pi"
related_content:
  - "can1357-oh-my-pi"
related_concepts: []
explanation: "人话：给 LLM 改文件用的“带版本锚点的行编辑语言”。术语：每个 section 带 path 和 4-hex snapshot tag，操作包括 `replace A..B`、`replace block A`、`delete`、`insert before/after/head/tail`；Patcher 通过 SnapshotStore 校验 stale anchor。"
examples:
  - "`¶a.ts#0A3B replace 1..1: +const X = \"b\";`"
  - "`packages/hashline/README.md` 的 InMemoryFilesystem + Patcher quick start"
common_misunderstandings:
  - "不是普通 unified diff。"
  - "4-hex tag 不是全局永久文件 ID，只在对应 SnapshotStore 有意义。"
open_questions:
  - "不同模型对 hashline 格式的学习成本和失败率需要运行评测确认。"
---

## Explanation

人话：给 LLM 改文件用的“带版本锚点的行编辑语言”。术语：每个 section 带 path 和 4-hex snapshot tag，操作包括 `replace A..B`、`replace block A`、`delete`、`insert before/after/head/tail`；Patcher 通过 SnapshotStore 校验 stale anchor。 出处:https://github.com/can1357/oh-my-pi。See [[content/can1357-oh-my-pi]]。

## Supported by
- [[claims/can1357-oh-my-pi-main-claim]]
