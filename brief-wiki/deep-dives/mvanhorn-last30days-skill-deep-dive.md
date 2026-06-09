---
content: "mvanhorn-last30days-skill"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "last30days-skill — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "mvanhorn/last30days-skill：GitHub 描述为“AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web - then synthesizes a grounded summary”。"
  what_it_does: "AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web - then synthesizes a grounded summary"
  metadata:
    language: "Python"
    total_stars: "34466"
    stars_in_period: "3558"
    author: "mvanhorn"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "值得看的是它把“社交平台的实时信号”做成了可安装技能，而不是只做一个搜索 API wrapper。对 AI 应用开发者，最可复用的不是某个源，而是 SKILL.md 让宿主模型先解析实体、生成 `--plan`，再把结构化计划交给 Python engine 的分层方式（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。"
  core_capabilities:
    - "SKILL.md 作为运行时合约"
    - "外部 query plan 文件"
    - "源 fanout 后统一 SourceItem"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，last30days-skill 更像“社交信号优先的 agent research workflow”，不是通用 Web Search API。 Perplexity Sonar Deep Research：官方文档定位是托管 deep research 模型，强调跨数百来源、128K 上下文和按 token/search query 计费；它适合你要一个云端模型直接出长报告。last30days 更适合你要把 Reddit 评论、X engagement、YouTube transcript、Polymarket odds 拉进自己的 agent session，并保留本地 raw/SQLite 产物。取舍：Perplexity 少集成成本，last30days 可控但更依赖本地工具和 keys（来源：Perplexity docs https://docs.perplexity.ai/docs/sonar/models/sonar-deep-research；来源：CONFIGURATION.md Perplexity Deep Research；来源：pipeline.py _retrieve_stream）。 Tavily Search API：官方文档说单次 API 聚合最多 20 个站点，并给 AI agent 返回筛选排序后的网页结果；它适合 RAG/agent 里要稳定 web search endpoint。last30days 的差异是源不是网页为主，而是平台原生信号加抓取模块，例如 `bird_x.py`、`youtube_yt.py`、`polymarket.py`。取舍：Tavily 更像可嵌入 API，last30days 更像可调用研究技能（来源：Tavily docs https://docs.tavily.com/guides/introduction；来源：skills/last30days/scripts/lib/）。 Exa API：官方 search endpoint 提供 neural/auto/deep 等网页搜索和内容抽取；适合“找网页 + 拉正文”的产品功能。last30days 也能用 Exa 作 `grounding` 后端，但它把 Exa/Brave/Serper/Parallel 放在网页补充层，不是唯一数据源。取舍：只做网页检索选 Exa；要社区讨论、视频 transcript、预测市场和 GitHub 组合信号，选 last30days 或抽它的 pipeline pattern（来源：Exa docs https://docs.exa.ai/reference/search；来源：grounding.py web_search；来源：CONFIGURATION.md Web search backend priority）。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "真实流可以从 `/last30days OpenClaw --github-repo=openclaw/openclaw --emit=compact` 这一类调用理解：宿主模型读 `SKILL.md`，先做实体解析和 query plan，再把 plan 文件路径传给 Python engine（来源：skills/last30days/SKILL.md Research Execution）。 ```mermaid flowchart TD A[用户话题] --> B[SKILL 合约] B --> C[实体解析] C --> D[Query Plan] D --> E[last30days.py] E --> F[可用源检测] F --> G[并发抓取] G --> H[归一化去重] H --> I[Weighted RRF] I --> J[LLM或本地重排] J --> K[聚类] K --> L[compact json html] L --> M[宿主模型合成] L --> N[raw文件或SQLite] ``` 关键机制很具体：`DEPTH_SETTINGS` 把 `quick/default/deep` 映射到 per-stream、pool、rerank 三个限制；`pipeline.run()` 对每个 subquery/source 提交 future；`_retrieve_stream()` 分别调用 `reddit_public`、`bird_x`/`xai_x`、`youtube_yt`、`polymarket`、`grounding` 等模块（来源：pipeline.py DEPTH_SETTINGS/run/_retrieve_stream）。 最小直跑形态是： ```bash python skills/last30days/scripts/last30days.py \"OpenClaw\" --emit=compact ``` 这能运行，但 SKILL.md 对 named entity 的正式路径要求宿主模型生成 `--plan` tmpfile，并加 `--x-handle`、`--subreddits`、`--github-repo` 等解析结果；否则会走 deterministic fallback，项目自己把这称为退化路径（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。"
  essential_design_difference: "最值得抄的是“agent 合约 + engine”的边界，而不是逐个 scraper。它把易漂移的写作/调用纪律放进 SKILL.md，把可测试逻辑放进 Python。 - SKILL.md 作为运行时合约；把宿主模型必须做的预处理、调用参数、输出格式写成强约束，并把 engine 输出的哪些部分可读、哪些部分必须 pass-through 写清楚。；不要照搬 1600 行长提示词；你的项目如果没有多宿主、多阶段工具调用，短合约更稳。；这解决的是 agent 应用常见问题：模型会绕开工具、改格式、漏 source 或把 debug evidence 当用户输出（来源：skills/last30days/SKILL.md LAW 1-8）。 - 外部 query plan 文件；让宿主模型生成 JSON plan，写入 tmpfile，再用 `--plan <path>` 交给 engine，避免 shell inline JSON 被引号击穿。；如果你的调用面只有 API，不经过 shell，可以直接传结构化 body。；项目在 SKILL.md 明确记录了 McDonald's 这类 apostrophe 会破坏单引号 JSON 的故障，因此改用 tmpfile（来源：skills/last30days/SKILL.md Research Execution）。 - 源 fanout 后统一 SourceItem；把 Reddit/X/YouTube/Polymarket/GitHub 都归一成 `SourceItem`，字段含 `title/body/url/author/published_at/engagement/relevance_hint/metadata`。；如果只接一个搜索源，统一 schema 的成本可能高于收益。；统一 schema 让后面的 RRF、rerank、cluster、render 复用同一条管线（来源：schema.py SourceItem/Candidate/Report）。 - Weighted RRF + 多样性保护；先按 subquery/source rank 做 RRF，再限制单作者最多 3 条，并为相关来源保留少量槽位。；如果你有高质量标注数据，学习排序可能比手写 RRF 更合适。；社区信号容易被单个大号或单个平台压制，多样性保护让 brief 不只复述一个来源（来源：fusion.py weighted_rrf）。 - 本地 SQLite research store；把一次性研究结果转成 `topics/runs/findings/settings`，并用 URL 唯一约束更新 sighting count。；如果你的产品已有数据仓库或用户级同步，别再加一个本地 SQLite 孤岛。；这把“搜索一次”升级成“监控一个主题”，适合客户情报、竞品跟踪、AI 工具趋势雷达（来源：store.py SCHEMA_V1；watchlist.py run_all）。"
  practitioner_meaning: "建议抽模式，不建议直接把它当稳定基础设施嵌进生产后端。最有价值的是 Agent Skills 合约、query plan tmpfile、multi-source fanout、RRF/rerank/cluster、SQLite watchlist 这套应用结构；最大风险是平台接口和多宿主行为都在变。本地 `--help` 可跑，完整 pytest 在 Windows/Python 3.14.3 未全绿，所以成熟度给 3 而不是 4（来源：last30days.py --help 本地运行；来源：本地 uv run pytest 2026-06-09；来源：CHANGELOG.md 3.3.2）。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "last30days-skill 是一个把“最近 30 天社区信号”塞进 Agent Skills 工作流的研究技能：先并发抓 Reddit、X、YouTube、HN、Polymarket、GitHub 和网页，再让宿主模型合成一份可追问的简报。"
    body_md: "人话：它不是普通搜索框，而是给 Claude Code、Codex、Cursor、Gemini CLI 等 agent 宿主用的研究技能。术语上，它由 `skills/last30days/SKILL.md` 定义 agent 合约，由 `scripts/last30days.py` 执行抓取、融合、重排和渲染（来源：CONCEPTS.md The package；来源：skills/last30days/SKILL.md frontmatter；来源：skills/last30days/scripts/last30days.py build_parser）。"
  why_worth_attention:
    summary: ""
    body_md: "值得看的是它把“社交平台的实时信号”做成了可安装技能，而不是只做一个搜索 API wrapper。对 AI 应用开发者，最可复用的不是某个源，而是 SKILL.md 让宿主模型先解析实体、生成 `--plan`，再把结构化计划交给 Python engine 的分层方式（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。"
    bullets:
      - "它把 Slash command UX 放在第一层：README 主推 `/last30days <topic>`，直跑 Python 只作为 cron、脚本和开发 fallback（来源：README Install；来源：AGENTS.md Orientation）。"
      - "真实 engine 有源选择、并发、归一化、RRF 融合、LLM/本地重排、聚类和保存路径，不是 README 里的纯提示词项目（来源：pipeline.py run；来源：fusion.py weighted_rrf；来源：rerank.py rerank_candidates）。"
      - "源覆盖是可配置的：默认可用 Reddit、HN、Polymarket，GitHub 依赖 `gh` 或 token，X/YouTube/TikTok/Instagram/网页搜索各有独立钥匙或本地工具条件（来源：pipeline.py available_sources；来源：CONFIGURATION.md Source-by-source）。"
      - "成熟度信号混合：仓库有 95 个测试文件，`pyproject.toml` 配了 pytest/coverage；我在 Windows + Python 3.14.3 上跑出 `1602 passed, 15 failed, 4 skipped`，失败集中在 Windows/编码/环境隔离路径（来源：pyproject.toml pytest；来源：本地 uv run pytest 2026-06-09）。"
  key_claims_evidence:
    summary: ""
    body_md: "下面只把能在仓库里对上的说法当证据。README 的“zero config”“1,012 tests”“50+ hosts”等属于项目自称；代码、配置、测试命令能验证的单独标成已核实。"
    items:
      - claim: "这是 Agent Skills 包，不只是 CLI。"
        plain_english: "技能本体是 `SKILL.md` 加同级 `scripts/`，`last30days.py` 是实现层。"
        source: "CONCEPTS.md Skill/Engine；AGENTS.md Orientation；skills/last30days/SKILL.md frontmatter"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`SKILL.md` frontmatter 声明 `user-invocable: true`、`allowed-tools: Bash, Read, Write, AskUserQuestion, WebSearch`，`CONCEPTS.md` 明确 Skill 是分发单元。"
        does_not_support: "不证明所有宿主都能无差异运行。"
        threat: "多宿主路径依赖重，SKILL.md 和 engine flags 必须同步。"
      - claim: "默认 30 天窗口可改。"
        plain_english: "CLI 参数默认 `--days 30`，watchlist 另用 90 天。"
        source: "last30days.py build_parser；watchlist.py _run_topic"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`parser.add_argument('--days', default=30)`；watchlist 子进程传 `--lookback-days 90`。"
        does_not_support: "不保证每个外部源都严格按日期过滤成功。"
        threat: "平台 API 返回日期缺失或反爬时，日期置信度会下降。"
      - claim: "多源并发抓取。"
        plain_english: "每个 subquery/source 组合提交到 ThreadPoolExecutor。"
        source: "pipeline.py run"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`max_workers=max(4, min(16, stream_count or 1))`，对 `plan.subqueries` 和 `subquery.sources` fan out。"
        does_not_support: "不证明端到端一定快；外部 API、yt-dlp、X 反爬会拖慢。"
        threat: "限流源会被记录到 `errors_by_source`，部分结果仍可返回。"
      - claim: "源可用性不是全都零配置。"
        plain_english: "Reddit、HN、Polymarket 代码层默认加入；TikTok/Instagram 要 ScrapeCreators；YouTube 要 `yt-dlp` 或 SC；X 要 xAI、cookie 或 xurl。"
        source: "pipeline.py available_sources；env.py get_x_source；CONFIGURATION.md Source-by-source"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`available.append('reddit')`、`available.extend(['hackernews','polymarket'])`；`SCRAPECREATORS_API_KEY` 才加 TikTok/Instagram。"
        does_not_support: "README 的“Run once unlocks X, YouTube, TikTok”仍依赖本地浏览器、brew、API key 或第三方服务。"
        threat: "平台授权和反爬变化会直接影响可用源。"
      - claim: "融合不是简单按点赞排序。"
        plain_english: "先归一化、打本地相关度/新鲜度/质量，再用 weighted RRF 融合，并做作者上限和来源保底。"
        source: "pipeline.py _normalize_score_dedupe；fusion.py weighted_rrf；rerank.py rerank_candidates"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "RRF 常量 `RRF_K = 60`；每作者上限 `_MAX_ITEMS_PER_AUTHOR = 3`；rerank 有 `ENTITY_MISS_PENALTY = 25.0`。"
        does_not_support: "不证明排序质量优于商业 deep research。"
        threat: "本地 token overlap 和 LLM rerank 都会受 query plan 质量影响。"
      - claim: "支持趋势监控和本地知识库。"
        plain_english: "`--store` 把 findings 写进 SQLite，watchlist 用外部调度跑周期任务。"
        source: "store.py SCHEMA_V1；watchlist.py build_parser/run_all；CONFIGURATION.md Trend monitoring"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "SQLite 表含 `topics`, `research_runs`, `findings`, `settings`，FTS5 表 `findings_fts`，默认 `daily_budget` 是 `5.00`。"
        does_not_support: "不包含内置 daemon 或云调度器。"
        threat: "需要用户自己接 cron、Task Scheduler 或 GitHub Actions。"
      - claim: "README 自称开箱 1,012 tests passing。"
        plain_english: "仓库文本这么写，但我本地复跑不是全绿。"
        source: "README Open source；本地 `uv run pytest` 2026-06-09"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 写 `1,012 tests`；本地实测收集到更多测试并跑出 `1602 passed, 15 failed, 4 skipped`。"
        does_not_support: "不支持“当前 checkout 在 Windows/Python 3.14.3 全绿”。"
        threat: "失败包括 `pwd` 不存在、`os.killpg`、cp1252 解码、环境变量污染和 SKILL.md 版本读取问题。"
      - claim: "安全是 advisory-first，不是强阻断。"
        plain_english: "CI 有 pip-audit 和 TruffleHog，但两个步骤都 `continue-on-error: true`。"
        source: ".github/workflows/security.yml；AGENTS.md Security hygiene"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Security workflow 在 PR/main push 跑依赖审计和 secret scan；注释说明先可见性后 enforcement。"
        does_not_support: "不证明供应链风险已被 CI 阻断。"
        threat: "处理 API keys、cookies、browser tokens 的项目，advisory-only 安全门槛偏软。"
  how_it_works:
    summary: ""
    body_md: "真实流可以从 `/last30days OpenClaw --github-repo=openclaw/openclaw --emit=compact` 这一类调用理解：宿主模型读 `SKILL.md`，先做实体解析和 query plan，再把 plan 文件路径传给 Python engine（来源：skills/last30days/SKILL.md Research Execution）。\n\n```mermaid\nflowchart TD\n  A[用户话题] --> B[SKILL 合约]\n  B --> C[实体解析]\n  C --> D[Query Plan]\n  D --> E[last30days.py]\n  E --> F[可用源检测]\n  F --> G[并发抓取]\n  G --> H[归一化去重]\n  H --> I[Weighted RRF]\n  I --> J[LLM或本地重排]\n  J --> K[聚类]\n  K --> L[compact json html]\n  L --> M[宿主模型合成]\n  L --> N[raw文件或SQLite]\n```\n\n关键机制很具体：`DEPTH_SETTINGS` 把 `quick/default/deep` 映射到 per-stream、pool、rerank 三个限制；`pipeline.run()` 对每个 subquery/source 提交 future；`_retrieve_stream()` 分别调用 `reddit_public`、`bird_x`/`xai_x`、`youtube_yt`、`polymarket`、`grounding` 等模块（来源：pipeline.py DEPTH_SETTINGS/run/_retrieve_stream）。\n\n最小直跑形态是：\n```bash\npython skills/last30days/scripts/last30days.py \"OpenClaw\" --emit=compact\n```\n这能运行，但 SKILL.md 对 named entity 的正式路径要求宿主模型生成 `--plan` tmpfile，并加 `--x-handle`、`--subreddits`、`--github-repo` 等解析结果；否则会走 deterministic fallback，项目自己把这称为退化路径（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。"
  reusable_abstractions:
    summary: ""
    body_md: "最值得抄的是“agent 合约 + engine”的边界，而不是逐个 scraper。它把易漂移的写作/调用纪律放进 SKILL.md，把可测试逻辑放进 Python。"
    items:
      - name: "SKILL.md 作为运行时合约"
        copy: "把宿主模型必须做的预处理、调用参数、输出格式写成强约束，并把 engine 输出的哪些部分可读、哪些部分必须 pass-through 写清楚。"
        skip: "不要照搬 1600 行长提示词；你的项目如果没有多宿主、多阶段工具调用，短合约更稳。"
        why_it_matters: "这解决的是 agent 应用常见问题：模型会绕开工具、改格式、漏 source 或把 debug evidence 当用户输出（来源：skills/last30days/SKILL.md LAW 1-8）。"
      - name: "外部 query plan 文件"
        copy: "让宿主模型生成 JSON plan，写入 tmpfile，再用 `--plan <path>` 交给 engine，避免 shell inline JSON 被引号击穿。"
        skip: "如果你的调用面只有 API，不经过 shell，可以直接传结构化 body。"
        why_it_matters: "项目在 SKILL.md 明确记录了 McDonald's 这类 apostrophe 会破坏单引号 JSON 的故障，因此改用 tmpfile（来源：skills/last30days/SKILL.md Research Execution）。"
      - name: "源 fanout 后统一 SourceItem"
        copy: "把 Reddit/X/YouTube/Polymarket/GitHub 都归一成 `SourceItem`，字段含 `title/body/url/author/published_at/engagement/relevance_hint/metadata`。"
        skip: "如果只接一个搜索源，统一 schema 的成本可能高于收益。"
        why_it_matters: "统一 schema 让后面的 RRF、rerank、cluster、render 复用同一条管线（来源：schema.py SourceItem/Candidate/Report）。"
      - name: "Weighted RRF + 多样性保护"
        copy: "先按 subquery/source rank 做 RRF，再限制单作者最多 3 条，并为相关来源保留少量槽位。"
        skip: "如果你有高质量标注数据，学习排序可能比手写 RRF 更合适。"
        why_it_matters: "社区信号容易被单个大号或单个平台压制，多样性保护让 brief 不只复述一个来源（来源：fusion.py weighted_rrf）。"
      - name: "本地 SQLite research store"
        copy: "把一次性研究结果转成 `topics/runs/findings/settings`，并用 URL 唯一约束更新 sighting count。"
        skip: "如果你的产品已有数据仓库或用户级同步，别再加一个本地 SQLite 孤岛。"
        why_it_matters: "这把“搜索一次”升级成“监控一个主题”，适合客户情报、竞品跟踪、AI 工具趋势雷达（来源：store.py SCHEMA_V1；watchlist.py run_all）。"
  dependency_platform_risk:
    summary: ""
    body_md: "风险主要不是 Python 包，而是平台接口、浏览器 cookie、本地 CLI 和宿主 agent 的契约漂移。"
    items:
      - dependency: "Agent Skills / Claude Code / Codex / Cursor / Gemini CLI 等宿主"
        what_if_change: "宿主不按 SKILL.md 加载、slash command 路径变化或工具权限不同，会导致 `--plan`、WebSearch、Write 等步骤失效。"
        exposure: "high"
        mitigation_or_unknown: "项目用 stale-clone self-check、SKILL_DIR substitution 和多安装文档降低风险；但没有证明所有 50+ host 的持续兼容测试。"
        source: "skills/last30days/SKILL.md STEP 0；README Install；AGENTS.md Orientation"
      - dependency: "X / Twitter"
        what_if_change: "xAI responses/x_search、Twitter GraphQL、browser cookies 或 xurl CLI 任一路径变化，X 源会缺失或空结果。"
        exposure: "high"
        mitigation_or_unknown: "有 xAI、Bird、xurl 多后端；但 `env.get_x_source()` 与 `get_x_source_status()`/docs 的优先级描述不完全一致。"
        source: "env.py get_x_source/get_x_source_status；bird_x.py；xai_x.py；docs/how-search-works.md X/Twitter Search"
      - dependency: "Reddit"
        what_if_change: "公共 JSON、RSS、shreddit HTML 或 ScrapeCreators 备份变化，会影响 Reddit 帖子和评论 enrichment。"
        exposure: "high"
        mitigation_or_unknown: "代码已有 keyless tier0/tier1/tier2 和 ScrapeCreators fallback；但注释承认公共 JSON 在多数环境会 403。"
        source: "reddit_keyless.py module docstring；reddit_public.py module docstring；reddit_enrich.py"
      - dependency: "YouTube / yt-dlp"
        what_if_change: "YouTube bot-wall 或 yt-dlp 失效会让视频搜索/转录变薄。"
        exposure: "medium"
        mitigation_or_unknown: "支持 ScrapeCreators YouTube fallback 和 `LAST30DAYS_YOUTUBE_SSH_HOST`，并校验 SSH host alias 防注入。"
        source: "youtube_yt.py is_ytdlp_installed/_ytdlp_ssh_host；CHANGELOG.md 3.3.0"
      - dependency: "ScrapeCreators / Apify / Brave / Exa / Serper / Parallel / OpenRouter"
        what_if_change: "第三方 API 价格、配额或 schema 变化会影响 TikTok、Instagram、Threads、Pinterest、web grounding 和 deep research。"
        exposure: "medium"
        mitigation_or_unknown: "配置文档列出每个 key；HTTP 层有 retry/backoff；但没有 vendor contract lock。"
        source: "CONFIGURATION.md Source-by-source；grounding.py web_search；http.py request"
      - dependency: "Windows 平台兼容"
        what_if_change: "编码、POSIX API、Keychain 测试假设会导致测试失败或子进程清理异常。"
        exposure: "medium"
        mitigation_or_unknown: "入口对 Windows stdout/stderr 做 UTF-8 reconfigure，但本地 Windows/Python 3.14.3 测试仍有 15 个失败。"
        source: "last30days.py ensure_supported_python/Windows reconfigure；本地 uv run pytest 2026-06-09"
      - dependency: "本地 secrets"
        what_if_change: ".env、browser cookies、AUTH_TOKEN、CT0 泄漏会有账号和 API key 风险。"
        exposure: "high"
        mitigation_or_unknown: "POSIX 权限 warning、macOS Keychain、TruffleHog advisory scan；但 CI secret scan 目前 `continue-on-error: true`。"
        source: "env.py _check_file_permissions/_load_keychain；.github/workflows/security.yml；AGENTS.md Security hygiene"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不能从 README/docs/tree 直接确认，不能写成事实。"
    items:
      - "README 自称支持 50+ Agent Skills hosts，但本仓库没有逐宿主自动化兼容矩阵；只看到 install 文档和多 manifest。"
      - "README 自称“Zero config”下 Reddit/HN/Polymarket/GitHub work immediately；代码层 GitHub 仍依赖 `GITHUB_TOKEN` 或 `gh`，YouTube/X/TikTok/Instagram 需要额外工具或凭据。"
      - "没有在本次检查中执行真实联网 `/last30days <topic>`，因为这会消耗外部 API、浏览器会话或平台配额；只验证了 `--help` 和测试套件。"
      - "docs/how-search-works.md 的 Reddit 描述仍提 OpenAI Responses web_search 路径，但当前 `pipeline.py` 对 Reddit 先走 `reddit_public.search_reddit_public`/keyless，再 ScrapeCreators backup；文档可能滞后。"
      - "发布资产 `last30days.skill` 的 release 内容未在本地 release 包内核验；只核验了 repo checkout、tag 列表和 manifest 版本。"
      - "README 的社交案例数据如 Peter Steinberger、Kanye、OpenClaw star counts 属于示例/营销叙述，本次未逐条复跑验证。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 5
      成熟度: 3
    body_md: "建议抽模式，不建议直接把它当稳定基础设施嵌进生产后端。最有价值的是 Agent Skills 合约、query plan tmpfile、multi-source fanout、RRF/rerank/cluster、SQLite watchlist 这套应用结构；最大风险是平台接口和多宿主行为都在变。本地 `--help` 可跑，完整 pytest 在 Windows/Python 3.14.3 未全绿，所以成熟度给 3 而不是 4（来源：last30days.py --help 本地运行；来源：本地 uv run pytest 2026-06-09；来源：CHANGELOG.md 3.3.2）。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\mvanhorn-last30days-skill\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\mvanhorn-last30days-skill\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\mvanhorn-last30days-skill\\codex-last-message.json"
  invoked_at: "2026-06-09T00:22:30.590Z"
  completed_at: "2026-06-09T00:28:09.796Z"
  repo: "mvanhorn/last30days-skill"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web - then synthesizes a grounded summary"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "这是 Agent Skills 包，不只是 CLI。"
    - "默认 30 天窗口可改。"
    - "多源并发抓取。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "skills/last30days/SKILL.md STEP 0；README Install；AGENTS.md Orientation"
    - "env.py get_x_source/get_x_source_status；bird_x.py；xai_x.py；docs/how-search-works.md X/Twitter Search"
    - "reddit_keyless.py module docstring；reddit_public.py module docstring；reddit_enrich.py"
    - "youtube_yt.py is_ytdlp_installed/_ytdlp_ssh_host；CHANGELOG.md 3.3.0"
    - "CONFIGURATION.md Source-by-source；grounding.py web_search；http.py request"
    - "last30days.py ensure_supported_python/Windows reconfigure；本地 uv run pytest 2026-06-09"
    - "env.py _check_file_permissions/_load_keychain；.github/workflows/security.yml；AGENTS.md Security hygiene"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 5
  maturity: 3
  main_risk: "建议抽模式，不建议直接把它当稳定基础设施嵌进生产后端。最有价值的是 Agent Skills 合约、query plan tmpfile、multi-source fanout、RRF/rerank/cluster、SQLite watchlist 这套应用结构；最大风险是平台接口和多宿主行为都在变。本地 `--help` 可跑，完整 pytest 在 Windows/Python 3.14.3 未全绿，所以成熟度给 3 而不是 4（来源：last30days.py --help 本地运行；来源：本地 uv run pytest 2026-06-09；来源：CHANGELOG.md 3.3.2）。"
next_actions:
  - "extract-pattern"
unknowns:
  - "README 自称支持 50+ Agent Skills hosts，但本仓库没有逐宿主自动化兼容矩阵；只看到 install 文档和多 manifest。"
  - "README 自称“Zero config”下 Reddit/HN/Polymarket/GitHub work immediately；代码层 GitHub 仍依赖 `GITHUB_TOKEN` 或 `gh`，YouTube/X/TikTok/Instagram 需要额外工具或凭据。"
  - "没有在本次检查中执行真实联网 `/last30days <topic>`，因为这会消耗外部 API、浏览器会话或平台配额；只验证了 `--help` 和测试套件。"
  - "docs/how-search-works.md 的 Reddit 描述仍提 OpenAI Responses web_search 路径，但当前 `pipeline.py` 对 Reddit 先走 `reddit_public.search_reddit_public`/keyless，再 ScrapeCreators backup；文档可能滞后。"
  - "发布资产 `last30days.skill` 的 release 内容未在本地 release 包内核验；只核验了 repo checkout、tag 列表和 manifest 版本。"
  - "README 的社交案例数据如 Peter Steinberger、Kanye、OpenClaw star counts 属于示例/营销叙述，本次未逐条复跑验证。"
builder_reuse:
  pattern: "SKILL.md 作为运行时合约"
  copy: "把宿主模型必须做的预处理、调用参数、输出格式写成强约束，并把 engine 输出的哪些部分可读、哪些部分必须 pass-through 写清楚。"
  skip: "不要照搬 1600 行长提示词；你的项目如果没有多宿主、多阶段工具调用，短合约更稳。"
  why_it_matters: "这解决的是 agent 应用常见问题：模型会绕开工具、改格式、漏 source 或把 debug evidence 当用户输出（来源：skills/last30days/SKILL.md LAW 1-8）。"
dependency_platform_risk:
  dependency: "Agent Skills / Claude Code / Codex / Cursor / Gemini CLI 等宿主"
  what_if_change: "宿主不按 SKILL.md 加载、slash command 路径变化或工具权限不同，会导致 `--plan`、WebSearch、Write 等步骤失效。"
  exposure: "high"
  mitigation_or_unknown: "项目用 stale-clone self-check、SKILL_DIR substitution 和多安装文档降低风险；但没有证明所有 50+ host 的持续兼容测试。"
claim_ledger:
  - claim: "这是 Agent Skills 包，不只是 CLI。"
    plain_english: "技能本体是 `SKILL.md` 加同级 `scripts/`，`last30days.py` 是实现层。"
    source: "CONCEPTS.md Skill/Engine；AGENTS.md Orientation；skills/last30days/SKILL.md frontmatter"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`SKILL.md` frontmatter 声明 `user-invocable: true`、`allowed-tools: Bash, Read, Write, AskUserQuestion, WebSearch`，`CONCEPTS.md` 明确 Skill 是分发单元。"
    does_not_support: "不证明所有宿主都能无差异运行。"
    threat: "多宿主路径依赖重，SKILL.md 和 engine flags 必须同步。"
  - claim: "默认 30 天窗口可改。"
    plain_english: "CLI 参数默认 `--days 30`，watchlist 另用 90 天。"
    source: "last30days.py build_parser；watchlist.py _run_topic"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`parser.add_argument('--days', default=30)`；watchlist 子进程传 `--lookback-days 90`。"
    does_not_support: "不保证每个外部源都严格按日期过滤成功。"
    threat: "平台 API 返回日期缺失或反爬时，日期置信度会下降。"
  - claim: "多源并发抓取。"
    plain_english: "每个 subquery/source 组合提交到 ThreadPoolExecutor。"
    source: "pipeline.py run"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`max_workers=max(4, min(16, stream_count or 1))`，对 `plan.subqueries` 和 `subquery.sources` fan out。"
    does_not_support: "不证明端到端一定快；外部 API、yt-dlp、X 反爬会拖慢。"
    threat: "限流源会被记录到 `errors_by_source`，部分结果仍可返回。"
  - claim: "源可用性不是全都零配置。"
    plain_english: "Reddit、HN、Polymarket 代码层默认加入；TikTok/Instagram 要 ScrapeCreators；YouTube 要 `yt-dlp` 或 SC；X 要 xAI、cookie 或 xurl。"
    source: "pipeline.py available_sources；env.py get_x_source；CONFIGURATION.md Source-by-source"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`available.append('reddit')`、`available.extend(['hackernews','polymarket'])`；`SCRAPECREATORS_API_KEY` 才加 TikTok/Instagram。"
    does_not_support: "README 的“Run once unlocks X, YouTube, TikTok”仍依赖本地浏览器、brew、API key 或第三方服务。"
    threat: "平台授权和反爬变化会直接影响可用源。"
  - claim: "融合不是简单按点赞排序。"
    plain_english: "先归一化、打本地相关度/新鲜度/质量，再用 weighted RRF 融合，并做作者上限和来源保底。"
    source: "pipeline.py _normalize_score_dedupe；fusion.py weighted_rrf；rerank.py rerank_candidates"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "RRF 常量 `RRF_K = 60`；每作者上限 `_MAX_ITEMS_PER_AUTHOR = 3`；rerank 有 `ENTITY_MISS_PENALTY = 25.0`。"
    does_not_support: "不证明排序质量优于商业 deep research。"
    threat: "本地 token overlap 和 LLM rerank 都会受 query plan 质量影响。"
  - claim: "支持趋势监控和本地知识库。"
    plain_english: "`--store` 把 findings 写进 SQLite，watchlist 用外部调度跑周期任务。"
    source: "store.py SCHEMA_V1；watchlist.py build_parser/run_all；CONFIGURATION.md Trend monitoring"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "SQLite 表含 `topics`, `research_runs`, `findings`, `settings`，FTS5 表 `findings_fts`，默认 `daily_budget` 是 `5.00`。"
    does_not_support: "不包含内置 daemon 或云调度器。"
    threat: "需要用户自己接 cron、Task Scheduler 或 GitHub Actions。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 55: 横向看，last30days-skill 更像“社交信号优先的 agent research workflow”，不是通用 Web Search API。 Perplexity Sonar Deep Research：官方文档定位是托管 deep research 模型，强..."
  - "faithfulness.high_risk_claim_attribution line 69: 最值得抄的是“agent 合约 + engine”的边界，而不是逐个 scraper。它把易漂移的写作/调用纪律放进 SKILL.md，把可测试逻辑放进 Python。 - SKILL.md 作为运行时合约；把宿主模型必须做的预处理、调用参数、输出格式写成强约束，并把 en..."
artifact_audit:
  official_repo: "https://github.com/mvanhorn/last30days-skill"
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

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

mvanhorn/last30days-skill：GitHub 描述为“AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web - then synthesizes a grounded summary”。

（来源：README/artifactAudit）

## 干什么

AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web - then synthesizes a grounded summary

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 34466 |
| stars_in_period | 3558 |
| author | mvanhorn |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

值得看的是它把“社交平台的实时信号”做成了可安装技能，而不是只做一个搜索 API wrapper。对 AI 应用开发者，最可复用的不是某个源，而是 SKILL.md 让宿主模型先解析实体、生成 `--plan`，再把结构化计划交给 Python engine 的分层方式（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。

## 核心能力

- SKILL.md 作为运行时合约（来源：数据不足）
- 外部 query plan 文件（来源：数据不足）
- 源 fanout 后统一 SourceItem（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，last30days-skill 更像“社交信号优先的 agent research workflow”，不是通用 Web Search API。 Perplexity Sonar Deep Research：官方文档定位是托管 deep research 模型，强调跨数百来源、128K 上下文和按 token/search query 计费；它适合你要一个云端模型直接出长报告。last30days 更适合你要把 Reddit 评论、X engagement、YouTube transcript、Polymarket odds 拉进自己的 agent session，并保留本地 raw/SQLite 产物。取舍：Perplexity 少集成成本，last30days 可控但更依赖本地工具和 keys（来源：Perplexity docs https://docs.perplexity.ai/docs/sonar/models/sonar-deep-research；来源：CONFIGURATION.md Perplexity Deep Research；来源：pipeline.py _retrieve_stream）。 Tavily Search API：官方文档说单次 API 聚合最多 20 个站点，并给 AI agent 返回筛选排序后的网页结果；它适合 RAG/agent 里要稳定 web search endpoint。last30days 的差异是源不是网页为主，而是平台原生信号加抓取模块，例如 `bird_x.py`、`youtube_yt.py`、`polymarket.py`。取舍：Tavily 更像可嵌入 API，last30days 更像可调用研究技能（来源：Tavily docs https://docs.tavily.com/guides/introduction；来源：skills/last30days/scripts/lib/）。 Exa API：官方 search endpoint 提供 neural/auto/deep 等网页搜索和内容抽取；适合“找网页 + 拉正文”的产品功能。last30days 也能用 Exa 作 `grounding` 后端，但它把 Exa/Brave/Serper/Parallel 放在网页补充层，不是唯一数据源。取舍：只做网页检索选 Exa；要社区讨论、视频 transcript、预测市场和 GitHub 组合信号，选 last30days 或抽它的 pipeline pattern（来源：Exa docs https://docs.exa.ai/reference/search；来源：grounding.py web_search；来源：CONFIGURATION.md Web search backend priority）。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

真实流可以从 `/last30days OpenClaw --github-repo=openclaw/openclaw --emit=compact` 这一类调用理解：宿主模型读 `SKILL.md`，先做实体解析和 query plan，再把 plan 文件路径传给 Python engine（来源：skills/last30days/SKILL.md Research Execution）。 ```mermaid flowchart TD A[用户话题] --> B[SKILL 合约] B --> C[实体解析] C --> D[Query Plan] D --> E[last30days.py] E --> F[可用源检测] F --> G[并发抓取] G --> H[归一化去重] H --> I[Weighted RRF] I --> J[LLM或本地重排] J --> K[聚类] K --> L[compact json html] L --> M[宿主模型合成] L --> N[raw文件或SQLite] ``` 关键机制很具体：`DEPTH_SETTINGS` 把 `quick/default/deep` 映射到 per-stream、pool、rerank 三个限制；`pipeline.run()` 对每个 subquery/source 提交 future；`_retrieve_stream()` 分别调用 `reddit_public`、`bird_x`/`xai_x`、`youtube_yt`、`polymarket`、`grounding` 等模块（来源：pipeline.py DEPTH_SETTINGS/run/_retrieve_stream）。 最小直跑形态是： ```bash python skills/last30days/scripts/last30days.py "OpenClaw" --emit=compact ``` 这能运行，但 SKILL.md 对 named entity 的正式路径要求宿主模型生成 `--plan` tmpfile，并加 `--x-handle`、`--subreddits`、`--github-repo` 等解析结果；否则会走 deterministic fallback，项目自己把这称为退化路径（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。

## 本质不同的设计取舍

最值得抄的是“agent 合约 + engine”的边界，而不是逐个 scraper。它把易漂移的写作/调用纪律放进 SKILL.md，把可测试逻辑放进 Python。 - SKILL.md 作为运行时合约；把宿主模型必须做的预处理、调用参数、输出格式写成强约束，并把 engine 输出的哪些部分可读、哪些部分必须 pass-through 写清楚。；不要照搬 1600 行长提示词；你的项目如果没有多宿主、多阶段工具调用，短合约更稳。；这解决的是 agent 应用常见问题：模型会绕开工具、改格式、漏 source 或把 debug evidence 当用户输出（来源：skills/last30days/SKILL.md LAW 1-8）。 - 外部 query plan 文件；让宿主模型生成 JSON plan，写入 tmpfile，再用 `--plan <path>` 交给 engine，避免 shell inline JSON 被引号击穿。；如果你的调用面只有 API，不经过 shell，可以直接传结构化 body。；项目在 SKILL.md 明确记录了 McDonald's 这类 apostrophe 会破坏单引号 JSON 的故障，因此改用 tmpfile（来源：skills/last30days/SKILL.md Research Execution）。 - 源 fanout 后统一 SourceItem；把 Reddit/X/YouTube/Polymarket/GitHub 都归一成 `SourceItem`，字段含 `title/body/url/author/published_at/engagement/relevance_hint/metadata`。；如果只接一个搜索源，统一 schema 的成本存在风险高于收益。；统一 schema 让后面的 RRF、rerank、cluster、render 复用同一条管线（来源：schema.py SourceItem/Candidate/Report）。 - Weighted RRF + 多样性保护；先按 subquery/source rank 做 RRF，再限制单作者最多 3 条，并为相关来源保留少量槽位。；如果你有高质量标注数据，学习排序存在风险比手写 RRF 更合适。；社区信号容易被单个大号或单个平台压制，多样性保护让 brief 不只复述一个来源（来源：fusion.py weighted_rrf）。 - 本地 SQLite research store；把一次性研究结果转成 `topics/runs/findings/settings`，并用 URL 唯一约束更新 sighting count。；如果你的产品已有数据仓库或用户级同步，别再加一个本地 SQLite 孤岛。；这把“搜索一次”升级成“监控一个主题”，适合客户情报、竞品跟踪、AI 工具趋势雷达（来源：store.py SCHEMA_V1；watchlist.py run_all）。

## 对从业者意味着什么

建议抽模式，不建议直接把它当稳定基础设施嵌进生产后端。最有价值的是 Agent Skills 合约、query plan tmpfile、multi-source fanout、RRF/rerank/cluster、SQLite watchlist 这套应用结构；最大风险是平台接口和多宿主行为都在变。本地 `--help` 可跑，完整 pytest 在 Windows/Python 3.14.3 未全绿，所以成熟度给 3 而不是 4（来源：last30days.py --help 本地运行；来源：本地 uv run pytest 2026-06-09；来源：CHANGELOG.md 3.3.2）。

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/agent-skill]]、[[concepts/query-plan]]。另见 [[content/mvanhorn-last30days-skill]]、[[claims/mvanhorn-last30days-skill-main-claim]]。
