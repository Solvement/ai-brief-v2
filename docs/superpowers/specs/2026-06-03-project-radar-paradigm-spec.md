# Projects Radar 范式重写 — 确定性 discover→enrich→rank→depth→analyze (2026-06-03)

Kevin 2026-06-03 定盘。**取代**旧的 verdict-gated 项目深扒逻辑。核心:**不再让 LLM 自由决定深度**。系统必须 **先抓取 → enrichment 取证 → ranking 打分 → 确定性决定 depth → 最后才分析**。

## 核心原则
1. Trending 只负责发现,不负责决定 Deep Dive。
2. Enrichment 负责取证:README、repo tree、docs、examples、tests、install、package files。
3. Ranking 负责判断项目是否值得分析。
4. Deep Dive 的稀缺性来自**质量标准**,**不设数量上限**:所有达标(ranking ≥ 75 且未触发任何硬门槛)的项目**全部** deep,达标多少做多少。(Kevin 2026-06-03 修正:不要人为限制 deep 数量。)
5. Light 不是低质量,而是"知道发生了什么,但暂不深挖"。
6. 不允许因 star 增长高就直接 Deep Dive。
7. 不允许因 README 抓取失败就说 README 为空。
8. 不允许从 repo name / description 大量推测。
9. 不允许 filler / 模板废话冒充分析。
10. 每条内容必须能解释为什么是 list_only / light / analysis / deep。

## 每日抓取范围
- GitHub Trending daily / weekly / monthly,各 30 个,合并去重。
- Hugging Face Trending Spaces / Models 可选。
- 不要全量抓太多源;不要对所有项目调用 DeepSeek V4 Pro。

## 每个 GitHub repo 必须 enrichment(evidence_signals)
owner, repo, url, trend_sources(daily/weekly/monthly), stars, forks, stars_today/trend growth, language, topics, description, created_at, updated_at, license, raw README, **readme_found, readme_fetch_failed, readme_empty, readme_length**, top_level_dirs, key_files, has_docs, has_examples, has_tests, has_install, has_docker, has_cli, has_agents, has_mcp, has_skills, has_models, has_demo, package/config files(package.json/pyproject.toml/Cargo.toml/requirements.txt/docker-compose.yml/Dockerfile)。

**重要:`readme_fetch_failed` 与 `readme_empty` 必须区分。README 抓取失败 → 状态 `needs_enrichment`(不是 light、不是 list_only)。**

## Ranking rubric(每项目输出分数)
- ai_relevance 0-20
- evidence_sufficiency 0-20
- architecture_value 0-20
- usability 0-15
- novelty 0-15
- trend_signal 0-10

总分 → 档:
- 0-39 → list_only
- 40-59 → light
- 60-74 → analysis
- 75+ → deep_candidate

**deep_candidate ≠ 自动 deep**:仍须通过所有硬门槛(无 README-fail/empty/slogan-only 等)才升 deep。**通过的全部做,不限数量**(质量门槛即闸,不设配额)。

## 强制不能 Deep Dive(任一条 → max_allowed_depth ≤ light)
README 抓取失败 / README 为空 / 只有一句 slogan / 没有 docs|examples|install|demo / 主要信息来自 repo name|description / 无明确 AI 应用相关性 / 明显是 awesome list|course|tutorial|resource list / 只是普通 UI wrapper 无 agent|infra|workflow 机制 / 无法设计实际测试计划。

## 值得 Deep Dive 的类型(优先)
1 Agent runtime / coding agent / agent harness;2 Skill pack / MCP / hooks / workflow pack;3 Memory / context / RAG infra;4 Vertical agent template(finance/legal/healthcare/education);5 Personal AI / local-first assistant / AI OS;6 Browser agent / computer-use agent;7 AI evaluation / benchmark tooling;8 直接解决 AI-Brief 自身痛点的工具(网页抓取/文档转 Markdown/repo enrichment/evaluation)。
**不优先:** 普通课程、awesome list、UI demo、纯模型权重、TTS/image demo(除非主线强相关)、无 README/docs 空壳、普通 API wrapper。

## 深度分层(内容 + 字数 + 模型)
1. **list_only**(大多数项目,**不调 LLM**):title, repo url, description, stars/forks/language/topics, trend_sources, one-line reason, why_not_analyzed, recommended_action(ignore/monitor)。50-100 中文字。
2. **light**(DeepSeek V4 **Flash**):它是什么 / 为什么进 radar / 已知事实 / 当前缺什么 / 建议动作(monitor/try later/skip)。**不允许架构推测、不允许把 repo name 推成事实。** 150-300 字。
3. **analysis**(V4 **Pro**,仅少量):解决什么问题 / 核心功能 / 代码目录结构信号 / 使用场景 / 是否进工具箱 / 30 分钟测试计划 / 风险与缺口 / recommended_action(try/analyze/extract)。600-1000 字。
4. **deep**(数量不限,所有达标的都做;V4 Pro/主分析模型,**必须基于 README/docs/tree/examples/config,不允许只基于 description**):一句话判断 / 真实工程问题 / 为什么现在值得关注 / 架构拆解 / 关键模块 / 同类对比 / 实际部署试用路径 / 风险限制 / 我能学到什么 / 面试·项目可讲点 / 60 秒面试讲法 / 是否能转成我的项目或 playbook。1500-3000 字。

## Depth decision 必须输出
`ranking_score, max_allowed_depth, final_depth, ranking_reasons[], rejection_reasons[], evidence_signals{}, recommended_action(ignore/monitor/try/analyze/deep_dive), needs_enrichment(bool)`。

## 每日最终页面目标
30 个全进 Radar。light/analysis/deep 的数量**由确定性打分 + 硬门槛决定,不设人为配额**——达标多少做多少(deep 不限数量)。**不允许 LLM 突破 deterministic max depth**(质量门槛是唯一的闸)。典型分布(参考非硬限):多数 list_only/light,少数 analysis,deep 视当天达标项目而定。

## Regression fixtures(必须建)
1. `tinyhumansai/openhuman` — 不应误判资料不足;README/docs/tree 抓到 → 至少 analysis 或 deep_candidate。
2. `anthropics/financial-services` — 不应误判 README 空;含 agents/skills/commands/MCP connectors/vertical workflows → 至少 analysis 或 deep_candidate。
3. empty README repo — 不能 deep。
4. slogan-only repo — 不能 deep。
5. high-star-growth-only repo — 不能 deep。
6. readme_fetch_failed — 必须与 readme_empty 区分,标 needs_enrichment。

## 实现/审计文件
project-ranking.mjs、GitHub enrichment 脚本、Projects Radar 数据结构、项目分析 prompt、depth decision/quality gate、相关 tests。

## 不要做
不 UI polish;不加无关源;**不改 News/Models/Papers 逻辑**;不降低已有 public contract;不让 filler fallback 回来;不把所有项目送进 V4 Pro。

## 完成后输出
1 新抓取分析流程;2 ranking rubric;3 depth decision examples;4 修改文件;5 新增测试;6 如何运行每日 Projects Radar;7 如何单独对一个项目执行 Deep Dive。

---
关联 [[project-analyst-paradigm]](本 spec 取代其 verdict-gated 选择)、[[live-site-punchlist]]、[[user-goal-applied-ai-builder]]。
