---
content: "mvanhorn-last30days-skill"
kind: "evidence-pack"
title: "last30days-skill — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "last30days-skill 是一个把“最近 30 天社区信号”塞进 Agent Skills 工作流的研究技能：先并发抓 Reddit、X、YouTube、HN、Polymarket、GitHub 和网页，再让宿主模型合成一份可追问的简报。"
    internal_logic: "真实流可以从 `/last30days OpenClaw --github-repo=openclaw/openclaw --emit=compact` 这一类调用理解：宿主模型读 `SKILL.md`，先做实体解析和 query plan，再把 plan 文件路径传给 Python engine（来源：skills/last30days/SKILL.md Research Execution）。\n\n```mermaid\nflowchart TD\n  A[用户话题] --> B[SKILL 合约]\n  B --> C[实体解析]\n  C --> D[Query Plan]\n  D --> E[last30days.py]\n  E --> F[可用源检测]\n  F --> G[并发抓取]\n  G --> H[归一化去重]\n  H --> I[Weighted RRF]\n  I --> J[LLM或本地重排]\n  J --> K[聚类]\n  K --> L[compact json html]\n  L --> M[宿主模型合成]\n  L --> N[raw文件或SQLite]\n```\n\n关键机制很具体：`DEPTH_SETTINGS` 把 `quick/default/deep` 映射到 per-stream、pool、rerank 三个限制；`pipeline.run()` 对每个 subquery/source 提交 future；`_retrieve_stream()` 分别调用 `reddit_public`、`bird_x`/`xai_x`、`youtube_yt`、`polymarket`、`grounding` 等模块（来源：pipeline.py DEPTH_SETTINGS/run/_retrieve_stream）。\n\n最小直跑形态是：\n```bash\npython skills/last30days/scripts/last30days.py \"OpenClaw\" --emit=compact\n```\n这能运行，但 SKILL.md 对 named entity 的正式路径要求宿主模型生成 `--plan` tmpfile，并加 `--x-handle`、`--subreddits`、`--github-repo` 等解析结果；否则会走 deterministic fallback，项目自己把这称为退化路径（来源：skills/last30days/SKILL.md LAW 7；来源：planner.py plan_query）。"
    failure_mode: "skills/last30days/SKILL.md STEP 0；README Install；AGENTS.md Orientation"
    source_pointer: "https://github.com/mvanhorn/last30days-skill"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v3.3.0"
experiments: []
claims:
  - "[[claims/mvanhorn-last30days-skill-main-claim]]"
artifacts:
  - "[[artifacts/mvanhorn-last30days-skill-repo]]"
metrics:
  - "stars=34466"
  - "forks=2817"
  - "open_issues=123"
  - "latest_release=v3.3.0"
  - "pushed_at=2026-06-06T16:58:08Z"
baselines: []
failure_modes:
  - "skills/last30days/SKILL.md STEP 0；README Install；AGENTS.md Orientation"
  - "env.py get_x_source/get_x_source_status；bird_x.py；xai_x.py；docs/how-search-works.md X/Twitter Search"
  - "reddit_keyless.py module docstring；reddit_public.py module docstring；reddit_enrich.py"
  - "youtube_yt.py is_ytdlp_installed/_ytdlp_ssh_host；CHANGELOG.md 3.3.0"
  - "CONFIGURATION.md Source-by-source；grounding.py web_search；http.py request"
  - "last30days.py ensure_supported_python/Windows reconfigure；本地 uv run pytest 2026-06-09"
  - "env.py _check_file_permissions/_load_keychain；.github/workflows/security.yml；AGENTS.md Security hygiene"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/mvanhorn/last30days-skill"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/mvanhorn-last30days-skill-main-claim]],官方 artifact 落库为 [[artifacts/mvanhorn-last30days-skill-repo]]。See [[content/mvanhorn-last30days-skill]]。
