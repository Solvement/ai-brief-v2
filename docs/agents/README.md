# AI-Brief · 结构化调度角色契约

> 来源：CMU+腾讯《Harness 工程化》第 5–6 章（结构化调度 / 角色被问题逼出来）。
> 适用：**Claude Code 和 Codex 同等**。这不是"多几个聊天对象"，是责任分工——避免一个 AI 同时写需求、定方案、写代码、审自己、测自己。
> 配套：[../../RULES.md](../../RULES.md)（底线）、[../workflow/workflow.md](../workflow/workflow.md)（接力规则）、[../../task-board.md](../../task-board.md)（态势板）。

## 为什么是这 7 个角色

每个角色解决前一个解决不了的问题（手册 6.5）。不是越多越高级，是这个项目=**长期每日更新的知识库 + 自进化 + 研究 agent**，长期维护逼出全套（Kevin 2026-06-09）。

| 角色 | 解决的问题 | 默认承担者 | 模型 / effort |
|---|---|---|---|
| **需求分析** | 想做什么（模糊→结构化需求） | Claude 主控 或 子 agent | opus / high |
| **方案设计** | 打算怎么做（需求→技术方案，含 eval/tool/编排） | Claude 主控 或 子 agent | opus / high |
| **闸门总控** | 现在能不能做（需求够清楚？方案漏边界？现工程能安全落地？） | Claude 主控 | opus / high |
| **开发实现** | 真正做出来 | 后端/脚本/数据=**Codex**；前端/视觉/内容文案=**Claude** | 按复杂度（机械=sonnet/haiku，硬推理/写作=opus high） |
| **代码审查** | 是不是按需求/方案做的（实现层回看） | **独立** 子 agent（≠开发者） | opus / high |
| **测试验证** | 做出来的东西到底能不能用（行为层） | `npm run verify` 脚本 + 独立子 agent | 脚本 + opus |
| **PM（只路由）** | 整条链怎么有序串起来 | Claude 主控（orchestra 大脑） | 只读结论+路由，不下专业结论 |

## 硬边界（手册第 7 章：边界硬化）

1. **下游不改上游。** 开发不私改 SPEC / 需求 / 方案文档；要改 → 提请上一层或 Kevin。
2. **PM 只路由，不越界。** PM 只能：读阶段结论 → 决定前进/回退 → 指定下一棒 → 维护记录。**一旦 PM 写需求/定方案/改代码/替专业 agent 下结论，系统就退回"中央大脑说了算"的旧路。**
3. **代码审查 + 测试验证是真正收口，不能合成一句"看起来没问题"。** 审查看"符不符合需求/方案"，测试看"行为对不对、边界/回归安不安全"。
4. **不自审。** 生成高风险资产的 agent ≠ 审核它的 agent（generator≠critic）。这是我们既有的冷审门文化。
5. **模型分层。** 不给每个岗位都配最贵的锤子；把 opus high 花在真正要专业判断的环节（需求/方案/审查/测试/硬写作），机械活走 sonnet/haiku。

## 何时启用全套 vs 单主控

手册：角色被问题逼出，不一上来全量。但本项目已是长期维护态，**默认按全链跑**，只在小 bug（<100 行、单点、低风险）时由 Claude 主控直接修 + 自带审查视角（仍不自己放行高风险资产）。

判断信号（出现即升级到对应角色）：模糊需求直接流代码 → 补需求/方案；开发前风险没人拦 → 补闸门；开发完没人收口 → 补代码审查+测试；多角色不知道找谁 → PM 路由。

## 编排决策（研究 CMU+腾讯 / LangGraph / CrewAI / AutoGen 后 · Kevin 2026-06-09 签字）

四家是**不同层，不是互替**：CMU+腾讯 = 流程治理纪律（本文件）；LangGraph = 显式状态图（节点+条件边+typed state+checkpoint/断点续跑）；CrewAI = 角色制 crew（角色+结构化记忆）；AutoGen = 会话/actor（GroupChat+reflection）。我们有两个编排面，分别处理：

**① 开发期建造/审计/研究**（我派子 agent + codex）：**采纳模式，不引运行时库**。理由：(a) 我们的"agent"是**订阅制 CLI 子进程**（`claude -p` / `codex exec`），不是这些库假设的 **API model-client**——套上去等于绕过其核心；(b) Claude Code 的 sub-agent + dynamic workflow **本身即运行时**，再引=套第二个编排器，冗余；(c) 领域在合并（Microsoft Agent Framework、OpenAI Agents SDK），别绑某家 API。**采纳的模式**：AutoGen reflection = 我们 generator≠critic 冷审；CrewAI 角色+结构化记忆 = 每次派发定角色 + Mind Palace。

**② 每日管线**（boot 无人值守 discover→评分→深读→冷审→发布）：**真上 LangGraph (Python)**。理由：管线**本质是状态图**——条件门（冷审 pass/fail→发布 or hold）+ 有界循环（冷审≤3 轮）。现手搓 `.mjs` 是我们一直踩的可靠性 bug 根源（冷审挂 1.5h→timeout、部分失败静默发布、被 kill 丢状态）。LangGraph 的 **checkpoint/断点续跑 + 显式门边 + 可观测 + HITL 暂停恢复** 正解这些。CLI 子进程（claude -p/codex exec/deepseek）作为图节点（函数 node 内 shell-out）。代价已知：Python 运行时与 Node 并存、管线重写、Windows/OneDrive 摩擦——Kevin 已权衡（含学习价值）签字。**这是 RULES #8「不过早加重资产」的明确豁免。**

## 子 agent 派发模板（每次必填四件，RULES #16）

```
角色：<需求分析 | 方案设计 | 开发 | 代码审查 | 测试验证>
任务：<一句话目标 + 大方向/小方向>
输入：<读哪些文件 / 上一阶段产物>
输出：<写到哪 / 交付什么结论>
禁止越界：<不许改什么 / 不许替谁下结论>
阻塞条件：<遇到什么停下回报 PM>
eval：<怎么算这次做对了（机器断言 + 内容门）>
模型/effort：<opus high | sonnet | haiku + 理由>
```
