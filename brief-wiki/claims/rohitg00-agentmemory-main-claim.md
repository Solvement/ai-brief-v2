---
text: "安装和启动入口是 `npm install -g @agentmemory/agentmemory`、`agentmemory`、`agentmemory demo`、`agentmemory connect claude-code`、`npx @agentmemory/agentmemory`。"
slug: "rohitg00-agentmemory-main-claim"
kind: "claim"
content: "rohitg00-agentmemory"
source_pointer: "README Install；package.json bin"
evidence_strength: "high"
supports:
  - "persistent-agent-memory"
  - "hook-based-observation-capture"
contradicts: []
open_challenges:
  - "没有证明这些命令在当前机器已成功运行；本次只检查仓库文件。"
  - "README 的命令依赖已发布 npm 包和 iii runtime，源码存在不等于本机运行成功。"
status: "supported"
---

## Claim

用户可以把它当本地守护进程启动，也可以用 npx 临时运行。

证据:package.json 定义 `bin.agentmemory = dist/cli.mjs`，README 给出上述命令。。边界:没有证明这些命令在当前机器已成功运行；本次只检查仓库文件。。风险:README 的命令依赖已发布 npm 包和 iii runtime，源码存在不等于本机运行成功。。See [[content/rohitg00-agentmemory]]。
