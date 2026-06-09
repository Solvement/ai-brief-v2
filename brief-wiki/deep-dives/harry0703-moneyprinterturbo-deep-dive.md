---
content: "harry0703-moneyprinterturbo"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "ai_app"
title: "MoneyPrinterTurbo — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "harry0703/MoneyPrinterTurbo：利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM。"
  what_it_does: "利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM."
  metadata:
    language: "Python"
    total_stars: "82088"
    stars_in_period: "24500"
    author: "harry0703"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "models"
    - "cli"
    - "docs"
  pain_point: "它值得看，不是因为模型新，而是因为把短视频链路里最烦的几段工程胶水都串起来了：脚本、搜索词、素材、配音、字幕、BGM、合成、WebUI/API。对做 AI 应用的人，价值在“端到端产品化流程”而不在单点算法。（来源：README 安装部署；app/controllers/v1/video.py；app/services/task.py）"
  core_capabilities:
    - "分阶段 stop_at 流水线"
    - "外部素材白名单目录"
    - "LLM provider 适配层"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，它更像“短视频生产工作台”，不是通用视频生成模型。 对比 `FujiwaraChoki/MoneyPrinter`：对方 README 自称现在 Ollama-first，并有 DB-backed generation queue；MoneyPrinterTurbo 的取舍是 provider 覆盖更广、WebUI 配置更细，但默认队列是内存，可选 Redis，未看到 Postgres 持久队列。（来源：MoneyPrinter README，https://github.com/FujiwaraChoki/MoneyPrinter；app/controllers/manager） 对比 `gyoridavid/short-video-maker`：对方 README 自称提供 MCP 和 REST，走 Kokoro TTS、Whisper、Pexels、Remotion，并明确目前只支持英文 voiceover、不能传入本地图片/视频；MoneyPrinterTurbo 没有 MCP，但支持中文/多语音、本地素材、Pexels/Pixabay、更多 LLM provider，更适合直接给运营人员做 WebUI。（来源：short-video-maker README，https://github.com/gyoridavid/short-video-maker；webui/Main.py；config.example.toml） 什么时候选 MoneyPrinterTurbo：要快速搭一个可配置的短视频生成 WebUI/API，且需要中文、多个 LLM/TTS provider、本地素材。什么时候选替代项：要 agent/MCP 编排，优先看 short-video-maker；要 Ollama-first 和持久 DB 队列，优先看 FujiwaraChoki/MoneyPrinter。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "真实流程可以从 API 的 `/videos` 看：控制器创建任务 ID，把 `TaskVideoRequest` 丢给任务管理器，后台线程执行 `app/services/task.py:start`。（来源：app/controllers/v1/video.py create_task；app/controllers/manager/base_manager.py） ```mermaid flowchart TD A[用户主题或脚本] --> B[API 或 WebUI] B --> C[任务队列] C --> D[LLM 写脚本] D --> E[LLM 生成英文搜索词] E --> F[Pexels 或 Pixabay 或本地素材] D --> G[TTS 生成 audio mp3] G --> H[字幕 edge 或 whisper] F --> I[MoviePy FFmpeg 拼接 combined] H --> J[叠字幕和音频 final mp4] J --> K[任务状态和下载链接] ``` 一个具体例子：`VideoParams(video_subject=\"金钱的作用\", voice_name=\"zh-CN-XiaoyiNeural-Female\")` 是 `task.py` 里自带的本地调用示例；完整任务会把脚本写入 `script.json`，音频写入 `audio.mp3`，字幕写入 `subtitle.srt`，最后生成 `final-1.mp4`。（来源：app/services/task.py __main__/save_script_data/generate_final_videos） 最小运行路径是先复制配置，再启动 API：`config.example.toml -> config.toml`，`uv run python main.py`；Docker 路径是 `docker-compose up`，WebUI/API 分别映射到 `8501/8080`。（来源：README 安装部署；docker-compose.yml）"
  essential_design_difference: "最值得复用的不是 UI，而是这些“短视频流水线”的工程切分。它把 AI 不稳定输出包在可观测、可降级、可排队的任务系统里。 - 分阶段 stop_at 流水线；把长链路拆成 `script/terms/audio/subtitle/materials/video`，允许只跑到某一步并返回中间产物。；如果产品只需要一次性成片、无需调试中间产物，这层会增加 API 面。；`/audio`、`/subtitle`、`/videos` 共用同一套 `create_task`，降低重复实现。（来源：app/controllers/v1/video.py；app/services/task.py stop_at） - 外部素材白名单目录；上传和读取素材时只允许任务目录、songs 目录、local_videos 目录内的文件。；如果所有素材都来自可信对象存储，目录白名单可换成对象 key 白名单。；避免用户通过 BGM 或本地素材参数让 MoviePy 读取服务器敏感文件。（来源：app/utils/file_security.py；app/services/video.py get_bgm_file/preprocess_video） - LLM provider 适配层；用 `llm_provider` 统一选择 OpenAI 兼容、DashScope、Gemini、LiteLLM、Ollama 等路径。；如果团队只支持一个模型网关，保留这么多分支会拉高测试成本。；短视频应用的模型选择经常受地区、成本和账号影响，provider 抽象能提高可部署性。（来源：config.example.toml；app/services/llm.py _generate_response） - 硬件编码失败回退；高级编码器先白名单检查，运行失败后用 `libx264` 重试。；如果只跑云端统一镜像，可固定一个编码器，减少分支。；视频合成最容易在用户机器上被 FFmpeg/驱动差异打断；回退能减少“高级配置导致整单失败”。（来源：app/services/video.py _write_videofile_with_codec_fallback；test/services/test_video.py）"
  practitioner_meaning: "建议 clone-and-run：如果你在做 AI 内容生产工具，它是很好的端到端参考，尤其是任务流水线、素材白名单、TTS/字幕对齐、FFmpeg 回退。不要把它当“视频生成模型”评估；它的本质是把现成 LLM、TTS、素材库和视频剪辑工具编排成短视频应用。生产使用前优先补鉴权、成本限流、素材授权确认和端到端监控。（来源：app/services/task.py；app/controllers/manager；app/utils/file_security.py）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "MoneyPrinterTurbo 是一个把主题或脚本自动变成短视频的开源 AI 应用：LLM 写文案和搜索词，TTS 配音，素材来自 Pexels/Pixabay 或本地文件，最后用 MoviePy/FFmpeg 合成成片。"
    body_md: "人话：它把“我想做一个关于 X 的短视频”变成一个可下载的 MP4。术语：这是一个面向短视频生产的编排型 AI app，不是从像素生成视频的 diffusion/video model。（来源：README 功能特性；app/services/task.py start）"
  why_worth_attention:
    summary: ""
    body_md: "它值得看，不是因为模型新，而是因为把短视频链路里最烦的几段工程胶水都串起来了：脚本、搜索词、素材、配音、字幕、BGM、合成、WebUI/API。对做 AI 应用的人，价值在“端到端产品化流程”而不在单点算法。（来源：README 安装部署；app/controllers/v1/video.py；app/services/task.py）"
    bullets:
      - "已核实有双入口：Streamlit WebUI 走 `webui/Main.py`，API 走 `main.py` 启动 FastAPI，`docker-compose.yml` 同时定义 webui 和 api 两个服务。（来源：webui/Main.py；main.py；docker-compose.yml）"
      - "已核实主流程会产出 `script.json`、`audio.mp3`、`subtitle.srt`、`combined-N.mp4`、`final-N.mp4` 这类任务文件，不只是 README 演示图。（来源：app/services/task.py save_script_data/generate_audio/generate_final_videos）"
      - "已核实它对生产化边角有处理：队列上限默认 `max_concurrent_tasks = 5`、`max_queued_tasks = 100`，路径读取用白名单目录校验，硬件编码失败回退 `libx264`。（来源：config.example.toml；app/controllers/manager/base_manager.py；app/utils/file_security.py；app/services/video.py）"
  key_claims_evidence:
    summary: ""
    body_md: "下面区分 README 自称和代码已核实。README 里的“支持多模型、高清、无版权”等说法需要看配置和实现；代码层面能确认的是接入点、流程、默认值和约束。"
    items:
      - claim: "输入主题或关键词后自动生成短视频。"
        plain_english: "API/WebUI 最小任务围绕 `video_subject` 或 `video_script` 展开；主流程会生成脚本、搜索词、音频、字幕、素材和最终视频。"
        source: "README 开头定位；app/models/schema.py VideoParams；app/services/task.py start"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`VideoParams` 包含 `video_subject`、`video_script`、`video_terms`、`video_source`、`voice_name`、`bgm_type` 等字段；`start()` 逐步调用 generate_script、generate_terms、generate_audio、generate_subtitle、get_video_materials、generate_final_videos。"
        does_not_support: "不能证明成片质量稳定，也不能证明任意主题都能拿到合适素材。"
        threat: "素材搜索依赖外部 API 和英文搜索词，中文主题会先被 LLM 转成英文搜索词，失败时链路会中断。"
      - claim: "支持 API 和 Web 界面。"
        plain_english: "它不是只有脚本命令；WebUI 和 API 是两个入口。"
        source: "README 功能特性；webui/Main.py；main.py；app/asgi.py；docker-compose.yml"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "WebUI 用 Streamlit；API 用 FastAPI，路由含 `/videos`、`/subtitle`、`/audio`、`/tasks/{task_id}`；Docker 暴露 `8501` 和 `8080`。"
        does_not_support: "未验证公开部署后的鉴权、限流和多租户隔离；API 认证代码在控制器里是注释状态。"
        threat: "如果直接公网暴露，匿名任务会消耗 LLM/TTS/素材 API 成本。"
      - claim: "支持多种 LLM provider。"
        plain_english: "配置文件和服务代码确实列出并分支处理多家模型入口。"
        source: "config.example.toml LLM provider；app/services/llm.py _generate_response"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "配置列出 OpenAI、AIHubMix、Moonshot、Azure、Qwen、DeepSeek、Gemini、Ollama、Groq、Grok、MiniMax、MiMo、ModelScope、LiteLLM 等；代码按 `llm_provider` 分支创建请求。"
        does_not_support: "未证明所有 provider 在当前版本都可用；API key、模型名、地区策略会影响运行。"
        threat: "provider 越多，兼容测试面越大；部分 provider 只在异常处理里返回字符串错误。"
      - claim: "默认 TTS 不需要 API key。"
        plain_english: "README 说默认 Edge TTS；代码里普通 voice 默认走 edge_tts 分支。"
        source: "README 语音合成；app/services/voice.py tts/azure_tts_v1；config.example.toml edge_tts_timeout"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "默认说明是 Edge TTS；`edge_tts_timeout = 30` 用来避免流式请求卡住。"
        does_not_support: "Edge TTS 的服务可用性、限流、合法用途不由本仓库保证。"
        threat: "网络不可达、voice 与文本语言不匹配或服务端限流会导致配音失败。"
      - claim: "支持 Pexels/Pixabay 和本地素材。"
        plain_english: "素材来源不是抽象能力：代码里有 Pexels/Pixabay 搜索，也有本地素材预处理。"
        source: "config.example.toml video_source/pexels_api_keys/pixabay_api_keys；app/services/material.py；app/services/video.py preprocess_video"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Pexels 请求 `videos/search`，Pixabay 请求 `api/videos`；本地素材限制在 `storage/local_videos`，图片会转成短视频片段。"
        does_not_support: "README 的“无版权”属于项目自称；实际授权仍取决于 Pexels/Pixabay 条款和用户使用方式。"
        threat: "API key、素材授权、搜索结果相关性和下载稳定性都是外部依赖。"
      - claim: "支持 GPU 加速。"
        plain_english: "GPU 只用于 Whisper 字幕转录，不会加速脚本、TTS 或视频剪辑。"
        source: "docs/GPU_DOCKER_DEPLOYMENT.md 为什么要 GPU 加速；docker-compose.gpu.yml；config.example.toml whisper"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "GPU 文档明确写唯一深度学习环节是 faster-whisper；GPU 配置为 `subtitle_provider = \"whisper\"`、`device = \"cuda\"`、`compute_type = \"float16\"`。"
        does_not_support: "不支持把整条视频生成链路都变成 GPU 加速。"
        threat: "需要 NVIDIA 驱动和 Container Toolkit；默认配置仍是 CPU/INT8。"
  how_it_works:
    summary: ""
    body_md: "真实流程可以从 API 的 `/videos` 看：控制器创建任务 ID，把 `TaskVideoRequest` 丢给任务管理器，后台线程执行 `app/services/task.py:start`。（来源：app/controllers/v1/video.py create_task；app/controllers/manager/base_manager.py）\n\n```mermaid\nflowchart TD\n  A[用户主题或脚本] --> B[API 或 WebUI]\n  B --> C[任务队列]\n  C --> D[LLM 写脚本]\n  D --> E[LLM 生成英文搜索词]\n  E --> F[Pexels 或 Pixabay 或本地素材]\n  D --> G[TTS 生成 audio mp3]\n  G --> H[字幕 edge 或 whisper]\n  F --> I[MoviePy FFmpeg 拼接 combined]\n  H --> J[叠字幕和音频 final mp4]\n  J --> K[任务状态和下载链接]\n```\n\n一个具体例子：`VideoParams(video_subject=\"金钱的作用\", voice_name=\"zh-CN-XiaoyiNeural-Female\")` 是 `task.py` 里自带的本地调用示例；完整任务会把脚本写入 `script.json`，音频写入 `audio.mp3`，字幕写入 `subtitle.srt`，最后生成 `final-1.mp4`。（来源：app/services/task.py __main__/save_script_data/generate_final_videos）\n\n最小运行路径是先复制配置，再启动 API：`config.example.toml -> config.toml`，`uv run python main.py`；Docker 路径是 `docker-compose up`，WebUI/API 分别映射到 `8501/8080`。（来源：README 安装部署；docker-compose.yml）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得复用的不是 UI，而是这些“短视频流水线”的工程切分。它把 AI 不稳定输出包在可观测、可降级、可排队的任务系统里。"
    items:
      - name: "分阶段 stop_at 流水线"
        copy: "把长链路拆成 `script/terms/audio/subtitle/materials/video`，允许只跑到某一步并返回中间产物。"
        skip: "如果产品只需要一次性成片、无需调试中间产物，这层会增加 API 面。"
        why_it_matters: "`/audio`、`/subtitle`、`/videos` 共用同一套 `create_task`，降低重复实现。（来源：app/controllers/v1/video.py；app/services/task.py stop_at）"
      - name: "外部素材白名单目录"
        copy: "上传和读取素材时只允许任务目录、songs 目录、local_videos 目录内的文件。"
        skip: "如果所有素材都来自可信对象存储，目录白名单可换成对象 key 白名单。"
        why_it_matters: "避免用户通过 BGM 或本地素材参数让 MoviePy 读取服务器敏感文件。（来源：app/utils/file_security.py；app/services/video.py get_bgm_file/preprocess_video）"
      - name: "LLM provider 适配层"
        copy: "用 `llm_provider` 统一选择 OpenAI 兼容、DashScope、Gemini、LiteLLM、Ollama 等路径。"
        skip: "如果团队只支持一个模型网关，保留这么多分支会拉高测试成本。"
        why_it_matters: "短视频应用的模型选择经常受地区、成本和账号影响，provider 抽象能提高可部署性。（来源：config.example.toml；app/services/llm.py _generate_response）"
      - name: "硬件编码失败回退"
        copy: "高级编码器先白名单检查，运行失败后用 `libx264` 重试。"
        skip: "如果只跑云端统一镜像，可固定一个编码器，减少分支。"
        why_it_matters: "视频合成最容易在用户机器上被 FFmpeg/驱动差异打断；回退能减少“高级配置导致整单失败”。（来源：app/services/video.py _write_videofile_with_codec_fallback；test/services/test_video.py）"
  dependency_platform_risk:
    summary: ""
    body_md: "风险集中在外部平台、媒体处理二进制、以及公开 API 成本控制。它已经做了一些防护，但不是托管级产品。"
    items:
      - dependency: "Pexels/Pixabay 素材 API"
        what_if_change: "API key 失效、限流、条款变化或搜索结果不足时，素材下载阶段会失败。"
        exposure: "high"
        mitigation_or_unknown: "支持多个 key 轮换和本地素材；授权合规仍需用户确认，README 的“无版权”按自称处理。"
        source: "config.example.toml pexels_api_keys/pixabay_api_keys；app/services/material.py"
      - dependency: "Edge TTS / Azure Speech / Gemini / SiliconFlow / MiMo TTS"
        what_if_change: "TTS 服务限流、接口变更或网络不可达会导致音频和字幕时间轴生成失败。"
        exposure: "high"
        mitigation_or_unknown: "Edge TTS 默认 30 秒超时；支持 no-voice 静音占位和多个 TTS 分支，但未看到统一服务健康检查。"
        source: "config.example.toml edge_tts_timeout；app/services/voice.py"
      - dependency: "LLM provider 与模型网关"
        what_if_change: "模型名下线、响应格式变化、API key 缺失会导致脚本或搜索词生成失败。"
        exposure: "high"
        mitigation_or_unknown: "LLM 层有空响应校验、reasoning `<think>` 清理、最多 5 次重试；但 provider 分支多，兼容面大。"
        source: "app/services/llm.py _generate_response/generate_script/generate_terms"
      - dependency: "FFmpeg/ImageMagick/MoviePy"
        what_if_change: "本机缺少二进制、编码器不可用、素材格式异常，会影响拼接、字幕渲染或最终导出。"
        exposure: "medium"
        mitigation_or_unknown: "README FAQ 给出 ffmpeg/ImageMagick 处理；代码支持 `ffmpeg_path`、编码器白名单和 `libx264` 回退。"
        source: "README 常见问题；config.example.toml ffmpeg_path/video_codec；app/services/video.py"
      - dependency: "公开 API 任务队列"
        what_if_change: "匿名请求堆积会占内存并消耗外部 API 费用。"
        exposure: "medium"
        mitigation_or_unknown: "默认并发 5、队列 100，超过返回 429；认证依赖在控制器中被注释，公网部署需补鉴权。"
        source: "config.example.toml max_concurrent_tasks/max_queued_tasks；app/controllers/v1/video.py；app/controllers/manager/base_manager.py"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点在 README/docs/tree 中未充分说明，落地前要自己验证。"
    items:
      - "成片质量没有仓库内基准；README 的演示视频只能说明存在样例，不能代表稳定质量。（来源：README 视频演示）"
      - "API 鉴权未启用：`verify_token` 相关依赖在路由文件中是注释状态，生产部署鉴权方案未知。（来源：app/controllers/v1/video.py；app/controllers/v1/llm.py）"
      - "未看到针对所有 LLM/TTS provider 的端到端集成测试；测试更多覆盖字幕、视频处理、路径安全和部分 provider 兼容。（来源：test/services）"
      - "跨发 TikTok/Instagram 依赖 Upload-Post，配置默认关闭；真实平台发布成功率、账号风控和失败重试策略未在仓库说明。（来源：config.example.toml upload_post；app/services/upload_post.py）"
      - "Windows 一键包 README 说明仍是 `v1.2.6` 旧打包版本，需要运行 update；当前源码版本是 `1.2.9`。（来源：README Windows一键启动包；pyproject.toml）"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 3
      复用价值: 4
      成熟度: 4
    body_md: "建议 clone-and-run：如果你在做 AI 内容生产工具，它是很好的端到端参考，尤其是任务流水线、素材白名单、TTS/字幕对齐、FFmpeg 回退。不要把它当“视频生成模型”评估；它的本质是把现成 LLM、TTS、素材库和视频剪辑工具编排成短视频应用。生产使用前优先补鉴权、成本限流、素材授权确认和端到端监控。（来源：app/services/task.py；app/controllers/manager；app/utils/file_security.py）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\harry0703-moneyprinterturbo\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\harry0703-moneyprinterturbo\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\harry0703-moneyprinterturbo\\codex-last-message.json"
  invoked_at: "2026-06-09T01:04:14.474Z"
  completed_at: "2026-06-09T01:10:21.304Z"
  repo: "harry0703/MoneyPrinterTurbo"
reasoning_trace:
  paper_type_decision: "project_type = ai_app; evidence from README/artifactAudit only."
  central_contribution: "利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "输入主题或关键词后自动生成短视频。"
    - "支持 API 和 Web 界面。"
    - "支持多种 LLM provider。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "config.example.toml pexels_api_keys/pixabay_api_keys；app/services/material.py"
    - "config.example.toml edge_tts_timeout；app/services/voice.py"
    - "app/services/llm.py _generate_response/generate_script/generate_terms"
    - "README 常见问题；config.example.toml ffmpeg_path/video_codec；app/services/video.py"
    - "config.example.toml max_concurrent_tasks/max_queued_tasks；app/controllers/v1/video.py；app/controllers/manager/base_manager.py"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 3
  reuse_value: 4
  maturity: 4
  main_risk: "建议 clone-and-run：如果你在做 AI 内容生产工具，它是很好的端到端参考，尤其是任务流水线、素材白名单、TTS/字幕对齐、FFmpeg 回退。不要把它当“视频生成模型”评估；它的本质是把现成 LLM、TTS、素材库和视频剪辑工具编排成短视频应用。生产使用前优先补鉴权、成本限流、素材授权确认和端到端监控。（来源：app/services/task.py；app/controllers/manager；app/utils/file_security.py）"
next_actions:
  - "clone-and-run"
unknowns:
  - "成片质量没有仓库内基准；README 的演示视频只能说明存在样例，不能代表稳定质量。（来源：README 视频演示）"
  - "API 鉴权未启用：`verify_token` 相关依赖在路由文件中是注释状态，生产部署鉴权方案未知。（来源：app/controllers/v1/video.py；app/controllers/v1/llm.py）"
  - "未看到针对所有 LLM/TTS provider 的端到端集成测试；测试更多覆盖字幕、视频处理、路径安全和部分 provider 兼容。（来源：test/services）"
  - "跨发 TikTok/Instagram 依赖 Upload-Post，配置默认关闭；真实平台发布成功率、账号风控和失败重试策略未在仓库说明。（来源：config.example.toml upload_post；app/services/upload_post.py）"
  - "Windows 一键包 README 说明仍是 `v1.2.6` 旧打包版本，需要运行 update；当前源码版本是 `1.2.9`。（来源：README Windows一键启动包；pyproject.toml）"
builder_reuse:
  pattern: "分阶段 stop_at 流水线"
  copy: "把长链路拆成 `script/terms/audio/subtitle/materials/video`，允许只跑到某一步并返回中间产物。"
  skip: "如果产品只需要一次性成片、无需调试中间产物，这层会增加 API 面。"
  why_it_matters: "`/audio`、`/subtitle`、`/videos` 共用同一套 `create_task`，降低重复实现。（来源：app/controllers/v1/video.py；app/services/task.py stop_at）"
dependency_platform_risk:
  dependency: "Pexels/Pixabay 素材 API"
  what_if_change: "API key 失效、限流、条款变化或搜索结果不足时，素材下载阶段会失败。"
  exposure: "high"
  mitigation_or_unknown: "支持多个 key 轮换和本地素材；授权合规仍需用户确认，README 的“无版权”按自称处理。"
claim_ledger:
  - claim: "输入主题或关键词后自动生成短视频。"
    plain_english: "API/WebUI 最小任务围绕 `video_subject` 或 `video_script` 展开；主流程会生成脚本、搜索词、音频、字幕、素材和最终视频。"
    source: "README 开头定位；app/models/schema.py VideoParams；app/services/task.py start"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`VideoParams` 包含 `video_subject`、`video_script`、`video_terms`、`video_source`、`voice_name`、`bgm_type` 等字段；`start()` 逐步调用 generate_script、generate_terms、generate_audio、generate_subtitle、get_video_materials、generate_final_videos。"
    does_not_support: "不能证明成片质量稳定，也不能证明任意主题都能拿到合适素材。"
    threat: "素材搜索依赖外部 API 和英文搜索词，中文主题会先被 LLM 转成英文搜索词，失败时链路会中断。"
  - claim: "支持 API 和 Web 界面。"
    plain_english: "它不是只有脚本命令；WebUI 和 API 是两个入口。"
    source: "README 功能特性；webui/Main.py；main.py；app/asgi.py；docker-compose.yml"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "WebUI 用 Streamlit；API 用 FastAPI，路由含 `/videos`、`/subtitle`、`/audio`、`/tasks/{task_id}`；Docker 暴露 `8501` 和 `8080`。"
    does_not_support: "未验证公开部署后的鉴权、限流和多租户隔离；API 认证代码在控制器里是注释状态。"
    threat: "如果直接公网暴露，匿名任务会消耗 LLM/TTS/素材 API 成本。"
  - claim: "支持多种 LLM provider。"
    plain_english: "配置文件和服务代码确实列出并分支处理多家模型入口。"
    source: "config.example.toml LLM provider；app/services/llm.py _generate_response"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "配置列出 OpenAI、AIHubMix、Moonshot、Azure、Qwen、DeepSeek、Gemini、Ollama、Groq、Grok、MiniMax、MiMo、ModelScope、LiteLLM 等；代码按 `llm_provider` 分支创建请求。"
    does_not_support: "未证明所有 provider 在当前版本都可用；API key、模型名、地区策略会影响运行。"
    threat: "provider 越多，兼容测试面越大；部分 provider 只在异常处理里返回字符串错误。"
  - claim: "默认 TTS 不需要 API key。"
    plain_english: "README 说默认 Edge TTS；代码里普通 voice 默认走 edge_tts 分支。"
    source: "README 语音合成；app/services/voice.py tts/azure_tts_v1；config.example.toml edge_tts_timeout"
    attribution: "已核实"
    evidence_strength: "medium"
    supports: "默认说明是 Edge TTS；`edge_tts_timeout = 30` 用来避免流式请求卡住。"
    does_not_support: "Edge TTS 的服务可用性、限流、合法用途不由本仓库保证。"
    threat: "网络不可达、voice 与文本语言不匹配或服务端限流会导致配音失败。"
  - claim: "支持 Pexels/Pixabay 和本地素材。"
    plain_english: "素材来源不是抽象能力：代码里有 Pexels/Pixabay 搜索，也有本地素材预处理。"
    source: "config.example.toml video_source/pexels_api_keys/pixabay_api_keys；app/services/material.py；app/services/video.py preprocess_video"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "Pexels 请求 `videos/search`，Pixabay 请求 `api/videos`；本地素材限制在 `storage/local_videos`，图片会转成短视频片段。"
    does_not_support: "README 的“无版权”属于项目自称；实际授权仍取决于 Pexels/Pixabay 条款和用户使用方式。"
    threat: "API key、素材授权、搜索结果相关性和下载稳定性都是外部依赖。"
  - claim: "支持 GPU 加速。"
    plain_english: "GPU 只用于 Whisper 字幕转录，不会加速脚本、TTS 或视频剪辑。"
    source: "docs/GPU_DOCKER_DEPLOYMENT.md 为什么要 GPU 加速；docker-compose.gpu.yml；config.example.toml whisper"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "GPU 文档明确写唯一深度学习环节是 faster-whisper；GPU 配置为 `subtitle_provider = \"whisper\"`、`device = \"cuda\"`、`compute_type = \"float16\"`。"
    does_not_support: "不支持把整条视频生成链路都变成 GPU 加速。"
    threat: "需要 NVIDIA 驱动和 Container Toolkit；默认配置仍是 CPU/INT8。"
artifact_audit:
  official_repo: "https://github.com/harry0703/MoneyPrinterTurbo"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

harry0703/MoneyPrinterTurbo：利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM。

（来源：README/artifactAudit）

## 干什么

利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 82088 |
| stars_in_period | 24500 |
| author | harry0703 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- models（来源：数据不足）
- cli（来源：数据不足）
- docs（来源：数据不足）

## 解决什么痛点

它值得看，不是因为模型新，而是因为把短视频链路里最烦的几段工程胶水都串起来了：脚本、搜索词、素材、配音、字幕、BGM、合成、WebUI/API。对做 AI 应用的人，价值在“端到端产品化流程”而不在单点算法。（来源：README 安装部署；app/controllers/v1/video.py；app/services/task.py）

## 核心能力

- 分阶段 stop_at 流水线（来源：数据不足）
- 外部素材白名单目录（来源：数据不足）
- LLM provider 适配层（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，它更像“短视频生产工作台”，不是通用视频生成模型。 对比 `FujiwaraChoki/MoneyPrinter`：对方 README 自称现在 Ollama-first，并有 DB-backed generation queue；MoneyPrinterTurbo 的取舍是 provider 覆盖更广、WebUI 配置更细，但默认队列是内存，可选 Redis，未看到 Postgres 持久队列。（来源：MoneyPrinter README，https://github.com/FujiwaraChoki/MoneyPrinter；app/controllers/manager） 对比 `gyoridavid/short-video-maker`：对方 README 自称提供 MCP 和 REST，走 Kokoro TTS、Whisper、Pexels、Remotion，并明确目前只支持英文 voiceover、不能传入本地图片/视频；MoneyPrinterTurbo 没有 MCP，但支持中文/多语音、本地素材、Pexels/Pixabay、更多 LLM provider，更适合直接给运营人员做 WebUI。（来源：short-video-maker README，https://github.com/gyoridavid/short-video-maker；webui/Main.py；config.example.toml） 什么时候选 MoneyPrinterTurbo：要快速搭一个可配置的短视频生成 WebUI/API，且需要中文、多个 LLM/TTS provider、本地素材。什么时候选替代项：要 agent/MCP 编排，优先看 short-video-maker；要 Ollama-first 和持久 DB 队列，优先看 FujiwaraChoki/MoneyPrinter。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

真实流程可以从 API 的 `/videos` 看：控制器创建任务 ID，把 `TaskVideoRequest` 丢给任务管理器，后台线程执行 `app/services/task.py:start`。（来源：app/controllers/v1/video.py create_task；app/controllers/manager/base_manager.py） ```mermaid flowchart TD A[用户主题或脚本] --> B[API 或 WebUI] B --> C[任务队列] C --> D[LLM 写脚本] D --> E[LLM 生成英文搜索词] E --> F[Pexels 或 Pixabay 或本地素材] D --> G[TTS 生成 audio mp3] G --> H[字幕 edge 或 whisper] F --> I[MoviePy FFmpeg 拼接 combined] H --> J[叠字幕和音频 final mp4] J --> K[任务状态和下载链接] ``` 一个具体例子：`VideoParams(video_subject="金钱的作用", voice_name="zh-CN-XiaoyiNeural-Female")` 是 `task.py` 里自带的本地调用示例；完整任务会把脚本写入 `script.json`，音频写入 `audio.mp3`，字幕写入 `subtitle.srt`，最后生成 `final-1.mp4`。（来源：app/services/task.py __main__/save_script_data/generate_final_videos） 最小运行路径是先复制配置，再启动 API：`config.example.toml -> config.toml`，`uv run python main.py`；Docker 路径是 `docker-compose up`，WebUI/API 分别映射到 `8501/8080`。（来源：README 安装部署；docker-compose.yml）

## 本质不同的设计取舍

最值得复用的不是 UI，而是这些“短视频流水线”的工程切分。它把 AI 不稳定输出包在可观测、可降级、可排队的任务系统里。 - 分阶段 stop_at 流水线；把长链路拆成 `script/terms/audio/subtitle/materials/video`，允许只跑到某一步并返回中间产物。；如果产品只需要一次性成片、无需调试中间产物，这层会增加 API 面。；`/audio`、`/subtitle`、`/videos` 共用同一套 `create_task`，降低重复实现。（来源：app/controllers/v1/video.py；app/services/task.py stop_at） - 外部素材白名单目录；上传和读取素材时只允许任务目录、songs 目录、local_videos 目录内的文件。；如果所有素材都来自可信对象存储，目录白名单可换成对象 key 白名单。；避免用户通过 BGM 或本地素材参数让 MoviePy 读取服务器敏感文件。（来源：app/utils/file_security.py；app/services/video.py get_bgm_file/preprocess_video） - LLM provider 适配层；用 `llm_provider` 统一选择 OpenAI 兼容、DashScope、Gemini、LiteLLM、Ollama 等路径。；如果团队只支持一个模型网关，保留这么多分支会拉高测试成本。；短视频应用的模型选择经常受地区、成本和账号影响，provider 抽象能提高可部署性。（来源：config.example.toml；app/services/llm.py _generate_response） - 硬件编码失败回退；高级编码器先白名单检查，运行失败后用 `libx264` 重试。；如果只跑云端统一镜像，可固定一个编码器，减少分支。；视频合成最容易在用户机器上被 FFmpeg/驱动差异打断；回退能减少“高级配置导致整单失败”。（来源：app/services/video.py _write_videofile_with_codec_fallback；test/services/test_video.py）

## 对从业者意味着什么

建议 clone-and-run：如果你在做 AI 内容生产工具，它是很好的端到端参考，尤其是任务流水线、素材白名单、TTS/字幕对齐、FFmpeg 回退。不要把它当“视频生成模型”评估；它的本质是把现成 LLM、TTS、素材库和视频剪辑工具编排成短视频应用。生产使用前优先补鉴权、成本限流、素材授权确认和端到端监控。（来源：app/services/task.py；app/controllers/manager；app/utils/file_security.py）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/short-video-pipeline]]、[[concepts/stock-footage-assembly]]。另见 [[content/harry0703-moneyprinterturbo]]、[[claims/harry0703-moneyprinterturbo-main-claim]]。
