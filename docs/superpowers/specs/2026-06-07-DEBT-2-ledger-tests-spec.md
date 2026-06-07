# DEBT-2 spec · 去重账本 ledger.mjs 补单测

> Owner: Codex. 来源 `docs/plans/plan-1-bugfix.md` DEBT-2。依赖 DEBT-1（test glob 已扩到 `scripts/**`，新测试会被 `npm test` 收到）。
> **严格限定范围**：只**新增 1 个测试文件** `scripts/columns/papers/ledger.test.mjs`。**不要改 `ledger.mjs` 或任何其它文件**（它已 export 所需函数）。

## 背景（已查实，勿改源码）
`scripts/columns/papers/ledger.mjs` 是论文管线"是否已见过/已处理"的**唯一真相源**，却在测试里零引用。回归会静默漏论文或重复发布。已导出的可测函数：`normalizeTitle`、`ledgerKey`、`upsertSeen`、`isDone`、`DONE_STATUSES`、`LEDGER_FILE`、`readLedger`、`writeLedger`。本任务**只测纯逻辑**，不碰真实账本文件 `data/papers/ledger.jsonl`（测试不得读写它）。

关键不变量（来自源码，测试要锁定它们）：
- `ledgerKey({arxiv_id})` → `arxiv:<id>`，arxiv_id 存在时**完全忽略** title/url；无 arxiv_id 时 → `title:<normalized_title||"">::<hf_paper_url||"">`。
- `DONE_STATUSES = {deep_read, analyzed, published}`；`isDone(rec)` = `rec && DONE_STATUSES.has(rec.status)`。
- `upsertSeen(map, candidate, {date, source})`：
  - 新 key → 建记录，`status:"new"`，`first_seen_date=date`，`first_seen_source=source`，`all_seen_sources=[source]`，返回 `{record, isNew:true}`。
  - 已存在 key（重现）→ **只 widen `all_seen_sources`**（去重并入 source），title 缺失则回填，**绝不降级 status、绝不重置 first_seen**，返回 `{record, isNew:false}`。

## 测试用例（`node:test` + `node:assert/strict`，纯内存 Map，不触磁盘）
1. **ledgerKey 碰撞/去重**：
   - 同一 `arxiv_id`、不同 title/url → **同一 key**。
   - 不同 `arxiv_id` → 不同 key。
   - 无 arxiv_id：相同 `normalized_title`+`hf_paper_url` → 同 key；任一不同 → 不同 key。
   - arxiv_id 存在时即便 title/url 不同也只看 arxiv（断言忽略 title/url）。
   - 空对象 / 无参 → 稳定 `title:::`（`title:::` 形态），不抛错。
2. **DONE_STATUSES 排除**：
   - `isDone({status})` 对 `deep_read`/`analyzed`/`published` = true。
   - 对 `new`/`triaged`/`undefined`/未知状态 = false；`isDone(null)`/`isDone(undefined)` = false（不抛）。
3. **重复 arxiv_id 幂等**：
   - 新建 `map=new Map()`；`upsertSeen(map, {arxiv_id:"2606.01993", title:"X"}, {date:"2026-06-07", source:"hf"})` → `isNew:true`，`map.size===1`，record.status==="new"，first_seen_date/source 正确，all_seen_sources===["hf"]。
   - 同 arxiv_id 再 upsert（`source:"arxiv"`, 另一 date）→ `isNew:false`，**`map.size 仍 ===1`**，status 仍 "new"（未降级），**first_seen_date/first_seen_source 不变**（保持首见值），all_seen_sources 含 ["hf","arxiv"]（去重、不重复）。
   - 对已 `status:"deep_read"` 的存在记录再 upsert 重现 → status **仍 deep_read**（不被 "new" 覆盖），isNew:false。
   - title 回填：existing 无 title、candidate 有 title → upsert 后 existing.title 被填上。
   - 无 arxiv 的 title-fallback 去重：两次 upsert 同 `normalized_title`+`hf_paper_url`（无 arxiv_id）→ map.size===1。
4.（可选，增益）**normalizeTitle**：小写化、标点折叠为单空格、首尾 trim、保留 CJK（如 `"  Hello,  世界!! "` → `"hello 世界"`）。

## 验收（机器 DONE）
- `node --test scripts/columns/papers/ledger.test.mjs` 全绿。
- `npm test` 仍全绿，且测试总数较 DEBT-1 后（159）**增加**（新文件被收到）。
- 全局门 `npm run build && npm run lint && npm run validate` 全绿（注意：`npm run lint` 现为真 ESLint，新 `.mjs` 测试文件在 scripts/ 下 → console.* 允许，但仍不要留未用变量为 error；保持 0 error）。

## 禁止
- 不改 `ledger.mjs` 及任何其它源文件。
- 测试不得读写真实 `data/papers/ledger.jsonl`（只用内存 Map / 假数据）。
- 不引第三方依赖。
