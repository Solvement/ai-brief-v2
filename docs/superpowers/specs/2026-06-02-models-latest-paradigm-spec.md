# Models 栏目重构 — 最新版本范式 + 云端两段式刷新 (2026-06-02)

Kevin 拍板(2026-06-02):
- **只做每个模型家族的最新版本**;老版本不做(放弃多版本家谱)。
- **开源 = 深分析**(为什么往这个方向优化 / 解决了什么 / 怎么解决);**闭源 = changelog 翻译**。
- **分析质量先行,视觉最后**。
- **刷新按钮:云端(线上也能点)+ 两段式**(便宜查版本 / 按需花 LLM 做分析)。
- 部署平台:**Vercel**。

铁律(沿用):中文分析 [[analysis-language-chinese]];大白话两层 [[analysis-style-plain-language]];**一手核验,绝不编造**(benchmark 数字尤其);闭源**不写机制断言**(无法核实)。

---

## 1. 数据结构(每个模型一条,只留最新版本)

```jsonc
{
  "generatedAt": "ISO",
  "models": [
    {
      "id": "qwen3", "name": "Qwen3", "vendor": "Alibaba", "country": "中国",
      "kind": "open",                       // "open" | "closed"

      // ── 现状卡(stage-1 便宜刷新更新;无 LLM)──
      "latestVersion": "Qwen3-235B-A22B",
      "latestReleasedAt": "ISO",
      "isOpen": true, "license": "Apache-2.0",
      "hasEvalData": true, "evalSources": ["LMArena", "OpenLLM Leaderboard"],
      "hasChangelog": true, "changelogUrl": "https://...",
      "lastCheckedAt": "ISO",

      // ── 内容(stage-2 按需,LLM)──
      "analysis": {                         // 仅 open
        "oneLineTakeaway": "",
        "problemSolved": "",
        "whyThisDirection": "",            // 核心:为什么是这个方向(架构/训练/数据取舍动机)
        "howSolved": "",                   // 机制,大白话+术语
        "benchmark": { "headline":"", "professorNote":"", "charts":[], "items":[], "caveats":[] },
        "limitations": "",
        "transferValue": "",               // 对 AI-eng / BriefMem / 学习 agent 的迁移价值
        "sources": [{ "name":"", "url":"" }]
      },
      "changelog": {                        // 仅 closed
        "oneLineTakeaway": "",
        "translatedNotes": "",            // 官方 release notes → 中文
        "capabilityDeltas": [],           // 可观测、可测任务的能力变化(不臆测机制)
        "sources": [{ "name":"", "url":"" }]
      },
      "analysisGeneratedAt": "ISO"
    }
  ]
}
```

- **benchmark.charts/items 每项带 `sourceType: official | third-party | derived`**,复用现有 `Models.tsx` 的 BenchmarkChart/lens 组件。
- 现状卡四字段 = Kevin 的"与时俱进"层:`最新版本 / 开源? / 有测评? / 有changelog?`。

> **读者画像(定盘,见 [[user-goal-applied-ai-builder]]):** 所有分析写给一个**要做 AI PM / FDE / AI 应用开发、平时 vibe coding 的人**。主轴永远是『**对我做 AI 应用有什么用 / 能做什么以前做不了的 / 要不要用 / 怎么用**』。**不挖内部机制/数学原理**(Kevin 2026-06-02 明确『不要这么深度』,试过看不懂)。术语只解释理解好处所必需的那一点,生活化到零 ML 基础也懂。

## 2. 开源模型骨架(应用视角)
金标准实样见 `docs/superpowers/specs/2026-06-02-models-gold-deepseek-v4-pro.json`。
1. **oneLineTakeaway** — 一句话:这次对做 AI 应用的你意味着什么。
2. **whatItUnlocks[]** — 核心。每条 `{point, forYou(对你能做什么新东西/什么好处), evidence(来源), confidence}`;厂商自夸标 low + 待第三方核实。
3. **benchmark** — 保留 charts/items/caveats(source-typed,数字一手核验),但 professorNote 用『这是它到底强不强的证据』的应用口吻,别讲原理。
4. **openSourceMeaning** — 开源对你 = 可自部署/微调/控成本控数据/不锁定 + 代价。
5. **whenToUse** — 要不要用、什么场景用、怎么起步(先 API 还是自部署)。
6. **cost_caveats** — 实际代价(硬件门槛、得走 API、招牌分待核实)。
7. **sources** — 每条结论可追溯。

## 3. 闭源模型骨架(应用视角 = changelog 但讲『怎么用/何时用』)
不挖机制(也无法核实),但**不止翻译**——逐个新特性讲清楚怎么在你工作里用上。
1. **oneLineTakeaway** — 这次更新对做 AI 应用/vibe coding 的你带来什么。
2. **newFeatures[]** — 核心。每条 `{feature, whatItIs(是什么), forYou(对你有什么用), howToUse(怎么用), whenToUse(什么时候用)}`。
   - 例(Kevin 给的):Opus 4.8 → ① 100 万 token 上下文:能把整个代码库/长文档喂进去,怎么喂、什么时候值得喂;② `/workflow` 命令:这命令是什么、怎么用、什么场景下用它而不是普通对话。
3. **limitations / 注意** — 限额、价格、edge。
4. **sources** — changelog 官方链接。

> **硬约束(Kevin 2026-06-02):** 模型更新的新功能**来源必须是官方公布的 changelog / release notes**(厂商一手),不是我推测、不是第三方转述。`newFeatures[]` 每条都要能指回官方 changelog 的具体条目;官方没写的功能不收录。信任源(机器之心/Datawhale)只用于『发现有新版本』,不作为功能事实来源。开源模型同理:功能/规格以官方 model card + 技术报告为准。

## 4. 两段式刷新
- **stage-1 查版本(便宜,无 LLM,可放开):** 抓 HuggingFace API(开源:最新模型/日期/license/下载量)+ 厂商 release-notes/模型页(闭源:最新命名发布)+ leaderboard 是否在榜 → 更新现状卡 + `lastCheckedAt`。
- **stage-2 生成分析(LLM,token 闸):** 对指定模型,用抓到的源生成开源 analysis 或闭源 changelog 翻译。

## 5. 数据源
- **开源:** HuggingFace API + arXiv/GitHub(why/how)+ leaderboard(LMArena / OpenLLM)。高度可自动化,与 paper/project 同形。
- **闭源:** 功能事实**必须来自厂商官方 changelog / release-notes**(一手,强制);信任源(机器之心 / Datawhale)只用于发现新版本、不作功能来源。**只收命名发布,不穷举日期快照。**

## 6. 架构(Vercel)
- 静态 SPA 通过 `GET /api/models`(读 Vercel KV;KV 空则回退 build 时的 seed JSON)拿数据。
- `POST /api/models/refresh` — stage-1,便宜,更新 KV 现状卡。
- `POST /api/models/analyze` `{id, token}` — stage-2,LLM,**token 闸**(`REFRESH_TOKEN`),写回 KV。
- KV 存 models 数据;`brief`/build 提供初始 seed。
- env(Vercel 环境变量):`DEEPSEEK_API_KEY`、`HF_TOKEN`(可选)、`REFRESH_TOKEN`、leaderboard 无需 key。
- 端点防滥用:查版本可匿名(便宜);analyze 必须带 token(花钱)。

## 7. 分工(沿用 [[execution-division-of-labor]])
- **Claude(架构/前端):** 本范式;开源金标准(/browse 核实当下真实最新版本,确保 currency + grounding);`Models.tsx` 重写(现状卡网格 + 最新版详情 + 刷新按钮 UI);review / verify / commit。
- **Codex(后端):** 新 schema + `validate-models.mjs` 重写;stage-1 查版本模块;stage-2 生成器(开源 analysis prompt + 闭源 changelog prompt);Vercel `/api` 函数 + `vercel.json` + KV 适配;`types.ts`。

## 8. 阶段
- **P1 范式 + 开源金标准(Claude)** ← 现在(含 /browse 核当下版本)
- **P2 后端:schema+validator+两段式逻辑(Codex)**
- **P3 serverless + vercel.json + KV(Codex)**
- **P4 前端重写 + 刷新按钮(Claude)**
- **P5 部署(Kevin 在 Vercel 接 GitHub + 填环境变量)+ 跑 6.2 全量更新**

关联:[[brief-column-deepdive-model]](open=detailed/closed=changelog 的来源)、[[north-star-learning-agent]](models 入不入 brief-wiki 待定:当前先用专用 models 数据 + KV,L0 统一性问题留到范式跑顺后再评估)、[[selection-prestige-gate]]。
