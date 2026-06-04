---
text: "iii 可通过 `iii worker add` 命令即时添加队列、代理、沙箱等多种能力"
slug: "iii-main-claim"
kind: "claim"
content: "iii"
source_pointer: "README 示例：`iii worker add queue/agent/sandbox`"
evidence_strength: "medium"
supports:
  - "worker-function-trigger"
  - "live-catalog"
contradicts: []
open_challenges:
  - "未说明安装背后的具体机制，是代码生成、容器拉取还是其他"
  - "可能依赖预定义的 Worker 模板或第三方注册表，灵活性有上限"
status: "supported"
---

## Claim

只用一条命令就能给系统增加新功能，不用额外配置集成

证据:演示了命令行安装 Worker 的用法。边界:未说明安装背后的具体机制，是代码生成、容器拉取还是其他。风险:可能依赖预定义的 Worker 模板或第三方注册表，灵活性有上限。See [[content/iii]]。
