# Findings — self-evolving research memory (读每次会话开头)

> autoresearch findings.md = 累积知识 + 人读叙事。每个外循环后更新。

## 研究问题
自进化的研究记忆能否在我们语料上可度量地比静态记忆更好地理解？（见 research-state.yaml）

## 当前理解 (Current Understanding)
- **检索：混合胜单一,已在我们语料实测**(precision@1 0.857→1.000)。why: 向量漏改写、BM25 漏建造目标/否定, RRF 各补其短。→ 静态最优检索 = hybrid(已知 baseline)。
- **跨篇综合是理解的来源**(非检索): 9 篇里 ai-scientist-v2(探索)+agemem(会学记忆)+memoryagentbench(评估) 拼成自进化 agent 三块; mempalace contradicts supermemory(逐字 vs 抽取); agemem improves_on agentmemory(学习 vs 写死)。
- **agent 记忆两条哲学**: 写死式(便宜,生产主流) vs 学习式(贵,agemem)。中间路=可训练接口先行。
- **全场盲区**: 冲突消解多跳 ≤6% (memoryagentbench) — 也是 L1 命门(新推翻旧)。

## 模式与洞见 (Patterns)
- 内化 ≠ 存储/检索; 内化来自 engage(蒸馏/出题/综合/判断适配)。
- "自进化"的最小可训练步 = 让记忆的检索从自己语料领域自适应(H1)。

## 教训与约束 (Lessons & Constraints)
- 弱 benchmark 会给假绿(recall@3=1.0 在 5 条简单题骗过我)→ 锁强 benchmark 先于方法。
- 自审找不出架构病 → 跨模型对抗审(codex)。
- 本基准题与记忆同源 → 绝对分偏乐观, 相对结论(hybrid>单一)才可信。
- GPU env: 5060 8GB Blackwell; 现状 CPU torch/Py3.14/无ML库 → 训练前须搭 env。

## 开放问题 (Open)
- 领域微调嵌入能否 beyond hybrid? (H1)
- 活论点外循环能否随语料增长提升综合质量? 怎么量? (H2)
- 冲突消解/staleness 怎么做成检索降级而非贴标签?
