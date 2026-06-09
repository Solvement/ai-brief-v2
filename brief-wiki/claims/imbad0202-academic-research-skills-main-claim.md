---
text: "可通过 Claude Code plugin 安装，并提供 `/ars-*` 命令入口。"
slug: "imbad0202-academic-research-skills-main-claim"
kind: "claim"
content: "imbad0202-academic-research-skills"
source_pointer: "README Quick install；docs/SETUP Method 0；commands/ars-plan.md；commands/ars-full.md"
evidence_strength: "high"
supports:
  - "claude-code-skill-suite"
  - "material-passport"
contradicts: []
open_challenges:
  - "未证明 Claude Code 当前 marketplace 在线安装一定成功；本次没有实际安装 plugin。"
  - "强绑定 Claude Code runtime；换到 claude.ai web 或普通 API 不等价。"
status: "supported"
---

## Claim

不是让用户手动复制一大堆 prompt；Claude Code 里可以装 plugin，然后用 slash command 触发具体模式。

证据:仓库含 `.claude-plugin/plugin.json`，`commands/` 下有 14 个命令文件；`ars-full` frontmatter 固定 `model: opus`，`ars-plan` 固定 `model: sonnet`。。边界:未证明 Claude Code 当前 marketplace 在线安装一定成功；本次没有实际安装 plugin。。风险:强绑定 Claude Code runtime；换到 claude.ai web 或普通 API 不等价。。See [[content/imbad0202-academic-research-skills]]。
