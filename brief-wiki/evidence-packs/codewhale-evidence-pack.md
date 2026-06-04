---
content: "codewhale"
kind: "evidence-pack"
title: "CodeWhale — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "终端里的 DeepSeek V4 编码智能体，通过宪法治理、自动模式和子代理并发，把模型从问答机升级成能独立完成任务的工程助手。"
    internal_logic: "### 代理循环 (Agent Loop)\n**用户输入→路由器（可选）→模型推理→工具调用→工具结果→继续推理→任务完成。** 引擎通过 `codewhale-tui` 异步运行，管理会话状态、轮次跟踪和持久任务队列。\n\n- **流式推理**：推理过程实时展示，工具结果流式反馈到上下文。\n- **LSP 诊断反馈**：每次编辑后自动运行 rust-analyzer、pyright 等，将错误作为纠正向量注入下一轮推理，实现自我纠正。\n- **回滚与快照**：每轮在仓库外创建 side-git 快照，提供 `/restore` 和 `revert_turn` 命令回退。\n\n### 工具接口 (Tool Interface)\n**类型化工具注册表**，包含 shell 命令、文件操作、git 操作、网络访问、子代理、MCP 协议、RLM 会话等。\n\n- **工具调用**：通过 OpenAI 兼容的 API 进行，结果流式返回并写入会话记录。\n- **子代理**：`agent_open` 非阻塞启动，并发执行（上限 20）；完成后注入 `subagent.done` 哨兵，附带摘要，需要时通过 `agent_eval` 获取完整内容。\n\n### 状态与记忆 (State/Memory)\n- **短期记忆**：会话上下文、工具输出、LSP 诊断信息。\n- **长期配置**：`~/.codewhale/config.toml` 存储 API 密钥和设置，支持多来源凭证。\n- **RLM 会话**：模型可通过递归查询，按需提取宪法中的信息，相当于开卷考试。\n- **快照与回滚**：side-git 提供版本化的工作区回溯。\n\n### 规划层 (Planner)\n**没有独立的规划模块**，但模型行为受「宪法」约束，而自动模式的路由选择具有规划色彩。\n\n- **宪法**：`prompts/base.md` 中的九级法律体系，明确指令优先级（用户意图>过期指令，验证>信心），本质是用静态策略树替代动态规划器。\n- **自动模式**：发送真正的推理请求前，用一个廉价的 Flash 调用（无思维）根据最近请求和上下文选择模型和思维层级，这是轻量级规划。\n\n### 沙箱与安全 (Sandbox & Safety)\n- **三种模式**：\n  - **Plan**：只读，无写入操作。\n  - **Agent**：破坏性操作需要用户审批。\n  - **YOLO**：受信工作区自动批准。\n- **系统沙箱**：macOS 使用 Seatbelt 主动限制；Linux 检测到 Landlock 但未强制执行；Windows 沙箱未实现。\n- **安全反馈**：非零退出码、类型错误、沙箱拒绝等作为纠正向量直接反馈给模型。\n\n### 子代理并发\n- **非阻塞启动**：`agent_open` 立即返回，子代理获得全新上下文和工具注册表独立运行。\n- **并发池**：引擎管理并发池（默认 10，可调至 20），无需轮询，完成时发送哨兵。\n- **可控摘要**：摘要包含发现、变更文件、风险，父代理无需额外工具调用即可集成。\n- **受限检索**：父代理通过 `handle_read` 按需获取子代理完整记录的切片、行范围或 JSONPath 投影，保持上下文精炼。\n\n### 自动模式 (Auto Mode)\n- **路由逻辑**：`--model auto` 为默认，每次发送前先用 Flash 调用判断任务复杂度，动态选择 `deepseek-v4-flash` 或 `deepseek-v4-pro`，以及思维模式 `off/high/max`。\n- **本地决策**：上游 API 永远收到具体模型和思维设置，成本按实际运行模型计算。路由失败时有本地回退启发式。"
    failure_mode: "深度绑定 DeepSeek 模型，切换其他模型需大量适配工作。"
    source_pointer: "https://github.com/hmbown/codewhale"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/MIT/v0.8.52"
experiments: []
claims:
  - "[[claims/codewhale-main-claim]]"
artifacts:
  - "[[artifacts/codewhale-repo]]"
metrics:
  - "stars=36842"
  - "forks=3170"
  - "open_issues=425"
  - "latest_release=v0.8.52"
  - "pushed_at=2026-06-03T10:44:42Z"
baselines: []
failure_modes:
  - "深度绑定 DeepSeek 模型，切换其他模型需大量适配工作。"
  - "沙箱覆盖不全（Linux 未强制，Windows 未实现），可能被恶意代码突破。"
  - "宪法式 prompt 对模型指令遵循能力要求高，若模型能力下降可能失效。"
  - "子代理并发引入额外的状态管理和上下文污染风险，摘要丢失细节可能遗漏关键信息。"
missing_details: []
source_pointers:
  - "https://github.com/hmbown/codewhale"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/codewhale-main-claim]],官方 artifact 落库为 [[artifacts/codewhale-repo]]。See [[content/codewhale]]。
