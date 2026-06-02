# Project 栏目流水线合并 spec（取长补短）

2026-06-01。目标：把**现有项目抓取流水线**与**新 project-analyst 范式（BriefMem）**合并。旧的抓取层很好，保留;分析、存储、更新节奏换成新范式。Opus=架构+审核(本文档)，Codex=多-agent 实现，PM 跑 verify/commit。

金标准对标:`brief-wiki/deep-dives/pi-agent-deep-dive.md`(project_type=devtool_cli)。范式见记忆 [[project-analyst-paradigm]]、风格 [[analysis-style-plain-language]]、选稿 [[selection-prestige-gate]]。

---

## 取长补短对照（逐阶段）

| 阶段 | 保留旧的（长） | 换成新的（补短） |
|---|---|---|
| discover 抓取 | `lib/github-trending.mjs` 三榜 daily/weekly/monthly + `discoverTopicSearch` 主题补充 + 跨榜去重 | **加:已 deep-dive 跳过**(查 brief-wiki content/ 的 repo fullName) |
| evidence 取证 | README via GitHub API | **升级为 artifact 审计**:repo metadata(stars/forks/license/pushed_at/open_issues)+ 仓库树(顶层目录 src/tests/docs/examples/packages)+ releases + 最近提交活跃度;缺写 not_found |
| triage 分诊 | `project-ranking.mjs` 关键词 boost/penalty(当廉价预信号)+ SQLite 缓存 | **换 LLM 分诊输出**:project_type(9 类)+ verdict(skip/watch/L1/deep_dive/clone_and_run)+ 4 维 1–5(relevance/depth/reuse/maturity);worthDeepDive 降为输入信号之一 |
| analyze 深析 | pipeline-kernel 阶段骨架 | **换 9 段大白话范式**(project_type 分诊;双层表达;claim-evidence;memory card)。取代旧 `evaluate.mjs`/`prompts.mjs` 的 deep JSON |
| guard 守护 | (无) | BriefGuard A(`brief:lint`)+ B(reviewer);grounded 检查 |
| 存储 | SQLite(批次暂存,保留) | **写 brief-wiki typed memory**(content[type=project]+source-pack+evidence-pack+deep-dive+concept/claim/artifact + graph 边);`brief:build`→`public/data/brief/*.json` |
| 展示 | `trending.json` 三榜卡(light tier 保留作雷达列表) | deep 部分改读 brief-wiki 镜像 |
| 更新 | `maybe-ingest.mjs` 18h 阈值 | **真 daily**(cron/scheduled);因"已分析跳过"而增量 |

---

## 合并后流水线（8 阶段）

1. **discover(daily):** 三榜 scrape(留)+ 主题搜索(留)→ 去重 → **过滤掉 brief-wiki 里已 deep-dive 的 repo**(增量)。
2. **artifact-audit(取证升级):** 对通过初筛的候选,抓 README + repo metadata + 仓库树 + releases + 活跃度 + license,SQLite 缓存;缺项写 `not_found`。
3. **triage(合并):** 关键词 boost(留)喂给 LLM 分诊 → project_type(9)+ verdict(5 档)+ 4 维评分。仅 `deep_dive`/`clone_and_run` 进入下一步;`skip/watch/L1` 进 watchlist(content.status=watchlisted/shortlisted)。
4. **deep-dive(新范式):** project_type 分诊的 9 段大白话 + claim-evidence + memory card,全部 grounded 到 artifact;一手核验、不脑补、中文。
5. **guard:** `brief:lint`(A 层)+ reviewer(B 层)校验链接/grounded/枚举。
6. **memory-write:** 写 brief-wiki 实体 + graph 边(同赛道/同类项目可连 `same_track_as`);标记该 repo 已 deep-dive(去重账本)。
7. **publish:** `brief:build` → `public/data/brief/*.json`;light tier 仍出三榜列表(雷达)。
8. **archive/cadence:** daily 增量;SQLite 记录 run。

---

## Codex 多-agent work-order（按角色拆）

- **Agent A — discover+audit:** 改 `columns/projects/sources.mjs`:加"已 deep-dive 跳过"(读 brief-wiki content slug/url);`collectEvidence` 升级为 artifact 审计(metadata/树/releases/活跃度/license,缺写 not_found)。复用 `github-trending.mjs`(勿改其抓取)。
- **Agent B — triage:** 改 `columns/projects/{evaluate,prompts}.mjs`:输出 project_type(9)+ verdict(5)+ 4 维评分;保留 `project-ranking.mjs` 关键词分作输入。
- **Agent C — deep-dive 生成器:** 新 `columns/projects/deepdive.mjs`:对标 `pi-agent-deep-dive.md`,按 project_type 分诊产出 9 段 + claim-evidence + memory card,写成 brief-wiki 实体(content/source-pack/evidence-pack/deep-dive/concept/claim/artifact),frontmatter 用 `scripts/brief/schema` 字段(project_type/project_verdict/next_actions/reasoning_trace/claim_ledger)。
- **Agent D — wiring+guard:** 接 `pipeline-kernel` 阶段;memory-write 经 `brief/wiki.mjs`;publish 跑 `brief:build`;guard 跑 `brief:lint`。
- **PM(Opus):** 跑 `npm run verify`/`brief:lint`/`brief:build` + git;审核 grounded 与范式符合度;收敛 codex 产出。

**硬约束(写进每个 agent prompt):** 中文分析、双层大白话、术语必释;一手核验、缺写 not_found 不脑补;trending 抓最新、已分析跳过;每结论 claim-evidence + 风险边界。

---

## 删除耦合(Phase 2b,谨慎)

旧 `data/agent-memory/projects.json` + `reusablePatterns` 是旧 publish 的写入目标。改为 brief-wiki memory-write 后,这些写入点要一并迁移/删除,否则 `npm run verify` 断。`trending.json` 三榜 light 列表保留(雷达),仅 deep 部分切到 brief-wiki。SQLite per-run 表保留作批次暂存。

## 范围与顺序

P1 Agent A+B(discover/audit/triage,可独立测) → P2 Agent C(deep-dive 生成器,对标 pi) → P3 Agent D(wiring+guard+publish) → P4 PM 收敛 + 真 daily cadence。每 P 后 PM 跑 verify 绿灯再进。
