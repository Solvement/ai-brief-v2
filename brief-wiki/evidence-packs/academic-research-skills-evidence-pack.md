---
content: "academic-research-skills"
kind: "evidence-pack"
title: "academic-research-skills — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "学术研究全流程的 Claude Code 技能套件，覆盖从文献调研、写作、审稿到发表的完整学术流水线，强调人机协作而非全自动。"
    internal_logic: "### agent loop 与编排\n\nARS 的核心是一个 **10 阶段流水线编排器**，每个阶段可以看作一个 agent 的执行上下文。流水线支持从不同阶段中途进入（如直接从审稿阶段开始）。每个技能（Deep Research、Academic Paper、Reviewer）内部又包含多个模式，这些模式本质上是不同配置的 agent 协作循环。例如 **Deep Research 使用 13-agent 团队**，**Academic Paper 使用 12-agent 团队**，**Reviewer 使用 7-agent 团队**（主编+3位动态审稿人+魔鬼代言人）。agent 之间的交互通过项目上下文传递状态，由 Claude Code 的消息处理机制驱动。\n\n### tool interface（工具接口）\n\n技能主要通过 **Claude Code 的插件系统** 暴露为 `/ars-*` 命令，用户通过自然语言调用。此外，流水线内部使用了多种外部工具接口：\n- **Semantic Scholar API**：用于文献验证；\n- **Pandoc / tectonic**：用于格式转换与 PDF 编译；\n- **跨模型验证**（`ARS_CROSS_MODEL`）：可选的利用其他模型进行校验。\n\n工具调用遵循 Claude 的 function calling 规范，具体实现封装在 `agents/` 和 `skills/` 目录中。\n\n### state/memory（状态与记忆）\n\n状态管理体现在流水线的 **Material Passport（材料护照）** 和 **repro_lock（可复现锁）** 上。每一阶段产生的结果和元数据被记录为不可变快照，供后续阶段使用。**风格校准** 功能通过分析用户过往写作学习个人风格，这是一种长效记忆。`data_access_level` 元数据（raw/redacted/verified_only）为数据隔离提供状态标记，脚本 `check_data_access_level.py` 强制执行访问控制。\n\n### planner（规划器）\n\n规划能力通过 **Socratic guided mode（苏格拉底引导模式）** 和 **Plan mode** 提供，在与用户对话中构建论文大纲和章节结构。流水线本身充当高层次的计划执行器，动态调整后续阶段。\n\n### sandbox（沙箱）\n\n项目**未在 README/artifact 中说明显式的沙箱执行环境**。所有操作依赖 Claude Code 的运行环境，且建议启用 `Skip Permissions`（跳过权限）以提高自动化程度，这意味着没有严格的代码执行隔离。实验 agent 是独立的 `experiment-agent` 项目，也未提及其沙箱化。\n\n### safety（安全边界）\n\n安全边界主要体现在 **完整性门禁** 和 **伦理约束** 上：\n- **7-mode blocking checklist**：在阶段 2.5 和 4.5 对实现 bug、虚构结果、引用幻觉等失效模式进行阻断式检查。\n- **声明审计**（v3.8 引入 `ARS_CLAIM_AUDIT=1`）：通过获取引用源并判定声明是否被支持，新增 5 种 `HIGH-WARN` 类别，在输出前硬性阻断。\n- **只读约束**：审稿人技能要求对论文只读操作。\n- **反泄露协议**：防止数据污染（inspiration from PaperOrchestra）。\n- **人类在环**：所有输出均为协助性质，不代替人类做决策。\n\n### 关键模块\n\n- **`academic-pipeline`**：流水线编排与完整性门禁。\n- **`deep-research`**：多 agent 研究团队，支持系统综述、事实核查等。\n- **`academic-paper`**：写作智能体组，含风格校准、文本质量检测。\n- **`academic-paper-reviewer`**：多角色同行评审。\n- **`hooks`**：定义注入到 Claude Code 生命周期的钩子。\n- **`shared`**：通用模式与脚本，如数据访问级别检查。\n- **`evals`**：评估脚本与校准数据集。\n\n### 类似项目比较\n\n- **PaperOrchestra**（Google, 2026）：启发了 ARS 的 Semantic Scholar 验证、反泄露协议、VLM 图表验证、分数轨迹跟踪，但 ARS 作为 Claude Code 插件更贴近个人研究者的实际工作流。\n- **The AI Scientist**（Lu et al., 2026）：全自动研究流水线，ARS 将其失败模式清单整合为防御机制，并采取相反的“人机协作”哲学。"
    failure_mode: "项目高度耦合于 Claude Code 和 Anthropic API，切换基础模型成本高。"
    source_pointer: "https://github.com/imbad0202/academic-research-skills"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/NOASSERTION/v3.10.0"
experiments: []
claims:
  - "[[claims/academic-research-skills-main-claim]]"
artifacts:
  - "[[artifacts/academic-research-skills-repo]]"
metrics:
  - "stars=26581"
  - "forks=2190"
  - "open_issues=30"
  - "latest_release=v3.10.0"
  - "pushed_at=2026-06-03T11:08:27Z"
baselines: []
failure_modes:
  - "项目高度耦合于 Claude Code 和 Anthropic API，切换基础模型成本高。"
  - "大规模语料级评估（corpus-scale evaluation）属于未来工作，当前自我校准的泛化能力未经验证。"
  - "流水线的可重复性声明实际上仅是配置记录，大模型输出不可字节再现，可能被误认为结果可复现。"
  - "无沙箱执行，若用户授权，agent 可能执行破坏性命令。"
  - "许可证为 CC BY-NC 4.0，禁止商业使用，限制部分场景下的集成。"
  - "依赖外部 API（Semantic Scholar）的可用性，无断开网络下的降级方案说明。"
missing_details: []
source_pointers:
  - "https://github.com/imbad0202/academic-research-skills"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/academic-research-skills-main-claim]],官方 artifact 落库为 [[artifacts/academic-research-skills-repo]]。See [[content/academic-research-skills]]。
