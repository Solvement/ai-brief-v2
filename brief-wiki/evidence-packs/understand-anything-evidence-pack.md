---
content: "understand-anything"
kind: "evidence-pack"
title: "Understand-Anything — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个可接入 Claude Code、Copilot 等 AI 编程助理的代码库知识图谱生成器，让你可视化浏览、搜索和理解任何代码库的结构与业务逻辑。"
    internal_logic: "这是一个以插件形式嵌入 AI 编程助理的多智能体系统，核心流程如下：\n\n### 多智能体流水线与知识图谱构建\n- **命令入口**：用户在 AI 编程环境（如 Claude Code）中输入 `/understand`，触发插件主命令（来源：README Quick Start）。\n- **智能体编排**：调度器启动 5 个专职智能体（project-scanner, file-analyzer, architecture-analyzer, tour-builder, graph-reviewer），分析业务域时再增加 domain-analyzer 或 article-analyzer（来源：README Multi-Agent Pipeline 表格）。\n- **并行扫描**：project-scanner 发现文件并检测语言/框架，随后 file-analyzer 并发运行（最多 5 个并行，每批 20-30 个文件），提取函数、类、导入关系，构建图谱节点和边（来源：README Multi-Agent Pipeline）。\n- **混合分析**：file-analyzer 调用 Tree-sitter 进行确定性语法解析，得到 import/export、函数定义、调用点等；同时将解析后的 AST 与源码一起传给 LLM，生成自然语言摘要、标签、架构层分配等语义信息。Tree-sitter 输出保证结构可复现，LLM 负责理解“有什么用”（来源：README Tree-sitter + LLM hybrid）。\n- **架构与导览**：architecture-analyzer 将节点归入 API、Service、Data、UI、Utility 等层；tour-builder 按依赖顺序生成导览路径；graph-reviewer 检查完整性（可开启全面审查模式）（来源：README Multi-Agent Pipeline）。\n- **输出**：最终产物为 `.understand-anything/knowledge-graph.json`，是一个包含节点和边的 JSON 文件，可供仪表盘渲染或团队提交到 Git（来源：README Share the Graph）。\n\n### 工具接口与状态/记忆\n- **插件钩子**：项目通过 `.claude-plugin`, `.copilot-plugin`, `.cursor-plugin` 等目录定义各平台的插件元数据，实现跨平台适配（来源：artifact 目录结构）。\n- **状态持久化**：分析结果（知识图谱 JSON）、用户语言偏好（`.understand-anything/config.json`）和增量指纹都存储在项目本地 `.understand-anything/` 目录，支持增量更新（来源：README Quick Start 和 Under the Hood）。\n- **差异化更新**：`/understand-diff` 利用图谱和当前工作区变更计算影响范围；`/understand --auto-update` 在 post-commit hook 中自动增量修补图谱（来源：README Features 和 Quick Start）。\n\n### 安全边界\nREADME 未说明沙箱机制或代码安全审查策略，仅提到可用 `--review` 触发 graph-reviewer 的 LLM 审查。项目本身作为本地分析工具，不涉及远程代码执行，但其 LLM 调用可能将部分代码发送至模型服务商，需要使用者注意数据隐私。\n\n### 规划器\n未见显式规划器组件；分析流程是固定编排的，但各智能体之间通过图谱状态接力，形成数据驱动的流水线。"
    failure_mode: "LLM 生成的语义描述可能出现不准确或幻觉，若不经人工审查直接用于决策，可能误导开发者（来源：README 声称 LLM 负责语义，但 graph-reviewer 仅在开启时进行全面审查，默认仅内联检查）。"
    source_pointer: "https://github.com/lum1104/understand-anything"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v2.7.3"
experiments: []
claims:
  - "[[claims/understand-anything-main-claim]]"
artifacts:
  - "[[artifacts/understand-anything-repo]]"
metrics:
  - "stars=52691"
  - "forks=4319"
  - "open_issues=162"
  - "latest_release=v2.7.3"
  - "pushed_at=2026-06-04T05:46:14Z"
baselines: []
failure_modes:
  - "LLM 生成的语义描述可能出现不准确或幻觉，若不经人工审查直接用于决策，可能误导开发者（来源：README 声称 LLM 负责语义，但 graph-reviewer 仅在开启时进行全面审查，默认仅内联检查）。"
  - "依赖多个外部 AI 编程平台，每个平台的插件接口变更都可能导致功能中断，维护负担重。"
  - "知识图谱 JSON 若包含敏感代码摘要，提交到公开仓库可能泄露知识产权，README 仅建议保护 intermediate 目录，未特别提醒图谱中的语义描述可能泄露敏感信息。"
  - "增量更新依赖文件指纹，若文件因格式化、换行等非语义变化被标记为已更改，会导致不必要的 LLM 重新分析，消耗成本。"
missing_details: []
source_pointers:
  - "https://github.com/lum1104/understand-anything"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/understand-anything-main-claim]],官方 artifact 落库为 [[artifacts/understand-anything-repo]]。See [[content/understand-anything]]。
