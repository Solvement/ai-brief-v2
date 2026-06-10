# COLD adversarial audit — KG-2 Phase 0 (你是独立批判方,无生成上下文)

你在审一个个人 AI 情报站的「知识关联层」设计。北极星:L0 深读语料 → L1 自进化(图谱缺口反哺选稿) → L3 auto-research(跨记忆综合产新节点)。**图必须被机器真用,不是展示**。

## 必读文件(都在本 repo)
- `docs/plans/KG-2-association-layer.md` — 计划 + §3.1 schema v2 草案 = **你的靶子**
- `data/knowledge-graph/facets/agemem.yaml` — 现有 facet 金样(9-facet schema)
- `data/knowledge-graph/facets/supermemory.yaml`、`data/knowledge-graph/facets/memoryagentbench.yaml` — sub-agent 蒸馏样本
- `docs/paradigms/papers.md`、`docs/paradigms/projects.md` — 深读范式(facet 的上游)
- `content/papers/2507.21046-self-evolving-agents-survey/paper.mdx` — 论文深读样本
- `brief-wiki/deep-dives/supermemory-deep-dive.md` — 项目深读样本
- `scripts/kg/embed.mjs`、`scripts/kg/recall.mjs`、`scripts/kg/focus-edges.mjs` — 现有管线

## 历史教训(不许重演)
KG-1 自动 tag 边 98% 是噪声/管线边,冷审 4 轮才修干净——"造了记忆的样子没造功能"。修法靠**运营定义+黑名单+冷审门**,不靠阈值。

## 业主约束
- 核心概念门:项目含多个论文概念时,非核心概念不许连边。
- 论文价值锚 = 解决了什么问题 + **怎么找到的**解决方法(后者喂研究方法论)。
- 人工 taste 反馈≈每周一次,loop 不许依赖高频人工信号。
- 本地订阅模型,无 per-token API;嵌入是本地 e5-small。

## 攻击点(逐项给 VERDICT: KEEP / CHANGE(怎么改) / KILL,引用你读到的文件证据)
1. **facet schema v2**(9-facet + 新增 core_concepts、solution_path):作为「召回+判边+gap-map」三用的机器内化单元,缺什么/冗余什么/哪个字段运营定义模糊到会产生垃圾?solution_path 对大多数论文是否根本蒸馏不出来(原文不写失败分支)→会逼出幻觉?
2. **边词表 v2** 运营定义:paper↔paper `improves_on/extends/contradicts/same_problem`、paper↔project `implements/applies/tool_for`——实操中分得开吗?哪两个会被判边 agent 混用?same_problem 会不会变成新的 tag 噪声?核心概念门的「核心」怎么机器判定才不是嘴上说说?
3. **深读范式→facet 蒸馏的保真**:现有 paper.mdx/项目深读捕获判边所需信息了吗?蒸馏会在哪里被迫编造?范式该加什么增量字段(不推翻金样)?
4. **管线失效模式**:embed(e5-small)→recall top-k→强模型判边→冷审。跨类型(论文↔项目)召回会不会系统性漏?判边 agent 的过连接偏置怎么压?recall-eval 扩展后怎么防 eval 被做强假绿?
5. **Phase B 竞赛设计**:两路候选(动量 vs 图谱缺口)+critic 裁判,「命中率」定义(Kevin周采纳/冷审过+self_evo_use)有没有循环论证或激励扭曲?

## 输出格式
每攻击点: VERDICT + 证据 + 具体改法(可执行,不要泛泛"加强质量")。
最后: 按风险排序的 top-3 致命点。总长 ≤1000 字中文。
