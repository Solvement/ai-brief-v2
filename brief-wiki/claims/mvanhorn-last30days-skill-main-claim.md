---
text: "这是 Agent Skills 包，不只是 CLI。"
slug: "mvanhorn-last30days-skill-main-claim"
kind: "claim"
content: "mvanhorn-last30days-skill"
source_pointer: "CONCEPTS.md Skill/Engine；AGENTS.md Orientation；skills/last30days/SKILL.md frontmatter"
evidence_strength: "high"
supports:
  - "agent-skill"
  - "query-plan"
contradicts: []
open_challenges:
  - "不证明所有宿主都能无差异运行。"
  - "多宿主路径依赖重，SKILL.md 和 engine flags 必须同步。"
status: "supported"
---

## Claim

技能本体是 `SKILL.md` 加同级 `scripts/`，`last30days.py` 是实现层。

证据:`SKILL.md` frontmatter 声明 `user-invocable: true`、`allowed-tools: Bash, Read, Write, AskUserQuestion, WebSearch`，`CONCEPTS.md` 明确 Skill 是分发单元。。边界:不证明所有宿主都能无差异运行。。风险:多宿主路径依赖重，SKILL.md 和 engine flags 必须同步。。See [[content/mvanhorn-last30days-skill]]。
