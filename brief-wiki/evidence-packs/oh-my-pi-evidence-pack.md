---
content: "oh-my-pi"
kind: "evidence-pack"
title: "oh-my-pi — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "oh-my-pi 是一个把 IDE 能力（LSP、调试器、浏览器、子代理）直接塞进终端的 AI 编码代理，通过哈希锚点编辑、流式规则注入、跨平台原生实现，让 LLM 编辑代码更准、更快、更安全。"
    internal_logic: "### agent loop\n\n代理循环基于工具调用范式：模型生成工具调用 → 代理执行工具并返回结果 → 模型继续推理。README 强调 `read`、`edit`、`bash` 等工具与模型 prompt 深度绑定，且通过 `hashedit` 格式大幅降低重试率。**流式规则注入**（Time-traveling stream rules）能在模型输出过程中用正则匹配触发规则注入并中断、重试，从而实现实时纠偏而不占用固定上下文。对于子代理，`task` 工具将任务分发到独立工作树，每个子代理拥有自己的工具表面，结果以 schema 验证的对象返回，避免了解析合并冲突。\n\n### tool interface\n\n所有工具统一在 `read`/`write`/`edit`/`bash` 等同一命名空间下，通过 `--tools` 标志可钉选激活集，未选中的工具仍可通过 `search_tool_bm25` 发现和动态拉回。关键创新：\n\n- **Hashline 编辑**：模型通过内容哈希锚定目标行，而不是重输整个代码块，避免了格式漂移和匹配失效。\n- **内部 scheme**：`pr://`、`issue://`、`agent://` 等 10 种协议直接嵌入 FS 工具，例如 `read pr://1428` 和 `read src/foo.ts` 返回相同形状的数据。\n- **ACP（Agent Communication Protocol）**：让代理能在 Zed 等编辑器中运行，通过编辑器的保存路径写入文件，直接操作编辑器缓冲区。\n\n### state/memory\n\n- **会话记忆**：`retain` 和 `recall` 工具形成事实记忆，代理在运行中写入关键信息，后续回合可回溯。会话结束会压缩成“心理模型”，下次启动第一回合自动加载。\n- **项目作用域**：记忆默认项目隔离，不同代码库之间不会混淆。\n- **上下文压缩**：rule 注入在 compaction 后仍然保留，保证长期纠正效果。\n\n### planner\n\nREADME 未显式定义规划器模块，但通过以下机制隐式实现：\n- **子代理分配**：`task` 工具按约束（如 IRC 通信）将工作拆分给多个子代理并行执行，最后汇总。\n- **代码审查**：`/review` 命令生成 P0-P3 优先级的审查意见，并由专门审查子代理并行扫描分支、提交或未提交更改。\n- **原子提交拆分**：`omp commit` 分析工作树并将无关变更分组为原子提交，依赖排序后写入。\n\n### sandbox\n\n代码执行沙箱由两个持久化内核提供：Python 和 Bun 工作器，它们可通过**回环桥接**（loopback bridge）反向调用代理的 `read`、`search`、`task` 等工具。这意味着代理可以一边运行 Python 数据分析，一边在 JavaScript 中绘图，全程不离开工具链。与其他仅提供一次性沙箱的方案不同，omp 的内核是常驻的。\n\n### safety\n\n- **编辑预览与确认**：`ast_edit` 产生提议卡片，代理调用 `resolve` 后由用户通过 TUI 的 **Accept** 卡片原子化写入磁盘。\n- **哈希锚定失效保护**：文件变动导致哈希锚失配时，编辑被拒绝，防止误改。\n- **流式规则**：可在模型即将生成危险代码时中断注入，从源头阻挡。\n- **权限控制**：毁灭性工具暂停并询问用户，支持“一次性允许”。\n- **隐身上网**：浏览器工具默认指纹模拟普通用户，防止被反爬，但也能驱动 Slack 等 Electron 应用，安全边界未细述。\n\n### 工程亮点\n\n- **~27k 行 Rust 核心**：ripgrep、glob、find 等搜索工具内联进程，避免 shell 调用和跨平台兼容问题。\n- **多格式配置继承**：可直接读取 Cursor MDC、Cline .clinerules、Codex AGENTS.md 等 8 种流行配置，无需迁移。\n- **Shell 补全动态生成**：从实时的 CLI 元数据生成，避免脱节。\n- **冲突解决**：合并冲突映射为 `conflict://N` 路径，代理可写入 `@ours`/`@theirs`/`@base` 一键解决。\n\n### 性能和兼容性\n\n- **40+ 模型提供商**：通过统一 API 表面支持，并针对每个模型调整编辑格式和 prompts，benchmark 中 Grok Code Fast 通过率从 6.7% 提升至 68.3%，MiniMax 提升 2.1 倍。\n- **跨平台**：macOS、Linux、Windows 原生二进制，不依赖 WSL。\n- **工具性能**：Read 返回摘要而非全文，Search 极速，LSP 提供 IDE 级语义信息。"
    failure_mode: "对 README 中宣称的性能提升（如 Grok Code Fast 通过率提升到 68.3%）无独立复现验证，可能依赖特定模型版本和 prompt 调整。"
    source_pointer: "https://github.com/can1357/oh-my-pi"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/MIT/v15.8.2"
experiments: []
claims:
  - "[[claims/oh-my-pi-main-claim]]"
artifacts:
  - "[[artifacts/oh-my-pi-repo]]"
metrics:
  - "stars=10196"
  - "forks=843"
  - "open_issues=252"
  - "latest_release=v15.8.2"
  - "pushed_at=2026-06-03T12:23:09Z"
baselines: []
failure_modes:
  - "对 README 中宣称的性能提升（如 Grok Code Fast 通过率提升到 68.3%）无独立复现验证，可能依赖特定模型版本和 prompt 调整。"
  - "代码库庞大且未提供完整测试套件，长期维护和稳定性存疑。"
  - "Windows 原生支持未详细说明兼容性边界，部分工具（如某些 LSP server）可能仍存在平台问题。"
  - "虽支持 40+ 提供商，但每个模型都需要单独调优编辑格式，增加维护负担。"
  - "浏览器隐身模式可能存在法律和政策风险，尤其在驱动 Slack 等应用时。"
  - "子代理的隔离工作树开销可能较大，大规模并行时可能遇到磁盘 I/O 或资源竞争。"
missing_details: []
source_pointers:
  - "https://github.com/can1357/oh-my-pi"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/oh-my-pi-main-claim]],官方 artifact 落库为 [[artifacts/oh-my-pi-repo]]。See [[content/oh-my-pi]]。
