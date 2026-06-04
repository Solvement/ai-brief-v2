---
name: "可替换的媒体生成管道"
slug: "replaceable-media-pipeline"
kind: "concept"
tags:
  - "pipeline"
  - "configuration"
  - "abstraction"
maturity: "active"
first_seen_in: "pixelle-video"
related_content:
  - "pixelle-video"
related_concepts: []
explanation: "将视频生成流程中的图像、视频、语音等环节抽象为独立管道，每个管道可选用不同的后端实现（本地 ComfyUI、云端 RunningHub、直连 API），通过配置灵活切换，业务逻辑无需修改。"
examples:
  - "图像生成可选择 selfhost/xxx.json, runninghub/xxx, api/dashscope-wan"
  - "TTS 可从下拉菜单选择不同的工作流"
common_misunderstandings:
  - "并非每个管道都能任意互操作，某些组合可能需要手动调整参数"
open_questions:
  - "如何保证管道切换时输出的格式和质量一致性？"
---

## Explanation

将视频生成流程中的图像、视频、语音等环节抽象为独立管道，每个管道可选用不同的后端实现（本地 ComfyUI、云端 RunningHub、直连 API），通过配置灵活切换，业务逻辑无需修改。 出处:https://github.com/aidc-ai/pixelle-video。See [[content/pixelle-video]]。

## Supported by
- [[claims/pixelle-video-main-claim]]
