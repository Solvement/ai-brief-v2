# 关系类型学（Mind Palace typed edges, 2026-06-11 从语料实挖）

> Kevin 2026-06-11："关系种类很多，需要理清楚——实际沉淀会发现。" 本表**不是先验枚举**，是从现有 facet/discovery 散文里**实挖**出来的（每条都有语料出处），并按 **"怎么利用"(动作)** 归组——这是外脑和图书馆的区别：边不只说"相关"，要说**该拿它做什么**。
> 纪律继承 KG-2：**NO_EDGE 默认**，每型必带"触发判据 + 证据要求"，过不了就不连（语料里已有 NO_EDGE 判例，如「agemem 同用 GRPO 但无相互引用/对比表 → NO_EDGE」「类目级配对正是门要拦的」）。

## 八组关系（按动作归类）

### 接在一起（CHAIN / 拼成 pipeline）
- **`composes_with` / `layers_with`**：一个做底座、一个做表现层，或前后段拼成流程。
  - 语料证：「codegraph 强在低层索引基础设施、understand-anything 强在上层语义导览——一个做底座一个做表现层，互补而非重复」；「ai-scientist-v2 给任务级探索引擎、hermes-agent 给长期运行时——前者当 hermes 的一个 task 跑，后者补它缺的经验沉淀」。
  - 触发：A 的产物/层 是 B 的输入/邻层，且层级不重叠。证据须指出"谁在下谁在上/谁接谁"。
  - 用法：**接起来拼成 pipeline / 技术栈**。

### 取长补短（COMBINE / 杂交）
- **`complements`**：各擅一面、合起来更强（互补对）。
  - 语料证：「AgeMem 用 RL 学记忆策略，取长补短 agentmemory 的写死 hook」；「与 TrOPD 形成互补对：TrOPD 管训练信号可信度、本篇管…」。
  - 触发：A 在维度 X 强、B 在维度 Y 强，X≠Y 且同问题域。证据须点出各自强的维度。
  - 用法：**杂交取长补短**（X 用 A 的、Y 用 B 的）。

### 替代（REPLACE / 优先用更好的）
- **`supersedes` / `replaces` / `cheaper_alt`**：同问题，B 在主轴上压 A（更新/更好/更省）。
  - 语料证：「best-first 树搜索替代固定实验模板」；「统一查询接口替代多专用管线」；「16% 更便宜·47% 更少 token」。
  - 触发：同问题 + B 在主轴占优（含成本轴）。证据须有对比方向。**注意子轴反例**（A 整体被替代但在子轴 N 仍更好 → 降级为 `complements` 不是纯 supersede）。
  - 用法：**优先用 B，A 标历史/前作**。（= 我们 memory 维护协议的 SUPERSEDE，自洽）

### 对比占优（COMPARE / 判强弱）
- **`compares_with`**（带 dominance: better|worse|mixed）：同赛道不同路线。
  - 语料证：「Search-R1 训 agent 把固定 retriever 用得更好、DCI-Agent 推理期临场写 shell」；「对比 SpatialTrackerV2 仅 0.100（3 倍级领先）」。
  - 触发：同问题不同方法。证据须有可比指标或机制差。
  - 用法：**判谁更强 / 混合则进 complements**。

### 张力（CONFLICT / 警惕求解）
- **`contradicts` / `tension_with`**：结论冲突或内在张力。
  - 语料证：「逐字 vs 抽取之争」；「造好轨迹需要答案、训练又不能偷看答案的矛盾」。
  - 触发：两端主张冲突 / 同一目标的对立约束。证据须引两端主张。
  - 用法：**警惕，看谁证据强 / 这是待解的研究张力**。

### 谱系（LINEAGE / 前作定位）
- **`precedes` / `lineage_anchor`**：时间/思路上的前作—后续。
  - 语料证：「后续改进/替代工作出现时以本节点为前作参照」；「未来具身/视频 agent 选稿的谱系锚点」。
  - 触发：B 明确在 A 思路上推进，或 A 是某谱系的锚点。
  - 用法：**谱系定位 / 选稿时看它在不在某条线上**。

### 互证（VALIDATE / 设计交叉确认）
- **`validates` / `isomorphic_with`**：结构同构、互相印证设计正确。
  - 语料证：「显式去重表防重复计算（与 ledger 同构，互证设计正确）」；今天 SoCRATES/AdaPlanBench 的评测方法论与我们 eval-first 收敛。
  - 触发：两边机制同构且彼此独立得出。
  - 用法：**设计互证（别人独立得出同结论=我们方向对）**。

### 评测（EVALUATES，KG-2 已有）
- **`evaluates`**：A 的评测套件**实际测过** B（证据须 A 结果表含 B 或 B 自报引 A）。用法：**找 B 的真实水平**。

## 自身内部关系（within-item，Kevin "自身和之间"）
- 一篇/一个项目内部也有关系：**组件级组合**（LatentSkill「拆 general/task/mistakes 再组合」）、**机制链前后段**。落在 facet 的 method/core_concepts 子字段间，供"自身"视图展开。

## 机器判定要点（给边引擎）
- NO_EDGE 默认；每条边产出 `{type, dominance?, evidence(语料/原文出处), use(怎么利用动作)}`。
- 证据不指向具体出处/对比方向 → 拒。类目级配对（"都用 GRPO"）→ 拒。
- 连接接口在**子字段层**（A.method ↔ B.method / core_concept ↔ core_concept），非整篇对整篇。
- 本地 LLM 判（DeepSeek/codex），bench 验证（recall 不退 + 边精度），不训。
