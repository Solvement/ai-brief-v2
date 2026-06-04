---
content: "flowsint"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "flowsint — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目被归类为 agent_framework，因其包含 orchestrator、Celery 任务调度、可插拔工具集（enrichers）、状态持久化和事件流，构成一个多工具协作的调查流水线，符合 agent 框架的核心要素。"
  central_contribution: "提供一个开源、可视化的 OSINT 调查平台，通过模块化的丰富器（enricher）生态系统和实时图谱，降低了数字调查的技术门槛。"
  inspected:
    - "README.md"
    - "top_level_dirs"
    - "package.json / pyproject.toml"
    - "docker-compose.yml"
    - "ETHICS.md"
    - "LICENSE"
    - "Makefile"
    - "CHANGELOG.md"
  top_claims:
    - "开源 OSINT 图谱探索工具，包含多种自动丰富器。"
    - "支持可视化图谱界面，可处理数千节点无卡顿。"
    - "完全自托管，所有数据留存本地，注重隐私。"
    - "模块化结构允许社区贡献新工具和集成。"
  evidence_needed:
    - "性能声明“数千节点无卡顿”需要实际压力测试或基准数据验证。"
    - "enricher 的第三方 API 集成稳定性与错误处理机制需代码审查。"
    - "Celery 任务重试、并发控制等细节未在 README 说明。"
  main_threats:
    - "测试覆盖率低，隐藏缺陷可能在复杂调查中暴露。"
    - "无内置的沙箱隔离，enricher 执行依赖外部服务，可能引入安全风险。"
    - "伦理指南无强制技术限制，滥用风险由使用者自行承担。"
  transfer_decision: "可重用 enricher 的接口设计和模块化编排模式，但完整的后端基础设施（Celery/Neo4j）较重，轻量场景可简化为无状态函数调用。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 3
  reuse_value: 5
  maturity: 5
  main_risk: "项目早期阶段，测试不完整，生产稳定性待验证。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "Flowsint 是一个开源的 OSINT 图谱探索工具，内置数十种自动数据丰富器。"
    plain_english: "用于数字调查的免费工具，能自动查询网站、IP、邮箱等信息并画成关系图。"
    source: "README.md 开头介绍"
    evidence_strength: "high"
    supports: "README 列出了大量域、IP、邮箱等丰富器，并给出模块结构。"
    does_not_support: "未提供丰富器的实现细节或第三方 API 需求列表。"
    threat: "丰富器依赖外部服务，如服务关停或 API 变更，功能将失效。"
  - claim: "前端可流畅渲染数千节点而无卡顿。"
    plain_english: "即使图谱很复杂，界面也不卡。"
    source: "flowsint-app 描述中提及"
    evidence_strength: "low"
    supports: "README 中 flowsint-app 部分写道 'no lag even on thousands of nodes'。"
    does_not_support: "无具体性能测试数据或截图证明。"
    threat: "声明可能基于理想网络和硬件条件，实际体验可能有差异。"
  - claim: "所有数据存于本地，保障隐私。"
    plain_english: "调查数据不会上传到云端，全在自己电脑上。"
    source: "Get started 部分"
    evidence_strength: "high"
    supports: "明确说明 'Everything is stored on your machine'。"
    does_not_support: "丰富器查询仍需向第三方 API 发送请求，查询内容可能暴露。"
    threat: "用户可能误认为完全离线，实际查询请求会出站。"
artifact_audit:
  official_repo: "https://github.com/reconurge/flowsint"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**面向网络安全分析师的开源 OSINT 图谱调查平台，内置丰富的自动化数据丰富器（enrichers），用于探索实体间的关系。**

> 一句话:用美工刀式模块化把零散的 domains、IPs、emails 串成一张真相图。

## 为什么火

- OSINT 工具需求持续增长，Flowsint 提供了开源、可自托管的替代方案，避免商业工具授权限制。
- 可视化图谱降低调查门槛，即使非技术人员也能通过拖拽和连线快速发现实体关联。
- 内置数十种常见的数据丰富器，覆盖 domain、IP、email、加密钱包等，开箱即用。
- 模块化设计允许社区贡献新 enricher 和集成，生态扩展性强。
- 部署简单（Docker + Make），附带详细文档和伦理指南，增强了信任感。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md 内容详细，包含安装、使用、模块说明、贡献指南等。 |
| src (flowsint-*) | available | 顶级目录包含 flowsint-api, flowsint-app, flowsint-core, flowsint-enrichers, flowsint-types 等源模块。 |
| tests | partial | README 说明每个模块有自己的测试套件，但注明 'incomplete'。 |
| license | available | LICENSE 文件，Apache-2.0。 |
| docker-compose.yml | available | 存在 docker-compose.yml 及 docker-compose.dev.yml, docker-compose.prod.yml。 |
| docs | available | 顶级目录存在 docs/。 |
| examples | partial | README 中包含截图和演示视频，但顶级目录无 examples/ 目录。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 架构总览
Flowsint 采用**前后端分离 + 模块化服务**的架构，通过消息队列连接数据流水线。核心模块从上到下分为：

#### 前端（flowsint-app）
- 使用 **TypeScript** 构建，提供现代 UI 和图谱交互。
- 声明可流畅渲染**数千节点**（无卡顿），为大规模调查设计。
- 通过 REST API 与后端通信，并订阅实时事件流。

#### API 层（flowsint-api）
- 基于 **FastAPI** 的 REST 服务，提供认证、用户管理、图谱查询等端点。
- 集成 **Neo4j** 实时事件流，将调查结果推送给前端。
- 仅定义路由和 schema，业务逻辑委托给 core。

#### 核心协调器（flowsint-core）
- **Orchestrator**：调查任务的调度中心，负责接收 API 请求并分配任务给 enricher。
- **Celery tasks**：异步任务执行载体，enricher 的实际执行封装在 Celery worker 中。
- **Vault**：安全管理 API 密钥、凭证等敏感信息。
- **Base classes**：为 enricher 和工具定义统一的基类和接口。

#### 丰富器引擎（flowsint-enrichers）
- **可插拔的工具集合**，每个 enricher 是一个独立的模块，完成特定转换（例如 WHOIS 查询→注册信息）。
- 现有 enricher 分类：
  - 域名：子域名发现、DNS 解析、WHOIS、历史数据等。
  - IP：地理定位、ASN 查询等。
  - 社交媒体：Maigret 用户名搜索。
  - 加密货币：钱包交易、NFT 查询等。
  - 网站：爬虫、链接提取、追踪器识别等。
  - 邮箱/电话/个人/组织等。
- 所有 enricher 共享 flowsint-types 定义的数据模型，保证类型安全。

#### 类型定义层（flowsint-types）
- 使用 **Pydantic** 模型定义所有实体类型（Domain, IP, Email, Wallet 等），确保全栈类型一致。
- 新增数据类型只需在此模块添加模型，自动传递到 enricher、API 和前端。

#### 存储
- **Neo4j**：图数据库，存储实体和关系，支撑图谱可视化。
- **PostgreSQL**：存储用户、认证等关系型数据。

### 调查流程（Agent Loop 类比）
虽然未显式标注为 Agent，Flowsint 的调查流程具备典型 agent 模式：
- **触发**：用户在前端界面添加一个实体（如域名）。
- **任务分发**：API 调用 Orchestrator，Orchestrator 将该实体关联的 enricher 任务提交到 Celery 队列。
- **工具执行**：各 enricher 作为 tools 独立运行，获取外部数据。
- **状态更新**：结果写入 Neo4j 图，并触发事件通知前端。
- **迭代**：前端展示新实体，用户可手动或自动对它们继续 enrichment，形成链式调查。
- **记忆**：全部调查状态持久化在图数据库中，支持回溯和分享。

### 安全边界与伦理约束
- 内置认证，所有数据存储在本地，强调隐私。
- `ETHICS.md` 明确禁止非法使用，声明只用于合法调查。
- 环境变量 `.env.example` 管理第三方 API 密钥，生产部署需自行配置。

### 相似项目比较
未在 README/artifact 中提及具体对比项目。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何构建模块化的数据处理管道，将多个异构工具通过统一接口编排成探索式工作流；理解 OSINT 领域的数据模型和图谱可视化设计。 |
| 迁移到 AI-Brief | 借鉴 enricher 的可插拔模式，为 AI-Brief 的“数据分析链路”设计扩展点，让用户能添加自定义数据源处理模块。 |
| 迁移到 BriefMem | 学习其图数据库的事件流和实时更新前端的方式，用于 BriefMem 的“关系记忆”动态可视化。 |
| 简历故事 | 参与开源 OSINT 平台 Flowsint 的开发，负责集成多种数据丰富器，实现从零散信息到关系图谱的自动化流水线，提升了调查效率和数据关联能力。 |

## 风险

- 项目处于早期开发阶段，测试套件不完整，生产环境稳定性未知。
- 部署依赖 Docker 及多个数据库（Neo4j、PostgreSQL），维护成本较高。
- 伦理限制严格，若未正确配置或使用者无视指南，可能导致法律风险。
- 无内置的 Agentic Planner，大规模调查仍需人工决策，自动化程度有限。

## Memory card

```text
problem_pattern:        调查人员需要快速关联分散的数字资产（域名、IP、邮箱、钱包等）以形成完整画像，但手动查询费时且易遗漏。
architecture_pattern:   分层模块化：前端图谱交互 → API 网关 → 核心任务调度（Celery） → 可插拔工具集（enrichers） → 图数据库持久化。
reusable_pattern:       可插拔 enricher 模式：每个数据转换步骤定义为独立模块，遵循统一的输入/输出类型接口，通过协调器被动调用。
risk_pattern:           依赖大量第三方 API，网络请求易失败或受限；调查逻辑由用户驱动，存在决策偏差。
similar_projects:       未在 README/artifact 说明
```

可复用范式落库:[[concepts/enricher-pattern]]、[[concepts/graph-investigation-loop]]。另见 [[content/flowsint]]、[[claims/flowsint-main-claim]]。
