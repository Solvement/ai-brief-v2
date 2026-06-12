# 质量门 / Quality Gate (canonical, 2026-06-07)

> 宪法（`CLAUDE.md` §数据优先）引用本文件："内容质量门规则见 `/specs/quality-gate.md`，不过门不入库不发布。"
> 本文档**描述现状**（与代码里实际跑的门一致），不是 aspiration。待实现的部分明确标 `[待实现]`。

**红线**：**不过门不入库不发布**。任一门不过 → 保留上一版 + 告警，不部署。

门分两层：**① 机器门**（代码/数据正确性，确定性脚本）+ **② 内容质量门**（深读可教性/忠实性，多模型互审）。另有 **③ 人工/周期**门（Lighthouse/视觉，非自动）。

---

## ① 机器门（确定性，每个任务 + boot/pre-push 都跑）

权威命令：**`npm run verify`** = `lint` → `test` → `build`，外加 `validate`（`test` 内已串 `validate`）。

| 门 | 命令 | 查什么 | 实现 |
|---|---|---|---|
| Lint | `npm run lint` | **ESLint**（`app/ src/ scripts/`，`no-console`=error，scripts/ 放行 console）+ **内容 lint**（`scripts/lint.mjs`：app/src 的 `console.log`/组件内 `const mock`） | `eslint.config.mjs` + `scripts/lint.mjs`（BUG-3） |
| 单测 | `npm run test` | `node --test scripts/**/*.test.mjs`（当前 168）→ 再跑 `validate` | DEBT-1 扩 glob 到 `scripts/**` |
| 内容校验 | `npm run validate` | 8 个 validator：text-encoding / trending / models / articles / papers-radar / pipeline-status / papers-deepread / daily-digest | `scripts/validate-*.mjs` |
| 构建 | `npm run build` | `next build` 通过 | — |

**跑在哪**：
- **每个任务**：改完跑 `npm run build && npm run lint && npm run validate`（+相关单测）全绿才算该任务 DONE。
- **boot/pre-push**（`scripts/boot-daily.ps1`）：采集→深读→冷审后跑 **`npm run verify`**，**fail ⇒ 不 push**（保留 last good）。boot push 到 main = 部署，所以这是部署门。

**`papers-deepread` validator 现状**：仅查 `paper_id/title/status` + 索引基本完整性。`[待实现 BUG-4]` 新鲜度断言（索引当日/≤N 天有更新否则 fail）；`[待实现 DATA-1]` 必填 `provenance/version/quality_signals`。

---

## ② 内容质量门（深读 cold-audit，生成者 ≠ 批判者）

适用：论文深读（`content/papers/*/paper.mdx`）等强模型产出。**生成者 ≠ 批判者**——审稿必须是独立的 COLD agent（无生成上下文，只见 artifact + 原文 + rubric）。

> **为什么独立冷审打败自审（机制，不是「更努力」）**：maker 评自己的产出时看得到自己的推理链，会偏向与已写结论一致的判断；独立 verifier 只看 artifact + rubric，**在 maker 的游戏里没有筹码**。所以「零生成上下文」不是形式要求，是它生效的**结构条件**——给 verifier 喂生成上下文 = 自废武功。（来源：Anthropic 工程博客 self-critique 实测 + Fable 5 verifier 实验，2026-06-12 当镜子收。）

流程（`scripts/columns/papers/cold-audit/`，跨模型：codex 作者 / claude 审，封顶 3 轮）：
1. 新深读产出时 `cold_audit.status = "needs_human"` → `build-index.mjs` **默认排除**（不进 `papers-index.json`）。
2. **两段式独立冷审**：盲读可教性 → 开卷忠实对账 → 逐维诊断补差循环（≤3 轮）。
3. 判 **PASS → `ready_to_publish`**（进索引/发布）或 **HOLD →** 排除 + 告警（`logs/papers-cold-audit/digest-<date>.md`）。
4. **红线**：未过审不自动发布——只有 `ready_to_publish` 或 `grandfathered` 进索引。
5. 「透彻」反向定义：5 条无重大缺口。金样 = DRIFT(2606.02060) 深读（verify-before-bless 已跑：忠实满分 + 3 补丁）。

`[待实现 DATA-2]`：当前 `coldAuditAllowsPublish` 在 `cold_audit` **缺失时返回 true**（存量 14 篇靠 grandfather）。目标：仅对**存量 14 篇**保留白名单；**此后新条目**缺 `cold_audit` 或未 `ready_to_publish` → 排除。

内容范式（lint 据此校验产出）见 `docs/paradigms/{papers,projects,models}.md`：不编造（数据不足/官方未披露）、自报 vs 实测、来源走脚注、大白话两层、防张冠李戴。

---

## ③ 人工 / 周期门（非自动，不阻塞每次 boot 部署）

- **Lighthouse** 性能 & 可访问性 **> 90**：用 `/browse` + 周期/CI 跑，非 boot 自动门。a11y 当前 = 三 tab 页 axe **0 违规**（FE-5）。
- **视觉回归**：人工 `/browse` 截图比对（Kevin 看渲染前端验收），非自动门。

> 注：`CLAUDE.md` 宪法「验收门（DONE 的机器定义）」一段历史上把 Lighthouse/视觉/e2e 列为自动门、且写 `pnpm`（实为 `npm`）——**以本文件为准**。该段待校正（`[待实现]` 文档同步）。

---

## DONE 的机器定义（速查）

- **任务 DONE** = 该任务 plan 验收命令通过 + `npm run build && npm run lint && npm run validate` 全绿 + changelog 追加一条。
- **部署 DONE**（boot/pre-push）= `npm run verify` 绿 + 内容质量门（冷审）放行 → push。
- 任一不过 = 保留上一版 + 告警，不部署。
