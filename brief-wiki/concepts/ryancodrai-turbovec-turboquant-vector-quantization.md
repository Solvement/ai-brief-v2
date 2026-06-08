---
name: "TurboQuant 向量量化"
slug: "ryancodrai-turbovec-turboquant-vector-quantization"
kind: "concept"
tags:
  - "vector-search"
  - "quantization"
  - "rag"
maturity: "emerging"
first_seen_in: "ryancodrai-turbovec"
related_content:
  - "ryancodrai-turbovec"
related_concepts: []
explanation: "人话：把高维 embedding 的方向压成每维少量 bit，而不是保存整条 float32 向量。术语：仓库实现路径是 normalize、random rotation、Lloyd-Max scalar quantization、bit-pack，并在搜索时用 query LUT 直接对 packed codes 计分（来源：README How it works；turbovec/src/encode.rs；turbovec/src/search.rs）。"
examples:
  - "`TurboQuantIndex(dim=1536, bit_width=4)`"
  - "`bytes_per_row = bit_width * (dim / 8)`"
common_misunderstandings:
  - "它不是 embedding 模型；它只索引已经生成的向量。"
  - "压缩后不能精确拿回原始 full-precision embedding。"
open_questions:
  - "README 性能数字在目标硬件和目标数据集上是否复现。"
---

## Explanation

人话：把高维 embedding 的方向压成每维少量 bit，而不是保存整条 float32 向量。术语：仓库实现路径是 normalize、random rotation、Lloyd-Max scalar quantization、bit-pack，并在搜索时用 query LUT 直接对 packed codes 计分（来源：README How it works；turbovec/src/encode.rs；turbovec/src/search.rs）。 出处:https://github.com/ryancodrai/turbovec。See [[content/ryancodrai-turbovec]]。

## Supported by
- [[claims/ryancodrai-turbovec-main-claim]]
