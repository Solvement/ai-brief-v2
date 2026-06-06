---
text: "完全免费，零 API 费用"
slug: "agent-reach-main-claim"
kind: "claim"
content: "agent-reach"
source_pointer: "README 费用说明和 Is this free? FAQ"
evidence_strength: "high"
supports:
  - "tool-scaffolding"
  - "channel-health-check"
contradicts: []
open_challenges:
  - "仅限工具本身，若平台自身限制访问（如 IP 封锁），可能需要额外代理费用"
  - "若上游工具转向付费模式，则此宣称失效"
status: "supported"
---

## Claim

所有工具开源，不需要付费 API Keys，唯一可能花钱的是服务器代理（约 $1/月）

证据:项目集成的所有后端确实都是开源且无需付费 API，如 twitter-cli、rdt-cli、Jina Reader。边界:仅限工具本身，若平台自身限制访问（如 IP 封锁），可能需要额外代理费用。风险:若上游工具转向付费模式，则此宣称失效。See [[content/agent-reach]]。
