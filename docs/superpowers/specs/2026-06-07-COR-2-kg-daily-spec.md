# COR-2 spec · KG build 接进每日 + design_principles 必填（gate-safe）

> Owner: Codex. 来源 `docs/plans/plan-2-goal-gap.md` COR-2。
> **gate-safe 硬约束**：14 个原语里**只 7 个有 `design_principles`**。把它设为必填若对存量 fail，`npm run validate` 立刻红。**必须 grandfather 存量缺失的原语**（implementation 时已存在的 id 进白名单），只对**新原语**强制。

## 问题（已查实）
- `scripts/kg/build-knowledge-graph.mjs` **不在** `package.json` / `scripts/daily.mjs` / boot 里。`public/data/knowledge-graph.json` 的 `generatedAt` 停在 **2026-06-05**，而 papers 索引已 6-6+，持续 stale。
- KG 的跨论文边 `shares_principle` 依赖原语的 `design_principles`，但 `data/autosci/primitives/*.yaml` 14 个里仅 **7** 个有（两条最新的丢了 = 回归）。

## 改动
### 1) 把 KG build 接进每日
- `package.json` 加脚本：`"kg:build": "node --no-warnings scripts/kg/build-knowledge-graph.mjs"`。
- `scripts/daily.mjs`：在 papers 步**之后**加一步跑 KG build（papers/原语先就绪，KG 才有料）。用现有 `runColumn("kg", () => runKgBuild())` 模式纳入聚合（沿用 BUG-2 的严格失败语义——KG build 失败应 surfacing）。`runKgBuild` import `build-knowledge-graph.mjs` 的 main/导出（若它没导出 main，codex 顺手加 `export async function main()` + self-run guard，**不改其构图逻辑**）。
- 目标：`npm run daily` 后 `knowledge-graph.json` 的 `generatedAt` = 当天。

### 2) design_principles 必填（grandfather）
- 找到原语的 lint/校验位置（候选：`scripts/validate-papers-deepread.mjs` 引用了 design_principles；原语抽取在 `scripts/columns/projects/autosci-primitives.mjs`）。在**校验**侧（进 `npm run validate` 的那个）加：每条 `data/autosci/primitives/*.yaml` 原语**必须有非空 `design_principles`**。
- **grandfather**：codex 枚举 implementation 时**已存在且缺 `design_principles`** 的原语 id，写进一个 `GRANDFATHERED_NO_DESIGN_PRINCIPLES` 集合；这些跳过。**不在白名单的（= 新原语）缺 `design_principles` → fail**。
- （可选增益）原语抽取 prompt/emitter 里把 `design_principles` 列为必产字段，减少未来回归。

## 验收（机器 DONE）
- **基线绿**：当前 `npm run validate` 仍过（7 个缺失的被 grandfather）。
- **KG 接线**：跑 `npm run kg:build`（或 `node scripts/kg/build-knowledge-graph.mjs`）→ `knowledge-graph.json` 的 `generatedAt` 刷成当天；`daily.mjs` 里能看到 KG 步（代码核对 + 单跑 KG 不报错）。**不要求**跑完整 `npm run daily`（含网络/重生成）。
- **必填生效**：造一条不在白名单、无 `design_principles` 的假原语对象喂校验 → fail；有则 pass。补单测覆盖 grandfather + enforce 两路（放 `scripts/__tests__/`）。
- 全局门 `npm run build && npm run lint && npm run validate` + `npm test` 全绿。

## 禁止
- 不改 `build-knowledge-graph.mjs` 的构图逻辑（只在需要时加 export/guard 以便 import）。
- 不对存量缺失原语 fail（grandfather）。不引第三方依赖。不动其它 column 的校验（CON-2/CON-4 的 trending 校验不动）。
- 不跑完整 daily（避免重生成/网络/烧 token）。
