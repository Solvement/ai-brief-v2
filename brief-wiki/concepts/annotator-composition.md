---
name: "标注器组合"
slug: "annotator-composition"
kind: "concept"
tags:
  - "visualization"
  - "pipeline"
  - "cv"
maturity: "active"
first_seen_in: "roboflow-supervision"
related_content:
  - "roboflow-supervision"
related_concepts: []
explanation: "多个标注器（框、掩码、关键点）可独立配置并组合绘制在同一图像上，形成灵活的可视化管道。"
examples:
  - "box_annotator = sv.BoxAnnotator(); mask_annotator = sv.MaskAnnotator(); ..."
common_misunderstandings:
  - "标注器不自动叠加，需显式按顺序调用 annotate 方法。"
open_questions:
  - "是否有性能优化用于高帧率视频？"
---

## Explanation

多个标注器（框、掩码、关键点）可独立配置并组合绘制在同一图像上，形成灵活的可视化管道。 出处:https://github.com/roboflow/supervision。See [[content/roboflow-supervision]]。

## Supported by
- [[claims/roboflow-supervision-main-claim]]
