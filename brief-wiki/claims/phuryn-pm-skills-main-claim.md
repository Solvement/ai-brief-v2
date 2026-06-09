---
text: "仓库包含 9 个插件、68 个 skills、42 个 commands。"
slug: "phuryn-pm-skills-main-claim"
kind: "claim"
content: "phuryn-pm-skills"
source_pointer: "validate_plugins.py report；.claude-plugin/marketplace.json plugins"
evidence_strength: "high"
supports:
  - "phuryn-pm-skills-agent-skill"
  - "slash-command-workflow"
contradicts: []
open_challenges:
  - "不证明这些 workflow 在真实产品团队中有效，也不证明平台安装一定成功。"
  - "数量容易制造完整感；质量仍取决于每个 SKILL.md 的具体指令和模型执行。"
status: "supported"
---

## Claim

这不是单个 prompt，而是一个多插件市场包。

证据:本地运行 `python validate_plugins.py` 输出 Plugins: 9, Skills: 68, Commands: 42, Total: 110 components。。边界:不证明这些 workflow 在真实产品团队中有效，也不证明平台安装一定成功。。风险:数量容易制造完整感；质量仍取决于每个 SKILL.md 的具体指令和模型执行。。See [[content/phuryn-pm-skills]]。
