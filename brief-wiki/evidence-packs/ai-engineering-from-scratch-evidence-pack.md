---
content: "ai-engineering-from-scratch"
kind: "evidence-pack"
title: "ai-engineering-from-scratch — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一套从数学基础到自主代理的完整 AI 工程课程，每节课都产出一个可复用的 Prompt、Skill、Agent 或 MCP Server，填补了「会用但不会造」的能力断层。"
    internal_logic: "### 课程体系统一教学框架（Agent Loop 融入教学流）\n\n课程通过 20 个递进阶段，将 **Agent Loop**、**Tool Interface** 等概念内嵌到每节课的「Build It / Use It / Ship It」节奏中。以下按 ** agent_framework ** 分诊拆解其体现的关键模块：\n\n#### 智能体主循环（Agent Loop）\n- **从零实现**：Phase 14 第 1 课给出纯 Python 的 `agent_loop.py`（~120 行，无依赖），使用 `history` 列表保存对话，循环调用 LLM，检测 `tool_calls` 并通过字典执行工具，达到最大步数则抛出异常。\n- **生产级使用**：产出 `outputs/skill-agent-loop.md`，将其封装为可复用的 ReAct 风格技能文件，可直接放入 Claude 等编辑器。\n\n#### 工具接口（Tool Interface）\n- **即字典映射**：工具以 `tools` 字典传入，键为函数名，值为可调用对象，通过 `call.name` 和 `call.args` 动态调用。这是最简单的工具注册模式。\n- **返回标准结果**：工具执行结果用 `tool_result(call.id, result)` 统一包装，保持消息历史一致性。\n\n#### 状态与记忆（State / Memory）\n- **会话级记忆**：Agent Loop 中仅使用 `history` 列表维护当前会话的消息链，未在 README 中体现长期记忆或向量存储。\n- **跨课程工件积累**：每节课输出的 Skill/Prompt/Agent/MCP 可视为一种“知识记忆”的持久化形式，供后续复用。\n\n#### 规划器（Planner）\n- **隐式规划**：当前 Agent Loop 示例采用 ReAct 模式，LLM 自行决定调用工具的顺序，没有独立规划模块。Phase 15/16 可能涉及更高级的规划与多代理协作，但 README 未详述。\n\n#### 沙箱与安全边界（Sandbox / Safety）\n- **安全关注**：Phase 18 专门讨论“伦理与对齐”，但 Agent Loop 内的权限控制、代码执行沙箱等安全边界在 README 中未见说明。\n\n#### 可观测性与调试\n- **调试 Prompt**：课程产出包含一个 `prompt-debug-agent.md`，指导 LLM 诊断代理运行轨迹。无独立日志或遥测体系。\n\n#### MCP 服务器集成\n- **从构建到交付**：Phase 13 讲授 MCP 协议，课程结束时产出可直接插入任何 MCP 客户端的服务器。这相当于将工具能力标准化，是 Agent 生态的关键连接器。"
    failure_mode: "课程声称 503 课，但部分阶段目录可能为空或内容不全（仓库有 51 个未关闭 Issue）。"
    source_pointer: "https://github.com/rohitg00/ai-engineering-from-scratch"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/ai-engineering-from-scratch-main-claim]]"
artifacts:
  - "[[artifacts/ai-engineering-from-scratch-repo]]"
metrics:
  - "stars=27739"
  - "forks=4509"
  - "open_issues=51"
  - "latest_release=not_found"
  - "pushed_at=2026-06-03T00:12:38Z"
baselines: []
failure_modes:
  - "课程声称 503 课，但部分阶段目录可能为空或内容不全（仓库有 51 个未关闭 Issue）。"
  - "无自动化测试覆盖，多语言实现的代码质量与正确性缺乏保障。"
  - "~320 小时的学习时长对在职人员压力较大，若中途放弃则易留下知识断层。"
  - "依赖外部 LLM API（如 OpenAI）进行部分练习，可能产生额外费用且受供应商限制。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/rohitg00/ai-engineering-from-scratch"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ai-engineering-from-scratch-main-claim]],官方 artifact 落库为 [[artifacts/ai-engineering-from-scratch-repo]]。See [[content/ai-engineering-from-scratch]]。
