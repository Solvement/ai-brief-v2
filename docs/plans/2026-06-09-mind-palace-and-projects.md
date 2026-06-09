# Plan: Mind Palace 构建 + 项目深读改写 (MP-1 + MP-2)

> 触发：新栏目/新范式 + >100 行 + 批量生成 → 必须 plan（RULES #11）。完成后独立 agent 审（RULES #12）。
> Goal（Kevin 2026-06-09）：高质量完成 ① 新 Mind Palace ② 项目 deep dive 选择+改写（人读+AI读，切入点犀利：**用 X 方法解决 Y 问题、展现 Z 结果 + 创新/缺点**）。停止=高质量上线；上线后先 AI 审视觉+文字。

## 0. 架构修正（2026-06-09 外部冷审 + Kevin 拍板，**以本节为准**）
冷审戳穿：我们在造"记忆的样子"没造"记忆的功能"——自动 tag 边是哑的/噪声、没机器在查图、edge-count 陷阱、缺向量底座。Kevin reframe：**内化吸收 > 形式；mind palace 只是帮 agent 理解记忆的形**。SOTA（Mem0/Zep-Graphiti/A-Mem）是**混合**：向量召回 + typed 图推理 + episodic。修正后的"真记忆"四层：
- **质（内化）= facet** 蒸馏（最重要，Kevin 强调）。
- **功能 = 本地向量索引 + findRelated()/召回**（缺的那块=COR-1 P0；本地嵌入模型 `@huggingface/transformers` multilingual-e5-small，无 API，Kevin 签字加此依赖）。
- **推理 = 已核验 typed 边**（improves_on/composes_with/**contradicts/special-case-of/derives-from**），LLM 抽取走冷审门；**自动 tag 边降级为弱提示**。
- **形 = 图视图**（降级，人看记忆的方式）。
- **两套图引擎收敛成一套**（build-brief-graph + legacy → 一套）。
- **eval 改召回式**：给一篇新论文/一个建造目标，能否召回正确前序方法（不是边数）。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：知识图谱从"薄索引"→"吸收了内容的记忆宫殿"。对 Kevin=战略外脑（给可执行方法）；对 AI=L1 自进化推理就绪记忆。项目深读从"又丑又学不到"→犀利、信息密、能学到。
- **小方向**（每条可判定）：
  1. 节点带 **facet**（problem_solved/method/result/innovation/weakness/architecture/transfer）从现有深读蒸馏到 AI-only 原语层 + 投影到图节点。
  2. `/graph` → `/mind-palace`（路由+导航+标题），NodeDetail 显示 facet + self_evo_use。
  3. **检索视图**：给一句建造目标 → 返回适用方法 + 证据（proven_case）+ 迁移理由。
  4. 项目人读深读页（app/repo）**修 key-drift**（rich 内容不再显示数据不足）+ 重排为犀利 spine：**「用 X 方法解决 Y 问题，展现 Z 结果」标题 → 创新 → 缺点 → Mermaid 架构 → 迁移**；满宽、少英文原文、图表表架构、大白话+例子。
  5. 模型**不进**宫殿。
  6. 过门：`validate-mind-palace.mjs` + `npm run verify` 全绿；上线；上线后独立 AI 审视觉+文字 PASS。

## 2. 需求
- 目标：上面 6 条小方向全绿并上线。
- 非目标：不上 RL/embedding 重训；不动模型栏；不重跑选品（项目已是 11 精英，本次=改写不是重选，除非 facet 暴露某项目不值录入）。
- 影响范围：`data/autosci/primitives/`、`public/data/brief/graph.json`、`src/components/KnowledgeGraph.tsx`、`app/graph`→`app/mind-palace`、`app/repo/[owner]/[name]` + `legacy/Detail`、导航、`scripts/kg/integrate-kg.mjs`、新 `scripts/validate-mind-palace.mjs`、`brief-wiki/deep-dives/*.md`。
- 验收：见小方向 6。

## 3. 方案
**facet schema**（扩展现有 primitive yaml，承接 Kevin 的犀利 spine）：
```yaml
facets:
  problem_solved: # Y:解决哪类问题(一句)
  method:         # X:用什么方法/机制(大白话+例子,不堆术语)
  result:         # Z:在自己项目/实验展现了什么(proven_case + 真实数字)
  innovation:     # 创新点(与同赛道比新在哪)
  weakness:       # 缺点/适用边界/坑(该不该用它靠这条)
  architecture:   # Mermaid 源码块(架构/流程)
  transfer:       # 能迁移到什么类型的东西 / 用于研究·自进化
```
保留 `self_evo_use`（客观"能否用于研究/自进化"判断）。
- 数据流：facet 蒸馏进 primitives（AI 层）→ `integrate-kg` 把 facet 投影到 graph 节点 → mind palace + 项目人读页都读它（不从散文渲染，符合"从库渲染"红线）。
- 项目人读页：弃 legacy Detail 的 key-drift 渲染，改读 facet 渲染犀利 spine。

## 4. eval 方式
- **结构门**（`scripts/validate-mind-palace.mjs`，接 validate）：每个录入节点 7 facet 非空或显式「数据不足」；facet yaml 可解析；Mermaid 可编译；图无孤儿边；references vs 关联边计数诚实。
- **内容门**（独立 opus 子 agent + rubric，generator≠critic）：facet 是否忠实于深读/源；result 数字是否真实非杜撰（自报标自报）；spine 是否犀利（X/Y/Z 清楚、创新/缺点到位）。
- **成功指标**（检索 holdout）：~5 条建造目标（如"战略 agent + HITL + 整车厂预测"）→ 宫殿能否召回对的方法 + 对的 proven_case 证据。
- **上线后 AI 审**（Kevin 指定）：视觉（/browse 截图）+ 文字内容 两个独立子 agent，PASS 才算达 Goal。

## 5. tool 调用
- 蒸馏：Read 深读 md → Write facet 到 primitives；integrate-kg 投影。无新 MCP，无新依赖。
- 前端：Edit/Write React + styles。
- 审：opus 子 agent + /browse（视觉）。

## 6. 编排（按 docs/agents §编排决策）
- **orchestra 大脑=我**（PM+前端+schema+gate，单上下文高风险件自己做）。
- **子 agent（opus, 并行/后台）**：facet 批量蒸馏 + 项目人读内容改写。先我手证 1 篇（AgeMem）作 gold 模板再派发。
- **独立审 agent（opus, ≠生成者）**：冷审 facet + 改写内容。
- 不引 langraph/CrewAI/AutoGen（开发期采纳模式）。批量蒸馏量大可升 dynamic workflow。
- 派发四件（角色/eval/模型/effort）见 docs/agents 模板。

## 7. 切片（每片可运行）
- **A**：facet schema + 手证 AgeMem（gold）+ integrate-kg 投影 facet + validate-mind-palace。→ 可运行：一个真实节点带 facet。
- **B**：前端 /mind-palace rename + NodeDetail facet 渲染 + 检索视图。→ 可运行：live 看一个节点的 facet + 查询。
- **C**：项目人读页修 key-drift + 犀利 spine 重排。→ 可运行：一个项目深读页好看且学得到。
- **D**：子 agent 批量蒸馏其余 facet + 改写项目内容；独立冷审。
- **E**：verify + 部署 + 上线后 AI 审（视觉+文字）。

## 8. 风险 / 回退
- 风险：facet 杜撰数字（→ 内容门 + 自报标记硬查）；前端 rename 漏 nav 死链（→ grep 全站链接 + 旧 /graph 留 redirect）；OneDrive .next 锁（→ rm -rf .next）。
- 回退：graph.json / 深读 md 改动走 git，可还原；上线走 feat→main 快进，保留上一版。
