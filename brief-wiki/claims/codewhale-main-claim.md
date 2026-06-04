---
text: "宪法提供九级法律体系，用户当前消息优先级高于过期项目指令。"
slug: "codewhale-main-claim"
kind: "claim"
content: "codewhale"
source_pointer: "README 中 'CodeWhale answers this with a Constitution... Article VII ranks nine tiers from the Constitution's own articles down to prior-session handoffs.'"
evidence_strength: "high"
supports:
  - "constitution-governance"
  - "prefix-caching-exploitation"
contradicts: []
open_challenges:
  - "依赖于模型对宪法文本的准确理解和遵循，若模型理解偏差，优先级可能失效。"
  - "宪法内容过长可能导致前缀缓存失效或模型注意力稀释，实际效果未量化。"
status: "supported"
---

## Claim

模型接收到冲突指令时，有一个明确的先后排名，用户刚说的话比以前的项目说明更管用。

证据:能够减少模型在长对话中因指令冲突产生的错误行为，增强可靠性。。边界:依赖于模型对宪法文本的准确理解和遵循，若模型理解偏差，优先级可能失效。。风险:宪法内容过长可能导致前缀缓存失效或模型注意力稀释，实际效果未量化。。See [[content/codewhale]]。
