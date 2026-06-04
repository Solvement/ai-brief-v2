---
text: "RTK Token Saver 压缩 tool_result 内容，节省 20-40% token"
slug: "9router-main-claim"
kind: "claim"
content: "9router"
source_pointer: "README 中 Key Features 表格首行"
evidence_strength: "medium"
supports:
  - "token-compression-middleware"
  - "local-api-gateway"
contradicts: []
open_challenges:
  - "未提供压缩算法细节、剪裁规则、以及不同场景下的实测节省比例。"
  - "实际压缩效果可能因任务类型差异很大，过度压缩可能丢失关键信息。"
status: "supported"
---

## Claim

当 AI 助手执行命令如 git diff 返回大量无用文本时，9Router 会自动裁剪掉冗余部分，让请求少用 20-40% 的 token。

证据:README 明确描述了该功能及其效果，但没有公开任何实际测试数据。。边界:未提供压缩算法细节、剪裁规则、以及不同场景下的实测节省比例。。风险:实际压缩效果可能因任务类型差异很大，过度压缩可能丢失关键信息。。See [[content/9router]]。
