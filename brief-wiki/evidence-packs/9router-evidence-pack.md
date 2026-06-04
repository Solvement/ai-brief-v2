---
content: "9router"
kind: "evidence-pack"
title: "9router — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "9Router 是一个本地运行的 AI 路由器，把 Claude Code、Cursor 等编码工具接到 40+ 个免费/廉价模型，自动切换配额、压缩工具输出，让开发者不花一分钱也能不间断编码。"
    internal_logic: "### 代理环路（Agent Loop）\n9Router 并非传统意义上自主决策的代理，而是一个**请求代理**。环路为：\n\n**用户 CLI 工具（如 Claude Code）发送 API 请求 → 9Router 接收 → 根据模型名称和配置的路由规则选择实际提供商 → 可能执行令牌压缩（RTK）→ 转发请求并回传响应**。\n\n路由决策依赖内置的三层优先级：订阅配额未满则用第一层；配额耗尽切到廉价层；预算超限或不可用时自动落到免费层。**每一跳都保持 OpenAI 兼容格式**，CLI 工具无需感知后端模型变化。\n\n### 工具接口（Tool Interface）\n9Router 通过同一个 API 端点 `/v1` 暴露整个功能集：\n- **聊天补全（Chat Completions）**：OpenAI 格式，同时兼容 Anthropic 消息格式的自动转换。\n- **工具调用**：当 CLI 工具请求执行外部命令（如 `git diff`），返回的工具结果可被 RTK Token Saver 实时压缩，**剔除冗余输出**再送入模型。\n- **流式输出**：目录 `open-sse/` 暗示支持 SSE 流式传输，确保 IDE 内实时补全体验。\n\n每个请求都经过中间件，提取 `model` 字段映射到内部路由键，例如 `kr/claude-sonnet-4.5` 会被解释为“使用 Kiro 提供的 Claude 模型”。\n\n### 状态与记忆（State/Memory）\n状态管理分两层：\n- **配额统计**：每个提供商账户的 token 用量、剩余配额、重置周期会被持续跟踪，前端仪表盘可实时展示。未在 README/artifact 说明存储方式。\n- **认证令牌**：对于 OAuth 类提供商（Claude Code、Codex 等），9Router 自动刷新短期令牌，避免编码中途因令牌过期中断。令牌可能缓存在内存或本地数据库，未在 README 明确。\n\n历史会话状态仍由 CLI 工具本身维护，9Router 不参与多轮对话管理，仅透明转发。\n\n### 计划器（Planner）\n**无显式计划器**。路由决策是基于静态优先级链和实时配额数据的**规则引擎**。\n\n特殊情况：当某个提供商返回速率限制错误时，会触发**即时回退**，跳过当前层尝试下一个提供商。这种故障转移策略可视为一种简单反应式计划。\n\n### 沙箱（Sandbox）\n**无隔离沙箱**。9Router 作为本地网络服务运行，CLI 工具在同一主机上可直接访问。它不执行用户的代码或命令，只是 API 代理，因此安全风险主要来自：\n- 作为中间人接收所有 API 流量，若被入侵可能泄露凭证。\n- 本身可能存在代码漏洞，但项目采用 Next.js 框架，未在 README 说明安全审计。\n\n### 安全边界\n- **API 密钥管理**：仪表盘需手动输入或 OAuth 授权，密钥保存在本地（未说明加密方式），不传递到云端。\n- **开放端口**：默认 20128 端口仅监听本地回环（localhost），避免外部直接访问。生产环境中若绑定 0.0.0.0 需额外保护。\n- **日志与审计**：未在 README/artifact 说明是否记录请求内容，可能存在隐私风险。\n\n**结论**：安全性依赖本地部署和用户自行防护。"
    failure_mode: "免费提供商随时可能调整政策或下线（如 iFlow、Qwen 已在 2026 年停止免费层），导致部分路由失效"
    source_pointer: "https://github.com/decolua/9router"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.4.63"
experiments: []
claims:
  - "[[claims/9router-main-claim]]"
artifacts:
  - "[[artifacts/9router-repo]]"
metrics:
  - "stars=16076"
  - "forks=2411"
  - "open_issues=619"
  - "latest_release=v0.4.63"
  - "pushed_at=2026-05-31T08:03:20Z"
baselines: []
failure_modes:
  - "免费提供商随时可能调整政策或下线（如 iFlow、Qwen 已在 2026 年停止免费层），导致部分路由失效"
  - "作为本地代理，所有 API 流量经过 9Router，若服务本身被恶意篡改，可能泄露 OAuth 令牌或 API 密钥"
  - "令牌压缩（RTK）的具体算法未开源，可能存在隐藏成本或性能瓶颈"
  - "项目依赖大量第三方服务，维护 40+ 适配器的工作量大，长期兼容性存疑"
missing_details: []
source_pointers:
  - "https://github.com/decolua/9router"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/9router-main-claim]],官方 artifact 落库为 [[artifacts/9router-repo]]。See [[content/9router]]。
