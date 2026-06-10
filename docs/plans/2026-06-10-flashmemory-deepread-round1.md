# Plan: FlashMemory-DeepSeek-V4 深读第 1 轮 (PAPER-2606.09079)

> 触发：论文深读从全文从头写，改动超过 100 行，需先有 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式把 FlashMemory-DeepSeek-V4 写成 AI-Brief 可收录的深读资产，重点沉淀 long-context serving / KV cache 管理 / 预测式预取对 agent 记忆与上下文工程的可迁移价值。
- **小方向**：
  - 读取 arXiv HTML/PDF 全文、HF paper 页面与配套 GitHub 仓库源码，区分论文自报、README/作者自称、仓库实读和原文未披露。
  - 重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.09079.yaml`。
  - 结构以 `docs/paradigms/papers.md` 为准，包含立场、技术细节、后续演化；`解法是怎么找到的` 仅在原文真实写出探索轨迹时保留。
  - 数字集中在实验证据节，所有关键指标标明自报/实测/未披露。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 产出可人读的 Paper 与 Career 两栏。
  - 产出 AI-only AutoSci primitive，包含 `core_concepts` 与 `discovery_trace`。
  - 通过内容结构校验与默认门禁。
- 非目标：
  - 不发布、不 commit/push。
  - 不修改 SPEC / canonical 范式 / schema。
  - 不做第三方复现实验；仓库仅做源码/README 实读。
- 影响范围（模块/数据/路由/用户）：
  - `content/papers/2606.09079-flashmemory-lookahead-sparse-attention/`
  - `data/autosci/primitives/2606.09079.yaml`
  - 必要时更新 `task-board.md` 的任务态势。
- 验收标准（可观察）：
  - 四个目标文件存在且中文无乱码。
  - markdown / JSON / YAML / Mermaid 可被仓库脚本解析。
  - `node scripts/columns/papers/build-index.mjs`、`node scripts/validate-papers-deepread.mjs`、`npm run verify` 通过。
  - `metadata.json` 保持 `status:"deep_read"` 与 `cold_audit.status:"needs_human"`。

## 3. 方案（怎么做）
- 改动点：
  - 重写 `content/papers/2606.09079-flashmemory-lookahead-sparse-attention/paper.mdx`。
  - 重写 `content/papers/2606.09079-flashmemory-lookahead-sparse-attention/career.mdx`。
  - 重写 `content/papers/2606.09079-flashmemory-lookahead-sparse-attention/metadata.json`。
  - 重写 `data/autosci/primitives/2606.09079.yaml`。
  - 更新 `task-board.md` 记录本次深读状态。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 当前 Codex 只生成，不自审；冷审状态写入 `needs_human`，等待独立冷审。
- 成功指标（真正证明"做对了"的 holdout/查询）：
  - Paper 栏能回答：方法是什么、为什么省显存、哪些数字是作者自报、哪些任务失败、仓库实际有什么。
  - Career 栏能回答：应用型 AI 工程师能迁移什么技能、可造什么、简历如何诚实表述。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - `web` 读取 HF/arXiv 与必要前向核验。
  - `git clone` 拉取 `libertywing/FlashMemory-Deepseek-V4` 到 `.codex-tmp/` 下的隔离目录。
  - `rg` / `Get-Content` / 仓库脚本做本地读取与校验。
- 是否新增依赖：不新增依赖。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控足够：本轮是单篇内容生成与校验，不引 LangGraph/CrewAI/AutoGen。
- 独立冷审不在当前 Codex 会话内执行，产物标 `needs_human`。
- dynamic workflow：否；单篇深读。

## 7. 切片（每片=可运行交付）
- 片 1：抓取全文、PDF、HF 信息，clone 并实读仓库。
- 片 2：重写四个目标文件。
- 片 3：构建索引、跑 deepread 校验、跑 verify，按报错修复。
- 每片的"可运行、Kevin 能看到"是什么：最终内容目录可被索引构建并通过默认门禁。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML 与 PDF 数字抽取不一致；以原文表为准并明确标注。
  - 代码仓库可能只有 README/配置，缺训练或评测源码；需区分 README 自称与仓库实读。
  - 既有工作树有其他任务未提交改动，不能误改或回滚。
- 回退方式（保留上一版）：
  - 只覆盖本论文目标文件；如校验失败，按脚本输出最小修复。
