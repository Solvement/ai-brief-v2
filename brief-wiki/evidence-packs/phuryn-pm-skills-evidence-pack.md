---
content: "phuryn-pm-skills"
kind: "evidence-pack"
title: "pm-skills — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "pm-skills 是一套面向产品经理和 AI 应用交付者的 Claude/Codex 技能与工作流市场，不是模型或运行时框架。"
    internal_logic: "真实流以 `/discover` 为例：\n```mermaid\nflowchart TD\nA[marketplace.json] --> B[pm-product-discovery plugin]\nB --> C[commands discover.md]\nC --> D[判断新产品或现有产品]\nD --> E[brainstorm ideas skill]\nE --> F[identify assumptions skill]\nF --> G[prioritize assumptions skill]\nG --> H[brainstorm experiments skill]\nH --> I[Discovery Plan markdown]\nI --> J[建议 PRD interview metrics]\n```\n安装入口写在 README：\n`claude plugin marketplace add phuryn/pm-skills`\n`claude plugin install pm-product-discovery@pm-skills`\n这表示宿主平台加载 `.claude-plugin/marketplace.json`，再按 `source: ./pm-product-discovery` 找到插件目录。（来源：README Claude Code CLI；.claude-plugin/marketplace.json）\n\n`/discover` 的具体输入例子是 `/discover Smart notification system for our project management tool`；它要求先问用户已有研究、客户反馈、数据和本次决策目标，再让用户在 10 个想法中选 3-5 个继续压力测试。（来源：pm-product-discovery/commands/discover.md Invocation / Workflow）\n\n关键机制不是代码调用，而是 Markdown 指令组合：command 文件用粗体 skill 名引用同插件 skill；validator 会检查 command 里 `**skill-name** skill` 这种引用是否在同一插件中存在。（来源：validate_plugins.py validate_cross_references）"
    failure_mode: "README Installation；.claude-plugin/marketplace.json；validate_plugins.py"
    source_pointer: "https://github.com/phuryn/pm-skills"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/v2.0.0"
experiments: []
claims:
  - "[[claims/phuryn-pm-skills-main-claim]]"
artifacts:
  - "[[artifacts/phuryn-pm-skills-repo]]"
metrics:
  - "stars=12641"
  - "forks=1497"
  - "open_issues=17"
  - "latest_release=v2.0.0"
  - "pushed_at=2026-06-06T14:12:26Z"
baselines: []
failure_modes:
  - "README Installation；.claude-plugin/marketplace.json；validate_plugins.py"
  - "README Codex CLI"
  - "README Other AI assistants"
  - "pm-execution/skills/prioritization-frameworks/SKILL.md Templates；pm-product-strategy/skills/product-strategy/SKILL.md Templates"
  - "validate_plugins.py parse_yaml_frontmatter"
missing_details: []
source_pointers:
  - "https://github.com/phuryn/pm-skills"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/phuryn-pm-skills-main-claim]],官方 artifact 落库为 [[artifacts/phuryn-pm-skills-repo]]。See [[content/phuryn-pm-skills]]。
