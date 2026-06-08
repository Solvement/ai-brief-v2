---
text: "代理安全不能依赖提示词约束，AGT 用确定性应用层代码拦截实现“结构性不可能”的安全边界。"
slug: "agent-governance-toolkit-main-claim"
kind: "claim"
content: "agent-governance-toolkit"
source_pointer: "README 中“The Problem”章节，引用 OWASP LLM01:2025 和 Andriushchenko 等论文。"
evidence_strength: "high"
supports:
  - "deterministic-policy-interception"
  - "zero-trust-agent-identity"
contradicts: []
open_challenges:
  - "未提供 AGT 自身拦截效果的 benchmark，仅提供了原理性论证。"
  - "虽然原理正确，但若策略引擎本身有漏洞（如逃逸条件），该‘确定性’仍可被绕过。"
status: "supported"
---

## Claim

别指望在提示里让 GPT 听话，AGT 用代码在工具真正执行前掐死危险动作。

证据:通过引用 ICLR 2025 论文（100% 攻击成功率）和微软红队经验支撑了提示词防御不可靠的观点。。边界:未提供 AGT 自身拦截效果的 benchmark，仅提供了原理性论证。。风险:虽然原理正确，但若策略引擎本身有漏洞（如逃逸条件），该‘确定性’仍可被绕过。。See [[content/microsoft-agent-governance-toolkit]]。
