<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - can1357/oh-my-pi

## Core Pattern
Hashline 内容锚编辑: 让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。 统一 path 读取协议: 把文件、URL、SQLite、归档、内部 artifact 都压到 `read({path})`，再用 selector 做分页和范围读取。 隐藏工具加 BM25 发现: 默认只暴露 essential 工具；其它工具隐藏但可检索，需要时由 `search_tool_bm25` 激活。 子代理 artifact 协议: 每个子任务输出 `<id>.md` 或 JSON artifact，父代理用 `agent://<id>` 读取，而不是解析长段聊天文本。 扩展事件拦截: 扩展用 `tool_call` 和 `tool_result` 事件包住所有工具；可注册工具、命令、快捷键和 renderer。

## Mapping
- problem_class: domain-agent-workflow-with-validation-and-controls
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, hashline, path, bm25, artifact
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted finance_agent pattern from can1357/oh-my-pi on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- finance-agent-boundary-as-module: Hashline 内容锚编辑: 让读取工具返回短 hash tag，写入工具必须带 tag；编辑语言只表达“替换哪几行/插入哪里”，不复制旧内容。 统一 path 读取协议: 把文件、URL、SQLite、归档、内部 artifact 都压到 `read({path})`，再用 selector 做分页和范围读取。 隐藏工具加 BM25 发现: 默认只暴露 essential 工具；其它工具隐藏但可检索，需要时由 `search_tool_bm25` 激活。 子代理 artifact 协议: 每个子任务输出 `<id>.md` 或 JSON artifact，父代理用 `agent://<id>` 读取，而不是解析长段聊天文本。 扩展事件拦截: 扩展用 `tool_call` 和 `tool_result` 事件包住所有工具；可注册工具、命令、快捷键和 renderer。
- finance-agent-observable-flow: 核心流不是“模型直接乱写文件”，而是模型在一个工具注册表里选工具，工具再进入各自运行时。 ```mermaid flowchart TD A[用户任务] --> B[omp CLI] B --> C[会话运行时] C --> D[模型路由] C --> E[工具注册表] E --> F[read 统一读取] F --> G[哈希锚快照] G --> H[edit 写入] H --> I[LSP 诊断] E --> J[task 子代理] J --> K[隔离工作区] E --> L[MCP 和扩展] E --> M[eval 和 bash] ``` 一个真实编辑例子：`read` 在 hashline 模式会给可变文件加类似 `¶a.ts#0A3B` 的头，`edit` 再消费这个头和行号。（来源：docs/tools/read.md Local text files；docs/tools/edit.md Worked examples） ```text ¶a.ts#0A3B replace 1..1: ``` 这两行的意思是：只替换 `a.ts` 当前快照的第 1 行；如果文件内容已经漂移，`packages/hashline` 会按 snapshot 校验并拒绝或恢复。（来源：packages/hashline/README.md Format；docs/tools/edit.md Limits & Caps） 更完整的 agent loop：CLI 入口 `src/cli.ts` 把非子命令默认路由到 `launch`；`main.ts` 初始化 settings、model registry、session；`createTools` 从 `BUILTIN_TOOLS` 和 MCP/custom/extension 工具生成可调用工具；工具执行结果回到会话，再由模型决定下一步。（来源：packages/coding-agent/DEVELOPMENT.md Boot Sequence；packages/coding-agent/src/tools/index.ts createTools）
- finance-agent-risk-first-transfer: Transfer the architecture together with its main failure boundary: Bun >= 1.3.14: Bun 版本不足时 `src/cli.ts` 会直接报错退出；worker/native 加载也依赖 Bun 行为。.

## Risks
- Bun >= 1.3.14: Bun 版本不足时 `src/cli.ts` 会直接报错退出；worker/native 加载也依赖 Bun 行为。
- Rust N-API native crates: 平台二进制或 N-API 加载失败会影响 grep、shell、AST、PTY、image、token 等热路径。
- 模型 provider 与 models.yml: provider API、OAuth、订阅计划或 gateway 字段变化会导致模型不可用或路由失败。
- MCP server: 第三方 MCP server 连接慢、工具变更、OAuth 失效或行为不可信，会影响 agent 工具调用。
- LSP/DAP 外部二进制: 语言服务器或调试适配器不在 PATH/项目 bin，`lsp`/`debug` 就只能部分工作。
- 默认审批模式: 文档写 `yolo` 是默认，read/write/exec 都自动批准；模型可执行 bash、browser、子代理等高影响工具。
- over_transfer
