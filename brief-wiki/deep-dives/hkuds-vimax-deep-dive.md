---
content: "hkuds-vimax"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "ViMax — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "HKUDS/ViMax：GitHub 描述为“\"ViMax: Agentic Video Generation (Director, Screenwriter, Producer, and Video Generator All-in-One)\"”。"
  what_it_does: "\"ViMax: Agentic Video Generation (Director, Screenwriter, Producer, and Video Generator All-in-One)\""
  metadata:
    language: "Python"
    total_stars: "9079"
    stars_in_period: "5983"
    author: "HKUDS"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "models"
    - "deep"
  pain_point: "人话：值得看的是它把长视频生成问题做成了“文件化工作流”，不是一次性 prompt。每一步都尝试留下 JSON/PNG/MP4，这让后续修分镜、重渲染、断点续跑有明确抓手。README 的“movie-grade”“one-prompt”等表达属于自称；源码能核实的是它确实有配置驱动的后端、会写中间文件、有 agent 工具和测试覆盖部分行为。（来源：README Why ViMax；来源：tools/render_backend.py；来源：agent_runtime/vimax_adapters.py；来源：tests/test_vimax_adapters.py） 术语定义：断点续跑是指如果某个中间文件已经存在，流水线直接读取它而不是重新生成；配置驱动后端是指 YAML 里的 `class_path` 决定实际调用哪个图片/视频生成类。"
  core_capabilities:
    - "Artifact Authority"
    - "Planning/Rendering Split"
    - "Config-Driven Render Backend"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：ViMax 的直接对手不是单个视频模型，而是“怎么把长视频生成做成工程流程”的其他做法。 1. Runway API：Runway 官方 API Reference 列出 Image to video、Text to video、Video to video、Text/Image to Image、sound effects、speech 等端点（外部来源：https://docs.dev.runwayml.com/api/）。差异是 Runway 更像托管生成能力入口，开发者直接调任务 API；ViMax 是本地 repo，把故事、角色、分镜、镜头和渲染拆成文件与工具。做 AI 应用时，如果你只需要稳定托管的视频生成端点，选 Runway；如果你要可审阅、可修改、可断点续跑的创作编排，ViMax 更贴近这个工作流。Runway 的端点能力来自官方文档，生成质量和限制未在本次仓库审计中独立验证。 2. ComfyUI：ComfyUI 官方文档称它是 node-based interface and inference engine，用户通过 nodes 组合模型和操作，也可本地运行，并有 Cloud API/MCP（外部来源：https://docs.comfy.org/）。差异是 ComfyUI 强在可视化节点图和自托管/云端推理工作流；ViMax 强在自然语言输入到叙事规划、镜头拆解、camera_tree、reference selection 的文本代理链。做 AI 应用时，如果团队需要精细控制扩散模型、ControlNet、节点图和本地 GPU，选 ComfyUI；如果团队要把“剧本/小说/想法”变成可审阅视频制作计划，选 ViMax。ComfyUI 的节点/本地/云 API 描述来自官方文档，具体视频工作流效果未在本次审计中跑通。 3. 常见一次性脚本：直接用 LLM 生成 prompt，再调用图片/视频 API，最后 MoviePy 拼接。差异是一次性脚本实现快，但中间状态、修改依赖和失败恢复通常靠人工约定；ViMax 已核实把 `characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 和 `final_video.mp4` 纳入工作流检查。（来源：agent_runtime/session_index.py；来源：pipelines/script2video_pipeline.py） 术语定义：integration path 指系统接入方式；self-hosting 指是否能在本地控制模型/工作流；workflow fit 指它更适合“直接生成”还是“先规划再审阅再渲染”。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：以仓库自带的 `main_script2video.py` 为例，用户先在文件里写剧本。实际示例是 `EXT. SCHOOL GYM - DAY`，包含 John 和 Jane 的篮球训练对白；约束是 `Fast-paced with no more than 15 shots.`，风格是 `Anime Style`。入口调用 `Script2VideoPipeline.init_from_config(config_path=\"configs/script2video.yaml\")`，再 `await pipeline(script=script, user_requirement=user_requirement, style=style)`。（来源：main_script2video.py） 第一步，配置加载。`configs/script2video.yaml` 把 chat model 设为 `google/gemini-2.5-flash-lite-preview-09-2025`，`model_provider: openai`，`base_url: https://openrouter.ai/api/v1`；图片生成类是 `tools.ImageGeneratorNanobananaGoogleAPI`，视频生成类是 `tools.VideoGeneratorVeoGoogleAPI`；工作目录是 `.working_dir/script2video`。`RenderBackend.from_config()` 会按 `class_path` 动态 import 这些类，并按 `max_requests_per_minute` / `max_requests_per_day` 创建 `RateLimiter`。（来源：configs/script2video.yaml；来源：tools/render_backend.py） 第二步，结构化文本规划。`Script2VideoPipeline.plan_text_artifacts()` 的真实顺序是：如果没有传入 characters，就 `extract_characters` 写 `characters.json`；然后 `design_storyboard` 写 `storyboard.json`；再 `decompose_visual_descriptions`，每个镜头写 `shots/<idx>/shot_description.json`；最后 `construct_camera_tree` 写 `camera_tree.json`。测试 `test_plan_text_artifacts_emits_progress_in_order` 验证的 progress 顺序正是 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`。（来源：pipelines/script2video_pipeline.py plan_text_artifacts；来源：tests/test_vimax_adapters.py） 第三步，渲染。`__call__()` 会先生成或读取角色肖像注册表 `character_portraits_registry.json`，再为每个 camera 生成 frame 任务，为每个 shot 生成 video 任务。对于 `variation_type` 为 `medium` 或 `large` 的镜头，视频生成前会等待 first frame 和 last frame；视频 prompt 是 `shot_description.motion_desc + \"\\n\" + shot_description.audio_desc`，参考图是 `first_frame.png`，以及需要时的 `last_frame.png`。每个镜头输出到 `shots/<idx>/video.mp4`，最后用 MoviePy `concatenate_videoclips` 合成 `final_video.mp4`。（来源：pipelines/script2video_pipeline.py __call__；来源：pipelines/script2video_pipeline.py generate_video_for_single_shot） 第四步，agent 模式把这条管线包装成可交互工具。`vimax_narrative_planning` 只做文本规划，不生成图片视频；`vimax_render_video` 会先检查 `idea2video/story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 等依赖是否齐全。TUI 通过 `ui/src/cli.tsx` 启动 `uv run python main_agent.py --jsonl --stdin-repl`，把 JSONL 事件映射成终端界面。（来源：agent_runtime/vimax_adapters.py；来源：prompts/workflow.md；来源：ui/src/cli.tsx） 术语定义：storyboard 是镜头级分镜；shot_description 是把一个镜头拆成首帧、尾帧、运动描述和音频描述；camera_tree 是不同相机位之间的父子/覆盖关系；first/last-frame-to-video 是用首帧和可选尾帧约束视频生成。"
  essential_design_difference: "人话：最值得复用的不是提示词本身，而是“把创作状态变成可检查文件”的方式。它让代理不是凭聊天记忆判断进度，而是查 `.working_dir` 里哪些文件存在。 术语定义：abstraction 这里指可以抽出来用于别的 AI 应用的设计模式，不等于直接复制整套代码。 - Artifact Authority；复制 `.working_dir/<session_id>/` 作为唯一事实来源的做法，并提供 `artifact_checklist()` 判断 `story.txt`、`characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json`、`final_video.mp4` 是否存在。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md）；不要复制它对具体视频文件名的硬编码，除非你的应用也有同样的故事-分镜-镜头层级。；代理应用最容易把“说过要做”和“已经做完”混在一起；文件 checklist 能把状态判断落到可验证对象上。 - Planning/Rendering Split；复制 `vimax_narrative_planning` 与 `vimax_render_video` 的分层：先生成可审阅文本产物，再显式进入昂贵的渲染阶段。（来源：agent_runtime/vimax_adapters.py build_vimax_adapter_specs）；如果你的任务没有昂贵副作用，不必把阶段拆得这么重。；视频生成成本高、耗时长、失败率受外部 API 影响；先审文本能减少无效渲染。 - Config-Driven Render Backend；复制 `class_path` + `init_args` + `RateLimiter` 模式，让 YAML 决定图片/视频供应商，例如 `tools.ImageGeneratorNanobananaGoogleAPI` 和 `tools.VideoGeneratorVeoGoogleAPI`。（来源：tools/render_backend.py；来源：configs/idea2video.yaml）；不要照搬字符串 import 到安全敏感环境；生产系统应加 allowlist。；生成模型供应商变化快，配置驱动比把模型类写死在 pipeline 里更易替换。 - Reference Image Selection Cascade；复制“候选 >= 8 时先文本筛，再多模态筛”的节流思路，并让输出同时包含 `ref_image_indices` 和 `text_prompt`。（来源：agents/reference_image_selector.py）；不要照搬“最多 8 张”作为普遍真理；这是该仓库提示词里的上限，不是模型通用限制。；多图输入成本高且容易超上下文；先用文本描述过滤能降低 VLM 输入负担。 - Camera Tree；复制 `Camera(idx, active_shot_idxs, parent_cam_idx, parent_shot_idx, missing_info)` 这种结构，用父相机覆盖子相机的关系来约束跨镜头参考。（来源：interfaces/camera.py；来源：agents/camera_image_generator.py）；如果目标不是电影镜头或多视角连续性，camera tree 会增加复杂度。；它把“镜头之间哪些背景和人物应该复用”变成可记录的图结构，而不是让每个镜头孤立生成。"
  practitioner_meaning: "人话：建议 clone-and-run，但要先用小剧本和低成本模型跑 `script2video` 或 agent planning，不要直接相信 README 的长视频质量承诺。工程上最有价值的是 agent/runtime + artifact checklist + planning/render split；最不确定的是端到端生成质量、供应商稳定性、AutoCameo 落地状态和 Novel2Video 完成度。（来源：agent_runtime/session_index.py；来源：agent_runtime/vimax_adapters.py；来源：pipelines/script2video_pipeline.py；来源：README Why ViMax） 术语定义：相关度 4 是因为它直接面向 AI 应用里的视频代理编排；工程深度 4 是因为有 runtime、工具、session、TUI、测试和多阶段 pipeline；复用价值 4 是因为 artifact authority 和后端抽象可迁移；成熟度 3 是因为依赖外部 API、README 营销强、部分功能未核实。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "ViMax 是一个把想法、剧本或小说拆成故事、角色、分镜、镜头、关键帧和视频片段的多阶段视频生成代理框架，但端到端效果依赖外部 LLM、图片生成和视频生成 API。"
    body_md: "人话：它不是单个视频模型，而是把“我要一个视频”拆成一串可落盘、可复用、可修改的中间产物：`story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json`、`first_frame.png`、`video.mp4`、`final_video.mp4`。README 自称是“multi-agent video framework”，源码已核实存在 `Idea2VideoPipeline`、`Script2VideoPipeline`、`Novel2MoviePipeline`、`AgentLoop`、`ToolRegistry` 和 TUI 入口。（来源：README Architecture；来源：pipelines/idea2video_pipeline.py；来源：pipelines/script2video_pipeline.py；来源：agent_runtime/loop.py；来源：vimax）\n\n术语定义：agent framework 在这里指一个能让模型调用工具、记录 session、检查依赖、拆分规划与渲染的运行时；video pipeline 指固定顺序的 Python 流水线；artifact authority 指 `.working_dir/<session_id-or-run_id>/` 里的文件才是事实来源。（来源：prompts/workflow.md）"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的是它把长视频生成问题做成了“文件化工作流”，不是一次性 prompt。每一步都尝试留下 JSON/PNG/MP4，这让后续修分镜、重渲染、断点续跑有明确抓手。README 的“movie-grade”“one-prompt”等表达属于自称；源码能核实的是它确实有配置驱动的后端、会写中间文件、有 agent 工具和测试覆盖部分行为。（来源：README Why ViMax；来源：tools/render_backend.py；来源：agent_runtime/vimax_adapters.py；来源：tests/test_vimax_adapters.py）\n\n术语定义：断点续跑是指如果某个中间文件已经存在，流水线直接读取它而不是重新生成；配置驱动后端是指 YAML 里的 `class_path` 决定实际调用哪个图片/视频生成类。"
    bullets:
      - "已核实的工程抓手：`configs/idea2video.yaml` 把 chat model、image generator、video generator 分成三段；默认 chat model 写成 `google/gemini-2.5-flash-lite-preview-09-2025`，`base_url` 为 `https://openrouter.ai/api/v1`，图片类是 `tools.ImageGeneratorNanobananaGoogleAPI`，视频类是 `tools.VideoGeneratorVeoGoogleAPI`，工作目录是 `.working_dir/idea2video`。（来源：configs/idea2video.yaml）"
      - "已核实的代理抓手：内置工具包括 `read_file`、`write_json`、`todo_read`、`todo_write`、`vimax_narrative_planning`、`vimax_novel_planning`、`vimax_render_video`；`run_shell` 默认禁用，只有 `VIMAX_ENABLE_RUN_SHELL=1` 才能启用。（来源：agent_runtime/tools.py；来源：agent_runtime/vimax_adapters.py）"
      - "已核实的 TUI 抓手：`vimax tui new` 会转换成 `--new-session`，`vimax tui resume <session_id>` 会转换成 `--session <session_id>`，然后执行 `ui/node_modules/.bin/tsx ui/src/cli.tsx`；如果 UI 依赖不存在，会提示运行 `cd $ROOT/ui && npm install`。（来源：vimax）"
      - "需要降权的地方：README 写了 AutoCameo，但树里没有同名模块或清晰入口；`rg AutoCameo|cameo` 只找到 README 文案，没有找到可运行 flow。此项按“自称/未核实”处理。（来源：README Key Features；来源：repo tree search）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：下面把项目说了什么、文件实际证明了什么分开。README、徽章和营销语都算自称；源码、配置、测试、脚本能直接验证的算已核实。\n\n术语定义：evidence_strength 不是效果评分，而是“这个结论被仓库文件支撑到什么程度”。"
    items:
      - claim: "ViMax 是“multi-agent video framework”，面向 automated multi-shot video generation 和 character/scene consistency。"
        plain_english: "README 把它定位成多代理长视频生成框架，强调多镜头、角色和场景一致性。"
        source: "README Architecture"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确写了 multi-agent video framework，并列出 script understanding、scene & shot planning、visual asset planning、consistency & continuity、visual synthesis & assembly。"
        does_not_support: "README 不能证明生成质量、长视频稳定性或比其他系统更好。"
        threat: "这是项目方叙述；没有仓库内 benchmark 或可复现实验结果支撑质量结论。"
      - claim: "项目有真实 agent loop，不只是 README 里的“agent”字样。"
        plain_english: "源码里有一个 OpenAI-compatible tool-calling loop，会采样模型、执行工具、写 session 历史，并限制最多 50 轮工具调用。"
        source: "agent_runtime/loop.py MAX_TOOL_PASSES；agent_runtime/tools.py ToolRegistry；agent_runtime/tool_executor.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`MAX_TOOL_PASSES = 50`；`AgentLoop.stream_events()` 会生成 `prompt_trace`、执行 tool_calls、把 `ToolResult` 追加为 tool message；`ToolExecutor` 会把工具调用写进 `.vimax/logs/tool_calls.jsonl`。"
        does_not_support: "不能证明 LLM 在真实创作场景下会稳定选择正确工具。"
        threat: "工具选择质量仍由外部 LLM 决定。"
      - claim: "规划和渲染被拆成两个阶段。"
        plain_english: "agent 工具先生成结构化文本文件；真正生成关键帧、视频片段和最终视频要走另一个 render 工具。"
        source: "agent_runtime/vimax_adapters.py build_vimax_adapter_specs；prompts/workflow.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`vimax_narrative_planning` 的描述写明不生成 keyframes、video clips、final video；`vimax_render_video` 会检查 structured text artifacts 是否存在，并在缺依赖时返回 missing dependencies。"
        does_not_support: "不能证明每次规划文件都语义正确。"
        threat: "规划文件由 LLM 生成，schema 能约束形状，不能保证导演质量。"
      - claim: "配置驱动的图片/视频后端支持速率限制。"
        plain_english: "YAML 里写类名和限额，`RenderBackend` 动态 import 类并注入 `RateLimiter`。"
        source: "tools/render_backend.py；configs/idea2video.yaml；utils/rate_limiter.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`_instantiate()` 从 `class_path` 拆出 module/class；`_build_rate_limiter()` 读取 `max_requests_per_minute` 和 `max_requests_per_day`；`configs/idea2video.yaml` 对 image 设 `10/500`，video 设 `2/10`。"
        does_not_support: "不能证明外部 API 实际接受这些请求量。"
        threat: "不同供应商仍可能有自己的隐藏限流、排队和失败模式。"
      - claim: "Script2Video 的真实流是 characters -> storyboard -> shot descriptions -> camera tree -> frames -> clips -> final_video。"
        plain_english: "剧本转视频不是直接把剧本丢给视频模型，而是先做角色提取、分镜、镜头拆解、相机树，再生成首尾帧和每个镜头视频。"
        source: "pipelines/script2video_pipeline.py __call__；pipelines/script2video_pipeline.py plan_text_artifacts；prompts/workflow.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`plan_text_artifacts()` 顺序发出 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`；`__call__()` 后续生成 portraits、frames、video clips，并用 `concatenate_videoclips(..., codec=\"libx264\", preset=\"medium\")` 写 `final_video.mp4`。"
        does_not_support: "不能证明生成视频自然、连续或无伪影。"
        threat: "最终画面取决于外部图片/视频模型和 reference selection 的准确性。"
      - claim: "ReferenceImageSelector 有两级筛选：文本先筛，再多模态筛。"
        plain_english: "当候选参考图达到 8 张或更多时，它先让文本模型选一批，再把图片内容发给多模态模型做最终选择和 prompt。"
        source: "agents/reference_image_selector.py select_reference_images_and_generate_prompt"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "代码中 `if len(available_image_path_and_text_pairs) >= 8` 先构造 `SEQ_DESC` 文本；随后总是构造 `image_url` base64 内容；prompt 明确要求 `Select at most 8 optimal reference image descriptions`。"
        does_not_support: "不能证明选出的参考图一定最优。"
        threat: "候选图描述、VLM 能力和 base64 图片输入稳定性都会影响结果。"
      - claim: "Novel2Video/Novel2Movie 有源码，但文件开头标了 `# TODO: NOT IMPLEMENTED YET`。"
        plain_english: "小说改编管线不是空目录，里面实现了压缩、事件、检索、场景等步骤；但作者自己在文件顶部留下未完成标记，应按不稳定/部分实现看待。"
        source: "pipelines/novel2movie_pipeline.py header；pipelines/novel2movie_pipeline.py plan_text_artifacts"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "源码会写 `novel/novel.txt`、`novel_chunk_<idx>.txt`、`novel_compressed.txt`、`events/event_<n>.json`；使用 `RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=128)`、FAISS、reranker top_n=10、score >= 0.7。"
        does_not_support: "不能证明小说到完整最终视频已端到端完成。"
        threat: "顶部 TODO 与后续实现并存，说明功能边界需要手动跑通确认。"
      - claim: "AutoCameo 是 README 自称功能，源码树未找到对应入口。"
        plain_english: "README 写了 Generate Video from Your Photo，但未找到 `AutoCameo` 模块、命令或配置。"
        source: "README Key Features；repo tree search for AutoCameo/cameo"
        attribution: "自称"
        evidence_strength: "none"
        supports: "README 有 AutoCameo 文案。"
        does_not_support: "仓库树和 grep 结果不支持它是可运行功能。"
        threat: "应视为未落地或未文档化功能。"
  how_it_works:
    summary: ""
    body_md: "人话：以仓库自带的 `main_script2video.py` 为例，用户先在文件里写剧本。实际示例是 `EXT. SCHOOL GYM - DAY`，包含 John 和 Jane 的篮球训练对白；约束是 `Fast-paced with no more than 15 shots.`，风格是 `Anime Style`。入口调用 `Script2VideoPipeline.init_from_config(config_path=\"configs/script2video.yaml\")`，再 `await pipeline(script=script, user_requirement=user_requirement, style=style)`。（来源：main_script2video.py）\n\n第一步，配置加载。`configs/script2video.yaml` 把 chat model 设为 `google/gemini-2.5-flash-lite-preview-09-2025`，`model_provider: openai`，`base_url: https://openrouter.ai/api/v1`；图片生成类是 `tools.ImageGeneratorNanobananaGoogleAPI`，视频生成类是 `tools.VideoGeneratorVeoGoogleAPI`；工作目录是 `.working_dir/script2video`。`RenderBackend.from_config()` 会按 `class_path` 动态 import 这些类，并按 `max_requests_per_minute` / `max_requests_per_day` 创建 `RateLimiter`。（来源：configs/script2video.yaml；来源：tools/render_backend.py）\n\n第二步，结构化文本规划。`Script2VideoPipeline.plan_text_artifacts()` 的真实顺序是：如果没有传入 characters，就 `extract_characters` 写 `characters.json`；然后 `design_storyboard` 写 `storyboard.json`；再 `decompose_visual_descriptions`，每个镜头写 `shots/<idx>/shot_description.json`；最后 `construct_camera_tree` 写 `camera_tree.json`。测试 `test_plan_text_artifacts_emits_progress_in_order` 验证的 progress 顺序正是 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`。（来源：pipelines/script2video_pipeline.py plan_text_artifacts；来源：tests/test_vimax_adapters.py）\n\n第三步，渲染。`__call__()` 会先生成或读取角色肖像注册表 `character_portraits_registry.json`，再为每个 camera 生成 frame 任务，为每个 shot 生成 video 任务。对于 `variation_type` 为 `medium` 或 `large` 的镜头，视频生成前会等待 first frame 和 last frame；视频 prompt 是 `shot_description.motion_desc + \"\\n\" + shot_description.audio_desc`，参考图是 `first_frame.png`，以及需要时的 `last_frame.png`。每个镜头输出到 `shots/<idx>/video.mp4`，最后用 MoviePy `concatenate_videoclips` 合成 `final_video.mp4`。（来源：pipelines/script2video_pipeline.py __call__；来源：pipelines/script2video_pipeline.py generate_video_for_single_shot）\n\n第四步，agent 模式把这条管线包装成可交互工具。`vimax_narrative_planning` 只做文本规划，不生成图片视频；`vimax_render_video` 会先检查 `idea2video/story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 等依赖是否齐全。TUI 通过 `ui/src/cli.tsx` 启动 `uv run python main_agent.py --jsonl --stdin-repl`，把 JSONL 事件映射成终端界面。（来源：agent_runtime/vimax_adapters.py；来源：prompts/workflow.md；来源：ui/src/cli.tsx）\n\n术语定义：storyboard 是镜头级分镜；shot_description 是把一个镜头拆成首帧、尾帧、运动描述和音频描述；camera_tree 是不同相机位之间的父子/覆盖关系；first/last-frame-to-video 是用首帧和可选尾帧约束视频生成。"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最值得复用的不是提示词本身，而是“把创作状态变成可检查文件”的方式。它让代理不是凭聊天记忆判断进度，而是查 `.working_dir` 里哪些文件存在。\n\n术语定义：abstraction 这里指可以抽出来用于别的 AI 应用的设计模式，不等于直接复制整套代码。"
    items:
      - name: "Artifact Authority"
        copy: "复制 `.working_dir/<session_id>/` 作为唯一事实来源的做法，并提供 `artifact_checklist()` 判断 `story.txt`、`characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json`、`final_video.mp4` 是否存在。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md）"
        skip: "不要复制它对具体视频文件名的硬编码，除非你的应用也有同样的故事-分镜-镜头层级。"
        why_it_matters: "代理应用最容易把“说过要做”和“已经做完”混在一起；文件 checklist 能把状态判断落到可验证对象上。"
      - name: "Planning/Rendering Split"
        copy: "复制 `vimax_narrative_planning` 与 `vimax_render_video` 的分层：先生成可审阅文本产物，再显式进入昂贵的渲染阶段。（来源：agent_runtime/vimax_adapters.py build_vimax_adapter_specs）"
        skip: "如果你的任务没有昂贵副作用，不必把阶段拆得这么重。"
        why_it_matters: "视频生成成本高、耗时长、失败率受外部 API 影响；先审文本能减少无效渲染。"
      - name: "Config-Driven Render Backend"
        copy: "复制 `class_path` + `init_args` + `RateLimiter` 模式，让 YAML 决定图片/视频供应商，例如 `tools.ImageGeneratorNanobananaGoogleAPI` 和 `tools.VideoGeneratorVeoGoogleAPI`。（来源：tools/render_backend.py；来源：configs/idea2video.yaml）"
        skip: "不要照搬字符串 import 到安全敏感环境；生产系统应加 allowlist。"
        why_it_matters: "生成模型供应商变化快，配置驱动比把模型类写死在 pipeline 里更易替换。"
      - name: "Reference Image Selection Cascade"
        copy: "复制“候选 >= 8 时先文本筛，再多模态筛”的节流思路，并让输出同时包含 `ref_image_indices` 和 `text_prompt`。（来源：agents/reference_image_selector.py）"
        skip: "不要照搬“最多 8 张”作为普遍真理；这是该仓库提示词里的上限，不是模型通用限制。"
        why_it_matters: "多图输入成本高且容易超上下文；先用文本描述过滤能降低 VLM 输入负担。"
      - name: "Camera Tree"
        copy: "复制 `Camera(idx, active_shot_idxs, parent_cam_idx, parent_shot_idx, missing_info)` 这种结构，用父相机覆盖子相机的关系来约束跨镜头参考。（来源：interfaces/camera.py；来源：agents/camera_image_generator.py）"
        skip: "如果目标不是电影镜头或多视角连续性，camera tree 会增加复杂度。"
        why_it_matters: "它把“镜头之间哪些背景和人物应该复用”变成可记录的图结构，而不是让每个镜头孤立生成。"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：最大风险不在 Python 代码本身，而在外部模型、API 网关、视频生成任务排队和本地多媒体依赖。仓库把供应商抽象了一部分，但没有消除这些依赖。\n\n术语定义：exposure 是依赖变化对项目能否运行的影响；mitigation_or_unknown 是仓库里已经有的缓解，或尚未说明的部分。"
    items:
      - dependency: "外部 LLM API"
        what_if_change: "如果 `VIMAX_LLM_API_KEY`、`VIMAX_LLM_BASE_URL`、`model_provider` 或模型名不可用，规划阶段会失败。"
        exposure: "high"
        mitigation_or_unknown: "`agent_runtime/config.py` 支持环境变量和 `configs/agent.local.yaml`；`_build_chat_model()` 缺 key 时直接抛出 `VIMAX_LLM_API_KEY or configs/agent.local.yaml llm.api_key is required for narrative planning`。没有离线 fallback。（来源：agent_runtime/config.py；来源：agent_runtime/vimax_adapters.py）"
        source: "agent_runtime/config.py；agent_runtime/vimax_adapters.py"
      - dependency: "图片生成 API"
        what_if_change: "如果 Google/Yunwu 图片模型接口、base_url 或返回格式变化，`ImageOutput` 生成会失败。"
        exposure: "high"
        mitigation_or_unknown: "Google 版 `ImageGeneratorNanobananaGoogleAPI` 固定 `self.model = \"gemini-2.5-flash-image\"`，Yunwu 版默认 `gemini-2.5-flash-image-preview`；均依赖 `google.genai` response parts 里有 image。没有仓库内 mock 以外的端到端验证。（来源：tools/image_generator_nanobanana_google_api.py；来源：tools/image_generator_nanobanana_yunwu_api.py）"
        source: "tools/image_generator_nanobanana_google_api.py；tools/image_generator_nanobanana_yunwu_api.py"
      - dependency: "视频生成 API / API 网关"
        what_if_change: "如果 OpenRouter 或 Yunwu 的视频任务接口字段变化，任务创建、轮询或下载会失败。"
        exposure: "high"
        mitigation_or_unknown: "OpenRouter 类调用 `POST {base_url}/videos`，要求响应有 `id` 和 `polling_url`；Yunwu 类调用 `/v1/video/create` 和 `/v1/video/query?id=...`。两者都有 timeout、poll interval、错误计数等环境变量，但没有供应商变化适配层。（来源：tools/video_generator_openrouter_api.py；来源：tools/video_generator_veo_yunwu_api.py）"
        source: "tools/video_generator_openrouter_api.py；tools/video_generator_veo_yunwu_api.py"
      - dependency: "MoviePy / OpenCV / scenedetect / ffmpeg"
        what_if_change: "如果本地缺少视频编解码能力或 scenedetect 切分失败，过渡帧提取和最终拼接会失败。"
        exposure: "medium"
        mitigation_or_unknown: "`CameraImageGenerator.get_new_camera_image()` 用 `scenedetect.open_video`、`ContentDetector`、`split_video_ffmpeg`，失败路径未见专门降级；最终拼接用 MoviePy `concatenate_videoclips` 写 mp4。（来源：agents/camera_image_generator.py；来源：pipelines/script2video_pipeline.py）"
        source: "agents/camera_image_generator.py；pipelines/script2video_pipeline.py"
      - dependency: "TUI 的 Node/Ink 运行环境"
        what_if_change: "如果没有 `ui/node_modules/.bin/tsx`，`vimax tui` 直接退出；Windows 原生命令行下 `vimax` 是 bash 脚本，也需要可执行 shell 环境。"
        exposure: "medium"
        mitigation_or_unknown: "`vimax` 会检测 `ui/node_modules/.bin/tsx`，缺失时提示 `cd $ROOT/ui && npm install`；`ui/package.json` 提供 `tui` 和 `test` scripts。README 自称 OS: Linux, Windows，但 bash 入口在 Windows 的具体使用方式未在 README/docs/tree 说明。（来源：vimax；来源：ui/package.json；来源：README Quick Start Environment）"
        source: "vimax；ui/package.json；README Quick Start"
      - dependency: "Python 包元数据与平台安装"
        what_if_change: "在大小写敏感环境中，`pyproject.toml` 写 `readme = \"README.md\"`，仓库实际是 `readme.md` 和 `README_ZH.md`；构建工具如何处理未在 README/docs/tree 说明。"
        exposure: "unknown"
        mitigation_or_unknown: "README 推荐 `uv sync`，不是 `pip build`；未跑发布构建。`requires-python = \">=3.12\"`，依赖包括 `faiss-cpu`、`google-genai`、`langchain`、`moviepy`、`opencv-python`、`scenedetect[opencv]`。（来源：pyproject.toml；来源：README Quick Start）"
        source: "pyproject.toml；README Quick Start"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：这些不是负面结论，而是本次从 README/docs/tree/source 不能确认的点。按要求不补脑。\n\n术语定义：unknown 是“仓库没有证明”，不是“确定不存在”。"
    items:
      - "端到端视频生成没有在本次审计中运行；需要真实 LLM、图片生成、视频生成 API key。仓库 README 提供 key 配置方式，但没有可离线复现 demo。（来源：README Quick Start；来源：configs/agent.local.yaml）"
      - "没有发现 `docs/` 目录；README 有 Quick Start 和 Architecture，深层说明主要散在源码、prompts 和 tests 中。（来源：repo tree）"
      - "AutoCameo README 文案未找到同名源码模块、命令或配置入口，功能状态未知。（来源：README Key Features；来源：repo tree search）"
      - "README 的“Movie-Grade Output”“One-Prompt to Finished Video”“Unlimited Screenplay Video Creation”等属于自称；仓库内未发现 benchmark、评测脚本或样本输出质量指标。（来源：README Why ViMax；来源：repo tree）"
      - "Novel2MoviePipeline 文件顶部写 `# TODO: NOT IMPLEMENTED YET`，但下方已有 planning/render 代码；哪些路径项目方认定为正式可用，README/docs/tree 未说明清楚。（来源：pipelines/novel2movie_pipeline.py）"
      - "MIT LICENSE 文件只有 `Copyright (c) 2025`，未写具体版权主体；法律归属细节未知。（来源：LICENSE）"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "人话：建议 clone-and-run，但要先用小剧本和低成本模型跑 `script2video` 或 agent planning，不要直接相信 README 的长视频质量承诺。工程上最有价值的是 agent/runtime + artifact checklist + planning/render split；最不确定的是端到端生成质量、供应商稳定性、AutoCameo 落地状态和 Novel2Video 完成度。（来源：agent_runtime/session_index.py；来源：agent_runtime/vimax_adapters.py；来源：pipelines/script2video_pipeline.py；来源：README Why ViMax）\n\n术语定义：相关度 4 是因为它直接面向 AI 应用里的视频代理编排；工程深度 4 是因为有 runtime、工具、session、TUI、测试和多阶段 pipeline；复用价值 4 是因为 artifact authority 和后端抽象可迁移；成熟度 3 是因为依赖外部 API、README 营销强、部分功能未核实。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-2026-06-08T1732\\\\hkuds-vimax\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-2026-06-08T1732\\hkuds-vimax\\prompt.md"
  raw_response: "logs\\codex-deepdive-2026-06-08T1732\\hkuds-vimax\\codex-last-message.json"
  invoked_at: "2026-06-08T17:33:00.225Z"
  completed_at: "2026-06-08T17:38:41.486Z"
  repo: "HKUDS/ViMax"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "\"ViMax: Agentic Video Generation (Director, Screenwriter, Producer, and Video Generator All-in-One)\""
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "ViMax 是“multi-agent video framework”，面向 automated multi-shot video generation 和 character/scene consistency。"
    - "项目有真实 agent loop，不只是 README 里的“agent”字样。"
    - "规划和渲染被拆成两个阶段。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "agent_runtime/config.py；agent_runtime/vimax_adapters.py"
    - "tools/image_generator_nanobanana_google_api.py；tools/image_generator_nanobanana_yunwu_api.py"
    - "tools/video_generator_openrouter_api.py；tools/video_generator_veo_yunwu_api.py"
    - "agents/camera_image_generator.py；pipelines/script2video_pipeline.py"
    - "vimax；ui/package.json；README Quick Start"
    - "pyproject.toml；README Quick Start"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "人话：建议 clone-and-run，但要先用小剧本和低成本模型跑 `script2video` 或 agent planning，不要直接相信 README 的长视频质量承诺。工程上最有价值的是 agent/runtime + artifact checklist + planning/render split；最不确定的是端到端生成质量、供应商稳定性、AutoCameo 落地状态和 Novel2Video 完成度。（来源：agent_runtime/session_index.py；来源：agent_runtime/vimax_adapters.py；来源：pipelines/script2video_pipeline.py；来源：README Why ViMax） 术语定义：相关度 4 是因为它直接面向 AI 应用里的视频代理编排；工程深度 4 是因为有 runtime、工具、session、TUI、测试和多阶段 pipeline；复用价值 4 是因为 artifact authority 和后端抽象可迁移；成熟度 3 是因为依赖外部 API、README 营销强、部分功能未核实。"
next_actions:
  - "clone-and-run"
unknowns:
  - "端到端视频生成没有在本次审计中运行；需要真实 LLM、图片生成、视频生成 API key。仓库 README 提供 key 配置方式，但没有可离线复现 demo。（来源：README Quick Start；来源：configs/agent.local.yaml）"
  - "没有发现 `docs/` 目录；README 有 Quick Start 和 Architecture，深层说明主要散在源码、prompts 和 tests 中。（来源：repo tree）"
  - "AutoCameo README 文案未找到同名源码模块、命令或配置入口，功能状态未知。（来源：README Key Features；来源：repo tree search）"
  - "README 的“Movie-Grade Output”“One-Prompt to Finished Video”“Unlimited Screenplay Video Creation”等属于自称；仓库内未发现 benchmark、评测脚本或样本输出质量指标。（来源：README Why ViMax；来源：repo tree）"
  - "Novel2MoviePipeline 文件顶部写 `# TODO: NOT IMPLEMENTED YET`，但下方已有 planning/render 代码；哪些路径项目方认定为正式可用，README/docs/tree 未说明清楚。（来源：pipelines/novel2movie_pipeline.py）"
  - "MIT LICENSE 文件只有 `Copyright (c) 2025`，未写具体版权主体；法律归属细节未知。（来源：LICENSE）"
builder_reuse:
  pattern: "Artifact Authority"
  copy: "复制 `.working_dir/<session_id>/` 作为唯一事实来源的做法，并提供 `artifact_checklist()` 判断 `story.txt`、`characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json`、`final_video.mp4` 是否存在。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md）"
  skip: "不要复制它对具体视频文件名的硬编码，除非你的应用也有同样的故事-分镜-镜头层级。"
  why_it_matters: "代理应用最容易把“说过要做”和“已经做完”混在一起；文件 checklist 能把状态判断落到可验证对象上。"
dependency_platform_risk:
  dependency: "外部 LLM API"
  what_if_change: "如果 `VIMAX_LLM_API_KEY`、`VIMAX_LLM_BASE_URL`、`model_provider` 或模型名不可用，规划阶段会失败。"
  exposure: "high"
  mitigation_or_unknown: "`agent_runtime/config.py` 支持环境变量和 `configs/agent.local.yaml`；`_build_chat_model()` 缺 key 时直接抛出 `VIMAX_LLM_API_KEY or configs/agent.local.yaml llm.api_key is required for narrative planning`。没有离线 fallback。（来源：agent_runtime/config.py；来源：agent_runtime/vimax_adapters.py）"
claim_ledger:
  - claim: "ViMax 是“multi-agent video framework”，面向 automated multi-shot video generation 和 character/scene consistency。"
    plain_english: "README 把它定位成多代理长视频生成框架，强调多镜头、角色和场景一致性。"
    source: "README Architecture"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确写了 multi-agent video framework，并列出 script understanding、scene & shot planning、visual asset planning、consistency & continuity、visual synthesis & assembly。"
    does_not_support: "README 不能证明生成质量、长视频稳定性或比其他系统更好。"
    threat: "这是项目方叙述；没有仓库内 benchmark 或可复现实验结果支撑质量结论。"
  - claim: "项目有真实 agent loop，不只是 README 里的“agent”字样。"
    plain_english: "源码里有一个 OpenAI-compatible tool-calling loop，会采样模型、执行工具、写 session 历史，并限制最多 50 轮工具调用。"
    source: "agent_runtime/loop.py MAX_TOOL_PASSES；agent_runtime/tools.py ToolRegistry；agent_runtime/tool_executor.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`MAX_TOOL_PASSES = 50`；`AgentLoop.stream_events()` 会生成 `prompt_trace`、执行 tool_calls、把 `ToolResult` 追加为 tool message；`ToolExecutor` 会把工具调用写进 `.vimax/logs/tool_calls.jsonl`。"
    does_not_support: "不能证明 LLM 在真实创作场景下会稳定选择正确工具。"
    threat: "工具选择质量仍由外部 LLM 决定。"
  - claim: "规划和渲染被拆成两个阶段。"
    plain_english: "agent 工具先生成结构化文本文件；真正生成关键帧、视频片段和最终视频要走另一个 render 工具。"
    source: "agent_runtime/vimax_adapters.py build_vimax_adapter_specs；prompts/workflow.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`vimax_narrative_planning` 的描述写明不生成 keyframes、video clips、final video；`vimax_render_video` 会检查 structured text artifacts 是否存在，并在缺依赖时返回 missing dependencies。"
    does_not_support: "不能证明每次规划文件都语义正确。"
    threat: "规划文件由 LLM 生成，schema 能约束形状，不能保证导演质量。"
  - claim: "配置驱动的图片/视频后端支持速率限制。"
    plain_english: "YAML 里写类名和限额，`RenderBackend` 动态 import 类并注入 `RateLimiter`。"
    source: "tools/render_backend.py；configs/idea2video.yaml；utils/rate_limiter.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`_instantiate()` 从 `class_path` 拆出 module/class；`_build_rate_limiter()` 读取 `max_requests_per_minute` 和 `max_requests_per_day`；`configs/idea2video.yaml` 对 image 设 `10/500`，video 设 `2/10`。"
    does_not_support: "不能证明外部 API 实际接受这些请求量。"
    threat: "不同供应商仍可能有自己的隐藏限流、排队和失败模式。"
  - claim: "Script2Video 的真实流是 characters -> storyboard -> shot descriptions -> camera tree -> frames -> clips -> final_video。"
    plain_english: "剧本转视频不是直接把剧本丢给视频模型，而是先做角色提取、分镜、镜头拆解、相机树，再生成首尾帧和每个镜头视频。"
    source: "pipelines/script2video_pipeline.py __call__；pipelines/script2video_pipeline.py plan_text_artifacts；prompts/workflow.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`plan_text_artifacts()` 顺序发出 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`；`__call__()` 后续生成 portraits、frames、video clips，并用 `concatenate_videoclips(..., codec=\"libx264\", preset=\"medium\")` 写 `final_video.mp4`。"
    does_not_support: "不能证明生成视频自然、连续或无伪影。"
    threat: "最终画面取决于外部图片/视频模型和 reference selection 的准确性。"
  - claim: "ReferenceImageSelector 有两级筛选：文本先筛，再多模态筛。"
    plain_english: "当候选参考图达到 8 张或更多时，它先让文本模型选一批，再把图片内容发给多模态模型做最终选择和 prompt。"
    source: "agents/reference_image_selector.py select_reference_images_and_generate_prompt"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "代码中 `if len(available_image_path_and_text_pairs) >= 8` 先构造 `SEQ_DESC` 文本；随后总是构造 `image_url` base64 内容；prompt 明确要求 `Select at most 8 optimal reference image descriptions`。"
    does_not_support: "不能证明选出的参考图一定最优。"
    threat: "候选图描述、VLM 能力和 base64 图片输入稳定性都会影响结果。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 69: 人话：最值得复用的不是提示词本身，而是“把创作状态变成可检查文件”的方式。它让代理不是凭聊天记忆判断进度，而是查 `.working_dir` 里哪些文件存在。 术语定义：abstraction 这里指可以抽出来用于别的 AI 应用的设计模式，不等于直接复制整套代码。 -..."
artifact_audit:
  official_repo: "https://github.com/HKUDS/ViMax"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

HKUDS/ViMax：GitHub 描述为“"ViMax: Agentic Video Generation (Director, Screenwriter, Producer, and Video Generator All-in-One)"”。

（来源：README/artifactAudit）

## 干什么

"ViMax: Agentic Video Generation (Director, Screenwriter, Producer, and Video Generator All-in-One)"

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 9079 |
| stars_in_period | 5983 |
| author | HKUDS |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- models（来源：数据不足）
- deep（来源：数据不足）

## 解决什么痛点

人话：值得看的是它把长视频生成问题做成了“文件化工作流”，不是一次性 prompt。每一步都尝试留下 JSON/PNG/MP4，这让后续修分镜、重渲染、断点续跑有明确抓手。README 的“movie-grade”“one-prompt”等表达属于自称；源码能核实的是它确实有配置驱动的后端、会写中间文件、有 agent 工具和测试覆盖部分行为。（来源：README Why ViMax；来源：tools/render_backend.py；来源：agent_runtime/vimax_adapters.py；来源：tests/test_vimax_adapters.py） 术语定义：断点续跑是指如果某个中间文件已经存在，流水线直接读取它而不是重新生成；配置驱动后端是指 YAML 里的 `class_path` 决定实际调用哪个图片/视频生成类。

## 核心能力

- Artifact Authority（来源：数据不足）
- Planning/Rendering Split（来源：数据不足）
- Config-Driven Render Backend（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：ViMax 的直接对手不是单个视频模型，而是“怎么把长视频生成做成工程流程”的其他做法。 1. Runway API：Runway 官方 API Reference 列出 Image to video、Text to video、Video to video、Text/Image to Image、sound effects、speech 等端点（外部来源：https://docs.dev.runwayml.com/api/）。差异是 Runway 更像托管生成能力入口，开发者直接调任务 API；ViMax 是本地 repo，把故事、角色、分镜、镜头和渲染拆成文件与工具。做 AI 应用时，如果你只需要稳定托管的视频生成端点，选 Runway；如果你要可审阅、可修改、可断点续跑的创作编排，ViMax 更贴近这个工作流。Runway 的端点能力来自官方文档，生成质量和限制未在本次仓库审计中独立验证。 2. ComfyUI：ComfyUI 官方文档称它是 node-based interface and inference engine，用户通过 nodes 组合模型和操作，也可本地运行，并有 Cloud API/MCP（外部来源：https://docs.comfy.org/）。差异是 ComfyUI 强在可视化节点图和自托管/云端推理工作流；ViMax 强在自然语言输入到叙事规划、镜头拆解、camera_tree、reference selection 的文本代理链。做 AI 应用时，如果团队需要精细控制扩散模型、ControlNet、节点图和本地 GPU，选 ComfyUI；如果团队要把“剧本/小说/想法”变成可审阅视频制作计划，选 ViMax。ComfyUI 的节点/本地/云 API 描述来自官方文档，具体视频工作流效果未在本次审计中跑通。 3. 常见一次性脚本：直接用 LLM 生成 prompt，再调用图片/视频 API，最后 MoviePy 拼接。差异是一次性脚本实现快，但中间状态、修改依赖和失败恢复通常靠人工约定；ViMax 已核实把 `characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 和 `final_video.mp4` 纳入工作流检查。（来源：agent_runtime/session_index.py；来源：pipelines/script2video_pipeline.py） 术语定义：integration path 指系统接入方式；self-hosting 指是否能在本地控制模型/工作流；workflow fit 指它更适合“直接生成”还是“先规划再审阅再渲染”。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：以仓库自带的 `main_script2video.py` 为例，用户先在文件里写剧本。实际示例是 `EXT. SCHOOL GYM - DAY`，包含 John 和 Jane 的篮球训练对白；约束是 `Fast-paced with no more than 15 shots.`，风格是 `Anime Style`。入口调用 `Script2VideoPipeline.init_from_config(config_path="configs/script2video.yaml")`，再 `await pipeline(script=script, user_requirement=user_requirement, style=style)`。（来源：main_script2video.py） 第一步，配置加载。`configs/script2video.yaml` 把 chat model 设为 `google/gemini-2.5-flash-lite-preview-09-2025`，`model_provider: openai`，`base_url: https://openrouter.ai/api/v1`；图片生成类是 `tools.ImageGeneratorNanobananaGoogleAPI`，视频生成类是 `tools.VideoGeneratorVeoGoogleAPI`；工作目录是 `.working_dir/script2video`。`RenderBackend.from_config()` 会按 `class_path` 动态 import 这些类，并按 `max_requests_per_minute` / `max_requests_per_day` 创建 `RateLimiter`。（来源：configs/script2video.yaml；来源：tools/render_backend.py） 第二步，结构化文本规划。`Script2VideoPipeline.plan_text_artifacts()` 的真实顺序是：如果没有传入 characters，就 `extract_characters` 写 `characters.json`；然后 `design_storyboard` 写 `storyboard.json`；再 `decompose_visual_descriptions`，每个镜头写 `shots/<idx>/shot_description.json`；最后 `construct_camera_tree` 写 `camera_tree.json`。测试 `test_plan_text_artifacts_emits_progress_in_order` 验证的 progress 顺序正是 `extract_characters`、`design_storyboard`、`decompose_shots`、`construct_camera_tree`。（来源：pipelines/script2video_pipeline.py plan_text_artifacts；来源：tests/test_vimax_adapters.py） 第三步，渲染。`__call__()` 会先生成或读取角色肖像注册表 `character_portraits_registry.json`，再为每个 camera 生成 frame 任务，为每个 shot 生成 video 任务。对于 `variation_type` 为 `medium` 或 `large` 的镜头，视频生成前会等待 first frame 和 last frame；视频 prompt 是 `shot_description.motion_desc + "\n" + shot_description.audio_desc`，参考图是 `first_frame.png`，以及需要时的 `last_frame.png`。每个镜头输出到 `shots/<idx>/video.mp4`，最后用 MoviePy `concatenate_videoclips` 合成 `final_video.mp4`。（来源：pipelines/script2video_pipeline.py __call__；来源：pipelines/script2video_pipeline.py generate_video_for_single_shot） 第四步，agent 模式把这条管线包装成可交互工具。`vimax_narrative_planning` 只做文本规划，不生成图片视频；`vimax_render_video` 会先检查 `idea2video/story.txt`、`characters.json`、`script.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json` 等依赖是否齐全。TUI 通过 `ui/src/cli.tsx` 启动 `uv run python main_agent.py --jsonl --stdin-repl`，把 JSONL 事件映射成终端界面。（来源：agent_runtime/vimax_adapters.py；来源：prompts/workflow.md；来源：ui/src/cli.tsx） 术语定义：storyboard 是镜头级分镜；shot_description 是把一个镜头拆成首帧、尾帧、运动描述和音频描述；camera_tree 是不同相机位之间的父子/覆盖关系；first/last-frame-to-video 是用首帧和可选尾帧约束视频生成。

## 本质不同的设计取舍

人话：最值得复用的不是提示词本身，而是“把创作状态变成可检查文件”的方式。它让代理不是凭聊天记忆判断进度，而是查 `.working_dir` 里哪些文件存在。 术语定义：abstraction 这里指可以抽出来用于别的 AI 应用的设计模式，不等于直接复制整套代码。 - Artifact Authority；复制 `.working_dir/<session_id>/` 作为唯一事实来源的做法，并提供 `artifact_checklist()` 判断 `story.txt`、`characters.json`、`storyboard.json`、`shot_description.json`、`camera_tree.json`、`final_video.mp4` 是否存在。（来源：agent_runtime/session_index.py；来源：prompts/workflow.md）；不要复制它对具体视频文件名的硬编码，除非你的应用也有同样的故事-分镜-镜头层级。；代理应用最容易把“说过要做”和“已经做完”混在一起；文件 checklist 能把状态判断落到可验证对象上。 - Planning/Rendering Split；复制 `vimax_narrative_planning` 与 `vimax_render_video` 的分层：先生成可审阅文本产物，再显式进入昂贵的渲染阶段。（来源：agent_runtime/vimax_adapters.py build_vimax_adapter_specs）；如果你的任务没有昂贵副作用，不必把阶段拆得这么重。；视频生成成本高、耗时长、失败率受外部 API 影响；先审文本能减少无效渲染。 - Config-Driven Render Backend；复制 `class_path` + `init_args` + `RateLimiter` 模式，让 YAML 决定图片/视频供应商，例如 `tools.ImageGeneratorNanobananaGoogleAPI` 和 `tools.VideoGeneratorVeoGoogleAPI`。（来源：tools/render_backend.py；来源：configs/idea2video.yaml）；不要照搬字符串 import 到安全敏感环境；生产系统应加 allowlist。；生成模型供应商变化快，配置驱动比把模型类写死在 pipeline 里更易替换。 - Reference Image Selection Cascade；复制“候选 >= 8 时先文本筛，再多模态筛”的节流思路，并让输出同时包含 `ref_image_indices` 和 `text_prompt`。（来源：agents/reference_image_selector.py）；不要照搬“最多 8 张”作为普遍真理；这是该仓库提示词里的上限，不是模型通用限制。；多图输入成本高且容易超上下文；先用文本描述过滤能降低 VLM 输入负担。 - Camera Tree；复制 `Camera(idx, active_shot_idxs, parent_cam_idx, parent_shot_idx, missing_info)` 这种结构，用父相机覆盖子相机的关系来约束跨镜头参考。（来源：interfaces/camera.py；来源：agents/camera_image_generator.py）；如果目标不是电影镜头或多视角连续性，camera tree 会增加复杂度。；它把“镜头之间哪些背景和人物未确认复用”变成可记录的图结构，而不是让每个镜头孤立生成。

## 对从业者意味着什么

人话：建议 clone-and-run，但要先用小剧本和低成本模型跑 `script2video` 或 agent planning，不要直接相信 README 的长视频质量承诺。工程上最有价值的是 agent/runtime + artifact checklist + planning/render split；最不确定的是端到端生成质量、供应商稳定性、AutoCameo 落地状态和 Novel2Video 完成度。（来源：agent_runtime/session_index.py；来源：agent_runtime/vimax_adapters.py；来源：pipelines/script2video_pipeline.py；来源：README Why ViMax） 术语定义：相关度 4 是因为它直接面向 AI 应用里的视频代理编排；工程深度 4 是因为有 runtime、工具、session、TUI、测试和多阶段 pipeline；复用价值 4 是因为 artifact authority 和后端抽象可迁移；成熟度 3 是因为依赖外部 API、README 营销强、部分功能未核实。

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/artifact-authority]]、[[concepts/camera-tree]]。另见 [[content/hkuds-vimax]]、[[claims/hkuds-vimax-main-claim]]。
