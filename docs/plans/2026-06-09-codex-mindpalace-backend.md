# Codex 工作单：Mind Palace 后端（eval 先于实施）

> 父 plan：`docs/plans/2026-06-09-mind-palace-and-projects.md`（含 §0 架构修正）。
> 角色：codex = 后端执行者，按本单实现，不扩范围。**先建 eval，再实施**（Kevin 2026-06-09）。
> 边界：**不要碰** `data/knowledge-graph/facets/*.yaml`（Claude 子 agent 在写）、**不要碰前端**（`src/`、`app/`，Claude 在做）。只动 `scripts/`。完成后 `npm run verify` 必须绿。不编造、可复现。改地貌更新 `dev-map.md`，态势更新 `task-board.md`。

## 背景（为什么）
冷审戳穿旧图：自动 tag 边是噪声、没机器查它、缺向量召回底座、edge-count 陷阱。修正后 Mind Palace = 向量召回（已建 `scripts/kg/embed.mjs` → `public/data/brief/mind-palace-embeddings.json`）+ 已核验 typed 边（推理层）+ facet 内化层。**eval 改成召回式，不是边数。**

## 任务 1（EVAL 先做）：`scripts/validate-mind-palace.mjs`
结构门，接进 `npm run validate`（在 package.json 的 validate 链尾加一项）。断言：
- 每个 `data/knowledge-graph/facets/*.yaml` 可被 `yaml` 解析；非 reject 的必须有 `node_id`、`facets.problem_solved/method/result/innovation/weakness/transfer`（允许值为「数据不足」字样，但不允许空）。
- facet 的 `architecture` 若存在须含 ```mermaid 围栏。
- `node_id` 能在 `public/data/brief/graph.json` 的 nodes 里找到（resolve 失败 → 报错列出）。
- `mind-palace-embeddings.json` 覆盖所有非 reject facet（缺向量 → 报错）。
- facet `edges[].type` 只能是 improves_on|composes_with|contradicts|special_case_of|derives_from；`to` 必须是已存在 slug。
- 退出码非 0 即失败，打印逐条问题。

## 任务 2（EVAL）：`scripts/kg/recall-eval.mjs`
召回式成功指标（这是真 eval，不是边数）。
- 建 `data/knowledge-graph/recall-holdout.json`，内容为下面 5 条 `{query, expect_slug, note}`：
  1. "我要给 agent 加可学习的长期记忆，让它自己决定记什么删什么" → agemem
  2. "搭一个多 agent 协作、角色分工不互相带偏的系统" → metagpt（或 gptswarm，二者命中其一即通过）
  3. "做一个能自己跑科研实验、迭代假设的研究 agent" → ai-scientist-v2
  4. "给 agent 一个能查代码库结构、找符号调用关系的工具/记忆" → colbymchenry-codegraph
  5. "怎么评估一个 agent 的长期记忆系统好不好" → memoryagentbench
- 用本地模型 `Xenova/multilingual-e5-small`（`@huggingface/transformers`，已装）嵌入 query（`query:` 前缀），对 `mind-palace-embeddings.json` 做 cosine NN，打印每条 recall@1 / recall@3 与命中 slug，最后给总 recall@3。
- **注意**：holdout 里若某 expect_slug 还没 facet（子 agent 未产出），跳过并标 `skipped (no facet yet)`，不算失败——这是进度指标，随 facet 增多变绿。

## 任务 3（实施）：改 `scripts/kg/integrate-kg.mjs`
- (a) 合并 `data/knowledge-graph/facets/*.yaml` 的 `facets` + `self_evo_use` 到对应 graph node（按 `node_id`，resolve 不到再按 slug；复用现有 findNode/merge 模式，参考它怎么并 design-assessments 的 self_evo_use）。
- (b) 从 facet 的 `edges:` 摄入 typed 边（improves_on/composes_with/contradicts/special_case_of/derives_from），带 evidence/confidence，标 `kg_integrated:true, cross_doc:true, verified_from_facet:true`。
- (c) **降级自动 tag 边**：现有 same_track（共享标签）边——保留但标 `weak:true`，并从 `summary.associativeEdges` 计数里排除（associativeEdges 只算 typed 已核验边 + concept bridges，不算 tag 噪声）。诚实 summary。
- (d) 重算 summary（references / associativeEdges / edgeByType / ghosts / assessed / facetedNodes）。

## 任务 4（实施）：引擎收敛
- 让 `build-brief-graph.mjs` 为唯一引擎。`kg:build` 链 = `build-brief-graph && integrate-kg && embed`（把 embed 也接进去）。legacy `build-knowledge-graph.mjs` 退出每日链（文件留着，package.json 的 `kg:build-legacy` 保留），并在 `dev-map.md` 标注「单引擎」。

## 验收
- `npm run validate`（含新 validate-mind-palace）绿；`npm run verify` 绿。
- `node scripts/kg/recall-eval.mjs` 能跑、打印 recall（agemem 那条此刻应命中，其余随 facet 产出变绿）。
- `npm run kg:build` 一条链跑通：build → integrate（facet+typed 边并入、tag 边降级）→ embed。
- summary.associativeEdges 不再把 tag 噪声算进去。
