---
content: "taste-skill"
kind: "evidence-pack"
title: "taste-skill — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "给 AI 编程助手 (Codex/Cursor/Claude Code) 用的前端 UI 品味提升技能包，通过可调参数和多种风格技能防止生成千篇一律的垃圾界面"
    internal_logic: "### agent loop 集成方式\n\n项目本身不是 Agent 框架，而是一组可被 Agent 加载的**技能文件**。集成方式是将 `SKILL.md` 通过 `npx skills add` 安装到 Agent 的配置中，或直接粘贴到对话里。Agent 在处理前端任务时，会读取这些指令并据此调整输出，本质上是在 Agent 的决策循环中插入了额外的约束和规则。没有显式的 agent loop 修改，更多是作为 prompt 增强。\n\n### tool interface\n\n技能作为指令文件，没有定义传统意义上的工具接口（如 API 调用）。它通过声明式规则（例如禁止使用 em-dash、强制使用特定 GSAP 动画骨架）来限制代码生成行为。对于图片生成技能，接口是用户将 SKILL.md 附在对话中，Agent 据此生成设计参考图。\n\n### state / memory\n\n未在 README/artifact 说明。技能文件本身是无状态的，不涉及 Agent 的状态存储或记忆。\n\n### planner\n\n未在 README/artifact 说明。项目不包含任务规划或分解的模块，仅提供风格指导。\n\n### sandbox\n\n未在 README/artifact 说明。生成的代码在 Agent 的外部沙箱中执行，项目本身不提供运行环境隔离。\n\n### 安全边界\n\n技能规则中包含一些硬性禁令（如禁止 em-dash）和风格边界，可视为一种**风格安全边界**，防止 Agent 跌入常见的不良模式。但未涉及代码注入、数据泄露等传统安全议题。\n\n### 核心机制：品味旋钮\n\ntaste-skill v2 引入了三个可调节的 1-10 数值旋钮：**DESIGN_VARIANCE**（布局实验性）、**MOTION_INTENSITY**（动画深度）、**VISUAL_DENSITY**（信息密度）。这些旋钮通过改变提示中强调的权重来影响生成结果，是一种轻量但有效的设计语言参数化方法。\n\n### 多技能组合\n\n项目通过划分多个专用技能实现工作流控制：\n- **代码生成技能**：直接输出代码，如 taste-skill、gpt-taste、soft-skill、minimalist-skill 等。\n- **图片生成技能**：仅生成设计参考图，再交由其他 Agent 编码。\n- **流程技能**：image-to-code-skill 将图片生成、分析和编码组合成一条流水线。\n- **改造技能**：redesign-skill 专门针对现有项目进行 UI 审计和修复。\n这些技能可自由组合，适应不同开发阶段。"
    failure_mode: "deep: agent/workflow evidence, skills/hooks evidence, model/RAG evidence"
    source_pointer: "https://github.com/leonxlnx/taste-skill"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/true/MIT/not_found"
experiments: []
claims:
  - "[[claims/taste-skill-main-claim]]"
artifacts:
  - "[[artifacts/taste-skill-repo]]"
metrics:
  - "stars=32267"
  - "forks=2375"
  - "open_issues=24"
  - "latest_release=not_found"
  - "pushed_at=2026-05-26T19:31:39Z"
baselines: []
failure_modes:
  - "deep: agent/workflow evidence, skills/hooks evidence, model/RAG evidence"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/leonxlnx/taste-skill"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/taste-skill-main-claim]],官方 artifact 落库为 [[artifacts/taste-skill-repo]]。See [[content/taste-skill]]。
