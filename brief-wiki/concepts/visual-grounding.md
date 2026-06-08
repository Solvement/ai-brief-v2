---
name: "Visual Grounding"
slug: "visual-grounding"
kind: "concept"
tags:
  - "vision"
  - "gui"
  - "coordinate"
maturity: "active"
first_seen_in: "bytedance-ui-tars-desktop"
related_content:
  - "bytedance-ui-tars-desktop"
related_concepts: []
explanation: "人话：模型不是靠 DOM id，而是靠截图中看到的位置来决定点哪里。技术定义：把 UI 截图作为视觉输入，输出归一化坐标或 box，再按屏幕尺寸还原成实际点击位置。"
examples:
  - "`parseBoxToScreenCoords()` 把 `[x1,y1,x2,y2]` 中心按 screenWidth/screenHeight 转像素。"
common_misunderstandings:
  - "视觉定位不等于一定精确；缩放、多屏、截图裁剪都会影响坐标。"
open_questions:
  - "UI-TARS-1.5 smart resize factor 对不同分辨率的误差边界未在仓库说明。"
---

## Explanation

人话：模型不是靠 DOM id，而是靠截图中看到的位置来决定点哪里。技术定义：把 UI 截图作为视觉输入，输出归一化坐标或 box，再按屏幕尺寸还原成实际点击位置。 出处:https://github.com/bytedance/ui-tars-desktop。See [[content/bytedance-ui-tars-desktop]]。

## Supported by
- [[claims/bytedance-ui-tars-desktop-main-claim]]
