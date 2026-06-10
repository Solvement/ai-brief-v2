---
text: "README 自称 'model agnostic'（模型无关）。"
slug: "roboflow-supervision-main-claim"
kind: "claim"
content: "roboflow-supervision"
source_pointer: "README models 节首句 'Supervision was designed to be model agnostic.'"
evidence_strength: "medium"
supports:
  - "detections-standardization"
  - "annotator-composition"
contradicts: []
open_challenges:
  - "未展示对所有可能模型（如 TensorFlow Object Detection API）的直接支持，但连接器可扩展。"
  - "若新模型库不提供适配器，用户需要自己编写。"
status: "supported"
---

## Claim

项目宣称可以对接任意分类、检测或分割模型。

证据:提供了 Ultralytics、Transformers、MMDetection 等多个模型库的连接器示例。。边界:未展示对所有可能模型（如 TensorFlow Object Detection API）的直接支持，但连接器可扩展。。风险:若新模型库不提供适配器，用户需要自己编写。。See [[content/roboflow-supervision]]。
