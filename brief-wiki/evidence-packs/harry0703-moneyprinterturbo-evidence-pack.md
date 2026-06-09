---
content: "harry0703-moneyprinterturbo"
kind: "evidence-pack"
title: "MoneyPrinterTurbo — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "MoneyPrinterTurbo 是一个把主题或脚本自动变成短视频的开源 AI 应用：LLM 写文案和搜索词，TTS 配音，素材来自 Pexels/Pixabay 或本地文件，最后用 MoviePy/FFmpeg 合成成片。"
    internal_logic: "真实流程可以从 API 的 `/videos` 看：控制器创建任务 ID，把 `TaskVideoRequest` 丢给任务管理器，后台线程执行 `app/services/task.py:start`。（来源：app/controllers/v1/video.py create_task；app/controllers/manager/base_manager.py）\n\n```mermaid\nflowchart TD\n  A[用户主题或脚本] --> B[API 或 WebUI]\n  B --> C[任务队列]\n  C --> D[LLM 写脚本]\n  D --> E[LLM 生成英文搜索词]\n  E --> F[Pexels 或 Pixabay 或本地素材]\n  D --> G[TTS 生成 audio mp3]\n  G --> H[字幕 edge 或 whisper]\n  F --> I[MoviePy FFmpeg 拼接 combined]\n  H --> J[叠字幕和音频 final mp4]\n  J --> K[任务状态和下载链接]\n```\n\n一个具体例子：`VideoParams(video_subject=\"金钱的作用\", voice_name=\"zh-CN-XiaoyiNeural-Female\")` 是 `task.py` 里自带的本地调用示例；完整任务会把脚本写入 `script.json`，音频写入 `audio.mp3`，字幕写入 `subtitle.srt`，最后生成 `final-1.mp4`。（来源：app/services/task.py __main__/save_script_data/generate_final_videos）\n\n最小运行路径是先复制配置，再启动 API：`config.example.toml -> config.toml`，`uv run python main.py`；Docker 路径是 `docker-compose up`，WebUI/API 分别映射到 `8501/8080`。（来源：README 安装部署；docker-compose.yml）"
    failure_mode: "config.example.toml pexels_api_keys/pixabay_api_keys；app/services/material.py"
    source_pointer: "https://github.com/harry0703/moneyprinterturbo"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v1.2.9"
experiments: []
claims:
  - "[[claims/harry0703-moneyprinterturbo-main-claim]]"
artifacts:
  - "[[artifacts/harry0703-moneyprinterturbo-repo]]"
metrics:
  - "stars=82088"
  - "forks=11698"
  - "open_issues=27"
  - "latest_release=v1.2.9"
  - "pushed_at=2026-06-08T07:46:26Z"
baselines: []
failure_modes:
  - "config.example.toml pexels_api_keys/pixabay_api_keys；app/services/material.py"
  - "config.example.toml edge_tts_timeout；app/services/voice.py"
  - "app/services/llm.py _generate_response/generate_script/generate_terms"
  - "README 常见问题；config.example.toml ffmpeg_path/video_codec；app/services/video.py"
  - "config.example.toml max_concurrent_tasks/max_queued_tasks；app/controllers/v1/video.py；app/controllers/manager/base_manager.py"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/harry0703/moneyprinterturbo"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/harry0703-moneyprinterturbo-main-claim]],官方 artifact 落库为 [[artifacts/harry0703-moneyprinterturbo-repo]]。See [[content/harry0703-moneyprinterturbo]]。
