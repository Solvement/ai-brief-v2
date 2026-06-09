---
content: "leonxlnx-taste-skill"
kind: "evidence-pack"
title: "taste-skill — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Taste-Skill 是一套可插拔的 Agent 技能包，用于教会 AI 写出有设计感的前端界面，像给 AI 配了几本设计风格手册。"
    internal_logic: "项目由一组 Markdown 格式的技能文件（SKILL.md）和一个安装脚本（skill.sh，README 未说明其功能）组成，通过 Vercel 的 `agent-skills` CLI 工具安装。\n\n### 安装与分发机制\n所有技能都存放在 `skills/` 目录下，每个技能一个子文件夹，内含 `SKILL.md`。`npx skills add` 会扫描该目录并安装所有技能，或通过 `--skill` 参数只安装指定的技能。技能文件会被放置到 Agent 可读取的默认技能路径，从而在生成代码时生效。\n\n**实际安装命令示例**（来源：README Installing）：\n```bash\nnpx skills add https://github.com/Leonxlnx/taste-skill\nnpx skills add https://github.com/Leonxlnx/taste-skill --skill \"design-taste-frontend\"\n```\n\n### 核心技能结构\n每个技能各自承担一个职责：\n- 代码生成技能（如 taste-skill、minimalist-skill）直接输出前端代码，并附带设计约束。\n- 图像生成技能（如 imagegen-frontend-web）只产生参考图像，不生成代码，需配合 ChatGPT Images 或类似工具使用。\n\n**taste-skill v2 的新特性**（来源：README Skills 表格）：\n- 读取项目简报（brief），推断设计语言。\n- 提供三个可调拨盘：DESIGN_VARIANCE（布局实验性）、MOTION_INTENSITY（动画深度）、VISUAL_DENSITY（信息密度），每个拨盘 1-10 级。\n- 强制的 em-dash 禁令、GSAP 代码骨架、重新设计审计协议、严格的飞行前检查（pre-flight check）。\n\n### 与 Agent 的交互方式\n技能本身并不运行代理循环，而是作为 Agent 的提示词前缀或附加指令。Agent 加载 `SKILL.md` 后，会在生成代码时遵循其中的设计规则，通过文本约束达到审美提升。\n\n**可调节的设计约束示例**（来源：README Settings）：\n- DESIGN_VARIANCE = 1 → 居中、干净的布局；10 → 不对称、现代的布局。\n- MOTION_INTENSITY = 1 → 仅 hover 动效；10 → 滚动驱动的动态动效。\n- VISUAL_DENSITY = 1 → 宽松、空间感强；10 → 密集仪表盘样式。"
    failure_mode: "如果 Agent 自身的模型升级后不再遵循 SKILL.md 的约束，输出可能会退化，因为技能只是文本指令，没有强制执行机制。"
    source_pointer: "https://github.com/leonxlnx/taste-skill"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/true/MIT/not_found"
experiments: []
claims:
  - "[[claims/leonxlnx-taste-skill-main-claim]]"
artifacts:
  - "[[artifacts/leonxlnx-taste-skill-repo]]"
metrics:
  - "stars=39142"
  - "forks=2780"
  - "open_issues=27"
  - "latest_release=not_found"
  - "pushed_at=2026-05-26T19:31:39Z"
baselines: []
failure_modes:
  - "如果 Agent 自身的模型升级后不再遵循 SKILL.md 的约束，输出可能会退化，因为技能只是文本指令，没有强制执行机制。"
  - "依赖的外部 CLI（`npx skills add`）若停止维护，整个安装流程将不可用，虽然可以手动复制文件，但用户体验受损。"
  - "技能文件可能引用了特定的 JS 库（如 GSAP），但未声明版本依赖，未来库的更新可能导致动效代码失效。"
  - "由于项目主要由个人维护，若作者停更，社区可能面临修复缓慢的风险。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/leonxlnx/taste-skill"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/leonxlnx-taste-skill-main-claim]],官方 artifact 落库为 [[artifacts/leonxlnx-taste-skill-repo]]。See [[content/leonxlnx-taste-skill]]。
