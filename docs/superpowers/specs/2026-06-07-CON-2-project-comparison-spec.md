# CON-2 spec · 项目 Tier2/3 强制真·横向对比（结构化对比表 + gate）

> Owner: Codex. 来源 `docs/plans/plan-2-goal-gap.md` CON-2。
> **最高硬约束（防全局门崩）**：新校验**必须 grandfather 存量数据**——当前 `public/data/trending.json` 的 Tier2/3 条目没有结构化对比，若新校验对它们 fail，则 `npm run validate` 立刻红、卡死所有后续工作。**只对带新结构字段的条目强制；旧条目（无该字段）一律放行。**

## 问题（已查实）
项目范式硬规则："Tier2/3 价值 = 成熟度判断 + 横向对比，否则不合格"（`docs/paradigms/projects.md:36`）。但 `tier_template.comparison` 是自由文本（`deepdive-prompts.mjs:14`），实际退化成点名竞品、**零差异点**（如 agentmemory `similar_projects: 未在 README/artifact 说明,但常见竞争项如 mem0、Letta...`）。`validate-trending.mjs` 当前**完全不校验 tier_template/对比**。

## 改动（范围：生成 prompt + schema + 校验器；**不改前端渲染**）
### 1) schema：新增结构化对比表（`scripts/columns/projects/deepdive-prompts.mjs` 的 `PROJECT_DEEP_DIVE_OUTPUT_SCHEMA.tier_template`）
新增字段，**与现有 `comparison` 字符串并存**：
```
comparison_table: [   // Tier2/3 必填；1-2 个具名替代品；没真实依据则留空数组 [] 且 comparison 写 "数据不足"
  {
    alternative: "具名替代品（如 mem0 / Letta）",
    difference: "和本项目的具体差异点（机制/范围/接口），不是泛泛而谈",
    maturity_vs: "成熟度对比（star/活跃/release/生产就绪 谁更成熟）",
    tradeoff: "选它 vs 选本项目的取舍"
  }
]
```
`comparison`（字符串）**保留**：生成器把 `comparison_table` 汇总成一段中文 prose 写入 `comparison`（这样现有渲染 `formatNarrativeMarkdown(template.comparison)` 不变、无需改前端）。表为空则 `comparison="数据不足"`。

### 2) 生成 prompt（`deepdive-prompts.mjs` 第 14 行附近 + 第 157 行的 canonical 规则段）
- 强化要求：Tier2/3 **必须**产出 `comparison_table`（1-2 个具名替代品，每个含**真实 difference / maturity_vs / tradeoff**），**禁止只点名不给差异点**。没有任何可对比依据时，`comparison_table: []` + `comparison: "数据不足"`（诚实留空，不编造）。
- 明确："similar projects 仅点名（无差异点）不算横向对比；不合格。"

### 3) 校验器（`scripts/validate-trending.mjs`）—— grandfather 安全
在 `validateRepo` 里加（仅当 `repo.tier_template` 存在且 `project_tier ∈ {2,3}` 时）：
- **若 `tier_template.comparison_table` 字段缺失** → **跳过**（grandfather 旧条目，pass）。
- **若存在** → 必须满足其一，否则 fail：
  - (a) 是数组且 ≥1 项，每项 `alternative`/`difference` 为非空字符串（`maturity_vs`/`tradeoff` 建议非空，缺可 warn 不 fail）；或
  - (b) 是空数组 `[]` 且 `tier_template.comparison` 文本恰为 "数据不足"（诚实留空的合法出口）。
- `project_tier` 字段来源：`repo.project_tier`（见 `src/types.ts` AnalyzedRepo）。注意 `validateRepo` 现有逻辑只校验 `repo.deep`（旧 DeepDive 形）——本次新增对 `repo.tier_template` 的校验，**不动旧 deep 校验**。

## 验收（机器 DONE）
- **基线绿**：当前 `npm run validate` 仍通过（存量 Tier2/3 无 `comparison_table` 字段 → grandfather → pass）。
- **能抓**：构造一个带 `tier_template.comparison_table: []` 但 `comparison` 不为 "数据不足" 的假 Tier2 → validate fail；改成 ≥1 项有 alternative+difference（或 [] + "数据不足"）→ pass。给 `validate-trending`/项目相关补 1-2 个单测覆盖 grandfather + enforce 两路（放 `scripts/__tests__/` 或 `scripts/columns/projects/`，会被 `npm test` 收到）。
- 全局门 `npm run build && npm run lint && npm run validate` + `npm test` 全绿。

## 禁止
- 不改前端渲染组件（`comparison` 字符串保持可渲染；`comparison_table` 的前端展示是单独的 FE 跟进，不在本任务）。
- 不对存量无 `comparison_table` 的条目 fail（grandfather）。
- 不改 `repo.deep` 旧校验逻辑。不引第三方依赖。不动其它 column。
