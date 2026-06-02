# 部署 + 每日自动更新指南(Next.js + Vercel + GitHub Actions)

> 给 Kevin 的"接账号"清单。代码侧已就绪;下面三步是只有你的账号能做的。

## 架构一句话
- **网站** = Next.js,部署在 **Vercel**(它自动识别 Next,免费档够用)。
- **每日更新** = GitHub Actions 定时任务(每天 16:00 UTC)跑 `npm run daily`(四栏"先检查、有新才生成"),有数据变化就 commit+push → **Vercel 收到 push 自动重新部署**。
- **不实时**:有些天没有新东西就不更新,但每天都会检查(符合你的要求)。

---

## 第 1 步:Vercel 部署网站(约 5 分钟)
1. 打开 https://vercel.com → 用 GitHub 登录。
2. **Add New… → Project** → 选仓库 `Solvement/ai-brief-v2` → Import。
3. Framework 它会自动识别为 **Next.js**(无需改 build 命令)。
4. 展开 **Environment Variables**,加这几个(值你自己填):
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek key(API 路由生成分析用)
   - `REFRESH_TOKEN` = 你自定义的一串密码(保护"花钱生成"的接口不被乱点)
   - `HF_TOKEN` = (可选)HuggingFace token,查开源模型版本更稳
5. **Deploy**。完成后给你一个 `xxx.vercel.app` 网址,这就是上线的站。

> 注意:当前代码在分支 `feat/nextjs-migration`。要正式上线,先把这个分支合并到 `main`(或在 Vercel 里把部署分支设成它)。建议你先在分支上 review,满意了我帮你合 main。

## 第 2 步:GitHub Secrets(让每日 cron 能跑,约 2 分钟)
GitHub 仓库 → **Settings → Secrets and variables → Actions → New repository secret**,加:
- `DEEPSEEK_API_KEY` = 同上
- `HF_TOKEN` = (可选)同上

(`GITHUB_TOKEN` 是 Actions 自带的,不用加。)

## 第 3 步:开启每日任务
- 工作流文件已就位:`.github/workflows/daily.yml`(每天 16:00 UTC + 可手动触发)。
- 合并到默认分支后它会自动按时跑。想立刻试:GitHub → **Actions → Daily → Run workflow**(手动触发一次),看它能否跑通 + 提交数据 + 触发 Vercel 重新部署。

---

## 跑起来之后的"日常"是什么样
- 每天 cron 自动:检查 arXiv/GitHub/HF/各厂 changelog 有没有新东西 → 有就生成深读/更新 → commit → Vercel 自动上线。
- 你**啥都不用做**;偶尔想手动刷新某栏,GitHub Actions 点一下 Run workflow 即可。
- 网站上的"刷新"按钮(模型栏):点了走 `/api/models/refresh`(便宜的查版本);"重新生成分析"走 `/api/models/analyze`(要带 `REFRESH_TOKEN`,防止别人乱点烧钱)。

## 还没做(可选增强)
- **Vercel KV 持久化**:线上点"刷新"目前是即时返回,不落库(落库交给每日 cron)。要做到"线上点一下就永久更新",需要接 Vercel KV——以后想要再加。
- 真实"每日"节奏靠 cron;够用。
