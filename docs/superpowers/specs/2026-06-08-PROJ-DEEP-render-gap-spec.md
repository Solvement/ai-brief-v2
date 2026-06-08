# PROJ-DEEP spec · 项目深读页渲染空洞(数据不足)根治 + 横向对比补强

> Owner: Codex(渲染映射接线) + Claude(范式:横向对比/对从业者意味着 的深度定义,已写在本 spec)。
> Kevin 2026-06-08 决策:项目深读优先修,现在就上。

## 诊断(已查实,按此修,勿重跑全量)
**分析没丢,是渲染没接上。** 强模型深读**确实跑了且内容丰富**(例 `brief-wiki/deep-dives/agentmemory-deep-dive.md` = 203 行:大白话定位 / 技术拆解(代理循环·工具接口·状态记忆·规划器·沙箱·安全边界) / 对我的价值 / 风险 / claim ledger 带 threat·does_not_support / 依赖 bus-factor 风险)。

但**项目深读页**(`TierTemplateDeepDive` 渲染 `tier_template`)读的是另一套键:`comparison / practitioner_meaning / essential_design_difference / how_it_works_with_analogy / pain_point / core_capabilities / maturity_signals`。深读 prompt(`codex-deepdive.mjs:538-562`)产出的是 spine 键:`one_sentence / why_worth_attention / key_claims_evidence / how_it_works / reusable_abstractions / judgment`。两套键不一致 → `brief-writer.mjs` 深路径(~809-814)直接读 `input.comparison` 等(prompt 从不产出)→ 全部回落 `数据不足`。

这是 **COR-3 同类的 key-drift**,但在项目**渲染侧**。14/14 深读项目页都空,就是这一个映射断点造成的。

## 修法(优先做①映射,这是根因;②补横向对比是范式补强)

### ① 映射:把已存在的 spine/deep-dive 内容接进页面渲染字段(codex,主修)
在 `brief-writer.mjs` 构造 deep `tier_template` 时(`normalizeTemplate` 深路径,~800-836),当 `input.comparison` 等为空时,**从已产出的 spine 键映射**(对照已有的 lightSpine→tier3 fallback ~832-836 的写法,但用 deep 输出):
- `how_it_works_with_analogy` ← `input.how_it_works.body_md`(技术拆解+类比已在这里)
- `practitioner_meaning` ← `input.judgment.body_md` 或深读的「对我的价值/value_to_us」段
- `essential_design_difference` ← `input.reusable_abstractions`(copy/skip/why_it_matters,本质取舍)
- `pain_point` ← `input.why_worth_attention.body_md`
- `core_capabilities` ← `input.reusable_abstractions.items[].name`
- `maturity_signals` ← 已有 enrich 的 star/commit/release(保留)
- `comparison` ← 见 ②(prompt 现在没产出独立横向对比,需补)
验收:重新构建索引后,前述 14 个深读项目页的判断字段**不再是 数据不足**,显示真实技术拆解/价值/设计取舍。**不需要重跑深读**——内容已在 `brief-wiki/deep-dives/*.md` + 原始 payload 里;若 trending.json 的 radar.repos 没带 spine 键,从 deep-dive 产物/sqlite run 回填映射即可。

### ② 横向对比补强(范式 = Claude 定;prompt 接线 = codex)
现状:prompt 把对比埋在 `key_claims_evidence`(如「仅与 BM25 对比」),没有独立「和同类的区别」字段,所以页面 `comparison` 永远空。这是项目栏的**核心价值**(CLAUDE.md:`Tier2/3 value = 成熟度判断 + 横向对比`),不能缺。

**范式要求(写进 prompt 的 Tier3 输出契约,Claude 定稿如下):**
- prompt 的 `tier_template` 输出**新增必填** `comparison`(横向对比)字段,要求:
  - 点名 **≥2 个具体同类替代**(命名的竞品/前代/常见做法,如「vs LangChain Memory / vs Mem0 / vs 朴素向量库+手写检索」),不许写「与同类系统」这种空泛词。
  - 每个对比落到**一个真实差异维度**(检索机制/接入方式/可自托管/许可证/成熟度),并说清**对做 AI 应用的我意味着什么取舍**(什么时候选它、什么时候选对手)。
  - 无法核实的对手能力标「自称/未核实」;查不到同类就写「未找到直接可比的同类(说明搜索范围)」,不许编造竞品数字。
- 同时 prompt 的 `how_it_works` / `judgment` / `reusable_abstractions` 段保持现有深度契约(已够),只是确保它们能被 ① 映射到页面字段。
- **不碰** COR-3 刚修的 AutoSci emitter 读的键(`tier_template.reusable_abstractions` 等);若新增 `comparison` 字段,emitter 不需要它,互不影响。

## 验收(产品可见)
- 先在 **1-2 个深读项目**(如 agentmemory、microsoft/markitdown)点对点验证:重建索引后项目深读页判断字段有真实内容 + 出现 ≥2 个点名的横向对比;范式过关再全量重建索引(不重跑深读)。
- 横向对比字段需要新产出的项目:**只对这批深读项目按新 prompt 增量补 `comparison` 段**(可单独一次轻调用补这一字段,不整篇重跑),其余沿用已存在的丰富 spine。
- `npm run build` + `npm run validate` + `npm test` 全绿;前端 `TierTemplateDeepDive` 不再显示 数据不足。

## 禁止
- 不重跑全量深读(内容已在,主修是映射)。不引第三方依赖。不破坏 COR-3 的 AutoSci emitter。不 git add/commit/push(产 diff,Claude review)。
