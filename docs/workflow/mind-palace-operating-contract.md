# Mind Palace Operating Contract

> Mind Palace 对 Kevin 是检索式第二大脑；对 agent 是自进化材料库。复杂任务不能只凭当前上下文直接回答，必须先把已沉淀的论文/项目拿出来做检索、竞赛、合成和回写。

## 什么时候必须触发

遇到下面任一类任务，agent 必须先使用 Mind Palace：

- 设计新 agent、工作流、记忆系统、评测系统、预测系统、研究系统。
- 需要判断多种方案优劣，而不是只解释一个概念。
- 用户问“怎么做得更聪明 / 怎么自进化 / 怎么长期积累”。
- 要新增或替换本站架构、prompt、workflow、KG、记忆、冷审、选稿、预测、策略模块。
- 同一个问题已有多篇论文/项目沉淀，比如记忆、规划、评测、自进化、多 agent、代码理解。

简单事实查询、纯 UI 改色、机械修 bug 可以不触发；但如果修 bug 暴露出架构问题，仍要触发。

## 必须输出的思考结构

agent 使用 Mind Palace 后，输出必须包含这四层，不得只列链接：

1. **Recall**：召回哪些论文/项目，为什么相关。
2. **Contest**：同类方法如何竞争，各自解决什么问题、证据是什么、弱点是什么。
3. **Synthesis**：当前问题最适合的组合方案，不照搬单篇论文。
4. **Evolution actions**：对本站/agent 自身该删、换、优化、增加什么。

推荐先跑：

```bash
node scripts/kg/research-loop.mjs "问题描述"
```

需要机器消费时：

```bash
node scripts/kg/research-loop.mjs "问题描述" --json
```

**分工边界（2026-06-10 review 定）**：脚本只产出机械可判的部分——Recall（hybrid 检索）、Contest（证据表）、Role Coverage（角色覆盖/缺位）、Gaps。**Synthesis 和 Evolution actions 必须由 agent 自己产出**，基于 contest 表做判断，不许照抄任何预制架构模板。脚本输出里的 `synthesis_brief` 只是任务清单，不是答案。

## 论文/项目如何被当成认知原语

每篇论文的 facet 必须能回答：

- `problem_solved`: 它解决什么 Y 问题。
- `method`: X 方法怎么解决 Y。
- `discovery_trace`: 作者为什么走到 X，而不是别的方法。
- `result`: 得到什么 Z 结果，证据强度如何。
- `weakness`: 什么时候不适合用。
- `transfer`: 能迁移到本站什么场景。
- `self_evo_use`: 它对记忆、理解、自进化分别有什么用。

每个项目的 facet 必须能回答：

- 用了什么方法论和架构。
- 实现了什么目标和结果。
- 哪些模块可直接复用，哪些只能做参照。
- 它是否能变成本站 agent 的工具、评测器、记忆层或反例。

## 批判性规则

- 检索到不等于该用。必须说明适用边界。
- 论文自报结果不能当成事实，只能当“自报/待复现”证据。
- 不允许无限增加模块。每次方案都要给出：
  - **delete**：删掉什么旧假设、旧边、旧流程或噪声。
  - **replace**：用什么更好的机制替换。
  - **optimize**：保留但调参/加门/加评测。
  - **add**：确实缺的新增部件。
- 同类方法必须竞赛：规则式 vs 学习式、本地 vs 托管、逐字记忆 vs 抽取图谱、向量检索 vs hybrid、静态 workflow vs 可进化 workflow。
- 如果召回结果弱，必须说“Mind Palace 现有语料不足”，并把缺口写成后续选稿/深读方向。

## 对“战略 agent + 预测 agent”的目标形态

> ⚠ 这是**领域示例**（例子≠范围）：只有战略/预测类查询才参考这个形态；其它领域的 Synthesis 必须从当次 contest 表里长出来，不许把这套七层 stamp 到任何问题上。

正确方案不是两个聊天 bot，而是一套可回写的决策系统：

```text
Evidence Store
  -> Belief State
  -> Forecast Engine
  -> Strategy Planner
  -> Critic / Evaluator
  -> Decision Log
  -> Memory Update Gate
```

Mind Palace 应提供：

- 记忆论文：写入、检索、更新、遗忘、冲突消解、评测。
- 自进化论文：进化对象、优化器、反馈信号、护栏。
- 评测论文：过程级 judge、基准、错误归因。
- 项目案例：可复用工具、架构形态、失败边界。

## 回写契约

执行后必须沉淀：

- 哪个 facet 被实际用到。
- 它帮了什么，哪里没帮上。
- 新方案替换了什么旧做法。
- 是否需要新增、合并、降权、删除某个 facet/edge。
- 是否新增 recall benchmark 查询，防止下次忘记。

这一步决定 Mind Palace 是否真的让 agent 变聪明；没有回写，只是一次性 RAG。
