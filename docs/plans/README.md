# AI-Brief 实施计划（供 Claude Code 执行）

> 来源：2026-06-07 子-agent 审计 + 目标差距评估（codegraph 导航，每条结论已回查源码）。
> 两份计划：
> - **`plan-1-bugfix.md`** —— 修复审计发现的红线违规 / 安全 / 死代码 / 技术债。
> - **`plan-2-goal-gap.md`** —— 补齐与北极星（L0→L1）的差距：前端投递、L0 语料底座、解读护城河。

## 怎么读这些计划（约定）

1. **一任务一分支**：每个任务有稳定 ID（如 `BUG-1`/`COR-3`），独立可实现。分支名建议 `fix/<ID>-<slug>` 或 `feat/<ID>-<slug>`。
2. **任务结构**：每条都给 `优先级 / Owner / 需签字 / 问题(带 file:line 证据) / 改动 / 验收(命令或断言) / 依赖`。**证据已查实，不要重新发现，直接改。**
3. **验收 = 机器 DONE**：每条带"验收"命令；跑通才算完成（对齐宪法的验收门文化）。改完整体过 `npm run build` + `npm run validate`。
4. **Owner**：`Claude` = 前端/架构/小改/review；`Codex` = 后端工程实现（按本 spec，不扩范围）。
5. **🔴 需 Kevin 签字（红线）**：凡涉及 **DB schema 变更 / 生产数据或文件删除 / 权限·密钥改动 / 首次上线策略** 的任务，标 `🔴 需签字`——**实现前必须先问 Kevin**，不要自动执行。
6. **顺序**：先做 `P0`，再 `P1`，最后 `P2`；同优先级按表内顺序（前者常为后者铺垫）。

## 主索引

### Plan 1 · Bugfix / Hardening
| ID | 优先级 | 标题 | Owner | 🔴 |
|---|---|---|---|---|
| BUG-1 | P0 | CI 无门发布 → 加门或下线 CI 发布路径 | Codex | 🔴 |
| BUG-2 | P0 | 部分失败静默发布 → 任一栏失败即非零退出 | Codex | |
| BUG-3 | P1 | `lint` 是壳 → 接真 ESLint + 内容 lint | Codex | |
| BUG-4 | P1 | 校验只查 3 字段、不查新鲜度 → 加新鲜度/字段断言 | Codex | |
| BUG-5 | P1 | boot 门与文档不符 → 补门或改文档（择一，去掉夸大）| Claude | |
| SEC-1 | P0 | `models/refresh` 无鉴权 → 补 REFRESH_TOKEN 门 | Claude | |
| SEC-2 | P1 | `feedback` 无限流/不限长 → 加限流+长度上限 | Claude | 🔴(若改 RLS) |
| SEC-3 | P2 | token 比较非常量时间 + 补 `.env.example` | Claude | |
| SEC-4 | P2 | GH Actions 输入插值 → 走 env | Claude | |
| SEC-5 | P2 | arxiv id 入路径未 slugify → 加固 | Codex | |
| DATA-1 | P0 | 记录缺 provenance/version/quality_signals → 补字段+强制 | Codex | 🔴 |
| DATA-2 | P1 | 冷读门被 grandfather 架空 → 新条目必须过审 | Codex | 🔴(策略) |
| DATA-3 | P1 | 引用却不存在的文件 → 建 `specs/quality-gate.md` | Claude | |
| CLEAN-1 | P1 | 删 ~698MB gitignore 垃圾（logs/ 等）| Claude | 🔴(删除) |
| CLEAN-2 | P1 | 删 3 个死文件 + 5 个死接口 | Claude | 🔴(删除) |
| CLEAN-3 | P2 | `brief-wiki/`、`samples/` 去留 | Claude | 🔴(决策) |
| DEBT-1 | P1 | `npm test` glob 漏文件 → 扩到 `scripts/**` | Claude | |
| DEBT-2 | P1 | 去重账本 `ledger.mjs` 零测试 → 补单测 | Codex | |
| DEBT-3 | P2 | ~100 个 `.mjs` 不被类型检查 → 加 checkJs | Codex | |
| DEBT-4 | P2 | `fetchWithRetry` 三处重复 → 提到 `lib/http.mjs` | Codex | |

### Plan 2 · Goal-Gap（北极星）
| ID | 优先级 | 标题 | Owner | 🔴 |
|---|---|---|---|---|
| FE-1 | P0 | 论文深读加"折叠线头"(渐进式披露) | Claude | |
| FE-2 | P0 | Home 别再内联 738KB trending | Claude | |
| FE-3 | P1 | `TierTemplateDeepDive` 恢复判断栏+折叠 | Claude | |
| FE-4 | P1 | 收敛 3 markdown 渲染器 + 4 深读模板 | Claude | |
| FE-5 | P2 | a11y 95→100（tab 语义）| Claude | |
| FE-6 | P2 | 删残留路由（与 CLEAN-2 合并）| Claude | |
| COR-1 | P0 | 原语 embedding 索引 + `findRelated()`（解锁 L1）| Codex | 🔴 |
| COR-2 | P1 | KG build 接进每日 + `design_principles` 设必填 | Codex | |
| COR-3 | P1 | 修 projects→AutoSci 零产出（259 跑 0 原语）| Codex | |
| COR-4 | P1 | 4 数据源裂解 → 收敛单一真相 | Codex | 🔴 |
| COR-5 | P1 | 北极星 eval 断言底座(非仅文件存在) | Codex | |
| COR-6 | P2 | 服务索引增量化/分页（trending/archive 膨胀）| Codex | |
| CON-1 | P0 | 写 `docs/paradigms/papers.md`（固化 A 级解读）| Claude | |
| CON-2 | P0 | 项目 Tier2/3 强制真·横向对比 | Codex | |
| CON-3 | P1 | 模型卡换强模型 + 修版本漂移 + 当天核验 | Codex | |
| CON-4 | P1 | 项目自报数字打"自报/自称"标 | Codex | |
| CON-5 | P2 | 冷读核验前向引用 arXiv ID | Codex | |

## 建议落地顺序（最高性价比在前）
1. **CLEAN-1/2**（立刻回收 698MB + 清死码，零风险，先把地基扫干净）。
2. **SEC-1**（一行门，堵掉无鉴权接口）。
3. **BUG-1 + BUG-2**（堵住"无门/静默发布"——你最在意的红线）。
4. **CON-1 + FE-1**（固化 A 级论文解读 + 旗舰渐进式披露——护城河兑现到前端）。
5. **COR-1**（embedding 检索层——解锁北极星 L1，工作量最大，放在地基稳了之后）。
