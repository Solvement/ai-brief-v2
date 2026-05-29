# AI Brief · dev-map（开发导航）

不是百科，是**从哪进门**的索引。谁改地貌谁更新这里。配套：[SPEC.md](./SPEC.md)、[RULES.md](./RULES.md)。

## 一句话技术栈

本地优先 MVP：Vite + React + TypeScript（前端） + Node 脚本（管线） + 静态 JSON 数据契约。无后端服务、无数据库。

## 前端（Claude 的活）

```
src/
├── App.tsx          # 极简 hash 路由（#/projects、#/repo/:owner/:name、#/models、#/articles…）
├── main.tsx         # 入口
├── types.ts         # 数据契约。改 JSON 形状前先改这里
├── styles.css        # 单文件全站样式。★B 魂在 :root 调色板 + 文件末尾 "B Focus Console 覆盖块"
├── lib/data.ts      # 从 public/data/*.json 加载（带内存缓存）
├── components/      # RepoCard / SiteHeader / Markdown
└── pages/           # Home / Projects / Detail / Models / Articles
```

视觉改动落点：调色板/基调 → `styles.css` 的 `:root` 和末尾 B 覆盖块；某版块布局 → 对应 `pages/*.tsx` + 末尾覆盖块里该版块的类。

## 后端 / 管线（Codex 的活）

```
scripts/
├── ingest.mjs               # GitHub Trending → README → DeepSeek → trending.json
├── refresh-articles.mjs     # 策展文章批次
├── papers-radar.mjs         # AI Job Research Radar：discover/triage/review/daily/run
├── lib/{agentic-pipeline, github-trending, project-ranking, project-prompts}.mjs
├── validate-*.mjs           # 各数据契约 + 文本编码校验
└── lint.mjs
```

## 数据契约

```
public/data/   trending / models / articles / articles-archive / paper-radar / pipeline-status .json
data/          agent-memory/*.json、papers/*  （本地生成，不直接服务前端）
```

## 验证

`npm run verify` = `lint && test && build`（`test` 已含 `validate`）。改数据形状 → 先改 `types.ts` + 对应 `validate-*`。

## "改某功能去哪"

- 项目栏内容/排序 → `ingest.mjs` + `lib/project-*`
- 模型栏 → `public/data/models.json`（当前手工策展）
- 文章/学术 → `refresh-articles.mjs` + `papers-radar.mjs`（学术"好"=汇聚×赛道×idea质量，见 SPEC 第3节）
- 任何视觉 → `styles.css`（:root + 末尾 B 覆盖块）+ 对应 page

## 旧 harness 去哪了

从零重建时，旧 `.ai/.jarvis/.omc/.superpowers` 移到了 gitignore 的 `_harness-archive-20260529/`（未销毁）；旧 SPEC/CONTEXT/docs 在 git 历史里。
