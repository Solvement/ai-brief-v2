---
name: "WiFi信道状态信息感知"
slug: "wifi-csi-sensing"
kind: "concept"
tags:
  - "iot"
  - "sensing"
  - "wireless"
maturity: "emerging"
first_seen_in: "ruview"
related_content:
  - "ruview"
related_concepts: []
explanation: "利用WiFi物理层信道状态信息（包含每子载波的振幅和相位）感知环境变化，而非简单的信号强度。多径效应使微小的移动和生理信号都可被探测。"
examples:
  - "ESP32-S3 CSI流获取"
  - "RuView中的呼吸率提取使用相位变化"
common_misunderstandings:
  - "不同于基于RSSI的运动检测，CSI提供更细粒度的多子载波信息，足以区分心跳和呼吸。"
  - "需要特定的驱动和硬件，普通WiFi网卡不一定能输出CSI。"
open_questions:
  - "如何标准化CSI数据的预处理以减少设备差异？"
  - "大规模部署中的信道干扰管理？"
---

## Explanation

利用WiFi物理层信道状态信息（包含每子载波的振幅和相位）感知环境变化，而非简单的信号强度。多径效应使微小的移动和生理信号都可被探测。 出处:https://github.com/ruvnet/ruview。See [[content/ruview]]。

## Supported by
- [[claims/ruview-main-claim]]
