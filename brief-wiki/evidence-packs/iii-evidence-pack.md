---
content: "iii"
kind: "evidence-pack"
title: "iii — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "iii 是一个让后端服务像搭积木一样实时组合、扩展和观测的框架，每个服务都是一个可被即时发现和调用的 Worker"
    internal_logic: "### 代理循环（Agent Loop）\n\n**未在 README/artifact 说明**代理循环的具体实现步骤（例如感知、规划、行动、观察）。README 仅描述“当任务需要某个系统尚不具备的能力时，代理可以添加 Worker、发现其函数、调用并追踪过程”，表明代理具备运行时扩展能力，但决策、工具选择、多步执行的内部机制未暴露。\n\n### 工具接口（Tool Interface）\n\n**工具即函数**：Worker 内部注册的函数（Function）即为可调用单元。每个函数有稳定标识符（如 `content::classify`），可被其他 Worker 或代理直接调用。工具接口通过 iii 引擎统一完成路由、序列化和传递，无需额外适配层。\n\n**动态发现**：加入实时目录（live catalog）后，新 Worker 及其函数立即被所有已注册 Worker 知晓并可调用，代理可利用同一目录发现可用工具。\n\n### 状态/记忆（State/Memory）\n\n**未在 README/artifact 说明** iii 是否提供内建的状态存储或记忆持久化机制。README 将“状态”列为一种触发器类型（状态变化触发函数），并提及控制台可查看实时状态，但未说明状态的存储位置、生命周期或跨调用持久化策略。\n\n### 规划器（Planner）\n\n**未在 README/artifact 说明** 代理是否包含专门的规划模块。READM 仅强调代理可以通过添加 Worker 来动态获得新能力，暗示其能自行决定何时需要扩展，但规划算法或链式推理细节未提及。\n\n### 沙箱（Sandbox）\n\n**可安装沙箱 Worker**：通过 `iii worker add sandbox` 可将沙箱能力引入系统。README 未描述该 Worker 的实现细节，仅将其列为与队列、代理并列的可添加组件，推测沙箱提供隔离代码执行环境，但安全边界与资源限制未说明。\n\n### 安全边界（Safety）\n\n**未在 README/artifact 说明** 完整的安全模型，如函数权限控制、Worker 间隔离、调用认证、敏感数据处理等。仅能从架构推测每个 Worker 是独立进程，通过引擎注册后通信，但未看到明确的访问控制策略。\n\n### 可观测性\n\n**统一追踪**：所有调用链路可追踪。无论是直接调用、HTTP 触发还是队列消费，iii 自动记录追踪信息，开发者可通过控制台查看。\n\n**实时控制台**：iii-console 提供 Workers、Functions、Triggers、队列、追踪、日志和实时状态的检查界面，将系统表面直接可视化。\n\n### 多语言 SDK\n\n**统一原语**：Node.js、Python、Rust SDK 均以 Worker/Function/Trigger 三原语为核心，屏蔽语言差异。Worker 是进程，可使用任何相应语言编写，注册后纳入统一目录。\n\n### 代理技能（Agent Skills）\n\n**可供 Agent 阅读的参考材料**：`skills/` 目录中的文档覆盖了所有原语的使用说明，可通过 `npx skills add iii-hq/iii/skills` 安装到 Agent 上下文中，帮助 Agent 理解如何操作 iii 系统，相当于给 Agent 一本 iii 使用手册。"
    failure_mode: "核心引擎使用 Elastic License 2.0，可能限制商业闭源二次分发"
    source_pointer: "https://github.com/iii-hq/iii"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/not_found/iii/v0.17.0"
experiments: []
claims:
  - "[[claims/iii-main-claim]]"
artifacts:
  - "[[artifacts/iii-repo]]"
metrics:
  - "stars=17594"
  - "forks=1156"
  - "open_issues=38"
  - "latest_release=iii/v0.17.0"
  - "pushed_at=2026-06-03T14:26:03Z"
baselines: []
failure_modes:
  - "核心引擎使用 Elastic License 2.0，可能限制商业闭源二次分发"
  - "未说明故障恢复机制与高可用部署方案，生产环境稳定性存疑"
  - "代理规划和状态管理细节未公开，难以评估复杂场景的可靠性"
  - "项目名称“iii”缺乏辨识度，可能与现有工具冲突"
missing_details:
  - "license_spdx_id: not_found"
source_pointers:
  - "https://github.com/iii-hq/iii"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/iii-main-claim]],官方 artifact 落库为 [[artifacts/iii-repo]]。See [[content/iii]]。
