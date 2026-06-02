---
content: qwen3-coder-next
kind: source-pack
title: "Qwen3-Coder-Next — Source Pack"
fetched_materials:
  abs: https://arxiv.org/abs/2603.00729
  html: https://arxiv.org/html/2603.00729v1
primary_sources:
  - "arxiv:2603.00729 abstract"
  - "arxiv:2603.00729v1 full text (§2 任务合成/§3 架构预训练/§4 后训练/§5 评测/§6 局限/Table 3-11)"
discovery_sources:
  - "web search: arXiv 2026 open model technical report training recipe"
source_reliability: high
missing_sources:
  - "official HuggingFace/repo weight links (not in fetched text)"
  - "training hardware / compute / cost"
  - "explicit license statement"
last_checked: "2026-06-01"
---

## Notes

一手核验:arXiv abstract + v1 HTML(架构/训练配方/后训练/基准/baseline 公平性/局限)。出身:作者 20 人(Ruisheng Cao … Fan Zhou),正文未直列机构,但模型名 Qwen3 + §2.2 Alibaba Cloud Kubernetes 指向 Alibaba Qwen 团队。权重链接、硬件成本、license 正文未给,记入 missing_sources(对应 artifact_audit 的 ❓ 项)。
