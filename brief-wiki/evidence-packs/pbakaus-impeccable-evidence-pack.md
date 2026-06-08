---
content: "pbakaus-impeccable"
kind: "evidence-pack"
title: "impeccable — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Impeccable 是一个面向 AI 编程工具的前端设计技能包：把“怎么做得不像 AI 生成的 UI”写成一个可安装 skill、23 个子命令、跨工具构建产物和一个本地 anti-pattern detector。"
    internal_logic: "人话：一个典型流程是：先安装 skill，再让 AI harness 加载 `/impeccable`，skill 首先跑上下文脚本，然后按子命令读取对应参考，必要时调用本地 detector。\n\n具体例子一，安装路径：`npx impeccable skills install` 进入 `cli/bin/cli.js` 的 `skills` 分支，再到 `cli/bin/commands/skills.mjs`。安装逻辑会找项目里已有 provider 目录，或者从全局 `~/.claude`、`~/.codex` 等推断；找不到时默认写 `.claude` 和 `.agents`。它从 `https://impeccable.style/api/download/bundle/universal` 下载 bundle，再把每个 provider 的 compiled skill copy 到对应 `skills/` 目录。（来源：README Installation；来源：cli/bin/cli.js；来源：cli/bin/commands/skills.mjs resolveInstallTargets/downloadAndExtractBundle/copyProviderSkills）\n\n具体例子二，agent 执行 `/impeccable audit checkout`：`skill/SKILL.src.md` 要求先运行 `node {{scripts_path}}/context.mjs`；如果有子命令，就必须读 `reference/audit.md`；还必须读 brand/product register。`reference/audit.md` 把 audit 定义成 5 维检查：Accessibility、Performance、Theming、Responsive Design、Anti-Patterns，总分 20 分，并要求 P0-P3 分级。（来源：skill/SKILL.src.md Setup；来源：skill/reference/audit.md Diagnostic Scan）\n\n具体例子三，detector 的真实输出：本次在 checkout 中运行 `node cli/bin/cli.js detect --json tests/fixtures/antipatterns/typography-should-flag.html`，返回 4 个 findings：`overused-font` line 10 snippet `font-family: 'Inter`，`overused-font` line 7 snippet `Google Fonts: Inter`，`single-font` line 7 snippet `only font used is inter`，`flat-type-hierarchy` line 14 snippet `Sizes: 13px, 14px, 15px, 16px, 18px (ratio 1.4:1)`。CLI 对有 findings 的扫描按设计返回非零退出码。（来源：cli/engine/cli/main.mjs formatFindings/detectCli；来源：tests/fixtures/antipatterns/typography-should-flag.html；来源：本次本地运行输出）\n\n术语：static HTML analysis 是解析 HTML/CSS 后做规则检查；regex fallback 是对 CSS/JSX/TSX 等源码文本做模式匹配；provider-gated rule 是默认不报，只有加 `--gpt` 或 `--gemini` 才启用的规则。"
    failure_mode: "package.json engines；本次本地运行"
    source_pointer: "https://github.com/pbakaus/impeccable"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/Apache-2.0/cli-v2.3.2"
experiments: []
claims:
  - "[[claims/pbakaus-impeccable-main-claim]]"
artifacts:
  - "[[artifacts/pbakaus-impeccable-repo]]"
metrics:
  - "stars=35947"
  - "forks=1962"
  - "open_issues=36"
  - "latest_release=cli-v2.3.2"
  - "pushed_at=2026-06-06T04:06:32Z"
baselines: []
failure_modes:
  - "package.json engines；本次本地运行"
  - "cli/bin/commands/skills.mjs API_BASE/downloadAndExtractBundle；README Installation Option 2"
  - "HARNESSES.md Frontmatter Support/Skill Directory Structure；scripts/lib/transformers/providers.js"
  - "package.json optionalDependencies；cli/engine/cli/main.mjs Detection modes"
  - "README What's Included/CLI；README.npm.md；scripts/build.js generateCounts；skill/reference tree"
missing_details: []
source_pointers:
  - "https://github.com/pbakaus/impeccable"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/pbakaus-impeccable-main-claim]],官方 artifact 落库为 [[artifacts/pbakaus-impeccable-repo]]。See [[content/pbakaus-impeccable]]。
