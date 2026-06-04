---
content: "academic-research-skills"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "academic-research-skills — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目提供了完整的 agent 框架、多智能体协作、工具调用、流水线编排，符合 agent_framework 类型。"
  central_contribution: "将学术研究的完整生命周期（研究→写作→审稿→修订→定稿）转化为 Claude Code 插件化技能，并以防御性的设计和真实性审计应对 AI 辅助研究中的核心风险。"
  inspected:
    - "README.md (stars, description, features, architecture, usage, install, showcase, related research)"
    - "top-level directories (agents, skills, hooks, docs, tests, examples, evals 等)"
    - "package indicators (requirements-dev.txt 存在)"
    - "project topics (academic-pipeline, claude-code 等)"
  top_claims:
    - "提供从研究到出版的全流程技能覆盖"
    - "实现7种失效模式的阻断检查和多角色审稿"
    - "通过三层引文锚点和审计应对引用幻觉问题"
    - "30秒可安装，成本约$4-6完成一篇1.5万词的论文"
    - "人机协作优于全自动系统，避免 AI Scientist 的多种失败模式"
  evidence_needed:
    - "架构文档中的详细 agent 交互协议和状态管理实现"
    - "评估脚本与校准数据集的具体内容和结果"
    - "流水线在真实场景下的失败率和用户满意度调查"
    - "引文审计功能的精确率和召回率在大规模测试集上的结果"
  main_threats:
    - "声称的可复现性无法保证，可能误导用户期望"
    - "跨模型验证和审计的有效性未经第三方评估"
    - "对 Claude 生态的深度绑定导致平台迁移困难"
    - "非商业许可证限制了广泛采用"
  transfer_decision: "可复用其防御性门禁模式、声明审计工作流和风格校准概念，但完整框架因平台绑定难以直接迁移。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "深度绑定 Claude Code 生态，且核心审计模块缺少大规模有效性证据。"
next_actions:
  - "clone-and-run"
  - "extract-pattern(完整性门禁 checklist)"
  - "extract-pattern(三层引文锚点与审计流程)"
  - "write-deepdive(agent 团队协作通信机制与状态传递细化)"
claim_ledger:
  - claim: "提供从研究到出版的完整流水线，覆盖研究、写作、审稿、修订全阶段。"
    plain_english: "这个工具不是只帮忙写论文中的一个部分，而是把整个学术流程都包了：找文献、写草稿、模拟审稿、修改回应，直到最后定稿。"
    source: "README 描述及展示的流水线产出物（最终论文、审稿报告等）"
    evidence_strength: "high"
    supports: "README 详细列举了四个技能和各自的多种模式，示例展示了一个完整的10阶段运行产出的所有 PDF。"
    does_not_support: "流水线的具体编排逻辑未在 README 中详述，需查阅架构文档。"
    threat: "多阶段串联可能因单点失败而传播错误，用户需逐一确认。"
  - claim: "通过7模式阻断检查清单防止 AI 研究中常见的实现 bug、引用幻觉等7种失效模式。"
    plain_english: "它在写论文的关键节点（开写前和投出去前）自动检查有没有编造引用、数据错误、逻辑短路等 AI 常犯的毛病，不合格就卡住不让过。"
    source: "README 中 'Why human-in-the-loop' 部分及 acadamic-pipeline/references/ai_research_failure_modes.md"
    evidence_strength: "medium"
    supports: "列举了7种失效模式并说明有检查清单，给出了引用文件路径。"
    does_not_support: "未提供清单具体项以及检查效果的评估数据。"
    threat: "检查清单可能覆盖不全，且基于规则可能误报或漏报。"
  - claim: "v3.8 引入的声明审计（ARS_CLAIM_AUDIT=1）能获取引用源并判断声明是否被支持，使用20元组金标准校准，FNR<0.15, FPR<0.10。"
    plain_english: "新功能可以自动去查你引的文献原文，看你的说法有没有依据；他们用20个自己标注的例子测试，发现漏报率低于15%，误报率低于10%。"
    source: "README 中 v3.8 相关描述"
    evidence_strength: "low"
    supports: "明确给出了 FNR 和 FPR 阈值，指出基于20元组校准集。"
    does_not_support: "样本量极小（20个），且未说明测试集是否独立，校准集可能过拟合；大规模评估仍为未来工作。"
    threat: "校准目标的泛化能力存疑，可能在实际使用中产生大量误拦截。"
  - claim: "一次完整的15k词论文流水线花费约$4-6。"
    plain_english: "跑完一整套流程，大概花四五块美金，很便宜。"
    source: "README 链接 docs/PERFORMANCE.md"
    evidence_strength: "low"
    supports: "明确给出了价格估计，并说明有详细的每模式 token 预算。"
    does_not_support: "未在 README 中提供计算依据，价格随模型定价和上下文长度变动。"
    threat: "用户实际操作时可能因多次重试或长上下文导致费用远高于估计。"
artifact_audit:
  official_repo: "https://github.com/Imbad0202/academic-research-skills"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "NOASSERTION"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**学术研究全流程的 Claude Code 技能套件，覆盖从文献调研、写作、审稿到发表的完整学术流水线，强调人机协作而非全自动。**

> 一句话:用 AI 扛起脏活累活，把脑子留给真正需要论证的地方。

## 为什么火

- **解决学术出版的全链条痛点:** 从文献检索、引文验证、论文撰写、同行评审到修订重投，提供了完整的10阶段流水线，并内置多重完整性门禁和引文真实性验证。
- **人机回环的防御性设计:** 明确拒绝全自动写作伦理，通过7种失效模式的阻断检查清单、风格校准、写作质量检测等机制，把 AI 定位为协作者而非替代者。
- **对学术不端风险的前瞻性应对:** 针对大规模引文幻觉问题（如 Zhao et al. 2026 的审计），实现了三层引文锚点、可选的声明审计以及信任链溯源。
- **高可操作性与低门槛:** 30秒一键安装为 Claude Code 插件，提供丰富的模式选择（7种研究模式、10种写作模式、6种审稿模式），文档详尽并附有真实产出样例。
- **开源社区的信任与认可:** 在 GitHub 上获得大量关注（stars 2.6万+）和对学术工具而言较高的 forks 数（2190），持续迭代至 v3.10.0。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md 内容详尽，约14000字符，覆盖架构、功能、用法、示例 |
| 架构文档 | available | docs/ARCHITECTURE.md（README 提及） |
| 安装/设置 | available | QUICKSTART.md, docs/SETUP.md 及 README 中的安装说明 |
| 测试 | available | 存在 tests/ 目录及 conftest.py |
| 示例 | available | examples/showcase/ 提供了完整流水线产出的 PDF 文件 |
| 许可证 | available | LICENSE 文件，README 声明为 CC BY-NC 4.0 |
| 贡献指南 | available | CONTRIBUTING.md 存在 |
| 安全策略 | available | SECURITY.md |
| 源码中 agent/plugin 定义 | available | agents/、skills/、.claude-plugin/ 等目录存在 |
| Docker 支持 | not_found | 未在 README/artifact 说明，且无 Dockerfile |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### agent loop 与编排

ARS 的核心是一个 **10 阶段流水线编排器**，每个阶段可以看作一个 agent 的执行上下文。流水线支持从不同阶段中途进入（如直接从审稿阶段开始）。每个技能（Deep Research、Academic Paper、Reviewer）内部又包含多个模式，这些模式本质上是不同配置的 agent 协作循环。例如 **Deep Research 使用 13-agent 团队**，**Academic Paper 使用 12-agent 团队**，**Reviewer 使用 7-agent 团队**（主编+3位动态审稿人+魔鬼代言人）。agent 之间的交互通过项目上下文传递状态，由 Claude Code 的消息处理机制驱动。

### tool interface（工具接口）

技能主要通过 **Claude Code 的插件系统** 暴露为 `/ars-*` 命令，用户通过自然语言调用。此外，流水线内部使用了多种外部工具接口：
- **Semantic Scholar API**：用于文献验证；
- **Pandoc / tectonic**：用于格式转换与 PDF 编译；
- **跨模型验证**（`ARS_CROSS_MODEL`）：可选的利用其他模型进行校验。

工具调用遵循 Claude 的 function calling 规范，具体实现封装在 `agents/` 和 `skills/` 目录中。

### state/memory（状态与记忆）

状态管理体现在流水线的 **Material Passport（材料护照）** 和 **repro_lock（可复现锁）** 上。每一阶段产生的结果和元数据被记录为不可变快照，供后续阶段使用。**风格校准** 功能通过分析用户过往写作学习个人风格，这是一种长效记忆。`data_access_level` 元数据（raw/redacted/verified_only）为数据隔离提供状态标记，脚本 `check_data_access_level.py` 强制执行访问控制。

### planner（规划器）

规划能力通过 **Socratic guided mode（苏格拉底引导模式）** 和 **Plan mode** 提供，在与用户对话中构建论文大纲和章节结构。流水线本身充当高层次的计划执行器，动态调整后续阶段。

### sandbox（沙箱）

项目**未在 README/artifact 中说明显式的沙箱执行环境**。所有操作依赖 Claude Code 的运行环境，且建议启用 `Skip Permissions`（跳过权限）以提高自动化程度，这意味着没有严格的代码执行隔离。实验 agent 是独立的 `experiment-agent` 项目，也未提及其沙箱化。

### safety（安全边界）

安全边界主要体现在 **完整性门禁** 和 **伦理约束** 上：
- **7-mode blocking checklist**：在阶段 2.5 和 4.5 对实现 bug、虚构结果、引用幻觉等失效模式进行阻断式检查。
- **声明审计**（v3.8 引入 `ARS_CLAIM_AUDIT=1`）：通过获取引用源并判定声明是否被支持，新增 5 种 `HIGH-WARN` 类别，在输出前硬性阻断。
- **只读约束**：审稿人技能要求对论文只读操作。
- **反泄露协议**：防止数据污染（inspiration from PaperOrchestra）。
- **人类在环**：所有输出均为协助性质，不代替人类做决策。

### 关键模块

- **`academic-pipeline`**：流水线编排与完整性门禁。
- **`deep-research`**：多 agent 研究团队，支持系统综述、事实核查等。
- **`academic-paper`**：写作智能体组，含风格校准、文本质量检测。
- **`academic-paper-reviewer`**：多角色同行评审。
- **`hooks`**：定义注入到 Claude Code 生命周期的钩子。
- **`shared`**：通用模式与脚本，如数据访问级别检查。
- **`evals`**：评估脚本与校准数据集。

### 类似项目比较

- **PaperOrchestra**（Google, 2026）：启发了 ARS 的 Semantic Scholar 验证、反泄露协议、VLM 图表验证、分数轨迹跟踪，但 ARS 作为 Claude Code 插件更贴近个人研究者的实际工作流。
- **The AI Scientist**（Lu et al., 2026）：全自动研究流水线，ARS 将其失败模式清单整合为防御机制，并采取相反的“人机协作”哲学。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 如何为 LLM 驱动的学术流水线设计完整性门禁、引文校验和防御性写作辅助，以及如何将技能体系插件化。 |
| 迁移到 AI-Brief | 提取完整性检查清单、声明审计模式、风格校准思想，作为 AI-Brief 内容正确性保证模块的参考。 |
| 迁移到 BriefMem | 借鉴其 Material Passport 和 repro_lock 思路，为 BriefMem 的文档溯源与版本锁定功能提供设计灵感。 |
| 简历故事 | 主导设计了一个包含 10 阶段流水线、多智能体协作、引文真实性审计的学术写作辅助系统，覆盖从研究到发表的完整生命周期，为领域内近 3 万用户提供生产力工具，深刻理解了人机回环模式下 AI 系统的约束设计。 |

## 风险

- 项目高度耦合于 Claude Code 和 Anthropic API，切换基础模型成本高。
- 大规模语料级评估（corpus-scale evaluation）属于未来工作，当前自我校准的泛化能力未经验证。
- 流水线的可重复性声明实际上仅是配置记录，大模型输出不可字节再现，可能被误认为结果可复现。
- 无沙箱执行，若用户授权，agent 可能执行破坏性命令。
- 许可证为 CC BY-NC 4.0，禁止商业使用，限制部分场景下的集成。
- 依赖外部 API（Semantic Scholar）的可用性，无断开网络下的降级方案说明。

## Memory card

```text
problem_pattern:        学术写作中 AI 辅助易引入虚构引用、数据错误、语句机械感，且缺乏从研究到出版的完整流程支撑。
architecture_pattern:   基于 Claude Code 插件系统的多技能、多模式、分阶段流水线，每个技能内含多 agent 团队，通过完整性门禁和声明审计实现质量闭环。
reusable_pattern:       流水线中的防御性门禁（blocking checklist）与声明级审计结合，可作为任何生成式 AI 输出质量保证的参考范式。
risk_pattern:           全自动研究工具带来的失效风险清单与人机回环的折衷设计，以及引用幻觉的工程化应对策略。
similar_projects:       PaperOrchestra, The AI Scientist，以及 Anthropic automated-w2s-researcher（数据访问控制模式灵感来源）
```

可复用范式落库:[[concepts/integrity-gate-with-blocking-checklist]]、[[concepts/claim-level-citation-audit]]。另见 [[content/academic-research-skills]]、[[claims/academic-research-skills-main-claim]]。
