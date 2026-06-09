# AI-Brief · 任务态势板

> 不是普通 todo——记录任务在哪个阶段、文档在哪、大/小方向、阻塞、交付结论。人 + AI 都读这里。
> 阶段定义见 [docs/workflow/workflow.md](./docs/workflow/workflow.md)；角色见 [docs/agents/README.md](./docs/agents/README.md)。
> 谁推进谁更新本表。

## 已完成 (2026-06-09)

### ✅ MP-1+MP-2 · Mind Palace 重构成"真记忆" + 项目深读改写 — 高质量上线
- commit **1813e60 → main**（live, git clean, HEAD=origin/main）。回应外部冷审（"造了记忆的样子没造功能"）：质=9 facet 内化 / 功能=本地嵌入召回 **recall@3=1.000**（无 API）/ 推理=8 已核验 typed 边 + 32 tag 噪声边降级 / 图=形。`/graph`→`/mind-palace`。
- **上线后 AI 双审 PASS**：① 文字（独立 agent）9 facet 全 SHARP&LEARNABLE、零杜撰、自报全标记、真修了"又丑又学不到"；② 视觉（/browse 实测 live）mind palace facet 面板 + 项目页 ProjectFacetSpine + Mermaid 架构 全渲染、浅色蓝主调干净。
- 编排：我(前端+schema+gate) + 2 opus 子 agent(蒸馏 facet) + codex(后端 eval+集成) + 独立冷审 agent，全并行。
- 非阻塞遗留：understand-anything facet 略泛（源头不透明，诚实披露非编造）；检索 free-text 查询 UI 未做（per-node facet+边+召回 eval 已证功能）；hermes 等不在 trending 时项目页不显 spine（trending 耦合，非 bug）。

## 进行中

### ✅ MP-0 · Harness 治理层（结构化调度落地）— 已落地（含编排决策修正）
- **大方向**：本项目=长期每日更新知识库+自进化+研究 agent，必须有可约束/可交接/可审计的工程骨架，否则越迭代越乱（Kevin 2026-06-09）。
- **小方向**：① 7 角色契约 ② 接力 workflow（人+AI+进度） ③ plan 模板 ④ RULES 工作流红线 ⑤ AGENTS.md 镜像给 codex ⑥ task-board 活起来。
- **阶段**：开发 → 自审中。
- **文档**：`docs/agents/`、`docs/workflow/`、`docs/plans/_TEMPLATE.md`、`RULES.md`、`AGENTS.md`、本表。
- **阻塞**：无。
- **交付结论**：待独立 agent 审后回填。

### PIPE-1 · 每日管线迁移到 LangGraph (Python) 🔴
- **大方向**：每日 boot 管线本质是带条件门+有界循环的状态图；手搓 .mjs = 挂起/timeout/静默发布/丢状态 bug 的系统性根源。上 LangGraph 拿 checkpoint/断点续跑/可观测/HITL，让无人值守跑可靠（Kevin 2026-06-09 研究四家后签字）。
- **小方向**：① Python 运行时落地（Windows/OneDrive，与 Node 并存）② 管线建成状态图：节点=CLI shell-out（claude -p/codex exec/deepseek），边=冷审 pass/fail 门 + 冷审≤3 轮有界循环 ③ checkpoint 持久化（被 kill 可续跑）④ 可观测 run log ⑤ 冷审 RED LINE「未过审不自动发布」用门边硬化。
- **阶段**：方案设计（待写 plan `docs/plans/2026-06-09-langgraph-pipeline.md`）。
- **🔴 需 Kevin 签字点**：新 Python 运行时依赖（已签）、上线策略、任何 schema 变更。
- **阻塞**：codex 额度（后端工程主力）；可用 opus 子 agent 顶设计/小实现。
- **交付结论**：—

### MP-1 · Mind Palace（记忆宫殿 = 关联记忆 + 内化吸收）
- **大方向**：知识图谱从"薄索引"升级成"吸收了内容的记忆"——对 Kevin=战略外脑（给可执行方法），对 AI=L1 自进化的推理就绪记忆。`/graph` → `/mind-palace`。
- **小方向（2026-06-09 冷审后修正，见 plan §0）**：① **质**=facet 蒸馏（problem_solved/method/result/innovation/weakness/architecture/transfer）② **功能**=本地向量索引+findRelated/召回（`@huggingface/transformers` multilingual-e5-small，无 API，Kevin 签字）③ **推理**=已核验 typed 边（improves_on/composes_with/contradicts/special-case-of/derives-from 走冷审门），自动 tag 边降级 ④ 两套图引擎收敛 ⑤ 检索视图（建造目标→适用方法+proven_case 证据）⑥ rename `/graph`→`/mind-palace`，模型不进 ⑦ **eval=召回式**（非边数）。
- **阶段**：开发中（plan `docs/plans/2026-06-09-mind-palace-and-projects.md`；正在 de-risk 本地嵌入依赖）。
- **🔴 签字点**：新依赖 @huggingface/transformers（本地嵌入，已签）。
- **阻塞**：无。
- **进度 (2026-06-09 并行执行中)**：✅ 嵌入底座 de-risk PASS（本地 multilingual-e5-small，中文 query 召回正确）+ `scripts/kg/embed.mjs` 跑通；✅ **9 facet 已蒸馏**（gold agemem + 2 opus 子 agent 各 4：rohitg00-agentmemory/memoryagentbench/supermemory/mempalace + ai-scientist-v2/colbymchenry-codegraph/nousresearch-hermes-agent/understand-anything），全带 typed 边(improves_on/composes_with/contradicts)+自报标记+冷审引用行号；✅ 前端 `/graph`→`/mind-palace` rename + FacetSpine 渲染 + 标题；🔄 **codex 后端轨**跑中（validate-mind-palace.mjs + recall-eval.mjs 已出，integrate-kg facet 合并 + 引擎收敛进行中）。
- **进度续 (2026-06-09)**：✅ codex 后端轨完成（integrate-kg 合 facet 到节点[facetedNodes:9] + 摄入 8 条已核验 typed 边 + 32 条 tag 边降级 weak/排除出 associativeEdges[=24]；validate-mind-palace + recall-eval 建好）；✅ 全链 `npm run kg:build`(build→integrate→embed) 绿；✅ **召回 eval：recall@1 0.750 / recall@3 1.000**（真功能验证，非边数）；✅ **独立冷审 9 facet 全 PASS**（generator≠critic，无杜撰、自报全标记、边有据、self_evo_use 诚实；仅 2 非阻塞 nit）；✅ 前端 FacetSpine（节点面板）+ `facets.json` 索引 + **项目人读页 ProjectFacetSpine 引导段**（用 X 解决 Y/展现 Z/创新/缺点/Mermaid 架构/迁移）；✅ validate-mind-palace + embed 接进 npm validate/kg:build；✅ typecheck 绿。🔄 `npm run build` 跑中。
- **下一步**：build 绿 → commit + 部署（feat→main 快进）→ **上线后 AI 审：视觉(/browse)+文字内容**（独立子 agent）。
- **非阻塞遗留**：检索视图(free-text in-browser 查询)未做（per-node facet+边+召回 eval 已证功能）；ai-scientist-v2→hermes 边单向（有意）；2 facet 注释 typo「受称」。
- **交付结论**：待 build+部署+AI 审。

### MP-2 · 项目人读深读重做
- **大方向**：现项目深读"又丑又学不到东西"——要 结构化分段 + 信息密度 + 视觉 + 大白话 + 例子，分析内容本身是重点（Kevin 2026-06-09）。
- **小方向**：内容范式 + 前端一起重做；交可运行版本 Kevin 视觉验收。
- **阶段**：需求分析。
- **阻塞**：与 MP-1 facet 范式共享（项目=实战案例，proven_case 复用）。
- **交付结论**：—

## 已交付
（迁移自 docs/plans 历史：Plan-1/2 多批 P0/P1 已上线——详见 [docs/plans/README.md](./docs/plans/README.md)。本表从 2026-06-09 起接管态势记录。）

## 阻塞 / 等人
- codex 额度：2026-06-08 晚耗尽，深读/管线改用 opus 子 agent 顶（见 memory feedback-subagent-fallback-and-durable）。
