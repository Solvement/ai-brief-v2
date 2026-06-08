---
name: "Hybrid Search with RRF"
slug: "hybrid-search-rrf"
kind: "concept"
tags:
  - "search"
  - "opensearch"
  - "retrieval"
maturity: "stable"
first_seen_in: "jamwithai-production-agentic-rag-course"
related_content:
  - "jamwithai-production-agentic-rag-course"
related_concepts: []
explanation: "人话说：关键词能找精确术语，向量能找语义相近内容，RRF 把两边排名合并。技术上，本仓库在 OpenSearch 里同时发 BM25 bool/multi_match 和 `knn` vector query，再通过 `hybrid-rrf-pipeline` 做 reciprocal rank fusion。"
examples:
  - "`src/services/opensearch/client.py::_search_hybrid_native`"
  - "`src/services/opensearch/index_config_hybrid.py::HYBRID_RRF_PIPELINE`"
common_misunderstandings:
  - "以为 hybrid search 等于简单加权平均；本仓库默认不是 weighted average，而是 RRF，weighted pipeline 只是注释里的替代方案。"
  - "以为向量维度可随意改；mapping 固定 `dimension=1024`。"
open_questions:
  - "没有仓库内实验比较 RRF、weighted average、BM25-only、vector-only 的效果。"
---

## Explanation

人话说：关键词能找精确术语，向量能找语义相近内容，RRF 把两边排名合并。技术上，本仓库在 OpenSearch 里同时发 BM25 bool/multi_match 和 `knn` vector query，再通过 `hybrid-rrf-pipeline` 做 reciprocal rank fusion。 出处:https://github.com/jamwithai/production-agentic-rag-course。See [[content/jamwithai-production-agentic-rag-course]]。

## Supported by
- [[claims/jamwithai-production-agentic-rag-course-main-claim]]
