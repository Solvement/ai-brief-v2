---
text: "“TARS is a Multimodal AI Agent stack, currently shipping two projects: Agent TARS and UI-TARS-desktop”。"
slug: "bytedance-ui-tars-desktop-main-claim"
kind: "claim"
content: "bytedance-ui-tars-desktop"
source_pointer: "README Introduction；README Agent TARS；README UI-TARS Desktop"
evidence_strength: "medium"
supports:
  - "gui-agent"
  - "visual-grounding"
contradicts: []
open_challenges:
  - "不直接证明两个产品在当前 commit 都能完整端到端运行。"
  - "Agent TARS 的完整用户文档大量指向外部 `agent-tars.com`，本次主要核验了仓库内代码和 README。"
status: "supported"
---

## Claim

仓库定位自己为多模态 Agent 栈，主线有 Agent TARS 和 UI-TARS Desktop 两块。

证据:README 明确列出两块；代码树也有 `apps/ui-tars`、`packages/ui-tars/*`、`multimodal/agent-tars/core`、`multimodal/agent-tars/cli`。。边界:不直接证明两个产品在当前 commit 都能完整端到端运行。。风险:Agent TARS 的完整用户文档大量指向外部 `agent-tars.com`，本次主要核验了仓库内代码和 README。。See [[content/bytedance-ui-tars-desktop]]。
