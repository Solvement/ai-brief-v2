---
text: "README 自称：`A 10 million document corpus takes 31 GB of RAM as float32. turbovec fits it in 4 GB - and searches it faster than FAISS.`"
slug: "ryancodrai-turbovec-main-claim"
kind: "claim"
content: "ryancodrai-turbovec"
source_pointer: "README opening claim"
evidence_strength: "low"
supports:
  - "ryancodrai-turbovec-turboquant-vector-quantization"
  - "ryancodrai-turbovec-id-mapped-vector-index"
contradicts: []
open_challenges:
  - "本次未复现 10 million corpus，也未验证“faster than FAISS”的外部可重复性。"
  - "benchmark 环境、数据集、FAISS 参数和硬件都会影响结论。"
status: "untested"
---

## Claim

作者想解决的是大规模 embedding 的内存占用和本地检索速度。

证据:README 给出 10 million、31 GB、4 GB、FAISS 这些具体对比词。。边界:本次未复现 10 million corpus，也未验证“faster than FAISS”的外部可重复性。。风险:benchmark 环境、数据集、FAISS 参数和硬件都会影响结论。。See [[content/ryancodrai-turbovec]]。
