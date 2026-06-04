---
content: "pixelle-video"
kind: "evidence-pack"
title: "Pixelle-Video — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "输入主题一键生成带配图语音背景音乐短视频的 AI 全自动引擎"
    internal_logic: "### Agent 循环\nPixelle-Video 的“agent”是一个固定的线性工作流，而非传统意义上带反思和决策的循环。其核心循环为：\n- **输入解析**：接收用户主题或固定文案\n- **脚本生成**：调用 LLM（如 GPT、通义千问）生成分镜脚本，包含每帧文案与视觉提示\n- **媒体生成**：根据脚本逐帧生成插图/视频（通过 ComfyUI、RunningHub 或 API），同时为每段文本合成语音（TTS）\n- **视频合成**：将媒体素材与语音、背景音乐按选择模板合成为最终视频\n该流程没有反馈循环，属于一次性流水线。进度由前端 streamlit 实时展示当前步骤编号。\n\n### 工具接口\n项目通过“工作流”抽象来封装工具调用，工具接口分为三类：\n- **ComfyUI/RunningHub 工作流**：通过 HTTP API 调用预定义的 JSON 工作流文件（存放在 workflows/ 目录），实现图像/视频生成。接口细节封装在 pixelle_video 模块内，配置中只需提供 ComfyUI 服务地址或 RunningHub API Key。\n- **直连 API 媒体模型**：直接调用第三方模型供应商的 REST API（如 DashScope、OpenAI Image、Kling 等），配置相应供应商的密钥和 Base URL，并支持本地代理。\n- **TTS 工作流**：同样通过 ComfyUI 工作流或内置的 Edge-TTS/Index-TTS 实现语音合成。\n工具接口采用“可替换原子能力”设计，用户可在 Web UI 中选择不同的工作流或 API 模型，无需修改代码。\n\n### 状态/内存\n- **会话状态**：利用 Streamlit 的 session_state 保存用户配置（API Key、模型选择等）和任务中间结果（如生成的脚本、图片 URL 等），刷新页面后状态保留。\n- **任务历史**：提供历史记录页面，可查看过往生成任务及视频，但未详细说明其持久化机制（可能包括数据库或文件）。\n- **长期记忆**：未在 README/artifact 中说明，无面向用户的记忆概念。\n\n### 规划器\n规划器由 LLM 承担：LLM 根据主题生成一份结构化脚本，该脚本定义了分镜数量、各镜头的文案和视觉提示词（prompt）。从更新日志“优化 LLM 返回结构化数据的逻辑”可推断，LLM 输出为某种结构化数据（如 JSON），驱动后续媒体生成。此规划是一次性的，不支持运行时动态调整。\n\n### 沙盒/安全\n项目本身未实现显式的沙盒环境，运行依赖用户本地环境或提供的 API。安全性主要依赖于各模型服务自身的认证（API Key 等）和流量控制。项目中提及“内容审核失败后的提示词中性化重试”，表明图像/视频生成遇到安全审核时会尝试修改 prompt 重试，但未详细说明具体的安全策略和过滤机制。\n\n### 编排与执行\n整体执行由 streamlit Web 界面触发，后台调用 pixelle_video 包中的核心逻辑。代码结构显示 pixelle_video/ 下可能包含 pipeline 模块，负责串联各步骤。由于未见源码，具体执行模型可能是同步或异步，至少 RunningHub 调用支持并发控制。\n\n### 可观测性\n提供浏览器端的实时进度条，展示当前步骤（如“分镜 3/5 - 生成插图”），也可在终端打印模型请求参数用于调试。未发现日志收集或监控集成。"
    failure_mode: "完全依赖外部 AI 模型服务的可用性和稳定性，若服务降级或限额，视频生成将失败"
    source_pointer: "https://github.com/aidc-ai/pixelle-video"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/Apache-2.0/v0.1.15"
experiments: []
claims:
  - "[[claims/pixelle-video-main-claim]]"
artifacts:
  - "[[artifacts/pixelle-video-repo]]"
metrics:
  - "stars=21216"
  - "forks=2958"
  - "open_issues=122"
  - "latest_release=v0.1.15"
  - "pushed_at=2026-06-01T06:27:45Z"
baselines: []
failure_modes:
  - "完全依赖外部 AI 模型服务的可用性和稳定性，若服务降级或限额，视频生成将失败"
  - "缺少测试代码，代码质量和技术债务风险较高"
  - "未提供详细的错误处理和重试机制说明（除了内容审核重试），异常场景恢复能力不明"
  - "项目无 CLI 或 API 封装，仅通过 Web UI 操作，集成到其他系统较困难"
  - "许可证为 Apache-2.0，但引用的工作流和模型可能有各自的授权限制"
missing_details: []
source_pointers:
  - "https://github.com/aidc-ai/pixelle-video"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/pixelle-video-main-claim]],官方 artifact 落库为 [[artifacts/pixelle-video-repo]]。See [[content/pixelle-video]]。
