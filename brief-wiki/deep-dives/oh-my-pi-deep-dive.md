---
content: "oh-my-pi"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "oh-my-pi — 深度拆解"
reasoning_trace:
  paper_type_decision: "根据 README 中明确的代理工作流、工具定义、LSP/DAP 集成、子代理、记忆等要素判定为 agent_framework 类型。"
  central_contribution: "将专用 IDE 功能和终端代理相结合，通过工程优化（hashline、流式规则、内联工具、多模型适配）大幅降低 LLM 编码代理的编辑失败率和 token 消耗。"
  inspected:
    - "README 全文"
    - "artifact audit (topics, top_level_dirs, package files, has_* flags)"
    - "candidate triage 评分和原因"
  top_claims:
    - "有 40+ 模型提供商和 32 内置工具"
    - "hashline 编辑使 Grok 4 Fast 输出 token 减少 61%"
    - "LSP 和 DAP 深度集成支持语义级重命名和实时调试"
    - "子代理可并行执行并返回类型化结果"
    - "流式规则可在模型输出过程中动态阻断并注入纠正"
  evidence_needed:
    - "需要独立的 benchmark 复现数据来验证通过率提升和 token 缩减"
    - "需要查阅源代码确认 LSP/DAP 集成的深度和稳定性"
    - "需要测试多平台（尤其是 Windows）的兼容性"
    - "需要评估子代理并行时的资源开销和隔离安全性"
  main_threats:
    - "声称的性能指标可能只适用于特定场景，缺乏公开的可重复验证。"
    - "庞大的单体仓库缺乏测试，引入任何改动都可能产生回归。"
    - "高度针对模型优化 prompt 可能随着模型升级而失效，维护成本高。"
  transfer_decision: "采用其 hashline 编辑格式、流式规则注入模式、内部 scheme 抽象思路，但放弃其 Rust 核心替换需求，改用更轻量的 TypeScript/Go 实现，并建立独立测试集。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "声称的性能提升缺乏公开独立验证，且庞大代码库无测试，长期维护风险高。"
next_actions:
  - "clone-and-run"
  - "write-deepdive"
  - "extract-pattern(流式规则注入)"
  - "extract-pattern(hashline 编辑)"
  - "extract-pattern(内部 scheme 抽象)"
claim_ledger:
  - claim: "hashline 编辑使 Grok 4 Fast 输出 token 减少 61%"
    plain_english: "通过让模型只写内容哈希而不是完整代码行，节省发送给 API 的输出 token 量。"
    source: "README 中 '# Every tool, benchmaxxed.' 下的表格和 'Hashline: edit by content hash' 章节"
    evidence_strength: "medium"
    supports: "表格列出 Grok 4 Fast: −61% tokens，用户报告一致。"
    does_not_support: "未提供对比基准细节（如原始输出 token 量、文件大小），也未说明其他模型上的效果。"
    threat: "可能只对特定长度的文件或编码风格有效，对其他模型可能不适用。"
  - claim: "支持 40+ 模型提供商和 32 个内置工具"
    plain_english: "项目声称可以接入超过 40 种不同的大语言模型服务，并自带 32 种编辑、搜索、运行等工具。"
    source: "README 顶部摘要'40+ providers · 32 built-in tools'"
    evidence_strength: "high"
    supports: "README 明确数字，且 topics 包含 multi-provider、anthropic、openai 等。"
    does_not_support: "未在 README 中列出所有提供商和工具清单，但可以通过 tags 和文档推断。"
    threat: "部分提供商可能通过社区贡献或非官方适配实现，稳定性不一。"
  - claim: "通过 LSP 实现准确的重命名，自动更新所有引用"
    plain_english: "重命名一个符号时，代理通过语言服务器协议发现并修改所有关联的文件，就像 IDE 一样。"
    source: "README 中 'LSP wired into every write' 章节+截图"
    evidence_strength: "medium"
    supports: "截图展示了查找引用和重命名操作的完成结果。"
    does_not_support: "未说明支持哪些 LSP 服务器以及覆盖的语言范围，也没提复杂场景（如跨项目引用）的处理。"
    threat: "依赖于用户机器上安装的 LSP 服务器，缺少时功能降级或失败。"
  - claim: "子代理通过 task 工具并行执行，返回 schema 验证的对象"
    plain_english: "代理可以把一个大任务拆成几个小任务分给并行子代理，每个子代理在自己的环境里工作，最终返回结构化的结果，而不是一大段文字。"
    source: "README 中 'First-class subagents' 章节+截图"
    evidence_strength: "medium"
    supports: "截图显示了两个子代理的状态卡和最终 Findings 汇总。"
    does_not_support: "未说明 schema 定义语言、验证方式以及子代理间通信协议（除了 IRC 示例）。"
    threat: "子代理隔离工作树涉及磁盘复制，可能在大规模 monorepo 下性能严重下降。"
artifact_audit:
  official_repo: "https://github.com/can1357/oh-my-pi"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**oh-my-pi 是一个把 IDE 能力（LSP、调试器、浏览器、子代理）直接塞进终端的 AI 编码代理，通过哈希锚点编辑、流式规则注入、跨平台原生实现，让 LLM 编辑代码更准、更快、更安全。**

> 一句话:不是又一个 AI 终端编码助手，而是把 IDE 引擎搬到命令行，用工程化手段把模型编辑失败率打到地板。

## 为什么火

- 用 content-hash 编辑技术绕过传统 diff 格式的 token 浪费和匹配失败，Grok 4 Fast 输出 token 减少 61%
- 将 LSP 和 DAP 直接集成到代理环中，重命名操作自动更新所有引用，调试器支持 C/Go/Python 原生断点检查
- 子代理体系支持隔离工作树和类型化结果返回，解决了多代理并行时的合并冲突和结果解析问题
- 支持 40+ 模型提供商，通过针对每个模型调优的 prompt 和编辑格式，让弱模型也达到可用的编辑准确率
- 终端原生实现（Rust 核心）避免 fork-exec 开销，在 Windows 上也能直接运行，不依赖 WSL

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README 完整，包含安装、特性、工具列表、子代理、benchmark 等 |
| src | not_found | 顶上结构无 src 目录，但 packages/、crates/ 存在 |
| tests | not_found | README 未提及测试套件，artifact audit 标记 has_tests 为 false |
| license | available | LICENSE 文件确认为 MIT |
| docs | available | 存在 docs/ 目录，README 有详细功能介绍 |
| examples/demo | available | README 中包含多个 gif/webp 演示和视频 capture 链接 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### agent loop

代理循环基于工具调用范式：模型生成工具调用 → 代理执行工具并返回结果 → 模型继续推理。README 强调 `read`、`edit`、`bash` 等工具与模型 prompt 深度绑定，且通过 `hashedit` 格式大幅降低重试率。**流式规则注入**（Time-traveling stream rules）能在模型输出过程中用正则匹配触发规则注入并中断、重试，从而实现实时纠偏而不占用固定上下文。对于子代理，`task` 工具将任务分发到独立工作树，每个子代理拥有自己的工具表面，结果以 schema 验证的对象返回，避免了解析合并冲突。

### tool interface

所有工具统一在 `read`/`write`/`edit`/`bash` 等同一命名空间下，通过 `--tools` 标志可钉选激活集，未选中的工具仍可通过 `search_tool_bm25` 发现和动态拉回。关键创新：

- **Hashline 编辑**：模型通过内容哈希锚定目标行，而不是重输整个代码块，避免了格式漂移和匹配失效。
- **内部 scheme**：`pr://`、`issue://`、`agent://` 等 10 种协议直接嵌入 FS 工具，例如 `read pr://1428` 和 `read src/foo.ts` 返回相同形状的数据。
- **ACP（Agent Communication Protocol）**：让代理能在 Zed 等编辑器中运行，通过编辑器的保存路径写入文件，直接操作编辑器缓冲区。

### state/memory

- **会话记忆**：`retain` 和 `recall` 工具形成事实记忆，代理在运行中写入关键信息，后续回合可回溯。会话结束会压缩成“心理模型”，下次启动第一回合自动加载。
- **项目作用域**：记忆默认项目隔离，不同代码库之间不会混淆。
- **上下文压缩**：rule 注入在 compaction 后仍然保留，保证长期纠正效果。

### planner

README 未显式定义规划器模块，但通过以下机制隐式实现：
- **子代理分配**：`task` 工具按约束（如 IRC 通信）将工作拆分给多个子代理并行执行，最后汇总。
- **代码审查**：`/review` 命令生成 P0-P3 优先级的审查意见，并由专门审查子代理并行扫描分支、提交或未提交更改。
- **原子提交拆分**：`omp commit` 分析工作树并将无关变更分组为原子提交，依赖排序后写入。

### sandbox

代码执行沙箱由两个持久化内核提供：Python 和 Bun 工作器，它们可通过**回环桥接**（loopback bridge）反向调用代理的 `read`、`search`、`task` 等工具。这意味着代理可以一边运行 Python 数据分析，一边在 JavaScript 中绘图，全程不离开工具链。与其他仅提供一次性沙箱的方案不同，omp 的内核是常驻的。

### safety

- **编辑预览与确认**：`ast_edit` 产生提议卡片，代理调用 `resolve` 后由用户通过 TUI 的 **Accept** 卡片原子化写入磁盘。
- **哈希锚定失效保护**：文件变动导致哈希锚失配时，编辑被拒绝，防止误改。
- **流式规则**：可在模型即将生成危险代码时中断注入，从源头阻挡。
- **权限控制**：毁灭性工具暂停并询问用户，支持“一次性允许”。
- **隐身上网**：浏览器工具默认指纹模拟普通用户，防止被反爬，但也能驱动 Slack 等 Electron 应用，安全边界未细述。

### 工程亮点

- **~27k 行 Rust 核心**：ripgrep、glob、find 等搜索工具内联进程，避免 shell 调用和跨平台兼容问题。
- **多格式配置继承**：可直接读取 Cursor MDC、Cline .clinerules、Codex AGENTS.md 等 8 种流行配置，无需迁移。
- **Shell 补全动态生成**：从实时的 CLI 元数据生成，避免脱节。
- **冲突解决**：合并冲突映射为 `conflict://N` 路径，代理可写入 `@ours`/`@theirs`/`@base` 一键解决。

### 性能和兼容性

- **40+ 模型提供商**：通过统一 API 表面支持，并针对每个模型调整编辑格式和 prompts，benchmark 中 Grok Code Fast 通过率从 6.7% 提升至 68.3%，MiniMax 提升 2.1 倍。
- **跨平台**：macOS、Linux、Windows 原生二进制，不依赖 WSL。
- **工具性能**：Read 返回摘要而非全文，Search 极速，LSP 提供 IDE 级语义信息。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 可以学习如何将 IDE 语义能力集成到 AI 代理中，以及在终端里实现高效编辑反馈环（hashline、流式规则）的设计范式。其 Rust 核心的工具内联和跨平台策略也值得参考。 |
| 迁移到 AI-Brief | 可以直接迁移工具接口的抽象模式（内部 scheme、hashline）、流式规则注入机制、子代理类型化通信，以及针对多模型 prompt 微调的方法论。 |
| 迁移到 BriefMem | 记忆模块的项目作用域设计和上下文压缩保留规则机制，可用于构建长会话记忆方案。 |
| 简历故事 | 深入理解 oh-my-pi 的架构，能在简历中展示对 AI 编码代理工具链的工程化理解，包括如何通过技术手段大幅降低 LLM 编辑失败率和 token 消耗。 |

## 风险

- 对 README 中宣称的性能提升（如 Grok Code Fast 通过率提升到 68.3%）无独立复现验证，可能依赖特定模型版本和 prompt 调整。
- 代码库庞大且未提供完整测试套件，长期维护和稳定性存疑。
- Windows 原生支持未详细说明兼容性边界，部分工具（如某些 LSP server）可能仍存在平台问题。
- 虽支持 40+ 提供商，但每个模型都需要单独调优编辑格式，增加维护负担。
- 浏览器隐身模式可能存在法律和政策风险，尤其在驱动 Slack 等应用时。
- 子代理的隔离工作树开销可能较大，大规模并行时可能遇到磁盘 I/O 或资源竞争。

## Memory card

```text
problem_pattern:        LLM 编码代理在编辑大文件时因 diff 格式匹配失败、token 浪费和上下文污染导致编辑准确率低；现有代理工具与 IDE 能力脱节，缺乏语义级重构和调试支持。
architecture_pattern:   终端代理+IDE 语义引擎融合：内联 ripgrep、glob、find 等工具以减少跨平台问题；通过 LSP/DAP 获取语义信息和调试能力；使用会话持久化内核和回环桥接实现跨语言执行；流式规则在生成过程中动态干预。
reusable_pattern:       基于内容哈希的编辑定位（hashline）、流式 mid-token 规则注入、利用 `://` 协议统一文件系统和外部资源访问、子代理类型化结果返回和隔离工作树。
risk_pattern:           多模型 prompt 与格式的手工调优不可扩展；缺乏全面测试导致回归风险高；浏览器和 Electron 控制可能被滥用。
similar_projects:       未在 README/artifact 说明
```

可复用范式落库:[[concepts/hashline-editing]]、[[concepts/time-traveling-stream-rules]]。另见 [[content/oh-my-pi]]、[[claims/oh-my-pi-main-claim]]。
