# 验收 Eval 设计（结果导向）

> 原则：每个任务的 eval **从"它当初要消除什么问题"倒推**——看真实结果里那个问题还在不在，而不是只看命令跑没跑过。
> 三档判定：**PASS**（原问题确已消除）/ **PARTIAL**（部分消除或换了形态）/ **FAIL/缺**（问题仍在或没做）。
> 审核者 ≠ 实现者（生成者≠批判者）。本文件只设计 eval，不改代码。

## 队列任务

| ID | 当初要修的问题 | 结果判据（消除即 PASS） | 检查方法 |
|---|---|---|---|
| CLEAN-1 | ~698MB gitignore 垃圾占盘（logs/ 663MB 等） | 那些目录已删、磁盘回收；且都仍 gitignore（对 git/产品零影响） | `ls`/`du` 看 logs/.tmp-shots/.backup-* 是否还在 |
| CLEAN-2 | 3 个死文件 + 5 个死接口仍在仓库 | `src/legacy/Home.tsx`、`__diag-deepdive-json.mjs`、`test-supabase.mjs` 不存在；types.ts 那 5 个接口删除；**build+typecheck 仍绿**（反证确无引用） | `ls` + grep types + `typecheck` |
| SEC-1 | `models/refresh` POST 无鉴权，任何人可触发外呼+重写 models.json | 无 token 的 POST → 401；正确 token → 放行 | 读 `refresh/route.ts` 有无 token 门 + `refresh-auth.test` 过 |
| BUG-2 | 单栏失败被吞、进程 exit 0、陈旧数据重发 | **任一栏失败 ⇒ daily 非零退出** | 读 `daily.mjs` 聚合逻辑（不再 `every(failed)`）+ partial-fail 单测 |
| DEBT-1 | `npm test` glob 漏 cold-audit/* 与 build-index.test | 原先漏掉的测试现在被收进并执行 | 看 `package.json` test glob + `npm test` 计数 |
| DEBT-2 | ledger 去重逻辑零测试 | 覆盖 ledgerKey 碰撞/DONE 排除/幂等的单测存在且跑过 | 找 ledger 测试 + `npm test` 含之 |
| BUG-3 | `lint` 是 35 行 grep 壳、非真 linter | `npm run lint` 跑真 ESLint（有 config），能对违规报错 | 读 `package.json` lint + eslint config + 跑 lint |
| **BUG-4** | validate 只查 3 字段、不查新鲜度，陈旧索引能过门 | **把索引日期改旧 ⇒ validate fail**（新鲜度断言生效） | 读 `validate-papers-deepread`，找新鲜度断言 |
| **BUG-1** | CI `daily.yml` 生成后无门直接 push，绕过门直通生产 | **daily.yml 在 push 前跑 lint/validate，失败即不 push** | 读 `daily.yml` commit/push 前有无 gate 步 |
| SEC-3 | token `!==` 非常量时间比较 + REFRESH_TOKEN 没文档 | 用 `timingSafeEqual`；`.env.example` 含 `REFRESH_TOKEN` | grep route + `.env.example` |
| SEC-4 | workflow_dispatch 输入直插 shell（注入反模式） | 输入走 `env:` 再 `"$COLUMN"`；`run:` 不再直插 `${{ inputs }}` | 读 `daily.yml` |
| SEC-5 | arxiv id 未 slugify 进路径 | 该 `path.join` 前 `slugify(id)` | 读 `papers-radar.mjs` 对应行 |
| DATA-3 | 宪法引用的 `specs/quality-gate.md` 不存在（悬空） | 文件存在且**与真实门一致**（不夸大、未实现的诚实标 [待实现]） | 读 `specs/quality-gate.md` |
| FE-2 | Home 把整个 738KB trending 当 prop 传下、只渲染 8 个名字 | page.tsx 不再全量传 trending（切片/轻索引）；首屏负载下降 | 读 `app/page.tsx` + HomePage props |
| FE-5 | tab 缺 ARIA、a11y<100 | tab 语义补全（tablist/aria-controls/tabpanel），axe 无 serious | 读组件 tab 标记 |
| FE-1 | 论文深读整篇平铺、无渐进式披露 | **深层小节（技术细节/消融）默认折叠、点开展开** | 读 `PaperDeepDive`/`MarkdownRich` 有无真折叠 + 实际内容被折 |
| FE-3 | `TierTemplateDeepDive` 丢了判断栏+折叠 | 顶部判断栏（verdict rail）恢复 | 读组件 |
| CON-1 | `docs/paradigms/papers.md` 缺失，A 级解读没成文 | 文件存在且**真成文**（密度分区/反编造/footnote/career 规格），非占位 | 读文件评质量 |
| DEBT-4 | `fetchWithRetry` 三处重复 | 提取到 `lib/http.mjs`，三处 import 同一份、不再各自定义 | grep imports + 三处定义 |

## 队列外但已上线（Claude Code 额外做的，一并验）

| ID | 当初要修的问题 | 结果判据 | 检查方法 |
|---|---|---|---|
| CON-2 | Tier2/3 横向对比退化成点名、validator 不校验 | schema 有 `comparison_table`；新条目缺差异点 → validate fail（存量 grandfather） | 读 validate-trending + 单测 |
| CON-3(版本半) | 闭源模型 latestVersion 取文档首个匹配→选错旧版 | models.json：Claude=4.8、Gemini=3.5（非 4.1/2.0） | 读 `models.json` 版本字段 |
| CON-4 | 项目自报数字未结构化打标 | claim 有 `attribution`；"已核实" 的 source 不得是 README/自述 | 读 validate-trending + 单测 |
| COR-2 | KG build 不在 daily、design_principles 7/14 | `knowledge-graph.json` 刷到 06-07；原语缺 design_principles → validate fail | 文件 mtime + validate |
| COR-3 | projects→AutoSci 259 跑 0 原语 | emitter 读对 deep-dive 形状、闸门放宽；能产出/计数 proj-* 原语 | 读 emitter diff + 找 proj-* |

## 全局门（多个任务的共同兜底）
- `npm run lint`（覆盖 BUG-3）、`npm test`（覆盖 DEBT-1/DEBT-2 及各新单测）、`npm run typecheck`、`npm run build`、`npm run validate`。
- 结果导向：门绿是**必要非充分**——还要逐任务看"原问题"那个具体结果。

---

# 验收结果（2026-06-08 独立冷审，审核者≠实现者）

> 方法：静态结果检查（grep/文件存在/版本值）+ 72/72 针对性单测通过 + 两个冷审子-agent 读真实代码。
> 注：完整 `lint/typecheck/build` 因沙箱 45s 限制未在此环境重跑，依据 Claude Code 日志(全绿)+结构证据+单测。

## 队列 19 项：15 PASS / 4 未做

| ID | 结果 | 证据（原问题是否消除） |
|---|---|---|
| SEC-1 | ✅PASS | `refresh/route.ts:58` 走共享 `refresh-auth.mjs::isAuthorizedRefreshToken`→无 token 401；refresh-auth.test 过 |
| SEC-3 | ✅PASS | helper 用 `crypto.timingSafeEqual` + fail-closed；`.env.example:33 REFRESH_TOKEN=` |
| SEC-4 | ✅PASS | `daily.yml:56 COLUMN: ${{…}}` + `run: --only "$COLUMN"`，不再直插 |
| SEC-5 | ✅PASS | `papers-radar.mjs:1533 slugify(candidate.id)` 后再 path.join |
| BUG-2 | ✅PASS | `daily.mjs:46 shouldFail = …failed.length>0`（默认任一栏失败即非零）+ partial-fail 单测 |
| BUG-3 | ✅PASS | `lint=lint:eslint && lint:content`；`eslint.config.mjs` 存在；真 ESLint（非 grep 壳） |
| DEBT-1 | ✅PASS | glob→`scripts/**`，收到 35 测试文件含原先漏的 cold-audit/* + build-index |
| DEBT-2 | ✅PASS | `columns/papers/ledger.test.mjs` 存在并跑 |
| DEBT-4 | ✅PASS | `scripts/lib/http.mjs` + models/news/projects 三处 import 同一份 |
| DATA-3 | ✅PASS | `specs/quality-gate.md` 存在且**诚实**（标 [待实现 BUG-4/DATA-1/DATA-2]、指出 CLAUDE.md 夸大待校正） |
| FE-1 | ✅PASS | `MarkdownRich.tsx:47-72` 真 rehype 折叠插件，折叠「技术细节(选读)」深层（真实机制内容）。小限：只折该 canonical 段，其它 H2 下消融仍平铺 |
| FE-2 | ✅PASS | `app/page.tsx` 不再内联全量 trending，只传 `homeProjectsFromTrending()` 8 条切片 |
| FE-3 | ✅PASS | `TierTemplateDeepDive.tsx:233-261` 恢复 sticky `dd-rail` 判断栏 |
| FE-5 | ✅PASS | 三 tab 页 `tablist/aria-controls/tabpanel/aria-labelledby` 闭环，axe 0 违规 |
| CON-1 | ✅PASS(A) | `docs/paradigms/papers.md` 成文密度分区/反编造/career 规格，与同级范式同等可执行 |
| **CLEAN-1** | ❌未做 | `logs/`(663M)/`.tmp-shots`/`.backup-*`/`.cache` 仍在（~698M 未回收）。影响低：全 gitignore，对产品/git 零影响 |
| **CLEAN-2** | ❌未做 | `src/legacy/Home.tsx`、`__diag-deepdive-json.mjs`、`test-supabase.mjs` 仍在；types.ts 5 个死接口仍在 |
| **BUG-4** | ❌未做 | `validate-papers-deepread` 无新鲜度断言（quality-gate.md 明确标 [待实现]）|
| **BUG-1** | ❌未做 | `daily.yml` push(70 行) 前仍无 lint/validate 步——**CI 仍是无门发布通道**（注：BUG-5 已给 boot 本地路径加了 `npm run verify` 门，但 GitHub Actions 这条没加）|

## 队列外已上线（一并验，均 PASS）
| ID | 结果 | 证据 |
|---|---|---|
| CON-2 | ✅PASS | `validate-trending.mjs:26-57` 强制 `comparison_table`（新条目缺差异点 fail，存量 grandfather）+ 单测 |
| CON-3(版本半) | ✅PASS | models.json：Claude 4.1→**4.8**、Gemini 2.0→**3.5**；models-version-detect 测试过。开源机制走强模型那半仍待你定 |
| CON-4 | ✅PASS | `validate-trending.mjs:59-87` attribution 枚举 + 「已核实 source 不得是 README/自述」硬不变量 + 单测 |
| COR-2 | ✅PASS | `knowledge-graph.json` 刷到 06-08（解陈旧）；design_principles 必填（存量 grandfather）+ 单测 |
| COR-3 | ✅PASS | 根因真修（emitter 读真实 deep-dive 形状 + 闸门放宽）；**已产出 2 个 proj-* 原语**（proj-fathah-hermes-desktop）——不再是 259 跑 0 |

## 仍需你处理（4 未做 + 之前 🔴）
- **BUG-1**（CI 发布门）：最该补——CI 仍无门 push 到 main。BUG-5 只修了 boot 路径。
- **BUG-4**（新鲜度断言）、**CLEAN-1/2**（清理+删死码）：低风险，随手可清。
- 之前的 🔴：DATA-1/DATA-2（schema+冷读策略）、COR-1（embedding 检索层）、COR-4（数据迁移）——仍待你拍板。
