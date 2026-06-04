---
content: "herdr"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "herdr — 深度拆解"
reasoning_trace:
  paper_type_decision: "project_type 为 agent_framework，因为它提供了代理运行的框架和编排接口，尽管核心是终端多路复用，但其代理感知、状态管理和 socket API 定义了代理工作环境。"
  central_contribution: "将终端多路复用与 AI 代理状态监控结合，创造了一个开发者友好的代理管理终端环境，填补了 tmux 和 GUI 工具之间的空白。"
  inspected:
    - "README.md"
    - "topics"
    - "top_level_dirs"
    - "key_files"
    - "package_files"
    - "test and docs signals"
    - "GitHub API fields (stars, license, etc.)"
  top_claims:
    - "通过进程名和终端输出实现零配置代理感知。"
    - "官方集成提供会话身份以支持代理恢复。"
    - "Unix 套接字 API 允许代理自我编排。"
    - "单 Rust 二进制，无 GUI 依赖，可远端 SSH 使用。"
  evidence_needed:
    - "实际测试多个代理的检测精度数据。"
    - "集成会话恢复的稳定性和可靠性报告。"
    - "使用 socket API 的真实代理示例。"
    - "在生产环境中使用大量窗格的性能基准。"
  main_threats:
    - "代理输出格式变化可能导致检测失效；"
    - "实验性功能可能引发数据丢失；"
    - "AGPL 许可证可能限制商业采纳。"
  transfer_decision: "可复用其设计理念（终端多路复用+代理感知）和 socket API 模式于自定义开发环境，但核心代码因 Rust 和 AGPL 限制不宜直接嵌入。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 4
  maturity: 4
  main_risk: "启发式状态检测可能不准确，导致错过代理请求交互。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "Agent awareness works by reading foreground process and terminal output, zero config, no hooks required."
    plain_english: "代理状态检测通过读取进程名和终端输出实现，无需任何配置或钩子。"
    source: "README.md 'agent awareness' section"
    evidence_strength: "medium"
    supports: "项目描述和列表显示支持多个代理开箱即用。"
    does_not_support: "未提供检测算法细节、准确率或边缘案例处理。"
    threat: "针对特定代理 CLI 的启发式可能在升级后失效，导致状态误报。"
  - claim: "Official integrations provide session identity for native restore."
    plain_english: "官方集成可以为支持的代理提供会话身份，以便在 Herdr 重启后恢复代理的上下文。"
    source: "README 'agent awareness' and 'direct integrations' section"
    evidence_strength: "medium"
    supports: "列出的集成角色：claude code, codex, opencode 提供会话身份。"
    does_not_support: "未解释具体如何实现会话身份（如 token、环境变量），也未提供恢复成功率。"
    threat: "集成可能依赖代理内部未公开的接口，稳定性存疑。"
  - claim: "Agents can orchestrate via local Unix socket API."
    plain_english: "代理可以通过 Unix 套接字 API 控制 Herdr，实现自我编排。"
    source: "README 'agents can use herdr too' section"
    evidence_strength: "low"
    supports: "提及套接字 API 可创建工作区、切分窗格等；有 SKILL.md 和文档。"
    does_not_support: "未展示任何实际代理使用该 API 的示例或录像，也未说明哪些代理曾测试过。"
    threat: "API 可能未被充分测试，存在未发现的边界情况。"
  - claim: "Herdr is a single Rust binary, no dependencies, runs in any terminal."
    plain_english: "Herder 是一个单独的 Rust 可执行文件，不依赖其他库，可在任何终端模拟器中运行。"
    source: "README 'lives in your terminal' and 'install'"
    evidence_strength: "high"
    supports: "安装方法仅涉及下载二进制或 cargo build；树状结构中只有 Rust 项目。"
    does_not_support: "静态链接或动态链接细节未说明，但在主流 Linux 和 macOS 上可运行。"
    threat: "在较旧 glibc 版本或非标准发行版上可能需要额外构建。"
artifact_audit:
  official_repo: "https://github.com/ogulcancelik/herdr"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "NOASSERTION"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## 大白话定位

**一个在终端里分屏管多个 AI 助手的小工具，能一眼看出谁在干活、谁卡住了、谁搞完了，还能随时断开重连不丢进度。**

> 一句话:终端里的 AI 控制中心。

## 为什么火

- AI 编码代理爆发，开发者同时运行 Claude Code、Codex 等多个 CLI 代理，急需一个统一的管理面板。
- 填补了 tmux（只管终端）和 GUI 代理管理器（离开命令行）之间的空白，提供原生终端内的代理感知。
- Rust 单二进制，轻量无依赖，支持鼠标、键盘，跨 Linux/macOS，开发者友好。
- 提供 Unix 套接字 API，让代理自己也能编排其他代理，打开自我协调的可能性。
- 社区快速成长（数周内数千星），说明终端工作流正是 AI 工程师的痛点。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md in root, 13k+ chars, detailed sections. |
| src | available | src/ directory with Rust source files. |
| tests | available | tests/ directory and just test command in README. |
| license | partial | README states dual AGPL-3.0-or-later / commercial; LICENSE file shows NOASSERTION in GitHub API. |
| docs | available | docs/ directory plus extensive herdr.dev documentation referenced. |
| examples | not_found | No examples directory or embedded examples in README. |
| Cargo.toml | available | Top-level Cargo.toml, buildable with cargo. |
| CHANGELOG | available | CHANGELOG.md present. |
| AGENTS.md | available | File for agent instructions present. |
| SKILL.md | available | Reusable agent skill documentation. |

一句话:**artifact 至少有源码、测试和 license 信号,可进入深挖**

## 技术拆解(agent framework / agent 怎么跑起来)

### Agent Loop
**Herdr 不实现代理循环**，它是一个终端多路复用器，包裹外部代理进程。代理（如 Claude Code、Codex）在 Herdr 分配的窗格中运行，其执行逻辑完全由代理自己控制。Herdr 通过监控进程名称和终端输出来推断代理状态（阻塞、工作中、完成等），**不干预代理的内部控制流**。因此，代理循环是外部代理的责任，Herdr 仅为它们提供一个可观察的运行时容器。

### Tool Interface
Herdr 提供**本地 Unix 套接字 API**，允许外部程序（包括 AI 代理）以编程方式操作 Herdr。通过套接字可以创建工作区、切分窗格、生成辅助进程、读取窗格输出以及等待状态变化。这构成了一个**工具接口**，使得代理能够自我编排，例如一个主代理可以启动子代理到不同窗格并监控它们。API 详情见 `SKILL.md` 和 `/docs/socket-api/`。

### State / Memory
Herdr 维护**会话状态**，支持**客户端分离和重连**。窗格进程在后台服务器中持续运行，即使终端客户端退出也不受影响。状态包含每个代理的**运行状态**（阻塞、工作中、完成、空闲），并在侧边栏中可视化。会话可以在服务器重启后恢复，并可选择性保留最近的屏幕历史。这些是**进程级状态**，不涉及对话记忆或代理内部数据。官方集成可以为支持的代理提供会话身份，以便在重启后恢复代理会话。

### Planner
Herdr **没有规划器**。它不自带任务分解或决策引擎。所有规划由在窗格中运行的代理自行完成。Herdr 的套接字 API 可能被外部规划器用于协调多代理工作流，但此功能不是内置的。

### Sandbox
Herdr **没有提供沙箱或隔离环境**。代理在用户的本地或远程主机上以相同权限运行，能够访问文件和网络。安全性依赖于用户对代理的信任。如果需要在受控环境中运行，必须结合 Docker 或虚拟机，这不是 Herdr 的范围。

### Safety
安全模型**极简**。代理可以执行任意命令，存在潜在破坏风险。没有内置的命令审批或权限控制。唯一的保护是用户可以在窗格中手动干预。许可证方面，使用 AGPL-3.0，可能对商业集成有合规要求，但提供商业许可证。

### 与类似项目比较
在 README 中，Herder 将自己与 **tmux** 和 **GUI 代理管理器** 进行了对比。tmux 提供持久会话但缺少代理感知；GUI 管理器显示代理状态但要求离开终端。Herder 是**唯一同时具备持久会话、原生终端支持和代理感知**的工具，特别适合习惯命令行工作流的工程师。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何结合终端多路复用和进程状态检测，为 AI 代理构建开发环境；理解 Unix 套接字 API 如何用于代理间通信。 |
| 迁移到 AI-Brief | 可借鉴其侧边栏状态摘要和会话持久化的设计模式，为用户提供多个 AI 助手运行时的全局视图。 |
| 迁移到 BriefMem | 不完全直接适用，但状态跟踪和恢复机制可适配为记忆管理的一部分。 |
| 简历故事 | 在简历中可体现为「为 AI 代理终端工作流构建了管理工具」的经验，突出 Rust 工程和代理编排的理解。 |

## 风险

- 启发式状态检测可能不可靠：依赖进程名和输出解析，若代理输出格式变化或自定义代理，检测可能失败或误报。
- 实验性功能风险：`herdr update --handoff` 标记为实验，可能丢失窗格进程或导致会话崩溃。
- 无沙箱风险：代理拥有用户完整权限，若代理失误或被利用，可能造成文件损坏或安全漏洞。
- 依赖外部代理 CLI：每个受支持的代理需要单独维护集成，若第三方代理 CLI 改变接口，集成可能失效。
- 许可证限制：AGPL-3.0 可能阻碍闭源商业产品集成，但提供商业许可选项。

## Memory card

```text
problem_pattern:        开发者同时运行多个 AI 代理（CLI），缺少统一的终端内视图，无法快速获知哪个需要关注，且缺少会话持久化。
architecture_pattern:   客户端-服务器模型：后台服务器管理窗格进程，客户端终端提供 TUI 界面；通过进程监控和输出解析实现代理感知；Unix 套接字提供编程控制接口。
reusable_pattern:       代理感知的多路复用器模式：将 tmux 的持久性与代理状态检测结合，并提供 API 让代理自我编排。
risk_pattern:           外部依赖脆弱性：状态检测高度依赖第三方的进程名和输出格式，缺乏标准化协议；无隔离风险。
similar_projects:       tmux (终端多路复用器，无代理感知)；Warp 终端 (内置 AI 功能，但有 GUI)；Tabby (终端和 SSH 客户端，AI 辅助，非代理多路复用)。
```

可复用范式落库:[[concepts/agent-awareness-via-output-parsing]]、[[concepts/terminal-multiplexing-for-agents]]。另见 [[content/herdr]]、[[claims/herdr-main-claim]]。
