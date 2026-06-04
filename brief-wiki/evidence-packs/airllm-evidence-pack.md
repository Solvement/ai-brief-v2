---
content: "airllm"
kind: "evidence-pack"
title: "airllm — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "AirLLM 是一个内存优化的推理库，让 70B 大模型能在单张 4GB GPU 上运行，无需量化、蒸馏或剪枝，适合想在低端硬件上跑大模型的开发者。"
    internal_logic: "虽然 project_type 标签为 agent_framework，但 AirLLM 实质是模型推理优化库，不涉及 agent loop、tool 等概念。以下按推理优化视角拆解其核心机制。\n\n### 分层加载（Layer-wise Loading）\nAirLLM 将原始大模型按层拆分（decomposed and saved layer-wise），推理时仅将当前所需层加载到 GPU 显存，其余层保留在磁盘或 CPU，从而将峰值显存需求降低至单层大小（来源：README Quickstart 注意事项）。这是其在 4GB GPU 上运行 70B 模型的关键。\n\n### 块级量化压缩（Block-wise Quantization）\n压缩选项 `compression='4bit'` 或 `'8bit'` 启用块级量化，只压缩权重不压缩激活（来源：README Model Compression）。README 声称可实现高达 3 倍推理加速，精度损失几乎可忽略，并引用论文（arxiv:2212.09720）说明原理。需要安装 bitsandbytes 库。\n\n### 自动模型检测（AutoModel）\n从 airllm 导入的 AutoModel 会根据模型配置自动选择对应实现类，用户无需手动指定如 AirLLMLlama2 等具体类（来源：README v2.6 更新）。支持 Llama、ChatGLM、QWen、Baichuan、Mistral、InternLM 等在内的多种架构（来源：README Example notebooks）。\n\n### 预取与 I/O 重叠（Prefetching）\n配置参数 `prefetching` 默认开启，将模型加载与计算重叠执行，以隐藏 I/O 延迟。README 更新日志中 v2.5 声称该特性带来了 10% 的速度提升。目前仅 AirLLMLlama2 支持该功能。\n\n### 多平台支持\n通过简单安装即可在 Linux 和 MacOS（仅 Apple Silicon）上运行，MacOS 需要额外安装 mlx 和 torch（来源：README MacOS 小节）。v2.10.1 开始支持 CPU 推理。\n\n### 磁盘空间管理\n模型首次加载时会被拆分保存到磁盘，原始模型可能删除以节省空间（`delete_original=True`），且拆分过程对磁盘空间要求较高（来源：README FAQ #1）。"
    failure_mode: "依赖外部模型仓库 Hugging Face Hub，若服务中断或特定模型被下架，相关功能将不可用。"
    source_pointer: "https://github.com/lyogavin/airllm"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/true/Apache-2.0/not_found"
experiments: []
claims:
  - "[[claims/airllm-main-claim]]"
artifacts:
  - "[[artifacts/airllm-repo]]"
metrics:
  - "stars=18971"
  - "forks=2077"
  - "open_issues=159"
  - "latest_release=not_found"
  - "pushed_at=2026-03-10T11:42:34Z"
baselines: []
failure_modes:
  - "依赖外部模型仓库 Hugging Face Hub，若服务中断或特定模型被下架，相关功能将不可用。"
  - "大模型拆分过程可能消耗大量磁盘空间（FAQ 中提到），若磁盘不足会导致运行失败。"
  - "块级量化压缩缺少独立验证的精度基准，可能在特定任务上有未预期的精度损失。"
  - "项目未提供自动化测试，代码质量难以保证，可能因依赖库升级引入 bug。"
  - "部分功能（如 prefetching）仅限特定模型架构，扩展性受限。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
  - "homepage: not_found"
source_pointers:
  - "https://github.com/lyogavin/airllm"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/airllm-main-claim]],官方 artifact 落库为 [[artifacts/airllm-repo]]。See [[content/airllm]]。
