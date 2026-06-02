---
content: "ai-scientist-v2"
kind: "evidence-pack"
title: "AI-Scientist-v2 — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "全自主科研智能体系统，通过最优优先树搜索逐步探索假设空间，自动运行实验并生成科学论文，已产出被同行评审接受的 workshop 论文。"
    internal_logic: "### 系统概览\nAI Scientist-v2 是一个端到端的自主科研 agent 框架，包含 **ideation（想法生成）**、**experimentation（实验探索）**、**writeup（论文撰写）**与 **review（自我评审）**四个阶段。整体由 **agentic best-first tree search (BFTS)** 驱动，一个 **experiment manager agent** 决定搜索方向。\n\n### Agent Loop（树搜索循环）\n核心循环是 **最优优先树搜索**：\n- **初始化**：根据 JSON 格式的研究想法创建根节点。\n- **选择**：实验管理器 agent 评估当前所有叶子节点，选择最有希望的节点进行扩展（best-first）。\n- **扩展**：对选中节点生成代码变体并运行实验，产出新节点。\n- **停止**：达到 `steps` 上限或探索预算耗尽后停止。\n- **并行**：通过 `num_workers` 参数控制并发探索路径，每个路径独立执行。\n\n### Tool Interface（工具接口）\nagent 通过以下工具与环境交互：\n- **代码执行工具**：在本地 GPU 环境中运行由 LLM 生成的 Python 实验代码。\n- **文献搜索工具**：通过 Semantic Scholar API 进行新颖性检查和引用收集，依赖 `S2_API_KEY`。\n- **模型 API 调用**：支持 OpenAI、Gemini、Claude (via Bedrock) 等模型，作为 LLM 后端。\n- **文件系统**：实验日志、模型权重、图表输出均通过文件系统管理。\n\n### State / Memory（状态与记忆）\n- **搜索树**：所有实验节点组成一棵树，每个节点包含实验代码、运行结果、评分等。树的状态持久化于实验日志目录。\n- **上下文窗口**：LLM 调用时会将当前节点的历史路径与结果注入 prompt，形成短期记忆。\n- **外部知识**：通过 Semantic Scholar 检索到的文献被写入论文草稿，属于外部记忆。\n\n### Planner（规划器）\n- **Ideation Agent**：根据用户提供的主题描述 Markdown，通过反复生成与反思（reflection）产生结构化研究想法列表。\n- **Experiment Manager**：在树搜索中扮演 planner + critic 角色，决定扩展哪个节点、如何修改代码、何时停止并进入写稿阶段。\n\n### Sandbox（沙盒）\nREADME 明确警告：“This codebase will execute LLM-written code”，推荐在 **Docker 容器** 等受控环境中运行。系统本身未内建沙盒机制，依赖外部隔离。\n\n### 安全边界\n- **代码执行风险**：LLM 可能生成危险代码（如删除文件、访问网络），README 强调用户自行承担风险。\n- **模型调用成本**：API 调用累积费用，需监控。\n- **内容责任**：生成的论文可能包含不实信息，许可证要求强制披露 AI 参与。"
    failure_mode: "执行不可信 LLM 代码可能导致环境受损或数据泄露，必须严格沙箱化。"
    source_pointer: "https://github.com/sakanaai/ai-scientist-v2"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/NOASSERTION/not_found"
experiments: []
claims:
  - "[[claims/ai-scientist-v2-main-claim]]"
artifacts:
  - "[[artifacts/ai-scientist-v2-repo]]"
metrics:
  - "stars=6433"
  - "forks=869"
  - "open_issues=69"
  - "latest_release=not_found"
  - "pushed_at=2025-12-19T07:46:32Z"
baselines: []
failure_modes:
  - "执行不可信 LLM 代码可能导致环境受损或数据泄露，必须严格沙箱化。"
  - "实验成功率依赖底层模型能力，Claude 3.5 Sonnet 成功率较高，其他模型可能失败率高。"
  - "成本不低：一次完整运行约 $20-25（实验+写作），规模应用费用可观。"
  - "论文质量难以保证，可能产生看似合理但错误的结论，需人工审查。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
  - "homepage: not_found"
source_pointers:
  - "https://github.com/sakanaai/ai-scientist-v2"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ai-scientist-v2-main-claim]],官方 artifact 落库为 [[artifacts/ai-scientist-v2-repo]]。See [[content/ai-scientist-v2]]。
