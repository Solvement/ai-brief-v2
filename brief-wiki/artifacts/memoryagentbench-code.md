---
slug: memoryagentbench-code
kind: artifact
content: memoryagentbench
artifact_type: benchmark
url: https://github.com/HUST-AI-HYZ/MemoryAgentBench
official_or_third_party: official
status: available
license: MIT
runnable: yes
missing_parts:
  - "跑全评测需付费 OpenAI API(GPT-4o judge + 商用 agent 对象)"
  - "评测硬件/算力未在正文说明"
last_checked: "2026-06-01"
---

## Artifact audit

官方开源:MIT 协议,代码 + 数据(HuggingFace `datasets/ai-hyz/MemoryAgentBench`,含自建 EventQA / FactConsolidation)齐全,有五步 quickstart。可运行,但非零成本——开放题评分与商用 agent 评测都依赖付费 API。综合判定 code_available_but_heavy。出处:github.com/HUST-AI-HYZ/MemoryAgentBench(2026-06-01 核验)。See [[content/memoryagentbench]]。
