# AI-Brief · 任务态势板

> 不是普通 todo——记录任务在哪个阶段、文档在哪、大/小方向、阻塞、交付结论。人 + AI 都读这里。
> 阶段定义见 [docs/workflow/workflow.md](./docs/workflow/workflow.md)；角色见 [docs/agents/README.md](./docs/agents/README.md)。
> 谁推进谁更新本表。

## 已完成 (2026-06-09)

### ✅ MP-1+MP-2 · Mind Palace 重构成"真记忆" + 项目深读改写 — 高质量上线
- commit **1813e60 → main**（live, git clean, HEAD=origin/main）。回应外部冷审（"造了记忆的样子没造功能"）：质=9 facet 内化 / 功能=本地嵌入召回 **recall@3=1.000**（无 API）/ 推理=8 已核验 typed 边 + 32 tag 噪声边降级 / 图=形。`/graph`→`/mind-palace`。
- **上线后 AI 双审 PASS**：① 文字（独立 agent）9 facet 全 SHARP&LEARNABLE、零杜撰、自报全标记、真修了"又丑又学不到"；② 视觉（/browse 实测 live）mind palace facet 面板 + 项目页 ProjectFacetSpine + Mermaid 架构 全渲染、浅色蓝主调干净。
- 编排：我(前端+schema+gate) + 2 opus 子 agent(蒸馏 facet) + codex(后端 eval+集成) + 独立冷审 agent，全并行。
- 非阻塞遗留：understand-anything facet 略泛（源头不透明，诚实披露非编造）；检索 free-text 查询 UI 未做（per-node facet+边+召回 eval 已证功能）；hermes 等不在 trending 时项目页不显 spine（trending 耦合，非 bug）。

## 进行中

### KG-4 · Research Object Store 记忆本体重构（plan `docs/plans/KG-4-research-object-store.md`，Kevin 2026-06-12 拍板）
- **大方向**：以高质量为唯一标准**重构记忆本体、保留基础设施**——「论文级 facet + 论文级边」→ 六层对象库（L0 锚点→L1 claims/mechanisms/assumptions/failure_modes/trigger_hooks/exam_questions→L2 正典注册层→L3 结构推导关系→L4 视图=投影→L5 考题盲测→L6 迁移钩子）。依据=GPT 分析 1/2/3 + Claude 架构共识。**本条目取代 KG-2/KG-3 的范式口径**（其基础设施成果保留）。
- **小方向**：正典 `docs/paradigms/research-object-store.md` ✅；旧正典 superseded/收编 ✅；registry 4 表种子 ✅（commit 24397b1）；memory 簇 5 篇试点蒸馏（5×opus 并行）+ codex 三脚本（validate-objects/derive-relations/exam-blindtest）跑批中。
- **阶段**：试点执行中（蒸馏+后端并行）。
- **阻塞**：无。
- **交付结论**：—

### PROJECTS-REMINE-2026-06-11 · 项目内容统一重生成 + 关系引擎再深挖（plan `docs/plans/2026-06-11-projects-remine.md`）
- **⚠范式注记（2026-06-12）**：本任务的 facet/关系产物按旧口径生成；KG-4 重构后 facets 降级为草稿输入、论文级边待对象级重推导。基础设施成果（管线/validator/bench）继续有效。
- **大方向**：项目深读、light 文案、Mind Palace facet 和 typed relation graph 收敛成同一套可检索知识基底；删旧重、补 spine/facet、关系边从厚证据里挖。
- **小方向**：清理 ownerless 旧 deep-dive 重复项；`trending.light` 去模板化且与实际深度决策一致；`worthDeepDive >= 60` 全部有 `briefSlug`；项目/论文 facets 覆盖扩大；relation candidate 默认放宽到 topK=10/max=300；孤立 faceted node 落 `track` label。
- **阶段**：✅ Codex 实现完成 + 数据侧门禁通过，待独立冷审。
- **阻塞**：独立冷审未跑（generator≠critic 红线）；未跑 `next build` / `npm run verify` 是本任务 spec 红线。
- **交付结论**：报告 `logs/remine-summary.md`；进度 `logs/remine-progress.md`。`public/data/brief/deep-dives.json` 59 条且 `meta.light_spine` 缺口 0；`trending.json` 90 条 light 去模板化，高分缺 `briefSlug` 为 0；公开 facets 93（paper 37 / project 56），embeddings 93；graph typed primary edges 33（mechanical-in-primary=0），track label 基数 8。验证：`npm run validate` 通过（仅既有 articles warning）；`node scripts/eval-relation-engine.mjs` 通过；`node scripts/kg/bench-retrieval.mjs hybrid` recall@3=8/8、precision=14/15；`node scripts/kg/recall-eval.mjs` recall@3=1.000。红线复核：`src/`、`app/` 无 diff，未运行 Next build。

### KG-3-RELATION-ENGINE · Mind Palace typed 关系引擎 Loop B+C（plan `docs/plans/2026-06-11-mind-palace-relation-engine.md`）
- **⚠范式注记（2026-06-12 KG-4）**：论文级 typed 边口径已被对象级关系（结构推导优先）取代；引擎/eval 基础设施保留，边数据待 KG-4 重推导后退役。
- **大方向**：Mind Palace 主图从 references/same_track 毛球切到 typed relation reasoning；机械边保留为 secondary plumbing，不再占主边层。
- **小方向**：新增 `scripts/kg/relation-engine.mjs` 确定性 CI 路径（facet 明示证据 + lexical/shared-core candidate top-K，不调模型）；`same_use_case` 并入 `complements`；typed 边补 `use`；`build-brief-graph` / `integrate-kg` 统一 normalize。
- **阶段**：✅ Codex 实现完成，待独立冷审。
- **阻塞**：独立冷审未跑（generator≠critic 红线）；前端 Loop D 非本任务范围。
- **交付结论**：`node scripts/eval-relation-engine.mjs` 已绿（primary=26，typed-primary=26，mechanical-in-primary=0，typed=100%）；`npm run kg:build` 已重建图/词表/embedding；`node scripts/kg/bench-retrieval.mjs hybrid` recall@3=8/8、precision=13/15；`node scripts/kg/recall-eval.mjs` recall@3=1.000；`npm run verify` 通过（298 tests + validate + build，全绿，仅既有 warning）；`npm run ops:baseline:diff` 无新增 validator 失败。报告 `.agent/codex-relation-engine-report.md` 已写。

### PROJECTS-BOARD-REUSE-HIGHLIGHT · 项目板块展示解耦去重 + 亮点轻卡（plan `docs/plans/2026-06-11-projects-board-display-reuse-highlight.md`）
- **大方向**：ledger 去重只防重复分析，不防当前 trending 展示；月/周/日榜要反映真实窗口态势，已分析项目复用缓存并继续展示。
- **小方向**：`filterNewProjectCandidates` 返回 `accepted+reuse`；`reuse` 标 `alreadyAnalyzed:true` 并跳过 analyze LLM；light 输出新增必填亮点 `highlight`；board/validate/types/tests 同步。
- **阶段**：✅ Codex 实现完成，待独立 Claude review。
- **阻塞**：无。
- **交付结论**：已写 plan + `.agent/codex-board-display-report.md`；focused tests 23/23 绿（done-current 入 board、reuse 不调 LLM、light highlight）；live no-LLM 验证 `projects discover reused 21 already analyzed repo(s)`，三窗卡数由 17/8/5 验证到 19/17/19（验证产物未保留，避免固定 lightPayload 污染正式数据）；`node scripts/eval-projects-coverage.mjs` 绿（30/30, AI repos 20/20 >=light）；`npm run verify` 绿（294 tests + validate + build，仅既有 warning）；`npm run ops:baseline:diff` 无新增 validator 失败。

### PAPER-2606.05405 · Agents' Last Exam 深读第 1 轮（plan `docs/plans/2026-06-11-agents-last-exam-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 ALE 写成可进入 AI-Brief 的深读资产，重点沉淀“真实经济工作流 → task/env/agent 解耦 → hidden reference → deterministic-first gate-and-score”的 agent benchmark 工程范式。
- **小方向**：读 arXiv v1 HTML/PDF/TeX 全文 + HF 页面 + 项目官网 + clone `rdi-berkeley/agents-last-exam` 源码；从头核写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.05405.yaml`；区分论文自报、README/官网自称、源码实读和动态页面核验。
- **Mind Palace 召回**：Recall 命中 SoCRATES / MemoryAgentBench / GrepSeek / MetaGPT 等；Contest 结论是 ALE 补“真实经济工作流评测”坐标，不替代过程级错误定位、记忆评测或代码检索；Synthesis 采用“可验证 workflow + public smoke/private holdout + deterministic-first gate”；Evolution action 是给 AutoSci 增加 Mini-ALE benchmark_builder/eval_harness 原语。
- **阶段**：✅ 第 1 轮作者稿完成 + 机器门禁通过。
- **阻塞**：独立冷审未跑，metadata 保持 `cold_audit.status="needs_human"`。
- **交付结论**：已按 arXiv v1 HTML/PDF/TeX 全文、HF 页面（#1 Paper of the day, 241 upvotes）、项目官网、GitHub 仓库 HEAD `8583037e52fec4ff100a12833ca330721a05575e` 重写/核补四个目标文件；区分论文自报、README/官网自称、源码实读与动态页面核验，并补充专家人数、Last-Exam 任务数、timeout 统计的口径差异；`node scripts/columns/papers/build-index.mjs` 通过（deepReads=27），`node scripts/validate-papers-deepread.mjs` 通过，`npm run verify` 通过（291 tests + validate + build 全绿，仅既有 warning），`npm run ops:baseline:diff` 通过且无新增 validator 失败；冷审未跑，`cold_audit.status="needs_human"` 保持不发布。

### PAPER-2606.07297 · SWE-Explore 深读第 1 轮（plan `docs/plans/2026-06-11-swe-explore-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 SWE-Explore 写成可进入 AI-Brief 的深读资产，重点沉淀“代码 agent 的仓库探索能力要被单独评估，而不是被 issue resolved 二值结果掩盖”的评测范式。
- **小方向**：读 arXiv v1 HTML/PDF 全文 + HF 页面 + clone `Qiushao-E/SWE-Explore-Bench` 源码；从头核验并重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.07297.yaml`；区分论文自报、HF/GitHub 动态核验、仓库实读。
- **Mind Palace 召回**：Recall 命中 SoCRATES / codegraph / GrepSeek / MemoryAgentBench 等；Contest 结论是本文补“仓库探索评测”坐标，不替代代码索引或通用 agent 记忆；Synthesis 采用“行级探索靶 + 轨迹接地 ground truth + 下游修复反验”；Evolution action 是给 AutoSci/codex 子 agent 增加 repository-exploration scorer / context budget optimizer 的可造方向。
- **阶段**：✅ 作者稿完成 + 机器门禁通过；独立冷审未跑。
- **阻塞**：独立冷审未跑，metadata 保持 `cold_audit.status="needs_human"`，不自动发布。
- **交付结论**：已按 arXiv v1 PDF/TeX 全文（PDF 已下载，TeX 全节/全表实读）、HF 页面（#2 Paper of the day, 107 upvotes；dataset 848/127/6）、GitHub 仓库 HEAD `3c12dc5`（13 stars/0 forks/1 commit）复核并写入四个目标文件；本轮修正了 restricted-context patcher 的正文/表注口径差异标注，并把 AutoSci `core_concepts` 收回到 KG-2 要求的 3–5 个；`node scripts/columns/papers/build-index.mjs` 通过（deepReads=27），`node scripts/validate-papers-deepread.mjs` 通过，`npm run verify` 通过（291 tests + validate + build，全绿，仅既有 warning）。

### PAPER-2606.12191 · Agentic Environment Engineering 深读第 1 轮（plan `docs/plans/2026-06-11-agentic-environment-engineering-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 Agentic Environment Engineering 写成可进入 AI-Brief 的深读资产，重点沉淀“环境工程 = 自进化 agent 的环境侧基础设施”。
- **小方向**：读 arXiv v1 PDF/TeX 全文 + HF 页面；核实无官方代码仓库披露；从头重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.12191.yaml`；区分综述自报分类、HF/arXiv 动态核验、作者定性判断与实测缺失。
- **Mind Palace 回写**：Recall 命中 self-evolving-agents-survey / MemoryAgentBench / MetaGPT / AgeMem 等；Contest 结论是本篇补“环境侧”坐标，不替代 agent 侧记忆/工作流/评测；Synthesis 采用“agent 进化 4 路径 × environment evolution 3 范式 × 四维环境质量门”；Evolution action 是给 AutoSci 原语新增 environment_builder / curriculum_scheduler / four_dim_environment_quality_gate 迁移点。
- **阶段**：✅ 第 1 轮作者稿完成 + 机器门禁通过。
- **阻塞**：独立冷审未跑，metadata 保持 `cold_audit.status="needs_human"`，不自动发布。
- **交付结论**：已按 arXiv v1 TeX/PDF 全文、HF 页面（#3 Paper of the day, 55 upvotes）重写四个目标文件；`node scripts/validate-papers-deepread.mjs` 通过，`node scripts/columns/papers/build-index.mjs` 已重建索引，`npm run verify` 通过（279 tests, validate, build 全绿；仅既有 warning）。

### PAPER-2606.07591 · ResearchClawBench 深读第 1 轮（plan `docs/plans/2026-06-11-researchclawbench-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 ResearchClawBench 写成可进入 AI-Brief 的深读资产，重点沉淀“隐藏目标论文 + 专家加权 rubric + 50=复现线”的开放式科研 agent 评测范式。
- **小方向**：读 arXiv v2 全文 + HF 页面 + clone `InternScience/ResearchClawBench` 源码/数据；从头重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.07591.yaml`；区分论文自报、HF/GitHub 动态核验、仓库实读。
- **阶段**：开发实现中。
- **阻塞**：独立冷审未跑，metadata 保持 `cold_audit.status="needs_human"`。
- **交付结论**：—

### PAPER-2606.05922 · Retrospective Harness Optimization 深读第 1 轮（plan `docs/plans/2026-06-11-retro-harness-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 RHO 写成可进入 AI-Brief 的深读资产，重点沉淀“无标签历史轨迹 → 自诊断 → 候选 harness → 自偏好门控”的 agent 自进化工程模式。
- **小方向**：读 arXiv PDF/TeX 全文 + HF/项目页 + clone `wbopan/retro-harness` 源码；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.05922.yaml`；区分论文自报、README/项目页自称、源码实读。
- **阶段**：✅ 作者稿完成 + 机器门通过。
- **阻塞**：独立冷审未跑，metadata 保持 `cold_audit.status="needs_human"`，不自动发布。
- **交付结论**：已按 arXiv v2 PDF/TeX、HF 页面、项目页、GitHub 仓库 HEAD `a206595` 重写四个目标文件；HF/GitHub 动态事实回核为 52 upvotes、16 stars、2 forks；Mind Palace 召回用于背景定位（self-evolving-agents-survey 等），未当作本文事实来源；`node scripts/columns/papers/build-index.mjs` 通过，`node scripts/validate-papers-deepread.mjs` 通过，`npm run verify` 通过（291 tests，validate/build 全绿，仅既有 warning）；冷审未跑，`cold_audit.status="needs_human"` 保持不发布。

### HARNESS-CMU-GAPS · 补全 CMU 四块拼图缺口（plan `docs/plans/2026-06-11-cmu-harness-gaps.md`）
- **大方向**：让"完成"从模型叙述变脚本判定——补 CMU 反馈块（基线对比/遥测）+ 约束·进化块（流程完整性/可判定 Rule 下沉/closeout 证据）。
- **小方向**：① `verify-baseline.mjs`（snapshot/diff，自证新增失败）② `check-harness.mjs`（workflow stage 完整性+引用不悬空+closeout 证据门，接进 validate）③ `token-usage-by-model.mjs`（遥测，比模型/定位烧点）④ npm ops:* ⑤ RULES #19/#20 + dev-map。
- **阶段**：✅ 完成。三脚本 + npm ops:* + validate 接入 + RULES #19/#20 + dev-map。
- **阻塞**：无。
- **交付结论**：独立冷审（opus）抓出两 bug 已修——① closeout 正则对 `**交付结论**：` 失配导致证据门变死检查（改 `\*{0,2}` 容粗体，已用合成 case 验证活检查）；② token 脚本按 content-block 重复计数（同 requestId 多行重复 usage），已按 requestId 去重（Opus 调用数 17,143→6,701）。修后 eslint/test/build 全绿，check-harness 接进 validate 实跑 0 硬错误。已快进 origin/main。

### DAILY-0610 · 2026-06-10 每日链 + 冷审硬化 + KG-2 增量入图（本日态势汇总）
- **发布现状（2026-06-11 续跑）**：Kevin 确认 Claude Code 与 Codex 额度不完全共享，Claude 429 时可用完全独立 Codex 子 agent 替代。GrepSeek 2605.29307 已由 Claude 冷审 PASS；LatentSkill / FlashMemory / SoCRATES / AdaPlanBench / SpatialWorld 已由独立 `codex exec` 冷审子进程完成 Stage A/B，两段式 JSON 审稿结果均为 `ready_to_publish`、`majorGaps=[]`，metadata 已写 `auditor:"codex-independent-cold-audit"`。`public/data/papers-index.json` 当前 deepReads=26。
- **发布完整性漏洞已根治**：1553d22 修复冷审只读“批次开始快照”的问题；Stage A/Stage B 每轮审前重新读盘，审计版本=发布版本，回归测试覆盖 `runDaily` 读取作者轮落盘后的 artifact。
- **审稿幻觉/错杀修复已落地但待独立重审**：FlashMemory 显存数字恢复为原文正确的 0.42/3.90 GB，并补 §3.2 去噪机制解释；冷审 prompt 增加“指控数字造假必须附原文逐字引文”纪律。当前尚未过独立重审，仍不发布。
- **批处理可靠性**：545e422/5817d3d 已修 audit_error 隔离与“audit_error 被收尾错写成终态 hold”问题；本次 5 篇 429 被正确隔离为 `audit_error`，没有污染 metadata 终态。
- **配额实证**：Claude CLI 429 仍是事实，但本次冷审用完全独立 Codex 子进程替代，主控只编排和落盘，不自审判稿。
- **KG-2 / Mind Palace 增量**：Mind Palace 自动入图 stage 已上线并实跑；d4rt + longtracerl 已入图。2606.02437 scaling facet 已用 Codex KG 子进程重蒸馏并入图，明确 `self_evo_use` 三段（记忆/理解/自进化）；`kg:build` 当前 facets:17 / vectors:17。其余待入图论文仍按队列继续。
- **待办**：继续处理剩余 KG ingest 队列（flashmemory/spatialworld facet 待蒸馏）。verify/提交/部署 → 已由 SESSION-0610-EVE 完成（见下）。

### SESSION-0610-EVE · loop-hook v3 + Mind Palace 冷批审 + 模型钉死 + 部署（Claude 主控）
- **Loop 协议 v3（Kevin 改语义）**：7 格展示+断层提问 → 不等"对"自主推进到可运行交付（红线🔴仍停）。hook 合并为单一 `loop_contract_gate.py`（UserPromptSubmit/PreToolUse/Stop 三事件）：句级分类修假阳/假阴、契约库 `.agent/contracts/` 免重填、180s 冷却修一天 22 份归档 churn、Stop 闭环+陈旧拆防。机器验收 `loop_gate_test.py` 29/29。协议文档/memory 已同步 v3。
- **Mind Palace 冷批审（codex 改动）**：方向对，三处修正——① research-loop.mjs 把战略七层架构 stamp 到任何查询（例子≠范围违例）→ 重构为 Recall/Contest/RoleCoverage/Gaps 机械层 + Synthesis/Evolution 由 agent 产出，加 13 case 测试；② codex 放宽锁定 bench 的红 case（metric gaming）→ 已恢复 precision 硬门并收紧新 case accept；③ 14+2 个旧 facet self_evo_use 补三段（记忆/理解/自进化），validator 0 WARN。回填后 bench precision 12/15→**13/15**、recall@3 8/8（涨分靠语料不靠放宽）。新增 scaling 容量 precision case 红着留（rank4，指向嵌入文本缺 self_evo_use/core_concepts 的改进方向）。
- **每日管线模型钉死（Kevin 红线：禁 Fable）**：3 处裸 `claude -p` 已显式 --model——papers:deepread=opus-4-8、cold-audit=opus-4-8（COLD_AUDIT_CLAUDE_MODEL 可覆盖）、kg:ingest=sonnet-4-6（KG_INGEST_CLAUDE_MODEL 可覆盖）；claude-author 原本就 opus-4-8 ✓；codex-deepdive 默认 gpt-5.5 ✓。
- **6.9/6.10 栏目核查**：papers 5 篇深读已沉淀+过审但未上线 → 本次提交部署；trending/models/pipeline 6-10 新鲜 ✓；**新闻栏 articles.json 停 6-04（断 6 天，静默失败）→ codex B 修根因**；深读积压 3 篇（Mellum2/TIDE/Humanoid-GPT）→ 文末跑 papers:deepread 清。
- **codex 并行派单**：A=项目栏 v2（plan `docs/plans/2026-06-10-projects-column-v2.md`，gpt-5.5 high）；B=新闻栏断档根因（gpt-5.5 medium）。任务书在 `.agent/codex-task-*.md`，产出报告待 Claude review。

### SESSION-0611 · 永久授权 + codex A/B 实跑 + 新闻栏修复落地（Claude 主控）
- **Kevin 永久授权（2026-06-11）**：push main 快进上线 + codex bypass 派发不再逐次问（memory `durable-authorizations`）；schema/删数据/密钥/强推仍🔴。main 已确认在 16956f1。
- **codex B 完成（已 Claude review 通过）**：新闻栏根因两个——① news CLI 的 LLM 默认开 + DeepSeek 180s 重试 → 例行跑超时假死；② 链路无健康门，全源失败仍静默写 news.json 报成功。修复：LLM 默认关（`NEWS_ENABLE_LLM=1` 可开；已核实前端不渲染 titleZh/summaryZh，产品零损失）；新增 `buildNewsHealth` 5 项检查 + `public/data/news-health.json` + `validate-news-health.mjs` 接进 validate；unhealthy 时 daily 非零退出（失败显式化）。实测 `npm run news:daily` 3.7s，health ok 12/14 源。
- **⚠误判修正（0610 核查的归因错误）**：`articles.json`≠新闻栏——它是**论文栏 publish 产物**（前端论文页渲染 papers-index.json，新闻页渲染 news.json，0609 审计早已记录）。articles.json 停 6-04 = 论文 publish surface 落后，随深读积压清掉+publish 重跑自然恢复，不是新闻链路 bug。教训：栏目核查契约里"数据文件→前端消费方"映射要先核实再归因。
- **codex A 完成（Claude review 通过并上线 cd471e4）**：项目栏 v2 全套——三窗 trending+HN Algolia+GitHub Search 增速+HF 可选源；ledger.jsonl full_name 幂等；rank 5 分项可解释；depth_band 挡位门（月榜前10默认deep/教学类封顶light）；深读 mind_palace 块（problem_solved/discovery_trace/method/self_evo_use三段/core_concepts）过 precheckProjectFacet 硬门入队 project-ingest-queue.jsonl。review 核查：范式/news/bench 零触碰 ✓、无裸 claude -p ✓、verify 实跑 279/279 绿 ✓。注意：`scripts/ops/token-usage-by-model.mjs` 非 A 产出（并行 harness 会话的），未并入提交。
- **项目范式 v2 已重写上线（c4dfb11，Claude 著）**：Mind Palace 取向——三元组为灵魂、self_evo_use 三段、core_concepts 承重概念、discovery_trace 默认数据不足+source_span 禁编造、project_type 选择性抽取；分流/打分/定级移交上游确定性管线，引擎只析不评级。
- **main 已三连快进**：16956f1→8383729(news 修复)→cd471e4(projects v2)→c4dfb11(范式)。
- **遗留**：深读积压 3 篇（Mellum2/TIDE/Humanoid-GPT）——避开与交互会话共享的订阅 5h 窗，排今晚 boot 管线或交互不活跃时段跑 `npm run papers:deepread`+`papers:cold-audit`；articles.json（论文 publish 面）随之恢复。projects v2 的首次真实日跑待明早 boot 验证（trending 页三窗+新字段渲染）。

### SESSION-0611-PM · 项目栏全覆盖+自进化闭环（多 loop, eval-first）+ boot 加固 + 并发撞车（Claude 主控）
- **plan**：`docs/plans/2026-06-11-projects-coverage-self-evo.md`（Kevin 批准，多 loop）。决策：①全覆盖+分挡 ②skills 双轴 ③自进化非红线 verify 门后直接应用+周审、红线排队（选项①）。
- **eval-first（Kevin 硬规则"审核前先写 eval"）**：`scripts/eval-projects-coverage.mjs`（分类≥0.85+覆盖100%+deep≤2）+ `scripts/eval-self-evo-loop.mjs`（schema+judge+verify门 poison必回退+红线必排队）+ `scripts/fixtures/project-type-golden.json`（30 手标，含 agent_skill 新品类）。
- **codex C1（覆盖管线，Claude review 上线）**：新增 `agent_skill` 品类、修 agent 歧义（客服≠AI）/non_ai 漏网；覆盖挡位（AI 入榜≥light）、两轴挑深读、skills 双轴（informs_our_structure→deep+self_evo_eligible）。独立验证：分类器 30/30、覆盖 5/5、3 个瞬态失败测试合并态 23/23 绿。
- **codex C2（自进化闭环，Claude review 上线）**：`scripts/kg/self-evo.mjs` 三函数（validateCandidate/judgeCandidate/applyCandidate）：深读→判更强吗→verify 门→非红线应用+`self-evo-applied.jsonl`/红线`self-evo-review.jsonl`。eval 全绿（poison 必回退、红线必排队实测）。这是"拿知识改造自己"闭环，不是更大记忆机器。
- **范式 v2.1（Claude 著 4d249dc）**：projects.md 补 agent_skill 双轴+informs_our_structure 轴；skills 对我们=L1 自进化一手材料。
- **⚠并发撞车（教训入 memory `concurrent-session-working-dir-hazard`）**：9 点 boot 的 `git add -A` 把 codex C1/C2 未提交改动扫进 247cdb0 并过门部署（feat=main）；同时 Kevin UI 会话把工作目录切到 codex/api → HEAD 全变虚惊，零丢失。处理=不抢 checkout，用隔离 worktree（OneDrive 外+junction node_modules）验证/改/推；worktree build 跑不了（Turbopack 拒 junction）只跑 lint/test/eval。
- **boot 两层加固（2c955a0）**：① boot-daily.ps1 内部非 deploy 分支时 stash 具名+checkout feat；② task action 改 -Command 先 checkout 再跑（治 boot 脚本在别分支不存在的静默 no-op）。②需 admin 重注册（`scripts/register-boot-daily.ps1`）。
- **遗留**：⚠工作目录现停 codex/api，今晚 boot 靠①自愈但②要 Kevin admin 重注册才治本；UI 会话收工后宜切回 feat。覆盖管线轻层已手动重跑产不冻住的 trending（本次提交）。

### SESSION-0611-PM2 · 全展示+排序+有用工具信号+精读内容三铁律（Kevin 决策，Claude 主控，worktree 隔离）
- **Kevin 决策**：trending 全展示，但**精读分析+高 star 先展示**，其余翻译 README 讲清做什么/解决什么；**有用工具凸显**（career-ops 类求职/效率工具值得装，不因是 skill 被埋）；精读前端**三铁律**：不堆砌文字/不中英夹杂/不含指令代码。
- **breadth 真根因**（先前只治了分类）：discover 层 `eliteSelection` 砍 103→12 + `makeBoard` 的 `boardLimit=12` 双截断。修：daily 默认 `eliteSelection:false`（`--broad`/`--elite-selection` 开关）+ boardLimit 兜底 12→100（全展示）。
- **截断 bug**：广覆盖卡多→DeepSeek 轻卡 `max_tokens=1200` 被 `finish_reason=length` 截断、JSON 残缺 jsonrepair 救不了。修：light token 1200→3000（两处）。
- **排序**（index.mjs sortForWindow 重写）：depth band（deep/standard→light→list_only）→ user_utility（career/job/resume/productivity/PKM 等关键词加权，不埋长尾）→ stars desc（高收藏先）→ trending rank。eval 加排序断言（depth 非递减）。
- **精读内容三铁律**入 `docs/paradigms/projects.md`：分层不堆砌、中文叙述（专名留英但句子中文）、正文禁安装命令/shell/代码块/配置（怎么用一句话带过，要跑去仓库 README）。**分工**：内容纪律=我（范式/prompt，feat 域）；视觉皮肤=UI 会话（codex/api 重设计 deep-dive interior），不互碰。
- **状态**：worktree 隔离改+跑（不碰 codex/api UI 会话），广覆盖轻层重跑中，verify+eval 后提交 push main 部署。深读 authoring 留今晚加固 boot（codex gpt-5.5，不在交互窗硬跑避 429）。

### PAPER-2606.09669 · SpatialWorld 深读从头重写（plan `docs/plans/2026-06-10-spatialworld-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 SpatialWorld 写成可进入 AI-Brief 知识库的深读资产，重点沉淀“统一 I/O 瓶颈 + 终态 verifier + TSR/SE 双指标 + 任务三件套”对 multimodal agent / 自进化 agent eval 的价值。
- **小方向**：读 arXiv HTML/PDF 全文 + HF 页面 + 项目页 + clone `Hongcheng-Gao/SpatialWorld` 源码/数据；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.09669.yaml`；区分论文自报、项目页/HF/GitHub 动态核验、仓库实读。
- **阶段**：✅ 第 1 轮作者稿复核完成 + 机器门禁通过。
- **阻塞**：独立冷审重跑在 Stage A 遇 Claude 429，`logs/papers-cold-audit/2606.09669/status.json` 为 `audit_error`；metadata 保持 `cold_audit.status="needs_human"`，按冷审门不自动发布。
- **交付结论**：作者稿已按 arXiv HTML/PDF 全文、HF 页面、项目页、GitHub 仓库 HEAD `55d8d47` 复核并落盘四个目标文件；机器门可过，但独立冷审未完成。

### PAPER-2606.09079 · FlashMemory-DeepSeek-V4 深读第 1 轮（plan `docs/plans/2026-06-10-flashmemory-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 FlashMemory-DeepSeek-V4 写成 AI-Brief 可收录的深读资产，重点沉淀 Lookahead Sparse Attention、KV cache 预测式预取、解耦训练与 oracle 诊断对 agent 记忆/长上下文工程的迁移价值。
- **小方向**：读 arXiv HTML/PDF/TeX 全文 + HF paper/model 页面 + clone `libertywing/FlashMemory-Deepseek-V4` 源码；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.09079.yaml`；修正原表内存数字、15 位作者列表、仓库 release 范围，区分论文自报 / HF&GitHub 动态核验 / 仓库实读。
- **阶段**：✅ 开发完成 + 机器门禁通过。
- **阻塞**：作者稿已修正错误 HOLD 带来的数字回退，并补 §3.2 去噪机制解释；独立重审在 Stage A 遇 Claude 429，metadata 保持 `cold_audit.status="needs_human"`。
- **交付结论**：已恢复原文正确显存数字 0.42/3.90 GB，并在内容中补充审稿指出的真实机制缺口；机器门可过，但未过独立冷审，不自动发布。

### PAPER-2606.06087 · LatentSkill 深读从头写（plan `docs/plans/2026-06-10-latentskill-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 LatentSkill 写成 AI-Brief 可收录的深读资产，重点沉淀“agent textual skill 从 prompt/context 搬到 LoRA weight space”的工程价值与限制。
- **小方向**：读 arXiv HTML/PDF/TeX 全文 + HF 页面 + clone `yuaofan0-oss/LatentSkill`；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.06087.yaml`；区分论文自报、HF 页面、仓库实读。
- **阶段**：✅ 作者稿完成 + 机器门禁通过；重审未完成。
- **阻塞**：官方 GitHub 当前仅 README + 图片，Code/Data/Checkpoints 仍 Coming soon，已在内容中诚实标注；完整性重审在 Stage A 遇 Claude 429，metadata 回到 `cold_audit.status="needs_human"`。
- **交付结论**：已写入 `paper.mdx` / `career.mdx` / `metadata.json` / `data/autosci/primitives/2606.06087.yaml`；但发布版尚未被独立冷审重新确认，不自动发布。

### PAPER-2606.05622 · AdaPlanBench 深读从头重写（plan `docs/plans/2026-06-10-adaplanbench-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 AdaPlanBench 写成可进入 AI-Brief 知识库的深读资产，重点沉淀 hidden world/user constraints、progressive disclosure、adaptive replanning eval 对 agent 产品与自进化验收的价值。
- **小方向**：读 arXiv HTML/PDF 全文 + HF 页面 + clone `JiayuJeff/AdaPlanBench` 源码；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.05622.yaml`；数字集中在实验节并区分论文自报/仓库实读/原文未披露。
- **阶段**：✅ 作者稿完成 + 机器门禁通过；重审未完成。
- **阻塞**：独立冷审重跑在 Stage A 遇 Claude 429，`logs/papers-cold-audit/2606.05622/status.json` 为 `audit_error`；metadata 保持 `needs_human`。
- **交付结论**：已重写 `paper.mdx` / `career.mdx` / `metadata.json` / `data/autosci/primitives/2606.05622.yaml`；未过冷审，不自动发布。

### PAPER-2606.05563 · SoCRATES 深读从头重写（plan `docs/plans/2026-06-10-socrates-deepread-round1.md`）
- **大方向**：按 canonical 论文范式把 SoCRATES 写成可进入 AI-Brief 知识库的深读资产，重点沉淀 topic-localized LLM judge、hard-task gate、counterfactual baseline 对 agent eval / 冷审门的可迁移价值。
- **小方向**：读 arXiv HTML/PDF/HF/项目页全文与附录；确认代码/数据项目页仍为 Coming soon；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2606.05563.yaml`；数字集中在实验节并标论文自报。
- **阶段**：✅ 作者稿完成 + 机器门禁通过；重审未完成。
- **阻塞**：独立冷审重跑在 Stage A 遇 Claude 429，`logs/papers-cold-audit/2606.05563/status.json` 为 `audit_error`；metadata 保持 `needs_human`。
- **交付结论**：已重写 `paper.mdx` / `career.mdx` / `metadata.json` / `data/autosci/primitives/2606.05563.yaml`；未过冷审，不自动发布。

### PAPER-2605.29307 · GrepSeek 深读从头重写（plan `docs/plans/2026-06-10-grepseek-deepread.md`）
- **大方向**：按 canonical 论文范式把 GrepSeek 写成可进入 AI-Brief 知识库的深读资产，重点沉淀 Direct Corpus Interaction 对 agent/RAG 工程的可迁移价值。
- **小方向**：读 arXiv HTML/PDF/TeX 全文 + HF 页面 + clone 源码；重写 `paper.mdx`、`career.mdx`、`metadata.json`、`data/autosci/primitives/2605.29307.yaml`；数字集中在实验节并区分论文自报/源码实读。
- **阶段**：✅ 作者稿复核完成 + 冷审 1 轮 PASS。
- **阻塞**：无；metadata 已标 `cold_audit.status="ready_to_publish"`。
- **交付结论**：已按全文/源码复核并落盘 `paper.mdx` / `career.mdx` / `metadata.json` / `data/autosci/primitives/2605.29307.yaml`；修正 HF 动态 upvote 表述、career 自报标注、AutoSci core_concepts 受控词表命名；已进入文章索引，待 push/部署生产可见。

### KG-2 · 知识关联层全语料化 + 自进化反哺 + 综合栏（plan `docs/plans/KG-2-association-layer.md`）
- **⚠范式注记（2026-06-12 KG-4）**：schema v2（facet 级）已被 ros-v1 对象库取代；两层命名制/NO_EDGE/证据门等纪律被 KG-4 正典继承。剩余切片（gap-map 反哺/综合栏）改在对象库上实现。
- **大方向**：北极星 L1/L3——关联层覆盖全语料且**被机器真用**（gap-map 反哺选稿=自进化；跨记忆综合产 derived 节点=auto-research 种子）。Kevin 2026-06-09 loop 7 格确认（回填部分+增量、paper↔project 词表+核心概念门、竞赛+批判 agent、综合=单独栏、增量入图长在 PIPE-1、授权批判性改现有结构/范式）。
- **与 AM 的关系**：吸收 AM Wave 2-4 的「沉淀管线」决策——增量入图=PIPE-1 LangGraph 节点（不塞 boot .mjs），落地前用幂等回填脚本；判边候选召回用 AM Wave 1 竞赛胜出的 **hybrid(BM25+向量+RRF)**，非纯向量。原 🔴「动上游管线」由此解除（不动现 boot 管线）。
- **阶段**：✅ Phase 0 完成（codex+Claude 两路对抗审独立收敛：solution_path→可空 discovery_trace+source_span 硬门 / same_problem KILL / core_concepts 升对象数组 role 化使核心概念门机器可判 / 判边默认 NO_EDGE+双端 evidence+negative rationale / eval 重标基线防假绿 / Phase B 指标去 self_evo_use 循环论证。schema v2 定稿 plan §3.1；范式增量已落 papers.md#14「解法是怎么找到的(选读)」+ projects.md Tier3 core_concepts+claim_ledger）。→ 🔄 pilot 切片 2 跑中（TrOPD/MetaGPT/survey 三论文 facet v2 + 项目侧 core_concepts 升级 + codex validator v2，并行）。
- **进度续 (2026-06-10)**：✅ codex pilot 后端门完成（plan `docs/plans/KG-2-pilot-backend-gate.md`）：`validate-mind-palace` 落 v2 字段门 + bad fixture 三类 reject 实测；`concept-vocab.json` 生成；`kg:build` 链接入 vocab；TrOPD/MetaGPT/self-evolving survey 三个 paper facet 已合并到 paper 节点，`facetedNodes:12`、vectors:12。
- **✅ pilot 切片 2 完成 (2026-06-10)**：① 独立判边（opus，generator≠judge）8 候选**全 NO_EDGE**（含 TrOPD 阴性对照；MAB 受测清单实证不含 AgeMem/supermemory，"类目级配对"被证据门挡住）→ 补 `evaluates` 边型 + `evidence_kind` 机器门；② 跨模型冷审：3 新 facet PASS（discovery_trace"数据不足"判定确认正当），4 升级文件概念命名 FAIL → 裁定**两层命名制**（name=跨文件统一规范名 / evidence=源文逐字短语）→ 修复 agent 改完、共用锚（冲突消解/可学习的记忆操作）保住、validator+vocab(31 概念)全绿；③ 前端节点面板新增**承重概念 chips + 解法发现链块**；④ kg:build + npm build 全绿 → 部署。**产品可见**：/mind-palace 点 TrOPD 看 discovery_trace、点任意 12 faceted 节点看承重概念。
- **进度续 (2026-06-10 夜)**：✅ Mind Palace 自动入图 stage 上线并实跑：d4rt、longtracerl 两篇积压自动蒸馏入图；`public/data/brief/graph.json` 与 `data/knowledge-graph/concept-vocab.json` 均含两者，`validate-mind-palace` 当前统计 facets:16 / vectors:16。2606.02437、2606.03458 后续入图因 Claude 429 失败并隔离，待额度恢复。
- **进度续 (2026-06-11 第二大脑 contract)**：✅ `docs/workflow/mind-palace-operating-contract.md` 落地：复杂 agent/记忆/预测/自进化/架构任务前必须 Recall → Contest → Synthesis → Evolution actions。✅ `scripts/kg/research-loop.mjs` + `npm run kg:research` 落地：hybrid(vector+BM25+RRF) 召回 Mind Palace，输出候选方法竞赛表、推荐架构和 delete/replace/optimize/add 自进化动作。✅ 新入图 prompt/precheck 要求 `self_evo_use` 显式覆盖“记忆/理解/自进化”；全量 validator 对旧 facet 缺口 warning，避免一次性重写全库。
- **切片**：① 审计+schema v2 定稿 ② pilot 3 节点入图(产品可见停点) ③ 存量批量回填 ④ gap-map 反哺字段进选稿 ⑤ 综合栏第一篇(🔴 新栏目 Kevin 自审)。
- **阻塞**：无。

### AM · Agent Memory 撑得住大数据量沉淀（研究驱动，plan `docs/plans/2026-06-09-agent-memory-at-scale.md`）
- **大方向**：Mind Palace 从"9 条卡片"→可累积/精确召回/不糊/会自更新的 agent 记忆。停止=上线+撑大数据量沉淀+上线后 AI 审。
- **方法**：学了科研 agent 工作流（autoresearch 双循环 + ara exploration-tree）→ research-loop（锁 eval 先于方法、多法竞赛、跨模型对抗审、不照抄）。
- **Wave 1 ✅（已做）**：① 锁定对抗 benchmark（`recall-bench.json` 20 查询）② 方法竞赛（`bench-retrieval.mjs`）：**hybrid(BM25+向量+RRF) 胜出 precision@1 1.000 vs 单法 0.857**（我们语料实测，非照抄）③ codex 跨模型架构审 → 3 大 scale 优先级。
- **决策(exploration-tree)**：检索用 **hybrid**（vector 漏改写/bm25 漏建造目标，RRF 各补其短）。
- **Wave 2-4 待做**：② **ship hybrid 到生产检索**（前端 client 端嵌入+BM25+RRF 或 API）③ **沉淀管线**（新深读自动 facet+边+嵌入+质量态,🔴 改上游每日管线=需 Kevin 拍上线策略）④ **冲突/staleness**（active/superseded/contradicted 态+信任排序,检索/UI 降级 stale 不只贴标签）⑤ 聚类层次呈现 ⑥ scale-stress(放大 100/500/1000 测)。
- **阻塞**：沉淀管线动上游=🔴。codex 可继续后端。


### ✅ MP-0 · Harness 治理层（结构化调度落地）— 已落地（含编排决策修正）
- **大方向**：本项目=长期每日更新知识库+自进化+研究 agent，必须有可约束/可交接/可审计的工程骨架，否则越迭代越乱（Kevin 2026-06-09）。
- **小方向**：① 7 角色契约 ② 接力 workflow（人+AI+进度） ③ plan 模板 ④ RULES 工作流红线 ⑤ AGENTS.md 镜像给 codex ⑥ task-board 活起来。
- **阶段**：开发 → 自审中。
- **文档**：`docs/agents/`、`docs/workflow/`、`docs/plans/_TEMPLATE.md`、`RULES.md`、`AGENTS.md`、本表。
- **阻塞**：无。
- **交付结论**：待独立 agent 审后回填。

### PIPE-1 · 每日管线迁移到 LangGraph (Python) 🔴
- **大方向**：每日 boot 管线本质是带条件门+有界循环的状态图；手搓 .mjs = 挂起/timeout/静默发布/丢状态 bug 的系统性根源。上 LangGraph 拿 checkpoint/断点续跑/可观测/HITL，让无人值守跑可靠（Kevin 2026-06-09 研究四家后签字）。
- **小方向**：① Python 运行时落地（Windows/OneDrive，与 Node 并存）② 管线建成状态图：节点=CLI shell-out（claude -p/codex exec/deepseek），边=冷审 pass/fail 门 + 冷审≤3 轮有界循环 ③ checkpoint 持久化（被 kill 可续跑）④ 可观测 run log ⑤ 冷审 RED LINE「未过审不自动发布」用门边硬化。
- **阶段**：方案设计（待写 plan `docs/plans/2026-06-09-langgraph-pipeline.md`）。
- **🔴 需 Kevin 签字点**：新 Python 运行时依赖（已签）、上线策略、任何 schema 变更。
- **阻塞**：codex 额度（后端工程主力）；可用 opus 子 agent 顶设计/小实现。
- **交付结论**：—

### MP-1 · Mind Palace（记忆宫殿 = 关联记忆 + 内化吸收）
- **大方向**：知识图谱从"薄索引"升级成"吸收了内容的记忆"——对 Kevin=战略外脑（给可执行方法），对 AI=L1 自进化的推理就绪记忆。`/graph` → `/mind-palace`。
- **小方向（2026-06-09 冷审后修正，见 plan §0）**：① **质**=facet 蒸馏（problem_solved/method/result/innovation/weakness/architecture/transfer）② **功能**=本地向量索引+findRelated/召回（`@huggingface/transformers` multilingual-e5-small，无 API，Kevin 签字）③ **推理**=已核验 typed 边（improves_on/composes_with/contradicts/special-case-of/derives-from 走冷审门），自动 tag 边降级 ④ 两套图引擎收敛 ⑤ 检索视图（建造目标→适用方法+proven_case 证据）⑥ rename `/graph`→`/mind-palace`，模型不进 ⑦ **eval=召回式**（非边数）。
- **阶段**：开发中（plan `docs/plans/2026-06-09-mind-palace-and-projects.md`；正在 de-risk 本地嵌入依赖）。
- **🔴 签字点**：新依赖 @huggingface/transformers（本地嵌入，已签）。
- **阻塞**：无。
- **进度 (2026-06-09 并行执行中)**：✅ 嵌入底座 de-risk PASS（本地 multilingual-e5-small，中文 query 召回正确）+ `scripts/kg/embed.mjs` 跑通；✅ **9 facet 已蒸馏**（gold agemem + 2 opus 子 agent 各 4：rohitg00-agentmemory/memoryagentbench/supermemory/mempalace + ai-scientist-v2/colbymchenry-codegraph/nousresearch-hermes-agent/understand-anything），全带 typed 边(improves_on/composes_with/contradicts)+自报标记+冷审引用行号；✅ 前端 `/graph`→`/mind-palace` rename + FacetSpine 渲染 + 标题；🔄 **codex 后端轨**跑中（validate-mind-palace.mjs + recall-eval.mjs 已出，integrate-kg facet 合并 + 引擎收敛进行中）。
- **进度续 (2026-06-09)**：✅ codex 后端轨完成（integrate-kg 合 facet 到节点[facetedNodes:9] + 摄入 8 条已核验 typed 边 + 32 条 tag 边降级 weak/排除出 associativeEdges[=24]；validate-mind-palace + recall-eval 建好）；✅ 全链 `npm run kg:build`(build→integrate→embed) 绿；✅ **召回 eval：recall@1 0.750 / recall@3 1.000**（真功能验证，非边数）；✅ **独立冷审 9 facet 全 PASS**（generator≠critic，无杜撰、自报全标记、边有据、self_evo_use 诚实；仅 2 非阻塞 nit）；✅ 前端 FacetSpine（节点面板）+ `facets.json` 索引 + **项目人读页 ProjectFacetSpine 引导段**（用 X 解决 Y/展现 Z/创新/缺点/Mermaid 架构/迁移）；✅ validate-mind-palace + embed 接进 npm validate/kg:build；✅ typecheck 绿。🔄 `npm run build` 跑中。
- **下一步**：build 绿 → commit + 部署（feat→main 快进）→ **上线后 AI 审：视觉(/browse)+文字内容**（独立子 agent）。
- **非阻塞遗留**：检索视图(free-text in-browser 查询)未做（per-node facet+边+召回 eval 已证功能）；ai-scientist-v2→hermes 边单向（有意）；2 facet 注释 typo「受称」。
- **交付结论**：待 build+部署+AI 审。

### MP-2 · 项目人读深读重做
- **大方向**：现项目深读"又丑又学不到东西"——要 结构化分段 + 信息密度 + 视觉 + 大白话 + 例子，分析内容本身是重点（Kevin 2026-06-09）。
- **小方向**：内容范式 + 前端一起重做；交可运行版本 Kevin 视觉验收。
- **阶段**：需求分析。
- **阻塞**：与 MP-1 facet 范式共享（项目=实战案例，proven_case 复用）。
- **交付结论**：—

## 已交付
（迁移自 docs/plans 历史：Plan-1/2 多批 P0/P1 已上线——详见 [docs/plans/README.md](./docs/plans/README.md)。本表从 2026-06-09 起接管态势记录。）

### DAILY-0609 · 2026-06-09 日常更新（重跑中）
- 今晨 09:15 boot **挂在新闻第一步**：根因=PS5.1 `$EAP=Stop` + `native 2>&1|Tee` 把子进程 stderr 的瞬时重试日志（openai RSS retry 1/3）误判为致命错误 → 整管线死、无 marker。**根因已修**（boot-daily.ps1: EAP=Continue + git pull/npm daily/push 显式 `$LASTEXITCODE` 检查——真失败仍停，stderr 噪声不再炸）。此事故=PIPE-1(LangGraph) 论据 +1。
- 21:5x 修复后重跑中（后台）。跑完接 **KG-2 增量入图首跑**：今日新深读 → facet 蒸馏 → 判边 → 冷审 → mind palace。
- Loop Contract Gate（loop-engineering 协议 v2 机器硬门）今晚已实装并实弹验证（armed 时 npm 被拒/契约齐开闸/管线 LOOP_GATE=off 旁路）。
- **收尾复核 (2026-06-11)**：6/9 的 boot-daily 事故修复已进入后续提交；Loop Contract Gate 已在 Codex 会话中再次实弹验证。KG-2 增量入图已由 6/10 夜间 stage 接管，结果记录在 DAILY-0610 / KG-2。

## 阻塞 / 等人
- codex 额度：2026-06-08 晚耗尽，深读/管线改用 opus 子 agent 顶（见 memory feedback-subagent-fallback-and-durable）。
- Claude CLI 额度：2026-06-11 当前仍返回 429 session limit；5 篇独立冷审与 2 篇后续 KG ingest 需要额度恢复后继续，不能由 Codex 自审替代。
