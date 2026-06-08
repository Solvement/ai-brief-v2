---
name: "稳定 ID 向量索引"
slug: "ryancodrai-turbovec-id-mapped-vector-index"
kind: "concept"
tags:
  - "indexing"
  - "ids"
  - "rag"
maturity: "stable"
first_seen_in: "ryancodrai-turbovec"
related_content:
  - "ryancodrai-turbovec"
related_concepts: []
explanation: "人话：内部数组位置会因为删除而变，但业务文档 ID 不能变，所以外面包一层 ID 到 slot 的映射。术语：`IdMapIndex` 维护 `slot_to_id: Vec<u64>` 和 `id_to_slot: HashMap<u64, usize>`，删除时调用内部 `swap_remove` 并更新 moved id（来源：turbovec/src/id_map.rs）。"
examples:
  - "`idx.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))`"
  - "`idx.remove(1002)`"
common_misunderstandings:
  - "稳定 ID 不等于保存文档内容；文档内容在 wrapper side-car 或外部数据库。"
  - "字符串 ID 不是核心索引的原生类型，wrapper 会映射成 u64。"
open_questions:
  - "跨进程并发更新 ID map 的策略未在 README/docs/tree 说明。"
---

## Explanation

人话：内部数组位置会因为删除而变，但业务文档 ID 不能变，所以外面包一层 ID 到 slot 的映射。术语：`IdMapIndex` 维护 `slot_to_id: Vec<u64>` 和 `id_to_slot: HashMap<u64, usize>`，删除时调用内部 `swap_remove` 并更新 moved id（来源：turbovec/src/id_map.rs）。 出处:https://github.com/ryancodrai/turbovec。See [[content/ryancodrai-turbovec]]。

## Supported by
- [[claims/ryancodrai-turbovec-main-claim]]
