# Handoff — AI-brief 下一阶段执行包

This folder contains the handoff documents for moving AI-brief from a UI shell into a working AI-evaluated information product.

## 阅读顺序

1. **[api-procurement.md](./api-procurement.md)** — 给 Kevin 看的 API 申请清单。包含每个 API 的注册地址、价格、需要的 scope、`.env` 字段、安全注意事项。Kevin 把 P0 那一组 key 拿到之前，Codex 不能开始 Phase 1。
2. **[codex-next-tasks.md](./codex-next-tasks.md)** — 给 Codex（或任何 AI 编码 agent）的执行规格。Phase 1-3 已完成（LLM 评估器 / GitHub 客观数据 / 事件聚类）；接下来是 **Phase 4**（`prompt_version` 回填，半天小手术）和 **Phase 5**（`personal_signals` 反馈层 + 最简 UI，私人使用场景的核心补全）。Codex 一次只做一个 Phase，做完打勾，再领下一个。

## 执行约束（Codex 必读）

- 先读项目根目录的 `AGENTS.md`，所有"Engineering rules"和"Done means"对每个 Phase 都生效。
- 先读 `docs/product-model.md` 和 `docs/evaluation-rubrics.md`，理解 schema 不能动的部分。
- 当前的 `src/lib/ai/evaluation/index.ts` 是 deterministic placeholder，可以保留作为 LLM 失败时的 fallback，**不能删除**。
- 任何新增依赖必须 < 50KB minified，并在 PR 描述里注明大小。
- 所有 secrets 通过 `process.env.*` 读取，**永远不能** hardcode。新增的环境变量必须同步加进 `.env.example`（如果没有就创建）。
- 改完每个 Phase，必须本地跑通 `npm run typecheck && npm run lint && npm test && npm run validate`，并把输出贴在 PR 描述里。

## 状态约定

每个 Phase 完成时，在对应章节顶部把 `Status: not started` 改成 `Status: done @ <ISO date> by <agent>`，并在最底部 changelog 段加一行简述。这样 Kevin 一眼能看到进度，无需追代码。
