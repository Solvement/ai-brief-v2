<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - can1357/oh-my-pi

## Core Pattern
Hashline anchored edits: 把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。 Preview-first structural rewrite: `ast_edit` 固定先 dry-run，显示 per-file replacements，排队一个 `resolve` action；apply 时重新计算并比较 replacement totals/per-file counts，stale preview 报错。 Internal URL filesystem: 让 `read` 统一处理 `agent://`、`artifact://`、`issue://`、`pr://`、`rule://`、`skill://`、`memory://` 等资源；子代理 JSON 输出还能用 `agent://<id>/<path>` 抽字段。 TTSR stream interruption: 规则文件用 frontmatter 写 `condition`、`scope`、`interruptMode`，匹配 stream delta 后可 abort、注入 `<system-interrupt>`、继续生成；工具源非中断匹配则把 `<system-reminder>` prepend 到 tool result。 Subagent artifact protocol: 每个子代理必须通过隐藏 `yield` 工具结束，输出写 `<id>.md`，父代理用 `agent://<id>` 读取；缺失 yield 最多发 3 次 reminder。

## Mapping
- problem_class: domain-agent-workflow-with-validation-and-controls
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, hashline-anchored-edits, preview-first-structural-rewrite, internal-url-filesystem, ttsr-stream-interruption
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted finance_agent pattern from can1357/oh-my-pi on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- finance-agent-boundary-as-module: Hashline anchored edits: 把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。 Preview-first structural rewrite: `ast_edit` 固定先 dry-run，显示 per-file replacements，排队一个 `resolve` action；apply 时重新计算并比较 replacement totals/per-file counts，stale preview 报错。 Internal URL filesystem: 让 `read` 统一处理 `agent://`、`artifact://`、`issue://`、`pr://`、`rule://`、`skill://`、`memory://` 等资源；子代理 JSON 输出还能用 `agent://<id>/<path>` 抽字段。 TTSR stream interruption: 规则文件用 frontmatter 写 `condition`、`scope`、`interruptMode`，匹配 stream delta 后可 abort、注入 `<system-interrupt>`、继续生成；工具源非中断匹配则把 `<system-reminder>` prepend 到 tool result。 Subagent artifact protocol: 每个子代理必须通过隐藏 `yield` 工具结束，输出写 `<id>.md`，父代理用 `agent://<id>` 读取；缺失 yield 最多发 3 次 reminder。
- finance-agent-observable-flow: 人话：一个真实 flow 可以这样走：用户运行 `omp -p "List all .ts files in src/"`，`packages/coding-agent/src/cli.ts` 会把非子命令 argv 改写为 `launch`，`packages/coding-agent/src/commands/launch.ts` 定义 `-p/--print`、`--model`、`--tools`、`--no-lsp`、`--approval-mode` 等参数，然后 `runRootCommand` 创建 agent session。session 创建后，`createTools()` 默认注册 `read,bash,edit` 等工具；当模型需要看文件，`read` 对本地文本输出 `¶src/foo.ts#0A1B` 加 `41:def alpha():` 这种 hashline header/行号，并把读取内容写入 `session.fileReadCache`。模型编辑时调用 `edit`，输入像 `¶a.ts#0A3B replace 1..1: +const X = "b";`；`edit` 通过 snapshot tag 验证 live file 是否仍匹配，失败时走 snapshot recovery 或返回 mismatch。结构性替换则走 `ast_edit`：输入 `ops: [{ pat, out }], paths: [...]`，先 dry-run 预览，真正落盘必须后续 `resolve(action:"apply")`。如果任务很大，`task` 会按 `task.maxConcurrency` 分派子代理，子代理输出 `<id>.md`，父代理再读 `agent://<id>` 汇总。术语：这条链路包含 CLI routing、session discovery、tool registry、read snapshot store、hashline patcher、resolve preview queue、subagent artifact protocol；对应源码/文档锚点是 `packages/coding-agent/src/cli.ts runCli`、`packages/coding-agent/src/commands/launch.ts flags/examples`、`docs/tools/read.md Flow`、`docs/tools/edit.md Worked examples`、`docs/tools/ast-edit.md Flow`、`docs/tools/task.md Flow`。
- finance-agent-risk-first-transfer: Transfer the architecture together with its main failure boundary: Bun >= 1.3.14: Bun 版本不足会直接在 `src/cli.ts` 报错退出；install 脚本也检查 `MIN_BUN_VERSION=1.3.14`。.

## Risks
- Bun >= 1.3.14: Bun 版本不足会直接在 `src/cli.ts` 报错退出；install 脚本也检查 `MIN_BUN_VERSION=1.3.14`。
- Rust N-API native addon: grep、shell、AST、highlight、PTY、image、token counting 等路径依赖 `@oh-my-pi/pi-natives` 和 `pi_natives` 二进制；平台构建/加载失败会影响热路径工具。
- 外部 LLM providers 和 OAuth/API key: 模型不可用、key 过期、quota/429 会影响主代理；registry 会做 auth lookup、fallback、runtime discovery，但最终仍依赖供应商。
- Web search providers: `web_search` auto 链要有至少一个已配置 provider；否则返回 `Error: No web search provider configured.`。
- MCP server configs: 粘贴远程 MCP 忘写 `type: http` 会被当成 stdio 并报缺 `command`；server name 还要匹配 `^[a-zA-Z0-9_.-]{1,100}$`。
- 本地 language servers / debuggers: LSP/DAP 能力依赖用户安装 `rust-analyzer`、`typescript-language-server`、`pyright` 等二进制；缺失时对应操作不可用或冷启动失败。
- over_transfer
