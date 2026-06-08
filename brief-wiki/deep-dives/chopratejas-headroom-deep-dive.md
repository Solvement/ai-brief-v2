---
content: "chopratejas-headroom"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "headroom — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "chopratejas/headroom：在工具输出、日志、文件和 RAG chunks 到达 LLM 前进行压缩；形态包括库、代理和 MCP server。"
  what_it_does: "Compress tool outputs, logs, files, and RAG chunks before they reach the LLM. 60-95% fewer tokens, same answers. Library, proxy, MCP server."
  metadata:
    language: "Python"
    total_stars: "17660"
    stars_in_period: "14922"
    author: "chopratejas"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "人话：值得看，是因为它把“少给模型喂废料”做成了多入口工程，而不是单个 prompt 技巧。最有复用价值的部分是：压缩前路由、压缩后可取回、代理透明接入、MCP 按需取回、以及失败会话学习。 术语：核心链路在 README 写成 `CacheAligner -> ContentRouter -> CCR`，源代码里 `compress()` 调用 `_get_pipeline()`，默认管线注释为 `CacheAligner -> ContentRouter`；`ContentRouterConfig` 里默认启用 `enable_smart_crusher=True`、`enable_search_compressor=True`、`enable_log_compressor=True`、`enable_html_extractor=True`、`enable_image_optimizer=True`，同时默认 `skip_user_messages=True`、`protect_recent_code=4`、`protect_analysis_context=True`（来源：README How it works；headroom/compress.py _get_pipeline；headroom/transforms/content_router.py ContentRouterConfig）。"
  core_capabilities:
    - "Compress-Cache-Retrieve marker"
    - "ContentRouter safety gates"
    - "Proxy-first SDK"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：Headroom 的位置更像“本地上下文压缩侧车 + SDK + MCP”，不是单一 CLI 过滤器，也不是只服务 RAG retriever。 1. RTK：README 对比表把 RTK 定位为“CLI command outputs / CLI wrapper / local / not reversible”，Headroom 源码也验证它会管理 RTK：`RTK_VERSION = \"v0.28.2\"`，下载 URL 指向 `https://github.com/rtk-ai/rtk/releases/download`，Claude hooks 通过 `rtk init --global --auto-patch` 注册（来源：README Compared to；headroom/rtk/__init__.py；headroom/rtk/installer.py）。构建 AI 应用时，如果只想改写 shell 输出，RTK 更窄、更直接；如果要覆盖 OpenAI/Anthropic proxy、MCP retrieve、SDK、RAG/tool JSON 压缩，选 Headroom。 2. lean-ctx：README 对比表把 lean-ctx 写成“CLI commands, MCP tools, editor rules / CLI wrapper · MCP / local / not reversible”；Headroom 源码验证可通过 `HEADROOM_CONTEXT_TOOL=lean-ctx` 选择它，并管理 `LEAN_CTX_VERSION = \"v3.4.7\"`（来源：README Compared to；headroom/cli/wrap.py；headroom/lean_ctx/__init__.py）。如果重点是给 coding agent 配上下文规则和 CLI/MCP 工具，lean-ctx 更聚焦；如果需要压缩后 hash 取回、HTTP proxy、TypeScript/Python SDK，Headroom 覆盖面更大。 3. LangChain ContextualCompressionRetriever：Headroom 自己的 LangChain 文档用 `ContextualCompressionRetriever` 包 `base_retriever`，示例中 `search_kwargs={\"k\": 50}`、`HeadroomDocumentCompressor(max_documents=10, min_relevance=0.3, prefer_diverse=True)`，最后“Retrieves 50 docs, returns best 10”（来源：docs/content/docs/langchain.mdx Retriever integration）。如果只在 LangChain RAG 链里压 retrieved documents，用 LangChain 原生 retriever 抽象就够；如果还要压工具输出、日志、CLI agent 流量和 MCP on-demand retrieve，Headroom 是更横向的层。 4. OpenAI/native compaction：README 对比表把 OpenAI Compaction 写成“Conversation history / Provider-native / not local / not reversible”，这是项目自称对比，未在本仓库独立验证（来源：README Compared to）。如果只使用单一 provider 的会话压缩且不需要本地 store，native compaction 更少运维；如果要跨 Claude/Codex/Cursor/Aider 和 OpenAI-compatible client 保持同一压缩/取回机制，Headroom 更适合。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：一个真实使用流可以从 quickstart 的 500 条搜索结果开始。Python 里构造 `messages`：system 是“You analyze search results.”，assistant 里有 `tool_calls`，tool 消息把 500 个 `{title, snippet, score}` 结果 JSON 化，最后用户问“What are the top 3 results?”，然后调用 `result = compress(messages, model=\"gpt-4o\")`（来源：docs/content/docs/quickstart.mdx 2. Compress messages）。 术语流程：`compress()` 先处理 hooks，再从消息里抽取 user query 给变换器做 relevance scoring，然后调用 pipeline；返回 `tokens_before`、`tokens_after`、`tokens_saved`、`compression_ratio`、`transforms_applied`（来源：headroom/compress.py compress）。默认 pipeline 在源码注释中是 `CacheAligner -> ContentRouter`，其中 ContentRouter 会跳过 user/system/developer 消息、小内容、近期代码、analysis intent 下的代码和已有 `Retrieve more: hash=` marker 的内容（来源：headroom/compress.py _get_pipeline；headroom/transforms/content_router.py message loop）。 对那条 500 结果 tool 消息，ContentRouter 会把 cache miss 放入 `pending_tasks`，最多用 `HEADROOM_COMPRESS_WORKERS`，默认字符串 `\"4\"`，并行调用 `self.compress(...)`；如果返回的 `result.compression_ratio < min_ratio`，就把压缩文本写回该消息，并记录类似 `router:<strategy>:<ratio>` 的 transform marker（来源：headroom/transforms/content_router.py pending_tasks / merge results）。JSON 数组会走 SmartCrusher；Python 类实际是 Rust-backed，通过 `from headroom._core import SmartCrusher` 和 `SmartCrusherConfig`，配置包括 `min_items_to_analyze=5`、`min_tokens_to_crush=200`、`max_items_after_crush=15`、`first_fraction=0.3`、`last_fraction=0.15`（来源：headroom/transforms/smart_crusher.py SmartCrusherConfig / SmartCrusher）。 可逆部分：SmartCrusher 或其他 compressor 产生 marker 后，Python store 会保存原文；普通 store 的默认 TTL 是 300 秒，hash 默认 `sha256(original)[:24]`；MCP 的 `headroom_compress` 会把输入包装成 `[{\"role\":\"tool\",\"content\":content}]` 调 `compress()`，再把原文存入本地 `CompressionStore(max_entries=500, default_ttl=MCP_SESSION_TTL)`，返回 `compressed`、`hash`、`original_tokens`、`compressed_tokens`、`tokens_saved`、`savings_percent`、`transforms`（来源：headroom/cache/compression_store.py CompressionStore.store；headroom/ccr/mcp_server.py _compress_content）。需要原文时，`headroom_retrieve` 先查本地 store；如果带 `query`，调用 `store.search(hash_key, query)`；否则 `store.retrieve(hash_key)`；失败后再 POST 到 proxy 的 `/v1/retrieve`（来源：headroom/ccr/mcp_server.py _retrieve_content / _retrieve_via_proxy）。"
  essential_design_difference: "这些抽象可以从项目里单独拆出来复用，不必照搬整个产品。 - Compress-Cache-Retrieve marker；把压缩输出写成可读 marker，例如文档中的 `[1000 items compressed to 20. Retrieve more: hash=abc123]`，同时把原文存到本地 store，用 MCP/工具调用按 hash 取回。；如果你的应用不能保证本地 store 生命周期、hash 不丢、模型能调用 retrieve 工具，就不要承诺“可逆”。；它把 aggressive compression 的风险从“永久丢上下文”降到“需要时取回”，是 agent 工具输出压缩最实用的边界设计（来源：docs/content/docs/ccr.mdx Phase 1-3；headroom/cache/compression_store.py）。 - ContentRouter safety gates；先判 role、长度、content type、近期窗口、analysis intent，再决定是否压缩；默认跳过 user/system/developer、近期代码、已有 retrieval marker 和小内容。；如果只是做离线摘要，不需要接入真实 agent 消息流，这套 gate 会显得过重。；agent 场景里“压错”比“不压”更糟；这些 gate 是把压缩放到生产工作流里的关键（来源：headroom/transforms/content_router.py ContentRouterConfig / message loop）。 - Proxy-first SDK；让 TS SDK 只做格式转换和 HTTP 调用，把压缩算法集中在本地 Python/Rust proxy；默认 `HEADROOM_BASE_URL` / `http://localhost:8787`。；如果你的目标是纯前端、无 sidecar、无本地服务，proxy-first 会增加部署负担。；这样可以避免在多语言 SDK 中复制复杂压缩逻辑，同时保持 OpenAI、Anthropic、Vercel AI SDK 适配层轻量（来源：docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts）。 - Agent failure learning marker block；`headroom learn` 把失败路径和成功修正写入 `CLAUDE.md` / `MEMORY.md`，并用 `<!-- headroom:learn:start -->` 到 `<!-- headroom:learn:end -->` 管理自动生成区。；如果团队不允许工具改写项目级 agent 指令文件，就只做 dry-run。；这把“agent 反复猜错路径/命令”的经验沉淀为下一次上下文，而不是只存在聊天记录里（来源：docs/content/docs/failure-learning.mdx Quick Start / Marker-Based Updates）。"
  practitioner_meaning: "人话：值得克隆跑，但不要先把 README 的“60–95%”当结论。更稳的评估路径是：用自己的 agent tool outputs 跑 `compress()` 和 `headroom proxy --port 8787`，看 `tokens_saved`、答案质量、MCP retrieve 次数和 proxy 延迟。 术语判断：工程深度高，因为它有 Python SDK、TS SDK、FastAPI proxy、MCP server、Rust core、Docker、tests、package extras、agent wrappers；成熟度给 3，是因为 `pyproject.toml` classifier 仍是 Beta，Windows wheels 未就绪，benchmark 多为项目自称，且 proxy/MCP/本地 store 的部署面较宽（来源：pyproject.toml classifiers；docs/content/docs/installation.mdx；docs/content/docs/proxy.mdx；tests/test_compress_api.py；tests/test_ccr.py；tests/test_cli/test_mcp.py）。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Headroom 是一个本地运行的 LLM 上下文压缩层，把工具输出、日志、RAG 结果、文件内容和消息历史在进入模型前压缩，并用 CCR 哈希保留原文可取回。"
    body_md: "人话：它不是只做一段文本摘要，而是把 AI coding agent 常见的大块输入放到一个统一入口里处理：Python `compress(messages)`、TypeScript SDK、`headroom proxy --port 8787`、`headroom wrap claude|codex|cursor|aider|copilot`、MCP 工具 `headroom_compress` / `headroom_retrieve` / `headroom_stats`（来源：README What it does；docs/content/docs/mcp.mdx Tools）。\n\n术语：这是一个 agent context compression / proxy / MCP 混合项目；Python 包名和 npm 包名都是 `headroom-ai`，版本在仓库包配置中是 `0.23.0`，Python 要求 `>=3.10`，许可证是 Apache-2.0（来源：pyproject.toml project；sdk/typescript/package.json；Cargo.toml workspace.package）。"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看，是因为它把“少给模型喂废料”做成了多入口工程，而不是单个 prompt 技巧。最有复用价值的部分是：压缩前路由、压缩后可取回、代理透明接入、MCP 按需取回、以及失败会话学习。\n\n术语：核心链路在 README 写成 `CacheAligner -> ContentRouter -> CCR`，源代码里 `compress()` 调用 `_get_pipeline()`，默认管线注释为 `CacheAligner -> ContentRouter`；`ContentRouterConfig` 里默认启用 `enable_smart_crusher=True`、`enable_search_compressor=True`、`enable_log_compressor=True`、`enable_html_extractor=True`、`enable_image_optimizer=True`，同时默认 `skip_user_messages=True`、`protect_recent_code=4`、`protect_analysis_context=True`（来源：README How it works；headroom/compress.py _get_pipeline；headroom/transforms/content_router.py ContentRouterConfig）。"
    bullets:
      - "它有真实安装面：`pip install \"headroom-ai[all]\"`、`npm install headroom-ai`、`docker pull ghcr.io/chopratejas/headroom:latest`，并且 `pyproject.toml` 声明 CLI 入口 `headroom = \"headroom.cli:main\"`（来源：README Install；pyproject.toml project.scripts）。"
      - "它把 TypeScript SDK 明确做成代理客户端：文档写明 TS SDK 需要先启动 `headroom proxy --port 8787`，代码中 `sdk/typescript/src/client.ts` 默认 `DEFAULT_BASE_URL = \"http://localhost:8787\"`，`compress.ts` 会把消息转为 OpenAI 格式再调用代理压缩（来源：docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts）。"
      - "它的“可逆”不是口号：`CompressionStore.store()` 默认用 SHA-256 截断 24 hex 字符作 key，默认 TTL 300 秒；MCP 专用本地 store 设置 `max_entries=500` 且 `default_ttl=MCP_SESSION_TTL`，文档说 MCP 本地内容保存 1 小时、proxy 内容 5 分钟（来源：headroom/cache/compression_store.py CompressionStore；headroom/ccr/mcp_server.py _get_local_store；docs/content/docs/mcp.mdx Troubleshooting）。"
      - "它包含对 agent 工作流的周边工程：`headroom learn` 默认 dry-run，`--apply` 写入 `CLAUDE.md` / `MEMORY.md`，并用 marker `<!-- headroom:learn:start -->` 管理生成区（来源：docs/content/docs/failure-learning.mdx Quick Start / Marker-Based Updates）。"
  key_claims_evidence:
    summary: ""
    body_md: "下面把项目自称和仓库可核实事实分开。README 的 savings、benchmark、compatibility 表都按自称处理；包配置、源码路径、测试文件和文档命令按已核实处理。"
    items:
      - claim: "“60–95% fewer tokens · library · proxy · MCP · 6 algorithms · local-first · reversible”。"
        plain_english: "项目说自己能在本地用库、代理和 MCP 三种方式减少 token，并保留可逆取回。"
        source: "README top badge line / What it does"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确列出 `compress(messages)`、`headroom proxy --port 8787`、`headroom wrap ...`、MCP 工具和 CCR；源码也有对应入口。"
        does_not_support: "仓库检查没有独立第三方复现实验；60–95% 是项目声明，不能当外部验证结论。"
        threat: "不同内容类型差异很大；docs/benchmarks.mdx 自称 grep results 和 Python source 在表中为 0.0% 压缩。"
      - claim: "Python 包、TypeScript 包和 CLI 是同名产品面。"
        plain_english: "不是只有 README，包配置真的声明了可安装包和命令。"
        source: "pyproject.toml project / project.scripts；sdk/typescript/package.json"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`pyproject.toml` 声明 `name = \"headroom-ai\"`、`version = \"0.23.0\"`、`requires-python = \">=3.10\"`、`headroom = \"headroom.cli:main\"`；TypeScript `package.json` 声明 `name: headroom-ai`、`version: 0.23.0`、Node `>=18.0.0`。"
        does_not_support: "没有证明 PyPI/npm 当前线上包一定与该 checkout 完全一致。"
        threat: "Windows 没有预构建 wheel，安装会退回本地编译 Rust 扩展。"
      - claim: "TypeScript SDK 通过本地 proxy 压缩，而不是纯 JS 本地压缩。"
        plain_english: "Node 侧调用 `compress()` 时，需要一个本地 Headroom proxy 来真正跑压缩管线。"
        source: "docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文档要求 `pip install \"headroom-ai[proxy]\"` 后运行 `headroom proxy --port 8787`；TS `compress()` 检测格式、转 OpenAI 格式，再 `client.compress(...)`；client 默认 base URL 是 `http://localhost:8787`。"
        does_not_support: "不支持“TS SDK 完全离线无 Python/proxy 依赖”的理解。"
        threat: "部署 TS 应用时必须管理本地/旁路 proxy 的生命周期和连通性。"
      - claim: "CCR 通过 hash 存原文，并让 LLM 按需取回。"
        plain_english: "压缩不是永久丢弃；原始内容被放进本地 store，压缩结果带 hash，模型可以调用 retrieve。"
        source: "docs/content/docs/ccr.mdx Architecture / Phase 1-3；headroom/cache/compression_store.py store；headroom/ccr/tool_injection.py；headroom/ccr/response_handler.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`CompressionStore.store()` 返回 SHA-256[:24] hash；`headroom_retrieve` 工具 schema 有 `hash` 和可选 `query`；response handler 会从 store `retrieve()` 或 `search()`。"
        does_not_support: "不等于语义无损；被压缩的上下文对模型初次可见的信息仍减少，只有模型或系统触发取回时才补原文。"
        threat: "TTL、进程内 store、proxy 可达性和 hash marker 一致性都会影响取回成功。"
      - claim: "MCP 提供压缩、取回、统计三个工具。"
        plain_english: "MCP 客户端不必走 HTTP proxy，也可以让模型主动调用工具压缩大内容或取回原文。"
        source: "docs/content/docs/mcp.mdx Tools / CLI commands；headroom/ccr/mcp_server.py list_tools"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文档列出 `headroom_compress`、`headroom_retrieve`、`headroom_stats`；源码常量为 `COMPRESS_TOOL_NAME`、`CCR_TOOL_NAME`、`STATS_TOOL_NAME`，并在 `list_tools()` 注册。"
        does_not_support: "文档也明确不要假设 proxy 有 HTTP MCP endpoint `/mcp`；应配置 stdio `headroom mcp serve`。"
        threat: "Claude Code `/usage` 会把 MCP 调用和结果算进上下文；大量 MCP 调用本身有开销。"
      - claim: "默认对代码和系统/用户消息有保护门。"
        plain_english: "它不是一律压缩所有东西；用户原话、系统提示、近期代码、分析意图下的代码会被跳过。"
        source: "headroom/transforms/content_router.py ContentRouterConfig / message loop；docs/content/docs/limitations.mdx Code Compression"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "源码默认 `skip_user_messages=True`、`protect_recent_code=4`、`protect_analysis_context=True`、`compress_assistant_text_blocks=False`；消息循环会对 user/system/developer、小内容、近期代码、已压缩 marker 等路径跳过。"
        does_not_support: "不支持“所有代码都会被 AST 压缩”；docs 明确说 source code 多数情况下会 pass through。"
        threat: "强行关保护可能破坏代码分析任务的可用上下文。"
      - claim: "项目有自称 benchmark 和 telemetry。"
        plain_english: "它给出了若干数字，但这些仍是仓库文档中的项目方结果。"
        source: "README Proof；docs/content/docs/benchmarks.mdx Compression Performance / Production Telemetry"
        attribution: "自称"
        evidence_strength: "low"
        supports: "README 表中列出 Code search 17,765 -> 1,408 tokens、SRE incident 65,694 -> 5,118；docs 还列出 50,000+ proxy sessions、250+ unique instances、1.4 billion tokens saved。"
        does_not_support: "本次未运行 `python -m headroom.evals suite --tier 1`，也未验证 telemetry 数据来源。"
        threat: "版本不一致：docs/benchmarks.mdx 说明部分测试基于 Headroom v0.5.18，而当前包版本是 0.23.0。"
  how_it_works:
    summary: ""
    body_md: "人话：一个真实使用流可以从 quickstart 的 500 条搜索结果开始。Python 里构造 `messages`：system 是“You analyze search results.”，assistant 里有 `tool_calls`，tool 消息把 500 个 `{title, snippet, score}` 结果 JSON 化，最后用户问“What are the top 3 results?”，然后调用 `result = compress(messages, model=\"gpt-4o\")`（来源：docs/content/docs/quickstart.mdx 2. Compress messages）。\n\n术语流程：`compress()` 先处理 hooks，再从消息里抽取 user query 给变换器做 relevance scoring，然后调用 pipeline；返回 `tokens_before`、`tokens_after`、`tokens_saved`、`compression_ratio`、`transforms_applied`（来源：headroom/compress.py compress）。默认 pipeline 在源码注释中是 `CacheAligner -> ContentRouter`，其中 ContentRouter 会跳过 user/system/developer 消息、小内容、近期代码、analysis intent 下的代码和已有 `Retrieve more: hash=` marker 的内容（来源：headroom/compress.py _get_pipeline；headroom/transforms/content_router.py message loop）。\n\n对那条 500 结果 tool 消息，ContentRouter 会把 cache miss 放入 `pending_tasks`，最多用 `HEADROOM_COMPRESS_WORKERS`，默认字符串 `\"4\"`，并行调用 `self.compress(...)`；如果返回的 `result.compression_ratio < min_ratio`，就把压缩文本写回该消息，并记录类似 `router:<strategy>:<ratio>` 的 transform marker（来源：headroom/transforms/content_router.py pending_tasks / merge results）。JSON 数组会走 SmartCrusher；Python 类实际是 Rust-backed，通过 `from headroom._core import SmartCrusher` 和 `SmartCrusherConfig`，配置包括 `min_items_to_analyze=5`、`min_tokens_to_crush=200`、`max_items_after_crush=15`、`first_fraction=0.3`、`last_fraction=0.15`（来源：headroom/transforms/smart_crusher.py SmartCrusherConfig / SmartCrusher）。\n\n可逆部分：SmartCrusher 或其他 compressor 产生 marker 后，Python store 会保存原文；普通 store 的默认 TTL 是 300 秒，hash 默认 `sha256(original)[:24]`；MCP 的 `headroom_compress` 会把输入包装成 `[{\"role\":\"tool\",\"content\":content}]` 调 `compress()`，再把原文存入本地 `CompressionStore(max_entries=500, default_ttl=MCP_SESSION_TTL)`，返回 `compressed`、`hash`、`original_tokens`、`compressed_tokens`、`tokens_saved`、`savings_percent`、`transforms`（来源：headroom/cache/compression_store.py CompressionStore.store；headroom/ccr/mcp_server.py _compress_content）。需要原文时，`headroom_retrieve` 先查本地 store；如果带 `query`，调用 `store.search(hash_key, query)`；否则 `store.retrieve(hash_key)`；失败后再 POST 到 proxy 的 `/v1/retrieve`（来源：headroom/ccr/mcp_server.py _retrieve_content / _retrieve_via_proxy）。"
  reusable_abstractions:
    summary: ""
    body_md: "这些抽象可以从项目里单独拆出来复用，不必照搬整个产品。"
    items:
      - name: "Compress-Cache-Retrieve marker"
        copy: "把压缩输出写成可读 marker，例如文档中的 `[1000 items compressed to 20. Retrieve more: hash=abc123]`，同时把原文存到本地 store，用 MCP/工具调用按 hash 取回。"
        skip: "如果你的应用不能保证本地 store 生命周期、hash 不丢、模型能调用 retrieve 工具，就不要承诺“可逆”。"
        why_it_matters: "它把 aggressive compression 的风险从“永久丢上下文”降到“需要时取回”，是 agent 工具输出压缩最实用的边界设计（来源：docs/content/docs/ccr.mdx Phase 1-3；headroom/cache/compression_store.py）。"
      - name: "ContentRouter safety gates"
        copy: "先判 role、长度、content type、近期窗口、analysis intent，再决定是否压缩；默认跳过 user/system/developer、近期代码、已有 retrieval marker 和小内容。"
        skip: "如果只是做离线摘要，不需要接入真实 agent 消息流，这套 gate 会显得过重。"
        why_it_matters: "agent 场景里“压错”比“不压”更糟；这些 gate 是把压缩放到生产工作流里的关键（来源：headroom/transforms/content_router.py ContentRouterConfig / message loop）。"
      - name: "Proxy-first SDK"
        copy: "让 TS SDK 只做格式转换和 HTTP 调用，把压缩算法集中在本地 Python/Rust proxy；默认 `HEADROOM_BASE_URL` / `http://localhost:8787`。"
        skip: "如果你的目标是纯前端、无 sidecar、无本地服务，proxy-first 会增加部署负担。"
        why_it_matters: "这样可以避免在多语言 SDK 中复制复杂压缩逻辑，同时保持 OpenAI、Anthropic、Vercel AI SDK 适配层轻量（来源：docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts）。"
      - name: "Agent failure learning marker block"
        copy: "`headroom learn` 把失败路径和成功修正写入 `CLAUDE.md` / `MEMORY.md`，并用 `<!-- headroom:learn:start -->` 到 `<!-- headroom:learn:end -->` 管理自动生成区。"
        skip: "如果团队不允许工具改写项目级 agent 指令文件，就只做 dry-run。"
        why_it_matters: "这把“agent 反复猜错路径/命令”的经验沉淀为下一次上下文，而不是只存在聊天记录里（来源：docs/content/docs/failure-learning.mdx Quick Start / Marker-Based Updates）。"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险不是“能不能写 demo”，而是部署边界：本地 proxy、Rust 扩展、可选 ML/向量依赖、agent 配置文件改写、以及 Windows wheel 缺口。"
    items:
      - dependency: "Rust + maturin + PyO3 extension `headroom._core`"
        what_if_change: "没有预构建 wheel 或本机没有工具链时，安装会尝试从 sdist 编译 Rust 扩展；SmartCrusher 源码是 hard import `headroom._core`，没有 Python fallback。"
        exposure: "high"
        mitigation_or_unknown: "Dockerfile 在 build stage 安装 Rust toolchain，并用 `from headroom._core import DiffCompressor, SmartCrusher` 做 smoke check；Windows 原生安装仍需 MSVC + Rust。"
        source: "pyproject.toml build-system / maturin comments；headroom/transforms/smart_crusher.py SmartCrusher；Dockerfile build-stage smoke check；docs/content/docs/installation.mdx Windows"
      - dependency: "Windows / Intel macOS wheel availability"
        what_if_change: "docs 明确说当前 release wheels 覆盖 Python 3.10-3.13 的 Linux manylinux_2_28 x86_64/aarch64 和 macOS Apple Silicon；Windows 和 Intel macOS 会 fallback build。"
        exposure: "medium"
        mitigation_or_unknown: "Windows 需 Build Tools for Visual Studio 的 Desktop development with C++、rustup stable-x86_64-pc-windows-msvc；也可用 Docker。native Windows wheels 由 issue #636 跟踪。"
        source: "docs/content/docs/installation.mdx Python / Windows"
      - dependency: "Local proxy runtime: FastAPI, uvicorn, httpx, provider SDKs"
        what_if_change: "如果 proxy 未启动，TS SDK 和 base-url routing 会失败或无法压缩；proxy 模式还要管理端口、upstream URL、telemetry、stateful 文件。"
        exposure: "high"
        mitigation_or_unknown: "文档提供 `headroom proxy --port 8787`、`--stateless`、`HEADROOM_HOST`、`HEADROOM_PORT`、`HEADROOM_BASE_URL`、`HEADROOM_TELEMETRY=off` 等控制项。"
        source: "docs/content/docs/proxy.mdx CLI options / API endpoints；docs/content/docs/configuration.mdx Environment Variables"
      - dependency: "MCP stdio registration and agent config files"
        what_if_change: "MCP 工具不可见、proxy URL 配错或 hash 过期时，模型无法取回被压缩内容；docs 明确 `/mcp` HTTP endpoint 不是默认假设。"
        exposure: "medium"
        mitigation_or_unknown: "使用 `headroom mcp install`、`headroom mcp status`、或手写 stdio config `args: [\"mcp\", \"serve\", \"--proxy-url\", \"http://127.0.0.1:8787\"]`。"
        source: "docs/content/docs/mcp.mdx CLI commands / MCP host configuration / Troubleshooting"
      - dependency: "Optional ML/vector/image dependencies"
        what_if_change: "`[ml]` 引入 torch/transformers/huggingface-hub；`[memory]` 引入 hnswlib/sqlite-vec/sentence-transformers；`[image]` 引入 OCR/ONNX/Pillow，安装体积和平台兼容性会上升。"
        exposure: "medium"
        mitigation_or_unknown: "按需安装 extras；基础包和 `[proxy]` 分开，`[all]` 会拉齐 proxy/code/ml/memory/relevance/image/reports/otel/evals/voice/html/benchmark/mcp。"
        source: "pyproject.toml optional-dependencies；docs/content/docs/installation.mdx Extras"
      - dependency: "外部 CLI 二进制 RTK、lean-ctx、difft、scc"
        what_if_change: "下载失败、TLS 问题、平台不支持或离线环境会影响 wrap/context-tool 或辅助工具；`headroom/binaries.py` 支持 `HEADROOM_BINARIES_OFFLINE` 直接禁止网络获取。"
        exposure: "medium"
        mitigation_or_unknown: "RTK/lean-ctx installer 失败会 warning 并继续；外部工具有 cache/mirror/offline env；RTK/lean-ctx 也可预装到 PATH。"
        source: "headroom/binaries.py；headroom/rtk/installer.py；headroom/lean_ctx/installer.py；headroom/cli/wrap.py"
  unknowns_to_confirm:
    summary: ""
    body_md: "以下不是猜测，而是本次只读检查后仍不能从 README/docs/tree 直接确认的事项。"
    items:
      - "本次没有运行 benchmark 或测试套件；README 和 docs/benchmarks.mdx 的 savings、accuracy、telemetry 数字按项目自称处理。"
      - "当前 Git checkout 是 `8dbe7ad41b3a1d33c01874be5c1cbc68a5e68111`，但没有验证 PyPI/npm/容器 registry 上的发布 artifact 是否与该 commit 字节一致。"
      - "Windows Credential Manager、Linux Secret Service / `secret-tool`、Docker/CI Copilot token injection 的真实 OS 验证，README 自己写了仍需 real OS validation。"
      - "Kompress-base 的模型卡、训练数据和质量边界未在本地仓库文件中完整展开；README 链接 Hugging Face，但本次未验证外部模型页面。"
      - "生产 telemetry 的采集、清洗、去重和样本偏差未在仓库文档中给出足够可审计细节。"
      - "MCP 大量调用对 Claude Code `/usage` 的净收益需要在真实工作流中测；docs 只给了检查建议。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 3
    body_md: "人话：值得克隆跑，但不要先把 README 的“60–95%”当结论。更稳的评估路径是：用自己的 agent tool outputs 跑 `compress()` 和 `headroom proxy --port 8787`，看 `tokens_saved`、答案质量、MCP retrieve 次数和 proxy 延迟。\n\n术语判断：工程深度高，因为它有 Python SDK、TS SDK、FastAPI proxy、MCP server、Rust core、Docker、tests、package extras、agent wrappers；成熟度给 3，是因为 `pyproject.toml` classifier 仍是 Beta，Windows wheels 未就绪，benchmark 多为项目自称，且 proxy/MCP/本地 store 的部署面较宽（来源：pyproject.toml classifiers；docs/content/docs/installation.mdx；docs/content/docs/proxy.mdx；tests/test_compress_api.py；tests/test_ccr.py；tests/test_cli/test_mcp.py）。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\chopratejas-headroom\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\chopratejas-headroom\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\chopratejas-headroom\\codex-last-message.json"
  invoked_at: "2026-06-08T14:32:43.144Z"
  completed_at: "2026-06-08T14:37:57.639Z"
  repo: "chopratejas/headroom"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "Compress tool outputs, logs, files, and RAG chunks before they reach the LLM. 60-95% fewer tokens, same answers. Library, proxy, MCP server."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“60–95% fewer tokens · library · proxy · MCP · 6 algorithms · local-first · reversible”。"
    - "Python 包、TypeScript 包和 CLI 是同名产品面。"
    - "TypeScript SDK 通过本地 proxy 压缩，而不是纯 JS 本地压缩。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "pyproject.toml build-system / maturin comments；headroom/transforms/smart_crusher.py SmartCrusher；Dockerfile build-stage smoke check；docs/content/docs/installation.mdx Windows"
    - "docs/content/docs/installation.mdx Python / Windows"
    - "docs/content/docs/proxy.mdx CLI options / API endpoints；docs/content/docs/configuration.mdx Environment Variables"
    - "docs/content/docs/mcp.mdx CLI commands / MCP host configuration / Troubleshooting"
    - "pyproject.toml optional-dependencies；docs/content/docs/installation.mdx Extras"
    - "headroom/binaries.py；headroom/rtk/installer.py；headroom/lean_ctx/installer.py；headroom/cli/wrap.py"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 3
  main_risk: "人话：值得克隆跑，但不要先把 README 的“60–95%”当结论。更稳的评估路径是：用自己的 agent tool outputs 跑 `compress()` 和 `headroom proxy --port 8787`，看 `tokens_saved`、答案质量、MCP retrieve 次数和 proxy 延迟。 术语判断：工程深度高，因为它有 Python SDK、TS SDK、FastAPI proxy、MCP server、Rust core、Docker、tests、package extras、agent wrappers；成熟度给 3，是因为 `pyproject.toml` classifier 仍是 Beta，Windows wheels 未就绪，benchmark 多为项目自称，且 proxy/MCP/本地 store 的部署面较宽（来源：pyproject.toml classifiers；docs/content/docs/installation.mdx；docs/content/docs/proxy.mdx；tests/test_compress_api.py；tests/test_ccr.py；tests/test_cli/test_mcp.py）。"
next_actions:
  - "clone-and-run"
unknowns:
  - "本次没有运行 benchmark 或测试套件；README 和 docs/benchmarks.mdx 的 savings、accuracy、telemetry 数字按项目自称处理。"
  - "当前 Git checkout 是 `8dbe7ad41b3a1d33c01874be5c1cbc68a5e68111`，但没有验证 PyPI/npm/容器 registry 上的发布 artifact 是否与该 commit 字节一致。"
  - "Windows Credential Manager、Linux Secret Service / `secret-tool`、Docker/CI Copilot token injection 的真实 OS 验证，README 自己写了仍需 real OS validation。"
  - "Kompress-base 的模型卡、训练数据和质量边界未在本地仓库文件中完整展开；README 链接 Hugging Face，但本次未验证外部模型页面。"
  - "生产 telemetry 的采集、清洗、去重和样本偏差未在仓库文档中给出足够可审计细节。"
  - "MCP 大量调用对 Claude Code `/usage` 的净收益需要在真实工作流中测；docs 只给了检查建议。"
builder_reuse:
  pattern: "Compress-Cache-Retrieve marker"
  copy: "把压缩输出写成可读 marker，例如文档中的 `[1000 items compressed to 20. Retrieve more: hash=abc123]`，同时把原文存到本地 store，用 MCP/工具调用按 hash 取回。"
  skip: "如果你的应用不能保证本地 store 生命周期、hash 不丢、模型能调用 retrieve 工具，就不要承诺“可逆”。"
  why_it_matters: "它把 aggressive compression 的风险从“永久丢上下文”降到“需要时取回”，是 agent 工具输出压缩最实用的边界设计（来源：docs/content/docs/ccr.mdx Phase 1-3；headroom/cache/compression_store.py）。"
dependency_platform_risk:
  dependency: "Rust + maturin + PyO3 extension `headroom._core`"
  what_if_change: "没有预构建 wheel 或本机没有工具链时，安装会尝试从 sdist 编译 Rust 扩展；SmartCrusher 源码是 hard import `headroom._core`，没有 Python fallback。"
  exposure: "high"
  mitigation_or_unknown: "Dockerfile 在 build stage 安装 Rust toolchain，并用 `from headroom._core import DiffCompressor, SmartCrusher` 做 smoke check；Windows 原生安装仍需 MSVC + Rust。"
claim_ledger:
  - claim: "“60–95% fewer tokens · library · proxy · MCP · 6 algorithms · local-first · reversible”。"
    plain_english: "项目说自己能在本地用库、代理和 MCP 三种方式减少 token，并保留可逆取回。"
    source: "README top badge line / What it does"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确列出 `compress(messages)`、`headroom proxy --port 8787`、`headroom wrap ...`、MCP 工具和 CCR；源码也有对应入口。"
    does_not_support: "仓库检查没有独立第三方复现实验；60–95% 是项目声明，不能当外部验证结论。"
    threat: "不同内容类型差异很大；docs/benchmarks.mdx 自称 grep results 和 Python source 在表中为 0.0% 压缩。"
  - claim: "Python 包、TypeScript 包和 CLI 是同名产品面。"
    plain_english: "不是只有 README，包配置真的声明了可安装包和命令。"
    source: "pyproject.toml project / project.scripts；sdk/typescript/package.json"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`pyproject.toml` 声明 `name = \"headroom-ai\"`、`version = \"0.23.0\"`、`requires-python = \">=3.10\"`、`headroom = \"headroom.cli:main\"`；TypeScript `package.json` 声明 `name: headroom-ai`、`version: 0.23.0`、Node `>=18.0.0`。"
    does_not_support: "没有证明 PyPI/npm 当前线上包一定与该 checkout 完全一致。"
    threat: "Windows 没有预构建 wheel，安装会退回本地编译 Rust 扩展。"
  - claim: "TypeScript SDK 通过本地 proxy 压缩，而不是纯 JS 本地压缩。"
    plain_english: "Node 侧调用 `compress()` 时，需要一个本地 Headroom proxy 来真正跑压缩管线。"
    source: "docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文档要求 `pip install \"headroom-ai[proxy]\"` 后运行 `headroom proxy --port 8787`；TS `compress()` 检测格式、转 OpenAI 格式，再 `client.compress(...)`；client 默认 base URL 是 `http://localhost:8787`。"
    does_not_support: "不支持“TS SDK 完全离线无 Python/proxy 依赖”的理解。"
    threat: "部署 TS 应用时必须管理本地/旁路 proxy 的生命周期和连通性。"
  - claim: "CCR 通过 hash 存原文，并让 LLM 按需取回。"
    plain_english: "压缩不是永久丢弃；原始内容被放进本地 store，压缩结果带 hash，模型可以调用 retrieve。"
    source: "docs/content/docs/ccr.mdx Architecture / Phase 1-3；headroom/cache/compression_store.py store；headroom/ccr/tool_injection.py；headroom/ccr/response_handler.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`CompressionStore.store()` 返回 SHA-256[:24] hash；`headroom_retrieve` 工具 schema 有 `hash` 和可选 `query`；response handler 会从 store `retrieve()` 或 `search()`。"
    does_not_support: "不等于语义无损；被压缩的上下文对模型初次可见的信息仍减少，只有模型或系统触发取回时才补原文。"
    threat: "TTL、进程内 store、proxy 可达性和 hash marker 一致性都会影响取回成功。"
  - claim: "MCP 提供压缩、取回、统计三个工具。"
    plain_english: "MCP 客户端不必走 HTTP proxy，也可以让模型主动调用工具压缩大内容或取回原文。"
    source: "docs/content/docs/mcp.mdx Tools / CLI commands；headroom/ccr/mcp_server.py list_tools"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文档列出 `headroom_compress`、`headroom_retrieve`、`headroom_stats`；源码常量为 `COMPRESS_TOOL_NAME`、`CCR_TOOL_NAME`、`STATS_TOOL_NAME`，并在 `list_tools()` 注册。"
    does_not_support: "文档也明确不要假设 proxy 有 HTTP MCP endpoint `/mcp`；应配置 stdio `headroom mcp serve`。"
    threat: "Claude Code `/usage` 会把 MCP 调用和结果算进上下文；大量 MCP 调用本身有开销。"
  - claim: "默认对代码和系统/用户消息有保护门。"
    plain_english: "它不是一律压缩所有东西；用户原话、系统提示、近期代码、分析意图下的代码会被跳过。"
    source: "headroom/transforms/content_router.py ContentRouterConfig / message loop；docs/content/docs/limitations.mdx Code Compression"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "源码默认 `skip_user_messages=True`、`protect_recent_code=4`、`protect_analysis_context=True`、`compress_assistant_text_blocks=False`；消息循环会对 user/system/developer、小内容、近期代码、已压缩 marker 等路径跳过。"
    does_not_support: "不支持“所有代码都会被 AST 压缩”；docs 明确说 source code 多数情况下会 pass through。"
    threat: "强行关保护可能破坏代码分析任务的可用上下文。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 65: 人话：一个真实使用流可以从 quickstart 的 500 条搜索结果开始。Python 里构造 `messages`：system 是“You analyze search results.”，assistant 里有 `tool_calls`，tool 消息把 500..."
artifact_audit:
  official_repo: "https://github.com/chopratejas/headroom"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

chopratejas/headroom：在工具输出、日志、文件和 RAG chunks 到达 LLM 前进行压缩；形态包括库、代理和 MCP server。

（来源：README/artifactAudit）

## 干什么

Compress tool outputs, logs, files, and RAG chunks before they reach the LLM. 60-95% fewer tokens, same answers. Library, proxy, MCP server.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 17660 |
| stars_in_period | 14922 |
| author | chopratejas |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

人话：值得看，是因为它把“少给模型喂废料”做成了多入口工程，而不是单个 prompt 技巧。最有复用价值的部分是：压缩前路由、压缩后可取回、代理透明接入、MCP 按需取回、以及失败会话学习。 术语：核心链路在 README 写成 `CacheAligner -> ContentRouter -> CCR`，源代码里 `compress()` 调用 `_get_pipeline()`，默认管线注释为 `CacheAligner -> ContentRouter`；`ContentRouterConfig` 里默认启用 `enable_smart_crusher=True`、`enable_search_compressor=True`、`enable_log_compressor=True`、`enable_html_extractor=True`、`enable_image_optimizer=True`，同时默认 `skip_user_messages=True`、`protect_recent_code=4`、`protect_analysis_context=True`（来源：README How it works；headroom/compress.py _get_pipeline；headroom/transforms/content_router.py ContentRouterConfig）。

## 核心能力

- Compress-Cache-Retrieve marker（来源：数据不足）
- ContentRouter safety gates（来源：数据不足）
- Proxy-first SDK（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：Headroom 的位置更像“本地上下文压缩侧车 + SDK + MCP”，不是单一 CLI 过滤器，也不是只服务 RAG retriever。 1. RTK：README 对比表把 RTK 定位为“CLI command outputs / CLI wrapper / local / not reversible”，Headroom 源码也验证它会管理 RTK：`RTK_VERSION = "v0.28.2"`，下载 URL 指向 `https://github.com/rtk-ai/rtk/releases/download`，Claude hooks 通过 `rtk init --global --auto-patch` 注册（来源：README Compared to；headroom/rtk/__init__.py；headroom/rtk/installer.py）。构建 AI 应用时，如果只想改写 shell 输出，RTK 更窄、更直接；如果要覆盖 OpenAI/Anthropic proxy、MCP retrieve、SDK、RAG/tool JSON 压缩，选 Headroom。 2. lean-ctx：README 对比表把 lean-ctx 写成“CLI commands, MCP tools, editor rules / CLI wrapper · MCP / local / not reversible”；Headroom 源码验证可通过 `HEADROOM_CONTEXT_TOOL=lean-ctx` 选择它，并管理 `LEAN_CTX_VERSION = "v3.4.7"`（来源：README Compared to；headroom/cli/wrap.py；headroom/lean_ctx/__init__.py）。如果重点是给 coding agent 配上下文规则和 CLI/MCP 工具，lean-ctx 更聚焦；如果需要压缩后 hash 取回、HTTP proxy、TypeScript/Python SDK，Headroom 覆盖面更大。 3. LangChain ContextualCompressionRetriever：Headroom 自己的 LangChain 文档用 `ContextualCompressionRetriever` 包 `base_retriever`，示例中 `search_kwargs={"k": 50}`、`HeadroomDocumentCompressor(max_documents=10, min_relevance=0.3, prefer_diverse=True)`，最后“Retrieves 50 docs, returns best 10”（来源：docs/content/docs/langchain.mdx Retriever integration）。如果只在 LangChain RAG 链里压 retrieved documents，用 LangChain 原生 retriever 抽象就够；如果还要压工具输出、日志、CLI agent 流量和 MCP on-demand retrieve，Headroom 是更横向的层。 4. OpenAI/native compaction：README 对比表把 OpenAI Compaction 写成“Conversation history / Provider-native / not local / not reversible”，这是项目自称对比，未在本仓库独立验证（来源：README Compared to）。如果只使用单一 provider 的会话压缩且不需要本地 store，native compaction 更少运维；如果要跨 Claude/Codex/Cursor/Aider 和 OpenAI-compatible client 保持同一压缩/取回机制，Headroom 更适合。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：一个真实使用流可以从 quickstart 的 500 条搜索结果开始。Python 里构造 `messages`：system 是“You analyze search results.”，assistant 里有 `tool_calls`，tool 消息把 500 个 `{title, snippet, score}` 结果 JSON 化，最后用户问“What are the top 3 results?”，然后调用 `result = compress(messages, model="gpt-4o")`（来源：docs/content/docs/quickstart.mdx 2. Compress messages）。 术语流程：`compress()` 先处理 hooks，再从消息里抽取 user query 给变换器做 relevance scoring，然后调用 pipeline；返回 `tokens_before`、`tokens_after`、`tokens_saved`、`compression_ratio`、`transforms_applied`（来源：headroom/compress.py compress）。默认 pipeline 在源码注释中是 `CacheAligner -> ContentRouter`，其中 ContentRouter 会跳过 user/system/developer 消息、小内容、近期代码、analysis intent 下的代码和已有 `Retrieve more: hash=` marker 的内容（来源：headroom/compress.py _get_pipeline；headroom/transforms/content_router.py message loop）。 对那条 500 结果 tool 消息，ContentRouter 会把 cache miss 放入 `pending_tasks`，最多用 `HEADROOM_COMPRESS_WORKERS`，默认字符串 `"4"`，并行调用 `self.compress(...)`；如果返回的 `result.compression_ratio < min_ratio`，就把压缩文本写回该消息，并记录类似 `router:<strategy>:<ratio>` 的 transform marker（来源：headroom/transforms/content_router.py pending_tasks / merge results）。JSON 数组会走 SmartCrusher；Python 类实际是 Rust-backed，通过 `from headroom._core import SmartCrusher` 和 `SmartCrusherConfig`，配置包括 `min_items_to_analyze=5`、`min_tokens_to_crush=200`、`max_items_after_crush=15`、`first_fraction=0.3`、`last_fraction=0.15`（来源：headroom/transforms/smart_crusher.py SmartCrusherConfig / SmartCrusher）。 可逆部分：SmartCrusher 或其他 compressor 产生 marker 后，Python store 会保存原文；普通 store 的默认 TTL 是 300 秒，hash 默认 `sha256(original)[:24]`；MCP 的 `headroom_compress` 会把输入包装成 `[{"role":"tool","content":content}]` 调 `compress()`，再把原文存入本地 `CompressionStore(max_entries=500, default_ttl=MCP_SESSION_TTL)`，返回 `compressed`、`hash`、`original_tokens`、`compressed_tokens`、`tokens_saved`、`savings_percent`、`transforms`（来源：headroom/cache/compression_store.py CompressionStore.store；headroom/ccr/mcp_server.py _compress_content）。需要原文时，`headroom_retrieve` 先查本地 store；如果带 `query`，调用 `store.search(hash_key, query)`；否则 `store.retrieve(hash_key)`；失败后再 POST 到 proxy 的 `/v1/retrieve`（来源：headroom/ccr/mcp_server.py _retrieve_content / _retrieve_via_proxy）。

## 本质不同的设计取舍

这些抽象可以从项目里单独拆出来复用，不必照搬整个产品。 - Compress-Cache-Retrieve marker；把压缩输出写成可读 marker，例如文档中的 `[1000 items compressed to 20. Retrieve more: hash=abc123]`，同时把原文存到本地 store，用 MCP/工具调用按 hash 取回。；如果你的应用不能保证本地 store 生命周期、hash 不丢、模型能调用 retrieve 工具，就不要承诺“可逆”。；它把 aggressive compression 的风险从“永久丢上下文”降到“需要时取回”，是 agent 工具输出压缩最实用的边界设计（来源：docs/content/docs/ccr.mdx Phase 1-3；headroom/cache/compression_store.py）。 - ContentRouter safety gates；先判 role、长度、content type、近期窗口、analysis intent，再决定是否压缩；默认跳过 user/system/developer、近期代码、已有 retrieval marker 和小内容。；如果只是做离线摘要，不需要接入真实 agent 消息流，这套 gate 会显得过重。；agent 场景里“压错”比“不压”更糟；这些 gate 是把压缩放到生产工作流里的关键（来源：headroom/transforms/content_router.py ContentRouterConfig / message loop）。 - Proxy-first SDK；让 TS SDK 只做格式转换和 HTTP 调用，把压缩算法集中在本地 Python/Rust proxy；默认 `HEADROOM_BASE_URL` / `http://localhost:8787`。；如果你的目标是纯前端、无 sidecar、无本地服务，proxy-first 会增加部署负担。；这样可以避免在多语言 SDK 中复制复杂压缩逻辑，同时保持 OpenAI、Anthropic、Vercel AI SDK 适配层轻量（来源：docs/content/docs/quickstart.mdx TypeScript SDK requires the proxy；sdk/typescript/src/compress.ts；sdk/typescript/src/client.ts）。 - Agent failure learning marker block；`headroom learn` 把失败路径和成功修正写入 `CLAUDE.md` / `MEMORY.md`，并用 `<!-- headroom:learn:start -->` 到 `<!-- headroom:learn:end -->` 管理自动生成区。；如果团队不允许工具改写项目级 agent 指令文件，就只做 dry-run。；这把“agent 反复猜错路径/命令”的经验沉淀为下一次上下文，而不是只存在聊天记录里（来源：docs/content/docs/failure-learning.mdx Quick Start / Marker-Based Updates）。

## 对从业者意味着什么

人话：值得克隆跑，但不要先把 README 的“60–95%”当结论。更稳的评估路径是：用自己的 agent tool outputs 跑 `compress()` 和 `headroom proxy --port 8787`，看 `tokens_saved`、答案质量、MCP retrieve 次数和 proxy 延迟。 术语判断：工程深度高，因为它有 Python SDK、TS SDK、FastAPI proxy、MCP server、Rust core、Docker、tests、package extras、agent wrappers；成熟度给 3，是因为 `pyproject.toml` classifier 仍是 Beta，Windows wheels 未就绪，benchmark 多为项目自称，且 proxy/MCP/本地 store 的部署面较宽（来源：pyproject.toml classifiers；docs/content/docs/installation.mdx；docs/content/docs/proxy.mdx；tests/test_compress_api.py；tests/test_ccr.py；tests/test_cli/test_mcp.py）。

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/context-compression-layer]]、[[concepts/compress-cache-retrieve]]。另见 [[content/chopratejas-headroom]]、[[claims/chopratejas-headroom-main-claim]]。
