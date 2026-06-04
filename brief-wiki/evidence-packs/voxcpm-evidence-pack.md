---
content: "voxcpm"
kind: "evidence-pack"
title: "VoxCPM — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "VoxCPM 是一个无 tokenizer 的端到端文本转语音系统，通过扩散自回归架构直接生成连续语音，支持 30 种语言、语音设计、可控克隆和 48kHz 高质量输出，提供 Python API、CLI 和 Web demo。"
    internal_logic: "### 嵌入开发流的位置\n- **Python 库**：通过 `pip install voxcpm` 作为依赖引入，在代码中 `from voxcpm import VoxCPM`，实例化后调用 `generate` 方法即可将文本转为音频。\n- **命令行工具**：提供 `voxcpm` 命令，可作为独立步骤嵌入脚本或 CI 流程（例如，将文本文件批量合成为音频）。\n- **生产服务**：支持通过 Nano-vLLM 或 vLLM-Omni 启动 OpenAI 兼容的 HTTP API，可作为微服务集成到更大的语音应用后端。\n\n### 命令入口\n- CLI 主命令：`voxcpm`。\n- 子命令：`design`（语音设计）、`clone`（语音克隆）、`batch`（批量处理）。\n- 参数示例：`--text` 指定合成文本、`--output` 输出文件、`--reference-audio` 参考音频、`--control` 风格描述。\n- 实际用例：\n  ```bash\n  # 根据文本描述生成语音\n  voxcpm design --text \"Hello, world\" --output out.wav\n  # 从参考音频克隆\n  voxcpm clone --text \"克隆语音\" --reference-audio voice.wav --output clone.wav\n  # 批量处理\n  voxcpm batch --input examples/input.txt --output-dir outs\n  ```\n\n### 配置\n- 模型配置：通过 `from_pretrained` 的参数加载，例如 `load_denoiser=False`。\n- 运行时设备：Web demo 支持 `--device auto/cpu/cuda` 等。\n- 高级配置：`cfg_value`、`inference_timesteps` 等生成参数在 API 调用时传入，无需外部配置文件。\n\n### 插件/扩展\n- 未在 README 中描述内建插件系统，但生态系统提供两种加速引擎：\n  - [Nano-vLLM-VoxCPM](https://github.com/a710128/nanovllm-voxcpm)：提供低延迟并发推理。\n  - [vLLM-Omni](https://github.com/vllm-project/vllm-omni)：PagedAttention 和多 GPU 部署。\n- 微调扩展：`lora_ft_webui.py` 提供 LoRA 微调的 Web 界面，可定制音色。\n\n### 错误处理\n- 未在 README 中详细说明错误处理策略，但作为 Python 库，预期会抛出异常（如文件不存在、CUDA 不可用等），用户需通过标准异常捕获处理。CLI 会输出错误信息并退出。"
    failure_mode: "资源需求高：2B 参数模型需约 8 GB VRAM，需要 NVIDIA GPU（CUDA ≥ 12.0），限制了在低资源设备上的使用。"
    source_pointer: "https://github.com/openbmb/voxcpm"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/false/true/Apache-2.0/2.0.3"
experiments: []
claims:
  - "[[claims/voxcpm-main-claim]]"
artifacts:
  - "[[artifacts/voxcpm-repo]]"
metrics:
  - "stars=25498"
  - "forks=2907"
  - "open_issues=113"
  - "latest_release=2.0.3"
  - "pushed_at=2026-05-22T03:27:10Z"
baselines: []
failure_modes:
  - "资源需求高：2B 参数模型需约 8 GB VRAM，需要 NVIDIA GPU（CUDA ≥ 12.0），限制了在低资源设备上的使用。"
  - "内容安全：README 提到“risks and limitations”但未给出具体缓解措施，可能生成不当内容。"
  - "语言覆盖有限：支持 30 种语言，但许多低资源语言不在其中，且方言支持很少。"
  - "实时性依赖 GPU：即使 RTF 低至 0.3，仍需要高端 GPU，CPU 模式未提及性能。"
missing_details: []
source_pointers:
  - "https://github.com/openbmb/voxcpm"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/voxcpm-main-claim]],官方 artifact 落库为 [[artifacts/voxcpm-repo]]。See [[content/voxcpm]]。
