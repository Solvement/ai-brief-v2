<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - colbymchenry/codegraph

## Core Pattern
MCP initialize 工具纪律: 把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。 Staleness banner: 索引延迟不可避免时，不阻塞查询，而是在响应顶部标出待同步文件，让 agent 只 Read 那些文件。 Agent target registry: 每个客户端一个 target 模块，统一实现 detect/install/uninstall/printConfig。 本地图 schema 加 FTS: 把代码对象拆成 nodes、edges、files、unresolved_refs，再用 FTS5 查 symbol/docstring/signature。 Affected tests CLI: 用依赖图从变更文件反查受影响测试，例如 `git diff --name-only | codegraph affected --stdin --quiet`。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, validation_harness, mcp-initialize, staleness-banner, agent-target-registry
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from colbymchenry/codegraph on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: MCP initialize 工具纪律: 把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。 Staleness banner: 索引延迟不可避免时，不阻塞查询，而是在响应顶部标出待同步文件，让 agent 只 Read 那些文件。 Agent target registry: 每个客户端一个 target 模块，统一实现 detect/install/uninstall/printConfig。 本地图 schema 加 FTS: 把代码对象拆成 nodes、edges、files、unresolved_refs，再用 FTS5 查 symbol/docstring/signature。 Affected tests CLI: 用依赖图从变更文件反查受影响测试，例如 `git diff --name-only | codegraph affected --stdin --quiet`。
- agent-infra-observable-flow: ```mermaid flowchart TD A[项目源码] --> B[扫描过滤] B --> C[TreeSitter解析] C --> D[未解析引用] D --> E[框架和导入解析] E --> F[SQLite图] F --> G[MCP工具] G --> H[Agent回答或编辑] A --> I[文件变更] I --> J[Watcher同步] J --> F J --> K[Stale提示] K --> H ``` 真实流：`__tests__/integration/full-pipeline.test.ts` 生成约 120 个 TS 模块，`indexAll()` 后搜索 `entry` 和 `fn50`，再用 `getCallers(fn0)`、`buildContext("entry function chain")` 验证图能被查询；随后 `sync()` 处理三类变更：新增 `src/consumer.ts`、修改 `src/mod0.ts` 加 `newHelper`、删除 `src/mod1.ts`。（来源：__tests__/integration/full-pipeline.test.ts） 最小使用路径是： ```bash codegraph init -i codegraph serve --mcp ``` 第一行建 `.codegraph/codegraph.db`，第二行把 MCP 工具暴露给 agent；installer 写入的实际命令也是 `codegraph` + `serve --mcp`。（来源：README CLI Reference；src/installer/targets/shared.ts）
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: Node bundled runtime / node:sqlite: Node 的 `node:sqlite` 仍会提示 experimental；Node 25 还被 CLI 硬拦，源码里需要 `CODEGRAPH_ALLOW_UNSAFE_NODE` 才能绕过。.

## Risks
- Node bundled runtime / node:sqlite: Node 的 `node:sqlite` 仍会提示 experimental；Node 25 还被 CLI 硬拦，源码里需要 `CODEGRAPH_ALLOW_UNSAFE_NODE` 才能绕过。
- 文件系统 watcher: fs.watch 在 WSL2 `/mnt`、Windows、Linux inotify、macOS FSEvents 行为不同，可能影响自动同步。
- Agent 客户端配置格式: Claude/Cursor/Codex/Gemini 等配置路径或字段变更，会让 installer 失效。
- GitHub Releases / npm 分发: release archive、optional package 或 GitHub API/redirect 失败会影响安装。
- npm dependencies: 依赖安全漏洞可能影响 CLI/MCP 运行面。
- Claude Opus benchmark 环境: 模型、prompt、agent 工具策略变化会改变 README 的成本/速度结论。
- over_transfer
