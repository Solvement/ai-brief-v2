---
text: "输入主题或关键词后自动生成短视频。"
slug: "harry0703-moneyprinterturbo-main-claim"
kind: "claim"
content: "harry0703-moneyprinterturbo"
source_pointer: "README 开头定位；app/models/schema.py VideoParams；app/services/task.py start"
evidence_strength: "high"
supports:
  - "short-video-pipeline"
  - "stock-footage-assembly"
contradicts: []
open_challenges:
  - "不能证明成片质量稳定，也不能证明任意主题都能拿到合适素材。"
  - "素材搜索依赖外部 API 和英文搜索词，中文主题会先被 LLM 转成英文搜索词，失败时链路会中断。"
status: "supported"
---

## Claim

API/WebUI 最小任务围绕 `video_subject` 或 `video_script` 展开；主流程会生成脚本、搜索词、音频、字幕、素材和最终视频。

证据:`VideoParams` 包含 `video_subject`、`video_script`、`video_terms`、`video_source`、`voice_name`、`bgm_type` 等字段；`start()` 逐步调用 generate_script、generate_terms、generate_audio、generate_subtitle、get_video_materials、generate_final_videos。。边界:不能证明成片质量稳定，也不能证明任意主题都能拿到合适素材。。风险:素材搜索依赖外部 API 和英文搜索词，中文主题会先被 LLM 转成英文搜索词，失败时链路会中断。。See [[content/harry0703-moneyprinterturbo]]。
