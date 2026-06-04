---
text: "可节省 60‑95% 的 token。"
slug: "headroom-main-claim"
kind: "claim"
content: "headroom"
source_pointer: "README 定位语、GIF 演示、Proof 表格"
evidence_strength: "high"
supports:
  - "cachealigner"
  - "content-router"
contradicts: []
open_challenges:
  - "节省比例会随内容类型变化，部分场景（如代码探索）仅 47%，并非所有情况都能达到 90% 以上。"
  - "该数据可能来自精心挑选的样例，现实复杂场景可能达不到同样压缩比。"
status: "supported"
---

## Claim

输入给 LLM 的提示经过 Headroom 压缩后，token 数量能减少六到九成。

证据:表格中的数据（如代码搜索从 17,765 token 降至 1,408 token）直接支撑该范围。。边界:节省比例会随内容类型变化，部分场景（如代码探索）仅 47%，并非所有情况都能达到 90% 以上。。风险:该数据可能来自精心挑选的样例，现实复杂场景可能达不到同样压缩比。。See [[content/headroom]]。
