---
content: "skills"
kind: "evidence-pack"
title: "skills — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一套小型、可组合的编码代理技能集，用工程最佳实践解决代理开发中的对齐、沟通、反馈和架构退化问题。"
    internal_logic: "### Agent Loop 集成\n技能通过**斜杠命令**（如 `/grill-me`）注入代理的命令循环。代理识别命令后，加载对应的 `SKILL.md` 并执行其中的工作流指令。这相当于在现有代理的**工具调用层**增加了自定义行为，但技能本身不控制整体循环。\n\n### Tool Interface（技能接口）\n每个技能是一个 Markdown 文件，遵循约定：存放在 `skills/<category>/<name>/SKILL.md`。接口简洁：文件名即为命令名，文档内包含指令、参数和资源引用。安装器将技能注册到代理中，使其可被发现和调用。这种设计类似**声明式工具注册表**，无需额外代码。\n\n### State / Memory 管理\n技能利用文件系统建立**持久化记忆**：\n- `CONTEXT.md`：保存共享语言和领域术语，作为**长期语义记忆**，减少后续对话的歧义和 token 消耗。\n- `docs/adr/`：架构决策记录（ADR），记录重大设计决策的上下文，供代理回溯。\n- **交接文档**（`/handoff`）：将当前会话压缩为结构化文档，允许其他代理接续工作，充当**会话状态快照**。\n- **Triage 标签词汇表**：通过 `/setup-matt-pocock-skills` 配置，存储每个仓库的标签语义，维持一致的问题分类。\n\n### Planner（规划阶段）\n部分技能在代理生成计划前执行：\n- `/grill-me` / `/grill-with-docs`：执行**需求盘问**，强制代理提问以澄清模糊点，类似规划前的**对齐检查**。\n- `/to-prd` 和 `/to-issues`：将对话上下文合成为产品需求文档（PRD）或任务列表，直接生成**可执行的规划产物**。\n- `/zoom-out`：要求代理解释代码时提供**系统级视角**，影响后续规划的理解基础。\n\n### Sandbox 与安全边界\n仓库不提供完整的沙箱环境，但通过以下方式构建安全边界：\n- **Git 护栏**（`/git-guardrails-claude-code`）：配置钩子阻止危险命令（如 `push`, `reset --hard`），防止代理误操作。\n- **可审查性**：所有技能为纯文本 Markdown，用户可自由审计和修改，降低黑箱风险。\n- **无执行隔离**：技能直接操作本地环境，依赖用户的代理配置和系统权限，无额外沙箱。\n\n### 关键模块\n- **工程技能**：`diagnose` (系统化调试循环)、`tdd` (红-绿-重构)、`triage` (状态机分类)、`improve-codebase-architecture` (架构腐烂修复)、`prototype` (丢弃型原型)。\n- **生产效率技能**：`caveman` (超压缩沟通，减少75% token)、`handoff` (会话交接)、`write-a-skill` (技能工厂)。\n- **设置技能**：`setup-matt-pocock-skills` (项目初始化配置，统筹问题跟踪、标签、文档路径)。\n\n### 类似项目比较\nREADME 提及 GSD、BMAD、Spec-Kit 等方案，指出它们“拥有流程但剥夺控制权”。本技能集与之相反：**小型、可组合、可改造**，不强制流程，而是提供可插拔的纪律约束。类似理念可见于 Cursor Rules 和自定义命令，但本仓库提供了更系统的工程模式封装。"
    failure_mode: "技能文件无自动化测试，兼容性仅在作者环境中验证，不同代理行为可能不完全一致。"
    source_pointer: "https://github.com/mattpocock/skills"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/skills-main-claim]]"
artifacts:
  - "[[artifacts/skills-repo]]"
metrics:
  - "stars=115960"
  - "forks=10166"
  - "open_issues=56"
  - "latest_release=not_found"
  - "pushed_at=2026-06-03T11:46:30Z"
baselines: []
failure_modes:
  - "技能文件无自动化测试，兼容性仅在作者环境中验证，不同代理行为可能不完全一致。"
  - "高度依赖作者的个人实践，社区贡献模式未明确，长期维护可持续性存疑。"
  - "部分技能（如架构改进）效果受代码库复杂度影响大，可能产生不可预期的修改。"
  - "Git 护栏等安全措施仅通过钩子实现，无法防御代理绕过钩子的情况。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
  - "homepage: not_found"
source_pointers:
  - "https://github.com/mattpocock/skills"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/skills-main-claim]],官方 artifact 落库为 [[artifacts/skills-repo]]。See [[content/skills]]。
