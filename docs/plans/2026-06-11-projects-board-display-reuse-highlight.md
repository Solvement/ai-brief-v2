# Plan: 项目板块展示解耦去重 + 亮点轻卡 (PROJECTS-BOARD-REUSE-HIGHLIGHT)

> 触发：数据契约/管线流变更 + 预计 >100 行改动，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：项目月/周/日榜展示要反映本次真实 trending 全量态势；ledger 去重只防重复分析，不防当前热门项目展示。
- **小方向**：
  - ledger 过滤返回 `accepted`（新项目，允许分析）与 `reuse`（已分析但本次仍 trending，必须展示）。
  - reuse 项带 `alreadyAnalyzed:true`，展示复用缓存分析，且不触发 LLM 分析。
  - light 卡新增必填 `highlight`，说明高 star / 火点；向后兼容旧数据。
  - 单测覆盖 done-but-current trending 入榜、reuse 不调 LLM、light 含 highlight。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 修复 `deep_dived/analyzed` repo 从当前 board 消失的问题。
  - 复用 brief-wiki / 上一版 trending.json / ledger analysis_file 可得缓存；取不到缓存时保证 light highlight 不空。
  - validate-trending 接受并校验新字段，同时不炸旧数据。
- 非目标：
  - 不改前端视觉皮肤。
  - 不改 `docs/paradigms/*` 正文。
  - 不引新依赖，不 deploy，不 commit/push。
- 影响范围（模块/数据/路由/用户）：
  - `scripts/columns/projects/{ledger,sources,index,evaluate}.mjs`
  - `scripts/validate-trending.mjs`
  - 项目管线测试与覆盖 eval
  - `public/data/trending.json` 只作为缓存读取源，不做批量重写。
- 验收标准（可观察）：
  - 当前 trending 的 done repo 留在 board。
  - reuse repo 不进入 LLM 分析路径。
  - light 输出和校验包含 `highlight`。
  - `npm run verify` 与 `node scripts/eval-projects-coverage.mjs` 通过。
  - `.agent/codex-board-display-report.md` 写明根因、改法、测试证据、三窗卡数前后。

## 3. 方案（怎么做）
- 改动点：
  - `ledger.mjs`：`filterNewProjectCandidates` 改为 `{ accepted, reuse, skipped }`；done 且当前出现的 repo 放入 `reuse` 并更新 `last_seen_at`。
  - `sources.mjs`：discover 合并 `accepted + reuse` 进入 elite/board；accepted 标 `needsAnalysis:true`，reuse 标 `alreadyAnalyzed:true/needsAnalysis:false` 并尽量挂缓存分析。
  - `index.mjs`：analyze 步识别 reuse，跳过 LLM，使用缓存 analysis 或 deterministic light payload；`makeBoard` 正常排序展示两类。
  - `evaluate.mjs`：light prompt / normalize 新增 `highlight`，fallback 用确定性规则生成。
  - `validate-trending.mjs`：对新数据要求 light 项 highlight 非空；旧数据向后兼容。
  - tests：新增/扩展项目列测试。
- 数据契约/schema 变化（有则标 🔴 需 Kevin 签字）：
  - `highlight` 为新增公开字段，Kevin 已在本任务中明确要求；不改密钥/DB/schema。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - 单测：done-but-current trending 入 board；reuse 不触发 LLM；normalizeLightResult 含 highlight。
  - `node scripts/eval-projects-coverage.mjs`
  - `npm run verify`
  - `npm run ops:baseline:diff`
- 内容门（独立 agent + rubric）：
  - 本轮不自审；报告留给 Claude review，对照本 plan 大/小方向。
- 成功指标（真正证明"做对了"的 holdout/查询）：
  - 三窗 board card count 不因 ledger done 被截断；reuse 计数可追踪。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - codegraph 读调用面；PowerShell 运行测试/verify；`apply_patch` 编辑。
  - `npm run ops:baseline` 已先跑，收尾跑 baseline diff。
- 是否新增依赖：
  - 不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够？需要拆角色吗：
  - Codex 单主控实现 + 机器测试；独立 review 由 Claude 后续执行。
- 不上 LangGraph/CrewAI/AutoGen：
  - 本次是确定性脚本修复，不是每日管线重构。
- 是否用 dynamic workflow：
  - 否。

## 7. 切片（每片=可运行交付）
- 片 1：ledger/source 解耦，测试证明 done repo 留入候选。
- 片 2：reuse 分析缓存与跳过 LLM，测试证明不调 LLM。
- 片 3：highlight 字段、validate 和覆盖 eval/verify。
- 每片的"可运行、Kevin 能看到"是什么：
  - 最终 `public/data/trending.json` 生成/校验链可运行，报告给出三窗卡数前后。

## 8. 风险 / 回退
- 风险点：
  - 缓存来源字段不统一，需保守抽取，取不到降级 light highlight。
  - 当前工作树可能已有并行改动，不能回退他人文件。
- 回退方式（保留上一版）：
  - 改动集中在项目列脚本；可按文件 diff 精准回退本次变更。
