# Plan: 知识关联层全语料化 + 自进化反哺 + 综合栏 (KG-2)

> Kevin 2026-06-09 loop 确认（对话锁定）。触发：批量生成 + 可能改深读范式 → RULES #11 先 plan。
> 完成后独立 agent 审，以 §1 为标的（RULES #12）。

## 0. Kevin 锁定的 loop 决策（来自 loop-engineering 确认）
1. **回填**：先回填一部分精读 + 后续新精读增量入图；**如有必要，顺手提高项目+文章的精读质量**（范式可改）。
2. **边范式**：paper↔project = `implements / applies / tool_for` 认可。**核心概念门**：项目可能含多个文章概念，非核心概念不强行连边。文章侧注重「解决了什么问题 + 怎么找到的解决方法」。
3. **Stage B**：以 gap-map 反哺为主；质量靠**竞赛 + 批判性 agent** 形式（多路候选竞赛 + critic 裁判）；Kevin taste 反馈频率 ≈ 每周一次，不可依赖高频人工信号。
4. **Stage C 综合产物**：**单独栏目**（新 col）。
5. **管线落点**（Claude 推荐、Kevin 授权）：回填=一次性 workflow/脚本（幂等）；**增量入图长在 PIPE-1 LangGraph 里**，不往现有 boot .mjs 里塞临时接线；PIPE-1 落地前新深读用幂等回填脚本补跑。
6. **Phase 0 授权**：批判性审视现有知识图谱结构 + 精读方式/质量，**可以更改**。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：北极星 L1/L3——让 Mind Palace 关联层覆盖全语料且**被机器真用**（图谱状态反哺选稿 = 自进化；跨记忆综合产新节点 = auto-research 种子）。从「展示」变「被用」。
- **小方向**：
  - A0：现有 facet schema / 边词表 / 深读范式过跨模型对抗审，产出 schema v2（含 paper↔paper、paper↔project 边）。
  - A：一批存量深读（先 agent/自进化相关）入图：facet + 嵌入 + 已核验 typed 边；/mind-palace 可见论文节点 + 跨类型边。
  - B：选稿管线出现「图谱缺口」加分项与理由字段（产品可见），有 eval 对比（图谱路 vs 动量路命中率）。
  - C：第一篇跨篇综合文章发布在**新栏目**，过冷审门，自身作为 derived 节点入图。

## 2. 需求
- 目标：见小方向 A0/A/B/C。
- 非目标：不重建图存储格式（沿用 data/knowledge-graph/facets/*.yaml + embeddings）；不上图数据库；不做 taste 高频学习（Kevin 反馈≈每周一次）；不在本计划内做 PIPE-1 本体。
- 影响范围：data/knowledge-graph/*、scripts/kg/*、选稿脚本（curate/rank 的加分项）、前端 /mind-palace + 新综合栏目、docs/paradigms（若 Phase 0 判定要改）。
- 验收：§4。

## 3. 方案
### Phase 0 — 对抗审计（先于一切生成）
- 标的：① facet schema 是否是机器可用的内化单元（召回+判边+gap-map 三用）；② 边词表运营定义是否够锋利（防 tag 噪声重演）；③ 深读范式是否捕获判边所需信息（尤其论文「解决什么问题/怎么找到解法」）；④ 入图管线（嵌入→召回近邻→强模型判边→冷审）失效模式。
- 形式：Claude 冷批判 agent + codex 跨模型对抗（generator≠critic；我出 v2 草案当靶子）。
- 产出：schema v2 定稿写回本文件 §3.1；若改深读范式 → 改 docs/paradigms/*.md（增量字段，不推翻既有金样）。

### §3.1 Schema v2 定稿（2026-06-09 Phase 0 跨模型对抗审后；草案被两路批判方各判 5 项 CHANGE + 1 KILL，以下为综合定稿）
**facet v2**（在现有 9-facet 上增两个字段）：
- `core_concepts`: 对象数组 `{name, role: primary|supporting|mentioned, evidence}`。**命名两层制（pilot 冷审后裁定 2026-06-09）**：`name`=**受控规范名**（跨文件同概念必须同名——这是核心概念门的锚，允许对源文措辞做规范化，如"矛盾消解/冲突消解"统一为"冲突消解"）；`evidence`=**必须含源文逐字短语**（防幻觉的落地点——概念是否真在源里，查 evidence 不查 name）。蒸馏前先读 `data/knowledge-graph/concept-vocab.json`（脚本从已有 facets 聚合），同义概念**复用既有名**，新名允许（语料会长）但 lint 对近重名告警。
- `discovery_trace`（替代 solution_path，**可空**）: `{hypothesis, failed_attempts, source_span}`——只在原文真有解法发现叙事时填（如 TrOPD「先试 Mask/Clip Outlier 失败」），**非空必须带 source_span 指向原文/paper.mdx 段落，无 span lint 直接 reject**；综述/benchmark/项目类填 `数据不足` 且不入 L3 方法论池。（两路审计共同实证：强制填=散文幻觉，比 tag 噪声更难被冷审抓。）

**边词表 v2**（每条边：双端 evidence span + negative rationale(为什么不是相邻边型) + confidence；判边默认 `NO_EDGE`）：
- paper↔paper: `improves_on / extends / contradicts`。~~same_problem~~ **KILL**（=旧 same_use_case 噪声转世，两路一致）。
- project↔project: `improves_on / composes_with`（沿用）。
- 任意类型间: `evaluates`（A 的评测套件**实际测过** B）——pilot 实证补充（2026-06-09）。可证伪判定句：evidence 必须引 **A 的结果表/榜单中含 B**，或 **B 的自报分数明确引用 A**；概念门=A 侧评测协议概念 primary + 所测概念 ∈ B 侧 primary。方向 A(benchmark)→B(被测)。**pilot 判边后收紧（2026-06-09）**：独立判边 agent 实裁发现「类目级配对」（方法 vs 考这类方法的 bench，如 MAB↔agemem——MAB 受测清单实际不含 AgeMem）能过概念门但不构成真 evaluates；故 validator 强制 `evidence_kind: results_table | self_report_citation` 字段，冷审据此对账。pilot 实裁 8 组候选全 NO_EDGE（含 TrOPD 阴性对照），门真的会说不。
- paper↔project（每个一句**可证伪判定句**）：
  - `implements`: 项目 repo 里有该论文算法的可跑实现——evidence 必须引**代码路径**。
  - `applies`: 论文 primary 概念是项目架构的承重组件——evidence 必须引**架构元素**（Mermaid 节点/README 架构节）。
  - `tool_for`: 项目是跑该论文方法/评测的使能工具——evidence 必须引**使用路径**。
- **核心概念门（机器判定）**：边必须声明所依概念；validator 校验概念 ∈ 两端 `core_concepts` 且 role 满足：`implements`=双端 primary；`applies`/`tool_for`=论文侧 primary + 项目侧 ≥supporting。非 primary 概念不连（Kevin 核心概念门落成代码）。

**入图管线 v2**：facet 蒸馏（Claude，引用原文不创作）→ embed（本地 e5-small）→ **hybrid 召回**（BM25+向量+RRF+概念重叠加权，AM Wave 1 竞赛胜出法）+ **跨类型配额**（top-k 中异类 ≥⌈k/3⌉，防 paper 聚 paper 系统性漏召）→ 强模型判边（NO_EDGE 默认）→ 跨模型冷审 → verified 入图。

**eval 防假绿（RULES #18）**：recall-eval 查询集扩充后**重标基线**（旧 0.9 在弱查询集上是假绿）；跨类型查询硬性占比 ≥30%；golden set 由独立冷审方标注、与判边 agent 隔离；pilot 边冷审过样率 ≥80% 才放量，机器门不是口头约定。

**Phase B 指标修正（防循环论证）**：~~命中=冷审过+self_evo_use=能用~~（self_evo_use 是蒸馏方自评字段，循环）。改：① 预注册两路候选池、盲评（裁判不知来源）；② 入图门 agent ≠ 命中裁判 agent；③ 低频反馈下不比百分比，比**绝对数**（两路各自冷审过样数 + 去重交集）+ gap coverage delta；④ 客观下游信号=节点后续被召回/被 Phase C 综合引用的次数（机器可统计）；Kevin 周反馈=滞后指标，不当训练裁判。

**深读范式增量（不推翻金样）**：papers.md 加可选节「解法是怎么找到的(选读)」（引原文锚定，给 discovery_trace 供料）；projects.md 深析模板加 `core_concepts`（3-5 个承重概念，须出现在 README/代码）；supermemory 深读自发长出的 `claim_ledger(claim/supports/does_not_support/threat)` 结构上提为项目深读标准件。

> 审计存档：codex 全文见 research/kg2-phase0-audit-prompt.md 的运行输出（top-3：same_problem 噪声复燃 / solution_path 幻觉 / 跨类型召回漏）；Claude 冷批判 top-3：solution_path 散文幻觉（三真样本无失败分支唯 TrOPD 有）/ 核心概念门不可机器判+三词混用（supermemory↔memoryagentbench 真对子复现）/ eval 自证假绿三连。两路独立得出同方向结论。

### Phase A — 回填（小样先证）
- 切片 1（pilot）：2 篇论文（self-evolving survey + MetaGPT 或 GPTSwarm）+ 1 个项目，全新 schema 走通全管线，证范式。
- 切片 2：agent/自进化相关存量批量回填（论文 ~10 + 项目 ~15，dynamic workflow / 并行子 agent）。
- 增量：幂等脚本 `scripts/kg/ingest.mjs`（检测未入图深读→补跑）；PIPE-1 落地时作为 LangGraph 节点迁入。

### Phase B — gap-map 反哺（竞赛 + 批判 agent）
- 缺口源：密集簇未覆盖邻居、contradicts 两端未验证主张、core_concepts 出现≥2 次但无深读节点的概念。
- 竞赛形式：候选生成两路（动量信号路=现 curate vs 图谱缺口路）→ 批判 agent 按 rubric 裁判 → 入选理由字段写明哪路+为什么（产品可见）。
- eval：两路命中率对比（命中=Kevin 周反馈采纳 / 进入深读后冷审通过且 self_evo_use=能用）。

### Phase C — 综合栏（新 col）
- 每周：挑密集簇 → agent 沿边召回 facets → 写跨篇综述/design-principle 笔记（Claude opus）→ 冷审门 → 发布新栏目 + derived 节点入图。
- 🔴 新栏目=新路由/新数据契约 → 上线前给 Kevin 看渲染结果（产品可见停点）。

## 4. eval（机器 DONE）
- 结构门：`validate-mind-palace.mjs` 扩展（facet v2 字段、边词表枚举、evidence 双端非空）；lint 全绿。
- 内容门：每条边 + 每个 facet 过独立冷审（generator≠critic）；综合文章过深读冷审门。
- 成功指标：recall-eval 扩展查询集（含跨类型查询「实现了 X 论文方法的项目」），recall@3 不降于 0.9；边精度抽检（冷审过样率≥80% 才放量）；Phase B 两路命中率有数。

## 5. tool 调用
- 现有：scripts/kg/{embed,recall,recall-eval,focus-edges,integrate-kg}.mjs 扩展；@huggingface/transformers 本地嵌入（无新依赖）。
- codex：管线接线/确定性脚本；Claude：facet 蒸馏/判边/综合写作/冷审一方。
- 不加新重依赖。

## 6. 编排
- Phase 0：我(主控+草案) + Claude 冷批判子 agent + codex 对抗（3 路）。
- Phase A 切片 2：dynamic workflow 或并行 opus/sonnet 子 agent（蒸馏=sonnet 初稿+opus 复核 或 opus 直出，按冷审过样率调）；并发写 worktree 隔离。
- Phase B/C：脚本（codex）+ 每周任务（boot 触发，PIPE-1 后迁 LangGraph）。

## 7. 切片（每片可运行交付）
1. Phase 0 审计报告 + schema v2 定稿（Kevin 可读 docs）。
2. Pilot 3 节点入图，/mind-palace 可见论文节点+跨类型边。 ← 第一个产品可见停点
3. 存量批量回填完成，图变密。
4. Phase B 反哺字段进选稿产出。
5. Phase C 第一篇综合上站（🔴 新栏目给 Kevin 自审）。

## 8. 风险 / 回退
- 边噪声重演（KG-1 教训）：靠运营定义+核心概念门+冷审过样率门控放量，不靠阈值；抽检不过即停。
- facet 蒸馏幻觉：蒸馏只准引用深读已有内容+原文，冷审对账；不过门不入图。
- 回退：facets/边均为 committed 文件，git revert 即回退；前端对空数据优雅降级（已有）。
