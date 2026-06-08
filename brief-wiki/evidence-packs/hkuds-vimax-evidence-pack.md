---
content: "hkuds-vimax"
kind: "evidence-pack"
title: "ViMax — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "ViMax 是一个把想法、剧本或小说拆成故事、角色、分镜、镜头、关键帧和视频片段的多阶段视频生成代理框架，但端到端效果依赖外部 LLM、图片生成和视频生成 API。"
    internal_logic: "人话：以仓库自带的 `main_script2video.py` 为例，用户先在文件里写剧本。实际示例是 `EXT. SCHOOL GYM - DAY`，包含 John 和 Jane 的篮球训练对白；约束是 `Fast-paced with no more than 15 shots.`，风格是 `Anime Style`。入口调用 `Script2VideoPipeline.init_from_config(config_path=\"configs/script2video.yaml\")`，再 `await pipeline(script=script, user_requirement=user_requirement, style=style)`。（来源：main_script2video.py）\n\n第一步，配置加载。`configs/script2video.yaml` 把 chat model 设为 `google/gemini-2.5-flash-lite-preview-09-2025`，`model_provider: openai`，`base_url: https://openrouter.ai/api/v1`；图片生成类是 `tools.ImageGeneratorNanobananaGoogleAPI`，视频生成类是 `tools.VideoGeneratorVeoGoogleAPI`；工作目录是 `.working_dir/script2video`。`RenderBackend.from_config()` 会按 `class_path` 动态 import 这些类，并按 `max_requests_per_minute` / `max_requests_per_day` 创建 `RateLimiter`。（来源：configs/script2video.yaml；来源：tools/render_backend.py）\n\n第二步，结构化文本规划。`Script2VideoPipeline.plan_text_artifacts()` 的真实顺序是：如果没有传入 characters，就 `extract_characters` 写 `characters.json`；然后 `design_storyboard` 写 `storyboard.json`；再 `decompose_visual_descriptions`，每个镜头写 `shots/<idx>/shot_description.json`；最后 `construct_camera_tree` 写 `camera_tree.json`。测试 `test_plan_text_artifacts_emits_progress_in_order` 验证的 progress 顺序正是 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`。（来源：pipelines/script2video_pipeline.py plan_text_artifacts；来源：tests/test_vimax_adapters.py）\n\n第三步，渲染。`__call__()` 会先生成或读取角色肖像注册表 `character_portraits_registry.json`，再为每个 camera 生成 frame 任务，为每个 shot 生成 video 任务。对于 `variation_type` 为 `medium` 或 `large` 的镜头，视频生成前会等待 first frame 和 last frame；视频 prompt 是 `shot_description.motion_desc + \"\\n\" + shot_description.audio_desc`，参考图是 `first_frame.png`，以及需要时的 `last_frame.png`。每个镜头输出到 `shots/<idx>/video.mp4`，最后用 MoviePy `concatenate_videoclips` 合成 `final_video.mp4`。（来源：pipelines/script2video_pipeline.py __call__；来源：pipelines/script2video_pipeline.py generate_video_for_single_shot）\n\n第四步，agent 模式把这条管线包装成可交互工具。`vimax_narrative_planning` 只做文本规划，不生成图片视频；`vimax_render_video` 会先检查 `idea2video/story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 等依赖是否齐全。TUI 通过 `ui/src/cli.tsx` 启动 `uv run python main_agent.py --jsonl --stdin-repl`，把 JSONL 事件映射成终端界面。（来源：agent_runtime/vimax_adapters.py；来源：prompts/workflow.md；来源：ui/src/cli.tsx）\n\n术语定义：storyboard 是镜头级分镜；shot_description 是把一个镜头拆成首帧、尾帧、运动描述和音频描述；camera_tree 是不同相机位之间的父子/覆盖关系；first/last-frame-to-video 是用首帧和可选尾帧约束视频生成。"
    failure_mode: "agent_runtime/config.py；agent_runtime/vimax_adapters.py"
    source_pointer: "https://github.com/hkuds/vimax"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/false/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/hkuds-vimax-main-claim]]"
artifacts:
  - "[[artifacts/hkuds-vimax-repo]]"
metrics:
  - "stars=9079"
  - "forks=1374"
  - "open_issues=37"
  - "latest_release=not_found"
  - "pushed_at=2026-06-01T16:39:16Z"
baselines: []
failure_modes:
  - "agent_runtime/config.py；agent_runtime/vimax_adapters.py"
  - "tools/image_generator_nanobanana_google_api.py；tools/image_generator_nanobanana_yunwu_api.py"
  - "tools/video_generator_openrouter_api.py；tools/video_generator_veo_yunwu_api.py"
  - "agents/camera_image_generator.py；pipelines/script2video_pipeline.py"
  - "vimax；ui/package.json；README Quick Start"
  - "pyproject.toml；README Quick Start"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
  - "homepage: not_found"
source_pointers:
  - "https://github.com/hkuds/vimax"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/hkuds-vimax-main-claim]],官方 artifact 落库为 [[artifacts/hkuds-vimax-repo]]。See [[content/hkuds-vimax]]。
