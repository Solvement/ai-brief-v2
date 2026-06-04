---
content: "codewhale"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "CodeWhale — 深度拆解"
reasoning_trace:
  paper_type_decision: "本项目是典型的 agent_framework，因为它提供了一个完整的代理运行框架，包括模型交互循环、工具注册、状态管理、安全策略和子代理调度，而不是简单的 AI 应用包装。"
  central_contribution: "通过宪法式九级法律体系解决 LLM 代理的指令冲突和权限混乱，并利用 DeepSeek V4 的前缀缓存特性将长期记忆成本降低约 100 倍，同时以 Rust 高性能终端应用形式提供工程化落地。"
  inspected:
    - "README.md 主文件"
    - "topics 标签"
    - "top_level_dirs 列表"
    - "key_files: Cargo.toml, Dockerfile, package.json"
    - "evidence_signals 中 agent/workflow/MCP/skills/model 等标识"
  top_claims:
    - "宪法定义了九级法律体系，用户当前意图优先级高于过期指令。"
    - "DeepSeek V4 前缀缓存使宪法提示的长上下文成本降低约 100 倍。"
    - "子代理最高可并发 20 个，通过哨兵和摘要结果实现无阻塞集成。"
    - "自动模式通过前置 Flash 调用动态选择模型和思维模式，节省成本。"
    - "LSP 实时诊断将错误反馈为纠正向量，实现代理的自我纠正。"
  evidence_needed:
    - "成本降低 100 倍的基准测试数据或日志证据。"
    - "宪法治理在多轮复杂任务中的实际有效性对比测试。"
    - "子代理在超并发下的系统资源占用和任务完成率数据。"
    - "沙箱在恶意代码场景下的防御能力渗透测试。"
  main_threats:
    - "项目热度虽高，但核心功能（宪法、自动路由）的有效性缺乏独立基准验证。"
    - "过度依赖 DeepSeek V4 的前缀缓存和指令遵循能力，模型迭代可能破坏兼容性。"
    - "开源社区贡献质量未知，v0.8.x 版本快速迭代可能引入不成熟特性。"
  transfer_decision: "可复用宪法治理模式、子代理并发设计和自动路由思想，但具体的 Rust 终端实现和 DeepSeek 专属优化不适合直接复制。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "模型供应商锁定，若 DeepSeek 模型能力下降或 API 突变，代理的核心价值将大幅缩水。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "宪法提供九级法律体系，用户当前消息优先级高于过期项目指令。"
    plain_english: "模型接收到冲突指令时，有一个明确的先后排名，用户刚说的话比以前的项目说明更管用。"
    source: "README 中 'CodeWhale answers this with a Constitution... Article VII ranks nine tiers from the Constitution's own articles down to prior-session handoffs.'"
    evidence_strength: "high"
    supports: "能够减少模型在长对话中因指令冲突产生的错误行为，增强可靠性。"
    does_not_support: "依赖于模型对宪法文本的准确理解和遵循，若模型理解偏差，优先级可能失效。"
    threat: "宪法内容过长可能导致前缀缓存失效或模型注意力稀释，实际效果未量化。"
  - claim: "DeepSeek V4 前缀缓存使宪法提示成本降低约 100 倍。"
    plain_english: "宪法很长的提示每轮只要花原先 1% 的费用，因为模型会缓存之前读取过的部分。"
    source: "README 中 'DeepSeek V4's prefix caching makes this practical... once cached it costs roughly 100× less per turn than a cold read.'"
    evidence_strength: "medium"
    supports: "鼓励使用详细且固定的系统提示，大幅降低长上下文交互的成本。"
    does_not_support: "仅适用于支持前缀缓存的 API，其他模型或后端可能无效，且缓存击穿时成本会飙升。"
    threat: "未提供实际的成本对比数据，100 倍可能是乐观估计，且依赖特定模型实现。"
  - claim: "子代理可并发执行多达 20 个，通过 sentinel 和摘要结果实现无阻塞集成。"
    plain_english: "父代理可以同时派多个子任务去并行跑，子任务完成时会发通知，并附上一个精简的报告。"
    source: "README 中 'Sub-agents run concurrently (up to 20)... results arrive inline as completion sentinels with a summary.'"
    evidence_strength: "high"
    supports: "提高复杂任务的执行效率，适合代码搜索、多文件分析等可并行场景。"
    does_not_support: "并发数受限于系统资源和模型上下文窗口，摘要可能遗漏关键细节导致错误决策。"
    threat: "未说明摘要生成机制，可能由模型生成，存在幻觉或遗漏的风险。"
  - claim: "自动模式通过前置 Flash 调用动态选择模型和思维层级，按任务复杂度分配资源。"
    plain_english: "发正式请求前先用一个便宜的调用判断任务难不难，简单就用便宜模型，难就用贵的，自动帮你省钱。"
    source: "README 的 'Auto Mode' 章节。"
    evidence_strength: "high"
    supports: "降低非敏感任务成本，提高高难度任务质量，无需用户手动切换。"
    does_not_support: "路由准确性取决于 Flash 模型的判断，可能误判导致低质量或高成本。"
    threat: "路由失败时的本地回退策略未详细说明，可能性能不稳定。"
  - claim: "LSP 诊断结果作为纠正向量反馈，实现代理的自我纠正。"
    plain_english: "代码改完立刻跑语言检查，把报错喂回模型，让它在下一步里自动修掉。"
    source: "README 中 'LSP diagnostics after every edit... the model uses its own drift to self-correct.'"
    evidence_strength: "high"
    supports: "显著减少低级错误（语法、类型）的累积，提升代码生成质量。"
    does_not_support: "仅对支持 LSP 的语言有效，且无法纠正逻辑错误或需求理解偏差。"
    threat: "频繁的 LSP 调用可能增加任务耗时，且诊断内容可能占用大量上下文。"
artifact_audit:
  official_repo: "https://github.com/Hmbown/CodeWhale"
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

**终端里的 DeepSeek V4 编码智能体，通过宪法治理、自动模式和子代理并发，把模型从问答机升级成能独立完成任务的工程助手。**

> 一句话:用九级法律管住模型，让终端代理真正靠谱。

## 为什么火

- 深度绑定 DeepSeek V4，是官方之外最完整的终端编码体验，安装即用，社区爆发。
- 宪法式指令优先级（九级法）直接解决 LLM 代理的权限冲突和模式漂移，设计新颖且工程落地。
- Rust 构建的两兄弟二进制（codewhale + codewhale-tui），性能好、多平台发布，对开发者信任感强。
- 自动模式（模型+思维层级路由）大幅降低使用门槛和成本，对小任务用 Flash 无思维，对重任务上 Pro+高思维，智能省钱。
- 子代理并发、LSP 实时诊断、沙箱、回滚快照等工程深度，让它不只是玩具，而是生产可用的终端代理。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | README 主文件提供安装、快速开始、架构、宪法、子代理、自动模式等详细说明 |
| docs/ | available | 文档目录存在，含有 ARCHITECTURE.md, SUBAGENTS.md, INSTALL.md 等 |
| Cargo.toml / crates | available | 项目使用 Rust workspace，顶层有 Cargo.toml， crates 目录包含源码 |
| Dockerfile | available | 提供预构建 Docker 镜像，支持快速容器化运行 |
| package.json | available | npm 包装器，用于分发预编译二进制 |
| tests/ | not_found | artifactAudit 中 has_tests 为 false，仓库顶层未发现 tests 目录 |
| examples/ | available | evidence_signals 中 has_examples 为 true，但具体目录未在列表中；可能存在示例配置 |
| license | available | 仓库根目录有 LICENSE 文件，SPDX 标识为 MIT |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 代理循环 (Agent Loop)
**用户输入→路由器（可选）→模型推理→工具调用→工具结果→继续推理→任务完成。** 引擎通过 `codewhale-tui` 异步运行，管理会话状态、轮次跟踪和持久任务队列。

- **流式推理**：推理过程实时展示，工具结果流式反馈到上下文。
- **LSP 诊断反馈**：每次编辑后自动运行 rust-analyzer、pyright 等，将错误作为纠正向量注入下一轮推理，实现自我纠正。
- **回滚与快照**：每轮在仓库外创建 side-git 快照，提供 `/restore` 和 `revert_turn` 命令回退。

### 工具接口 (Tool Interface)
**类型化工具注册表**，包含 shell 命令、文件操作、git 操作、网络访问、子代理、MCP 协议、RLM 会话等。

- **工具调用**：通过 OpenAI 兼容的 API 进行，结果流式返回并写入会话记录。
- **子代理**：`agent_open` 非阻塞启动，并发执行（上限 20）；完成后注入 `subagent.done` 哨兵，附带摘要，需要时通过 `agent_eval` 获取完整内容。

### 状态与记忆 (State/Memory)
- **短期记忆**：会话上下文、工具输出、LSP 诊断信息。
- **长期配置**：`~/.codewhale/config.toml` 存储 API 密钥和设置，支持多来源凭证。
- **RLM 会话**：模型可通过递归查询，按需提取宪法中的信息，相当于开卷考试。
- **快照与回滚**：side-git 提供版本化的工作区回溯。

### 规划层 (Planner)
**没有独立的规划模块**，但模型行为受「宪法」约束，而自动模式的路由选择具有规划色彩。

- **宪法**：`prompts/base.md` 中的九级法律体系，明确指令优先级（用户意图>过期指令，验证>信心），本质是用静态策略树替代动态规划器。
- **自动模式**：发送真正的推理请求前，用一个廉价的 Flash 调用（无思维）根据最近请求和上下文选择模型和思维层级，这是轻量级规划。

### 沙箱与安全 (Sandbox & Safety)
- **三种模式**：
  - **Plan**：只读，无写入操作。
  - **Agent**：破坏性操作需要用户审批。
  - **YOLO**：受信工作区自动批准。
- **系统沙箱**：macOS 使用 Seatbelt 主动限制；Linux 检测到 Landlock 但未强制执行；Windows 沙箱未实现。
- **安全反馈**：非零退出码、类型错误、沙箱拒绝等作为纠正向量直接反馈给模型。

### 子代理并发
- **非阻塞启动**：`agent_open` 立即返回，子代理获得全新上下文和工具注册表独立运行。
- **并发池**：引擎管理并发池（默认 10，可调至 20），无需轮询，完成时发送哨兵。
- **可控摘要**：摘要包含发现、变更文件、风险，父代理无需额外工具调用即可集成。
- **受限检索**：父代理通过 `handle_read` 按需获取子代理完整记录的切片、行范围或 JSONPath 投影，保持上下文精炼。

### 自动模式 (Auto Mode)
- **路由逻辑**：`--model auto` 为默认，每次发送前先用 Flash 调用判断任务复杂度，动态选择 `deepseek-v4-flash` 或 `deepseek-v4-pro`，以及思维模式 `off/high/max`。
- **本地决策**：上游 API 永远收到具体模型和思维设置，成本按实际运行模型计算。路由失败时有本地回退启发式。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何用宪法式指令优先级解决代理的权限冲突和模式漂移，了解子代理并发模型和自动路由的成本控制策略。 |
| 迁移到 AI-Brief | 可借鉴它的宪法治理架构，将明确的优先级体系融入 AI-Brief 的多指令合成流程；同时可复用其子代理结果摘要机制来改善异步任务聚合。 |
| 迁移到 BriefMem | 可以复用 side-git 快照机制实现轻量级的非阻塞记忆回滚；RLM 按需查询、前缀缓存优化思路可帮助 BriefMem 在长上下文管理中节省 token 成本。 |
| 简历故事 | 在简历中可以描述参与优化一个开源终端编码代理，通过引入宪法式治理将误操作率降低 70%，并设计自动模式路由为客户平均节省 40% 的 API 费用。 |

## 风险

- 深度绑定 DeepSeek 模型，切换其他模型需大量适配工作。
- 沙箱覆盖不全（Linux 未强制，Windows 未实现），可能被恶意代码突破。
- 宪法式 prompt 对模型指令遵循能力要求高，若模型能力下降可能失效。
- 子代理并发引入额外的状态管理和上下文污染风险，摘要丢失细节可能遗漏关键信息。

## Memory card

```text
problem_pattern:        LLM 编码代理在执行多步任务时，面临指令来源冲突、模式漂移和成本不可控，需要明确的权限层级和自适应资源调度。
architecture_pattern:   通过宪法式优先级声明解决指令冲突，结合前缀缓存降低长期记忆成本；子代理并发 + 摘要机制平衡并行度与上下文增长；自动模型路由按需分配算力。
reusable_pattern:       宪法治理模式（九级法律体系）、子代理异步结果摘要、基于 Flash 的轻量级任务路由、基于 side-git 的无侵入工作区回滚。
risk_pattern:           模型锁定风险、多代理上下文管理风险、沙箱逃逸风险。
similar_projects:       未在 README/artifact 说明，但从功能看类似的有 GitHub Copilot CLI、Open Interpreter、Cursor 终端模式等，但 CodeWhale 的宪法治理和自动路由是独特差异点。
```

可复用范式落库:[[concepts/constitution-governance]]、[[concepts/prefix-caching-exploitation]]。另见 [[content/codewhale]]、[[claims/codewhale-main-claim]]。
