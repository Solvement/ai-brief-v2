---
content: "herdr"
kind: "evidence-pack"
title: "herdr — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个在终端里分屏管多个 AI 助手的小工具，能一眼看出谁在干活、谁卡住了、谁搞完了，还能随时断开重连不丢进度。"
    internal_logic: "### Agent Loop\n**Herdr 不实现代理循环**，它是一个终端多路复用器，包裹外部代理进程。代理（如 Claude Code、Codex）在 Herdr 分配的窗格中运行，其执行逻辑完全由代理自己控制。Herdr 通过监控进程名称和终端输出来推断代理状态（阻塞、工作中、完成等），**不干预代理的内部控制流**。因此，代理循环是外部代理的责任，Herdr 仅为它们提供一个可观察的运行时容器。\n\n### Tool Interface\nHerdr 提供**本地 Unix 套接字 API**，允许外部程序（包括 AI 代理）以编程方式操作 Herdr。通过套接字可以创建工作区、切分窗格、生成辅助进程、读取窗格输出以及等待状态变化。这构成了一个**工具接口**，使得代理能够自我编排，例如一个主代理可以启动子代理到不同窗格并监控它们。API 详情见 `SKILL.md` 和 `/docs/socket-api/`。\n\n### State / Memory\nHerdr 维护**会话状态**，支持**客户端分离和重连**。窗格进程在后台服务器中持续运行，即使终端客户端退出也不受影响。状态包含每个代理的**运行状态**（阻塞、工作中、完成、空闲），并在侧边栏中可视化。会话可以在服务器重启后恢复，并可选择性保留最近的屏幕历史。这些是**进程级状态**，不涉及对话记忆或代理内部数据。官方集成可以为支持的代理提供会话身份，以便在重启后恢复代理会话。\n\n### Planner\nHerdr **没有规划器**。它不自带任务分解或决策引擎。所有规划由在窗格中运行的代理自行完成。Herdr 的套接字 API 可能被外部规划器用于协调多代理工作流，但此功能不是内置的。\n\n### Sandbox\nHerdr **没有提供沙箱或隔离环境**。代理在用户的本地或远程主机上以相同权限运行，能够访问文件和网络。安全性依赖于用户对代理的信任。如果需要在受控环境中运行，必须结合 Docker 或虚拟机，这不是 Herdr 的范围。\n\n### Safety\n安全模型**极简**。代理可以执行任意命令，存在潜在破坏风险。没有内置的命令审批或权限控制。唯一的保护是用户可以在窗格中手动干预。许可证方面，使用 AGPL-3.0，可能对商业集成有合规要求，但提供商业许可证。\n\n### 与类似项目比较\n在 README 中，Herder 将自己与 **tmux** 和 **GUI 代理管理器** 进行了对比。tmux 提供持久会话但缺少代理感知；GUI 管理器显示代理状态但要求离开终端。Herder 是**唯一同时具备持久会话、原生终端支持和代理感知**的工具，特别适合习惯命令行工作流的工程师。"
    failure_mode: "启发式状态检测可能不可靠：依赖进程名和输出解析，若代理输出格式变化或自定义代理，检测可能失败或误报。"
    source_pointer: "https://github.com/ogulcancelik/herdr"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/NOASSERTION/v0.6.7"
experiments: []
claims:
  - "[[claims/herdr-main-claim]]"
artifacts:
  - "[[artifacts/herdr-repo]]"
metrics:
  - "stars=4012"
  - "forks=256"
  - "open_issues=23"
  - "latest_release=v0.6.7"
  - "pushed_at=2026-06-03T12:23:50Z"
baselines: []
failure_modes:
  - "启发式状态检测可能不可靠：依赖进程名和输出解析，若代理输出格式变化或自定义代理，检测可能失败或误报。"
  - "实验性功能风险：`herdr update --handoff` 标记为实验，可能丢失窗格进程或导致会话崩溃。"
  - "无沙箱风险：代理拥有用户完整权限，若代理失误或被利用，可能造成文件损坏或安全漏洞。"
  - "依赖外部代理 CLI：每个受支持的代理需要单独维护集成，若第三方代理 CLI 改变接口，集成可能失效。"
  - "许可证限制：AGPL-3.0 可能阻碍闭源商业产品集成，但提供商业许可选项。"
missing_details: []
source_pointers:
  - "https://github.com/ogulcancelik/herdr"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/herdr-main-claim]],官方 artifact 落库为 [[artifacts/herdr-repo]]。See [[content/ogulcancelik-herdr]]。
