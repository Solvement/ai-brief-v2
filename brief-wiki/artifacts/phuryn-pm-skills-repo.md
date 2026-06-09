---
slug: "phuryn-pm-skills-repo"
kind: "artifact"
content: "phuryn-pm-skills"
artifact_type: "repo"
url: "https://github.com/phuryn/pm-skills"
official_or_third_party: "official"
status: "available"
license: "MIT（来源：LICENSE；各 plugin.json license）"
runnable: "yes"
missing_parts:
  - "未发现 package.json、pyproject.toml、requirements.txt、Dockerfile 或 docker-compose.yml。"
  - "未发现传统测试目录或 CI 配置；只有 `validate_plugins.py` 形状校验。"
  - "Codex 路径 README 自称 skills 可用，但 slash commands 不作为 Codex slash commands 运行。"
last_checked: "2026-06-09"
---

## Artifact audit

已克隆并检查真实上游仓库 commit d384f0c9eb81fe74656a4f6da168587836939edb。核心资产是 9 个 Claude/Codex 插件目录、68 个 SKILL.md、42 个 command Markdown、root marketplace manifest 和本地 validator。

出处:https://github.com/phuryn/pm-skills。See [[content/phuryn-pm-skills]]。
