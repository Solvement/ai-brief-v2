---
name: "Markdown vault"
slug: "markdown-vault"
kind: "concept"
tags:
  - "local-first"
  - "markdown"
  - "knowledge-base"
maturity: "stable"
first_seen_in: "refactoringhq-tolaria"
related_content:
  - "refactoringhq-tolaria"
related_concepts: []
explanation: "一组普通 Markdown 文件组成的知识库；Tolaria 把 YAML frontmatter、H1、wikilinks 解析成可导航图谱。"
examples:
  - "demo-vault-v2/25q2-laputa-v2.md 用 `type: Project` 和 `related_to` 建关系"
  - "docs/ABSTRACTIONS 说明 `type:`、`status:`、`belongs_to:` 等约定字段"
common_misunderstandings:
  - "不是数据库 schema；类型是导航辅助，不是强校验。"
  - "不是只有根目录文件；当前源码也扫描子目录和 text/binary file kind。"
open_questions:
  - "复杂 Markdown 扩展在 BlockNote 富文本往返中的无损程度需要逐项测试。"
---

## Explanation

一组普通 Markdown 文件组成的知识库；Tolaria 把 YAML frontmatter、H1、wikilinks 解析成可导航图谱。 出处:https://github.com/refactoringhq/tolaria。See [[content/refactoringhq-tolaria]]。

## Supported by
- [[claims/refactoringhq-tolaria-main-claim]]
