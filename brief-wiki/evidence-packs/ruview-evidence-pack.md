---
content: "ruview"
kind: "evidence-pack"
title: "RuView — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "π RuView 将普通WiFi信号转化为实时空间智能、生命体征监测和存在检测，无需摄像头、无需可穿戴设备。"
    internal_logic: "### Agent Loop\n\nRuView 的边缘模块本质上是一个持续的感知-推理-输出循环。模块运行在ESP32微控制器上，循环从**采集CSI数据**开始：ESP32-S3以固定采样率捕获WiFi子载波的幅度和相位信息。随后**特征提取**通过带通滤波、相位解缠等手段得到呼吸、心跳、运动等信号。紧接着**推理引擎**可能调用小型量化模型（如8KB的对比编码器或脉冲神经网络）产生结构化输出（存在/人数/姿势关键点）。最后**输出阶段**通过MQTT、WebSocket或Home Assistant实体发布结果，并触发联动动作（如告警、记录）。该循环可以完全离线运行，不依赖云服务。\n\n### Tool Interface\n\n系统通过多种接口暴露能力，形成工具调用协议：\n- **REST API**：提供`/api/v1/config/dedup-factor`等端点，支持运行时调整参数。\n- **MQTT**：原生集成Home Assistant，每个节点发布21个实体（原始信号和语义状态），工具可以直接订阅。\n- **MCP代理**：MCP（Model Context Protocol，模型上下文协议）允许外部AI模型以标准方式调用RuView的感知功能，实现“AI观察空间”。\n- **WebSocket & asyncio客户端**：Python客户端库`ruview[client]`提供了异步工具调用接口，便于集成到其他Agent框架。\n- **Cogs（边缘模块）**：105个预编译模块，每个都可视为一个独立工具，如`occupancy-zones`、`elevator-count`，可直接在边缘运行。\n\n### State / Memory\n\n系统状态由CSI流和向量数据库共同维护：\n- **短期状态**：内存中保留最近的CSI帧和信号统计，用于实时滤波和阈值判断。\n- **长期记忆**：可选的Cognitum Seed（$140）提供持久化向量存储+近似最近邻（kNN）检索。它能保存环境指纹、历史事件，并支持跨时间段的模式比对。\n- **密码学状态链**：所有测量通过Ed25519见证链签名，形成不可篡改的状态历史，增强数据审计和信任。\n- **环境自适应**：脉冲神经网络在30秒内适应特定空间，存储了环境的校准参数和射频指纹。\n\n### Planner\n\n未在 README/artifact 说明有独立的规划器模块。系统的决策逻辑主要是信号驱动的反应式规则，而非长时规划。例如：\n- 呼吸率提取：固定算法（带通滤波+过零检测BPM）。\n- 跌倒检测：相位加速度阈值+帧去抖动。\n- 多频段跳频：时分调度，由mesh控制器静态分配时隙。\n若将“Cog模块组合”视为一种静态规划，则其并不存在动态任务规划能力。\n\n### Sandbox\n\n边缘模块运行在真实的硬件上，隔离性依赖芯片架构和固件设计，而非软件沙箱。ESP32固件划分为独立任务，但未在README中提及内存隔离或受控执行环境。Cog模块从注册表加载，但签名验证仅通过数字签名保证完整性，未提到运行时权限限制。\n\n### 安全边界\n\n系统实现了多层次安全机制：\n- **密码学证明**：每条传感数据都用Ed25519签名，形成不可否认的“见证链”，防止数据在传输或存储中被篡改。\n- **本地处理**：无云端依赖，隐私数据不出硬件边界，降低攻击面。\n- **硬件信任根**：Cognitum Seed提供硬件级密钥存储和加密运算。\n- **固件完整性**：ESP32使用安全启动，Cog二进制文件需通过签名验证才能加载。\n- **通信加密**：MQTT over TLS，HTTPS API。"
    failure_mode: "硬件强依赖：全部高级功能（生命体征、穿墙）均需要ESP32-S3或研究级网卡提供CSI数据，普通WiFi网卡只能做RSSI存在检测，功能受限。"
    source_pointer: "https://github.com/ruvnet/ruview"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v1591"
experiments: []
claims:
  - "[[claims/ruview-main-claim]]"
artifacts:
  - "[[artifacts/ruview-repo]]"
metrics:
  - "stars=70415"
  - "forks=9421"
  - "open_issues=168"
  - "latest_release=v1591"
  - "pushed_at=2026-06-03T13:48:38Z"
baselines: []
failure_modes:
  - "硬件强依赖：全部高级功能（生命体征、穿墙）均需要ESP32-S3或研究级网卡提供CSI数据，普通WiFi网卡只能做RSSI存在检测，功能受限。"
  - "环境敏感性：模型性能依赖于特定空间布局和多径特征，在不同环境中可能需要重新校准或微调，否则精度下降。"
  - "精度声明限制：v2编码器82.3%的准确率是在特定测试条件下测得，实际部署中可能受人群移动、家具变动等影响。"
  - "安全边界模糊：沙箱隔离机制未明确，若加载恶意Cog模块，可能危及整个节点。"
  - "工程复杂度高：涉及固件烧录、射频参数调整、多种网络协议配置，对非专业用户门槛较高。"
missing_details: []
source_pointers:
  - "https://github.com/ruvnet/ruview"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ruview-main-claim]],官方 artifact 落库为 [[artifacts/ruview-repo]]。See [[content/ruview]]。
