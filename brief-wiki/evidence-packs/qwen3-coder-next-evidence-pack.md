---
content: qwen3-coder-next
kind: evidence-pack
title: "Qwen3-Coder-Next — Evidence Pack"
technical_objects:
  - name: "80A3 MoE 主干"
    type: model
    input: "代码/自然语言 token(262K 上下文)"
    output: "代码补全 / agentic 动作"
    role: "80B 总参、3B 激活的 hybrid-attention MoE,效率来自稀疏激活"
    source_pointer: "arxiv:2603.00729 §3"
  - name: "可验证任务合成"
    type: dataset
    input: "9 语言 bug 合成 + 真实 GitHub PR"
    output: "~800K 可验证 SWE 任务(可执行环境)"
    role: "提供可由执行结果自动判分的训练信号"
    source_pointer: "arxiv:2603.00729 §2.1 / Table 10-11"
  - name: "领域专家 + 多轮 RL"
    type: method
    input: "agentic 轨迹 + 执行验证奖励"
    output: "Web/UX/单轮QA/软件工程 四专家 → 蒸馏成单模型"
    role: "coding-agent 能力主要来源(SWE 专家用多轮 RL + 奖励塑形)"
    source_pointer: "arxiv:2603.00729 §4.2"
pipeline_steps:
  - "继续预训练(trillions token,370 语言,600B 仓库代码)"
  - "可验证任务合成 + agentic 轨迹收集"
  - "SFT(执行验证过滤)→ 四领域专家 RL → 蒸馏成统一模型"
experiments:
  - "SWE-Bench Verified/Multilingual/Pro、Terminal-Bench、函数级与竞赛基准"
claims:
  - "agentic 训练栈驱动 coding 能力,80A3 以小激活足迹逼近更大对手"
artifacts:
  - "开源 base + instruct 权重(数据/算力未公开)"
metrics:
  - "SWE-Bench 解决率(%)"
  - "EvalPlus / MultiPL-E / CRUXEval pass"
  - "Codeforces rating"
baselines:
  - "Claude-Opus-4.5 78.2% / Claude-Sonnet-4.5 76.0%"
  - "DeepSeek-V3.2(671A37) 70.2%"
  - "GLM-4.7(358A32) 74.2% / MiniMax-M2.1(230A10) 74.8% / Kimi-K2.5(1000A32) 73.2%"
failure_modes:
  - "复杂大规模 SWE / UI / 安全场景弱"
  - "常需更多交互轮次"
missing_details:
  - "训练数据与合成流程(专有)"
  - "硬件/算力/成本"
  - "权重具体链接与 license"
source_pointers:
  - "arxiv:2603.00729 Table 3-6 / §5.1 / §6"
---

## Notes

证据先于综合。关键审稿点是 §5.1 的 baseline 公平性(同 scaffold 复现 + 去 commit 泄漏 + 统一 300 turn),它决定了『强是否诚实』的判断。
