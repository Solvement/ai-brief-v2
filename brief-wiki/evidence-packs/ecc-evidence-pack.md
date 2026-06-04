---
content: "ecc"
kind: "evidence-pack"
title: "ECC — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一套横跨 Claude Code、Codex、Cursor 等多个 AI 编程助手的原生操作员系统，通过技能、本能、记忆与安全扫描提升 agentic 工作流的性能与一致性。"
    internal_logic: "### 与 AI 助手的交互枢纽：钩子 (Hooks)\n\nECC 并不重新发明 agent loop，而是通过**生命周期钩子**将自己的逻辑注入到宿主助手（harness）的运行中。每个钩子对应助手的不同阶段，例如 `SessionStart`（会话开始时触发）、`Stop`（会话结束时触发），从而在恰当的时刻做记忆持久化、安全检查、上下文加载等操作。钩子支持脚本化，可通过环境变量 `ECC_HOOK_PROFILE` 动态调整执行策略，无需修改代码即可切换 minimal/standard/strict 模式。\n\n### 可组装的工具接口：技能 (Skills) 与命令 (Commands)\n\n**技能 (Skills)** 是封装好的、可复用的任务逻辑，例如 `search-first`、`parallel-execution-optimizer`。它们被组织在 `skills/` 目录下，可通过助手的 slash 命令调用。技能之间可以串联，形成复杂工作流。\n\n**命令 (Commands)** 则是更细粒度的操作，直接映射到助手的命令系统，例如 `/harness-audit` 可对当前 harness 进行审计。命令背后可能是 shell 脚本或 Python 脚本，提供了跨 harness 的统一操作界面。\n\n### 状态与记忆：SQLite 状态存储与上下文上下文 (Contexts)\n\nECC 内置了一个 **SQLite 状态存储**，通过 `ecc status` 命令提供可查询的快照。此状态涵盖活跃会话、技能运行健康度、治理事件等，可将 Agent 的状态从“一次性”变为“可持续”。\n\n**记忆持久化** 通过钩子实现：当会话停止时，钩子自动将当前上下文摘要保存，下次会话开始时恢复，从而让助手跨会话“记住”之前的工作。\n\n**上下文 (Contexts)** 目录可能包含预置的上下文模板，用于指导助手的行为风格或领域知识。\n\n### 规划与质量门控：`quality-gate` 与本鞥 (Instincts)\n\nREADME 提到了 `/quality-gate` 命令，用于在流程中设置质量检查点。结合 `/loop-start` 和 `/loop-status`，可构建带验证的循环工作模式，类似于 agentic loop 中的规划-执行-验证循环。\n\n**本鞥 (Instincts)** 是一种快速参考模式，可能用于指导助手在某些情境下的优先反应，可以看作是一种轻量级规划偏好。\n\n### 安全边界：AgentShield 扫描\n\nECC 集成了 **AgentShield**，这是一个可独立安装的 npm 包，包含 1282 个测试验证的 102 条安全规则。通过 `/security-scan` 技能，可以直接在助手内执行代码安全扫描，及时发现漏洞、CVE 等风险。这构成了内联的安全审核屏障。\n\n### 跨 harness 适配层：MCP 配置与 Legacy Shims\n\n为了在不同助手间迁移，ECC 提供了 **MCP 配置**（模型上下文协议，一种连接外部工具的方法）和 **legacy command shims**（兼容旧命令的包装器）。这确保了技能和命令在 Claude Code、Codex CLI、Cursor 等多个环境中的兼容性。\n\n### 自我进化：持续学习 (Continuous Learning)\n\n系统能够从会话中自动提取模式，并转化为新的可复用技能，形成“使用→学习→增强”的飞轮。这依赖于钩子捕获的行为数据和模式识别机制，具体实现未在 README 详述。"
    failure_mode: "单维护者风险：README 明确强调由单个维护者负责，若其精力不济，项目可能停滞。"
    source_pointer: "https://github.com/affaan-m/ecc"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/true/MIT/v1.10.0"
experiments: []
claims:
  - "[[claims/ecc-main-claim]]"
artifacts:
  - "[[artifacts/ecc-repo]]"
metrics:
  - "stars=204159"
  - "forks=31317"
  - "open_issues=60"
  - "latest_release=v1.10.0"
  - "pushed_at=2026-06-02T11:51:04Z"
baselines: []
failure_modes:
  - "单维护者风险：README 明确强调由单个维护者负责，若其精力不济，项目可能停滞。"
  - "依赖特定助手接口：钩子、命令等依赖 Claude Code、Cursor 等助手的内部机制，一旦这些助手 API 变更，ECC 可能出现大面积不兼容。"
  - "质量波动：海量技能和命令来自多数社区的贡献，可能存在未充分测试的组件，导致行为异常。"
  - "v2.0 为 alpha 阶段：新 Rust 控制面 (ecc2) 尚在 alpha，生产使用风险较高。"
  - "选择性安装的复杂性：manifest 驱动的选择性安装可能因组件间隐式依赖导致部分功能失效。"
missing_details: []
source_pointers:
  - "https://github.com/affaan-m/ecc"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ecc-main-claim]],官方 artifact 落库为 [[artifacts/ecc-repo]]。See [[content/ecc]]。
