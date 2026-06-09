<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - chopratejas/headroom

## Core Pattern
ContentRouter 内容路由: 把 tool output 当作异构内容流，先检测 JSON/log/search/code/html/text，再分派到不同 compressor；保留 passthrough 和保护分支。 CCR 可逆压缩: 压缩结果里带 hash 或 marker，把原文放本地 store，让模型需要时通过 retrieval tool 查回。 代理优先接入: 提供 `headroom proxy --port 8787`，用 `OPENAI_BASE_URL` 或 `ANTHROPIC_BASE_URL` 改流量，不强迫每个应用改 SDK 调用。 MCP retrieval 工具: 把压缩、取回、统计暴露成 MCP stdio 工具，让 Claude Code/Cursor/Codex 类 host 自己调用。 CacheAligner 前缀稳定: 把动态内容后移，尽量让 provider prompt prefix cache 命中；与 token 压缩是两条收益线。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, validation_harness, contentrouter, ccr, project
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from chopratejas/headroom on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: ContentRouter 内容路由: 把 tool output 当作异构内容流，先检测 JSON/log/search/code/html/text，再分派到不同 compressor；保留 passthrough 和保护分支。 CCR 可逆压缩: 压缩结果里带 hash 或 marker，把原文放本地 store，让模型需要时通过 retrieval tool 查回。 代理优先接入: 提供 `headroom proxy --port 8787`，用 `OPENAI_BASE_URL` 或 `ANTHROPIC_BASE_URL` 改流量，不强迫每个应用改 SDK 调用。 MCP retrieval 工具: 把压缩、取回、统计暴露成 MCP stdio 工具，让 Claude Code/Cursor/Codex 类 host 自己调用。 CacheAligner 前缀稳定: 把动态内容后移，尽量让 provider prompt prefix cache 命中；与 token 压缩是两条收益线。
- agent-infra-observable-flow: 真实流：示例 `examples/context_compression_demo.py` 构造 OpenAI 格式 messages，第三条是 `role: tool` 的检索输出，然后调用 `compress(messages, model="claude-sonnet-4-5-20250929")`，最后断言 tokens_saved > 0、message count 不变、tool message 仍存在。（来源：examples/context_compression_demo.py） ```mermaid flowchart TD A[Agent 或 App messages] --> B[compress 或 proxy] B --> C[Pipeline] C --> D[CacheAligner] D --> E[ContentRouter] E --> F{内容类型} F --> G[JSON SmartCrusher] F --> H[日志 搜索 代码 文本] G --> I[CCR 本地存原文] H --> I I --> J[压缩 messages] J --> K[LLM] K --> L[需要原文] L --> M[headroom_retrieve] M --> I ``` 关键节点：`compress()` 默认 `model="claude-sonnet-4-5-20250929"`、`model_limit=200000`，会把用户 query 提取成 context 后交给 pipeline。（来源：headroom/compress.py compress）ContentRouter 对用户消息、系统/开发者消息、小内容有保护逻辑；不是所有内容都会被压缩。（来源：headroom/transforms/content_router.py apply）MCP 的 `headroom_compress` 会把内容包成 `role: tool` 再走同一个 `compress()`，并把原文存入本地 store。（来源：headroom/ccr/mcp_server.py _compress_content）
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: 本地 Python proxy / FastAPI / uvicorn: proxy 没启动或端口不可用时，TypeScript SDK 压缩不可用；agent wrapper 也会受影响。.

## Risks
- 本地 Python proxy / FastAPI / uvicorn: proxy 没启动或端口不可用时，TypeScript SDK 压缩不可用；agent wrapper 也会受影响。
- Rust/PyO3/maturin 编译产物 `headroom._core`: 没有可用 wheel 或本地 Rust 构建失败时，SmartCrusher、diff/log/search 等 Rust bridge 路径会受影响。
- MCP host 与 agent CLI 配置格式: Claude Code/Cursor/Codex/Copilot 的 MCP 或 config 格式变化会让 `headroom mcp install`、`headroom wrap ...` 失效。
- 本地 CompressionStore TTL: CCR hash 过期后无法取回原文，模型看到 marker 但 retrieve 失败。
- 外部 provider API 与缓存策略: Anthropic/OpenAI/Google 的缓存、消息格式、Responses/WebSocket 变更会影响 proxy forwarding、CacheAligner、token accounting。
- 匿名 telemetry: 企业环境可能不允许默认 telemetry。
- over_transfer
