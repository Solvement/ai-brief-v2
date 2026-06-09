---
text: "仓库覆盖 20 phases、503 lessons。"
slug: "rohitg00-ai-engineering-from-scratch-main-claim"
kind: "claim"
content: "rohitg00-ai-engineering-from-scratch"
source_pointer: "README badges/hero；scripts/build_catalog.py compute_totals；本地运行 2026-06-09"
evidence_strength: "high"
supports:
  - "from-scratch-ai-curriculum"
  - "react-agent-loop"
contradicts: []
open_challenges:
  - "不证明每课质量一致，也不证明总学习时长准确。"
  - "ROADMAP 顶部写 ~314 hours，底部写 ~1,050 hours，README 写 ~320 hours，时长口径冲突。"
status: "supported"
---

## Claim

不是 README 单说；本次调用 `scripts.build_catalog.build_catalog()` 也得到 phases=20、lessons=503。

证据:目录树和 catalog 构建逻辑按 `phases/NN/MM` 扫描，结果为 20/503。。边界:不证明每课质量一致，也不证明总学习时长准确。。风险:ROADMAP 顶部写 ~314 hours，底部写 ~1,050 hours，README 写 ~320 hours，时长口径冲突。。See [[content/rohitg00-ai-engineering-from-scratch]]。
