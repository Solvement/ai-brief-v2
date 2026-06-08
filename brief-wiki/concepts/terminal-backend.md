---
name: "Terminal Backend"
slug: "terminal-backend"
kind: "concept"
tags:
  - "sandbox"
  - "terminal"
  - "execution"
maturity: "active"
first_seen_in: "nousresearch-hermes-agent"
related_content:
  - "nousresearch-hermes-agent"
related_concepts: []
explanation: "普通话说：同一条终端命令可以在本机、容器、远程机器或云沙箱里跑。技术定义：Hermes 的 terminal tool 根据 `env_type` 分派到 local/docker/singularity/modal/daytona/ssh 等 Environment 实现，并用配置控制 cwd、镜像、资源、持久化和 env forward。"
examples:
  - "cli-config.yaml.example terminal.backend: docker"
  - "tools/terminal_tool.py _create_environment"
common_misunderstandings:
  - "配置了 agent 不等于命令自动安全；local backend 仍直接触达宿主机。"
  - "Docker 隔离不等于网络隔离；默认 compose 使用 host network。"
open_questions:
  - "不同 backend 的实际隔离强度和清理行为需要逐项实测。"
---

## Explanation

普通话说：同一条终端命令可以在本机、容器、远程机器或云沙箱里跑。技术定义：Hermes 的 terminal tool 根据 `env_type` 分派到 local/docker/singularity/modal/daytona/ssh 等 Environment 实现，并用配置控制 cwd、镜像、资源、持久化和 env forward。 出处:https://github.com/nousresearch/hermes-agent。See [[content/nousresearch-hermes-agent]]。

## Supported by
- [[claims/nousresearch-hermes-agent-main-claim]]
