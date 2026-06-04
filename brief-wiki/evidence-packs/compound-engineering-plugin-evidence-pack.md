---
content: "compound-engineering-plugin"
kind: "evidence-pack"
title: "compound-engineering-plugin — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "给 AI 编程助手装上「复利工程」流程：把需求、计划、审查和知识积累串成一个越用越顺的循环。"
    internal_logic: "### Agent Loop\n\n本项目的核心是一个固定的工作流循环：**brainstorm → plan → work → review → compound**。用户通过 slash 命令驱动每一步，每步产出可被下一步消费的 artifact。例如：\n\n```text\n/ce-brainstorm \"make background job retries safer\"\n/ce-plan docs/brainstorms/background-job-retry-safety-requirements.md\n/ce-work\n/ce-code-review\n/ce-compound\n```\n\n`/ce-brainstorm` 会与用户进行交互式问答，产出需求文档；`/ce-plan` 读取需求文档生成实现计划；`/ce-work` 根据计划创建 worktrees 并执行任务；`/ce-code-review` 派生出多个 Agent 进行审查；`/ce-compound` 将本次学到的模式记录到知识库中，供未来 Agent 重用。循环之外，`/ce-strategy` 和 `/ce-product-pulse` 分别提供战略锚点与实际用户反馈。\n\n### Tool Interface (Skills)\n\n所有工具以 **slash command** 形式暴露给宿主环境（Claude Code 等）。每个 skill 实际是一个 Agent 或一组 Agent 的入口。README 列出了 9 个 Skill：\n\n- `/ce-strategy`：创建或维护 `STRATEGY.md`，作为后续构思的锚点。\n- `/ce-ideate`：生成并批判性评估多个方案，选出最佳一个进入 brainstorming。\n- `/ce-brainstorm`：需求分析交互。\n- `/ce-plan`：从特性想法或需求文档生成详细实现计划。\n- `/ce-work`：用 worktrees 和任务跟踪执行计划。\n- `/ce-debug`：系统性复现失败、追踪根因并实施修复。\n- `/ce-code-review`：多 Agent 代码审查。\n- `/ce-compound`：记录经验教训。\n- `/ce-product-pulse`：生成时间窗口内的产品脉搏报告（使用、性能、错误等），保存到 `docs/pulse-reports/`。\n\nSkill 内部可能会像 `$ce-code-review` 那样派生其他 Agent（例如审查 Agent、研究 Agent、工作流 Agent）。这种层次化调用形成了一个 **Agent 树**，父 Agent 将子任务委托给专业子 Agent。\n\n### State / Memory\n\n状态与记忆通过文件系统实现持久化：\n\n- `/ce-strategy` 写入 `STRATEGY.md`，作为所有后续步骤的“只读”上下文背景（grounding）。\n- `/ce-brainstorm` 生成的需求文档、`/ce-plan` 生成的计划文档均以 Markdown 文件形式存在，成为下一个阶段的输入。\n- `/ce-compound` 输出的知识点同样以文档形式持久化，供未来 Agent 读取。\n- `/ce-product-pulse` 报告存入 `docs/pulse-reports/`，形成按时间排列的浏览轨迹。\n\n这种“文档即记忆”的方式避免了上下文窗口膨胀，且知识可跨会话复用。\n\n### Planner\n\n`/ce-plan` 充当规划器。它接受特性描述或需求文档路径作为输入，生成详细实现计划。计划的具体格式未在 README 中说明，但提到会将计划交给 `/ce-work` 执行，因此计划可能包含步骤、任务列表或子 Agent 调用的指令。`/ce-work` 通过 worktrees 和任务跟踪完成执行，暗示计划可能是结构化的任务集。\n\n### Sandbox & Safety\n\n**沙箱与安全机制在 README 中完全未说明**。唯一暗示是 `/ce-work` 使用了 worktrees，这可能隔离了代码修改，但未说明执行环境（是否在隔离的容器或进程中运行）。多 Agent 派生是否默认授权，是否需要人类审批，均未提及。这是一个待确认的重大风险点。\n\n### Cross-platform Adaptation\n\n项目通过一个 Bun/TypeScript 安装器（`@every-env/compound-plugin`）将同一套 Skill/Agent 定义转换为不同平台的格式。平台包括：\n\n- Claude Code：原生 plugin，直接加载。\n- Cursor：通过 `/add-plugin` 从市场安装。\n- Codex：需三步安装（注册市场、Bun 安装 Agent、TUI 安装 Skill）。\n- Copilot CLI/VS Code：通过源码安装或市场命令。\n- Factory Droid、Qwen Code：通过 GitHub 仓库直接安装。\n- OpenCode、Pi、Gemini CLI、Kiro CLI：通过 Bun 安装器转换。\n\n对于没有原生 subagent 原语的平台（如 Pi），安装器会引入社区依赖（`pi-subagents`）来模拟 subagent 调用。这种适配层使得核心工作流可以在异构环境中保持一致性。"
    failure_mode: "强依赖多个第三方 AI 平台，任一平台接口变化都可能破坏对应安装。"
    source_pointer: "https://github.com/everyinc/compound-engineering-plugin"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/compound-engineering-v3.10.0"
experiments: []
claims:
  - "[[claims/compound-engineering-plugin-main-claim]]"
artifacts:
  - "[[artifacts/compound-engineering-plugin-repo]]"
metrics:
  - "stars=19715"
  - "forks=1464"
  - "open_issues=89"
  - "latest_release=compound-engineering-v3.10.0"
  - "pushed_at=2026-06-03T17:17:49Z"
baselines: []
failure_modes:
  - "强依赖多个第三方 AI 平台，任一平台接口变化都可能破坏对应安装。"
  - "沙箱缺失可能导致 Agent 在无隔离环境下执行潜在危险操作，如修改生产配置或删除文件。"
  - "知识大量累积后，基于文件系统的检索可能低效，且缺乏去重与冲突解决机制，可能反而制造信息噪声。"
  - "README 自述的 37 Skill / 51 Agent 未经第三方审计，可能存在夸大或未实现的条目。"
missing_details: []
source_pointers:
  - "https://github.com/everyinc/compound-engineering-plugin"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/compound-engineering-plugin-main-claim]],官方 artifact 落库为 [[artifacts/compound-engineering-plugin-repo]]。See [[content/compound-engineering-plugin]]。
