---
name: "Material Passport"
slug: "material-passport"
kind: "concept"
tags:
  - "state"
  - "provenance"
  - "audit"
maturity: "active"
first_seen_in: "imbad0202-academic-research-skills"
related_content:
  - "imbad0202-academic-research-skills"
related_concepts: []
explanation: "跨阶段状态账本：记录材料来源、引用 provenance、实验 provenance、claim intent、verification status。白话说，它让下一个 agent 知道前面到底凭什么写。"
examples:
  - "examples/passport_with_experiment_provenance.yaml"
  - "shared/handoff_schemas.md"
  - "academic-pipeline/references/passport_as_reset_boundary.md"
common_misunderstandings:
  - "它不是保证可复现的实验系统；`repro_lock` 文档也说是配置记录，不是 byte-replay guarantee。"
  - "实验由研究者外部完成，ARS 只 intake 和对齐 claim。"
open_questions:
  - "长论文多轮修订时，passport 的人工维护成本和错误率是多少？"
---

## Explanation

跨阶段状态账本：记录材料来源、引用 provenance、实验 provenance、claim intent、verification status。白话说，它让下一个 agent 知道前面到底凭什么写。 出处:https://github.com/imbad0202/academic-research-skills。See [[content/imbad0202-academic-research-skills]]。

## Supported by
- [[claims/imbad0202-academic-research-skills-main-claim]]
