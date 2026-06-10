---
content: "roboflow-supervision"
kind: "evidence-pack"
title: "supervision — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "roboflow/supervision 是一个为计算机视觉提供可复用工具的 Python 库，服务于需要快速可视化、处理模型输出和数据集的开发生态。"
    internal_logic: "### 项目类型说明\n\n本项目并非 agent framework，但按给定分诊重点检查无 agent loop、tool interface、planner 等组件。其实际核心是计算机视觉辅助工具链，以下按其真实架构拆解。\n\n### 核心抽象：Detections（检测结果）\n\nSupervision 设计了一个统一的 `Detections` 数据类，用于封装目标检测、分割等模型的输出。该对象包含边界框坐标、置信度、类别标签等，且可以通过不同的连接器从各种模型库转换而来。\n\n**模型连接器示例**（来源：README models 节）：\n\n```python\nimport cv2\nimport supervision as sv\nfrom ultralytics import YOLO\n\nimage = cv2.imread(...)\nmodel = YOLO(\"yolov8s.pt\")\nresult = model(image)[0]\ndetections = sv.Detections.from_ultralytics(result)\nlen(detections)\n### 5\n```\n\n此外，支持 `from_transformers`、`from_mmdetection` 等方法，以及通过 Roboflow Inference API 的 `from_inference`（需 API key）。\n\n### 标注器（Annotators）\n\nSupervision 提供了多种可定制的标注器，如 `BoxAnnotator`、`MaskAnnotator`、`KeyPointAnnotator` 等，它们接受 `Detections` 对象并绘制到图像上。\n\n**边框标注器代码**（来源：README annotators 节）：\n\n```python\nbox_annotator = sv.BoxAnnotator()\nannotated_frame = box_annotator.annotate(\n    scene=image.copy(),\n    detections=detections\n)\n```\n\n标注器支持自定义颜色、粗细、标签格式等高级选项。\n\n### 数据集工具（DetectionDataset）\n\n`DetectionDataset` 类提供了对检测数据集的统一操作：加载、分割、合并、保存和转换格式。\n\n**加载 COCO 数据集**（来源：README datasets 节）：\n\n```python\nds = sv.DetectionDataset.from_coco(\n    images_directory_path=f\"{dataset.location}/train\",\n    annotations_path=f\"{dataset.location}/train/_annotations.coco.json\",\n)\n```\n\n**分割数据集**：\n\n```python\ntrain_dataset, test_dataset = dataset.split(split_ratio=0.7)\ntest_dataset, valid_dataset = test_dataset.split(split_ratio=0.5)\n### 假设原始 1000 张，则得到 (700, 150, 150)\n```\n\n**格式转换**（来源：README 示例）：\n\n```python\nsv.DetectionDataset.from_yolo(...).as_coco(...)\n```\n\n支持 YOLO、Pascal VOC、COCO 之间的互相转换。\n\n### 视频处理与跟踪\n\n库中提供了 `ByteTrack` 跟踪集成和视频流处理示例，可实现实时目标跟踪和计数，如 README 中教程视频所示（Dwell Time Analysis，Speed Estimation）。使用 `sv.ByteTrack.update(detections)` 获得跟踪 ID，并在标注器中使用。\n\n### 依赖和平台\n\n核心依赖 Python 3.9+，OpenCV，以及可选模型库（ultralytics、transformers 等）。与 Roboflow 平台关联紧密，部分功能需要 Roboflow API。\n\n### 安全边界\n\n无特殊安全机制，作为工具库使用时应由调用方管理数据访问和认证密钥。"
    failure_mode: "部分功能强依赖 Roboflow 平台，若停止服务或更改政策，影响部分用户。"
    source_pointer: "https://github.com/roboflow/supervision"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/true/MIT/0.28.0"
experiments: []
claims:
  - "[[claims/roboflow-supervision-main-claim]]"
artifacts:
  - "[[artifacts/roboflow-supervision-repo]]"
metrics:
  - "stars=43397"
  - "forks=3860"
  - "open_issues=99"
  - "latest_release=0.28.0"
  - "pushed_at=2026-06-10T13:28:43Z"
baselines: []
failure_modes:
  - "部分功能强依赖 Roboflow 平台，若停止服务或更改政策，影响部分用户。"
  - "版本尚未达到 1.0，API 可能发生破坏性变更。"
  - "社区维护依赖 roboflow 组织，若组织策略变化，项目可能停滞。"
  - "大量使用第三方模型库，其兼容性风险需持续关注。"
missing_details: []
source_pointers:
  - "https://github.com/roboflow/supervision"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/roboflow-supervision-main-claim]],官方 artifact 落库为 [[artifacts/roboflow-supervision-repo]]。See [[content/roboflow-supervision]]。
