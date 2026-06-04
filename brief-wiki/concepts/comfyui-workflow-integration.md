---
name: "ComfyUI 工作流集成"
slug: "comfyui-workflow-integration"
kind: "concept"
tags:
  - "comfyui"
  - "workflow"
  - "api-integration"
maturity: "stable"
first_seen_in: "pixelle-video"
related_content:
  - "pixelle-video"
related_concepts: []
explanation: "将 ComfyUI 或 RunningHub 的图形化工作流（JSON 定义）作为可替换的图像/视频生成模块，通过 HTTP API 调用，实现低代码定制。用户只需在 Web UI 选择或上传工作流文件即可切换生成方式。"
examples:
  - "默认使用 image_flux.json 工作流生成配图"
  - "支持用户将自己编写的工作流放入 workflows/ 目录动态加载"
common_misunderstandings:
  - "不是直接使用 ComfyUI 的图形界面，而是通过其 API 驱动自动化生成"
open_questions:
  - "工作流版本管理与依赖冲突如何处理？"
---

## Explanation

将 ComfyUI 或 RunningHub 的图形化工作流（JSON 定义）作为可替换的图像/视频生成模块，通过 HTTP API 调用，实现低代码定制。用户只需在 Web UI 选择或上传工作流文件即可切换生成方式。 出处:https://github.com/aidc-ai/pixelle-video。See [[content/pixelle-video]]。

## Supported by
- [[claims/pixelle-video-main-claim]]
