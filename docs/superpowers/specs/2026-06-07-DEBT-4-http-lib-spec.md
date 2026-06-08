# DEBT-4 spec · 提取 fetchWithRetry 到 scripts/lib/http.mjs

> Owner: Codex. 来源 `docs/plans/plan-1-bugfix.md` DEBT-4。**纯重构,行为不变**。

## 问题（已查实）
`fetchWithRetry` 在三处各写一份:`scripts/columns/news/sources.mjs:499`、`scripts/columns/models/sources.mjs:215`、`scripts/columns/projects/sources.mjs:346`。重复实现,漂移源。

## 改动
1. 新建 `scripts/lib/http.mjs`,导出一个统一的 `fetchWithRetry(url, options)`(含超时/重试/指数退避)。**取三处实现里最完整/最稳的一份作为基准**;若三处签名/行为有差异,取并集做成可配置(如 `{ retries, timeoutMs, backoffMs }` 带合理默认),保证三个调用点现有行为不变。
2. 三处 `sources.mjs` 改为 `import { fetchWithRetry } from "../../lib/http.mjs"`,删掉各自的本地实现。**调用点的参数/行为必须与改前一致**(对照旧实现核对默认值)。
3. 补单测 `scripts/__tests__/http-fetch-retry.test.mjs`:用注入的 fake fetch 覆盖——成功直返、瞬时错误重试到成功、非瞬时错误不重试、达重试上限抛错、超时。(参考已有 `scripts/__tests__/projects-fetch-retry.test.mjs` 的风格,如它测的是 projects 那份,迁移/复用断言。)

## 验收（机器 DONE）
- `node --test scripts/__tests__/http-fetch-retry.test.mjs` 全绿;`npm test` 仍全绿(三个 column 的相关测试不回归)。
- 三处 `sources.mjs` 不再各自定义 fetchWithRetry,统一 import `lib/http.mjs`(grep 确认)。
- 全局门 `npm run build && npm run lint && npm run validate` 全绿。

## 禁止
- 不改三个 column 的抓取行为/默认值(纯提取)。不引第三方依赖。不动其它文件。
- 注意:`scripts/lib/` 下已有 `refresh-auth.mjs` 等,新文件并存即可。
