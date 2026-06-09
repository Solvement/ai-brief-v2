---
content: "rohitg00-ai-engineering-from-scratch"
kind: "evidence-pack"
title: "ai-engineering-from-scratch — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "schema"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "这是一个从数学、模型、LLM 到 Agent/MCP/安全的开源 AI 工程课程仓库，不是一个可直接接入生产的 agent framework。"
    internal_logic: "```mermaid\nflowchart TD\n  A[README 选路径] --> B[phase lesson]\n  B --> C[docs en]\n  B --> D[code main]\n  B --> E[quiz json]\n  B --> F[outputs skill prompt]\n  F --> G[install skills]\n  B --> H[build catalog]\n  I[workbench pack] --> J[scaffold repo]\n  D --> K[本地运行验证]\n```\n\n真实流：读者从 README 选 phase，进入某个 lesson；每课通常有 `docs/en.md`、`code/`、`quiz.json`、`outputs/`。（来源：README The shape of a lesson）\n\nPhase 14 Lesson 01 的实际例子：\n```bash\npython phases/14-agent-engineering/01-the-agent-loop/code/main.py\n```\n这次运行得到 5 次工具调用：先 `kv_set base=120`，再 `calculator 120 * 0.15` 得 18.0，再算 `120 + 18.0` 得 138.0，最后 `kv_get base` 后 finish。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；本地运行）\n\nMCP 例子走另一条线：Phase 13 Lesson 07 的 server 从 stdin 读 JSON-RPC，一行一个 request；`tools/call` 调 `notes_create` 后返回 text block 和 `notes://...` resource。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py）\n\n可复用交付物走安装线：\n```bash\npython3 scripts/install_skills.py <target> --phase 14\n```\n脚本按前缀识别 `skill-`、`prompt-`、`agent-`，默认写成 `<target>/<name>/SKILL.md` 并生成 manifest。（来源：scripts/install_skills.py target_path/write_manifest）"
    failure_mode: "本地 clone 过程 2026-06-09；repo 深层路径如 phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/schemas/scope_contract.schema.json"
    source_pointer: "https://github.com/rohitg00/ai-engineering-from-scratch"
pipeline_steps:
  - "project_type 分诊:template_boilerplate"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/rohitg00-ai-engineering-from-scratch-main-claim]]"
artifacts:
  - "[[artifacts/rohitg00-ai-engineering-from-scratch-repo]]"
metrics:
  - "stars=30340"
  - "forks=4950"
  - "open_issues=59"
  - "latest_release=not_found"
  - "pushed_at=2026-06-08T10:09:13Z"
baselines: []
failure_modes:
  - "本地 clone 过程 2026-06-09；repo 深层路径如 phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/schemas/scope_contract.schema.json"
  - "README The toolkit；ROADMAP top/total；scripts/build_catalog.py"
  - "phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py"
  - "requirements.txt；scripts/lesson_run.py"
  - "vercel.json；site/build.js；CONTRIBUTING.md"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/rohitg00/ai-engineering-from-scratch"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/rohitg00-ai-engineering-from-scratch-main-claim]],官方 artifact 落库为 [[artifacts/rohitg00-ai-engineering-from-scratch-repo]]。See [[content/rohitg00-ai-engineering-from-scratch]]。
