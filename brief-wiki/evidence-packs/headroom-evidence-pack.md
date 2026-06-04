---
content: "headroom"
kind: "evidence-pack"
title: "headroom — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个本地运行的上下文压缩中间件，在 AI 代理的提示、工具输出、日志、RAG 结果等进入 LLM 前将其压缩，减少 60‑95% 的 token 消耗，同时保持回答质量。"
    internal_logic: "### 嵌入开发流的位置\nHeadroom 作为 AI 代理与 LLM 之间的**透明压缩层**，不对现有代码做侵入性修改。它提供四种嵌入点：\n- **库模式**：在 Python/TypeScript 代码中直接调用 `compress(messages)`，嵌入在应用内部。\n- **代理包装模式**：通过 `headroom wrap <agent>` 命令直接拦截流行编码代理（Claude Code、Cursor、Aider 等）的请求。\n- **HTTP 代理模式**：启动 `headroom proxy --port 8787`，所有兼容 OpenAI 的客户端只需将 base URL 指向该代理即可获得压缩能力。\n- **MCP 服务器模式**：安装 MCP 工具后，任何 MCP 客户端可调用 `headroom_compress`、`headroom_retrieve` 等工具，将压缩能力嵌入到工具调用链中。\n\n### 命令入口\n所有功能通过统一的 CLI `headroom` 暴露：\n- **`headroom wrap`** — 包装一个代理（如 `claude`、`codex`、`cursor`），启动内部代理或管理配置。\n- **`headroom proxy`** — 启动 HTTP 压缩代理服务。\n- **`headroom mcp install`** — 注册 MCP 工具到客户端。\n- **`headroom stats`** — 查看已压缩的 token 数量及节省统计。\n- **`headroom learn`** — 分析失败会话，生成修复建议并写入项目的 `CLAUDE.md` / `AGENTS.md` 等文件。\n\n### 配置\n- 大部分行为通过**文档中的配置文件或环境变量**控制，但 README 未给出具体键值，仅提供指向完整文档的链接。\n- 安装时支持可选依赖分组：`[proxy]`、`[mcp]`、`[ml]`、`[agno]`、`[langchain]`、`[evals]`，可按需安装。\n- `headroom wrap` 支持传递 `--memory`、`--code-graph` 等选项，针对特定代理定制行为。\n\n### 插件 / 扩展\nHeadroom 内部采用**管道式可扩展架构**，提供多个扩展点：\n- **Pipeline Extensions**：通过 `on_pipeline_event(...)` 观察或自定义完整的请求生命周期。生命周期包含 Setup → Pre‑Start → Post‑Start → Input Received → Input Cached → Input Routed → Input Compressed → Input Remembered → Pre‑Send → Post‑Send → Response Received 十一个阶段。\n- **Compression Hooks**：在核心压缩环节之外设置的钩子，允许插入自定义逻辑。\n- **Proxy Extensions**：面向服务器/应用的集成接缝，可注册 ASGI 中间件、自定义路由和启动策略。\n- **Provider Slices**：`headroom/providers/` 目录下为不同代理（如 claude、copilot、codex）提供针对性的环境修正、API 目标规范化及后端选择，核心编排代码保持通用。\n\n### 错误处理\n**未在 README / artifact 中详细说明**。从架构推断：\n- 管道各阶段可抛出异常，可能通过 Pipeline Extensions 或生命周期钩子截获并处理。\n- 代理模式下的失败会被 `headroom learn` 捕获并分析，转化为纠正建议。\n- 但关于压缩失败降级、代理不可用重试、MCP 工具调用异常反馈等具体策略，README 未提供信息。"
    failure_mode: "压缩可能引入额外延迟，尤其在使用 Kompress‑base 等 ML 模型时，对实时性要求高的代理可能不适用。"
    source_pointer: "https://github.com/chopratejas/headroom"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/Apache-2.0/v0.22.4"
experiments: []
claims:
  - "[[claims/headroom-main-claim]]"
artifacts:
  - "[[artifacts/headroom-repo]]"
metrics:
  - "stars=5056"
  - "forks=387"
  - "open_issues=120"
  - "latest_release=v0.22.4"
  - "pushed_at=2026-06-02T00:08:41Z"
baselines: []
failure_modes:
  - "压缩可能引入额外延迟，尤其在使用 Kompress‑base 等 ML 模型时，对实时性要求高的代理可能不适用。"
  - "某些敏感上下文被压缩后可能改变语义，虽然 CCR 可逆，但 LLM 可能不再主动检索原始细节，导致回答质量下降。"
  - "本地运行需要占用一定内存和 CPU，资源受限环境（如 CI 容器）可能无法使用。"
  - "跨代理内存的自动去重和共享逻辑若设计不当，可能造成隐私泄露或上下文混淆。"
  - "尚未在 README 中看到明确的错误降级策略和稳定性保证，生产使用前需要充分测试。"
missing_details: []
source_pointers:
  - "https://github.com/chopratejas/headroom"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/headroom-main-claim]],官方 artifact 落库为 [[artifacts/headroom-repo]]。See [[content/headroom]]。
