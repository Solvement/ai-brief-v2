---
name: "相机树"
slug: "camera-tree"
kind: "concept"
tags:
  - "video-generation"
  - "continuity"
  - "shot-planning"
maturity: "emerging"
first_seen_in: "hkuds-vimax"
related_content:
  - "hkuds-vimax"
related_concepts: []
explanation: "人话：用父子关系记录哪个宽镜头能覆盖哪个近景镜头，从而为后续关键帧生成提供参考。术语定义：camera tree 是一组 `Camera` 节点，字段包括 `idx`、`active_shot_idxs`、`parent_cam_idx`、`parent_shot_idx`、`missing_info`。（来源：interfaces/camera.py；来源：agents/camera_image_generator.py）"
examples:
  - "`CameraImageGenerator.construct_camera_tree()` 把 `<CAMERA_0>`、`<CAMERA_1>` 等镜头描述交给 LLM 输出 parent camera items"
  - "如果子镜头缺少父镜头覆盖的信息，`missing_info` 会被用于新相机图生成 prompt"
common_misunderstandings:
  - "它不是真实 3D 相机求解；它是基于文本镜头描述的语义结构。"
  - "父相机覆盖子相机不保证像素级一致。"
open_questions:
  - "没有仓库内评测说明 camera tree 判断准确率。"
---

## Explanation

人话：用父子关系记录哪个宽镜头能覆盖哪个近景镜头，从而为后续关键帧生成提供参考。术语定义：camera tree 是一组 `Camera` 节点，字段包括 `idx`、`active_shot_idxs`、`parent_cam_idx`、`parent_shot_idx`、`missing_info`。（来源：interfaces/camera.py；来源：agents/camera_image_generator.py） 出处:https://github.com/hkuds/vimax。See [[content/hkuds-vimax]]。

## Supported by
- [[claims/hkuds-vimax-main-claim]]
