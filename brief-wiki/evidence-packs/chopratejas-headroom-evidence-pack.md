---
content: "chopratejas-headroom"
kind: "evidence-pack"
title: "headroom — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Headroom 是一个本地运行的 LLM 上下文压缩层，把工具输出、日志、RAG 结果、文件内容和消息历史在进入模型前压缩，并用 CCR 哈希保留原文可取回。"
    internal_logic: "人话：一个真实使用流可以从 quickstart 的 500 条搜索结果开始。Python 里构造 `messages`：system 是“You analyze search results.”，assistant 里有 `tool_calls`，tool 消息把 500 个 `{title, snippet, score}` 结果 JSON 化，最后用户问“What are the top 3 results?”，然后调用 `result = compress(messages, model=\"gpt-4o\")`（来源：docs/content/docs/quickstart.mdx 2. Compress messages）。\n\n术语流程：`compress()` 先处理 hooks，再从消息里抽取 user query 给变换器做 relevance scoring，然后调用 pipeline；返回 `tokens_before`、`tokens_after`、`tokens_saved`、`compression_ratio`、`transforms_applied`（来源：headroom/compress.py compress）。默认 pipeline 在源码注释中是 `CacheAligner -> ContentRouter`，其中 ContentRouter 会跳过 user/system/developer 消息、小内容、近期代码、analysis intent 下的代码和已有 `Retrieve more: hash=` marker 的内容（来源：headroom/compress.py _get_pipeline；headroom/transforms/content_router.py message loop）。\n\n对那条 500 结果 tool 消息，ContentRouter 会把 cache miss 放入 `pending_tasks`，最多用 `HEADROOM_COMPRESS_WORKERS`，默认字符串 `\"4\"`，并行调用 `self.compress(...)`；如果返回的 `result.compression_ratio < min_ratio`，就把压缩文本写回该消息，并记录类似 `router:<strategy>:<ratio>` 的 transform marker（来源：headroom/transforms/content_router.py pending_tasks / merge results）。JSON 数组会走 SmartCrusher；Python 类实际是 Rust-backed，通过 `from headroom._core import SmartCrusher` 和 `SmartCrusherConfig`，配置包括 `min_items_to_analyze=5`、`min_tokens_to_crush=200`、`max_items_after_crush=15`、`first_fraction=0.3`、`last_fraction=0.15`（来源：headroom/transforms/smart_crusher.py SmartCrusherConfig / SmartCrusher）。\n\n可逆部分：SmartCrusher 或其他 compressor 产生 marker 后，Python store 会保存原文；普通 store 的默认 TTL 是 300 秒，hash 默认 `sha256(original)[:24]`；MCP 的 `headroom_compress` 会把输入包装成 `[{\"role\":\"tool\",\"content\":content}]` 调 `compress()`，再把原文存入本地 `CompressionStore(max_entries=500, default_ttl=MCP_SESSION_TTL)`，返回 `compressed`、`hash`、`original_tokens`、`compressed_tokens`、`tokens_saved`、`savings_percent`、`transforms`（来源：headroom/cache/compression_store.py CompressionStore.store；headroom/ccr/mcp_server.py _compress_content）。需要原文时，`headroom_retrieve` 先查本地 store；如果带 `query`，调用 `store.search(hash_key, query)`；否则 `store.retrieve(hash_key)`；失败后再 POST 到 proxy 的 `/v1/retrieve`（来源：headroom/ccr/mcp_server.py _retrieve_content / _retrieve_via_proxy）。"
    failure_mode: "pyproject.toml build-system / maturin comments；headroom/transforms/smart_crusher.py SmartCrusher；Dockerfile build-stage smoke check；docs/content/docs/installation.mdx Windows"
    source_pointer: "https://github.com/chopratejas/headroom"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/Apache-2.0/v0.23.0"
experiments: []
claims:
  - "[[claims/chopratejas-headroom-main-claim]]"
artifacts:
  - "[[artifacts/chopratejas-headroom-repo]]"
metrics:
  - "stars=17660"
  - "forks=1129"
  - "open_issues=204"
  - "latest_release=v0.23.0"
  - "pushed_at=2026-06-08T08:16:26Z"
baselines: []
failure_modes:
  - "pyproject.toml build-system / maturin comments；headroom/transforms/smart_crusher.py SmartCrusher；Dockerfile build-stage smoke check；docs/content/docs/installation.mdx Windows"
  - "docs/content/docs/installation.mdx Python / Windows"
  - "docs/content/docs/proxy.mdx CLI options / API endpoints；docs/content/docs/configuration.mdx Environment Variables"
  - "docs/content/docs/mcp.mdx CLI commands / MCP host configuration / Troubleshooting"
  - "pyproject.toml optional-dependencies；docs/content/docs/installation.mdx Extras"
  - "headroom/binaries.py；headroom/rtk/installer.py；headroom/lean_ctx/installer.py；headroom/cli/wrap.py"
missing_details: []
source_pointers:
  - "https://github.com/chopratejas/headroom"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/chopratejas-headroom-main-claim]],官方 artifact 落库为 [[artifacts/chopratejas-headroom-repo]]。See [[content/chopratejas-headroom]]。
