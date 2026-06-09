# Plan 1 · Bugfix / Hardening

> 修复 2026-06-07 审计发现。每条带 file:line 证据（已查实）+ 验收命令。约定见 `./README.md`。
> 标 🔴 的任务**实现前先问 Kevin**（删除/ schema / 权限 / 上线策略）。

---

## A. 发布门（最要命的一簇 —— 直接踩"不过门不入库不发布"红线）

### BUG-1 · CI 完全无门发布  `[P0] Owner:Codex 🔴需签字(上线策略)`
**问题**：`.github/workflows/daily.yml` 流程 = checkout → `npm ci`(39) → 装 hf CLI(43) → `npm run daily`(54) → 直接 `git add public/data data` → commit → `git push origin "HEAD:${GITHUB_REF_NAME}"`(60-67)。生成与上线之间**无任何 lint/validate/test/build**（对整文件 grep `lint|validate|test` 零命中）。这是绕过本地 boot 门、直通生产的第二通道。
**决策点(问 Kevin)**：CI 到底是不是发布路径？运行模型写的是"本地订阅开机更新"。
- 选项 A：CI 仅做校验、**不 push**（删 commit/push 步，或改成开 PR）。
- 选项 B：CI 保留为发布路径，但在 push 前插门。
**改动(选 B 时)**：在 "Run daily refresh" 与 "Commit data changes" 之间加一步 `run: npm run validate && npm run lint`（理想为 `npm run verify`），失败即 job 失败→不 push。
**验收**：构造一次会被 validate 拒的产出 → CI job 红、`public/data` 无新 commit。
**依赖**：与 BUG-2/BUG-3/BUG-4 协同（门的内容由它们定义）。

### BUG-2 · 部分失败会静默发布  `[P0] Owner:Codex`
**问题**：`scripts/daily.mjs:29` `if (results.every(r => r.status === "failed")) throw` —— **只有每一栏都挂**才抛错；单栏失败时 catch 吞掉(83-86)、进程 `exit 0`。叠加 `validate-papers-deepread.mjs:50` 只查 `paper_id/title/status`、不查新鲜度 → 某栏挂掉后昨日数据被原样重发，无告警。
**改动**：把聚合逻辑改为"**任一栏 failed ⇒ 非零退出**"（或允许 `--allow-partial` 显式开关，默认严格）；失败栏名打印到 stderr。
**验收**：mock 一栏抛错 → `npm run daily` 退出码 ≠ 0，且 stdout 列出失败栏。
**依赖**：BUG-1（CI 靠非零退出来挡 push）。

### BUG-3 · `lint` 是个壳，不是 linter  `[P1] Owner:Codex`
**问题**：`scripts/lint.mjs`（~35 行）只 grep `console.log` / `const mock`。CLAUDE.md 宣称的"内容 lint 全绿"名不副实。
**改动**：接 ESLint（`eslint` + 适配 Next/TS 的 config，覆盖 `app/ src/ scripts/`），保留并扩充"内容 lint"（中文乱码、禁 `console.log`、未标注的"最新"声明等）为独立规则集；`npm run lint` 串起两者。
**验收**：种一个明显违规（如 `app/` 里裸 `console.log`）→ `npm run lint` 非零退出；清掉后变绿。

### BUG-4 · 校验只查 3 字段、不查新鲜度  `[P1] Owner:Codex`
**问题**：`validate-papers-deepread.mjs:50` 仅 `for (const f of ["paper_id","title","status"])`。无新鲜度、无 schema 完整性。
**改动**：加（a）新鲜度断言：`papers-index.json` 当日（或 ≤N 天）有更新，否则 fail；（b）必填字段扩到 schema 全集（与 DATA-1 对齐）。
**验收**：把索引日期改成 7 天前 → `npm run validate` fail。
**依赖**：DATA-1（字段集）。

### BUG-5 · boot 门与文档不一致  `[P1] Owner:Claude`
**问题**：`scripts/boot-daily.ps1:40-43` 实际只 `npm run lint` + `npm run validate`；CLAUDE.md/宪法宣称"build/测试/Lighthouse>90/视觉回归/内容 lint 全绿"——6 门只跑 2。
**改动(择一，去掉夸大)**：要么把 `npm run verify`(lint+test+build) 与 validate 真接进 boot；要么把 CLAUDE.md/宪法的验收门描述改成与现状一致，并明确"Lighthouse/视觉回归"为人工/CI 阶段。**文档不能宣称未运行的门。**
**验收**：boot 脚本里跑的门 = 文档列出的门（人工核对一致）。

---

## B. 安全（两个无鉴权写接口）

### SEC-1 · `models/refresh` 无鉴权  `[P0/Med] Owner:Claude`
**问题**：`app/api/models/refresh/route.ts:51` 的 `POST` 无任何 token 检查；兄弟接口 `app/api/models/analyze/route.ts:39` 有 `if (!token || token !== process.env.REFRESH_TOKEN)`。任何人可触发对全部 vendor 的外呼 + 重写 `public/data/models.json`。
**改动**：在 refresh 的 POST 顶部复用同样的 `REFRESH_TOKEN` 门（建议抽成共用 `assertRefreshToken(req)`）。
**验收**：无 token POST `/api/models/refresh` → 401；带正确 token → 200。

### SEC-2 · `feedback` 无限流、不限长、绕过 RLS  `[P1] Owner:Claude 🔴(若改 RLS)`
**问题**：`app/api/feedback/route.ts:33` 用 `getSupabaseAdmin()`(service_role 绕过 RLS) 做未鉴权 upsert；`item_title`(57)/`note`(61) 仅 `String()` 不限长。刷库/存储滥用面。
**改动**：（a）`note`/`item_title` 加长度上限（如 2k/200）；（b）加简单限流（IP/分钟）；（c）评估改用 anon + 一条仅允许 insert feedback 的 RLS 策略，替代 service_role —— **此项改 DB 策略，先问 Kevin**。
**验收**：超长 note → 400；高频请求 → 429。

### SEC-3 · token 常量时间比较 + 补 env 文档  `[P2] Owner:Claude`
**问题**：`analyze/route.ts:39` 用 `!==`（时间侧信道）；`REFRESH_TOKEN` 未写进 `.env.example`。
**改动**：改 `crypto.timingSafeEqual`；`.env.example` 增 `REFRESH_TOKEN=`。
**验收**：构建通过；`.env.example` 含该键。

### SEC-4 · GH Actions 输入插值进 shell  `[P2] Owner:Claude`
**问题**：`daily.yml:54` `--only "${{ github.event.inputs.column || 'all' }}"` 把 dispatch 输入插进 `run:`（虽是 enum，仍是脚本注入反模式）。
**改动**：经 `env: COLUMN: ${{ ... }}` 传入，`run:` 里引用 `"$COLUMN"`。
**验收**：手动 dispatch 各 column 仍正常；YAML 无直接 `${{ inputs }}` 插值。

### SEC-5 · arxiv id 入文件路径未 slugify  `[P2] Owner:Codex`
**问题**：`scripts/papers-radar.mjs:1529/1541` `path.join(REVIEWED_DIR, \`${candidate.id}-${DATE}.json\`)` 未对 id slugify（冷读侧 `orchestrator.mjs:198` 已 slugify）。源是 HF 结构化 ID，遍历仅理论风险，做防御加固。
**改动**：此处也 `slugify(id)`。
**验收**：含 `/` 的伪 id 不会逃出 `REVIEWED_DIR`。

---

## C. 数据模型红线

### DATA-1 · 记录缺 provenance/version/quality_signals  `[P0/High] Owner:Codex 🔴需签字(schema)`
**问题**：抽样 `content/papers/*/metadata.json` 的 keys 无这四个字段；全仓 `grep -c`：`embedding=0`、`quality_signals=0`、`provenance` 仅遗留 `articles.json`。宪法："每条记录必带 provenance/version/embedding/quality_signals"，且无校验强制。（`embedding` 单独在 Plan 2 `COR-1` 处理，因它是底座工程。）
**改动**：在记录 schema（`scripts/brief/schema/` + `src/types.ts`）加 `provenance`(源+抓取时间+生成模型)、`version`(schema/内容版本)、`quality_signals`(评分/冷读结论摘要)；各 column 生成器写入；`validate` 强制必填。**schema 变更先问 Kevin**。
**验收**：新生成记录含三字段；缺任一 → `npm run validate` fail。

### DATA-2 · 冷读门被 grandfather 架空  `[P1] Owner:Codex 🔴(策略需签字)`
**问题**：`scripts/columns/papers/build-index.mjs:39-43` `coldAuditAllowsPublish` 在 `cold_audit` **缺失时返回 true**；15 篇里 14 篇 `grandfathered`，仅 `2512.08924` 真过审。新深读若不带 `cold_audit` 直接可发。
**改动(问 Kevin 定策略)**：仅对**存量 14 篇**保留 grandfather 白名单；**此后新条目**缺 `cold_audit` 或未 `ready_to_publish` → 排除出 index。
**验收**：造一条无 `cold_audit` 的新深读 → 不进 `papers-index.json`；存量 14 篇仍在。

### DATA-3 · 引用却不存在的规则文件  `[P1] Owner:Claude`
**问题**：宪法两处引用 `/specs/quality-gate.md`，`specs/` 目录不存在。（`docs/paradigms/papers.md` 缺失见 Plan 2 `CON-1`。）
**改动**：建 `specs/quality-gate.md`，把现有质量门规则（at-birth reviewer + 独立冷读、字段/新鲜度 lint、不过门不入库）成文，与 BUG-3/BUG-4/DATA-1/DATA-2 的实现对齐。
**验收**：文件存在且与代码里实际门一致；宪法链接不再悬空。

---

## D. 清理（低风险、先做爽）

### CLEAN-1 · 删 ~698MB gitignore 本地垃圾  `[P1] Owner:Claude 🔴(删除需确认)`
**问题**：`logs/`(663MB/15,980 文件)、`.tmp-shots/`(23MB)、`.backup-2026-06-01-*` + `.backup-pre-rebuild`(~10MB)、`.cache`(2.2MB)、`tmp-edge-profile`(空)——全部 gitignore，对 git 零影响。
**改动(确认后执行)**：
```bash
rm -rf logs .tmp-shots .backup-2026-06-01-pre-reanalyze .backup-2026-06-01-pre-rerun2 .backup-pre-rebuild .cache tmp-edge-profile
```
（建议保留 `logs/` 的目录、加 `logs/.gitkeep`，若流水线要写日志。）
**验收**：`du -sh .` 显著下降；`npm run build` 仍通过。

### CLEAN-2 · 删 3 个死文件 + 5 个死接口  `[P1] Owner:Claude 🔴(删除需确认)`
**问题(codegraph `callers`+import-grep 证零引用)**：`src/legacy/Home.tsx`（**注意**：`src/legacy/` 另 7 个文件是活的，勿删）、`scripts/columns/projects/__diag-deepdive-json.mjs`、`scripts/test-supabase.mjs`；`src/types.ts` 中 `RepoSummary`/`ModelStatusCard`/`ModelIdentity`/`ModelEntryBase`/`PaperRadarPublicData` 仅在 types.ts 内出现。
**改动**：删上述 3 文件 + 5 个接口声明。
**验收**：`npm run build` + `npm run typecheck` 通过（证明确无引用）。

### CLEAN-3 · `brief-wiki/`、`samples/` 去留  `[P2] Owner:Claude 🔴(决策)`
**问题**：`brief-wiki/`(390 跟踪文件) 仍接 `/brief`（`scripts/brief/build.mjs`→`BriefDeepDive`），但疑被 `content/papers/` 新架构取代；`samples/`(4 文件) 代码零引用。
**改动(问 Kevin)**：确认 `/brief` 是否仍是活栏目；若废弃 → 连同 `app/brief/*`、`legacy/BriefDeepDive` 一并清理；`samples/` 确认后删。
**验收**：决策记录到 `memory/changelog.md`；若删，build 通过且导航无死链。

---

## E. 技术债

### DEBT-1 · `npm test` glob 漏文件  `[P1] Owner:Claude`
**问题**：`package.json:24` 仅匹配 `scripts/__tests__/*.test.mjs`，漏 `cold-audit/*.test.mjs`、`papers/build-index.test.mjs`（喂站点的索引）。~21 测试 / ~154 源文件。
**改动**：glob 扩到 `scripts/**/*.test.mjs`。
**验收**：`npm test` 输出里出现原先漏掉的 4 个测试文件。

### DEBT-2 · 去重账本零测试  `[P1] Owner:Codex`
**问题**：`scripts/columns/papers/ledger.mjs`（`upsertSeen`/`ledgerKey`/`isDone`，你"是否已发布"的唯一真相源）在 `__tests__` 零引用。回归会静默漏/重论文。
**改动**：补单测——`ledgerKey` 碰撞、`DONE_STATUSES` 排除、重复 arxiv_id 幂等。
**验收**：新测试随 `npm test` 跑并通过。
**依赖**：DEBT-1（先让 glob 能收到）。

### DEBT-3 · ~100 个 `.mjs` 不被类型检查  `[P2] Owner:Codex`
**问题**：`tsconfig.json` `include:["src","app"]` + `allowJs:false`，全部 `scripts/` 逻辑无静态检查。
**改动**：加 `scripts/jsconfig.json`（`checkJs:true` + JSDoc 渐进）或 `typecheck:scripts` 脚本；至少把关键 `lib/` 与 `columns/*/` 纳入。
**验收**：`npm run typecheck:scripts` 存在并能跑（容忍渐进式 JSDoc）。

### DEBT-4 · `fetchWithRetry` 三处重复  `[P2] Owner:Codex`
**问题**：`news/sources.mjs:499`、`models/sources.mjs:215`、`projects/sources.mjs:346` 各写一份；`scripts/lib/` 已存在可共用。
**改动**：提取 `scripts/lib/http.mjs`（带超时/重试/退避），三处改为引用。
**验收**：三处 import 同一 `lib/http.mjs`；相关测试通过。
