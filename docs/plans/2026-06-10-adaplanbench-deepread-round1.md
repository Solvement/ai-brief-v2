# Plan: AdaPlanBench 深读从头重写 (PAPER-2606.05622)

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式，把 AdaPlanBench 写成可进入 AI-Brief 知识库的高忠实深读资产，重点沉淀“隐藏双约束 + 渐进披露 + 自适应重规划评测”对 agent eval / 冷审门 / 自进化验收的价值。
- **小方向**：
  - 通读 arXiv HTML/PDF 全文、HF 页面，并 clone/read `JiayuJeff/AdaPlanBench` 源码，不只看摘要或 README。
  - 重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.05622.yaml`。
  - 数字集中在实验节，标明论文自报 / 仓库实读 / 数据不足；不补写原文未披露内容。
  - 保留 `cold_audit.status="needs_human"`，不自审、不伪造冷审通过。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 输出目录 `content/papers/2606.05622-adaplanbench-dual-constraint-planning/` 下三个人读/索引文件完整可解析。
  - 输出 `data/autosci/primitives/2606.05622.yaml`，包含 KG-2 需要的 `core_concepts` 与 `discovery_trace`。
  - 结构遵守 `docs/paradigms/papers.md`，样式参考金样但不照搬旧章节集合。
- 非目标：
  - 不改论文范式、前端渲染、schema、每日管线。
  - 不发布、不提交、不把冷审状态翻成通过。
- 影响范围（模块/数据/路由/用户）：
  - 内容语料：目标 paper/career/metadata/primitive。
  - 任务态势：`task-board.md` 增补本任务记录。
  - 索引产物：运行 build-index 时可能刷新 `public/data/papers-index.json`。
- 验收标准（可观察）：
  - 四个目标文件存在且 Markdown/JSON/YAML/Mermaid 配平。
  - `node scripts/columns/papers/build-index.mjs` 通过。
  - `node scripts/validate-papers-deepread.mjs` 通过。
  - `npm run verify` 通过；若失败，明确失败原因，不声称完成。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.05622-adaplanbench-dual-constraint-planning/paper.mdx`：按 canonical 骨架从全文重写。
  - `content/papers/2606.05622-adaplanbench-dual-constraint-planning/career.mdx`：按职业成长骨架重写。
  - `content/papers/2606.05622-adaplanbench-dual-constraint-planning/metadata.json`：补齐索引字段、8 维 scores、source_rankings、cold_audit。
  - `data/autosci/primitives/2606.05622.yaml`：抽评测协议原语。
  - `task-board.md`：记录任务阶段与交付结论。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 本轮只生成，metadata 标 `cold_audit.status="needs_human"`；后续由独立冷审 agent 盲读/开卷对账。
- 成功指标（真正证明“做对了”的 holdout/查询）：
  - 能回答 AdaPlanBench 的任务规模、约束生成、交互协议、主要指标、主结果、干预实验、人工校准、源码/数据可见范围。
  - 能明确区分论文自报、HF/README 自称、仓库源码实读、原文未披露。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - web/arXiv/HF：查论文页面、HTML/PDF、前向脉络。
  - git/shell：clone `https://github.com/JiayuJeff/AdaPlanBench` 到临时目录并读取源码。
  - 本地脚本：build-index、validate、verify。
  - `academic-research-suite`：只采用 source verification / fact-check 纪律；写作结构仍以仓库 canonical 为准。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够：本轮由 Codex 单主控完成研究、写作、机器验证；不生成独立冷审结论。
- 不上 LangGraph/CrewAI/AutoGen。
- 子 agent：不派发；冷审由后续独立 agent 接棒。
- dynamic workflow：否，本轮单篇深读。

## 7. 切片（每片=可运行交付）
- 片 1：源材料收集与事实表（arXiv/HF/源码）。
- 片 2：重写四个目标文件。
- 片 3：build-index + validate + verify，修到机器门通过。
- 每片的“可运行、Kevin 能看到”：最终文件能被索引/校验，冷审门保持未通过状态。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML/PDF 表格抽取不完整，逐格数字需以原文表为准。
  - 目标目录已有未跟踪产物，重写需避免误碰其他任务文件。
  - `npm run verify` 可能受工作区既有脏数据影响。
- 回退方式（保留上一版）：
  - 所有改动集中在目标文件与本 plan；如验证发现内容错误，用本轮源材料直接修正目标文件，不回滚无关脏改。
