# AGENTS.md — Codex 入口（与 Claude Code 同等治理）

> 这是 Codex 在本仓库工作的总入口。**Claude Code 和 Codex 受同一套 harness 治理**（Kevin 2026-06-09）。
> Codex = 后端工程执行者：按 plan/spec 实现，产出 diff，不扩范围。详细分工见 [SPEC.md](./SPEC.md) §8。

## 必读（按序）
1. [RULES.md](./RULES.md) —— 底线红线，含**工作流红线**（plan 前置 / 不自审 / 三种停 / 可运行交付 / 子 agent 四件套）。
2. [docs/agents/README.md](./docs/agents/README.md) —— 7 角色结构化调度契约 + 硬边界。
3. [docs/workflow/workflow.md](./docs/workflow/workflow.md) —— 接力规则（谁接棒/何时打回）。
4. [task-board.md](./task-board.md) —— 当前任务态势、阶段、阻塞、交付结论。
5. [dev-map.md](./dev-map.md) —— 代码地图（从哪进门，别重复造轮子）。
6. [docs/workflow/mind-palace-operating-contract.md](./docs/workflow/mind-palace-operating-contract.md) —— 复杂任务前如何调用 Mind Palace 做检索、竞赛、合成、回写。
7. [SPEC.md](./SPEC.md) —— 目标/非目标/六类"好"/验收。

## Codex 硬约束（除 RULES 外）
- **>100 行改动先有 plan**（`docs/plans/`，用 `_TEMPLATE.md`）；plan 必含 大/小方向 + eval + tool + 编排。
- **不自审**：你产出的高风险资产由独立 agent 审（你不审自己的）。
- **下游不改上游**：不私改 SPEC / 需求 / 方案文档；要改提请 Kevin。
- **完成=门禁过**：`npm run verify`（lint+test+build，含 validate）绿才算完成。
- **复杂任务先用 Mind Palace**：设计 agent/记忆/评测/预测/自进化/架构方案前，先跑 `npm run kg:research -- "<问题>"` 或等价检索，按 contract 输出 Recall / Contest / Synthesis / Evolution actions；简单事实查询和机械修 bug 可跳过。
- **不过早加重资产**：不引 AutoGen/CrewAI 运行时、不引重依赖、不建 DB/鉴权——除非 SPEC 非目标解禁。**例外（Kevin 2026-06-09 签字）：每日管线编排上 LangGraph (Python)**，理由见 docs/agents/README.md §编排决策。
- **Windows**：`codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check`；中文走文件不走 PS here-string（防乱码，validate-text-encoding 会查）。
- **改地貌更新 dev-map.md；改任务态势更新 task-board.md。**
