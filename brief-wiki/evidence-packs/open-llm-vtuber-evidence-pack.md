---
content: "open-llm-vtuber"
kind: "evidence-pack"
title: "Open-LLM-VTuber — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个跨平台、可离线运行的语音交互AI伴侣框架，集成Live2D虚拟形象、视觉感知和多种LLM、语音识别、语音合成后端，侧重语音打断和桌面宠物模式"
    internal_logic: "### Agent Loop\n\nREADME 说明项目支持**可继承的 Agent 接口**，用户可以自己实现 Agent 并接入 HumeAI EVI、OpenAI Her、Mem0 等架构。这说明存在一个基础的 Agent 抽象层，**未在 README/artifact 说明**具体循环细节（如感知-思考-行动循环是否在`src/`内实现）。从功能描述推断，循环大致为：语音输入→ASR转文本→LLM生成回复→TTS合成语音→前端播放，同时伴以 Live2D 表情映射和视觉感知输入。\n\n### Tool Interface\n\n**未在 README/artifact 说明**是否有显式的工具调用接口。项目主要通过**配置文件切换模块**来集成不同后端，这可能意味着工具并非作为独立插件，而是作为可替换的模块（LLM、ASR、TTS）实现。视觉感知（摄像头、屏幕截图）很可能是作为特殊工具集成在流程中。\n\n### State / Memory\n\nREADME 提到**长期记忆功能已被暂时移除**（即将回归），目前仅依赖**聊天日志持久化**来延续对话上下文。状态管理似乎局限在单次会话的对话历史，未发现有独立的记忆存储或检索机制。\n\n### Planner\n\n**未在 README/artifact 说明**。由于项目支持接入任意 LLM，规划能力完全由外部语言模型提供，框架本身可能没有内置规划器。\n\n### Sandbox\n\n**未在 README/artifact 说明**。项目声称可离线运行，但并未提及对 LLM 输出的沙盒约束或操作限制。\n\n### 安全边界\n\n- **本地运行**：完全离线时对话数据留存在设备上，降低网络泄露风险。\n- **语音打断无耳机**：README 声称 AI 不会听到自己的声音，这涉及音频回环抑制，**未在 README/artifact 说明**具体实现。\n- **Live2D 示例模型许可**：自带 Live2D 示例模型有独立的许可协议，商业使用尤其需额外授权。\n- **反向代理 HTTPS 要求**：远程访问时必须配置 HTTPS，否则前端麦克风无法启动（浏览器安全策略）。"
    failure_mode: "长期记忆功能缺失，对话连续性依赖简单日志，用户粘性可能不足"
    source_pointer: "https://github.com/open-llm-vtuber/open-llm-vtuber"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/false/true/false/NOASSERTION/v1.2.1"
experiments: []
claims:
  - "[[claims/open-llm-vtuber-main-claim]]"
artifacts:
  - "[[artifacts/open-llm-vtuber-repo]]"
metrics:
  - "stars=8774"
  - "forks=1097"
  - "open_issues=126"
  - "latest_release=v1.2.1"
  - "pushed_at=2026-05-15T07:18:04Z"
baselines: []
failure_modes:
  - "长期记忆功能缺失，对话连续性依赖简单日志，用户粘性可能不足"
  - "v2.0 正在规划重写，v1 只修 bug，未来可能破坏性变更，现网功能可能停更"
  - "Live2D 示例模型受第三方许可限制，用于商业产品时存在法律风险"
  - "依赖大量第三方模型和库（Ollama、Whisper 等），环境搭建和版本兼容较为脆弱"
  - "远程访问必须配置 HTTPS 且有浏览器安全限制，部署复杂度增加"
missing_details: []
source_pointers:
  - "https://github.com/open-llm-vtuber/open-llm-vtuber"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/open-llm-vtuber-main-claim]],官方 artifact 落库为 [[artifacts/open-llm-vtuber-repo]]。See [[content/open-llm-vtuber]]。
