---
slug: "jamwithai-production-agentic-rag-course-repo"
kind: "artifact"
content: "jamwithai-production-agentic-rag-course"
artifact_type: "repo"
url: "https://github.com/jamwithai/production-agentic-rag-course"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "yes"
missing_parts:
  - "需要 `.env`，其中 Week 4+ hybrid search 需要 `JINA_API_KEY`。"
  - "Week 6 tracing 需要 Langfuse public/secret keys；Compose 也需要 Langfuse server secrets。"
  - "Week 7 Telegram 需要 `TELEGRAM__BOT_TOKEN`；README 中部分 Telegram 高级功能未在当前源码 tree 中实现。"
  - "需要 Docker Desktop、Python 3.12+、UV；Ollama 默认模型为 `llama3.2:1b`。"
  - "未在本次任务中运行完整端到端服务或测试。"
last_checked: "2026-06-08"
---

## Artifact audit

已在指定临时目录克隆并检查真实 upstream repo，checkout 为 `424a0eb99edf841994f2a9a053912b489d2a94ff`、branch `main`。仓库是 MIT 许可的 Python/FastAPI RAG 课程应用，工程上覆盖 Airflow arXiv ingestion、Docling PDF parsing、OpenSearch hybrid RRF、Jina embeddings、Ollama generation、Redis cache、Langfuse tracing、LangGraph agentic workflow 和一个简化 Telegram bot。核心可复用价值高；采用前需处理文档/代码/测试漂移。

出处:https://github.com/jamwithai/production-agentic-rag-course。See [[content/jamwithai-production-agentic-rag-course]]。
