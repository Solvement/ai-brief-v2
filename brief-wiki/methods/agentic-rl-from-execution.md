---
name: "执行反馈的 agentic RL(领域专家→蒸馏)"
slug: agentic-rl-from-execution
kind: method
type: training
tags:
  - reinforcement-learning
  - coding-agent
  - agentic-rl
used_by_content:
  - qwen3-coder-next
realizes_concepts:
  - verifiable-task-synthesis
problem_solved: "coding agent 的多轮工具使用难以用静态监督训练;奖励既稀疏又易被钻空子。"
naive_baseline: "纯 SFT 模仿轨迹,或用 LLM 自评当奖励。"
how_it_works: "用可验证任务的执行结果当客观奖励;分领域训练专家(Web/UX/单轮QA/软件工程),软件工程专家用多轮 RL + 奖励塑形(未完成轨迹惩罚、轮级工具格式惩罚),最后把各专家蒸馏回单一统一模型。"
input: "agentic 轨迹 + 可执行环境"
output: "单一统一的 coding-agent 模型"
tradeoff: "依赖大规模可验证任务与执行基础设施(MegaFlow);训练数据/算力门槛极高且专有。"
evidence_strength: medium
reusable_pattern: "当能为目标行为构造『可执行的正确性判据』时,用执行反馈代替 LLM 自评做奖励/过滤;分领域专家再蒸馏,兼顾专精与统一。"
---

## Mechanism

执行验证(Mini-SWE-Agent 过滤)+ 多轮 RL + 专家蒸馏。可复用点是『执行反馈 > LLM 自评』。出处:arxiv:2603.00729 §4.2。See [[content/qwen3-coder-next]]。
