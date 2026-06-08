---
name: "文件化事实源"
slug: "artifact-authority"
kind: "concept"
tags:
  - "agent-runtime"
  - "workflow-state"
  - "reliability"
maturity: "active"
first_seen_in: "hkuds-vimax"
related_content:
  - "hkuds-vimax"
related_concepts: []
explanation: "人话：让 `.working_dir` 里的文件决定项目进度，而不是让模型凭记忆说“我做完了”。在 ViMax 中，`story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 和 `final_video.mp4` 都被 `artifact_checklist()` 检查。术语定义：artifact authority 指工作流状态由持久化产物证明。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md）"
examples:
  - "`.working_dir/<session_id>/idea2video/story.txt` 存在才算故事已生成"
  - "`vimax_render_video` 缺结构化文本依赖时返回 missing，而不是假装开始渲染"
common_misunderstandings:
  - "不是把所有输出都缓存就自动可靠；仍要校验文件内容是否符合 schema 和业务质量。"
  - "文件存在不等于视频质量合格。"
open_questions:
  - "仓库未说明是否有自动清理、版本化或多人协作冲突处理。"
---

## Explanation

人话：让 `.working_dir` 里的文件决定项目进度，而不是让模型凭记忆说“我做完了”。在 ViMax 中，`story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 和 `final_video.mp4` 都被 `artifact_checklist()` 检查。术语定义：artifact authority 指工作流状态由持久化产物证明。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md） 出处:https://github.com/hkuds/vimax。See [[content/hkuds-vimax]]。

## Supported by
- [[claims/hkuds-vimax-main-claim]]
