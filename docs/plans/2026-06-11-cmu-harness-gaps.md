# Plan: 补全 CMU《Harness 工程化》缺失的四块拼图 (HARNESS-CMU-GAPS)

> 触发：>100 行改动（三个 ops 脚本 + npm wiring + 文档），无 schema/路由变更。
> 完成后独立 agent 审，按 §1 大/小方向为标的（RULES #12）。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：让本项目（L0 库 + 自进化 + 研究 agent）的"完成"从模型叙述变成脚本判定，补齐 CMU 四块拼图里我们缺的**反馈块**（基线对比、遥测）和**约束/进化块**（流程完整性、可判定 Rule 下沉、closeout 证据）——少静默发布、少"这不是我引入的"扯皮。
- **小方向**（每条可判定）：
  1. `verify-baseline.mjs`：snapshot 存 `.agent/verify-baseline.json`；diff 报出新增失败 validator，无新增失败 exit 0，有则 exit 1。
  2. `check-harness.mjs`：解析 workflow.yaml（stage 完整性 + rollback 目标存在 + role 在 agents README）；RULES/workflow/agents 跨文件链接不悬空（硬错误）；task-board `交付结论:` 缺证据 WARN。当前仓库 0 硬错误。
  3. `token-usage-by-model.mjs`：扫本地 JSONL 按模型/天/会话聚合 token（含 avg/call）。
  4. npm `ops:harness`/`ops:tokens`/`ops:baseline`/`ops:baseline:diff` 可跑；`check-harness` 接进 `validate`。
  5. RULES #19/#20、dev-map、task-board 同步。`npm run verify` 仍绿。

## 2. 需求
- 目标：把 CMU 第 8 章（结果感知/基线对比）、第 3 章六轮补稳 #5（基线归责）、checklist #11（Harness 维护）落成可跑脚本 + 底线。
- 非目标：不加新 deny-hook（误报门比没有更糟）；不重写每日管线（PIPE-1 单独）；baseline 不含 build（只 validate 套件）。
- 影响范围：纯新增 `scripts/ops/*` + package.json scripts + 文档；无数据契约/路由/schema 变更。
- 验收标准（可观察）：四脚本 + npm 跑通；verify 绿；冷审 PASS。

## 3. 方案
- 新文件：`scripts/ops/{check-harness,verify-baseline,token-usage-by-model}.mjs`。
- 改动：`package.json`（+4 ops scripts，validate 末尾追加 check-harness）；`RULES.md`（+#19 closeout 证据 / +#20 baseline 归责）；`dev-map.md`（scripts/ops 段）；`task-board.md`（本任务条目）。
- schema/数据契约变化：无。

## 4. eval 方式
- 结构门（免费）：`node scripts/ops/check-harness.mjs` exit 0；`verify-baseline snapshot && diff` exit 0；`token-usage-by-model` 输出三表；`npm run verify` 绿。
- 内容门：独立冷审子 agent（generator≠critic）核对三脚本逻辑对不对、有无误报/漏报、是否真覆盖 CMU 缺口。
- 成功指标：check-harness 对当前仓库 0 硬错误且无明显误报 WARN；baseline diff 在无改动时报 0 新增失败。

## 5. tool 调用
- node 跑脚本；`yaml`（已在 deps，不新增）解析 workflow.yaml；child_process 跑 validators。无新增依赖。

## 6. 编排方式
- 单主控（Claude，ops/架构域）实现；**独立冷审子 agent** 收口（RULES #12）。不上 langgraph/CrewAI/AutoGen。

## 7. 切片
- 片 1（本次）：三脚本 + npm + 文档，worktree 内自测 + 冷审 → 合 main。可运行、Kevin 能 `npm run ops:*` 看到。

## 8. 风险 / 回退
- 风险：check-harness 误报会污染 validate → 设计为软告警 exit 0，仅硬结构错误 exit 1；已实测当前仓库 0 硬错误。
- 回退：纯新增，worktree 可丢弃；main 快进可 revert。
