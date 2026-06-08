---
slug: "pbakaus-impeccable-repo"
kind: "artifact"
content: "pbakaus-impeccable"
artifact_type: "repo"
url: "https://github.com/pbakaus/impeccable"
official_or_third_party: "official"
status: "available"
license: "Apache-2.0"
runnable: "yes"
missing_parts:
  - "README/README.npm 的规则数量、旧 reference 链接和 `--fast` 描述与当前源码不完全一致"
  - "URL scanning 需要 optional `puppeteer`"
  - "远程 impeccable.style 下载 bundle 未在本次检查中核对"
  - "detector precision/recall 或 benchmark 结果未在 README/docs/tree 说明"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆真实 upstream 到指定 checkout，检查提交 `1aedbcf538e3fa6694ccbf00294cc18e59ba1f21`（2026-06-05，提交信息 `Add Git submodule skill linking`）。`package.json` CLI 版本为 `2.3.2`，`.claude-plugin/plugin.json` 技能/插件版本为 `3.5.0`；本地 Node `v24.13.1` 可运行 CLI version/help，并成功对自带 typography fixture 产生 detector findings。

出处:https://github.com/pbakaus/impeccable。See [[content/pbakaus-impeccable]]。
