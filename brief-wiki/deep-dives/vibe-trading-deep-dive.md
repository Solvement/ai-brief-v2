---
content: "vibe-trading"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "Vibe-Trading — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "面向个人开发者的 AI 交易代理框架，一条命令让 LLM 智能体接管市场研究、策略回测与多券商安全交易（来源：README 标题与定位语）"
  what_it_does: "提供 CLI / Web / MCP 多入口，通过 LLM 驱动的智能体进行多市场数据获取、回测、研究目标跟踪，并在严格的 mandate 安全护栏下对接 Robinhood、IBKR 等券商实现 paper/live 交易（来源：README Features 与 News）"
  metadata:
    language: "Python"
    total_stars: "10060"
    stars_in_period: "197"
    author: "HKUDS"
  labels:
    - "agent"
    - "infra"
    - "数据"
    - "工具"
  pain_point: "过去做量化交易需要手动拼接数据源、回测框架、券商接口，且没有统一的 AI 代理来生成并执行策略，风险控制靠人工缝补。Vibe-Trading 声称一条命令即可让 LLM 代理端到端完成从研究到交易闭环，内置 mandate 限仓、paper/live 隔离、审计日志等安全机制（来源：README Key Features 与 Robinhood Agentic Trading 描述）"
  core_capabilities:
    - "统一的研究-回测-交易代理循环：LLM 代理可调用 36+ MCP 工具进行多资产数据获取、信号生成、回测，并生成报告（来源：README News v0.1.9 称 36 MCP tools）"
    - "多券商连接器与 mandate 安全模型：支持 Robinhood、IBKR、Binance 等 7+ broker，所有 live 订单必须通过用户预先定义 symbol universe、size、exposure、leverage、daily cap 的 mandate，并有文件系统即时 kill switch（来源：README 2026-06-02 六新 broker connectors 描述）"
    - "研究目标生命周期管理：代理可创建、跟踪、编辑、完成研究目标，持久化 claims、evidence、预算与完成策略，支持跨 CLI/Web/MCP 的协作（来源：README Research Goal runtime 与 lifecycle closure 条目）"
  how_to_run:
    install_command: "pip install vibe-trading-ai"
    minimal_example: "vibe-trading chat --model openai/gpt-4o"
  maturity_signals:
    star_velocity: "日均约 197 stars (2026-06-04)，两月内累计破万 stars"
    recent_commit: "多次提交至 2026-06-04，更新频繁"
    releases: "最新版本 v0.1.9 (2026-06-01)，迭代迅速"
    issue_activity: "open issues 仅 7 个，但 issue/PR 编号高（#170），社区活跃"
  comparison: "数据不足"
  trajectory_note: "该项目于 2026-04-01 创建，两个月内登上 GitHub 每日趋势并获超万星，更新日志显示从基础代理到多 broker、安全模型、Swarm 等快速进化，属于高增长新项目（来源：仓库创建日期与 stars 增长）"
  manual_confirmation: false
  how_it_works_with_analogy: ""
  essential_design_difference: ""
  practitioner_meaning: ""
  cross_links: []
  prose_body: ""
reasoning_trace:
  paper_type_decision: "agent_framework 因为核心是 LLM 驱动的多工具代理，含回测、交易执行等工具，具备 agent loop、tool interface、state/memory、planner、sandbox 等典型特征。"
  central_contribution: "将 LLM 代理融入端到端量化交易流程，并以 mandate + 多道防线实现了有界自主交易的安全框架。"
  inspected:
    - "README last full version (including all news entries up to 2026-06-03)"
    - "repo top-level entries (dirs and key files)"
    - "topics list (+ MCP, multi-agent)"
    - "license file"
    - "package_file pyproject.toml"
    - "Dockerfile and docker-compose"
  top_claims:
    - "README 声称暴露 36 MCP tools (v0.1.9)"
    - "README 声称支持 Robinhood, IBKR, Binance 等 7+ broker connectors"
    - "README 声称拥有 mandate-gated, fail-closed order placement with filesystem kill switch 的安全模型"
    - "README 声称 Research Goal lifecycle 管理、Hypothesis Registry 等功能"
    - "README 声称 agent loop 有 wrap-up nudge 与工具定义移除机制防止死循环"
  evidence_needed:
    - "需要查看 tests 目录确认回归覆盖，README 虽提及但未列出具体测试文件"
    - "需要检查 agent/tools 下 MCP 工具的实际实现文件与 tool 计数"
    - "需要分析 mandate 检查的实际代码路径以验证声称的安全强度"
    - "需要查看 connector 实现以确认 paper/live 隔离的代码质量"
  main_threats:
    - "安全声明的实现可能存在逻辑漏洞，绕过 mandate 或 kill switch"
    - "LLM 工具调用链的可靠性未经大规模检验"
    - "依赖的第三方 API 可能随时变更"
    - "目前没有正式的安全审计报告"
  transfer_decision: "可复用 mandate 安全模型和 MCP 工具集成模式，但不复用特定的金融数据处理和券商 API 细节。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "作为新项目，安全关键代码可能包含未发现的漏洞，且依赖的 LLM 与外部 API 增加了不稳定面。"
next_actions:
  - "clone-and-run"
  - "write-deepdive"
  - "extract-pattern(mandate-gated-agent-safety)"
unknowns:
  - "未在 README 中提供完整的测试覆盖情况，尽管新闻提到有回归测试"
  - "未说明最小硬件要求与 LLM 调用成本估算"
  - "内部信号引擎的具体实现和模型细节未在 README 中公开"
  - "mandate 限价在极端市场波动下的有效性未量化"
  - "Swarm 的跨节点通信安全细节未说明"
  - "前端代码细节及是否支持移动端未提"
builder_reuse:
  pattern: "Mandate-gated tool execution with layered safety kills (filesystem kill switch + pre-trade gate + audit ledger)"
  copy: "mandate 的定义与校验逻辑：将允许的操作范围（符号、金额、杠杆等）结构化声明，代理每次调用危险工具时都进行预检查；文件系统 kill switch 是指定文件存在即阻止所有操作的简单而可靠的停用机制；审计账本记录所有决策。"
  skip: "具体的券商 API 连接细节为业务相关，不可直接复用；Swarm DAG 调度相对特化；LLM 的信号生成验证逻辑较耦合项目。"
  why_it_matters: "为任何需要让 LLM 代理执行高风险操作（财务、医疗、物理设备）的系统提供了一套可复用的安全层模板：结构化授权、多道拦截、可审计性。"
dependency_platform_risk:
  dependency: "第三方券商 API（Robinhood, IBKR, Binance 等）及 LLM 服务提供商（OpenAI, Gemini 等）"
  what_if_change: "若券商 API 更改鉴权方式、端点结构、或 paper/live 判别逻辑，则相应 connector 失效，可能导致交易失败或错误路由。若 LLM 供应商调整模型输出格式或限制工具调用，代理的规划与执行可能中断。"
  exposure: "medium"
  mitigation_or_unknown: "项目通过 connector 抽象隔离 API 变化，并支持多种 LLM 提供商。但未在 README 中明确声明对 API 变更的持续兼容策略或 fallback 机制。"
claim_ledger:
  - claim: "v0.1.9 版本已有 36 MCP tools"
    plain_english: "最新版暴露了 36 个 MCP 工具供代理使用"
    source: "README News 2026-06-01 v0.1.9 描述中明确写道 “36 MCP tools now”"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "确实有 36 个 MCP 工具可调用"
    does_not_support: "工具的具体功能列表和实现细节未知"
    threat: "数字可能包含实验性或内部工具，实际可用数量可能不同；代码可能未与声明严格对齐"
  - claim: "支持基于 mandate 的有界自主交易"
    plain_english: "代理的交易能力受到用户预先定义的限制，并有 kill switch 等安全措施"
    source: "README 2026-05-29 Robinhood Agentic Trading 和 2026-06-02 broker connectors 描述"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 详细描述了 mandate 参数、kill switch、审计账本等"
    does_not_support: "未提供 mandat 检查的实际代码片段或正式验证"
    threat: "实现可能有 bug 导致限制不生效，或配置界面容易出错"
  - claim: "支持 7 个 broker connectors，部分支持 live 交易"
    plain_english: "可连接 Robinhood, IBKR, Binance 等多家券商进行 paper 或 live 交易"
    source: "README 2026-06-02 六新 broker connectors 列表及早期 IBKR/Robinhood 描述"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "列出了 Tiger, Longbridge, Alpaca, OKX, Binance, Futu 六个新加 IBKR 和 Robinhood 共 8 个，但 README 未给出总数，新闻描述 7+"
    does_not_support: "某些 connector 仅支持 paper 或只读，Longbridge 无 live 判别"
    threat: "第三方 API 可能变化，连接器可能失效；部分连接标记为 experimental"
artifact_audit:
  official_repo: "https://github.com/HKUDS/Vibe-Trading"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

面向个人开发者的 AI 交易代理框架，一条命令让 LLM 智能体接管市场研究、策略回测与多券商安全交易（来源：README 标题与定位语）

## 干什么

提供 CLI / Web / MCP 多入口，通过 LLM 驱动的智能体进行多市场数据获取、回测、研究目标跟踪，并在严格的 mandate 安全护栏下对接 Robinhood、IBKR 等券商实现 paper/live 交易（来源：README Features 与 News）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 10060 |
| stars_in_period | 197 |
| author | HKUDS |

## 标签

- agent（来源：数据不足）
- infra（来源：数据不足）
- 数据（来源：数据不足）
- 工具（来源：数据不足）

## 解决什么痛点

过去做量化交易需要手动拼接数据源、回测框架、券商接口，且没有统一的 AI 代理来生成并执行策略，风险控制靠人工缝补。Vibe-Trading 声称一条命令即可让 LLM 代理端到端完成从研究到交易闭环，内置 mandate 限仓、paper/live 隔离、审计日志等安全机制（来源：README Key Features 与 Robinhood Agentic Trading 描述）

## 核心能力

- 统一的研究-回测-交易代理循环：LLM 代理可调用 36+ MCP 工具进行多资产数据获取、信号生成、回测，并生成报告（来源：README News v0.1.9 称 36 MCP tools）
- 多券商连接器与 mandate 安全模型：支持 Robinhood、IBKR、Binance 等 7+ broker，所有 live 订单必须通过用户预先定义 symbol universe、size、exposure、leverage、daily cap 的 mandate，并有文件系统即时 kill switch（来源：README 2026-06-02 六新 broker connectors 描述）
- 研究目标生命周期管理：代理可创建、跟踪、编辑、完成研究目标，持久化 claims、evidence、预算与完成策略，支持跨 CLI/Web/MCP 的协作（来源：README Research Goal runtime 与 lifecycle closure 条目）

## 怎么跑起来

- 安装命令：pip install vibe-trading-ai（来源：README/artifactAudit）
- 最小可运行示例：vibe-trading chat --model openai/gpt-4o（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| star_velocity | 日均约 197 stars (2026-06-04)，两月内累计破万 stars |
| recent_commit | 多次提交至 2026-06-04，更新频繁 |
| releases | 最新版本 v0.1.9 (2026-06-01)，迭代迅速 |
| issue_activity | open issues 仅 7 个，但 issue/PR 编号高（#170），社区活跃 |

## 和同类的区别

数据不足

（来源：README/artifactAudit）

## 轨迹备注

该项目于 2026-04-01 创建，两个月内登上 GitHub 每日趋势并获超万星，更新日志显示从基础代理到多 broker、安全模型、Swarm 等快速进化，属于高增长新项目（来源：仓库创建日期与 stars 增长）

可复用范式落库:[[concepts/mandate-gated-trading]]、[[concepts/connector-first-broker-abstraction]]。另见 [[content/vibe-trading]]、[[claims/vibe-trading-main-claim]]。
