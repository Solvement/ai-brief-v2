---
text: "解析器能从网站变化中学习并自动重定位你的元素。"
slug: "scrapling-main-claim"
kind: "claim"
content: "scrapling"
source_pointer: "README: \"Its parser learns from website changes and automatically relocates your elements when pages update.\""
evidence_strength: "medium"
supports:
  - "adaptive-element-relocation"
  - "scrapling-mcp-tool-integration"
contradicts: []
open_challenges:
  - "未说明如果元素完全消失或内容彻底改变时的行为。"
  - "签名匹配可能误判，带来错误数据。"
status: "supported"
---

## Claim

页面改版后，爬虫仍能找到之前定义的目标元素，无需修改代码。

证据:auto_save 和 adaptive 参数示例。。边界:未说明如果元素完全消失或内容彻底改变时的行为。。风险:签名匹配可能误判，带来错误数据。。See [[content/scrapling]]。
