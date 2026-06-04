---
content: "codegraph"
kind: "evidence-pack"
title: "codegraph — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "给 Claude Code、Cursor 等编程 AI 助手配上一个离线的代码关系地图，让 AI 直接查地图找代码，而不是反复扫文件、搜字符串，省 token、省调用、完全本地跑。"
    internal_logic: "### 整体架构：预索引知识图谱 + MCP 工具接口\nCodeGraph 由两部分组成：一个本地索引引擎（解析代码生成符号关系图）和一个 MCP 服务器（暴露查询工具给 AI 助手）。两者共享同一个 SQLite 数据库，存放在项目 `.codegraph/` 目录下。AI 助手（如 Claude Code）启动时连接 MCP 服务器，之后所有代码探索都通过 `codegraph_explore` 等工具完成，无需直接读文件或 grep。\n\n#### Agent Loop\nCodeGraph 本身不控制 agent 的执行循环；循环由宿主 agent（Claude Code、Cursor 等）管理。CodeGraph 作为 MCP 服务器插入循环的“工具调用”环节：当 agent 需要理解代码结构时，调用 `codegraph_explore(question)`，获得预加工的答案（含相关符号、调用链、代码片段），然后直接输出给用户或继续推理。这种模式下 agent 的探索子任务大幅减少，通常一次工具调用便完成信息获取。\n\n#### Tool Interface\n通过 MCP 协议暴露的工具核心为**codegraph_explore**：接收自然语言问题，返回结构化的代码关系响应。此外还有 `codegraph_status` 用于检查索引状态。工具响应经过裁剪，会折叠冗余的重复实现，只返回签名，让 answer 大小与问题直接相关，而非与文件数量相关。所有工具均通过标准的 MCP JSON-RPC 交互，与具体模型无关。\n\n#### State/Memory\n状态完全存储在**本地 SQLite 数据库**中。索引过程解析代码生成符号表、调用图、路由映射等，入库。数据库随项目走（`.codegraph/`），可跨 agent 复用。同步机制保证一致性：\n- **文件监视器**（依靠 FSEvents/inotify/ReadDirectoryChangesW）捕获文件变更，经防抖（默认 2 秒）后触发增量索引。\n- **过时提醒**：当有文件待同步时，MCP 响应会插入警告 banner，引导 agent 直接读文件。\n- **连接时追赶**：每次 MCP 重连，会对工作树做快速校验（size、mtime、内容哈希），确保漏掉的编辑被补上。\n\n#### Planner\nCodeGraph 不包含规划组件，也没有内置的推理流程。它只是提供“知识检索”能力，由上层 AI 模型自行规划何时查询、如何组合多个查询。可以说，规划完全交给了 LLM。\n\n#### Sandbox\nCodeGraph 没有沙箱机制。它运行在用户的本地环境，直接访问文件系统，不限制 agent 的其他操作。\n\n#### 安全边界\nCodeGraph 的安全边界主要体现在**数据完全本地化**：不调用任何外部 API，不需要 API key，索引和查询都不离开本机。代码数据不会上传，风险仅来自 agent 本身的行为（但那是宿主 agent 的安全范畴）。此外，MCP 服务器仅监听本地接口，没有远程暴露。"
    failure_mode: "强依赖 MCP 协议，若未来 agent 生态转向其他标准则需适配。"
    source_pointer: "https://github.com/colbymchenry/codegraph"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.9.9"
experiments: []
claims:
  - "[[claims/codegraph-main-claim]]"
artifacts:
  - "[[artifacts/codegraph-repo]]"
metrics:
  - "stars=38848"
  - "forks=2413"
  - "open_issues=191"
  - "latest_release=v0.9.9"
  - "pushed_at=2026-06-03T02:44:28Z"
baselines: []
failure_modes:
  - "强依赖 MCP 协议，若未来 agent 生态转向其他标准则需适配。"
  - "语言和框架支持尚不完善，对于非主流语言或自定义语法可能无法索引。"
  - "初始索引对于超大型仓库（如几万文件）可能耗时较长，但 README 未给出具体数据。"
  - "自动同步依赖操作系统文件监视 API，在容器或沙箱环境内可能失效，需手动触发同步。"
  - "基准测试仅基于 Claude Opus 4.8 单模型，其他模型或 agent 的收益可能不同。"
  - "工具响应的“折叠冗余实现”策略可能漏掉 agent 需要的信息，导致额外查询。"
missing_details: []
source_pointers:
  - "https://github.com/colbymchenry/codegraph"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/codegraph-main-claim]],官方 artifact 落库为 [[artifacts/codegraph-repo]]。See [[content/codegraph]]。
