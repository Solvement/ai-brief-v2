---
content: "flowsint"
kind: "evidence-pack"
title: "flowsint — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "面向网络安全分析师的开源 OSINT 图谱调查平台，内置丰富的自动化数据丰富器（enrichers），用于探索实体间的关系。"
    internal_logic: "### 架构总览\nFlowsint 采用**前后端分离 + 模块化服务**的架构，通过消息队列连接数据流水线。核心模块从上到下分为：\n\n#### 前端（flowsint-app）\n- 使用 **TypeScript** 构建，提供现代 UI 和图谱交互。\n- 声明可流畅渲染**数千节点**（无卡顿），为大规模调查设计。\n- 通过 REST API 与后端通信，并订阅实时事件流。\n\n#### API 层（flowsint-api）\n- 基于 **FastAPI** 的 REST 服务，提供认证、用户管理、图谱查询等端点。\n- 集成 **Neo4j** 实时事件流，将调查结果推送给前端。\n- 仅定义路由和 schema，业务逻辑委托给 core。\n\n#### 核心协调器（flowsint-core）\n- **Orchestrator**：调查任务的调度中心，负责接收 API 请求并分配任务给 enricher。\n- **Celery tasks**：异步任务执行载体，enricher 的实际执行封装在 Celery worker 中。\n- **Vault**：安全管理 API 密钥、凭证等敏感信息。\n- **Base classes**：为 enricher 和工具定义统一的基类和接口。\n\n#### 丰富器引擎（flowsint-enrichers）\n- **可插拔的工具集合**，每个 enricher 是一个独立的模块，完成特定转换（例如 WHOIS 查询→注册信息）。\n- 现有 enricher 分类：\n  - 域名：子域名发现、DNS 解析、WHOIS、历史数据等。\n  - IP：地理定位、ASN 查询等。\n  - 社交媒体：Maigret 用户名搜索。\n  - 加密货币：钱包交易、NFT 查询等。\n  - 网站：爬虫、链接提取、追踪器识别等。\n  - 邮箱/电话/个人/组织等。\n- 所有 enricher 共享 flowsint-types 定义的数据模型，保证类型安全。\n\n#### 类型定义层（flowsint-types）\n- 使用 **Pydantic** 模型定义所有实体类型（Domain, IP, Email, Wallet 等），确保全栈类型一致。\n- 新增数据类型只需在此模块添加模型，自动传递到 enricher、API 和前端。\n\n#### 存储\n- **Neo4j**：图数据库，存储实体和关系，支撑图谱可视化。\n- **PostgreSQL**：存储用户、认证等关系型数据。\n\n### 调查流程（Agent Loop 类比）\n虽然未显式标注为 Agent，Flowsint 的调查流程具备典型 agent 模式：\n- **触发**：用户在前端界面添加一个实体（如域名）。\n- **任务分发**：API 调用 Orchestrator，Orchestrator 将该实体关联的 enricher 任务提交到 Celery 队列。\n- **工具执行**：各 enricher 作为 tools 独立运行，获取外部数据。\n- **状态更新**：结果写入 Neo4j 图，并触发事件通知前端。\n- **迭代**：前端展示新实体，用户可手动或自动对它们继续 enrichment，形成链式调查。\n- **记忆**：全部调查状态持久化在图数据库中，支持回溯和分享。\n\n### 安全边界与伦理约束\n- 内置认证，所有数据存储在本地，强调隐私。\n- `ETHICS.md` 明确禁止非法使用，声明只用于合法调查。\n- 环境变量 `.env.example` 管理第三方 API 密钥，生产部署需自行配置。\n\n### 相似项目比较\n未在 README/artifact 中提及具体对比项目。"
    failure_mode: "项目处于早期开发阶段，测试套件不完整，生产环境稳定性未知。"
    source_pointer: "https://github.com/reconurge/flowsint"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/Apache-2.0/v1.2.9"
experiments: []
claims:
  - "[[claims/flowsint-main-claim]]"
artifacts:
  - "[[artifacts/flowsint-repo]]"
metrics:
  - "stars=4812"
  - "forks=605"
  - "open_issues=43"
  - "latest_release=v1.2.9"
  - "pushed_at=2026-06-03T11:42:18Z"
baselines: []
failure_modes:
  - "项目处于早期开发阶段，测试套件不完整，生产环境稳定性未知。"
  - "部署依赖 Docker 及多个数据库（Neo4j、PostgreSQL），维护成本较高。"
  - "伦理限制严格，若未正确配置或使用者无视指南，可能导致法律风险。"
  - "无内置的 Agentic Planner，大规模调查仍需人工决策，自动化程度有限。"
missing_details: []
source_pointers:
  - "https://github.com/reconurge/flowsint"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/flowsint-main-claim]],官方 artifact 落库为 [[artifacts/flowsint-repo]]。See [[content/flowsint]]。
