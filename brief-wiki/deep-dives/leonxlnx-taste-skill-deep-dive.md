---
content: "leonxlnx-taste-skill"
kind: "deep-dive"
schema_version: "project-light-spine/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "taste-skill — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "为 AI 编码 Agent 提供可移植的“设计品味”技能文件，防止生成千篇一律、乏味的前端界面。"
  what_it_does: "通过一组 SKILL.md 指令和安装脚本，让 Codex、Cursor、Claude Code 等 AI Agent 按照特定的设计理念（重新设计、极简、野蛮主义等）生成更美观的前端代码，同时提供图像生成技能来制作参考图。"
  metadata:
    language: "Shell"
    total_stars: "39140"
    stars_in_period: "22388"
    author: "Leonxlnx"
  labels:
    - "agent/技能/设计/前端/图像生成"
  pain_point: "AI 编码 Agent（如 Codex、Cursor、Claude Code）默认生成的前端界面往往布局僵硬、版式平庸、动效缺失，导致“千篇一律的低质量界面”（README 称之为“slop”）。开发者需要反复手动调整审美细节，但缺乏一种与框架无关、即插即用的方式来注入设计约束。"
  core_capabilities:
    - "提供多个专门的设计技能变体（如 taste-skill、minimalist-skill、brutalist-skill），覆盖不同设计方向（来源：README Skills 表格）。"
    - "通过 `npx skills add` 一键安装技能文件，支持单独安装特定技能（`--skill` 参数）或全部安装（来源：README Installing 节）。"
    - "包含可调节的三个设计拨盘（DESIGN_VARIANCE、MOTION_INTENSITY、VISUAL_DENSITY），允许在 1-10 之间微调布局实验性、动画深度和信息密度（来源：README Settings 节）。"
  how_to_run:
    install_command: "npx skills add https://github.com/Leonxlnx/taste-skill"
    minimal_example: "npx skills add https://github.com/Leonxlnx/taste-skill --skill \"design-taste-frontend\""
  maturity_signals:
    star_velocity: "平均每周约 7597 星增长（来源：artifactAudit stars_gained_by_window.weekly）"
    recent_commit: "最后推送日期 2026-05-26，近期活跃（来源：artifactAudit pushed_at）"
    releases: "未发现官方 release，无标签发布（来源：artifactAudit latest_release_tag_name: not_found）"
    issue_activity: "27 个开放 issue，但未在 README 中提及 issue 讨论活跃度（来源：artifactAudit open_issues_count）"
  comparison: "数据不足"
  trajectory_note: "出现在 GitHub Trending weekly 和 monthly 双窗口，星数快速增长，首次提交于 2026-02-19，为真·新项目。"
  manual_confirmation: false
  how_it_works_with_analogy: ""
  essential_design_difference: ""
  practitioner_meaning: "严重依赖外部 CLI 和 Agent 行为，缺乏技术保障，一旦生态变化可能迅速失效。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-light-spine/v1"
  one_sentence:
    body_md: ""
  why_worth_attention:
    body_md: ""
  key_claims_evidence:
    body_md: ""
    items: []
  how_it_works:
    body_md: ""
  reusable_abstractions:
    body_md: ""
  dependency_platform_risk:
    body_md: ""
  unknowns_to_confirm:
    body_md: ""
  judgment:
    action: "deep_dive"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 5
      成熟度: 5
    body_md: "严重依赖外部 CLI 和 Agent 行为，缺乏技术保障，一旦生态变化可能迅速失效。"
reasoning_trace:
  paper_type_decision: "项目包含可安装的技能文件，并有 CLI 安装方式，具备 Agent 指令分发的特征，归为 agent_framework 类型，但本质上是静态指令包而非动态代理。"
  central_contribution: "提出一套将设计品味编码为可移植技能的方法，通过参数化和风格分化，对抗 AI 前端输出的同质化。"
  inspected:
    - "README.md"
    - "artifactAudit (文件树, open_issues, stars, pushed_at等)"
    - "examples/ 目录存在性"
    - "skills/ 目录存在性"
  top_claims:
    - "提供 10 种代码生成技能和 3 种图像生成技能（README 表格列出 13 个技能，但 README 未用数量自称，表格逐行列出）。"
    - "可调设计拨盘（1-10）用于微调布局、动效和密度（来源：README Settings）。"
    - "能兼容 Codex、Cursor、Claude Code 等主流 Agent（来源：README 徽章和文本），每周获得超过 7500 星增长。"
  evidence_needed:
    - "SKILL.md 的内容样本，以验证设计约束的具体编写方式。"
    - "实际使用 tasteskill.dev 网站的演示或用户评测。"
    - "agent-skills CLI 的内部机制文档。"
  main_threats:
    - "Agent 模型行为变化可能导致指令遵循度降低。"
    - "分发工具不兼容导致安装失败。"
    - "缺少独立测试验证，技能质量依赖于作者的主观经验。"
  transfer_decision: "可以借鉴其技能组合和拨盘参数化思想，为 AI-Brief 构建前端生成风格控制面板；但需自行实现技能文件的解析和执行，而非依赖 agent-skills CLI。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 5
  maturity: 5
  main_risk: "严重依赖外部 CLI 和 Agent 行为，缺乏技术保障，一旦生态变化可能迅速失效。"
next_actions:
  - "star"
  - "read-docs"
  - "clone-and-run"
unknowns:
  - "skill.sh 的具体功能：README 未说明该脚本的作用，可能用于本地测试或技能验证。"
  - "SKILL.md 的内部格式：未在 README 中说明其 YAML frontmatter 结构、支持的指令关键字等，仅提及存在 `name:` 字段用作安装标识。"
  - "v2 实验版本的具体改动范围：虽然 CHANGELOG.md 有记录，但 README 中只有简要描述，未提供完整的 v2 新指令列表。"
  - "图像生成技能的提示词细节：这些技能产生图像的内部机制（是纯提示词设计还是包含特定模板）未在 README 中说明。"
  - "research/ 目录的内容：README 只提到背景研究，但未说明具体包含哪些文件或结论。"
builder_reuse:
  pattern: "Skill 分发模式：按“技能文件夹 + `npx skills add` CLI”的方式分发可组合的 Agent 指令。"
  copy: "将一组 Markdown 技能文件放入 `skills/` 目录，通过 `npx skills add` 一键安装；技能内包含可调拨盘，利用数字参数微调约束强度。"
  skip: "skill.sh 的作用在 README 中未说明，不建议直接复用；内部 SKILL.md 的具体编写规则（如 frontmatter 字段）未在 README 详细展开，需要查阅 Vercel agent-skills 文档或源码。"
  why_it_matters: "提供了一种轻量级、非侵入式的方式将领域知识注入 Agent，无需修改 Agent 源码，即可改善生成质量，适用于各种需要对 Agent 输出施加风格控制的场景。"
dependency_platform_risk:
  dependency: "依赖于 Vercel 的 agent-skills CLI（`npx skills add`）分发和安装技能文件。"
  what_if_change: "如果 agent-skills CLI 的接口或安装路径规则发生不兼容变更，可能导致 `npx skills add` 命令失效，或技能文件无法被正确加载到 Agent 的技能目录中。"
  exposure: "medium"
  mitigation_or_unknown: "README 未提供离线安装或回退方案，但提及可手动复制 SKILL.md 到项目或粘贴至对话中，可作为临时降级手段（来源：README Installing 最后一句）。"
claim_ledger:
  - claim: "Provides multiple specialized variants, adjustable dials in key skills, anti-repetition rules informed by dedicated research."
    plain_english: "声称提供了多个专门变体、可调拨盘和基于研究的反重复规则。"
    source: "README Common Questions 节"
    attribution: "自报"
    evidence_strength: "medium"
    supports: "表格中列出了 13 个技能，README 描述了拨盘，但未引用具体研究内容。"
    does_not_support: "未展示研究数据或拨盘效果的量化证据。"
    threat: "可能只是宣称，实际技能效果未经第三方验证。"
  - claim: "Framework agnostic across major coding agents."
    plain_english: "声称与框架无关，兼容主要编码代理。"
    source: "README Common Questions 节"
    attribution: "自报"
    evidence_strength: "low"
    supports: "安装方式基于通用的技能文件，不限定前端框架。"
    does_not_support: "未提供在 Vue、Svelte 等框架上的具体验证。"
    threat: "某些框架特定的设计模式可能未覆盖，输出代码可能需要手动调整。"
  - claim: "v2 experimental version includes hard em-dash ban, canonical GSAP code skeletons, redesign-audit protocol, strict pre-flight check."
    plain_english: "v2 版本包含 em-dash 禁用、GSAP 代码骨架、重新设计审计和飞行前检查。"
    source: "README Skills 表格 taste-skill 描述"
    attribution: "自报"
    evidence_strength: "medium"
    supports: "项目包含 CHANGELOG.md 解释变更。"
    does_not_support: "未说明这些规则如何在 SKILL.md 中编码。"
    threat: "如果 Agent 不理解这些指令，可能忽略它们。"
  - claim: "Stars: 39140, forks: 2780."
    plain_english: "星标数 39140，派生 2780。"
    source: "artifactAudit stargazers_count, forks_count"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "表明项目受欢迎程度高。"
    does_not_support: "星标数不代表产品质量或稳定性。"
    threat: "可能出现炒作泡沫，实际效果远低于热度。"
render_warnings:
  - "faithfulness.unknown_assertion line 11 term \"SKILL.md\": 通过一组 SKILL.md 指令和安装脚本，让 Codex、Cursor、Claude Code 等 AI Agent 按照特定的设计理念（重新设计、极简、野蛮主义等）生成更美观的前端代码，同时提供图像生成技能来制作参考图。"
artifact_audit:
  official_repo: "https://github.com/Leonxlnx/taste-skill"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

为 AI 编码 Agent 提供可移植的“设计品味”技能文件，防止生成千篇一律、乏味的前端界面。

（来源：README/artifactAudit）

## 干什么

通过一组 SKILL.md 指令和安装脚本，让 Codex、Cursor、Claude Code 等 AI Agent 按照特定的设计理念（重新设计、极简、野蛮主义等）生成更美观的前端代码，同时提供图像生成技能来制作参考图。

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Shell |
| total_stars | 39140 |
| stars_in_period | 22388 |
| author | Leonxlnx |

## 标签

- agent/技能/设计/前端/图像生成（来源：数据不足）

## 解决什么痛点

AI 编码 Agent（如 Codex、Cursor、Claude Code）默认生成的前端界面往往布局僵硬、版式平庸、动效缺失，导致“千篇一律的低质量界面”（README 称之为“slop”）。开发者需要反复手动调整审美细节，但缺乏一种与框架无关、即插即用的方式来注入设计约束。

（来源：README/artifactAudit）

## 核心能力

- 提供多个专门的设计技能变体（如 taste-skill、minimalist-skill、brutalist-skill），覆盖不同设计方向（来源：README Skills 表格）。
- 通过 `npx skills add` 一键安装技能文件，支持单独安装特定技能（`--skill` 参数）或全部安装（来源：README Installing 节）。
- 包含可调节的三个设计拨盘（DESIGN_VARIANCE、MOTION_INTENSITY、VISUAL_DENSITY），允许在 1-10 之间微调布局实验性、动画深度和信息密度（来源：README Settings 节）。

## 怎么跑起来

- 安装命令：npx skills add https://github.com/Leonxlnx/taste-skill（来源：README/artifactAudit）
- 最小可运行示例：npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| star_velocity | 平均每周约 7597 星增长（来源：artifactAudit stars_gained_by_window.weekly） |
| recent_commit | 最后推送日期 2026-05-26，近期活跃（来源：artifactAudit pushed_at） |
| releases | 未发现官方 release，无标签发布（来源：artifactAudit latest_release_tag_name: not_found） |
| issue_activity | 27 个开放 issue，但未在 README 中提及 issue 讨论活跃度（来源：artifactAudit open_issues_count） |

## 和同类的区别

数据不足

（来源：README/artifactAudit）

## 轨迹备注

出现在 GitHub Trending weekly 和 monthly 双窗口，星数快速增长，首次提交于 2026-02-19，为真·新项目。

（来源：README/artifactAudit）

可复用范式落库:[[concepts/agent-skill-file]]。另见 [[content/leonxlnx-taste-skill]]、[[claims/leonxlnx-taste-skill-main-claim]]。
