---
content: "vimax"
kind: "evidence-pack"
title: "ViMax — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个把想法、小说或剧本端到端拍成长视频的多智能体框架。"
    internal_logic: "### 整体流水线\n\n根据 README 架构图，ViMax 采用多智能体流水线，输入层接收想法、脚本、小说、自然语言提示、参考图像等，然后依次经过**剧本生成**（利用 RAG 引擎将长故事分段并保留关键情节和对话）、**分镜设计**（基于用户需求和目标受众，以电影化语言生成有表现力的分镜）、**参考图像选择**（从前一时间线的分镜中智能挑选当前镜头的首帧参考图）、**图像生成**（根据参考图和空间逻辑自动生成图像生成器提示词）、**一致性检查**（并行生成多张图片，通过 MLLM/VLM 选出最佳一致帧），最后进行并行镜头生成（同一机位顺序镜头并行处理）。（来源：README Architecture 部分）\n\n### Agent Loop 推测\n\nREADME 未详细描述 Agent 主循环，且“Coming Soon”列表中包含 `Agents Loop☑️`，表明当前版本可能尚未实现完整 Agent 循环或未公开该部分实现。\n\n### 工具与外部模型\n\n- 剧本生成环节使用 **RAG 引擎** 进行长文本分段。\n- 一致性检查使用 **MLLM/VLM**（多模态大模型/视觉语言模型）评估图像一致性。\n- 近期配置支持 **Google AI Studio API**（来源：README Coming Soon 已完成项），具体模型名称未说明。\n- 图像和视频生成的具体模型未在 README 中披露。\n\n### 状态与记忆\n\n系统通过“前一时间线的分镜”作为参考来维持角色和环境一致性，每生成一个镜头时会根据已生成的帧来调整新帧的提示词和空间位置。但 README 未说明状态存储格式（如结构化的故事板状态对象）或跨镜头记忆机制的具体技术方案。\n\n### 安全与沙箱\n\nREADME 未涉及安全边界、内容审核或沙箱策略。"
    failure_mode: "强依赖第三方 API（Google AI Studio 等），成本与可用性受制于人。"
    source_pointer: "https://github.com/hkuds/vimax"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/false/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/vimax-main-claim]]"
artifacts:
  - "[[artifacts/vimax-repo]]"
metrics:
  - "stars=8718"
  - "forks=1330"
  - "open_issues=33"
  - "latest_release=not_found"
  - "pushed_at=2026-06-01T16:39:16Z"
baselines: []
failure_modes:
  - "强依赖第三方 API（Google AI Studio 等），成本与可用性受制于人。"
  - "长视频角色一致性仅靠参考图像启发式方法，无量化保证，可能在高要求场景下失效。"
  - "缺乏技术报告或学术论文支撑，核心贡献难以验证。"
  - "社区生态尚弱，文档不全，上手门槛高。"
  - "自称 Movie-Grade Quality 但无第三方评测或用户广泛验证。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
  - "homepage: not_found"
source_pointers:
  - "https://github.com/hkuds/vimax"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/vimax-main-claim]],官方 artifact 落库为 [[artifacts/vimax-repo]]。See [[content/vimax]]。
