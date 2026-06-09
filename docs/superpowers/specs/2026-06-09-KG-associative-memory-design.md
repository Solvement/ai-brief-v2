# 知识图谱 = 学术自进化 agent 的记忆库（Kevin 2026-06-09 Goal）

> 起因:现 graph.json = 529 节点 / **1 边**(528 关联没建)。Kevin 要把它做成**关联记忆/记忆库**:沉淀深读的项目+文章,展现知识关联性,且**客观评价每个项目/文章的实现思路能否用在研究/自我进化上**。可外搜论坛/GitHub/论文站找研究型/自进化 agent 架构。

## 核心定位(讨论收敛)
- **关联记忆**(不是工作流):搜一个点,真正相关的一起浮现(联想)→ 跨篇综合出洞察。对比 AutoSci 那种"工作流模板化成 skill 触发"——它记忆是线性工作流状态,我们要的是**带语义类型边的关联图**。
- **记忆库的价值判据(Kevin 2026-06-09 reframe)**:每个节点不只存"是什么",要带**客观评估:这个架构/设计思路能否、如何用在造一个研究/自进化 agent 上**(可复用的设计模式 / 短板 / 组合方式)。deep dive 的产物本就该有这层判断,沉淀进图。

## 节点
- **正式节点**:深度过的**文章**(content/papers/)+**项目**(brief-wiki 深读)。两类节点**统一进一张图**。
- **ghost 节点**:已知但没深读的(如 rohitg00/agentmemory)、或外搜到的(OpenSpace/AgentDisCo)。给缺口发现用。
- 节点带:title/type/tags + **design_idea(架构设计一句话)** + **self_evo_use(对研究/自进化的可用性评估:可复用模式/短板/怎么组合)**。

## 边(两层抽取)
- **第一层·廉价初筛(确定性)**:① 抽 brief-wiki 的 **693 条 [[wikilink]]** → 显式边;② **同标签** → `same_track` 候选边(共享 tag 作 evidence);③ **implements** = 文章↔项目(项目实现某论文:匹配 arxiv id / 标题 / 主题)。
- **第二层·强模型 typed+evidence 边(聚焦投入最深的簇:agent-memory / self-evolving / deep-research / multi-agent)**:对候选对推断 `same_track / builds_on / shares_method / same_use_case / implements`,每条带 `confidence + 一句 evidence`(像现有那条好边)。不做全 N²,只在簇内+候选对上跑。
- 边 schema 沿用 `scripts/brief/schema/edges.yaml`;输出进 `public/data/brief/graph.json`(nodes/edges/adjacency/summary)。

## 缺口发现(记忆库的杀手用法)
- 按簇算密度:某簇深读很多(我们投入深)但**强关联邻居没覆盖**(ghost/未深读)→ 输出"该深读谁"信号,反哺选品。例:agent-memory 簇深读了 AgeMem/MemoryAgentBench/PEFT-as-memory,但 agentmemory(未深)/OpenSpace(未收)/AgentDisCo(未收)是紧邻 → 建议深读。
- 补现选品只认动量信号(star/upvote)、缺"簇兴趣"维的盲点。

## 外搜源(吸收外部架构设计思路)
- 搜 **arXiv**(cs.AI/cs.MA:self-evolving agent / research agent / agent memory architecture)、**GitHub**(同主题 repo)、**HN**(讨论)→ 抽架构设计思路 + self_evo_use 评估 → 进 ghost 节点。种子:HKUDS/OpenSpace、rohitg00/agentmemory、AgentDisCo(2605.11732)。

## 前端
- `src/components/KnowledgeGraph.tsx` 渲染:连通图(节点按 type 上色、typed 边、簇着色)+ **缺口视图**(密集簇的未覆盖邻居)+ 点节点看 design_idea/self_evo_use。

## 裁判 / 评估方式（Kevin 2026-06-09:给出合理评估方式和理由，对不同记忆结构打分选最优）
对候选记忆结构按 6 维打分（每维有理由）：
1. **关联丰富度**（多对多 typed 边）—— 纯树:低(单父) / 图:高 / 图+树导航:高
2. **召回相关性**（搜一点带出真相关=联想）—— 树:低(仅父/兄弟) / 图:高 / 图+树:高
3. **缺口发现**（密集簇未覆盖邻居）—— 树:弱 / 图:强 / 图+树:强
4. **整合不臃肿**（add/replace/merge,不堆积）—— 树:差(倾向加分支→累赘) / 图:好(improves_on/composes_with) / 图+树:好
5. **增量邻居强化**（深读一篇=给邻居加边+证据,加厚理解）—— 树:弱 / 图:强 / 图+树:强
6. **可导航/可读** —— 树:高 / 图:低(规模大靠簇) / 图+树:高

**结论（理由）**：**图核心 + 树/簇导航覆盖层** 6 维全高，明显胜出（非接近分,故不需"都建对比"）。纯树在前 5 维皆输——知识关联是多对多+有环,树强制单父会砍掉 cross-link(联想的价值)。OpenSpace 的树长在可导航,取其长 MERGE 进图(view 层),不用它的存储。
**裁判落地**：可后续把 6 维做成对 graph.json 的自动度量(边密度/召回命中/缺口数/improves_on+composes_with 占比/带 evidence 边占比)，作为图谱质量门。

## 验收
- graph.json 边数从 1 → 数百(真关联);缺口发现能跑出"该深读谁";外搜能加 ghost 节点(含三种子);前端能看出关联+缺口;build/validate/test 绿。红线:不破坏现有 brief 管线;不引重依赖。
