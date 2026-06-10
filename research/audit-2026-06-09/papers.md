# 文章(papers)栏 三病类全链审计 — 2026-06-09

审计对象:`scripts/columns/papers/**`、`docs/paradigms/papers.md`(canonical)、`docs/superpowers/specs/daily-deepread-prompt.md`(运行壳)、KG-2 §3.1。
约束:管线后台运行中,未触碰 `public/data/* · content/* · data/*`;只改脚本/范式 prompt;验证用 `node --check` + 单测,未跑 daily/deepread/cold-audit。

## 0. 先搞清「哪条 prompt 是 live 的」(关键前提)
papers 栏有 **两条互不相干的分析链**,审计前必须分清,否则会修错地方:

- **A 链(legacy kernel,基本死代码)**:`daily.mjs --legacy-kernel` → `analyze.mjs` + `prompts.mjs`(DeepSeek 两段式 originalReading/analystNotes)。默认**不走**(`daily.mjs:24-26` 默认调 `runCodexDeepDiveDaily`)。产物 `public/data/articles.json`,但前端实际从 `papers-index.json` 渲染(`build-index.mjs`)。
- **B 链(live,人读深读)**:`boot-daily.ps1` → `npm run papers:deepread`(`claude -p` 读 **`docs/superpowers/specs/daily-deepread-prompt.md`**)→ 写 `content/papers/*` 三栏 MDX + `data/autosci/primitives/*.yaml` → `npm run papers:cold-audit`(`cold-audit/seams.mjs` 的 codex 作者 + Claude 两段式冷审)→ `build-index.mjs` 据 `cold_audit.status` 过门。**这才是 Kevin 在站上读到的深读。**
- `codex-deepdive.mjs`(`daily.mjs` 默认路径)产 articles.json,是介于两者间的第三套内嵌 prompt,前端不渲染但每天仍跑。

→ **范式实际有 3 份内嵌副本**(B 链的 spec、cold-audit codex 作者 prompt、codex-deepdive.mjs),**没有任何一份读 canonical `docs/paradigms/papers.md`**(grep 全 scripts/ 零命中)。这就是病①的根。

---

## 病① 范式↔prompt 漂移(重点)

### 证据
- **canonical 无人引用**:`docs/paradigms/papers.md` 是 SPEC/CLAUDE.md 钦定的「唯一真相」,含 #14「解法是怎么找到的(选读)」(今天新增)、`> [!key] 立场`、`## 技术细节(选读)`、`## 后续演化`、密度分区、脚注制、防张冠李戴、解法发现不准反推。**`grep paradigms/papers` 在 scripts/ 全仓零命中**——live 链从不读它。
- **B 链 spec 漂移**(`docs/superpowers/specs/daily-deepread-prompt.md:13`,改前):paper.mdx 章节只列「一句话/问题/关键术语/核心方法/架构/创新点/实验/限制/先读什么」——**缺**立场段、技术细节(选读)、解法是怎么找到的、后续演化、防张冠李戴、脚注制、密度分区。且让作者「完全仿照样板」(病①的放大器,见下)。
- **样板自身落后于范式**(`content/papers/2606.02060-drift-agent-error-localization/paper.mdx` 实测 headings):有「后续演化」,但**无**「技术细节(选读)」「解法是怎么找到的」「> [!key] 立场」「> [!warn] 别被带偏」。#14 是 2026-06-09 加的,晚于该样板 → 「照抄样板」会把 pre-#14 结构永久复制下去。
- **autosci 原语缺 discovery_trace**(`data/autosci/primitives/2606.02060.yaml` grep:只有 `core_pattern`,无 `discovery_trace` / `core_concepts`)。KG-2 §3.1(本计划 line 55)说范式要给 discovery_trace 供料喂 L3 方法论池,但 spec 第 16 行写 autosci 文件时**从没要求输出 discovery_trace**。→ Mind Palace 的「问题/怎么找到解法/方法」三元组(Kevin 2026-06-09 划重点的外脑核心)拿不到新料。
- **cold-audit 作者 prompt 漂移**(`cold-audit/seams.mjs:122,135`,改前):`paradigmSpec` 默认只指 `daily-deepread-prompt.md`,不指 canonical;且「完全仿照样板 ${goldSampleDir}」。
- **cold-audit Stage B 5 条 rubric 不查新规则**(`seams.mjs:280-285`,改前):retellable/faithful/mechanism/concrete/judgment 五条**没有**「解法发现是否反推 abstract」「后续演化置信度/可解析」「张冠李戴」——即使作者编了动机链或错安首创权,冷审门也放过。

### 已修(根治优先:让壳读 canonical,而非再同步一份会再漂的副本)
1. `docs/superpowers/specs/daily-deepread-prompt.md`
   - 顶部加「范式唯一真相」段:**动手前先读 `docs/paradigms/papers.md`,冲突以它为准**,本文件只是运行壳。
   - paper.mdx 写文件步骤补全章节(立场段 / 技术细节(选读) / 解法是怎么找到的(选读,带「原文没写就整节缺省、禁反推」硬规则) / 后续演化(带置信度+ID 可解析));明确「结构以范式为准而非照抄样板(样板早于 #14)」。
   - autosci 原语步骤补 `core_concepts`(规范名+源文逐字 evidence,先读 concept-vocab.json)+ `discovery_trace`(可空,非空带 source_span,综述/benchmark 填「数据不足」,禁反推)。
   - 质量铁律补:防张冠李戴 / 解法发现不准反推 / 后续演化要独立核实 / 来源走脚注不行内。
2. `scripts/columns/papers/cold-audit/seams.mjs`
   - `buildPrompt`(codex 作者)加 `canonicalParadigm = "docs/paradigms/papers.md"` 并写进铁律(canonical 为准,样板不照抄章节集合)。
   - Stage B `faithful` 准则下增 3 类范式漂移幻觉硬查:(a)解法发现反推 (b)后续演化未核实/ID 不可解析 (c)张冠李戴 → 任一坐实判 faithful=major。**刻意不加第 6 个 criterion**,折进 faithful,保持 perCriterion schema 稳定(orchestrator validator 不破)。
   - `node --check` 通过;`seams.test.mjs` 12/12 通过(修了一个 template-literal 内反引号闭合的语法 bug)。

### 建议未动(为什么)
- **codex-deepdive.mjs 的内嵌范式**(产 articles.json):前端不渲染它,改它收益低、风险碰 articles.json 生成。建议要么也让它 defer canonical,要么干脆退役该路径(范式级,Kevin 拍)。
- **canonical papers.md 本体**:它已是对的(有 #14 等),不动;只让漂移的副本回指它。
- **样板 drift**:`drift-agent` 样板缺新节,但补样板=改 content/(禁区,且管线在跑)。已用「结构以范式为准」绕开依赖样板;后续可单独回填样板。

---

## 病② 单源 / 筛选盲区(来源不改,只报告+给改法)

### 发现
1. **upvotes 抓取时机偏低(真实风险,但有缓冲)**:`hf-source.mjs:34` daily 窗口用 `--date today`。boot 09:00 抓「今天」HF 日榜,当天票数尚未累积 → 当天最强论文票数低、可能落选。**缓冲**:`fetchAllWindows` 同时抓 weekly/monthly(过去 7 天/本月,票数已成熟),`select.mjs:128` 的 eligible 从 **merged 全集**取(`upvotes>=20 && !done`),不只取 daily。所以漏的是「今天首发且当天就该深读」的论文;次日它进 weekly 窗票数成熟仍会被捞回(只要还没 done)。**改法**:daily 窗额外抓 `--date yesterday` 并入 merged(昨天的论文票数已沉淀一夜),或把 daily 排序权重下调、以 weekly 为主轴。**时区坑**:`isoWeek/isoMonth` 用本地 `getFullYear` 但 `--date today` 由 hf CLI 按 UTC 解析,北京时区 09:00 = UTC 01:00 仍是同日,影响小,但建议显式传 `--date <本地 YYYY-MM-DD>`。
2. **高赞阈值是写死绝对值**(`select.mjs:35` `DEFAULT_MIN_UPVOTES = 20`):非相对值。若某日全站普遍低赞(节假日/小众日),20 的硬门会让当日全空——符合「不硬凑」精神,但「20」会随 HF 体量漂移(像旧家族名一样过时)。**改法(范式级,先不动)**:改成相对门(如当日 merged 票数的 P75,或「至少 N 篇」兜底取 top-N)。按指令阈值类先不动,留 Kevin 拍。
3. **ledger 去重主键假设**(`ledger.mjs:25`):`arxiv_id` 优先,fallback `normalized_title::hf_url`。HF 的 `paper.id` 即 arxiv base id,稳。**潜在盲区**:同一工作的 v1/v2(arxiv 版本号)——`baseArxivId` 在别处剥版本号,但 ledger 存的是 hf 给的 id(通常无版本号),一致;低风险。`normalizeTitle`(`ledger.mjs:16`)用 `[^a-z0-9一-鿿]` 保留中日韩,稳。
4. **DeepSeek 评分静默降级**(`select.mjs:109-112`):无 `DEEPSEEK_API_KEY` 直接 return(不选深读)。这不是漏论文,但若 key 失效,深读候选当天为空且只在 stdout warn——与 6-07/08 静默失败同类。已有 `check-deepread-coverage.mjs` 兜底(对账 selection vs 产出),覆盖此情形。
5. **agent-only 门会吞非 agent 高赞**(见病③):`curate.mjs:66-72` 把 `agent_relevant:false` 沉底,`select.mjs` 取 top-by-upvotes 的 eligible 里 agent 论文优先——一篇高赞但关键词未命中的 agent 论文(或金样级非 agent)可能被关键词表漏判而沉底。属病③范畴。

### 已修 / 未动
- 全部**只报告**(来源是 Kevin 决策、阈值是范式级)。最高优先建议:**daily 窗补抓 yesterday**(纯代码、非阈值、直接缓解「当天票数未熟」),可下一轮落地。

---

## 病③ 旧规律当定义(硬编码名单/词表会不会像 Opus|Sonnet|Haiku 过时)

### 发现(全部 `agent-filter.mjs` + 评分 prompt)
1. **`AGENT_TERMS` / `PRIORITY_TERMS` 硬编码关键词表**(`agent-filter.mjs:9-27`):papers 栏是 agent-only,**这张表就是「什么算 agent」的定义**。这正是与 Fable 5 同型的病——把当下的家族名/术语固化成正则:
   - 缺新近术语:`world model agent`、`o1/o3-style reasoning`、`agentic RL`、`long-horizon agent`、`computer-using agent (CUA)`、`deep agent`、`subagent`、`agent harness`(本项目自己天天用 harness 却不在表里!)、`workflow engine`、`tool learning`。
   - 命中靠子串 `text.includes(t)`:`"react "` 带尾空格防 "reaction",但 `"planner"` 会误命中 "explainer"? 否(子串),但 `"trajectory"` 会命中任何轨迹类非 agent 论文(假阳)。
   - 风险方向:**漏判**(新范式 agent 论文关键词不在表 → 沉底 → 高赞也不深读)比 codex-deepdive 的旧正则更隐蔽,因为它静默沉底不报错。
   - **改法**:① 关键词表外加一个**语义兜底**——高赞(如 ≥P90)但关键词未命中的论文,送 `select.mjs` 已有的 DeepSeek 评分层判 `category=agent?`,命中则提回候选(让便宜层 LLM 当「定义」的活体补充,而非死词表);② 词表立即补上面缺的近义词。
2. **`analyze.mjs:520-531` `venuePrestigeScore` 硬编码声望名单**:`OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA`、`机器之心|Datawhale`、会议名 `ICLR|ICML|NeurIPS|...`。这是「旧规律当定义」的教科书案例——名单会过时(新实验室、新会议、改名的厂商如 FAIR↔Meta)。但此文件在 **legacy A 链**(基本死代码),live 链不用,**优先级低**。`normalizeVenueStatus:480` 同样硬编码会议白名单。**改法(若 A 链复活才需)**:声望从外部可维护 JSON 读,而非源码常量。
3. **`select.mjs:55` category 词表**(`agent/rag/training/...`):是 DeepSeek 自由打的标签,非硬正则,自适应,**不算病**。

### 已修 / 未动
- **未动**(全部范式/词表级,且最该改的 agent-filter 关系到「papers 栏收谁」的产品方向,应 Kevin 拍是否上语义兜底)。**强烈建议**:agent-filter 加 DeepSeek 语义兜底(把「定义」从死词表改成活体判断),这是与 Fable 5 同根病、且 live 链每天在用、且会静默漏好论文——最该优先修的病③点。

---

## 明天(6-10)跑完怎么验证(产品级)

> 6-10 boot 跑 `papers:deepread`(读改后的 spec)→ cold-audit → build-index。看站上 `/papers` 当天新深读篇:

1. **病① 修好的标志**:新深读的 `paper.mdx` 出现**之前没有的章节**——`> [!key] 立场`、`## 技术细节(选读)`(两段式+防张冠李戴提醒)、`## 后续演化`(每条带「置信度:高/中/低」)。**关键判别**:若当天深读的是**方法/系统类且原文真有解法摸索**(如某 agent 论文讲「先试 X 失败→改 Y」),应出现 `## 解法是怎么找到的(选读)`;若当天是**综述/benchmark 类**,该节应**整节缺席**(不许硬凑)——两种都对,出现「从 abstract 编的动机链」才是没修好。
2. **autosci 供料**:当天 `data/autosci/primitives/<id>.yaml` 应含 `core_concepts`(带源文逐字 evidence)与 `discovery_trace`(方法类带 source_span;综述类=「数据不足」)。→ Mind Palace 的 discovery_trace 池开始进新料。
3. **冷审门更严的标志**:看 `logs/papers-cold-audit/digest-2026-06-10.md` —— 若某篇编了解法发现/后续演化 ID 不可解析/张冠李戴,Stage B 现在应给 `faithful=major` 并 HOLD(`build-index` 排除、不发布)。即「带病不入库」对新增的 3 类幻觉也生效。
4. **病②(若顺手落 daily 补抓)**:`papers-index.json` 的 board.daily 当天票数不再系统性低于 weekly 头部(目前未改,作为对照基线)。
5. **回归**:`/papers` 既有深读、board、radar 照常渲染(我只改 prompt 文本 + 冷审 rubric,未改数据 schema/前端;`seams.test.mjs` 12/12 已证 builder 未破)。

## 修过的文件清单
1. `docs/superpowers/specs/daily-deepread-prompt.md` — 让 live 深读壳 defer canonical 范式 + 补全缺失章节/规则/autosci 字段(病①根治)。非 .mjs,无 node --check;改的是 `claude -p` 读的纯文本 prompt。
2. `scripts/columns/papers/cold-audit/seams.mjs` — codex 作者 prompt 指向 canonical;Stage B faithful 准则增 3 类范式漂移幻觉硬查(病①冷审侧补门)。`node --check` ✓;`seams.test.mjs` 12/12 ✓。
