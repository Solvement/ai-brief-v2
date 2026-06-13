# AgentMemory A/B（Tier-2 经验验证）· 计划 + 我需要的东西

**目的**：判决实验 Tier-1 是"库 vs 直接问模型"(纸面/答案质量)。Tier-2 是 Kevin 说的
**在真实自己项目上跑、看记忆方法是不是真更好**——这是第一个真 L1 自进化演示(假设→真跑→指标判)。
对应语料：`prop.memory-rule-vs-learned`(AgeMem 学习式 vs rohitg00 规则式) + 其 `third_way`
= typed memory action 接口(Add/Update/Delete/Retrieve/Summary/Filter)。

## 三臂对比（在同一个 agent + 同一任务集上）
- **臂 0 基线**：现成 ad-hoc / 朴素记忆(塞历史 or 简单向量检索)。
- **臂 1 规则式**：固定规则 + 多路检索融合(rohitg00 路线，零训练，先可跑)。
- **臂 2 typed-action**：把"何时写/取/改/删"抽成带类型的显式动作(语料推荐的 third way，零训练也能上)。
- *(臂 3 学习式 = AgeMem 的 RL 策略：吃 GPU/HPC，放后面。)*

## 指标（语料自己的纪律：R@k 必要非充分）
- 例行：检索 R@5(便宜)。
- 体检：端到端任务成功率 + 生命周期四维(精确检索/即时学新/长程通读/选择性遗忘，照 MemoryAgentBench 协议)。
- 诚实：自报 vs 实测分开记。

## 🔴 我现在卡在这（断层，需要你定）
1. **在哪个项目/数据上测**？(a) 你实习的某个 agent 项目；(b) 这个 AI-Brief 自己的记忆/检索；(c) 公开基准 LongMemEval-S。
   —— 决定数据从哪来、能不能我自己跑。
2. **GPU/NYU HPC 怎么接**？臂 0/1/2 零训练我能本地跑；**臂 3(AgeMem RL)必须接你的算力**——给我 HPC 提交方式 or 确认先只跑 0/1/2。
3. **用哪个模型当 agent backbone**？(本地 / API / 你 HPC 上的开源模型)

## 现在能立刻做的（不等你）
- 臂 0/1/2 在**公开 LongMemEval-S 子集**上跑(若我能拿到数据)，先出 0 训练三臂的信号。
- 你给①②③任一答案，我就把对应臂接上去跑。
