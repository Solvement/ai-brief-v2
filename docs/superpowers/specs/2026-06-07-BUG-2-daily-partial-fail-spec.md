# BUG-2 spec · daily 部分失败必须非零退出（不再静默发布）

> Owner: Codex. 来源 `docs/plans/plan-1-bugfix.md` BUG-2。**严格限定范围**：只改 `scripts/daily.mjs` + 新增 1 个测试文件。**不要碰其它任何文件**，不重构无关代码，不改各 column 的 daily.mjs。

## 问题（已查实，勿重新发现）
`scripts/daily.mjs:29` `if (results.every((r) => r.status === "failed")) throw` —— 只有**每一栏都失败**才抛错。单栏失败被 `runColumn`(75-88) 的 catch 吞成 `{status:"failed"}`，`main()` 正常返回，自运行 guard(148-153) 不置 `exitCode` ⇒ 进程 `exit 0`。结果：某栏挂掉后昨日数据被原样静默重发，无非零退出、无告警。踩了宪法「不过门不入库不发布」红线。

## 目标行为
1. **默认严格**：只要**任一栏 `status==="failed"`**，`main()` 必须 throw（→ guard 置 `process.exitCode = 1`）。
2. **显式放宽**：支持 `--allow-partial` flag —— 开启后恢复旧语义（仅**全部**失败才 throw），用于人工允许部分发布。
3. **失败可见**：throw 前把失败栏名打印到 **stderr**（如 `daily: FAILED columns: news, models`）。stdout 既有的 `printCombinedSummary` 逐栏状态保留不变（验收要看 stdout 列出失败栏）。
4. throw 的 Error 仍挂 `error.results = results`（保留现有契约）。

## 实现要求（最小改动）
- 在 `parseArgs` 增加 `allowPartial: false`，识别 `--allow-partial`（仅长 flag，无值）。`printUsage()` 的 Flags 段补一行说明。
- 新增并 **export** 纯函数，便于单测：
  ```js
  export function evaluateRunOutcome(results, { allowPartial = false } = {}) {
    const failed = results.filter((r) => r.status === "failed").map((r) => r.name);
    const allFailed = results.length > 0 && failed.length === results.length;
    const shouldFail = allowPartial ? allFailed : failed.length > 0;
    return { failed, allFailed, shouldFail };
  }
  ```
- `main()` 把 29-33 行替换为：调用 `evaluateRunOutcome(results, { allowPartial: options.allowPartial })`；若 `outcome.shouldFail` → `console.error(\`daily: FAILED columns: ${outcome.failed.join(", ")}\`)` 然后 throw 一个 Error（message 含失败栏；`error.results = results`）。否则 `return results`。
- **为可测**：给 `main` 增加可选第二参数做依赖注入，默认不变：
  ```js
  export async function main(argv = process.argv.slice(2), { runners } = {}) { ... }
  ```
  用 `runners?.news ?? (() => runNewsDaily(...))` 之类，让测试能注入一个会抛错的 runner，而**不触发真实管线/网络**。真实 CLI 路径行为完全不变（`runners` 为 undefined）。保持各栏现有的参数传递（projects 仍 `--limit 30 --radar-limit 30 ...passThrough`）。

## 测试（新文件 `scripts/__tests__/daily-partial-fail.test.mjs`，node:test）
注意：测试**不得**跑真实 column / 不触网。只用 `evaluateRunOutcome` 直测 + 用 `runners` 注入。
1. `evaluateRunOutcome`：
   - 全 ok → `shouldFail=false`。
   - 1 栏 failed（严格）→ `shouldFail=true`，`failed` 含该栏名。
   - 全 failed → `allFailed=true`，`shouldFail=true`。
   - `allowPartial=true` + 部分失败 → `shouldFail=false`。
   - `allowPartial=true` + 全失败 → `shouldFail=true`。
2. `main(["--only","news"], { runners: { news: () => { throw new Error("boom") } } })`（严格）→ **rejects**；catch 到的 `error.results` 里 news 的 status==="failed"。
3. `main(["--only","news"], { runners: { news: async () => ({ ok: true }) } })` → resolves（不抛）。
4. 注入两栏（一 ok 一 fail）+ `--allow-partial` → resolves（不抛）；不带 `--allow-partial` → rejects。

## 验收（机器 DONE）
- `node --test scripts/__tests__/daily-partial-fail.test.mjs` 全绿。
- `node --test scripts/__tests__/*.test.mjs` 仍全绿（无回归）。
- 全局门 `npm run build && npm run lint && npm run validate` 全绿。
- 人工核对：单栏失败时 `main()` 走 throw 路径（guard→exitCode 1），stderr 出现 `FAILED columns:`，stdout 仍有逐栏 summary。

## 禁止
- 不改各 `scripts/columns/*/daily.mjs`。
- 不引第三方依赖。
- 不动 SEC-1 已落地的文件。不重构 printCombinedSummary/summarizeResult 的输出格式。
