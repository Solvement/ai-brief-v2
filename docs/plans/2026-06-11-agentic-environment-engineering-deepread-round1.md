# Plan: Agentic Environment Engineering 深读第 1 轮 (PAPER-2606.12191)

> 触发：本次会从头重写论文深读四件套，改动超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式，把 2606.12191 写成可进入 AI-Brief 的深读资产，重点沉淀“环境工程 = agent 自进化的环境侧基础设施”这张地图。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF 页面，并核实是否披露代码仓库。
  - 从头重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.12191.yaml`。
  - 明确区分综述论文自报、作者定性判断、第三方实测缺失；无实验数字则不硬编。
  - 按 `docs/paradigms/papers.md` 新骨架补齐立场、技术细节、后续演化；综述无解法发现叙事则不写该节，primitive 里标“数据不足”。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 产出全中文深读，专有名词、数字、代码名保留英文。
  - 术语首次出现用大白话解释机制。
  - 架构图用 Mermaid 围栏，脚注集中列源。
  - metadata 保持 `status:"deep_read"`，`cold_audit.status:"needs_human"`。
- 非目标：
  - 不改论文范式、schema、路由、前端。
  - 不补造代码仓库；若论文/HF/arXiv 未披露则写“无 / 未披露”。
  - 不做独立冷审放行，本轮只生成作者稿。
- 影响范围：
  - `content/papers/2606.12191-agentic-environment-engineering-survey/`
  - `data/autosci/primitives/2606.12191.yaml`
  - `task-board.md` 任务态势记录
- 验收标准：
  - 四个目标文件存在且 UTF-8 中文正常。
  - `node scripts/validate-papers-deepread.mjs` 通过；可行时跑 `npm run verify`。
  - 事实来自全文/HF/arXiv；未披露项显式标注。

## 3. 方案（怎么做）
- 改动点：
  - `paper.mdx`：按 canonical 骨架重写论文本身解读。
  - `career.mdx`：按 career 骨架重写对应用型 AI 工程师/FDE 的价值。
  - `metadata.json`：补齐 8 维 scores、source_rankings、tags、autosci 指针、冷审状态。
  - `2606.12191.yaml`：抽 AI-only 原语、core_concepts、discovery_trace、AutoSci 映射。
  - `task-board.md`：增加/更新本任务阶段与交付结论。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门：
  - `node scripts/validate-papers-deepread.mjs`
  - 视改动和耗时跑 `npm run verify`
- 内容门：
  - 本轮不自审放行；metadata 标 `cold_audit.status="needs_human"`，等待独立冷审。
  - 作者稿自检只做来源对账、数字对账、章节完整性检查。
- 成功指标：
  - 读者能复述这篇综述的生命周期、8 属性、8 领域、符号/神经合成、4 维评估、4+3 协同进化框架，以及它对自进化 agent 的可迁移价值。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - web/arXiv/HF 页面核验。
  - PowerShell 读取本地范式、金样、现有目标文件。
  - `apply_patch` 写入文件。
  - `node scripts/validate-papers-deepread.mjs` 和可行的 verify。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控完成作者稿；不调用子 agent 冷审，避免自审冒充独立审。
- 不上 LangGraph/CrewAI/AutoGen；这是一次内容资产生成，不是新运行时。
- 动态 workflow：不需要。

## 7. 切片（每片=可运行交付）
- 片 1：读治理文件、范式、金样、现有草稿与目标目录。
- 片 2：读论文全文/HF/arXiv，核实代码仓库披露情况。
- 片 3：重写四个产物。
- 片 4：跑校验，修复格式/结构问题，回填 task-board。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML/PDF 表格抽取不完整，综述表格逐格内容不能凭记忆还原。
  - 目标目录已有未跟踪草稿，需按用户“从头写”重写但不误删额外文件。
  - 综述是地图型论文，不能把作者定性判断写成实测结论。
- 回退方式：
  - 仅修改目标四件套和任务态势；若校验失败，按错误修复，不触碰 schema/路由。
