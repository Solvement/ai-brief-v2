# 后端执行规格 v2：学术论文「精读伴读」范式（交给 Codex）

> 状态：待 Codex 实施。作者：Claude（PM/架构）。日期：2026-05-31。
> **本 v2 整份替换 v1。** v1 是 GPT 的「FDE 决策工作台」稿；经与 Kevin 一轮 grill（见 `CONTEXT.md`），方向已**根本改变**——不再是 FDE 决策工作台，而是**学术精读伴读**。凡本规格与 GPT 原稿冲突，**以本规格 + `CONTEXT.md` 为准**。
> 唯一权威产品方向 = 仓库根目录 `CONTEXT.md`。实施前 Codex 必须先读 `CONTEXT.md`。
>
> **铁律**：禁止针对任何论文写死逻辑（不得用 title / arxivId / 作者名做 if-else）。三篇样本只作回归 fixture。
> **边界**：本轮改动**只作用于「学术论文」栏目**——后端 `scripts/columns/papers/*`、前端 `src/pages/Articles.tsx`、共享类型 `src/types.ts` 里 papers 相关部分、`scripts/validate-articles.mjs`、papers 单测。**不碰** Projects / Models / Podcast。

---

## 0. 产品形态（一句话）

学术论文栏目 = **精读伴读**，核心体验「**先让我自己想，再看 AI 的**」。
- 只有 deep dive 一档，**没有"读不读"决策层、没有评分、没有 FDE**。
- 点开 = 直接进**两段式深度内容**：
  1. **第一段·原文**：顺论文原文 section 结构，逐节翻译+总结，罗列关键图表结果（文字）。**忠实、克制、禁止 AI 判断**。
  2. **视觉分隔**：明确标「以下是 AI 的分析，非原文」。
  3. **第二段·AI 分析**：自由评论行文的深度短评，可批判、有洞察。**不打分**。
- 选题闸门替 Kevin 判断"够不够好"（学术信誉优先），所以详情页不需要任何质量判断 UI。

---

## 1. 现状文件地图（已核实）

- 生成提示词：`scripts/columns/papers/prompts.mjs`（`analysisSystem(tier)` / `analysisUser(...)`，deep 模板在 `deepShape`）。
- 规范化后处理：`scripts/columns/papers/analyze.mjs`（`normalizeAnalysis` + 各 `normalize*`）。
- 选题打分：`scripts/columns/papers/evaluate.mjs`（`deterministicScores` 在 269-275，`select`/`selectDiverseTop`，`source_quality`/convergence 信号）。
- 发布 + radar：`scripts/columns/papers/index.mjs`（写 `public/data/articles.json`）。
- 发布校验（lint）：`scripts/validate-articles.mjs`（`npm run validate` 一环）。
- 单测：`scripts/__tests__/papers-analyze.test.mjs`。
- 前端共享类型：`src/types.ts`（`AcademicPaperAnalysis` / `PaperDeepDive` 等）——**Codex 负责改类型**，Claude 只消费。
- 样本数据：`public/data/articles.json`。备份在 `.backup-pre-rebuild/`。
- 已修复（勿重复）：scorecard 英文模板重复 bug 已修；但**本轮 scorecard 整块删除**，相关代码一并移除即可。

---

## 2. 删除清单（本轮明确去掉，prompt + normalize + types + lint + 数据 一律清）

从 deep 输出 schema、prompt、normalize、types、validate 中**移除**：
- `verdict`（及 readDecision / fdeFit / empiricalEvidence / artifactReproducibility / deploymentEvidence / confidence / oneLineJudgment / readFor / doNotUseFor / whyNow / whyNotOverclaim）
- `scorecard`（整块，含旧 10 维与学术 8 维方案——Kevin 不看分）
- `fdeTakeaways` / FDE memo 全部（customerProblem / discoveryQuestions / rollout / roi / interviewStory…）
- `claimLedger`、`evidenceMatrix`、`artifactAudit`、`whatWouldInvalidate`、`contributionLayers`、`evidenceChain`、旧 `audit[]`、`loadBearingClaim`/`strongestEvidence`/`suggestedExperiments` 等重型审稿字段
- 旧 tier 概念里 light/deep 的二分——学术论文只产 deep（见 §6）

> 兼容策略：**彻底切新结构，不保留旧字段兼容**。全量重跑会覆盖旧数据，回滚靠 `.backup-pre-rebuild/`。前端旧组件由 Claude 在交接后删。

---

## 3. 新 schema（学术精读伴读）

每篇 `AcademicPaperAnalysis`（deep）输出如下结构。新增枚举三处同步：`src/types.ts` + `analyze.mjs` 常量 + `validate-articles.mjs`。

### 3.1 `meta`（论文顶层）
```
title / authors / arxivId? / version? / publishedAt?
venue / venueStatus: verified | unverified | not_provided
paperType: survey|theory|system|benchmark|dataset|industry_case|evaluation_audit|tooling|position_roadmap
sourceReliability:
  discoverySource: string          // 发现渠道（Papers with Code / HF Daily / OpenReview…）
  primarySourceVerified: boolean   // 是否回一手来源核验事实
  paperHtmlFetched / pdfFetched / repoFetched / appendixFetched: boolean
tags: string[]
```
**强制**：`discoverySource`（发现渠道）≠ 事实证据来源。Papers with Code / newsletter / Twitter / HN **只能**作发现源；事实/数字/venue 必须回一手来源核验，未核验则 `primarySourceVerified=false`。

### 3.2 `originalReading[]` —— 第一段·原文（产品主体，忠实）
顺论文原文 section 顺序，每节一个对象：
```
heading: string          // 原文小节标题，翻译成中文
summary: string          // 该节 翻译 + 总结（忠实复述，禁止评价）
keyResults?: [            // 该节的关键图/表/结果，文字罗列（本轮不抓真实图片）
  { kind: "figure"|"table"|"result", ref: string, finding: string }
  // ref 如 "Figure 3" / "Table 1"；finding 如 "pass rate 随步数先升后降，峰值 0.66@4步"
]
```
**强制（lint 必拦）**：
- `originalReading` 全篇 `summary` + `keyResults.finding` **禁止评价词**：不得出现「值得 / 推荐 / 强 / 弱 / 优秀 / 突破 / SOTA 式吹捧 / 我认为」等判断性措辞（给一份禁用词正则，中英都覆盖）。目的：保持忠实、让用户先自己判断。
- 全篇 `keyResults` 合计 **≤ 5 个**（10A：只罗列最关键 3–5 个）。
- 数字/结果必须来自 `evidence.content`，不得编造；缺则不写（RULES §6）。

### 3.3 `analystNotes` —— 第二段·AI 分析（自由行文，可批判）
```
analystNotes: string     // markdown 自由行文的深度短评，一段或多段
```
**强制**：
- 这是**唯一**允许 AI 判断/批判的地方。可谈承重主张、证据强弱、哪里站得住/存疑、启发与迁移。
- **不打分**、不套固定小标题（B：自由评论行文）。
- 与 `originalReading` 物理隔离（不同字段），前端中间插「以下是 AI 分析，非原文」分隔。

### 3.4 `selectionAudit` —— 选题闸门留痕（不展示为评分，供审计/debug）
```
candidateCount / selectedCount / selectionScore: number
selectedReason: string
rejectedReasonIfAny: string        // 入选则空
weightedFactors:                   // 学术因子（非 FDE）
  venuePrestige / citationConvergence / novelty / recency   // 选题阶段映射
  evidenceStrength / reproducibility                        // 深析后回填（见 CONTEXT「合成方式 A」）
discoverySource / primaryEvidenceSource
```
**强制**：`discoverySource` ≠ `primaryEvidenceSource`；`evidenceStrength`/`reproducibility` 在选题阶段填 `"unknown"` 占位，深析跑完在 publish 阶段回填真实值（来自 §3.2/§3.3 推得的客观事实），**不在选题阶段瞎填数字**。

### 3.5 保留的既有字段（沿用，语义不变）
`leadJudgment`（一句定调，框定而非好坏）、`limitsAndFuture`（paperStated + evidenceNotes）、`selection`（convergence/track/ideaSignal）、`provenance`。
> 注：`leadJudgment` 是「定调框定」不是「值不值得读」，保留。

---

## 4. 选题闸门调权重（9C：调不重写 `evaluate.mjs`）

**不重写**打分器。只在 `deterministicScores`（evaluate.mjs:269-275）与相关权重处**调系数**：
- **上调**学术信誉信号：`source_quality`（顶会/OpenReview/ICLR/NeurIPS/best-paper 加分）、convergence（多源汇聚）、`novelty`。
- **下调到很低**：FDE/customer/production/workflow/deployment/API 那套交付信号的权重（`fdeHits` / `productWords` / practicality 里的 FDE 项）。
- 目的：选出偏「顶会理论好作 / 多源推荐」，而非「工程落地味重」。
- **可配置**：`PAPERS_DEEP_CAP`（默认 1–3，宁缺毋滥）、`PAPERS_MIN_SCORE`（不到不发，允许空窗、整批记 rejectedReason）写入 env/config，勿写死。
- 单测：构造「顶会 best-paper 理论论文」vs「工程落地 demo」两个 fixture，断言前者综合分更高。

---

## 5. Token（沿用上次结论）

deep 输出体积变小了（删了一堆重型块），但仍要保证不截断：`PAPERS_DEEP_MAX_TOKENS` 给 12000–16000；单测断言 `maxTokens('deep') >= 12000`。

---

## 6. Prompt 重写（`prompts.mjs`）

- `analysisSystem`：改成产出 §3 的新结构（meta / originalReading / analystNotes / selectionAudit 回填位 / 保留字段）。删掉所有 verdict/scorecard/FDE/claimLedger/evidenceMatrix/artifactAudit 模板。
- 写死两段铁律到 system prompt：
  - **第一段 originalReading 忠实约束**：顺原文结构、翻译+总结、罗列≤5 个关键图表结果、**禁止任何评价/判断/推荐措辞**、不编数字。
  - **第二段 analystNotes**：自由行文深度短评，可批判，不打分，不混入第一段。
- 保留教授嗓音 + RULES §6 不编造。
- 学术论文**只产 deep**（不再有 light academic 分支；若 kernel 需要 tier 字段，固定 "deep"）。

---

## 7. Lint（`validate-articles.mjs` + 可选独立 lint，纳入 `npm run validate`）

硬校验（fail 即 exit 1）：
1. `originalReading` 非空、每节有 heading+summary；`keyResults` 合计 ≤5；summary/finding **不含禁用评价词**（正则）。
2. `analystNotes` 非空字符串。
3. `meta.sourceReliability`：discoverySource 存在；discoverySource ≠ primaryEvidenceSource。
4. `selectionAudit`：weightedFactors 六项齐；evidenceStrength/reproducibility 若仍是 "unknown" 而该篇已发布 → 警告（回填漏了）。
5. **禁止串全库扫描**：不得含 `not specified in fetched text`、不得含 `Not higher because the collected evidence`、不得含已删模块的残留键（verdict/scorecard/fdeTakeaways/claimLedger/evidenceMatrix/artifactAudit）。
6. 删掉 v1 里所有针对已删字段的校验函数。

---

## 8. 单测（`papers-analyze.test.mjs` 等，不调用 LLM）

1. originalReading 忠实 lint：喂含评价词的构造 payload → 被拦/被标。
2. keyResults 上限：>5 个 → 截断到 5。
3. analystNotes 必填。
4. sourceLayer：discoverySource=Papers with Code 不得等于 primaryEvidenceSource。
5. selectionAudit 回填：深析后 evidenceStrength/reproducibility 不再是 unknown。
6. 选题权重：学术 fixture > 工程 fixture。
7. token：`maxTokens('deep') >= 12000`。
8. 禁止串：输出不含 §7.5 列出的任何残留键/坏串。
> fixture 用通用形态，**不得**用真实 title/arxivId 当断言键。

---

## 9. 重新分析（花 DeepSeek 额度）

- `node scripts/run.mjs papers all`（先 `cp public/data/articles.json .backup-pre-rebuild/`）。
- 跑完 `npm run validate` 全绿。
- 默认产 1–3 篇精品（cap 小）。
- 三篇样本作回归 fixture（单测层），**不强求**真实重跑抓到它们。

---

## 10. 交接给 Claude（前端，本规格不含）

Codex 交付：改了哪些文件 / 新 schema / 删了哪些块 / 新 lint / 新单测 / `npm run validate` 与 `node --test` 结果 / 重跑产出的 1–3 篇摘要。

Claude 接前端（只动 `src/pages/Articles.tsx` + `src/styles.css`）：
- 详情页改两段式：第一段 originalReading（顺 section、翻译总结、keyResults 罗列）→ 视觉分隔「以下是 AI 分析，非原文」→ 第二段 analystNotes（自由行文）。
- 删掉旧 VerdictBar / ClaimLedger / EvidenceMatrix / ArtifactPanel / Falsification / FdeMemo / Scorecard 等组件与 fallback。
- 列表卡片：删「N 个版块」「读不读」徽章；venue 显示「Venue: not verified」不全大写；保留 paperType / 汇聚来源等学术信号 badge。
- 语义色克制、`npm run dev` 截图给 Kevin 验收。

---

## 11. 质量底线（验收）

- 详情页两段物理隔离；第一段忠实无评价、第二段才有判断。
- keyResults ≤5、有 ref + finding，数字来自原文。
- 无评分、无 verdict、无 FDE 任何残留。
- discoverySource ≠ evidence source。
- 无禁止串（`not specified in fetched text` / 重复英文模板 / 已删模块键）。
- 选题偏学术信誉，cap/阈值可配置、不到不发。
- 全程禁止 title/arxivId/author 特判；改动只限学术论文栏目。
