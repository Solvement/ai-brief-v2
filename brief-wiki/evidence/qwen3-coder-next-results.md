---
slug: qwen3-coder-next-results
kind: evidence
content: qwen3-coder-next
experiment_or_case: "coding/agentic 基准横向对比(80A3 vs 开源大模型与前沿闭源)"
dataset: "SWE-Bench Verified/Multilingual/Pro、Terminal-Bench 2.0、EvalPlus、MultiPL-E、CRUXEval、LiveCodeBench v6、Codeforces"
baseline: "Claude-Opus-4.5 / Sonnet-4.5、DeepSeek-V3.2(671A37)、GLM-4.7(358A32)、MiniMax-M2.1(230A10)、Kimi-K2.5(1000A32)"
metric: "解决率(%) / pass / rating"
result: "SWE-Bench Verified 70.6–71.3%(三 scaffold);Multilingual 62.8%;Pro 56.2%;EvalPlus 86.56%;MultiPL-E 88.23%;CRUXEval 95.88%;LiveCodeBench v6 58.93%;Codeforces 2100;Terminal-Bench 2.0 34.2–36.2%。对照 Claude-Opus-4.5 78.2%。"
exactness: exact
sample_size: "80A3(激活 3B);max 300 turns"
limitations: "作者侧复现(已做去泄漏+统一 scaffold);训练数据/算力未公开。"
source_pointer: "arxiv:2603.00729 Table 3-6 / §5.1"
---

## Evidence

数字逐项摘自 v1 正文表格;§5.1 记录了 baseline 公平性做法(同 scaffold 复现、去 commit 泄漏、统一 turn 上限)。See [[content/qwen3-coder-next]] 与 [[claims/qwen3-coder-next-training-over-size]]。
