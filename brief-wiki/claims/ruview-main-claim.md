---
text: "RuView仅用WiFi信号即可实现穿墙存在检测、呼吸和心率监测。"
slug: "ruview-main-claim"
kind: "claim"
content: "ruview"
source_pointer: "README: 'Detect people, measure breathing and heart rate... through walls, in the dark, with no cameras or wearables.'"
evidence_strength: "high"
supports:
  - "wifi-csi-sensing"
  - "self-supervised-contrastive-encoder"
contradicts: []
open_challenges:
  - "未提供大样本临床验证数据，精度可能受环境影响。"
  - "如果用户WiFi环境干扰严重（如多AP、金属反射），精度可能下降，导致误判。"
status: "supported"
---

## Claim

该系统不用摄像头，靠分析WiFi无线电波的变化来感知墙后是否有人、测他们的呼吸和心跳。

证据:提供了详细的信号处理方法（带通滤波、零交叉BPM）和ESP32硬件实现路径。。边界:未提供大样本临床验证数据，精度可能受环境影响。。风险:如果用户WiFi环境干扰严重（如多AP、金属反射），精度可能下降，导致误判。。See [[content/ruview]]。
