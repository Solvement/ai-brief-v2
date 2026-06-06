---
content: "mempalace"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "mempalace — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "本地优先的 AI 记忆系统，逐字存储对话历史，可插拔后端，无 API 调用实现高召回检索。"
  what_it_does: "MemPalace 将对话历史作为逐字文本存储，通过语义搜索检索，提供结构化索引（wings/rooms/drawers）和可插拔后端（默认 ChromaDB），强调本地运行和零 API 调用。"
  metadata:
    language: "Python"
    total_stars: "53701"
    stars_in_period: "228"
    author: "MemPalace"
  labels:
    - "memory"
    - "agent"
    - "infra"
  pain_point: "数据不足"
  core_capabilities:
    - "逐字储存与语义检索：不摘要、不提取、不释义，完整保留原始对话，通过嵌入模型（embeddinggemma-300m 或 all-MiniLM-L6-v2）进行语义搜索（来源：README What it is）"
    - "结构化索引与范围搜索：将人和项目映射为 wings，主题映射为 rooms，原始内容映射为 drawers，支持按结构范围搜索而非扁平语料库检索（来源：README What it is）"
    - "可插拔后端与本地嵌入：默认使用 ChromaDB 作为向量存储，定义抽象接口（`mempalace/backends/base.py`），可替换其他后端，所有数据保存在本地（来源：README What it is，Requirements）"
  how_to_run:
    install_command: "uv tool install mempalace"
    minimal_example: "mempalace init ~/projects/myapp mempalace mine ~/projects/myapp mempalace mine ~/.claude/projects/ --mode convos mempalace search \"why did we switch to GraphQL\" mempalace wake-up"
  maturity_signals:
    star_velocity: "今日获得 228 星（来源：artifactAudit）"
    recent_commit: "最近推送于 2026-06-05（来源：artifactAudit pushed_at）"
    releases: "最新发布 v3.3.5，发布于 2026-05-10（来源：artifactAudit latest_release）"
    issue_activity: "开放 issues 600 个（来源：artifactAudit open_issues_count），活跃讨论"
  comparison: "数据不足"
  trajectory_note: "出现在 GitHub Trending daily 列表，在 2026-06-05 获得 228 星（来源：artifactAudit stars_in_period）"
  manual_confirmation: false
  how_it_works_with_analogy: ""
  essential_design_difference: ""
  practitioner_meaning: ""
  cross_links: []
  prose_body: ""
reasoning_trace:
  paper_type_decision: "project_type=agent_framework，因核心是 AI 记忆系统且深度集成 agent 工具链（MCP、钩子）。"
  central_contribution: "提出 wings/rooms/drawers 三级索引与纯语义检索流水线，在本地零 API 条件下实现 LongMemEval 高召回。"
  inspected:
    - "README.md (全部章节)"
    - "artifactAudit (stars, forks, topics, dirs, key files, release)"
    - "顶部目录结构 (mempalace, benchmarks, tests, docs, etc.)"
    - "package_files: pyproject.toml 存在"
  top_claims:
    - "README 自称“The best-benchmarked open-source AI memory system”"
    - "README 声称 Raw semantic search R@5 96.6% on LongMemEval (500 questions)"
    - "README 声称 Hybrid v4 held-out R@5 98.4% (450 questions)"
    - "README 声称 Hybrid v4 + LLM rerank ≥99% on full 500"
    - "README 声称 29 MCP tools covering reads/writes, knowledge-graph, cross-wing navigation, drawer management, agent diaries"
  evidence_needed:
    - "benchmarks/BENCHMARKS.md 和 results 文件可复现声称分数"
    - "mempalace/backends/base.py 确认可插拔接口存在"
    - "mempalace 目录结构确认 CLI 和 MCP 实现"
    - "tests 目录验证测试覆盖"
  main_threats:
    - "benchmark 结果可能只在特定环境和参数下成立"
    - "MCP 工具完整性和文档质量未知"
    - "wings/rooms/drawers 的创建、管理逻辑未在 README 提及，可能复杂难用"
  transfer_decision: "可复用结构化索引思维和多级检索架构，但需注意后端和钩子适配成本。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "后端依赖 ChromaDB 且无官方备选实现，benchmark 声称结果可能受配置影响。"
next_actions:
  - "clone-and-run"
  - "extract-pattern(结构化记忆索引)"
  - "extract-pattern(多级检索流水线)"
  - "read-docs"
unknowns:
  - "wings/rooms/drawers 的具体数据结构和存储格式未在 README 公开"
  - "如何进行 wings/rooms 的自动发现或手动创建，未详述"
  - "MCP 工具的完整清单未列出（仅总数 29）"
  - "多用户支持能力不明确"
  - "大规模（百万级抽屉）下的性能表现未提及"
  - "与 Gemini CLI、本地模型的具体集成步骤仅提供外部链接，未在 README 详述"
builder_reuse:
  pattern: "分层命名空间记忆系统 + 多级检索流水线"
  copy: "复制 wings/rooms/drawers 三层逻辑索引模型，将实体（人/项目）、主题和内容分开管理；复制纯语义搜索 + 混合提升 + LLM 重排序的多级检索架构；复制可插拔后端接口设计（`mempalace/backends/base.py`）。"
  skip: "具体的 ChromaDB 依赖可替换；自动保存钩子专属 Claude Code，可改造为通用 session hook；知识图谱的时间窗口机制可能需根据场景调整。"
  why_it_matters: "为构建可扩展、隐私友好的 AI 记忆系统提供了现成的架构参考，尤其适合需要本地部署、精确召回的 agent 型应用。"
dependency_platform_risk:
  dependency: "ChromaDB 作为默认向量后端"
  what_if_change: "如果 ChromaDB 弃用或大幅修改 API，需要重新实现 `mempalace/backends/base.py` 接口，但已留出抽象层，影响可控；若社区不提供新后端，用户需自行开发。"
  exposure: "medium"
  mitigation_or_unknown: "接口抽象层降低了迁移成本；README 未提供其它后端的官方实现，但社区可能贡献。"
claim_ledger:
  - claim: "The best-benchmarked open-source AI memory system"
    plain_english: "在开源 AI 记忆系统中，基准测试得分最佳。"
    source: "README description 和 Benchmark 章节"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "LongMemEval、LoCoMo、ConvoMem、MemBench 多项分数展示"
    does_not_support: "未提供与其它系统的直接对比或第三方独立评测"
    threat: "自评最佳缺乏外部验证，可能夸大。"
  - claim: "Raw semantic search achieves 96.6% R@5 on LongMemEval with zero API calls"
    plain_english: "纯语义搜索在 LongMemEval 数据集上达到 96.6% 的前五召回率，完全本地运行，无需 API。"
    source: "README Benchmark 表格（Raw mode）"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "已提供复现命令和结果文件路径"
    does_not_support: "未说明使用何种嵌入模型、具体参数和数据集分割细节"
    threat: "结果可能不可复现或对数据集有适配倾向。"
  - claim: "Pluggable backend via abstract interface in mempalace/backends/base.py"
    plain_english: "通过 mempalace/backends/base.py 定义的抽象接口实现可插拔后端，默认使用 ChromaDB。"
    source: "README What it is"
    attribution: "自称"
    evidence_strength: "high"
    supports: "明确提到了该文件路径和可替换能力"
    does_not_support: "未展示如何植入新后端的示例"
    threat: "若接口设计不完善，实际替换可能困难。"
  - claim: "29 MCP tools cover palace reads/writes, knowledge-graph operations, cross-wing navigation, drawer management, and agent diaries"
    plain_english: "提供 29 个 MCP 工具，覆盖记忆读写、知识图谱、跨翼导航、抽屉管理和代理日记。"
    source: "README MCP server 章节"
    attribution: "自称"
    evidence_strength: "low"
    supports: "只声明了数量和覆盖范围"
    does_not_support: "未列出工具名称或功能详情，无法验证。"
    threat: "工具可能不完整或文档缺失。"
render_warnings:
  - "faithfulness.unknown_assertion line 11 term \"wings/rooms/drawers\": MemPalace 将对话历史作为逐字文本存储，通过语义搜索检索，提供结构化索引（wings/rooms/drawers）和可插拔后端（默认 ChromaDB），强调本地运行和零 API 调用。"
  - "faithfulness.unknown_assertion line 39 term \"drawers\": - 结构化索引与范围搜索：将人和项目映射为 wings，主题映射为 rooms，原始内容映射为 drawers，支持按结构范围搜索而非扁平语料库检索（来源：README What it is）"
artifact_audit:
  official_repo: "https://github.com/MemPalace/mempalace"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
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

本地优先的 AI 记忆系统，逐字存储对话历史，可插拔后端，无 API 调用实现高召回检索。

（来源：README/artifactAudit）

## 干什么

MemPalace 将对话历史作为逐字文本存储，通过语义搜索检索，提供结构化索引（wings/rooms/drawers）和可插拔后端（默认 ChromaDB），强调本地运行和零 API 调用。

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 53701 |
| stars_in_period | 228 |
| author | MemPalace |

## 标签

- memory（来源：数据不足）
- agent（来源：数据不足）
- infra（来源：数据不足）

## 解决什么痛点

数据不足

（来源：README/artifactAudit）

## 核心能力

- 逐字储存与语义检索：不摘要、不提取、不释义，完整保留原始对话，通过嵌入模型（embeddinggemma-300m 或 all-MiniLM-L6-v2）进行语义搜索（来源：README What it is）
- 结构化索引与范围搜索：将人和项目映射为 wings，主题映射为 rooms，原始内容映射为 drawers，支持按结构范围搜索而非扁平语料库检索（来源：README What it is）
- 可插拔后端与本地嵌入：默认使用 ChromaDB 作为向量存储，定义抽象接口（`mempalace/backends/base.py`），可替换其他后端，所有数据保存在本地（来源：README What it is，Requirements）

## 怎么跑起来

- 安装命令：uv tool install mempalace（来源：README/artifactAudit）
- 最小可运行示例：mempalace init ~/projects/myapp mempalace mine ~/projects/myapp mempalace mine ~/.claude/projects/ --mode convos mempalace search "why did we switch to GraphQL" mempalace wake-up（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| star_velocity | 今日获得 228 星（来源：artifactAudit） |
| recent_commit | 最近推送于 2026-06-05（来源：artifactAudit pushed_at） |
| releases | 最新发布 v3.3.5，发布于 2026-05-10（来源：artifactAudit latest_release） |
| issue_activity | 开放 issues 600 个（来源：artifactAudit open_issues_count），活跃讨论 |

## 和同类的区别

数据不足

（来源：README/artifactAudit）

## 轨迹备注

出现在 GitHub Trending daily 列表，在 2026-06-05 获得 228 星（来源：artifactAudit stars_in_period）

可复用范式落库:[[concepts/verbatim-memory]]、[[concepts/structured-memory-index]]。另见 [[content/mempalace]]、[[claims/mempalace-main-claim]]。
