---
content: "chopratejas-headroom"
kind: "evidence-pack"
title: "headroom — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Headroom 是给 AI agent 和 LLM 应用用的本地上下文压缩层：在工具输出、日志、RAG 片段、文件内容进模型前先压缩，并用 CCR 保留原文可取回。"
    internal_logic: "真实流：示例 `examples/context_compression_demo.py` 构造 OpenAI 格式 messages，第三条是 `role: tool` 的检索输出，然后调用 `compress(messages, model=\"claude-sonnet-4-5-20250929\")`，最后断言 tokens_saved > 0、message count 不变、tool message 仍存在。（来源：examples/context_compression_demo.py）\n\n```mermaid\nflowchart TD\n  A[Agent 或 App messages] --> B[compress 或 proxy]\n  B --> C[Pipeline]\n  C --> D[CacheAligner]\n  D --> E[ContentRouter]\n  E --> F{内容类型}\n  F --> G[JSON SmartCrusher]\n  F --> H[日志 搜索 代码 文本]\n  G --> I[CCR 本地存原文]\n  H --> I\n  I --> J[压缩 messages]\n  J --> K[LLM]\n  K --> L[需要原文]\n  L --> M[headroom_retrieve]\n  M --> I\n```\n\n关键节点：`compress()` 默认 `model=\"claude-sonnet-4-5-20250929\"`、`model_limit=200000`，会把用户 query 提取成 context 后交给 pipeline。（来源：headroom/compress.py compress）ContentRouter 对用户消息、系统/开发者消息、小内容有保护逻辑；不是所有内容都会被压缩。（来源：headroom/transforms/content_router.py apply）MCP 的 `headroom_compress` 会把内容包成 `role: tool` 再走同一个 `compress()`，并把原文存入本地 store。（来源：headroom/ccr/mcp_server.py _compress_content）"
    failure_mode: "docs/content/docs/quickstart.mdx；docs/content/docs/proxy.mdx；pyproject.toml"
    source_pointer: "https://github.com/chopratejas/headroom"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/Apache-2.0/v0.23.0"
experiments: []
claims:
  - "[[claims/chopratejas-headroom-main-claim-2]]"
artifacts:
  - "[[artifacts/project-chopratejas-headroom-repo]]"
metrics:
  - "stars=18831"
  - "forks=1202"
  - "open_issues=213"
  - "latest_release=v0.23.0"
  - "pushed_at=2026-06-08T23:50:08Z"
baselines: []
failure_modes:
  - "docs/content/docs/quickstart.mdx；docs/content/docs/proxy.mdx；pyproject.toml"
  - "pyproject.toml tool.maturin；crates/headroom-py/src/lib.rs；headroom/transforms/smart_crusher.py"
  - "docs/content/docs/mcp.mdx Cross-tool compatibility；headroom/cli/wrap.py；tests/test_cli/test_wrap_codex.py"
  - "headroom/cache/compression_store.py；headroom/ccr/mcp_server.py；docs/content/docs/mcp.mdx Troubleshooting"
  - "docs/content/docs/proxy.mdx Cloud providers / API endpoints；crates/headroom-proxy/src；tests/test_proxy_openai_responses_integration.py"
  - "docs/content/docs/proxy.mdx Starting the proxy；docs/content/docs/configuration.mdx Environment Variables"
missing_details: []
source_pointers:
  - "https://github.com/chopratejas/headroom"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/chopratejas-headroom-main-claim-2]],官方 artifact 落库为 [[artifacts/project-chopratejas-headroom-repo]]。See [[content/chopratejas-headroom]]。
