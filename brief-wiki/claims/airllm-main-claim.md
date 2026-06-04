---
text: "70B large language models to run inference on a single 4GB GPU card without quantization, distillation and pruning."
slug: "airllm-main-claim"
kind: "claim"
content: "airllm"
source_pointer: "README 开头描述"
evidence_strength: "medium"
supports:
  - "layer-wise-model-loading"
  - "weight-only-block-wise-quantization"
contradicts: []
open_challenges:
  - "未提供内存占用曲线或峰值显存监控。"
  - "若模型加载方式过于理想化或实际模型版本差异，可能无法在严格的 4GB 限制下运行。"
status: "supported"
---

## Claim

70B 大模型可以在单张 4GB GPU 上推理，无需量化、蒸馏或剪枝。

证据:核心价值主张，有 Colab notebook 示例（但未验证实际内存占用）。边界:未提供内存占用曲线或峰值显存监控。。风险:若模型加载方式过于理想化或实际模型版本差异，可能无法在严格的 4GB 限制下运行。。See [[content/airllm]]。
