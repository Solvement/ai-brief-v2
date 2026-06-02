---
text: "Qwen3-Coder-Next 的 coding 能力主要来自 agentic 训练栈与激活参数效率,而非参数规模或评测取巧。"
slug: qwen3-coder-next-training-over-size
kind: claim
content: qwen3-coder-next
source_pointer: "arxiv:2603.00729 Table 3 / §2.1 / §5.1"
evidence_strength: medium
supports:
  - verifiable-task-synthesis
  - agentic-rl-from-execution
open_challenges:
  - "训练数据与合成流程专有,增益归因无法外部独立复核。"
  - "硬件/算力未公开,『性价比/效率』主张缺成本面证据。"
status: supported
---

## Claim

80A3(激活 3B)SWE-Bench Verified 达 71.3%,逼近 DeepSeek-V3.2 671A37 的 70.2%;baseline 全部同 scaffold 复现 + 去 commit 泄漏(§5.1)压低了『评测取巧』嫌疑;作者坦承落后 Claude-Opus-4.5(78.2%)。增益更可信地归于训练栈 + MoE 效率,但归因不可外部验证。出处:arxiv:2603.00729 Table 3 / §5.1。See [[content/qwen3-coder-next]] 与 [[evidence/qwen3-coder-next-results]]。
