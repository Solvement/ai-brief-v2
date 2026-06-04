---
content: "agent-governance-toolkit"
kind: "evidence-pack"
title: "agent-governance-toolkit — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个针对 AI 智能体的策略执行、身份认证、沙箱与可靠性工程工具包，覆盖 OWASP 前十大智能体风险。"
    internal_logic: "### 策略执行引擎（Policy Engine）\n\nAGT 的核心是一个**确定性、无状态的策略决策引擎**。它不依赖 LLM 来判断一个操作是否安全，而是在代码层面拦截所有工具调用、消息发送或代理委托，根据预先定义的 YAML/OPA/Cedar 策略进行裁决。\n\n- **默认关闭（fail-closed）**：如果引擎未连接或异常，操作被默认拒绝，避免绕过。\n- **策略表达**：支持 YAML 声明式规则，如 `condition: \"action.type == 'delete'\"`，也支持程序化 API（`PolicyEvaluator`）。\n- **裁决结果**：允许、拒绝或要求人工审批。拒绝时会抛出 `GovernanceDenied` 异常。\n\n### 代理身份与信任（Agent Identity & Trust）\n\n在多代理系统中，共享 API 密钥导致难以审计。AGT 引入**零信任身份层**：\n\n- 使用 **SPIFFE/DID/mTLS** 为每个代理分配唯一身份，实现细粒度授权。\n- 即使代理共享底层凭证，也能通过身份区分其行为。\n- 结合信任评分（Trust Scoring）动态调整代理权限。\n\n### 执行沙箱（Execution Sandbox）\n\n`Agent Runtime` 提供**四层特权环**的沙箱机制，限制代理的代码执行、文件系统访问等。未在 README 中详细展开实现方式，但明确为可选模块。\n\n### 代理循环拦截点（Agent Loop Interception）\n\n`govern()` 函数提供最轻量的接入方式：用两行代码包装任意工具函数，每次调用自动进行策略检查。这种设计使得 AGT 可以嵌入任何现有的代理循环（如 LangChain、AutoGen 等），无需修改框架源码。\n\n### 审计与可观测性（Audit & Observability）\n\n- **防篡改日志**：记录每次决策的上下文，包括活跃策略、代理请求和裁决原因，用于合规审计。\n- **SRE 工具包**：提供 kill switch、SLO 监控、混沌测试，将代理视为生产服务对待。\n- **Governance Dashboard**：实时展示代理集群的健康、信任和合规状态。\n\n### MCP 安全网关\n\n针对 MCP（Model Context Protocol）生态的专项防护：\n- 检测工具中毒（Tool Poisoning）和隐藏指令（Hidden Instruction）。\n- 监控工具接口的漂移（Drift Monitoring），防止非预期变更。\n- 防范域名仿冒（Typosquatting）攻击。\n\n### 安全边界总结\n\nAGT 构建了一条**从提示到动作的完整防线**：\n1. **红队扫描** (`agt red-team`) 在开发阶段审计提示注入漏洞。\n2. **策略引擎** 在运行时对每个动作进行确定性裁决。\n3. **身份辨析** 确保责任到代理。\n4. **沙箱** 限制代理执行环境。\n5. **审计** 提供事后追溯能力。\n\n整个设计强调“只靠提示词约束是脆弱且不可靠的”，因此将安全控制下沉到应用代码层。"
    failure_mode: "项目处于 Public Preview 阶段，正式版（GA）可能有破坏性变更，用于生产需评估风险。"
    source_pointer: "https://github.com/microsoft/agent-governance-toolkit"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v4.0.0"
experiments: []
claims:
  - "[[claims/agent-governance-toolkit-main-claim]]"
artifacts:
  - "[[artifacts/agent-governance-toolkit-repo]]"
metrics:
  - "stars=3872"
  - "forks=537"
  - "open_issues=38"
  - "latest_release=v4.0.0"
  - "pushed_at=2026-06-03T01:25:38Z"
baselines: []
failure_modes:
  - "项目处于 Public Preview 阶段，正式版（GA）可能有破坏性变更，用于生产需评估风险。"
  - "策略编写依赖 YAML 和表达式语法，复杂策略可能难以维护和测试，团队需要学习成本。"
  - "虽然支持多语言，但完整功能栈目前仅在 Python 中提供，异构系统集成可能受限。"
  - "沙箱和信任层为可选模块，未默认开启，用户可能由于配置疏忽而暴露风险。"
  - "未在 README/artifact 说明性能开销（如策略评估延迟），高吞吐场景下可能成为瓶颈。"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/microsoft/agent-governance-toolkit"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/agent-governance-toolkit-main-claim]],官方 artifact 落库为 [[artifacts/agent-governance-toolkit-repo]]。See [[content/agent-governance-toolkit]]。
