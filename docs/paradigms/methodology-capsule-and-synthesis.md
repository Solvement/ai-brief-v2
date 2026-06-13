# 方法论胶囊 + 合成层（KG-6，2026-06-13 Kevin 拍板）

> 在 Karpathy LLM-Wiki（[[llm-wiki-pattern]]）之上**延伸出"合成层"**——LLM-Wiki 到 `kind:comparison` 为止（摆出对比），
> 我们再加一层：**同类高光融合 → 提假设 → 验证 → 进化出新高光 / 取长补短的好办法**。这是外脑区别于检索/索引的地方。

## 为什么（Kevin 2026-06-13）
不拿任何单一领域（如 RAG）当衡量所有文章的尺子——那没意义。每篇高赞/顶会文章都有它的**特定高光**。
脑子要做的：**记下每个高光 → 同类方法论/同类问题聚类 → 找共同+不同 → 提假设验证 → 进化新高光或取长补短融合**，
使 Kevin 下次问到相关问题时，能**可追溯地拿到一个好办法**。验证方式由我定，产出只认"新东西 / 融合的好办法 + 可追溯"。

## 两个结构

### 1. 方法论胶囊（capsule）= 一篇的一个高光
比论文更碎的原子单位：**一个"方法解决一个问题"**（一篇可拆多个胶囊）。格式 = `用 X 解决 Y、到 Z 程度，后续可用 M 改善，和 N 相关`：
```
source      : 来自哪篇对象
X_method    : 用什么方法/机制
Y_problem   : 解决什么问题（挂问题注册 ID，跨文呼应靠共享 Y）
Z_degree    : 得到什么结果、解决到什么程度（**标 自报/实测**）
M_improve   : 后续可用什么改善 / 还差什么
N_related   : 和哪些胶囊/问题/文章呼应（[[wikilink]]）
grounding   : L0 锚点 / object·mechanism ID + fact_type
```
**粒度纪律**：太粗（整篇）= 无呼应；太碎（逐句）= 碎片化。原子 = "一个方法解决一个问题"，呼应靠**共享 Y（问题 ID）**。

### 2. 合成 / 新高光（synthesis）= 同类胶囊融合出的好办法
```
question        : 这条合成回答哪一类问题
sources         : 融合了哪几篇
common          : 共同之处
differences     : 不同之处（沿对立轴；挂已有命题 prop.*）
key_finding     : 这一簇里最关键的裁判性发现
fusion_hypothesis: 取长补短的新方法 + borrows[]（每件溯源到 object/mechanism）
verification    : 我定的验证（见下）
answer          : 人读层——Kevin 问相关问题时给的好办法 + 诚实边界
```

## 验证方式（我定，Kevin 只看产出）
不搞重 A/B 实验。默认三层 + 一个机会层：
1. **溯源**：融合的每个部件挂得到具体 object/mechanism ID（fact/author_claim/实测/自报 分清）。
2. **可组合性检查**：融合的几个方法的 assumptions 不打架（逐条论证；冲突就降级或弃）。
3. **独立对抗审**（cold-audit，generator≠critic）：派一个不知情的独立 agent 攻击这个新高光——找隐藏矛盾、会死在哪、哪条声称越界。
4. **机会层·廉价实测**：agent/记忆类能在本站 BriefMem 小语料上跑（如 MAB 四维回归）就顺手实测；非 agent 类不强求。

## 数据落位
- 胶囊：可内联进 synthesis（pilot 期）或单列 `data/knowledge-graph/capsules/`（量大后）。
- 合成：`data/knowledge-graph/synthesis/{cluster}-{topic}.yaml`。
- 🔴 schema 变更：走分支 + PR，Kevin 审 PR 签字后才进正典。旧 facets 退役仍 🔴。

## 与现有结构的关系
- 不推翻对象库（claims/mechanisms/human）——胶囊是对象的**更碎投影**，合成是命题的**升级**（命题只摆张力，合成产出取长补短的新方法）。
- 问题注册（registry/problems）仍是骨架，**自下而上**从各文高光长出，不被任何单一领域框死。
