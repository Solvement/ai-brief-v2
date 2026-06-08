---
text: "课程自称按 Week 1 到 Week 7 构建 RAG 系统，Week 7 是 Agentic RAG with LangGraph and Telegram Bot。"
slug: "jamwithai-production-agentic-rag-course-main-claim"
kind: "claim"
content: "jamwithai-production-agentic-rag-course"
source_pointer: "README What You'll Build"
evidence_strength: "medium"
supports:
  - "agentic-rag"
  - "hybrid-search-rrf"
contradicts: []
open_challenges:
  - "不直接证明每周 notebook 都能在当前环境完整跑通。"
  - "Week 7 README 中部分文件名和命令能力与实际 tree 不一致。"
status: "supported"
---

## Claim

它把项目拆成每周一个工程层：基础设施、抓取、BM25、混合检索、LLM、监控缓存、agent 和 Telegram。

证据:README 明确列出 Week 1 到 Week 7；仓库也有 `notebooks/week1` 到 `notebooks/week7`、`src/services/agents`、`src/services/telegram`。。边界:不直接证明每周 notebook 都能在当前环境完整跑通。。风险:Week 7 README 中部分文件名和命令能力与实际 tree 不一致。。See [[content/jamwithai-production-agentic-rag-course]]。
