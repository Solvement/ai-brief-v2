# CON-4 spec · 项目自报数字打"自报/已核实"标（结构化归因）

> Owner: Codex. 来源 `docs/plans/plan-2-goal-gap.md` CON-4。
> **gate-safe 硬约束**：新校验**必须 grandfather 存量**——当前 trending.json 的 claim_ledger 没有 `attribution` 字段，缺字段一律放行，否则 `npm run validate` 立刻红、卡死后续。

## 问题（已查实）
家规「自报 vs 实测 / 已核实 vs 自称」只在模型栏结构化落实（`models/prompts.mjs:71,139` 每个 benchmark 标 `自报|实测`）。项目栏 prompt 虽有 prose 归因纪律（`projects/deepdive-prompts.mjs:140`「README 自称…不要写成事实」），但**无结构化标**，仍漏成事实直陈（如"在 LongMemEval-S 达 95.2% 召回率"未标）。

## 改动（范围：projects 生成 prompt + schema + validate-trending；**不改前端**）
### 1) schema：claim_ledger 项加 `attribution`（`scripts/columns/projects/deepdive-prompts.mjs` 的 `PROJECT_DEEP_DIVE_OUTPUT_SCHEMA.claim_ledger[]`）
```
claim_ledger: [{
  claim, plain_english, source, evidence_strength, supports, does_not_support, threat,
  attribution: "自报|已核实|不适用"   // 来自 README/官网/徽章/作者自述 的指标=自报; 仅有具名独立来源(第三方榜/评测/论文)可=已核实; 非指标类主张=不适用
}]
```
### 2) 生成 prompt（强化第 140 行的归因纪律，落到结构化字段）
- 每条带**数字/benchmark/覆盖率/百分比/"supports N"/最快·最佳·唯一**的 claim_ledger 项**必须**填 `attribution`。
- **README/artifact/官网/徽章/作者自述 来源 ⇒ `自报`**；`已核实` 仅当 `source` 指向**具名独立来源**（第三方 leaderboard/评测/论文，非本项目自己）。非指标性主张 ⇒ `不适用`。
- 重申：只点名来源不give 数字归因不算落实。

### 3) 校验器（`scripts/validate-trending.mjs`，复用 CON-2 已重构的 `validateRepo`/`validateTrendingData`）—— grandfather 安全
对 `repo.tier_template` 存在的项目，遍历 `repo.claim_ledger`（若存在且为数组）：
- **逐项 grandfather**：该项**无 `attribution` 字段** → 跳过（存量放行）。
- **有 `attribution`** → 校验：
  - 值必须 ∈ `{自报, 已核实, 不适用}`，否则 fail。
  - **硬不变量**：若 `attribution === "已核实"`，则该项 `source` **不得**是纯 README/artifact 自述（须含独立来源标识）。machine-check 取保守式：`已核实` 的 `source` 不得匹配 /README|artifact|官网|self|自述|自称/i 且不得为空；命中 ⇒ fail（"已核实 需具名独立来源，不能来自 README 自述"）。
- 注意：claim_ledger 在 `repo` 顶层还是 `repo.tier_template` 下，按实际产物结构定位（读 `deepdive-prompts.mjs` schema：claim_ledger 是顶层 output 字段，但落到 trending repo 上的位置以 brief-writer/index 实际写入为准——codex 按真实写入路径校验，找不到就按顶层 `repo.claim_ledger` 尝试，仍 grandfather 缺失）。

## 验收（机器 DONE）
- **基线绿**：当前 `npm run validate` 仍过（存量 claim_ledger 无 attribution → grandfather）。
- **能抓**：构造 claim_ledger 项 `{source:"README", attribution:"已核实"}` → fail；改 `自报` 或把 source 换成具名第三方 → pass；非法枚举值 → fail。补单测（grandfather / 非法值 / README+已核实 违规 / README+自报 合法），放 `scripts/__tests__/`，被 `npm test` 收到。
- 全局门 `npm run build && npm run lint && npm run validate` + `npm test` 全绿。

## 禁止
- 不改前端渲染。不对无 `attribution` 的存量项 fail（grandfather）。不引第三方依赖。不动其它 column。不破坏 CON-2 已加的 `comparison_table` 校验。
