---
content: "aitoearn"
kind: "evidence-pack"
title: "AiToEarn — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "帮助一人公司用 AI 自动化内容营销：创作、发布、互动、变现，覆盖抖音、小红书等十多个主流平台。"
    internal_logic: "### 整体架构\n\nAiToEarn 采用前后端分离 + 多 Agent 协同的架构，围绕**创作-发布-互动-变现**四大环节提供自动化能力。部署方式灵活，从 SaaS 网站到私有化 Docker、再到 MCP 集成，覆盖不同用户层次。\n\n**前端**\n- 基于 TypeScript 的 Web 应用 (`aitoearn-web`)，提供内容管理、发布排期、数据看板等界面。\n- 基于 Electron 的桌面客户端，利用本地资源（如 SQLite）实现更丰富的交互。\n- 浏览器插件负责在目标平台上执行自动化互动操作（点赞、评论抓取等）。\n\n**后端**\n- `aitoearn-server`：核心业务服务，处理发布任务、OAuth 授权、Relay 转发等。\n- `aitoearn-ai`：AI 服务，负责调用大模型进行内容生成、文案优化、视频/图片生成等。\n- 存储使用 MongoDB、Redis，配置通过环境变量或 `local.config.js` 注入。\n\n### Agent 循环与工具接口\n\n**Agent 定义**：项目将四大能力分别封装为 Agent（Monetize、Publish、Engage、Create），但 README 未描述统一的 Agent Loop 框架。可能的实现方式是每个 Agent 对应一组后台任务或 API 路由，通过事件驱动完成子任务。\n\n**工具接口**：\n- 各平台 API 被封装为发布/互动工具。\n- 浏览器插件通过注入脚本操作网页元素，实现自动化互动。\n- MCP 接口（`/api/unified/mcp`）允许外部 AI 助手（如 Claude）调用平台能力，相当于将 AiToEarn 暴露为工具集。\n\n**状态与记忆**：未在 README 说明。可能通过数据库存储任务状态、用户账号 Cookies、草稿历史等，但无具体持久化机制描述。\n\n**规划器**：未在 README 说明。从功能看，内容创作 Agent 可能接受用户指令后，依次调用生成模型、剪辑模块、发布工具，形成一个流程，但内部调度方式未知。\n\n### 沙盒与安全\n\n**沙盒**：未在 README 说明。\n**安全边界**：\n- API Key 用于所有 MCP/OpenClaw 接入的认证。\n- Relay 机制允许自部署用户借用官方凭证完成第三方平台 OAuth，避免直接暴露私密开发者密钥。\n- 浏览器插件可能运行在沙箱化的扩展脚本环境，但具体权限控制未提及。\n\n### 关键模块拆解\n\n**发布模块**\n- 统一发布队列，支持日历排期。\n- 通过 OAuth 或 Relay 代理完成平台授权，将内容 API 发起上传。\n- 视频、图文等素材由创作模块产出或用户上传。\n\n**创作模块**\n- 接入多种外部 AI 模型：文本生成、图片生成 (Nano Banana)、视频生成 (Grok, Veo, Seedance 等)。\n- 支持批量任务，可并行生成大量内容。\n- 内置视频翻译、剪辑等后期处理能力。\n\n**互动模块**\n- 浏览器插件监听用户操作，自动执行点赞、收藏、关注。\n- 调用大模型分析评论，自动生成回复，识别高转化信号。\n- 品牌监测可能通过爬取平台搜索结果或官方 API 实现，未详细说明。\n\n**变现模块**\n- 平台内部内容交易市场，支持 CPS、CPE、CPM 结算。\n- 创作者接取商家推广任务，发布指定内容。\n- 结算依赖播放量、互动量等平台数据，需平台 API 回传或插件采集。\n\n### 与同类项目对比\n\n- 相比 MoneyPrinterTurbo 等纯视频生成工具，AiToEarn 多了发布、互动和变现的完整闭环。\n- 相比 Sprout Social 等商业社媒管理平台，它开源、可私有化，且直接支持收益结算。\n- 缺点是高度依赖第三方平台，且内部 Agent 实现细节不透明，二次开发难度未知。\n\n### 部署与体验路径\n\n**最快体验**：访问 aitoearn.cn 或 aitoearn.ai，注册即可使用。\n**在 AI 助手中调用**：获取 API Key 后，在 Claude Desktop 或 Cursor 中配置 MCP 地址即可。\n**自部署**： `git clone + docker compose up -d` 一键启动，访问 localhost:8080。\n**开发调试**：进入 `project/aitoearn-backend` 手动启动多个 Node 服务，须先安装依赖、复制配置文件。"
    failure_mode: "严重依赖第三方社交媒体平台的 API 及 Web 结构，平台规则变更或封禁策略可能导致核心功能瘫痪。"
    source_pointer: "https://github.com/yikart/aitoearn"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/true/MIT/v2.4.0"
experiments: []
claims:
  - "[[claims/aitoearn-main-claim]]"
artifacts:
  - "[[artifacts/aitoearn-repo]]"
metrics:
  - "stars=17791"
  - "forks=2803"
  - "open_issues=20"
  - "latest_release=v2.4.0"
  - "pushed_at=2026-05-21T02:55:15Z"
baselines: []
failure_modes:
  - "严重依赖第三方社交媒体平台的 API 及 Web 结构，平台规则变更或封禁策略可能导致核心功能瘫痪。"
  - "自部署版本需要额外配置 OAuth 开发者凭证或依赖官方 Relay，存在单点故障和隐私泄露风险。"
  - "官方内容交易市场和部分 AI 服务（如视频模型）可能要求使用云端服务，私有化部署者无法使用所有功能。"
  - "项目未提供系统级测试和详细架构文档，生产环境稳定性和可维护性存疑。"
missing_details: []
source_pointers:
  - "https://github.com/yikart/aitoearn"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/aitoearn-main-claim]],官方 artifact 落库为 [[artifacts/aitoearn-repo]]。See [[content/aitoearn]]。
