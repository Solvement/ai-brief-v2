# Plan: Mind Palace Operating Contract + Agent Research Loop (2026-06-11)

> Trigger: Kevin clarified the real goal: Mind Palace is a user-facing retrieval palace, but for the agent it must become an evolution substrate. Complex tasks should retrieve prior papers/projects, compare competing methods, synthesize an implementation path, and feed results back. This changes workflow and validation, so a plan is required.

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 Mind Palace 从“可看的知识库”升级为“agent 做复杂任务前必须调用的第二大脑”：能检索、比较、批判、合成、行动，并把实践反馈写回。
- **小方向**：
  - 新增一份 agent operating contract，规定什么时候必须用 Mind Palace、怎么检索、怎么竞赛、怎么决策、怎么回写。
  - 新增可运行脚本：给一个问题输出候选记忆、方法竞赛表、组合方案和 agent 自进化动作建议。
  - 加固 facet 蒸馏/验证：新入图的 `self_evo_use` 必须覆盖“记忆 / 理解 / 自进化”，避免只做摘要。
  - 用“战略 agent + 预测 agent”类查询做机器小样，证明不是只入图。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 复杂任务前，agent 有明确 contract：先查 Mind Palace，再做方法竞赛，再给实现路径。
  - 论文/项目 facet 变成认知原语：X 方法、Y 问题、Z 结果、发现路径、架构、边界、对自进化的用途。
  - 支持批判性判断：同类方法要能比较优劣，允许得出“不要用/只作反例/替换旧方案”的结论。
- 非目标：
  - 不宣称模型权重已自我更新；本次实现的是外置记忆驱动的工作流自进化。
  - 不上图数据库、不引新重依赖、不做完整 autonomous research runtime。
  - 不把所有旧 facet 一次性重写；先对新入图和 workflow 加门，旧 facet 可逐步回填。
- 影响范围（模块/数据/路由/用户）：
  - `docs/workflow/` 或 `docs/agents/`：Mind Palace operating contract。
  - `scripts/kg/`：research-loop / operating-pack 脚本；ingest prompt 和 validation。
  - `scripts/validate-mind-palace.mjs`：新 facet 的自进化用途门。
  - `data/knowledge-graph/recall-bench.json`：增加第二大脑/战略+预测类 holdout。
  - `dev-map.md`、`task-board.md`：地貌和态势更新。
- 验收标准（可观察）：
  - `node scripts/kg/research-loop.mjs "战略 agent + 预测 agent"` 输出 top memories、contest table、recommended architecture、update actions。
  - `node scripts/validate-mind-palace.mjs` 继续通过，并对新 schema v2 facet 强制 self_evo_use 含“记忆/理解/自进化”。
  - `npm run verify` 通过。

## 3. 方案（怎么做）
- 改动点：
  - 新增 `docs/workflow/mind-palace-operating-contract.md`：agent 使用 Mind Palace 的流程和输出契约。
  - 新增 `scripts/kg/research-loop.mjs`：复用 `public/data/brief/facets.json`、`mind-palace-embeddings.json` 和本地 e5；输出 JSON/Markdown 两种模式，默认 Markdown。
  - 调整 `scripts/kg/ingest-daily.mjs`：蒸馏 prompt 已加入“记忆/理解/自进化”三段用途；precheck 拒绝缺失。
  - 调整 `scripts/validate-mind-palace.mjs`：对新 `schema: v2` facet 检查 `self_evo_use` 三关键词；旧 facet 先 warning 不阻断。
  - 更新 recall bench，加入“战略 agent + 预测 agent”“第二大脑自进化”查询。
- 数据契约/schema 变化：
  - 不新增顶层字段；强化 `self_evo_use` 的语义门。对新 `schema:v2` facet 是硬门，对旧 facet 只 warning，避免一次性重写全库。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/kg/research-loop.mjs "战略 agent + 预测 agent" --json`
  - `node scripts/validate-mind-palace.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 高风险内容入图仍需独立冷审；本次 workflow 文档可由后续独立审查。
- 成功指标：
  - 复杂问题能检索到记忆/自进化/评测/多 agent 相关 facet。
  - 输出中有 competing methods、tradeoffs、recommended architecture、delete/replace/optimize/add actions。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - codegraph 查现有 KG 结构；PowerShell/Node 跑脚本；本地 `@huggingface/transformers` e5 embedding。
- 是否新增依赖：
  - 不新增依赖，复用现有 `@huggingface/transformers`、`yaml`。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够用：这是确定性脚本 + 文档契约 + validator 加固，不需要 LangGraph/AutoGen。
- 子 agent：
  - 当前不需要；内容冷审或最终 review 后续可由独立 agent 做。
- dynamic workflow：
  - 后续可把 research-loop 作为复杂任务前置 hook；本次先提供可运行 CLI。

## 7. 切片（每片=可运行交付）
- 片 1：计划 + operating contract 文档。
- 片 2：`research-loop.mjs` 小样，能对“战略 agent + 预测 agent”产出方法竞赛和实现路径。
- 片 3：validator/prompt 加固，新增 holdout 查询。
- 片 4：更新 dev-map/task-board，跑验证。

## 8. 风险 / 回退
- 风险点：
  - 只做脚本仍不能强制未来每个 agent 自动调用；需要后续接入 AGENTS/RULES 或 hook。
  - 旧 facet 没有三段 self_evo_use，硬门全开会破坏现有库。
  - 检索靠本地 embedding，召回不等于理解，仍要 agent 批判性合成。
- 回退方式：
  - 保持新脚本独立；若输出质量不够，可不接入工作流。
  - validator 对旧 facet 使用 warning，避免破坏已上线数据。
