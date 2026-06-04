---
content: "scrapling"
kind: "evidence-pack"
title: "Scrapling — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "面向 AI 代理的自适应网页抓取框架，能从单次请求扩展到全站爬取，自动绕过反爬并适应页面结构变化。"
    internal_logic: "### 自适应抓取引擎：解决网站结构变化的核心难题\n网站一改版，爬虫就失效。Scrapling 的解析器能学习页面结构，自动重新定位你的目标元素，让你无需手动修改代码。\n\n具体做法：当你首次用 `auto_save=True` 抓取时，框架会保存每个选中元素的**特征签名**（例如文本、属性、相邻节点结构）。之后网站结构变动，只需对相同选择器加上 `adaptive=True`，它会用保存的签名在 DOM 中重新搜索，实现“自适应元素重定位”。这背后依赖 lxml 和签名匹配算法，签名数据存储在本地 SQLite 文件里。\n\n### Agent 循环：爬虫的生命周期就像智能代理\nScrapling 的 Spider 并非简单请求队列。它实现了一个类似 Agent 循环的模式：每个 Spider 可以定义 `before_start`、`before_request`、`after_response` 等生命周期 hook，相当于一个智能代理在做出决策。这种设计允许你插入反反爬逻辑、动态调整请求头，或根据响应内容实时改变抓取策略。此外，Spider 还支持并发、暂停/恢复和自动代理轮换，使它适合长时间、高强度的抓取任务。\n\n### 工具接口：让 AI 代理直接调用爬虫\nScrapling 提供了两个对 AI 友好的接口：\n- **MCP 服务器**：遵循 Model Context Protocol，AI 模型可以通过标准化的工具调用请求网页抓取。你只需启动 MCP 服务，Agent 就能像调用一个函数一样抓取页面并返回解析后的数据。\n- **Agent-Skill**：一个预定义的技能包（在 `agent-skill/` 目录下），包含了一些常见的抓取任务模板。AI 代理可以直接使用这些技能，无需自己编写选择器。\n\n这使得 Scrapling 不仅是程序员工具，更是 AI 应用的数据采集层。\n\n### 状态与记忆：自适应签名持久化\n前面提到的 `auto_save` 功能会在本地创建一张记忆表，记录每个元素的唯一签名。这张表就像爬虫的“长期记忆”，即使脚本多次重启，它也能记得之前抓取过的元素特征。当页面变化时，`adaptive` 模式从记忆中查找最相似的元素，这是一种轻量级的记忆增强机制。\n\n### 规划器：爬虫任务调度\nSpider 内部有一个简易的任务规划器，负责管理请求队列、控制并发数、处理重试和错误。虽然它不支持复杂的爬取策略（如深度优先/广度优先需自行实现），但其内置的暂停/恢复和代理轮换已经覆盖大多数场景。你可以通过设置 `concurrent_requests` 和代理列表来自定义调度行为。\n\n### 沙箱与安全边界\nScrapling 本身不提供 JS 沙箱或内容安全检查。安全性主要体现在**反反爬**：`StealthyFetcher` 基于 Playwright 无头浏览器，模拟真实用户的鼠标轨迹、键盘输入，并禁用自动化标志，从而绕过 Cloudflare Turnstile 等常见反爬机制。但请务必注意，如果你用 MCP 服务器暴露接口，要限制代理可访问的 URL，避免被恶意利用。\n\n### 关键模块拆解\n- **Fetchers**：多种请求器（同步/异步、隐身、动态渲染），统一接口。`StealthyFetcher.adaptive = True` 启用内置反反爬 tricks。\n- **Parser**：基于 lxml，支持 CSS/XPath/regex 选择器，自适应重定位是本库的杀手特性。\n- **Spider**：类 Scrapy 风格，支持异步、并发、中间件、信号。\n- **Proxy 集成**：自动从文件或 API 加载代理列表，实现轮换和失败切换。\n\n### 与其他框架的对比\n- **vs Scrapy**：Scrapy 更成熟，但无需自带自适应解析和隐身请求；Scrapling 更易上手且抗反爬能力更强。\n- **vs BeautifulSoup/Requests**：Scrapling 提供更高层抽象，省去手动处理 Cookie、代理、渲染的麻烦。\n- **vs 直接使用 Playwright**：Scrapling 封装了 Playwright 并加入自适应选择器，对开发者更友好。"
    failure_mode: "自适应解析器可能误匹配，导致抓取到错误元素，需要仔细验证签名。"
    source_pointer: "https://github.com/d4vinci/scrapling"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/BSD-3-Clause/v0.4.8"
experiments: []
claims:
  - "[[claims/scrapling-main-claim]]"
artifacts:
  - "[[artifacts/scrapling-repo]]"
metrics:
  - "stars=59800"
  - "forks=5772"
  - "open_issues=24"
  - "latest_release=v0.4.8"
  - "pushed_at=2026-06-01T23:19:28Z"
baselines: []
failure_modes:
  - "自适应解析器可能误匹配，导致抓取到错误元素，需要仔细验证签名。"
  - "隐身请求依赖对 Playwright 的配置，高级反爬（如 DataDome 等）可能会失效，需持续关注社区更新。"
  - "Spider 的高并发和代理轮换如果配置不当，可能消耗大量内存或触发被爬站点的防御。"
  - "MCP 服务器若不加限制，可能被恶意 Agent 利用发起任意请求，必须实施 URL 白名单等安全措施。"
missing_details: []
source_pointers:
  - "https://github.com/d4vinci/scrapling"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/scrapling-main-claim]],官方 artifact 落库为 [[artifacts/scrapling-repo]]。See [[content/scrapling]]。
