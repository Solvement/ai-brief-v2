---
content: pi-agent
kind: evidence-pack
title: "pi — Evidence Pack"
technical_objects:
  - name: "pi-coding-agent (CLI)"
    type: tool
    input: "终端中的自然语言编程指令"
    output: "代码改动 / 工具调用结果"
    role: "旗舰交互式 coding agent 入口"
    source_pointer: "repo:earendil-works/pi(@earendil-works/pi-coding-agent)"
  - name: "pi-agent-core (runtime)"
    type: component
    input: "agent 任务 + 工具集"
    output: "tool calling + 状态管理的执行循环"
    role: "agent 运行时引擎"
    source_pointer: "repo:earendil-works/pi(@earendil-works/pi-agent-core)"
  - name: "pi-ai (统一 LLM API)"
    type: API
    input: "统一的对话/工具调用请求"
    output: "跨 OpenAI/Anthropic/Google 等的统一响应"
    role: "把 provider 差异收敛到一层,业务与模型解耦"
    source_pointer: "repo:earendil-works/pi(@earendil-works/pi-ai)"
  - name: "供应链加固"
    type: component
    input: "依赖与发布流程"
    output: "锁定 + 校验 + 审计 + 隔离冒烟"
    role: "防依赖投毒,保发布可信"
    source_pointer: "repo:earendil-works/pi README(exact pin + npm-shrinkwrap + scheduled npm audit)"
pipeline_steps:
  - "终端启动 pi-coding-agent"
  - "agent-core 执行 tool-calling 循环(经 pi-ai 调模型)"
  - "可自我扩展:agent 写新技能并装载"
experiments: []
claims:
  - "工程深度在『统一 LLM API + 供应链加固』两条地基"
artifacts:
  - "MIT monorepo,TypeScript,225 releases,有测试与 CI"
metrics:
  - "58.7k stars / 4387 commits / 7k forks / 225 releases(采纳信号,非性能)"
baselines: []
failure_modes:
  - "执行代码 + 自我扩展 → 安全面"
  - "v0.78 高速迭代,API 不稳"
missing_details:
  - "各包内部实现"
  - "贡献者数"
source_pointers:
  - "github.com/badlogic/pi-mono README + monorepo 包 + metadata"
---

## Notes

证据来自 artifact(monorepo 包职责/供应链做法/发布纪律)与采纳信号。注意 star 含 libGDX 作者光环,需结合提交活跃度与发布纪律交叉判断。
