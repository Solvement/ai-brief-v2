---
name: "SQLite 知识图谱"
slug: "sqlite-knowledge-graph"
kind: "concept"
tags:
  - "sqlite"
  - "knowledge-graph"
  - "static-analysis"
maturity: "stable"
first_seen_in: "colbymchenry-codegraph"
related_content:
  - "colbymchenry-codegraph"
related_concepts: []
explanation: "白话：用数据库存代码里的“谁是谁、谁调用谁”。术语：`nodes` 表存符号，`edges` 表存 `calls/imports/extends` 等关系，`nodes_fts` 用 FTS5 做符号全文检索。"
examples:
  - "`src/db/schema.sql`"
  - "`src/types.ts` 的 `NODE_KINDS` 和 `EdgeKind`"
common_misunderstandings:
  - "SQLite 不只适合小配置；这里被用作本地索引数据库。"
  - "图数据库不一定要 Neo4j；关系表也能表达图边。"
open_questions:
  - "超大型 monorepo 下单个 SQLite DB 的写入/查询上限需要实测。"
---

## Explanation

白话：用数据库存代码里的“谁是谁、谁调用谁”。术语：`nodes` 表存符号，`edges` 表存 `calls/imports/extends` 等关系，`nodes_fts` 用 FTS5 做符号全文检索。 出处:https://github.com/colbymchenry/codegraph。See [[content/colbymchenry-codegraph]]。

## Supported by
- [[claims/colbymchenry-codegraph-main-claim]]
