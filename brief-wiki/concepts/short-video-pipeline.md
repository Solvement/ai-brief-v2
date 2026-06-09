---
name: "短视频流水线"
slug: "short-video-pipeline"
kind: "concept"
tags:
  - "ai-app"
  - "video"
  - "workflow"
maturity: "active"
first_seen_in: "harry0703-moneyprinterturbo"
related_content:
  - "harry0703-moneyprinterturbo"
related_concepts: []
explanation: "把主题到成片拆成脚本、搜索词、配音、字幕、素材、合成几个阶段，每阶段有中间产物，便于失败重试和调试。"
examples:
  - "MoneyPrinterTurbo 的 `app/services/task.py:start`"
  - "`stop_at=audio/subtitle/materials` 分阶段返回"
common_misunderstandings:
  - "这不是从零生成视频画面，而是素材检索加自动剪辑。"
  - "LLM 只负责文案和搜索词，不负责实际视频渲染。"
open_questions:
  - "不同主题下素材相关性的稳定性需要实测。"
---

## Explanation

把主题到成片拆成脚本、搜索词、配音、字幕、素材、合成几个阶段，每阶段有中间产物，便于失败重试和调试。 出处:https://github.com/harry0703/moneyprinterturbo。See [[content/harry0703-moneyprinterturbo]]。

## Supported by
- [[claims/harry0703-moneyprinterturbo-main-claim]]
