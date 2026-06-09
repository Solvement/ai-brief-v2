# Plan: Agent Memory 撑得住大数据量沉淀（研究驱动）

> Goal（Kevin 2026-06-09）：agent memory 上线、**撑得住大数据量沉淀**。方法：先学科研 agent 流程(已学:autoresearch 双循环 + ara exploration-tree)，再**并行启动、用 research-loop 解决**。授权改上游(论文/项目/模型分析管线)。
> 纪律：`docs/method/research-loop.md`(科研不照抄) + autoresearch(**锁 eval 先于实验**) + 不自审(跨模型对抗审)。

## 1. 大方向 / 小方向
- **大方向**：Mind Palace 从"9 条能看的卡片"→"可累积、可精确召回、不糊、会自更新的 agent 记忆"。对 Kevin=可沉淀的战略外脑;对 AI=L1 自进化记忆底座。
- **小方向（每条机器可判）**：
  1. **强 benchmark 锁定**（裁判先于方法）：检索精度(扩到 ~30 对抗查询,含跨簇/具体结构/否定/改写) + scale stress(合成放大到 100/500/1000 节点测召回精度+延迟+呈现)。
  2. **检索方法竞赛**：纯向量(baseline) vs 混合(BM25+向量+typed图)+RRF vs +rerank vs 我们自创 → benchmark 判胜,**选最适合我们的**(不照抄)。
  3. **沉淀管线**：新深读**自动 facet 化 + 集成**(改上游),memory 累积不靠手工。
  4. **冲突消解 / staleness**：新论文 contradicts/improves_on 旧记忆时,标"已被取代"/消解(memoryagentbench 全场盲区,也是 L1 命门)。
  5. **聚类/层次呈现**：scale 时按主题簇浏览,不回退成毛球。
  6. 上线 + scale stress 全绿 + 上线后 AI 审(视觉+文字)。

## 2. 方法（科研 agent 工作流）
- **Bootstrap**：问题=记忆怎么 scale+精确;文献=我们 9 篇深读(当镜子);**锁 eval+baseline**(小方向1)先于任何实现。
- **内循环**：每个方法=一个假设,**先 commit 锁定协议**(`research(protocol)`),再跑,benchmark 测,记 exploration tree(决策/死路/为什么)。confirmatory vs exploratory。
- **外循环**：综合哪类方法赢+为什么 → DEEPEN/BROADEN/PIVOT。
- **不照抄**：混合检索不是"agentmemory 这么做"，是"在我们语料+Kevin 真实查询上,混合比纯向量好多少、哪种好"——实验+指标回答,可能得出只适合我们(少而深)的路。

## 3. eval（锁定先于实验，防 metric gaming）
- `data/knowledge-graph/recall-holdout.json` 扩到 ~30：跨簇("用 X 做 Y 的系统")、具体结构("把代码索引成 SQLite 图的是哪个"→必须 codegraph#1 非 agentmemory)、否定、改写。指标 recall@1/recall@3/MRR。
- `scripts/kg/scale-stress.mjs`：把 facet 合成放大到 N=100/500/1000(扰动文本),测 retrieval 延迟 + 精度退化 + 呈现是否糊。
- **裁判是机器指标,不是我的口味**;锁定(commit)后才比方法。

## 4. tool / 编排（你不是个体）
- **codex**：① 对抗审 Mind Palace 架构(找 claude 自审漏的) ② 后端实现 hybrid retrieval + 索引 + 沉淀管线。
- **me(orchestra)**：benchmark、前端聚类呈现、集成、收口。
- **sub-agents(opus)**：facet 批量、方法实现并行。
- **跨模型对抗审**：claude⇄codex 互审架构与实现(generator≠critic 升到架构层)。
- 编排底座=Claude sub-agent + dynamic workflow + codex(不引框架);批量=dynamic workflow。

## 5. 切片（每片可运行 + 锁 eval 先）
- **A**：扩强 benchmark + baseline(纯向量)锁定 → 可跑出 baseline 分数。
- **B**：检索方法竞赛(混合/rerank/...) → 指标选胜。
- **C**：沉淀管线(新深读自动 facet+集成)。
- **D**：冲突消解/staleness。
- **E**：聚类/层次呈现。
- **F**：scale stress 全绿 + 上线 + AI 审。

## 6. 风险/回退
- 合成放大不等于真数据(标注清楚,真数据来了重测)。
- 混合检索可能在我们小语料上**没赢**纯向量——那就是有效的负结果(记 exploration tree),选简单的。
- 上游管线改动=🔴 需确认上线策略;走 git 可回退。
