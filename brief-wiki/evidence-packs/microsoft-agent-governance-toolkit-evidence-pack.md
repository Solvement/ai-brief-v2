---
content: "microsoft-agent-governance-toolkit"
kind: "evidence-pack"
title: "agent-governance-toolkit — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Agent Governance Toolkit 是一个面向 AI Agent 的运行时治理工具集，用策略引擎、身份、审计、MCP/框架适配和 SRE 组件在工具调用前做 allow/deny/escalate/transform 决策。"
    internal_logic: "人话：AGT 的核心流程是：agent 想做一件事；治理层先拿到动作上下文；策略引擎判断允许、拒绝、警告、升级审批或改写；宿主代码按结果执行或拦下；同时写审计记录。最小用法可以只是 `govern()` 包一个工具函数，复杂用法可以把策略、身份、信任分数、MCP 网关、OpenTelemetry、SRE 和运行时限制都加上。\n\n技术词：\n- Policy：一组规则，决定某个 action 是否能执行。（来源：docs/tutorials/policy-as-code/01-your-first-policy.md What is a policy）\n- PEP/PDP：宿主 adapter 是 Policy Enforcement Point；ACS/runtime 是 Policy Decision Point。（来源：policy-engine README Agent Control Specification）\n- Intervention point：agent 生命周期里的拦截点，包括 `agent_startup`、`input`、`pre_model_call`、`post_model_call`、`pre_tool_call`、`post_tool_call`、`output`、`agent_shutdown`。（来源：policy-engine README Intervention points）\n- Fail closed：策略运行失败时返回 deny，而不是默认放行。（来源：policy-engine README Core properties）\n- 同进程边界：AGT 文档明确说 policy engine 和 agent 共享进程边界；高安全场景要加容器/VM 隔离。（来源：README Security；docs/ARCHITECTURE Security Model & Boundaries）"
    failure_mode: "README Prerequisites；agent-governance-python/agent-governance-toolkit-core/pyproject.toml；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
    source_pointer: "https://github.com/microsoft/agent-governance-toolkit"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v4.0.0"
experiments: []
claims:
  - "[[claims/microsoft-agent-governance-toolkit-main-claim]]"
artifacts:
  - "[[artifacts/microsoft-agent-governance-toolkit-repo]]"
metrics:
  - "stars=3872"
  - "forks=537"
  - "open_issues=38"
  - "latest_release=v4.0.0"
  - "pushed_at=2026-06-03T01:25:38Z"
baselines: []
failure_modes:
  - "README Prerequisites；agent-governance-python/agent-governance-toolkit-core/pyproject.toml；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
  - "agent-governance-typescript/package.json engines/scripts/dependencies"
  - "policy-engine/sdk/python/pyproject.toml；Dockerfile Stage 4"
  - "Dockerfile OPA CLI；policy-engine README Policies；agent-governance-rust/Cargo.toml"
  - "README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
  - "README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not"
  - "VERSION；README Python distributions；agent-governance-python/agt-policies/pyproject.toml"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/microsoft/agent-governance-toolkit"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/microsoft-agent-governance-toolkit-main-claim]],官方 artifact 落库为 [[artifacts/microsoft-agent-governance-toolkit-repo]]。See [[content/microsoft-agent-governance-toolkit]]。
