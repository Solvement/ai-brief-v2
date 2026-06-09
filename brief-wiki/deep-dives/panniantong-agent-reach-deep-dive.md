---
content: "panniantong-agent-reach"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "devtool_cli"
title: "Agent-Reach — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "Panniantong/Agent-Reach：GitHub 描述为“Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees”。"
  what_it_does: "Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees."
  metadata:
    language: "Python"
    total_stars: "24071"
    stars_in_period: "2289"
    author: "Panniantong"
  labels:
    - "Tier 2"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "它值得看，不是因为有新模型，而是因为它把“AI 应用要接很多脏平台”的工程琐事做成了可复制套路：channel 注册、doctor 检测、Skill 路由、cookie 配置、MCP 桥接。对做 AI 应用的人，价值在于少写一堆一次性 glue code。"
  core_capabilities:
    - "Channel 注册表"
    - "Doctor 优先于封装 API"
    - "Skill 路由文档"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，它不是 Firecrawl 或 Tavily 的替代品，而是“把多平台工具装进 Agent 工作台”的脚手架。 对比 Firecrawl：Firecrawl 官方 Search endpoint 是带 token 的 API，可搜索并可把结果抓成 markdown/html/rawHtml/screenshot 等格式，还支持 `includeDomains`、`site:`、`filetype:` 等过滤（来源：https://docs.firecrawl.dev/api-reference/endpoint/search）。选 Firecrawl：你要稳定抓网页、递归 crawl、结构化抽取、可计费 SLA。选 Agent Reach：你要接 Twitter、Reddit、B站、小红书、V2EX、雪球这类 Firecrawl 不专门覆盖的平台，并愿意承担 cookie 和上游 CLI 波动。 对比 Tavily：Tavily 官方 SDK 提供 search、extract、crawl、map、research，并要求 `tvly-YOUR_API_KEY`（来源：https://docs.tavily.com/welcome）。选 Tavily：你要面向 RAG/研究代理的统一搜索与抽取 API。选 Agent Reach：你希望 Agent 在本机直接用 `gh`、`yt-dlp`、`rdt`、`twitter`、`mcporter` 等命令，并把配置写进 Skill。 对比 Composio：Composio 官方 MCP 文档强调托管 MCP、用户认证、toolkit 和 allowed tools，例如 Gmail server 配置和 `x-api-key` 连接（来源：https://docs.composio.dev/docs/single-toolkit-mcp）。选 Composio：你要企业级 SaaS 工具动作、OAuth 和托管 MCP。选 Agent Reach：你更偏个人/开源本地环境，能接受 Cookie-Editor、pipx、npm、ffmpeg、代理这些手工边界。 一句取舍：Agent Reach 便宜、贴近真实社交平台和开发者平台，但稳定性由上游和平台风控决定；Firecrawl/Tavily/Composio 更产品化，但 API key、额度、覆盖平台和费用是主要约束。"
  trajectory_note: ""
  manual_confirmation: false
  how_it_works_with_analogy: "真实流：用户让 Agent 查 Reddit bug 讨论时，Skill 先路由到 social 文档；Agent 调 `rdt search` 找帖子，再用 `rdt read POST_ID` 读全文和评论；`agent-reach doctor` 只负责检查 `rdt status --json` 是否已认证（来源：agent_reach/skill/references/social.md Reddit；来源：agent_reach/channels/reddit.py）。 ```mermaid flowchart TD A[用户问题] --> B[SKILL 路由] B --> C[social 文档] C --> D[上游命令 rdt search] D --> E[上游命令 rdt read] E --> F[Agent 总结] G[agent reach doctor] --> H[Channel check] H --> I[rdt status json] I --> J[ok warn off] K[config yaml] --> H ``` 最小命令是两步： `rdt search \"query\" --limit 10` `rdt read POST_ID` 第一行找帖子，第二行读正文和评论；如果未登录，代码提示写入 `~/.config/rdt-cli/credential.json` 或运行 `rdt login`（来源：agent_reach/channels/reddit.py）。 同一模式也用于别的平台：YouTube 检测 `yt-dlp` 和 Node/Deno JS runtime，小红书检测 `xhs status`，抖音检测 `mcporter list douyin`，V2EX 直接请求公开 JSON API（来源：agent_reach/channels/youtube.py；来源：agent_reach/channels/xiaohongshu.py；来源：agent_reach/channels/douyin.py；来源：agent_reach/channels/v2ex.py）。"
  essential_design_difference: "最值得抄的是“把平台能力拆成 channel + health check + skill command reference”，而不是抄具体平台抓取方式。 - Channel 注册表；每个平台一个 `Channel` 子类，声明 `name`、`description`、`backends`、`tier`，再集中放入 `ALL_CHANNELS`。；不要把平台读取逻辑都塞进同一个万能函数。；Agent 应用最容易坏在外部依赖；独立 channel 能让 doctor、安装、文档和替换上游工具都更清楚（来源：agent_reach/channels/base.py；来源：agent_reach/channels/__init__.py）。 - Doctor 优先于封装 API；`check_all(config)` 收集每个 channel 的 `ok/warn/off/error`，报告按 tier 分组。；不要只给“安装成功”提示；真实可用性要按平台检查。；对 Agent 工具链，用户最需要知道的是哪个渠道能用、哪个需要 cookie、哪个需要代理（来源：agent_reach/doctor.py format_report）。 - Skill 路由文档；主 `SKILL.md` 只放路由和短命令，复杂平台放 `references/social.md`、`video.md`、`web.md` 等。；不要把全部平台手册塞进一个超长系统提示。；这让 Agent 在需要 Twitter、B站、RSS、GitHub 时按需读文档，减少上下文污染（来源：agent_reach/skill/SKILL.md）。 - 输出清洗器；对高噪声平台输出先做字段裁剪，例如小红书只保留正文、作者、互动数、图片 URL 和评论。；不要直接把原始平台 JSON 喂给模型。；这是真正能省 token、提高摘要质量的小工程点（来源：agent_reach/channels/xiaohongshu.py；来源：tests/test_xhs_format.py）。"
  practitioner_meaning: "建议不是直接押生产，而是抽取模式：channel registry、doctor 分层报告、Skill 路由、平台输出清洗、cookie 导入边界。要用于真实 AI 应用，可以先只启用 Web、GitHub、YouTube、RSS、V2EX、Exa 这类低账号风险渠道；Twitter、小红书、雪球、Reddit、抖音放到用户明确授权的可选能力里。成熟度扣分来自当前测试非全绿、文档计数不一致、Douyin 配置冲突和强外部依赖。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Agent Reach 是给 AI Agent 装互联网工具箱的安装器和健康检查 CLI，不是把所有平台重新封装成一个 SDK。"
    body_md: "人话：它帮你把 Twitter、Reddit、YouTube、B站、小红书、GitHub、RSS、Exa 搜索等上游工具装好、配好、写进 Agent Skill，之后 Agent 直接调用这些工具。术语：这是 tool scaffolding，不是 agent runtime；`pyproject.toml` 暴露的入口是 `agent-reach = agent_reach.cli:main`，核心类 `AgentReach` 只提供 `doctor()` 和 `doctor_report()`（来源：pyproject.toml project.scripts；来源：agent_reach/core.py）。"
  why_worth_attention:
    summary: ""
    body_md: "它值得看，不是因为有新模型，而是因为它把“AI 应用要接很多脏平台”的工程琐事做成了可复制套路：channel 注册、doctor 检测、Skill 路由、cookie 配置、MCP 桥接。对做 AI 应用的人，价值在于少写一堆一次性 glue code。"
    bullets:
      - "已核实：仓库实际注册 16 个 channel：github、twitter、youtube、reddit、bilibili、xiaohongshu、douyin、linkedin、wechat、weibo、xiaoyuzhou、v2ex、xueqiu、rss、exa_search、web（来源：agent_reach/channels/__init__.py ALL_CHANNELS）。"
      - "已核实：安装指南要求核心渠道先跑 `agent-reach install --env=auto`，可选渠道用 `--channels=twitter,weibo` 或 `--channels=all`（来源：docs/install.md Quick Reference）。"
      - "已核实：Agent Skill 把任务分成 search、social、career、dev、web、video 六类，并把常用命令放进 `references/*.md`（来源：agent_reach/skill/SKILL.md 路由表）。"
      - "风险也很具体：大量能力依赖平台 cookie、第三方 CLI、MCP 服务和反爬状态，仓库自己也在 troubleshooting 里承认 Twitter、B站、雪球等会受风控影响（来源：docs/troubleshooting.md；来源：agent_reach/skill/references/social.md）。"
  key_claims_evidence:
    summary: ""
    body_md: "下面区分“项目自称”和“我从代码/配置核实到的事实”。README 里的星标数、免费、持续更新、平台数量等营销说法不直接当事实。"
    items:
      - claim: "它是安装器和健康检查器，不是统一代理框架。"
        plain_english: "Agent Reach 负责装工具、检查工具，读取和搜索动作仍由上游 CLI 或 MCP 直接完成。"
        source: "docs/install.md Goal；agent_reach/core.py AgentReach；docs/README_en.md Design Philosophy"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`AgentReach` 只有 `doctor()` / `doctor_report()`；安装指南明确说安装后直接用 twitter-cli、rdt-cli、xhs-cli、yt-dlp、mcporter、gh CLI。"
        does_not_support: "不支持把它理解成 LangGraph、AutoGen 这类 agent 编排框架。"
        threat: "README 标题“one-click access to entire internet”容易让人误以为有统一运行时。"
      - claim: "CLI 入口、依赖和 Python 版本有明确包配置。"
        plain_english: "这是一个可安装 Python 包，入口命令叫 `agent-reach`。"
        source: "pyproject.toml project / dependencies / project.scripts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "版本 `1.4.0`，`requires-python >=3.10`，依赖包括 requests、feedparser、python-dotenv、loguru、pyyaml、rich、yt-dlp；脚本入口指向 `agent_reach.cli:main`。"
        does_not_support: "不证明每个第三方平台在真实网络环境都可用。"
        threat: "没有安装依赖时直接跑测试会因缺 `loguru` 失败。"
      - claim: "项目自称 17 平台、零配置 8 个渠道。"
        plain_english: "Skill 文案这么写，但代码注册表和 README 表格存在数量不一致。"
        source: "agent_reach/skill/SKILL.md description；agent_reach/channels/__init__.py ALL_CHANNELS；docs/README_en.md Supported Platforms"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "Skill metadata 写“17 platforms”和“Zero config for 8 channels”；代码实际 `ALL_CHANNELS` 为 16 个。"
        does_not_support: "不能把 17 当作已核实平台数量。"
        threat: "CHANGELOG 也有 14→15、9→12/11 的历史数字差异，说明文档计数维护不稳。"
      - claim: "凭据本地保存，并尽量使用 0600 权限。"
        plain_english: "Cookie 和 token 默认写到用户家目录的 Agent Reach 配置，而不是仓库目录。"
        source: "agent_reach/config.py CONFIG_FILE/save；docs/install.md Directory Rules；tests/test_config.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`CONFIG_FILE = ~/.agent-reach/config.yaml`；`save()` 用 `os.open(..., 0o600)`；测试检查非 Windows 下 group/other 不可读。"
        does_not_support: "不证明上游工具不会上传数据，也不证明 Windows ACL 等价安全。"
        threat: "Cookie 一旦交给第三方 CLI/MCP，风险边界转移到上游工具。"
      - claim: "Exa 搜索通过 mcporter 接入，配置默认指向 Exa MCP。"
        plain_english: "搜索不是内置搜索引擎，而是把 `exa` 注册成 MCP 服务。"
        source: "config/mcporter.json；agent_reach/channels/exa_search.py；agent_reach/cli.py _install_mcporter"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`config/mcporter.json` 包含 `exa.baseUrl = https://mcp.exa.ai/mcp`；channel 检测 `mcporter config list` 里是否含 exa。"
        does_not_support: "README 的“免费、无需 API Key”只能说项目自称，未在本地真实调用验证。"
        threat: "如果 Exa MCP 改认证、额度或端点，搜索能力直接受影响。"
      - claim: "小红书输出做了 token 节省型清洗。"
        plain_english: "不是原样把 API 返回塞给模型，而是保留 id、title、desc、user、互动数、图片 URL、tags、comments 等字段。"
        source: "agent_reach/channels/xiaohongshu.py format_xhs_result；tests/test_xhs_format.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "测试样例确认会丢弃 `geo_info`、`audit_info`、`note_flow_source`、头像等冗余字段，保留“旅行/美食”等 tag 和评论内容。"
        does_not_support: "不证明 xhs-cli 当前登录和平台接口稳定。"
        threat: "Skill 文档写发帖、评论、点赞存在签名和 406 风险。"
      - claim: "当前 checkout 的测试不是全绿。"
        plain_english: "我在指定 checkout 直接跑了测试，结果是 78 passed, 7 failed。"
        source: "本地命令：python -m pytest -q；checkout 17624268a059ccfb23eba8a2ba50f9f92c8dc0ca"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "失败包含缺 `loguru` 的 CLI 测试、Windows cp1252 读取 UTF-8 Skill 文件失败、config 测试受环境变量影响。"
        does_not_support: "不等于按 `pip install -c constraints.txt -e .[dev]` 建干净环境后必然失败。"
        threat: "Windows 和未隔离环境下的开发体验需要谨慎。"
  how_it_works:
    summary: ""
    body_md: "真实流：用户让 Agent 查 Reddit bug 讨论时，Skill 先路由到 social 文档；Agent 调 `rdt search` 找帖子，再用 `rdt read POST_ID` 读全文和评论；`agent-reach doctor` 只负责检查 `rdt status --json` 是否已认证（来源：agent_reach/skill/references/social.md Reddit；来源：agent_reach/channels/reddit.py）。\n\n```mermaid\nflowchart TD\n  A[用户问题] --> B[SKILL 路由]\n  B --> C[social 文档]\n  C --> D[上游命令 rdt search]\n  D --> E[上游命令 rdt read]\n  E --> F[Agent 总结]\n  G[agent reach doctor] --> H[Channel check]\n  H --> I[rdt status json]\n  I --> J[ok warn off]\n  K[config yaml] --> H\n```\n\n最小命令是两步：\n`rdt search \"query\" --limit 10`\n`rdt read POST_ID`\n第一行找帖子，第二行读正文和评论；如果未登录，代码提示写入 `~/.config/rdt-cli/credential.json` 或运行 `rdt login`（来源：agent_reach/channels/reddit.py）。\n\n同一模式也用于别的平台：YouTube 检测 `yt-dlp` 和 Node/Deno JS runtime，小红书检测 `xhs status`，抖音检测 `mcporter list douyin`，V2EX 直接请求公开 JSON API（来源：agent_reach/channels/youtube.py；来源：agent_reach/channels/xiaohongshu.py；来源：agent_reach/channels/douyin.py；来源：agent_reach/channels/v2ex.py）。"
  reusable_abstractions:
    summary: ""
    body_md: "最值得抄的是“把平台能力拆成 channel + health check + skill command reference”，而不是抄具体平台抓取方式。"
    items:
      - name: "Channel 注册表"
        copy: "每个平台一个 `Channel` 子类，声明 `name`、`description`、`backends`、`tier`，再集中放入 `ALL_CHANNELS`。"
        skip: "不要把平台读取逻辑都塞进同一个万能函数。"
        why_it_matters: "Agent 应用最容易坏在外部依赖；独立 channel 能让 doctor、安装、文档和替换上游工具都更清楚（来源：agent_reach/channels/base.py；来源：agent_reach/channels/__init__.py）。"
      - name: "Doctor 优先于封装 API"
        copy: "`check_all(config)` 收集每个 channel 的 `ok/warn/off/error`，报告按 tier 分组。"
        skip: "不要只给“安装成功”提示；真实可用性要按平台检查。"
        why_it_matters: "对 Agent 工具链，用户最需要知道的是哪个渠道能用、哪个需要 cookie、哪个需要代理（来源：agent_reach/doctor.py format_report）。"
      - name: "Skill 路由文档"
        copy: "主 `SKILL.md` 只放路由和短命令，复杂平台放 `references/social.md`、`video.md`、`web.md` 等。"
        skip: "不要把全部平台手册塞进一个超长系统提示。"
        why_it_matters: "这让 Agent 在需要 Twitter、B站、RSS、GitHub 时按需读文档，减少上下文污染（来源：agent_reach/skill/SKILL.md）。"
      - name: "输出清洗器"
        copy: "对高噪声平台输出先做字段裁剪，例如小红书只保留正文、作者、互动数、图片 URL 和评论。"
        skip: "不要直接把原始平台 JSON 喂给模型。"
        why_it_matters: "这是真正能省 token、提高摘要质量的小工程点（来源：agent_reach/channels/xiaohongshu.py；来源：tests/test_xhs_format.py）。"
  dependency_platform_risk:
    summary: ""
    body_md: "它的主风险不是 Python 代码复杂，而是外部平台和上游工具链太多。Agent Reach 的优势和脆弱点是同一个东西：不自建后端，直接站在别人 CLI/MCP 上。"
    items:
      - dependency: "twitter-cli / bird CLI"
        what_if_change: "Twitter 改 GraphQL、cookie 或风控后，搜索、timeline、article 读取会降级或失败。"
        exposure: "high"
        mitigation_or_unknown: "Skill 文档建议升级 twitter-cli，搜索 404 时用 feed 替代；但没有集成测试能保证平台变化后仍可用。"
        source: "agent_reach/channels/twitter.py；agent_reach/skill/references/social.md Twitter"
      - dependency: "rdt-cli + Reddit cookie"
        what_if_change: "Reddit 未认证时返回 403，cookie 过期或浏览器提取失败会让 Reddit channel 变 warn。"
        exposure: "high"
        mitigation_or_unknown: "`rdt login` 和手动写 `reddit_session` 是文档化路径；真实账号和地区风控未知。"
        source: "agent_reach/channels/reddit.py；README FAQ Reddit"
      - dependency: "yt-dlp + Node/Deno JS runtime"
        what_if_change: "YouTube 或 B站提取逻辑变化，或机器缺 JS runtime，会导致字幕/元数据能力降级。"
        exposure: "medium"
        mitigation_or_unknown: "YouTube channel 会检查 `yt-dlp`、Node/Deno、`--js-runtimes` 配置；B站服务器 IP 仍可能 412。"
        source: "agent_reach/channels/youtube.py；agent_reach/skill/references/video.md"
      - dependency: "mcporter + Exa MCP"
        what_if_change: "mcporter 未安装、Exa 配置不存在、Exa MCP 认证/免费策略变化，会影响全网搜索和微信公众号搜索。"
        exposure: "medium"
        mitigation_or_unknown: "代码只检测 `mcporter config list` 是否含 exa；“免费无需 Key”未在本地调用验证。"
        source: "agent_reach/channels/exa_search.py；config/mcporter.json；agent_reach/guides/setup-exa.md"
      - dependency: "小红书 xhs-cli 与 xsec_token"
        what_if_change: "直接用裸 note_id 会被拦，写操作可能 406，高频会验证码。"
        exposure: "high"
        mitigation_or_unknown: "Skill 文档要求先 search/feed 拿 URL 或 ID，再 read；写操作建议谨慎或降级版本。"
        source: "agent_reach/skill/references/social.md 小红书；agent_reach/channels/xiaohongshu.py"
      - dependency: "Douyin MCP 配置文档"
        what_if_change: "docs/install.md 写 HTTP 端口 18070；Skill social.md 又说 HTTP 模式无法正常工作、应使用 stdio。"
        exposure: "medium"
        mitigation_or_unknown: "这是仓库内文档冲突，安装前需要人工确认当前 douyin-mcp-server 支持方式。"
        source: "docs/install.md 抖音；agent_reach/skill/references/social.md 抖音"
      - dependency: "Windows 编码环境"
        what_if_change: "默认 cp1252 打开 UTF-8 Skill 文件会测试失败，中文 Skill 安装后在某些工具链中可能读写异常。"
        exposure: "medium"
        mitigation_or_unknown: "CLI 有 `_ensure_utf8_console()`，但测试里 `open()` 未指定 encoding 仍失败。"
        source: "agent_reach/cli.py _ensure_utf8_console；本地 pytest 结果"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点不能从 README/docs/tree 证明，不能写成事实。"
    items:
      - "未确认真实安装 `agent-reach install --env=auto --channels=all` 后 16 个 channel 在一台干净机器上全部可用。"
      - "未确认 Exa MCP 在 2026-06-08 仍完全免费且无需 Key；仓库只配置了 `https://mcp.exa.ai/mcp`。"
      - "未确认各上游 CLI 的许可证、维护状态和安全边界；仓库 README 只列链接和选型理由。"
      - "未确认 Cookie 不会被上游工具上传；Agent Reach 本身本地保存 config，但调用链包含第三方 CLI/MCP。"
      - "未确认 README/Skill 的平台数量：代码注册 16 个 channel，Skill 自称 17 platforms。"
      - "未确认 `docs/update.md` 的 `agent-reach install --skill-only` 是否曾存在；当前 CLI 没有该参数。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 4
      工程深度: 3
      复用价值: 4
      成熟度: 2
    body_md: "建议不是直接押生产，而是抽取模式：channel registry、doctor 分层报告、Skill 路由、平台输出清洗、cookie 导入边界。要用于真实 AI 应用，可以先只启用 Web、GitHub、YouTube、RSS、V2EX、Exa 这类低账号风险渠道；Twitter、小红书、雪球、Reddit、抖音放到用户明确授权的可选能力里。成熟度扣分来自当前测试非全绿、文档计数不一致、Douyin 配置冲突和强外部依赖。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\panniantong-agent-reach\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\panniantong-agent-reach\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\panniantong-agent-reach\\codex-last-message.json"
  invoked_at: "2026-06-09T00:18:00.950Z"
  completed_at: "2026-06-09T00:22:30.319Z"
  repo: "Panniantong/Agent-Reach"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "它是安装器和健康检查器，不是统一代理框架。"
    - "CLI 入口、依赖和 Python 版本有明确包配置。"
    - "项目自称 17 平台、零配置 8 个渠道。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "agent_reach/channels/twitter.py；agent_reach/skill/references/social.md Twitter"
    - "agent_reach/channels/reddit.py；README FAQ Reddit"
    - "agent_reach/channels/youtube.py；agent_reach/skill/references/video.md"
    - "agent_reach/channels/exa_search.py；config/mcporter.json；agent_reach/guides/setup-exa.md"
    - "agent_reach/skill/references/social.md 小红书；agent_reach/channels/xiaohongshu.py"
    - "docs/install.md 抖音；agent_reach/skill/references/social.md 抖音"
    - "agent_reach/cli.py _ensure_utf8_console；本地 pytest 结果"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 4
  engineering_depth: 3
  reuse_value: 4
  maturity: 2
  main_risk: "建议不是直接押生产，而是抽取模式：channel registry、doctor 分层报告、Skill 路由、平台输出清洗、cookie 导入边界。要用于真实 AI 应用，可以先只启用 Web、GitHub、YouTube、RSS、V2EX、Exa 这类低账号风险渠道；Twitter、小红书、雪球、Reddit、抖音放到用户明确授权的可选能力里。成熟度扣分来自当前测试非全绿、文档计数不一致、Douyin 配置冲突和强外部依赖。"
next_actions:
  - "extract-pattern"
unknowns:
  - "未确认真实安装 `agent-reach install --env=auto --channels=all` 后 16 个 channel 在一台干净机器上全部可用。"
  - "未确认 Exa MCP 在 2026-06-08 仍完全免费且无需 Key；仓库只配置了 `https://mcp.exa.ai/mcp`。"
  - "未确认各上游 CLI 的许可证、维护状态和安全边界；仓库 README 只列链接和选型理由。"
  - "未确认 Cookie 不会被上游工具上传；Agent Reach 本身本地保存 config，但调用链包含第三方 CLI/MCP。"
  - "未确认 README/Skill 的平台数量：代码注册 16 个 channel，Skill 自称 17 platforms。"
  - "未确认 `docs/update.md` 的 `agent-reach install --skill-only` 是否曾存在；当前 CLI 没有该参数。"
builder_reuse:
  pattern: "Channel 注册表"
  copy: "每个平台一个 `Channel` 子类，声明 `name`、`description`、`backends`、`tier`，再集中放入 `ALL_CHANNELS`。"
  skip: "不要把平台读取逻辑都塞进同一个万能函数。"
  why_it_matters: "Agent 应用最容易坏在外部依赖；独立 channel 能让 doctor、安装、文档和替换上游工具都更清楚（来源：agent_reach/channels/base.py；来源：agent_reach/channels/__init__.py）。"
dependency_platform_risk:
  dependency: "twitter-cli / bird CLI"
  what_if_change: "Twitter 改 GraphQL、cookie 或风控后，搜索、timeline、article 读取会降级或失败。"
  exposure: "high"
  mitigation_or_unknown: "Skill 文档建议升级 twitter-cli，搜索 404 时用 feed 替代；但没有集成测试能保证平台变化后仍可用。"
claim_ledger:
  - claim: "它是安装器和健康检查器，不是统一代理框架。"
    plain_english: "Agent Reach 负责装工具、检查工具，读取和搜索动作仍由上游 CLI 或 MCP 直接完成。"
    source: "docs/install.md Goal；agent_reach/core.py AgentReach；docs/README_en.md Design Philosophy"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`AgentReach` 只有 `doctor()` / `doctor_report()`；安装指南明确说安装后直接用 twitter-cli、rdt-cli、xhs-cli、yt-dlp、mcporter、gh CLI。"
    does_not_support: "不支持把它理解成 LangGraph、AutoGen 这类 agent 编排框架。"
    threat: "README 标题“one-click access to entire internet”容易让人误以为有统一运行时。"
  - claim: "CLI 入口、依赖和 Python 版本有明确包配置。"
    plain_english: "这是一个可安装 Python 包，入口命令叫 `agent-reach`。"
    source: "pyproject.toml project / dependencies / project.scripts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "版本 `1.4.0`，`requires-python >=3.10`，依赖包括 requests、feedparser、python-dotenv、loguru、pyyaml、rich、yt-dlp；脚本入口指向 `agent_reach.cli:main`。"
    does_not_support: "不证明每个第三方平台在真实网络环境都可用。"
    threat: "没有安装依赖时直接跑测试会因缺 `loguru` 失败。"
  - claim: "项目自称 17 平台、零配置 8 个渠道。"
    plain_english: "Skill 文案这么写，但代码注册表和 README 表格存在数量不一致。"
    source: "agent_reach/skill/SKILL.md description；agent_reach/channels/__init__.py ALL_CHANNELS；docs/README_en.md Supported Platforms"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "Skill metadata 写“17 platforms”和“Zero config for 8 channels”；代码实际 `ALL_CHANNELS` 为 16 个。"
    does_not_support: "不能把 17 当作已核实平台数量。"
    threat: "CHANGELOG 也有 14→15、9→12/11 的历史数字差异，说明文档计数维护不稳。"
  - claim: "凭据本地保存，并尽量使用 0600 权限。"
    plain_english: "Cookie 和 token 默认写到用户家目录的 Agent Reach 配置，而不是仓库目录。"
    source: "agent_reach/config.py CONFIG_FILE/save；docs/install.md Directory Rules；tests/test_config.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`CONFIG_FILE = ~/.agent-reach/config.yaml`；`save()` 用 `os.open(..., 0o600)`；测试检查非 Windows 下 group/other 不可读。"
    does_not_support: "不证明上游工具不会上传数据，也不证明 Windows ACL 等价安全。"
    threat: "Cookie 一旦交给第三方 CLI/MCP，风险边界转移到上游工具。"
  - claim: "Exa 搜索通过 mcporter 接入，配置默认指向 Exa MCP。"
    plain_english: "搜索不是内置搜索引擎，而是把 `exa` 注册成 MCP 服务。"
    source: "config/mcporter.json；agent_reach/channels/exa_search.py；agent_reach/cli.py _install_mcporter"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`config/mcporter.json` 包含 `exa.baseUrl = https://mcp.exa.ai/mcp`；channel 检测 `mcporter config list` 里是否含 exa。"
    does_not_support: "README 的“免费、无需 API Key”只能说项目自称，未在本地真实调用验证。"
    threat: "如果 Exa MCP 改认证、额度或端点，搜索能力直接受影响。"
  - claim: "小红书输出做了 token 节省型清洗。"
    plain_english: "不是原样把 API 返回塞给模型，而是保留 id、title、desc、user、互动数、图片 URL、tags、comments 等字段。"
    source: "agent_reach/channels/xiaohongshu.py format_xhs_result；tests/test_xhs_format.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "测试样例确认会丢弃 `geo_info`、`audit_info`、`note_flow_source`、头像等冗余字段，保留“旅行/美食”等 tag 和评论内容。"
    does_not_support: "不证明 xhs-cli 当前登录和平台接口稳定。"
    threat: "Skill 文档写发帖、评论、点赞存在签名和 406 风险。"
artifact_audit:
  official_repo: "https://github.com/Panniantong/Agent-Reach"
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

Panniantong/Agent-Reach：GitHub 描述为“Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees”。

（来源：README/artifactAudit）

## 干什么

Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 24071 |
| stars_in_period | 2289 |
| author | Panniantong |

## 标签

- Tier 2（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

它值得看，不是因为有新模型，而是因为它把“AI 应用要接很多脏平台”的工程琐事做成了可复制套路：channel 注册、doctor 检测、Skill 路由、cookie 配置、MCP 桥接。对做 AI 应用的人，价值在于少写一堆一次性 glue code。

（来源：README/artifactAudit）

## 核心能力

- Channel 注册表（来源：数据不足）
- Doctor 优先于封装 API（来源：数据不足）
- Skill 路由文档（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，它不是 Firecrawl 或 Tavily 的替代品，而是“把多平台工具装进 Agent 工作台”的脚手架。 对比 Firecrawl：Firecrawl 官方 Search endpoint 是带 token 的 API，可搜索并可把结果抓成 markdown/html/rawHtml/screenshot 等格式，还支持 `includeDomains`、`site:`、`filetype:` 等过滤（来源：https://docs.firecrawl.dev/api-reference/endpoint/search）。选 Firecrawl：你要稳定抓网页、递归 crawl、结构化抽取、可计费 SLA。选 Agent Reach：你要接 Twitter、Reddit、B站、小红书、V2EX、雪球这类 Firecrawl 不专门覆盖的平台，并愿意承担 cookie 和上游 CLI 波动。 对比 Tavily：Tavily 官方 SDK 提供 search、extract、crawl、map、research，并要求 `tvly-YOUR_API_KEY`（来源：https://docs.tavily.com/welcome）。选 Tavily：你要面向 RAG/研究代理的统一搜索与抽取 API。选 Agent Reach：你希望 Agent 在本机直接用 `gh`、`yt-dlp`、`rdt`、`twitter`、`mcporter` 等命令，并把配置写进 Skill。 对比 Composio：Composio 官方 MCP 文档强调托管 MCP、用户认证、toolkit 和 allowed tools，例如 Gmail server 配置和 `x-api-key` 连接（来源：https://docs.composio.dev/docs/single-toolkit-mcp）。选 Composio：你要企业级 SaaS 工具动作、OAuth 和托管 MCP。选 Agent Reach：你更偏个人/开源本地环境，能接受 Cookie-Editor、pipx、npm、ffmpeg、代理这些手工边界。 一句取舍：Agent Reach 便宜、贴近真实社交平台和开发者平台，但稳定性由上游和平台风控决定；Firecrawl/Tavily/Composio 更产品化，但 API key、额度、覆盖平台和费用是主要约束。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

可复用范式落库:[[concepts/agent-tool-scaffolding]]、[[concepts/panniantong-agent-reach-channel-health-check]]。另见 [[content/panniantong-agent-reach]]、[[claims/panniantong-agent-reach-main-claim]]。
