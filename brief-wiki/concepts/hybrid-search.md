---
name: "混合搜索"
slug: "hybrid-search"
kind: "concept"
tags:
  - "search"
  - "bm25"
  - "vector-search"
  - "rrf"
maturity: "stable"
first_seen_in: "production-agentic-rag-course"
related_content:
  - "production-agentic-rag-course"
related_concepts: []
explanation: "结合关键词搜索（如 BM25）和向量语义搜索，通过融合算法（如 RRF）合并结果，提升检索准确性和召回率。"
examples:
  - "Week 4 中实现基于 OpenSearch 的 BM25 + 向量搜索，并用 RRF 融合打分。"
common_misunderstandings:
  - "认为向量搜索可以完全替代关键词搜索，忽略了精确术语匹配、代码搜索等场景。"
open_questions:
  - "RRF 的参数 k 如何根据数据特性调整？"
  - "是否存在比 RRF 更有效的融合策略？"
---

## Explanation

结合关键词搜索（如 BM25）和向量语义搜索，通过融合算法（如 RRF）合并结果，提升检索准确性和召回率。 出处:https://github.com/jamwithai/production-agentic-rag-course。See [[content/production-agentic-rag-course]]。

## Supported by
- [[claims/production-agentic-rag-course-main-claim]]
