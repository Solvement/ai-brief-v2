---
content: "mempalace"
kind: "evidence-pack"
title: "mempalace — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "本地优先的 AI 记忆系统，逐字存储对话历史，可插拔后端，无 API 调用实现高召回检索。"
    internal_logic: "### 核心记忆模型：Wings、Rooms、Drawers\n\nMemPalace 将对话历史映射为一个类似宫殿的结构（来源：README What it is）：\n- **Wings（翼）**：代表人或项目，如“Alice”、“project-alpha”。\n- **Rooms（房间）**：代表主题，如“前端框架选择”、“数据库迁移”。\n- **Drawers（抽屉）**：存放原始对话文本，每个抽屉保存一段逐字内容。\n\n搜索时可直接限定在特定 wing 或 room，避免扁平语料库的低效全文扫描（来源：README What it is）。具体的数据结构未在 README 公开，但 CLI 和 Python API 提供了创建、查询这些实体的功能。\n\n### 检索流程：从嵌入到语义搜索\n\n1. **嵌入生成**：使用本地嵌入模型，用户可在首次启动时通过 `python -m mempalace.onboarding` 选择 `embeddinggemma-300m`（多语言，~300 MB）或 `all-MiniLM-L6-v2`（仅英文，~30 MB）。模型会在本地运行，不调用外部 API（来源：README Requirements）。\n2. **向量存储**：生成的向量存入默认后端 ChromaDB。后端接口定义在 `mempalace/backends/base.py`，可替换为其它向量库（来源：README What it is）。\n3. **原始语义搜索**：纯基于余弦相似度的语义搜索，无需任何启发式规则或 LLM，在 LongMemEval 500 问题集上达到 R@5 96.6%（来源：README Benchmarks）。\n4. **混合检索（hybrid）**：在语义搜索基础上加入关键词提升、时间邻近度提升、偏好模式抽取，R@5 可提升至 98.4%（held-out 450q）（来源：README Benchmarks）。\n5. **LLM 重排序**：从 top-20 候选中用任意 LLM（如 Claude Haiku、Sonnet、minimax-m2.7）选出最佳答案，可将指标推至 ≥99%，但 README 强调不宣传 100% 以避免过拟合嫌疑（来源：README Benchmarks）。\n\n### 工具与集成：CLI、MCP、Agent\n\n- **CLI**：提供 `mine`（导入内容）、`search`（检索）、`wake-up`（加载上下文）等命令（来源：README Quickstart）。\n- **MCP 服务器**：对外暴露 29 个 MCP 工具，覆盖记忆读写、知识图谱操作、跨 wing 导航、抽屉管理和 agent 日记等（来源：README MCP server）。\n- **Agent 支持**：每个专家 agent 在 palace 中获得专属 wing 和 diary，可通过 `mempalace_list_agents` 运行时发现，避免系统提示词膨胀（来源：README Agents）。\n- **自动保存**：为 Claude Code 提供两个钩子，定期保存对话和上下文压缩前保存，防止会话丢失（来源：README Auto-save hooks）。\n\n### 数据持久化与状态管理\n\n记忆库以本地文件形式持久化，嵌入模型和 ChromaDB 数据都留在用户设备。导入操作（`mine`）支持项目文件和 Claude Code 对话转录，可通过 `--wing` 参数指定所属 wing。此外，`sweep` 命令能将转录逐条消息拆分存储，保证幂等和可断点续传（来源：README Auto-save hooks）。\n\n### 知识图谱\n\n内建一个时间感知的实体关系图，支持添加、查询、失效和时间线操作，采用 SQLite 存储（来源：README Knowledge graph）。该图可用于记录事实（如“user X worked on project Y from date1 to date2”），并与记忆检索配合使用。\n\n### 安全与可插拔性\n\n- 数据本地化，绝不外传，除非用户明确配置（来源：README What it is）。\n- 后端可插拔：抽象基类 `mempalace/backends/base.py` 定义了向量存储接口，允许替换为 FAISS、Qdrant 等。但当前仅提供 ChromaDB 作为默认实现。\n- 依赖项仅 Python 3.9+、ChromaDB 和嵌入模型，无需额外 API 密钥（基本检索场景）（来源：README Requirements）。"
    failure_mode: "默认依赖 ChromaDB，若其停止维护，需社区接手支持新后端；当前抽象层虽存在，但无官方备选方案。"
    source_pointer: "https://github.com/mempalace/mempalace"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v3.3.5"
experiments: []
claims:
  - "[[claims/mempalace-main-claim]]"
artifacts:
  - "[[artifacts/mempalace-repo]]"
metrics:
  - "stars=53701"
  - "forks=7068"
  - "open_issues=600"
  - "latest_release=v3.3.5"
  - "pushed_at=2026-06-05T07:54:12Z"
baselines: []
failure_modes:
  - "默认依赖 ChromaDB，若其停止维护，需社区接手支持新后端；当前抽象层虽存在，但无官方备选方案。"
  - "嵌入模型的选择影响检索质量和资源占用，但用户可能缺乏调优经验。"
  - "README 自评的 benchmark 结果仅限当前模型和数据集，不能保证其他场景同样优秀。"
  - "自动保存钩子目前专属 Claude Code，如切换到其他 IDE 或 agent 框架需重新适配。"
missing_details: []
source_pointers:
  - "https://github.com/mempalace/mempalace"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/mempalace-main-claim]],官方 artifact 落库为 [[artifacts/mempalace-repo]]。See [[content/mempalace]]。
