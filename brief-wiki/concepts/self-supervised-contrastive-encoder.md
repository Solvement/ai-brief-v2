---
name: "自监督对比编码器"
slug: "self-supervised-contrastive-encoder"
kind: "concept"
tags:
  - "ssl"
  - "embeddings"
  - "pretraining"
maturity: "active"
first_seen_in: "ruview"
related_content:
  - "ruview"
related_concepts: []
explanation: "一种训练方法，模型通过对比相似和不相似的样本对来学习数据表示，无需人工标签。本例中将CSI帧映射到128维向量空间。"
examples:
  - "ruvnet/wifi-densepose-pretrained模型"
  - "82.3% temporal-triplet准确率"
common_misunderstandings:
  - "虽然叫自监督，但训练阶段仍需构造正负例对，这在无线信号中如何定义正例是挑战。"
open_questions:
  - "该嵌入空间是否对身份信息敏感？能否用于跨房间泛化？"
---

## Explanation

一种训练方法，模型通过对比相似和不相似的样本对来学习数据表示，无需人工标签。本例中将CSI帧映射到128维向量空间。 出处:https://github.com/ruvnet/ruview。See [[content/ruview]]。

## Supported by
- [[claims/ruview-main-claim]]
