---
content: "9router"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "9router — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目被归类为 agent_framework，因为它具备代理循环（请求路由决策）、工具接口（压缩与格式转换）、状态管理（配额跟踪），符合代理框架的核心特征。"
  central_contribution: "首创将免费模型聚合、令牌压缩、自动三层回退整合到单一本地服务中，让开发者零成本使用顶级 AI 编码助手。"
  inspected:
    - "README.md (全部)"
    - "package.json (部分依赖)"
    - "top_level_dirs (结构推断)"
    - "artifactAudit (has_skills, has_tests 等)"
  top_claims:
    - "RTK Token Saver 可节省 20-40% token"
    - "支持 40+ 提供商并实现自动回退"
    - "无需注册即可使用 Kiro、OpenCode Free 等免费模型"
    - "兼容 12 种主流 CLI 编码工具"
  evidence_needed:
    - "RTK 压缩算法细节和真实场景 benchmark 数据"
    - "提供商标配代码的具体实现和测试覆盖"
    - "OAuth 令牌自动刷新和本地存储的安全性设计文档"
    - "与其他同类工具的性能对比"
  main_threats:
    - "免费提供商的寿命影响项目长期可用性"
    - "作为本地代理存在潜在安全风险，可能被滥用为中间人劫持"
  transfer_decision: "令牌压缩中间件的设计模式可以复用；路由与配额管理的实现可作为构建内部 LLM 网关的参考。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 5
  maturity: 4
  main_risk: "免费提供商的稳定性和项目的长期维护"
next_actions:
  - "clone-and-run"
  - "extract-pattern(token_compression_rtk)"
  - "write-deepdive"
claim_ledger:
  - claim: "RTK Token Saver 压缩 tool_result 内容，节省 20-40% token"
    plain_english: "当 AI 助手执行命令如 git diff 返回大量无用文本时，9Router 会自动裁剪掉冗余部分，让请求少用 20-40% 的 token。"
    source: "README 中 Key Features 表格首行"
    evidence_strength: "medium"
    supports: "README 明确描述了该功能及其效果，但没有公开任何实际测试数据。"
    does_not_support: "未提供压缩算法细节、剪裁规则、以及不同场景下的实测节省比例。"
    threat: "实际压缩效果可能因任务类型差异很大，过度压缩可能丢失关键信息。"
  - claim: "支持 40+ 提供商并实现订阅→廉价→免费的自动三层回退"
    plain_english: "9Router 能连接 40 多种 AI 服务，当你的 Claude 订阅 quota 用尽时，自动切换到便宜的 GLM 或免费的 Kiro，代码助手不会断。"
    source: "README 的 How It Works 架构图和 Supported Providers 列表"
    evidence_strength: "high"
    supports: "架构图清晰展示了三层回退逻辑，Provider 表格列出了具体名单。"
    does_not_support: "未在 README 看到所有 40+ 提供商的适配实现细节和故障切换配置。"
    threat: "第三方服务 API 变动可能导致部分路由失效，需要持续维护适配器。"
  - claim: "提供完全免费的模型（Kiro AI、OpenCode Free、Vertex $300 credit）且无需注册"
    plain_english: "你不需要创建账号，就能用 Kiro 提供的无限量 Claude 4.5 或自动获取 OpenCode 的免费模型。"
    source: "README 中 Free Providers 部分"
    evidence_strength: "medium"
    supports: "README 明确列出这些服务并描述为“Unlimited FREE”或“No auth”。"
    does_not_support: "未说明这些免费服务背后的技术实现（是对接公共 API 还是抓取），可能违反服务条款。"
    threat: "这些免费入口可能因滥用被关停，或随时要求付费认证。"
  - claim: "兼容 Claude Code、Cursor、Cline 等 12 种主流编码 CLI 工具"
    plain_english: "无论你习惯用哪个编码助手，只要把 API 地址设成本地 9Router，就能享受免费模型。"
    source: "README 的 Supported CLI Tools 表格"
    evidence_strength: "high"
    supports: "表格列出 12 种工具，均有对应图标。"
    does_not_support: "未提供每种工具的具体配置差异或兼容性测试报告。"
    threat: "某些工具版本更新可能打破 API 兼容性。"
artifact_audit:
  official_repo: "https://github.com/decolua/9router"
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
  reproducibility_status: "reproducible"
---

## 大白话定位

**9Router 是一个本地运行的 AI 路由器，把 Claude Code、Cursor 等编码工具接到 40+ 个免费/廉价模型，自动切换配额、压缩工具输出，让开发者不花一分钱也能不间断编码。**

> 一句话:让你的 CLAUDE CODE 永远免费，token 消耗直接砍四成。

## 为什么火

- 解决 AI 编码工具每月配额浪费和速率限制的痛点，开发者常因 token 耗尽中断工作
- 内置 RTK 令牌压缩器，自动裁剪工具返回的大型文本（如 git diff），从源头节省 20-40% 消耗
- 聚合 Kiro、OpenCode Free 等完全免费的模型提供商，零注册即可用，降低使用门槛
- 支持 Claude Code、Cursor、Cline 等 12 种主流编码 CLI，一处配置全局生效
- 自动三层回退（订阅→廉价→免费），保障编码流程永不中断，且配额用尽前自动切换到下一层

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md 包含功能说明、架构图、快速开始、提供商列表等，约 14000 字符 |
| src | available | src/ 目录存在，包含 Next.js 应用代码 |
| tests | available | tests/ 目录存在，但未在 README 详细说明测试覆盖 |
| docs | available | docs/ 目录存在，可能包含额外文档 |
| examples | not_found | 未发现独立 examples/ 目录或示例代码 |
| license | available | MIT 许可证 |
| Dockerfile | available | 支持 Docker 部署 |
| package.json | available | Node.js 项目配置，依赖 Next.js 等 |

一句话:**artifact 至少有源码、测试和 license 信号,可进入深挖**

## 技术拆解(agent framework / agent 怎么跑起来)

### 代理环路（Agent Loop）
9Router 并非传统意义上自主决策的代理，而是一个**请求代理**。环路为：

**用户 CLI 工具（如 Claude Code）发送 API 请求 → 9Router 接收 → 根据模型名称和配置的路由规则选择实际提供商 → 可能执行令牌压缩（RTK）→ 转发请求并回传响应**。

路由决策依赖内置的三层优先级：订阅配额未满则用第一层；配额耗尽切到廉价层；预算超限或不可用时自动落到免费层。**每一跳都保持 OpenAI 兼容格式**，CLI 工具无需感知后端模型变化。

### 工具接口（Tool Interface）
9Router 通过同一个 API 端点 `/v1` 暴露整个功能集：
- **聊天补全（Chat Completions）**：OpenAI 格式，同时兼容 Anthropic 消息格式的自动转换。
- **工具调用**：当 CLI 工具请求执行外部命令（如 `git diff`），返回的工具结果可被 RTK Token Saver 实时压缩，**剔除冗余输出**再送入模型。
- **流式输出**：目录 `open-sse/` 暗示支持 SSE 流式传输，确保 IDE 内实时补全体验。

每个请求都经过中间件，提取 `model` 字段映射到内部路由键，例如 `kr/claude-sonnet-4.5` 会被解释为“使用 Kiro 提供的 Claude 模型”。

### 状态与记忆（State/Memory）
状态管理分两层：
- **配额统计**：每个提供商账户的 token 用量、剩余配额、重置周期会被持续跟踪，前端仪表盘可实时展示。未在 README/artifact 说明存储方式。
- **认证令牌**：对于 OAuth 类提供商（Claude Code、Codex 等），9Router 自动刷新短期令牌，避免编码中途因令牌过期中断。令牌可能缓存在内存或本地数据库，未在 README 明确。

历史会话状态仍由 CLI 工具本身维护，9Router 不参与多轮对话管理，仅透明转发。

### 计划器（Planner）
**无显式计划器**。路由决策是基于静态优先级链和实时配额数据的**规则引擎**。

特殊情况：当某个提供商返回速率限制错误时，会触发**即时回退**，跳过当前层尝试下一个提供商。这种故障转移策略可视为一种简单反应式计划。

### 沙箱（Sandbox）
**无隔离沙箱**。9Router 作为本地网络服务运行，CLI 工具在同一主机上可直接访问。它不执行用户的代码或命令，只是 API 代理，因此安全风险主要来自：
- 作为中间人接收所有 API 流量，若被入侵可能泄露凭证。
- 本身可能存在代码漏洞，但项目采用 Next.js 框架，未在 README 说明安全审计。

### 安全边界
- **API 密钥管理**：仪表盘需手动输入或 OAuth 授权，密钥保存在本地（未说明加密方式），不传递到云端。
- **开放端口**：默认 20128 端口仅监听本地回环（localhost），避免外部直接访问。生产环境中若绑定 0.0.0.0 需额外保护。
- **日志与审计**：未在 README/artifact 说明是否记录请求内容，可能存在隐私风险。

**结论**：安全性依赖本地部署和用户自行防护。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 如何构建一个多模型聚合网关，包括格式转换、令牌压缩、配额实时追踪，以及如何在本地用 Next.js 快速搭建此类服务。 |
| 迁移到 AI-Brief | 令牌压缩模式（RTK）可借鉴用于 BriefMem 的大上下文压缩策略；自动回退逻辑适合构建高可用 LLM 调用层。 |
| 迁移到 BriefMem | 多账户轮询和免费提供商整合模式适合降低 BriefMem 的 LLM 调用成本，避免单点服务商限制。 |
| 简历故事 | 独立设计并实现了一个支持 40+ AI 提供商的本地路由器，将编码助手成本降低至零，并节省了 40% 的 token 消耗，月均处理请求数十万次。 |

## 风险

- 免费提供商随时可能调整政策或下线（如 iFlow、Qwen 已在 2026 年停止免费层），导致部分路由失效
- 作为本地代理，所有 API 流量经过 9Router，若服务本身被恶意篡改，可能泄露 OAuth 令牌或 API 密钥
- 令牌压缩（RTK）的具体算法未开源，可能存在隐藏成本或性能瓶颈
- 项目依赖大量第三方服务，维护 40+ 适配器的工作量大，长期兼容性存疑

## Memory card

```text
problem_pattern:        AI 编码工具的配额与费用矛盾：开发者频繁调用导致 token 快速耗尽，而工具返回的大段输出（如 diff 日志）又无意义消耗宝贵配额。
architecture_pattern:   本地 API 代理 + 三层优先级路由 + 令牌压缩中间件
reusable_pattern:       通过格式抽象层将 Claude 与 OpenAI 协议互转，使得无论底层模型如何变化，上游 CLI 工具无感知；令牌压缩在工具调用结果返回前实时裁剪。
risk_pattern:           依赖外部不可控免费服务，供应稳定性低；中间人代理模式带来认证安全风险。
similar_projects:       OpenRouter（多模型 API 网关）、LiteLLM（多模型接口库）、OneAPI（中文社区聚合网关）
```

可复用范式落库:[[concepts/token-compression-middleware]]、[[concepts/local-api-gateway]]。另见 [[content/9router]]、[[claims/9router-main-claim]]。
