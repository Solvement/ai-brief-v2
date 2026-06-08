---
content: "jamwithai-production-agentic-rag-course"
kind: "evidence-pack"
title: "production-agentic-rag-course — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "这是一个以 arXiv Paper Curator 为载体的生产式 RAG 课程仓库：从 Docker/FastAPI/PostgreSQL/OpenSearch/Airflow 起步，逐周加上 arXiv 抓取、Docling 解析、BM25、Jina 向量、Ollama 生成、Redis 缓存、Langfuse tracing、LangGraph agentic RAG 和 Telegram bot。"
    internal_logic: "真实流程可以从“每天入库”和“用户提问”两条线看。\n\n第一条线是数据进入系统。Airflow DAG `airflow/dags/arxiv_paper_ingestion.py` 的 `schedule=\"0 6 * * 1-5\"`，默认参数含 `retries=2`、`retry_delay=timedelta(minutes=30)`、`max_active_runs=1`。`fetch_daily_papers` 会取 execution date 的前一天作为 `YYYYMMDD`，调用 `metadata_fetcher.fetch_and_process_papers(max_results=arxiv_client.max_results, from_date=target_date, to_date=target_date, process_pdfs=True, store_to_db=True)`。（来源：airflow/dags/arxiv_ingestion/fetching.py）\n\n第二步是索引。`index_papers_hybrid` 从 PostgreSQL 取新论文，交给 `HybridIndexingService.index_papers_batch(..., replace_existing=True)`。单篇论文会先走 `TextChunker.chunk_paper`：有 sections 时优先 section-based chunking；100-800 words 的 section 直接成 chunk；小于 100 words 的 section 合并；大于 800 words 的 section 再切；无 sections 时 fallback 到 word-based chunking，默认 `chunk_size=600`、`overlap_size=100`、`min_chunk_size=100`。（来源：src/services/indexing/text_chunker.py；src/config.py ChunkingSettings）\n\n第三步是 embedding 和索引。`HybridIndexingService.index_paper` 用 `JinaEmbeddingsClient.embed_passages(texts=chunk_texts, batch_size=50)` 生成 `jina-embeddings-v3` passage embeddings，再把 chunk 写入 OpenSearch，chunk data 里含 `arxiv_id`、`paper_id`、`chunk_index`、`chunk_text`、`chunk_word_count`、`section_title`、`embedding_model=\"jina-embeddings-v3\"`、title/authors/abstract/categories/published_date。（来源：src/services/indexing/hybrid_indexer.py；src/services/embeddings/jina_client.py）\n\n用户问问题时有普通 RAG 和 agentic RAG 两条 API。普通 `POST /api/v1/ask` 会先用 `CacheClient.find_cached_response(request)` 查 exact cache；cache key 明确包含 `query`、`model`、`top_k`、`use_hybrid`、`categories`。未命中时，如果 `request.use_hybrid` 为 true，就调用 `embeddings_service.embed_query(request.query)`，然后 `opensearch_client.search_unified(..., use_hybrid=request.use_hybrid and query_embedding is not None)`；拿到 chunks 后调用 `ollama_client.generate_rag_answer`。（来源：src/routers/ask.py；src/services/cache/client.py）\n\nAgentic RAG 的入口是 `POST /api/v1/ask-agentic`。`AgenticRAGService.ask` 初始化 state：`messages=[HumanMessage(content=query)]`、`retrieval_attempts=0`、`relevant_sources=[]`、`grading_results=[]` 等；runtime context 注入 `ollama_client`、`opensearch_client`、`embeddings_client`、`model_name`、`temperature`、`top_k`、`max_retrieval_attempts`、`guardrail_threshold`。（来源：src/services/agents/agentic_rag.py ask/_run_workflow；src/services/agents/context.py）\n\n图里的具体机制是：`guardrail_node` 把用户问题塞进 `GUARDRAIL_PROMPT`，要求 LLM 输出 `GuardrailScoring(score: 0-100, reason)`；`continue_after_guardrail` 用 `score >= runtime.context.guardrail_threshold` 决定进入 `retrieve` 还是 `out_of_scope`，默认阈值是 `60`。`retrieve_node` 在未达到 `max_retrieval_attempts=2` 前创建 tool call：`id=\"retrieve_1\"`、`name=\"retrieve_papers\"`、`args={\"query\": question}`。`retrieve_papers` 先 `embed_query(query)`，再调用 `opensearch_client.search_unified(query=query, query_embedding=query_embedding, size=top_k, use_hybrid=use_hybrid)`，把每个 hit 转成 LangChain `Document`，metadata 里放 `arxiv_id`、`title`、`authors`、`score`、`source=https://arxiv.org/pdf/{arxiv_id}.pdf`、`section`、`search_mode`、`top_k`。（来源：src/services/agents/nodes/guardrail_node.py；src/services/agents/nodes/retrieve_node.py；src/services/agents/tools.py）\n\n检索后 `grade_documents_node` 用 `GRADE_DOCUMENTS_PROMPT` 要 LLM 返回 `binary_score` 为 `yes` 或 `no`；yes 路由到 `generate_answer`，no 路由到 `rewrite_query`。`rewrite_query_node` 用 `REWRITE_PROMPT` 生成 `rewritten_query`，失败 fallback 为 `f\"{original_question} research paper arxiv machine learning\"`，然后追加新的 `HumanMessage` 再回到 retrieve。最终 `generate_answer_node` 用 `GENERATE_ANSWER_PROMPT`，明确要求“using ONLY the information from the retrieved research papers”。（来源：src/services/agents/nodes/grade_documents_node.py；src/services/agents/nodes/rewrite_query_node.py；src/services/agents/nodes/generate_answer_node.py；src/services/agents/prompts.py）"
    failure_mode: ".env.example Jina AI Embeddings；src/services/embeddings/jina_client.py；src/services/opensearch/index_config_hybrid.py"
    source_pointer: "https://github.com/jamwithai/production-agentic-rag-course"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/false/false/MIT/week7.0"
experiments: []
claims:
  - "[[claims/jamwithai-production-agentic-rag-course-main-claim]]"
artifacts:
  - "[[artifacts/jamwithai-production-agentic-rag-course-repo]]"
metrics:
  - "stars=6609"
  - "forks=1504"
  - "open_issues=21"
  - "latest_release=week7.0"
  - "pushed_at=2026-04-05T06:13:54Z"
baselines: []
failure_modes:
  - ".env.example Jina AI Embeddings；src/services/embeddings/jina_client.py；src/services/opensearch/index_config_hybrid.py"
  - "compose.yml opensearch；src/services/opensearch/client.py；src/services/opensearch/index_config_hybrid.py"
  - "src/config.py Settings；src/routers/agentic_ask.py；tests/api/routers/test_agentic_ask.py"
  - "compose.yml langfuse-* services；src/services/agents/agentic_rag.py tracing；src/routers/agentic_ask.py feedback"
  - "src/services/telegram/factory.py；src/services/telegram/bot.py；notebooks/week7/README.md"
  - ".env.example arXiv API Configuration；src/services/arxiv/client.py"
  - "notebooks/week7/README.md Code Structure；repo tree；src/services/telegram"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/jamwithai/production-agentic-rag-course"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/jamwithai-production-agentic-rag-course-main-claim]],官方 artifact 落库为 [[artifacts/jamwithai-production-agentic-rag-course-repo]]。See [[content/jamwithai-production-agentic-rag-course]]。
