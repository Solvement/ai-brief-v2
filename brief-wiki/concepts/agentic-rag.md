---
name: "Agentic RAG"
slug: "agentic-rag"
kind: "concept"
tags:
  - "rag"
  - "agent"
  - "langgraph"
maturity: "active"
first_seen_in: "jamwithai-production-agentic-rag-course"
related_content:
  - "jamwithai-production-agentic-rag-course"
related_concepts: []
explanation: "人话说：不是每个问题都无脑检索，而是先判断是否该检索，检索后再判断资料是否够用，不够就改写问题再试。技术上，本仓库用 LangGraph 的 `StateGraph` 编排 `guardrail`、`retrieve`、`ToolNode`、`grade_documents`、`rewrite_query`、`generate_answer`。"
examples:
  - "`src/services/agents/agentic_rag.py` 的 `_build_graph`"
  - "`POST /api/v1/ask-agentic`"
common_misunderstandings:
  - "把 agentic RAG 理解成一定要多工具调用；本仓库的核心工具只有 `retrieve_papers`。"
  - "把 README 的“simple question direct response”当已完整实现；当前源码实际先走 guardrail，低分进 out_of_scope。"
open_questions:
  - "实际模型在 guardrail/grade/rewrite 上的稳定性未在仓库 benchmark 中说明。"
---

## Explanation

人话说：不是每个问题都无脑检索，而是先判断是否该检索，检索后再判断资料是否够用，不够就改写问题再试。技术上，本仓库用 LangGraph 的 `StateGraph` 编排 `guardrail`、`retrieve`、`ToolNode`、`grade_documents`、`rewrite_query`、`generate_answer`。 出处:https://github.com/jamwithai/production-agentic-rag-course。See [[content/jamwithai-production-agentic-rag-course]]。

## Supported by
- [[claims/jamwithai-production-agentic-rag-course-main-claim]]
