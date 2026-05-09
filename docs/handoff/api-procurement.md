# API 获取清单（Kevin 操作）

这份文档列出 AI-brief 从 demo 走向真实评估产品所需的全部 API 接入点，按 **必须 / 应该 / 可选** 三级分组。每一项写明：注册入口、需要的 scope、价格估算、`.env` 字段名、安全注意。

把 P0 三件事拿到，Codex 就可以开始 Phase 1。其余项目按 Phase 推进时再申请。

---

## P0｜必须先拿（决定 Phase 1 能不能开工）

### 1. LLM API — 主用 + 备用各一个

产品的"AI 评估"承诺直接依赖这一项。建议主用一个国产 + 备一个海外，原因：成本、合规、对照质量。

#### 1A. DeepSeek（推荐主用）

- **注册地址**：<https://platform.deepseek.com>
- **需要做的**：手机号注册 → 实名 → 充值（10 元起，足够跑数千次评估）→ 「API Keys」生成 key
- **价格**：deepseek-chat 输入约 ¥1 / 百万 tokens，输出约 ¥2 / 百万 tokens（截至 2025 中后期；以平台公布为准）
- **每条评估成本估算**：输入 2000 tokens + 输出 800 tokens ≈ ¥0.0036 / 条；每天 50 条 ≈ ¥5.4 / 月
- **`.env` 字段**：
  - `DEEPSEEK_API_KEY=sk-...`
  - `DEEPSEEK_BASE_URL=https://api.deepseek.com`
- **能力适配**：中文判断、JSON 输出、function calling 都过关；推荐 `deepseek-chat` 做评估，`deepseek-reasoner` 做 paper 类深度解读

#### 1B. Anthropic Claude（推荐备用 + 质量对照）

- **注册地址**：<https://console.anthropic.com>
- **需要做的**：邮箱注册 → 验证 → Billing 加信用卡（首充 5 USD 起，海外卡）→ 「API Keys」→ Create Key
- **价格**：Claude Haiku 4.5 输入约 1 USD / 百万 tokens，输出约 5 USD / 百万 tokens；Sonnet 4.6 是 3/15
- **每条评估成本估算**（Haiku）：约 0.005 USD / 条
- **`.env` 字段**：
  - `ANTHROPIC_API_KEY=sk-ant-...`
- **用法**：作为 fallback；同时定期用 Sonnet 跑 5% 抽样做质量校验（详见 codex-next-tasks Phase 1 §校准）

#### 备选：OpenAI / 通义千问 / 智谱

只有在 DeepSeek + Anthropic 都不可用时才考虑。三者都能用，但接入价值边际递减。如果你用过 OpenAI 习惯了 SDK，可以把它代替 Anthropic 作为备用——`OPENAI_API_KEY`, `OPENAI_BASE_URL=https://api.openai.com/v1`。

#### 安全约束（适用所有 LLM key）

- key 只在服务端使用，**绝对不能** 出现在前端 bundle、git 仓库、issue、Slack 截图
- `.env` 必须在 `.gitignore` 里（先 `cat .gitignore` 确认）
- 每个 key 单独账号，便于按用量分账和事故时回收
- 限制每月预算（DeepSeek 平台支持，Anthropic 在 Billing → Usage limits）：建议先设 50 USD / 200 元上限

---

## P1｜Phase 2 / 3 开始前要拿

### 2. GitHub Personal Access Token

用于客观抓 tool / project 类内容的 star、commit、release、贡献者活跃度。比让 LLM 猜准得多，且免费。

- **注册地址**：<https://github.com/settings/tokens>（推荐用 Fine-grained tokens，不是 classic）
- **需要做的**：Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- **Scope**：只勾 `Public repositories (read-only)`，**不要** 勾 repo write、user、admin。AI-brief 只读公开 repo 的 metadata。
- **过期时间**：建议 90 天，到期前 GitHub 会邮件提醒，旧 token 失效前生成新的覆盖即可
- **限额**：authenticated 5000 requests / hour，足够每天扫几千个 repo 一次
- **`.env` 字段**：
  - `GITHUB_TOKEN=github_pat_...`

### 3. Embedding API（去重 + 事件聚合 + 相关推荐）

不是必须现在拿，Phase 3 开始前再申请。两条路：

- **走 OpenAI**：复用 OpenAI key，`text-embedding-3-small`，0.02 USD / 百万 tokens，便宜得离谱。每天 50 条内容嵌入一次约 0.001 USD / 月。
- **走自部署 BGE-M3**：硅基流动 / 阿里云百炼 / 自己用 Ollama 跑都行。优点是数据不出境；缺点是初期运维负担。MVP 阶段不推荐。

`.env` 字段：
- `EMBEDDING_PROVIDER=openai`（or `siliconflow`）
- `EMBEDDING_API_KEY=sk-...`
- `EMBEDDING_MODEL=text-embedding-3-small`

---

## P2｜可选，看产品方向决定

### 4. Hacker News（无需 key）

- **接口**：<https://hn.algolia.com/api>（Algolia 提供的 HN 镜像，免费、不限流、有全文搜索）
- 直接 fetch，不用注册
- 用法：每小时拉 `?tags=story&query=AI&numericFilters=points>50` 抓高 score AI 故事

### 5. RSS 源——不需要 API，列入这里只是提醒维护

把这些写到 `src/lib/ingestion/sources.ts`（Phase 2 会创建），全部 RSS / Atom 抓：

- **官方层（reliability 5）**：openai.com/blog/rss、anthropic.com/news/rss、blog.google/products/google-deepmind/rss、mistral.ai/news/rss、deepseek.com 公告页（找官方 feed 或退化为 HTML scrape）、qwenlm.github.io/feed.xml、bigmodel.cn 智谱公告
- **媒体层（reliability 3-4）**：jiqizhixin.com/rss、qbitai.com/feed、stratechery.com/feed、theinformation.com/feeds（部分付费）、huggingface.co/papers RSS
- **社区层（reliability 2-3）**：hnrss.org/frontpage（已被 P2 #4 覆盖）、reddit.com/r/LocalLLaMA/.rss、reddit.com/r/MachineLearning/.rss

### 6. arXiv API（无需 key）

- **接口**：<http://export.arxiv.org/api/query>
- 用法：每天拉 `cs.AI` / `cs.CL` / `cs.LG` 最新 50 条
- 注意：arXiv 论文不要让普通 LLM 直接打分，走"半自动"——抓 abstract → LLM 抽结构化字段 → 深度解读人工补

### 7. Reddit API（可选，需要 OAuth）

- **注册地址**：<https://www.reddit.com/prefs/apps>
- **类型**：选 "script"
- **`.env` 字段**：`REDDIT_CLIENT_ID`、`REDDIT_CLIENT_SECRET`、`REDDIT_USER_AGENT=ai-brief/0.1`
- 限额：60 requests / minute，足够
- 不接也行，`.rss` 已经覆盖大部分需求

### 8. X / Twitter API（不推荐）

现在 Basic 套餐 100 USD / 月，对 MVP 不划算。先用 RSS 替代信息源（Nitter 实例不稳定，不推荐）；等产品有付费用户再考虑。

---

## P3｜暂缓接入（理由）

- **图像生成 API**（DALL-E、Stable Diffusion、即梦、Recraft 等）：`src/lib/media` 已有 stub，先放着。封面图用现成素材或手动配，比花钱生成更快也更受控。
- **向量数据库**（Pinecone、Weaviate、Qdrant Cloud）：Phase 3 之前先用 SQLite + sqlite-vec 或 lancedb 单文件存，免运维。每天几千条 embedding 完全够。
- **付费搜索 API**（Brave Search、SerpAPI、Tavily）：暂时不需要。如果未来要做"针对一条新闻自动找 3 个补充来源"的功能再加。

---

## `.env.example` 模板（Codex 创建项目时会自动生成；这里是参考）

```env
# === P0：LLM ===
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
ANTHROPIC_API_KEY=

# === P1：客观数据 + 嵌入 ===
GITHUB_TOKEN=
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small

# === 评估器配置 ===
EVALUATOR_PRIMARY_MODEL=deepseek-chat
EVALUATOR_FALLBACK_MODEL=claude-haiku-4-5-20251001
EVALUATOR_MAX_INPUT_TOKENS=4000
EVALUATOR_TIMEOUT_MS=30000
EVALUATOR_MONTHLY_BUDGET_USD=50

# === P2（可选） ===
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=ai-brief/0.1
```

---

## 安全 checklist（拿 key 前 / 后都过一遍）

> ⚠️ 当前仓库的 `.gitignore` **还没有** `.env` 和 `.cache/` 这两条。Phase 1 的 PR 必须把它们加进去（已写进 `codex-next-tasks.md` Phase 1 DoD）。在那之前，**不要** 在仓库目录里放任何 `.env` 文件。

1. `.gitignore` 已包含 `.env`、`.env.local`、`.cache/`（开发本地用 `.env.local`，部署用平台 secrets）
2. 第一次 commit 之前 `git log -p | grep -i 'api[_-]key\|sk-'` 确认没误提交
3. 所有 LLM key 设月度预算上限；超限优先报警而不是断服务
4. Anthropic / DeepSeek 后台开启「Webhook 用量提醒」，超过阈值发邮件
5. 不在 issue、commit message、PR 描述、Slack 截图、README 截图里出现真实 key 片段
6. 如果 key 泄漏：立即在对应平台 Revoke，**不要等明天**——key 被爬取到 commit 后通常几分钟就会被滥用

---

## Changelog

- 2026-05-07：Kevin 收到首版 P0 + P1 清单，开始申请 DeepSeek + Anthropic + GitHub PAT。
