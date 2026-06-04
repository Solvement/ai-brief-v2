# Codex 工单 · 新闻富化(3A):中文化 + og:image + 轻策展

**作者** Claude(路由) · **执行** Codex · **分支** feat/nextjs-migration · **日期** 2026-06-04
**背景** 新闻栏目前英文标题、行式、无图、`summary` 多为空。Kevin 要:中文卡片(一句话讲清发生了什么,**不做内部分析**)、更偏 AI/更有趣的选题、图文好看。前端(3B)由 Claude 做"头条大图+中文行";本工单只做**后端富化**(便宜层 DeepSeek)。

## 现状
- `scripts/columns/news/sources.mjs`:聚合 RSS(OpenAI/TechCrunch/VentureBeat/Verge)+ HTML(Anthropic/DeepMind/Meta/Mistral/DeepSeek/Qwen/xAI)+ Hacker News API + Reddit。已有 `dedupeNewsItems` / `capItemsByDay` / `isAiRelated`。
- `scripts/columns/news/daily.mjs`:产出 `public/data/news.json`(items: title/source/sourceType/url/publishedAt/points/summary)。
- DeepSeek 客户端 `scripts/lib/llm.mjs`(`createDeepSeekClient().chatJson()`,model deepseek-v4-flash)。key 在 `.env.local`(脚本用 `node --env-file=.env.local`)。

## 要做(在 news/daily.mjs，必要时 sources.mjs)
1. **中文化**:每条产出 `titleZh`(中译,**保留专有名词/产品名**,如 GPT-5、Claude、DeepSeek)+ `summaryZh`(一句话讲清发生了什么)。批量调 DeepSeek(每批 ~6-8 条,`maxTokens` 留够防截断)。
   - **无中生有红线**:`summaryZh` 只能基于已有 `title`+`summary`;**无正文时如实复述标题、不脑补事实**;信息不足留空。这条写进 system prompt 并在产物上可校验(summaryZh 非空 ⇒ 必有原始 title)。
2. **og:image 抽取**:对**当日 top 候选(如前 8-12 条,控成本)**抓文章页 `<meta property="og:image">` / `twitter:image`,写 `imageUrl`;取不到留空(前端兜底,不显示破图)。只对头条候选抓,不要对全部抓。
3. **轻策展**:在现有 AI 关键词过滤上,偏好"更 AI / 更有趣"(官方发布、HN/Reddit 高热、有梗的 AI 故事);**按日 cap ~20-24**(用 `capItemsByDay`);去重沿用 `dedupeNewsItems`。
4. **数据契约**:`news.json` items **新增** `titleZh` / `summaryZh` / `imageUrl`(**向后兼容**,旧字段保留)。
5. **offline/no-LLM**:`AI_BRIEF_OFFLINE`/`NO_LLM` 时跳过富化(只聚合),不报错。

## 验收
- `news.json` 中 ≥90% 条目有 `titleZh`、≥80% 有 `summaryZh`(中文,含汉字);当日 top 若干条有 `imageUrl`。
- 无"无源 summaryZh"(summaryZh 非空但 title 空 = 0)。
- 每日条数 ≤24。
- `scripts/eval-redesign.mjs` 的新闻三项(zh-title / zh-summary / no-image)转绿。
- `npm run lint && npm run validate` 全绿;产出 diff,Claude review 后合。

## 不要做
- 不写"内部分析/解读"(新闻只一句话讲清事件)。
- 不抓全部条目的 og:image(成本)。不引入新依赖做 HTML 解析,用现有 fetch + 正则取 meta 即可。
