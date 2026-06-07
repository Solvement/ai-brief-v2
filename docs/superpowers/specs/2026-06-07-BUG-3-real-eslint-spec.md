# BUG-3 spec · `npm run lint` 接真 ESLint（保留并扩充内容 lint）

> Owner: Codex. 来源 `docs/plans/plan-1-bugfix.md` BUG-3。
> **本任务最易连带破坏后续任务**：完成后 `npm run lint` 成为全局验收门的一环，被 DEBT-1/DEBT-2/FE-2/FE-5 反复调用。**因此最高优先级硬约束 = 当前代码树必须基线全绿（0 error）。**

## 问题（已查实）
`scripts/lint.mjs` 只 grep `src/` 的 `.ts/.tsx` 找 `console.log`/`const mock`，不是真 linter，也**不覆盖 `app/`**。CLAUDE.md 宣称的"内容 lint 全绿"名不副实。

## 目标
`npm run lint` = **真 ESLint（覆盖 app/ src/ scripts/）** + **保留并扩充的内容 lint**，两者任一失败则整体非零退出。

## 硬约束（按重要性排序）
1. **基线全绿**：在**未改动任何业务源码**的前提下，`npm run lint` 对当前代码树必须 **exit 0（0 个 error）**。
   - 实现方式：ESLint 采用 recommended 规则集，但凡当前代码树已存在的违规规则一律**降级为 `"warn"`**（warning 不致非零退出），**不要为了过 lint 去批量改业务源码**。只有明确、安全、`--fix` 可自动修且 diff 极小的才可改；有疑问就降级为 warn。
   - 允许 warning 存在（它们是后续清理的 backlog），但 **error 必须为 0**。
2. **验收锚点**：`app/` 或 `src/` 下出现**裸 `console.log`** 必须是 **error**（`no-console`，允许 `console.warn`/`console.error`）。这是本任务的 acceptance。
3. **scripts/ 是 CLI 工具**：`console.*` 在 `scripts/**` 合法，**不要**对 scripts 开 `no-console`；scripts 的其余规则尽量 off/warn，保证基线绿。
4. **作用域边界**：ESLint 只 lint `app/ src/ scripts/`（含根级 config 文件可选）。**必须 ignore**：`node_modules`、`.next`、`out`、`public`、`content`、`data`、`brief-wiki`、`samples`、`logs`、`.cache`、`.codegraph`、`.claude`、`.agents`、`.tmp-shots`、`.backup-*`、`coverage`。否则会去 lint 生成物/数据/语料导致海量 error。

## 实现要求
- **扁平配置** `eslint.config.mjs`（Next 16 / ESLint 9 flat config）。技术栈：Next App Router + React 19 + TS 5.9 + 本地 `.mjs` 脚本。
  - TS/TSX（app/ src/）：`@eslint/js` recommended + `typescript-eslint` recommended（**非** type-checked 变体，避免装 project service 拖慢/报错）+ `eslint-plugin-react`/`eslint-plugin-react-hooks`（如易接）。把当前会报 error 的规则降级 warn。`no-console`（allow warn,error）= **error**。
  - `.mjs`（scripts/）：单独 override，`languageOptions.globals` = node，关掉 TS/React 规则，关 `no-console`，其余噪声 → off/warn。
- **devDependencies** 用 `npm install`（仓库是 npm，有 `package-lock.json`，需一并更新 lock）。挑稳定版本：`eslint`、`@eslint/js`、`typescript-eslint`、（可选 `eslint-plugin-react`、`eslint-plugin-react-hooks`、`globals`）。**不要**引 `eslint-config-next`（它会拖 next 自己的 plugin 解析，易出兼容坑）；如必须用请确保基线绿。
- **内容 lint**：保留 `scripts/lint.mjs` 的语义，并把其 walk **扩到 `app/` + `src/`**（当前只 src/），继续检 `console.log`/组件内 `const mock`。它作为 AST 之外的 backstop 与 ESLint 并存（重复无妨）。**不要**新增会让基线变红的内容规则；"未标注最新声明"等语义规则本任务不做（留 backlog 注释即可）。
- **package.json scripts**：
  - `"lint:eslint": "eslint ."`（或显式 `eslint app src scripts`）
  - `"lint:content": "node scripts/lint.mjs"`
  - `"lint": "npm run lint:eslint && npm run lint:content"`
  - 确认 `verify`（`lint && test && build`）仍成立。

## 验收（机器 DONE）
1. **基线绿**：当前树 `npm run lint` → exit 0（0 error；warning 允许）。
2. **能抓违规**：在 `app/` 任一已存在的 `.tsx`/`.ts` 顶部临时加一行裸 `console.log("x")` → `npm run lint` 非零退出且指出该 `no-console`；删除后复绿。（codex 自测后必须把临时行删干净。）
3. `npm run build` 仍绿、`node --test scripts/__tests__/*.test.mjs` 仍 109/109（lint 改动不应碰运行时）。

## 禁止
- 不为过 lint 批量改写业务源码（app/src/scripts 的逻辑）。要绿靠"降级噪声规则为 warn"。
- 不改 SEC-1/BUG-2 已落地的文件逻辑（如它们触发新 error，降级该规则为 warn，别改它们的代码）。
- 不动 `tsconfig.json`（类型检查是 DEBT-3，不在本任务）。
- 作用域外目录一律 ignore，不要 lint 它们。

## 交付
- 改/增文件：`eslint.config.mjs`(新)、`package.json`、`package-lock.json`、`scripts/lint.mjs`(扩 app/)。
- 报告：基线 `npm run lint` 的 error/warning 计数；列出你为保基线绿而降级为 warn 的规则清单（供 review）。
