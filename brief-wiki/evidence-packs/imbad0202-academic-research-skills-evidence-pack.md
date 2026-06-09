---
content: "imbad0202-academic-research-skills"
kind: "evidence-pack"
title: "academic-research-skills — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "给 Claude Code 用的学术研究工作流套件：把找文献、写论文、审稿、修订、终稿检查拆成可路由的 skills、slash commands、hooks 和校验脚本。"
    internal_logic: "真实例子：`academic-pipeline/examples/full_pipeline_example.md` 里，用户从“台湾私校少子化招生策略”开始，orchestrator 识别从 Stage 1 进入，推荐 `deep-research socratic`、`academic-paper plan`、`academic-paper-reviewer full`、revision、finalize。这个流不是一个 agent 独跑，而是 skill/agent/sidecar/schema 交接。\n\n```mermaid\nflowchart TD\n  A[用户目标] --> B[academic-pipeline 编排]\n  B --> C[Stage 1 研究]\n  C --> D[deep-research socratic]\n  D --> E[RQ Brief 和文献矩阵]\n  E --> F[Stage 2 写作]\n  F --> G[academic-paper plan 或 full]\n  G --> H[Material Passport]\n  H --> I[Stage 2.5 integrity gate]\n  I --> J{通过}\n  J -->|否| K[修复后重验 最多 3 轮]\n  J -->|是| L[Stage 3 peer review]\n  L --> M[Stage 4 revise]\n  M --> N[Stage 4.5 final integrity]\n  N --> O[可选 claim audit]\n  O --> P[formatter final output]\n```\n\n两个关键实现点：第一，插件加载时 `SessionStart` 调 `scripts/announce-ars-loaded.sh`，把命令和 3 个 plugin agents 注入上下文；第二，写文件或 Bash 前 `PreToolUse` 调 `scripts/ars_write_scope_guard.py`，用 `scripts/ars_phase_scope_manifest.json` 判断 agent 能否写入目标路径。（来源：hooks/hooks.json；scripts/announce-ars-loaded.sh；scripts/ars_write_scope_guard.py）\n\n最小入口只有两行：\n```text\n/plugin marketplace add Imbad0202/academic-research-skills\n/plugin install academic-research-skills\n```\n这会让 Claude Code 发现四个 skills；传统方式则要求四个 skill 分别位于 `.claude/skills/<skill-name>/SKILL.md`。（来源：README Quick install；QUICKSTART Step 1；docs/SETUP Method 0/1）"
    failure_mode: "docs/SETUP Installation methods；hooks/hooks.json"
    source_pointer: "https://github.com/imbad0202/academic-research-skills"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/NOASSERTION/v3.12.0"
experiments: []
claims:
  - "[[claims/imbad0202-academic-research-skills-main-claim]]"
artifacts:
  - "[[artifacts/imbad0202-academic-research-skills-repo]]"
metrics:
  - "stars=28981"
  - "forks=2402"
  - "open_issues=10"
  - "latest_release=v3.12.0"
  - "pushed_at=2026-06-08T15:23:15Z"
baselines: []
failure_modes:
  - "docs/SETUP Installation methods；hooks/hooks.json"
  - "docs/SETUP Cross-model verification；shared/cross_model_verification.md"
  - "commands/ars-cache-invalidate.md；scripts/verification_gate/__init__.py；docs/PERFORMANCE v3.11 citation verification"
  - "docs/SETUP DOCX output；docs/SETUP LaTeX / PDF output；README Quick install prerequisites"
  - "LICENSE；.claude-plugin/plugin.json license"
  - "本次 checkout 观察；tests/fixtures/v3_6_7_pattern_eval 深层路径"
missing_details: []
source_pointers:
  - "https://github.com/imbad0202/academic-research-skills"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/imbad0202-academic-research-skills-main-claim]],官方 artifact 落库为 [[artifacts/imbad0202-academic-research-skills-repo]]。See [[content/imbad0202-academic-research-skills]]。
