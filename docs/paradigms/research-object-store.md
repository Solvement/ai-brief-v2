# Research Object Store（ROS）——记忆本体正典 v1（2026-06-12 Kevin 拍板重构）

> 替代「论文级 facet + 论文级边」口径（KG-2/KG-3，见文末收编说明）。
> 来源：GPT《AI理解文章能力分析》1/2/3 + Claude 架构共识。
> 一句话：**不让 AI 记住"论文之间有关系"，让它记住"哪些主张、机制、假设、证据、失败模式在什么条件下发生关系"。**

## 0. 架构总览

```
L0 SourceAnchor  原文/源码锚点（一切对象可追溯的根）
L1 对象层        Paper → Claims / Mechanisms / Assumptions / FailureModes / TriggerHooks / ExamQuestions
L2 正典注册层    Problem / Concept / Benchmark / Proposition（跨论文 join 的骨架）
L3 关系层        结构推导（structural_join）为主 + LLM 残差判定为辅；NO_EDGE 默认
L4 视图层        星图/面板/张力板 = 对象库的查询渲染，不独立存数据
L5 验收层        考题 benchmark（摘要版 vs 对象库版盲测）裁决字段去留
L6 迁移层        trigger_hooks + transfer 接口（runtime 后置）
```

核心纪律：
- **对象可组合**：推理=把对象链起来（A 的 claim 依赖假设 X + B 的实验在 ¬X 下做 → B 反驳 A 泛化性）。整篇对整篇的判断一律不存。
- **wide schema, sparse objects**：对象类型完整，填写稀疏。方法论文多产 mechanism，benchmark 论文多产 evaluation 维度，repo 多产 implementation/risk。**禁止摊满模板**。
- **每个字段必须有消费方**（视图/查询/考题/召回之一），盲测证明无用的字段删。
- **事实分型**：每条内容必须是 `fact | author_claim | interpretation | inference` 之一，AI 推断永不冒充原文事实（继承无编造红线）。

## 1. L1 对象 schema（`data/knowledge-graph/objects/{slug}.yaml`）

```yaml
schema: ros-v1
object_id: paper/agemem          # paper/{slug} 或 project/{slug}
slug: agemem
kind: paper | project
title: ""
source: "arxiv:2601.01885v2 + github.com/y1y5/AgeMem"
one_sentence_thesis: ""          # 主张了什么、靠什么方法、在什么设置下证明/展示了什么（三段缺一不可）

canonical:                       # 必须挂接 L2 注册表 ID；挂不上→proposed_*（见 §2）
  problems: [mem.lifecycle-management]
  concepts: [mem.learned-policy-controller]
  benchmarks: [bench.memoryagentbench]
  proposed_problems: []          # 新词条候选，主控审核后转正
  proposed_concepts: []

claims:
  - id: agemem.c1                # 全局唯一：{slug}.c{n}
    statement: ""
    type: author_claim | fact | interpretation | inference
    evidence:
      - anchor: "§5.1 Table 2"   # 论文=节/表/图；repo=路径:符号或行
        quote: ""                # 原文逐字短语（冷审逐字核的对象）
        strength: strong | medium | weak
    cannot_prove:                # 必填，≥1 条——本 claim 不能推出什么（防过度泛化）
      - ""
    confidence: high | medium | low
    confidence_reason: ""        # 原文明确/由流程推断/仅摘要级——置信度必须给依据

mechanisms:
  - id: agemem.m1
    name: ""
    canonical_concept: mem.learned-policy-controller
    problem: mem.lifecycle-management
    input: ""
    output: ""
    operations: []               # 核心操作/步骤（可执行过程级，能画流程图）
    optimization: ""             # 训练/优化信号；无则 "none"
    replaceable: []              # 可替换组件（接口位）
    non_replaceable: []          # 承重组件（拿掉就不是这个方法）
    reusable_pattern: ""         # 抽象后的可迁移设计原则（一句）
    anchor: ""

assumptions:
  - id: agemem.a1
    statement: ""
    kind: explicit | implicit    # explicit 必带 anchor
    anchor: ""
    conflicts_hint: ""           # 可空：与哪类假设天然互斥（给 join 的线索）

failure_modes:
  - id: agemem.f1
    statement: ""
    triggered_when: ""
    consequence: ""

trigger_hooks:                   # 外脑反向索引："未来遇到什么症状，想起这篇"
  - symptom: ""                  # 症状级、与本篇术语解耦（用问题语言不用方法语言）
    why_recall: ""
    related_object: agemem.m1
    risk: ""                     # 召回后乱用的最大风险

exam_questions:                  # ≥3 道；本系统的理解 benchmark
  - q: ""
    type: counterfactual | boundary | transfer
    expected_points: []
    tested_objects: [agemem.c1]

self_evo_verdict:                # 继承自旧契约（apply/queue/no 三态），消费方=self-evo 闭环
  state: apply | queue | no
  reason: ""

status: draft | gold
```

字段→消费方对照（裁决去留的依据）：
| 字段 | 消费方 |
|---|---|
| claims.evidence/cannot_prove | 命题正反证据、冷审逐字核、盲测边界题 |
| mechanisms | 比较/组合查询、流程图渲染、迁移 |
| assumptions | conflicts join、边界题 |
| failure_modes | mitigates join、风险提示 |
| trigger_hooks | 问题召回（外脑第一查询） |
| exam_questions | L5 验收闭环 |
| canonical.* | 全部 L3 join |

## 2. L2 正典注册层（`data/knowledge-graph/registry/`）

骨架不是关键词表。私有术语**禁止直接进图**：`私有术语 → 映射正典 ID → 挂不上则进 proposed_* → 主控审核 → 转正`。
ID 规范：`{namespace}.{kebab-name}`，两层命名制延续 KG-2（name=跨文件规范名，evidence/quote=源文逐字）。

```yaml
# concepts.yaml —— 概念注册表（同名异义的解药：memory 一词八种实体，各占一条）
- id: mem.learned-policy-controller
  name: 可学习的记忆操作策略
  type: mechanism-family | data-structure | training-scheme | eval-dimension
  description: ""
  aliases: [learned memory policy, agentic memory operations]
  distinct_from: [mem.external-vector-store]   # 容易混淆但不是一回事
  conflicts_with: []                           # 机制上互斥（join 用）

# problems.yaml —— 问题树
- id: mem.lifecycle-management
  name: 记忆生命周期管理（何时写入/更新/删除/检索/遗忘）
  parent: mem
  description: ""

# benchmarks.yaml —— 评测注册表
- id: bench.memoryagentbench
  name: MemoryAgentBench
  evaluates: [mem.lifecycle-management]   # 评的是哪些 problem
  metrics: []
  limitations: []                          # 测不出什么（join boundary 用）

# propositions.yaml —— 命题/张力（科研思想的载体，宁缺毋滥）
- id: prop.memory-rule-vs-learned
  statement: 长期 agent 的记忆管理应从固定规则转向可学习策略
  support: [agemem.c1]            # 挂 claim ID，不挂论文
  oppose: [rohitg00-agentmemory.c2]
  assumptions: []                  # 两边各依赖什么
  open_questions: []
  possible_synthesis: ""           # 第三条路线（如 hybrid controller）
  state: open | leaning-support | leaning-oppose | resolved
```

## 3. L3 关系层（`data/knowledge-graph/relations/`）

**优先级：结构推导 > LLM 残差 > 不连（NO_EDGE 默认）。**

结构推导规则（`derive-relations.mjs`，确定性、幂等）：
| 规则 | 条件 | 产出 relation_type |
|---|---|---|
| shares_problem | 两对象挂同一 problem ID | shares_problem（候选底座，不直接当强边） |
| can_be_evaluated_by | mechanism.problem ∈ benchmark.evaluates | can_be_evaluated_by |
| same_concept_family | 两 mechanism 挂同一 concept | compares_with 候选（残差判强弱） |
| conflicts_assumption | assumption 命中 concept.conflicts_with 或 conflicts_hint 互指 | tension 候选 |

LLM 残差判定（只判结构推不出的）：动词表沿用八组关系类型学（composes_with/complements/supersedes/compares_with/tension_with/precedes/validates/evaluates），**作用于对象级**（A.m1 ↔ B.m2），非论文级。每条必带：

```yaml
- id: r-0001
  source: {type: mechanism, id: agemem.m1}
  target: {type: benchmark, id: bench.memoryagentbench}
  relation_type: can_be_evaluated_by
  derived_by: structural_join | llm_judgment | human_verified | experiment_validated
  evidence_anchors: {source: "", target: ""}
  boundary: ""                  # 关系不成立的边界（如"benchmark 只测检索时不成立"）
  validation_experiment: ""     # 怎么验证这条关系不是幻觉
  confidence: {value: high|medium|low, reason: ""}
  status: candidate | verified
```

纪律：证据不指向具体锚点 → 拒；类目级配对（"都用 GRPO"）→ 拒；`derived_by: llm_judgment` 且无 boundary → 拒。

## 4. 生成流程（四轮，generator≠critic）

每篇四轮顺序产出，轮间输出类型不同、禁混写：
1. **忠实提取**：只从原文/源码抽 claims+evidence（逐字 quote+anchor）。禁扩展/类比/新想法；不确定标不确定。
2. **机制重构**：mechanisms（input/output/operations/优化信号），目标=能画出流程图（白板测试沿用）。
3. **批判轮**：cannot_prove / assumptions（显隐）/ failure_modes——强制写"实验没证明什么"。
4. **挂接与钩子**：canonical 映射（挂不上进 proposed_*）/ trigger_hooks（症状语言）/ exam_questions（反事实/边界/迁移各≥1）/ self_evo_verdict。

之后：主控收口 registry（proposed 审核转正）→ `validate-objects.mjs` 硬门 → derive 推导 → 残差判定 → 独立冷审（锚点逐字核、数字指控须引证）。

## 5. L5 验收闭环

- 考题=系统 benchmark：每篇 ≥3 题、每簇 ≥3 综合题（路线比较/张力/设计题）。
- 盲测：同套题，条件 A=只给摘要，条件 B=给对象库；比准确性/证据引用/边界意识/幻觉率/能否提出可验证实验。
- **盲测裁决字段去留**：B 不显著优于 A 的字段类型 = 模板噪音，删。

## 6. 视图与迁移（后置切片）

- L4：星图/节点面板/张力板全部改为对象库投影；切换时同步退役旧投影（不留新旧并存）。聚合边渲染（多关系一条粗边+计数，点开展开 relation object）。
- L6：只存 trigger_hooks 与 transfer 接口字段；Apply-to-Project 流程、offline replay、shadow mode 等到有真实项目问题再建（轻量 hook 有意义、重接口化没意义）。

## 7. 旧口径收编与退役

- `mind-palace-content.md`（三要件契约）：**superseded**。单独分析→L1 对象层；群体分析/簇综述→proposition+簇级考题；自用判定→self_evo_verdict 字段保留。
- `relation-taxonomy.md`（八组动词）：**收编**——动词表继续有效，作用层从论文级降到对象级；NO_EDGE 纪律不变。
- 旧 `facets/*.yaml`：降级为生成草稿输入（锚点必须重新指向原文，不得引用 facet 自身）；**全量回填完成后退役删除（🔴 届时 Kevin 确认）**。
- 前端旧投影：对象库验证通过后的下一切片切换并退役。
