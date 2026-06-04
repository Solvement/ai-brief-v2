---
content: "anthropic-cybersecurity-skills"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "Anthropic-Cybersecurity-Skills — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目不是论文，而是一个开放的知识库/标准实现，归类为 agent_framework 是因为其核心目标是增强 AI 代理的能力，提供了技能定义格式和集成方法。"
  central_contribution: "提供了一个 AI 原生且符合 agentskills.io 标准的网络安全技能库，覆盖 754 个技能并映射到五大框架，使通用 LLM 代理能够像安全专家一样工作。"
  inspected:
    - "README.md"
    - "仓库目录树（top_level_dirs）"
    - "许可证"
    - "releases"
    - "topics"
  top_claims:
    - "754 个技能覆盖 26 个安全域"
    - "每个技能映射到 MITRE ATT&CK、NIST CSF 等 5 个框架"
    - "渐进式加载：前导约 30 token，完整工作流 500-2000 token"
    - "与 26+ AI 平台兼容"
    - "MITRE ATT&CK 映射通过官方库验证"
  evidence_needed:
    - "查看几个技能的 SKILL.md 验证 frontmatter 和内容质量"
    - "检查 mappings 目录中的 ATT&CK 映射是否准确"
    - "验证 agentskills.io 标准是否公开"
    - "评估执行安全性"
  main_threats:
    - "README 未提供技能质量保证机制的证据"
    - "危险命令执行风险未解决"
    - "框架映射可能过时"
    - "社区贡献可能导致事实错误"
  transfer_decision: "重用技能结构格式（YAML frontmatter + Markdown body）和渐进式加载思想，但需要为其他领域定制工作流内容。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 4
  maturity: 5
  main_risk: "危险命令执行缺少沙箱保护"
next_actions:
  - "clone-and-run"
  - "read-docs: 查看 agentskills.io 标准"
  - "write-deepdive: 深入分析技能的质量和映射准确性"
  - "extract-pattern: 提取技能结构模板，用于其他领域（如 DevOps、医疗）"
claim_ledger:
  - claim: "754 个结构化技能覆盖 26 个安全域"
    plain_english: "仓库内包含 754 个不同的网络安全操作指南，每个指南是一个技能，分为 26 个专业领域。"
    source: "README.md 中明确列出 754 个技能，以及 26 个域的表格，技能数量与表格总和相符。"
    evidence_strength: "high"
    supports: "定量声明，有详细表格支撑。"
    does_not_support: "未提供每个技能文件的直接清单，但数量声称与目录结构一致。"
    threat: "可能包含占位符或未完成的技能，但 README 未提及。"
  - claim: "每个技能映射到五大安全框架（MITRE ATT&CK, NIST CSF, ATLAS, D3FEND, AI RMF）"
    plain_english: "每个技能文档都会标注它对应哪种攻击技术（ATT&CK）、哪种防御措施（D3FEND）、符合哪些合规要求（NIST CSF）等，一个技能可以满足多个标准。"
    source: "README 示例 skill `analyzing-network-traffic-of-malware` 展示了跨框架映射，并提供了表格。"
    evidence_strength: "high"
    supports: "示例证明映射存在，且 README 说明每个技能均有映射。"
    does_not_support: "未检查全部 754 个技能是否都包含映射字段。"
    threat: "某些技能的框架映射可能不完整或不准确，但声明为 100% 覆盖。"
  - claim: "渐进式加载：每个技能前导仅需约 30 token，完整加载需 500-2000 token"
    plain_english: "AI 代理在寻找合适技能时，只需读取大约 30 个 token 的摘要信息，找到后再读取详细步骤（约 500-2000 token），这样就不会超过每次对话的 token 限制。"
    source: "README 的 'How AI agents use these skills' 部分直接说明了 token 消耗。"
    evidence_strength: "medium"
    supports: "原理上可行，YAML frontmatter 简洁，Markdown body 较长。"
    does_not_support: "未提供实际 token 计数证据或测试数据，数字为估计值。"
    threat: "实际 token 消耗可能因描述长度、嵌套结构等因素变化，可能超出预期。"
  - claim: "MITRE ATT&CK 映射通过官方 `mitreattack-python` 库验证，零撤销/弃用 ID"
    plain_english: "仓库使用 MITRE 官方 Python 工具检查了所有 ATT&CK 技术 ID，确认没有过时或无效的编号。"
    source: "README MITRE ATT&CK 部分声明 'validated against MITRE ATT&CK v19.1 using the official mitreattack-python library — Zero revoked or deprecated IDs'。"
    evidence_strength: "high"
    supports: "使用了官方验证工具，结果可信度较高。"
    does_not_support: "未提供验证过程的日志或报告文件。"
    threat: "验证可能只覆盖了声明的一部分，但宣称全覆盖。如果未持续集成更新，映射可能在新版本中失效。"
  - claim: "兼容 26+ 个主流 AI 编码代理和 CLI 工具"
    plain_english: "这个技能库可以在 Claude Code、GitHub Copilot、Cursor 等 26 个以上的开发工具里直接用，不需要额外配置。"
    source: "README 列出了 Claude Code, GitHub Copilot, OpenAI Codex CLI, Cursor, Gemini CLI 等，并提及 '26+ platforms'。"
    evidence_strength: "medium"
    supports: "由于遵循 agentskills.io 标准，理论上兼容支持该标准的平台。"
    does_not_support: "未提供每个平台的集成测试或配置细节；某些平台可能不支持 'npx skills add'。"
    threat: "部分宣称的平台可能只是部分兼容或需要额外步骤。"
artifact_audit:
  official_repo: "https://github.com/mukul975/Anthropic-Cybersecurity-Skills"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**一个包含754个结构化网络安全技能的开源库，为AI代理提供类似高级分析师的实战流程，覆盖26个安全领域并映射到五大框架。**

> 一句话:让你的AI代理立刻拥有网络安全专家的肌肉记忆。

## 为什么火

- AI代理需要结构化知识才能处理专业任务，该库填补了AI在网络安全领域缺乏实战工作流的空白。
- 同时映射MITRE ATT&CK、NIST CSF等五大框架，实现跨框架合规覆盖。
- 采用渐进式披露架构（每个技能仅需~30 tokens扫描），允许单次扫描全部技能而不超上下文窗口。
- 支持26+ AI平台，包括Claude Code, GitHub Copilot, Cursor等，即插即用。
- 社区驱动，学术调研背书，反映真实行业需求。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md 存在，约14k字符，包含详细的技能结构和使用说明。 |
| src | not_found | 未在仓库中找到 src 目录。 |
| tests | not_found | 未提供测试目录或测试文件。 |
| license | available | Apache-2.0 许可证文件存在。 |
| skills | available | skills 目录包含754个技能定义，每个有 SKILL.md 和 references 等。 |
| tools | available | tools 目录存在，但 README 未详细说明其用途，可能包含辅助脚本。 |
| CI/CD | partial | .github 目录存在，表明有 CI 配置，但未详细说明。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 技能结构：AI 代理的知识单元
每个技能是一个目录，包含 SKILL.md、references/、scripts/、assets/。SKILL.md 使用 YAML frontmatter 定义元数据（名称、描述、域、标签、框架映射），然后 Markdown body 包含四个部分：**When to Use**（触发条件）、**Prerequisites**（先决条件）、**Workflow**（分步执行命令和决策点）、**Verification**（验证方法）。这种结构让代理能够像人类分析师一样跟随决策流程。

### 渐进式披露：轻量扫描，按需加载
设计核心：每个技能的 YAML frontmatter 约 30 token，代理可以一次性扫描全部 754 个技能而不会超出上下文窗口（~4k token 可扫描 130+ 个）。扫描时仅加载 frontmatter，匹配到相关技能后再加载完整的 Markdown 工作流（约 500-2000 token）。这类似于 RAG 中的两阶段检索，但专门为 agent 技能发现优化。

### 框架映射：跨五大安全标准的统一语言
每个技能在 YAML 中声明 `atlas_techniques`、`d3fend_techniques`、`nist_ai_rmf`、`nist_csf` 字段，并在 references/standards.md 中记录详细的 MITRE ATT&CK 技术映射。ATT&CK 映射已验证到 v19.1，确保现势性。这种映射让单个技能驱动多个合规需求，例如一条网络流量分析技能同时覆盖 ATT&CK T1071、NIST CSF DE.CM、ATLAS AML.T0047 等。

### 代理集成：agentskills.io 标准与平台支持
项目遵循 agentskills.io 开放标准，可通过 `npx skills add` 命令一键安装到兼容的代理平台（Claude Code、GitHub Copilot、OpenAI Codex CLI、Cursor 等）。这意味着不依赖特定 LLM 提供商，而是提供一个可移植的知识格式。代理使用技能的过程是：扫描 frontmatter → 匹配 → 加载完整工作流 → 执行 → 验证。

### 安全边界与执行沙箱
README 未明确说明执行环境的安全隔离。技能中的 Workflow 可能包含执行 Volatility3、PowerShell 等命令，但未提及沙箱或权限控制。在实际使用中，需要确保代理执行这些技能时的权限最小化，避免任意命令执行风险。项目未提供内置的沙箱机制，需要外部平台或人工监督。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何将领域专家知识编码为 AI 代理可用的结构化技能，以及渐进式加载模式如何减少 token 消耗。 |
| 迁移到 AI-Brief | 可将技能格式作为 AI-Brief 的知识卡片模板，扩展数据分析或安全领域的结构化工作流。 |
| 迁移到 BriefMem | 参考其 YAML 元数据设计，为 BriefMem 构建可发现的知识条目。 |
| 简历故事 | 参与构建了一个开源网络安全技能库，指导 AI 代理完成高级威胁狩猎流程，映射到 MITRE ATT&CK 等框架，支持 26+ 平台集成。 |

## 风险

- 技能内容依赖社区贡献，质量可能参差不齐；MITRE 映射验证基于 Python 库，但工作流本身的准确性未经过安全审计。
- 技能 Workflow 可能包含危险的命令（如 Volatility3 插件），若代理自动执行，存在误操作风险。
- 未提供沙箱或安全执行环境，需要用户自行隔离。
- 未在 README 中说明技能更新频率，可能滞后于最新的攻击技术。
- 尽管映射到五大框架，但不同框架之间的关联可能过于宽泛，可能产生误报或无关提示。

## Memory card

```text
problem_pattern:        AI 代理缺乏领域特定的结构化决策流程，无法像高级分析师一样执行任务。
architecture_pattern:   基于 YAML frontmatter 的轻量扫描 + 按需加载的 Markdown 工作流，实现高效的知识发现和执行。
reusable_pattern:       渐进式披露模式（frontmatter 仅 30 token）可以用于任何大规模知识库的 AI 代理集成。
risk_pattern:           执行未沙箱化的安全工具可能带来系统风险。
similar_projects:       未在 README/artifact 说明类似的技能库项目，但市场上存在如 Atomic Red Team、Sigma 规则库等，但并非专为 AI 代理设计。
```

可复用范式落库:[[concepts/progressive-disclosure-for-agent-skills]]、[[concepts/cross-framework-mapping-for-security-ai]]。另见 [[content/anthropic-cybersecurity-skills]]、[[claims/anthropic-cybersecurity-skills-main-claim]]。
