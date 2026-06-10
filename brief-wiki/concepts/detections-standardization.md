---
name: "Detections 标准化"
slug: "detections-standardization"
kind: "concept"
tags:
  - "cv"
  - "abstraction"
  - "connector"
maturity: "active"
first_seen_in: "roboflow-supervision"
related_content:
  - "roboflow-supervision"
related_concepts: []
explanation: "定义一个通用的检测结果数据结构（Detections），包含边界框、置信度、类别标签等，并通过适配器从不同模型库转换，实现模型无关性。"
examples:
  - "sv.Detections.from_ultralytics(result)"
  - "sv.Detections.from_transformers(result)"
common_misunderstandings:
  - "不是所有模型输出都直接兼容，需要适配器支持。"
open_questions:
  - "如何扩展新的模型适配器？是否支持自定义属性？"
---

## Explanation

定义一个通用的检测结果数据结构（Detections），包含边界框、置信度、类别标签等，并通过适配器从不同模型库转换，实现模型无关性。 出处:https://github.com/roboflow/supervision。See [[content/roboflow-supervision]]。

## Supported by
- [[claims/roboflow-supervision-main-claim]]
