# SPEC: 项目内容统一重生成 + 关系引擎再深挖（Kevin 2026-06-11 晚，一次性清债）

> 执行者：codex（gpt-5.5 high 做深内容；可自派 sub-agent 并行 per-item，聚合文件单写者）。
> 红线：**不碰 `src/` `app/`**（前端 Claude 在改）；**不跑 `next build`/`npm run verify`**（用数据侧校验：`node scripts/eval-relation-engine.mjs`、content lint、JSON schema 自检）；不捏造（不知道写「官方未披露」）；自报 vs 实测标注照旧。
> 进度：每完成一个 phase 在 `logs/remine-progress.md` 追加一行。最终写 `logs/remine-summary.md`。

## 背景（Kevin 原话要点）
- RuView 式分析（`meta.light_spine`，/brief/[slug] 渲染）+ Mind Palace facet = **每个深析项目的标配**，旧 Tab 式深读淘汰。
- 「所有旧内容请清理干净，不要再出现新老版本共同出现」。
- 星图只有 29 条真边：Kevin 判定 = **以前蒸馏不够细**，不是真没共性。「那么多高收藏项目+论文不会没有一点共性；真没有就落单独 label，不会出现上百个独立 label」。

## Phase 1 — 项目内容清债（deep-dives.json + trending.json + facets.json）

### 1a. 删除新老共存的旧版 deep-dive
`public/data/brief/deep-dives.json` 里无 owner 前缀的旧 slug，凡存在 owner 前缀的新版对应物（如 `9router-deep-dive` vs `decolua-9router-deep-dive`、`funasr` vs `modelscope-funasr`、`moneyprinterturbo` vs `harry0703-moneyprinterturbo`、`agent-reach` vs `panniantong-agent-reach`、`academic-research-skills` vs `imbad0202-...`）→ **删旧留新**。逐一核对内容确为同一 repo 再删；产出删除清单进 summary。

### 1b. spine:false 的旧深读 → 按 RuView 范式重生成
对仍然有效（无新版对应物）但 `meta.light_spine` 缺失的条目（如 `ai-engineering-from-scratch-deep-dive`、`agemem`、`mempalace`、`ai-scientist-v2` 等）：
- 读 repo 源（clone / README / 关键代码），gpt-5.5 high 重写为 `meta.light_spine`（schema 见 `src/components/LightSpineDeepDive.tsx` 的 `LightSpine` interface：one_sentence / why_worth_attention / key_claims_evidence(items 带 attribution+evidence_strength) / how_it_works / reusable_abstractions / dependency_platform_risk / unknowns_to_confirm / judgment(action+ratings+overall)）。
- 文风按 `docs/paradigms/projects.md`：大白话两层、降术语密度不降信息密度、**禁止大段中英夹杂和裸代码指令堆**（Kevin 截图点名 ai-engineering 旧文就是反面教材）、机制讲解配类比。
- 旧 `meta` 里被取代的旧式正文字段清掉，不留双版本。

### 1c. 过深度门却没分析的项目 → 补深读
`public/data/trending.json` 各窗口里 `worthDeepDive ≥ 60`（或管线 final_depth 判 deep）但无 briefSlug/deep 的（已知：tinyhumansai/openhuman 70、Egonex-AI/Understand-Anything 62）→ 生成 light_spine 深读 + 回填 `briefSlug`。
低于门的（如 msitarzewski/agency-agents 57）**不补深读**，但见 1d。

### 1d. 修 light 文案矛盾（全量）
现 `light` 是模板机器话（「得分 57，信号是 project_type:agent_skill, signal_score:57。按确定性深度门控进入 deep，建议 deep_dive」），**与门控决定直接打架**（57<60 实际没深读，前端建议动作显示"不建议投入"）。全量重写 `light` 为大白话 quick-read：这项目是什么+对学习者的真实判断，**判断措辞必须与实际深度决定一致**（深读了→指引去读；没深读→说清为什么不值得投入）。模板字段（得分/信号机器话）删除。

### 1e. Mind Palace facet 全覆盖（深析项目）
每个 spine:true（含 1b/1c 新产）项目蒸馏 facet 进 `public/data/brief/facets.json`（管线：`scripts/columns/projects/project-facet.mjs`）：problem_solved / method / result / innovation / weakness / architecture(Mermaid，过 parse 校验) / transfer + self_evo_use。键 = 前端匹配序列 `${owner}-${name}` 小写（见 `src/legacy/Detail.tsx` facet 匹配逻辑）。RuView（已有 spine 没 facet 的代表）必须补上。

## Phase 2 — 关系引擎再深挖（先补蒸馏，再重判边）

### 2a. 论文侧 facet 补全
`content/papers/` 所有深读论文，facets.json 缺的全部补蒸馏（同 facet 结构）。**蒸馏要细**：core_concepts（两层命名）、discovery_trace 按 KG-2 schema 硬门。这是挖边的原料——Kevin 判定之前边少的根因就是这里蒸馏太浅。

### 2b. 候选放宽 + 重判边
- `scripts/kg/dump-relation-candidates.mjs`：topK 5→10、max 80→300、**加跨 kind 配对**（paper↔project）。
- codex 用自身 gpt-5.5 按 `docs/paradigms/relation-taxonomy.md`（8 组关系型）离线判每对 → 决策文件 → `scripts/kg/relation-llm-io.mjs` file-judge 回放 → 重建 graph.json typed 边。
- 硬门不变：NO_EDGE 默认、证据逐字 ∈ facet 散文、每边必带 `use`（怎么利用）、类目级配对（"都用 GRPO"）拒。**不硬凑——但这次原料厚了，预期真边显著多于 29。**

### 2c. 仍无边节点 → track label 落点
判完后仍 0 typed 边的节点：从 facet 提炼 track/topic label（如 `agent-memory`、`wifi-sensing`）写到节点 `track` 字段，聚合直方图进 summary——**报告 label 基数**（Kevin 预测远小于 100；若真出现上百个独立 label，如实报告，这是重要信号）。

### 2d. 验证
`node scripts/eval-relation-engine.mjs` 绿 + recall bench 不退 + summary 报：新边数按型分布、facet 覆盖数、label 直方图、删除清单。

## 顺序与并行
1a→1b/1c 可 per-item 并行（gpt-5.5 sub-agent），1d 全量批跑，1e 在 1b/1c 完后；Phase 2 在 1e 后（要吃项目 facet）。聚合 JSON（deep-dives/facets/graph/trending）**单写者、最后一次性写**，防并发踩踏。
