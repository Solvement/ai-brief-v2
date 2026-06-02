---
slug: qwen3-coder-next-weights
kind: artifact
content: qwen3-coder-next
artifact_type: model
official_or_third_party: official
status: partial
runnable: yes
missing_parts:
  - "训练数据未发布(专有 + 合成任务)"
  - "硬件/算力/成本未公开"
  - "正文未给出具体 HF/repo 链接;license 未明示"
last_checked: "2026-06-01"
---

## Artifact audit

官方发布 **base + instruct 开源权重**(可用于部署/推理),但**训练不可复现**:数据与合成流程专有,算力未公开,正文也未给具体权重链接与 license(Qwen 系列通常 Apache-2.0,需到官方 HF 核实)。故判定 **partial**——权重可用 ≠ 训练可复现。出处:arxiv:2603.00729(abstract『open-weight versions』+ §6)。See [[content/qwen3-coder-next]]。
