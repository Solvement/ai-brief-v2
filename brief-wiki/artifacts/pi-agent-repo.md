---
slug: pi-agent-repo
kind: artifact
content: pi-agent
artifact_type: repo
url: https://github.com/badlogic/pi-mono
official_or_third_party: official
status: available
license: MIT
runnable: yes
missing_parts:
  - "需各家 LLM 的 API key 才能完整使用(无 key 时测试跳过 LLM 部分)"
last_checked: "2026-06-01"
---

## Artifact audit

官方 monorepo(earendil-works/pi,`badlogic/pi-mono` 重定向),可 clone & run。TypeScript,MIT,225 releases(v0.78.0 @ 2026-05-29),4387 commits,7k forks。测试 `npm run check` + `./test.sh`,GitHub Actions CI(含定时 npm audit)。供应链加固:exact pinning + npm-shrinkwrap + 锁文件校验 + 隔离 release smoke test。需各家 LLM API key 才能完整发挥。出处:github.com/badlogic/pi-mono(2026-06-01 核验)。See [[content/pi-agent]]。
