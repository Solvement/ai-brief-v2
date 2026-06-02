---
text: "Integrating LTM+STM management into the agent's policy (and training it with RL) outperforms modular memory-augmented baselines on long-horizon tasks."
slug: agemem-unified-beats-modular
kind: claim
content: agemem
source_pointer: "arxiv:2601.01885 Table 2"
evidence_strength: medium
open_challenges:
  - "Gains shown on 5 controlled benchmarks; abstract notes evaluation is 'relatively controlled compared to open-ended real-world deployments'."
  - "RL trajectories sourced only from HotpotQA — transfer to other curricula untested."
status: supported
---

## Claim

On Qwen2.5-7B AgeMem reaches 41.96% avg vs Mem0 37.14% (+4.82pp); on Qwen3-4B 54.31% vs A-Mem 45.74% (+8.57pp). The RL stage contributes +8.53pp / +8.72pp over AgeMem-noRL. Source: arxiv:2601.01885 Table 2. See [[content/agemem]] and [[evidence/agemem-main-results]].
