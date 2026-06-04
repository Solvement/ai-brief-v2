---
content: "anthropic-cybersecurity-skills"
kind: "evidence-pack"
title: "Anthropic-Cybersecurity-Skills — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个包含754个结构化网络安全技能的开源库，为AI代理提供类似高级分析师的实战流程，覆盖26个安全领域并映射到五大框架。"
    internal_logic: "### 技能结构：AI 代理的知识单元\n每个技能是一个目录，包含 SKILL.md、references/、scripts/、assets/。SKILL.md 使用 YAML frontmatter 定义元数据（名称、描述、域、标签、框架映射），然后 Markdown body 包含四个部分：**When to Use**（触发条件）、**Prerequisites**（先决条件）、**Workflow**（分步执行命令和决策点）、**Verification**（验证方法）。这种结构让代理能够像人类分析师一样跟随决策流程。\n\n### 渐进式披露：轻量扫描，按需加载\n设计核心：每个技能的 YAML frontmatter 约 30 token，代理可以一次性扫描全部 754 个技能而不会超出上下文窗口（~4k token 可扫描 130+ 个）。扫描时仅加载 frontmatter，匹配到相关技能后再加载完整的 Markdown 工作流（约 500-2000 token）。这类似于 RAG 中的两阶段检索，但专门为 agent 技能发现优化。\n\n### 框架映射：跨五大安全标准的统一语言\n每个技能在 YAML 中声明 `atlas_techniques`、`d3fend_techniques`、`nist_ai_rmf`、`nist_csf` 字段，并在 references/standards.md 中记录详细的 MITRE ATT&CK 技术映射。ATT&CK 映射已验证到 v19.1，确保现势性。这种映射让单个技能驱动多个合规需求，例如一条网络流量分析技能同时覆盖 ATT&CK T1071、NIST CSF DE.CM、ATLAS AML.T0047 等。\n\n### 代理集成：agentskills.io 标准与平台支持\n项目遵循 agentskills.io 开放标准，可通过 `npx skills add` 命令一键安装到兼容的代理平台（Claude Code、GitHub Copilot、OpenAI Codex CLI、Cursor 等）。这意味着不依赖特定 LLM 提供商，而是提供一个可移植的知识格式。代理使用技能的过程是：扫描 frontmatter → 匹配 → 加载完整工作流 → 执行 → 验证。\n\n### 安全边界与执行沙箱\nREADME 未明确说明执行环境的安全隔离。技能中的 Workflow 可能包含执行 Volatility3、PowerShell 等命令，但未提及沙箱或权限控制。在实际使用中，需要确保代理执行这些技能时的权限最小化，避免任意命令执行风险。项目未提供内置的沙箱机制，需要外部平台或人工监督。"
    failure_mode: "技能内容依赖社区贡献，质量可能参差不齐；MITRE 映射验证基于 Python 库，但工作流本身的准确性未经过安全审计。"
    source_pointer: "https://github.com/mukul975/anthropic-cybersecurity-skills"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/Apache-2.0/v1.2.0"
experiments: []
claims:
  - "[[claims/anthropic-cybersecurity-skills-main-claim]]"
artifacts:
  - "[[artifacts/anthropic-cybersecurity-skills-repo]]"
metrics:
  - "stars=13793"
  - "forks=1613"
  - "open_issues=14"
  - "latest_release=v1.2.0"
  - "pushed_at=2026-06-01T10:15:48Z"
baselines: []
failure_modes:
  - "技能内容依赖社区贡献，质量可能参差不齐；MITRE 映射验证基于 Python 库，但工作流本身的准确性未经过安全审计。"
  - "技能 Workflow 可能包含危险的命令（如 Volatility3 插件），若代理自动执行，存在误操作风险。"
  - "未提供沙箱或安全执行环境，需要用户自行隔离。"
  - "未在 README 中说明技能更新频率，可能滞后于最新的攻击技术。"
  - "尽管映射到五大框架，但不同框架之间的关联可能过于宽泛，可能产生误报或无关提示。"
missing_details: []
source_pointers:
  - "https://github.com/mukul975/anthropic-cybersecurity-skills"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/anthropic-cybersecurity-skills-main-claim]],官方 artifact 落库为 [[artifacts/anthropic-cybersecurity-skills-repo]]。See [[content/anthropic-cybersecurity-skills]]。
