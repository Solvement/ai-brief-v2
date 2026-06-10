# Plan: SpatialWorld 深读第 1 轮 (PAPER-2606.09669)

> 触发：本次会新增/重写 `paper.mdx`、`career.mdx`、`metadata.json`、AutoSci primitive，超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式把 SpatialWorld 写成 AI-Brief 可收录的深读资产，重点沉淀“多模拟器统一交互式空间推理 benchmark”对 multimodal agent / 自进化 agent eval 的价值。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF 页面、项目页，并 clone `Hongcheng-Gao/SpatialWorld` 实读源码/数据文件。
  - 写入 `content/papers/2606.09669-spatialworld-interactive-spatial-benchmark/paper.mdx`、`career.mdx`、`metadata.json`。
  - 写入 `data/autosci/primitives/2606.09669.yaml`，包含 KG-2 要求的 `core_concepts` 与 `discovery_trace`。
  - 数字集中放在实验/证据节，区分论文自报、项目页自报、仓库实读；不确定处标“数据不足 / 原文未披露 / 以原文表为准”。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 产出全中文深读，代码/数字/专有名词保留原文。
  - 遵守 `docs/paradigms/papers.md` 的 paper/career/metadata/primitive 受众分离。
  - benchmark 类论文不反推“解法发现链”；若原文未提供发现过程，human 文中缺省该节，primitive 填 `数据不足`。
- 非目标：
  - 不运行 SpatialWorld 全 benchmark，不声称第三方实测模型结果。
  - 不修改 SPEC / canonical 范式 / schema。
  - 不发布、不自动冷审通过。
- 影响范围（模块/数据/路由/用户）：
  - 新增一篇论文内容目录。
  - 新增一个 AutoSci primitive YAML。
  - 更新 task-board 记录本任务交付态势。
- 验收标准（可观察）：
  - 四个目标文件存在且结构符合 canonical。
  - `build-index`、`validate-papers-deepread`、`npm run verify` 通过。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.09669-spatialworld-interactive-spatial-benchmark/paper.mdx`
  - `content/papers/2606.09669-spatialworld-interactive-spatial-benchmark/career.mdx`
  - `content/papers/2606.09669-spatialworld-interactive-spatial-benchmark/metadata.json`
  - `data/autosci/primitives/2606.09669.yaml`
  - `task-board.md` 增补 PAPER-2606.09669 状态。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 当前 Codex 只负责生成，不自审；`metadata.json` 设 `cold_audit.status="needs_human"`。
- 成功指标：
  - 深读可让 Kevin 理解 SpatialWorld 的核心价值：从静态 VQA/单模拟器 embodied benchmark 转向统一文本动作接口下的闭环空间任务评测。
  - 实验数字能回到原文表/项目页/仓库，不出现无来源数字。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - web：核验 arXiv/HF/项目页/GitHub 页面。
  - PowerShell + git：clone 官方仓库、读取 PDF/HTML/README/代码/数据。
  - Node/npm：运行 build-index、validate、verify。
- 是否新增依赖：否。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控完成生成；独立冷审不在本 Codex 回合内执行。
- 不上 LangGraph/CrewAI/AutoGen；本任务是单篇内容生产 + 确定性脚本验证。
- dynamic workflow：不启用；这是单篇第 1 轮深读。

## 7. 切片（每片=可运行交付）
- 片 1：读规则/范式/样板，写 plan。
- 片 2：抓取并阅读论文全文、项目页、HF 页面，clone 并读仓库。
- 片 3：写四个目标内容文件。
- 片 4：跑机器门禁，修复结构/编码问题，更新 task-board。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML 表格可能抽取不完整；必要时用 PDF / 项目页 / 仓库 PDF 交叉核验，逐格表值以原文为准。
  - 模型名称如 GPT-5/GPT-5.4 属论文自报，不把它扩展为当前现实产品声明。
  - 仓库可能只发布数据/页面而非完整运行代码，需诚实标注“仓库实读范围”。
- 回退方式：
  - 本次是新增文件；若验证失败，修目标文件；不触碰既有内容资产。
