---
content: "ruview"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "RuView — 深度拆解"
reasoning_trace:
  paper_type_decision: "尽管项目输出是传感平台，但其内部模块化设计、通过MCP暴露能力、支持独立运行的Cog模块，符合Agent Framework的定义，尤其是在边缘节点上运行自主任务方面。"
  central_contribution: "提供了一套完整且开放的方案，使廉价ESP32硬件结合自监督学习，能够从WiFi信道状态信息中提取出通常需要摄像头和雷达才能达到的多维空间感知。"
  inspected:
    - "README.md（详细功能表、硬件选项、安装命令）"
    - "仓库目录结构（firmware/、python/、scripts/、docs/、.mcp.json）"
    - "GitHub Topics（claude、skills、spatial-intelligence等）"
    - "硬件成本与能力对比表"
  top_claims:
    - "通过WiFi CSI检测人体存在、生命体征、活动、姿势关键点。"
    - "模型量化至8KB，边缘端微秒级推理。"
    - "所有测量经Ed25519见证链密码学签名。"
    - "支持四大智能家居生态及Matter桥接。"
    - "在MM-Fi数据集上达到了82.69% torso-PCK@20的SOTA姿态估计。"
  evidence_needed:
    - "需要第三方独立验证CSI姿态估计准确率，尤其是超越MM-Fi数据集的泛化性能。"
    - "需要评估边缘模块在不同人群和家具布局下的鲁棒性。"
    - "需要检查Cog模块仓库的安全审计和沙箱实现细节。"
    - "需要实际硬件测试呼吸率和心率的临床精度。"
  main_threats:
    - "硬件可获得性和成本影响广泛部署（ESP32虽然便宜，但需要采购和烧录）。"
    - "无线环境的不可预测性可能导致精度波动，用户期望管理困难。"
    - "如果密码学运算占用过多MCU资源，会影响实时传感性能。"
  transfer_decision: "软件层面的信号处理和AI训练管道可复用到类似的无线感知任务；但硬件特定层（CSI驱动、固件配置）不可直接复用。MCP集成模式、轻量化状态存储设计值得借鉴到其他Edge AI应用。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 3
  reuse_value: 5
  maturity: 5
  main_risk: "硬件依赖和环境敏感性限制了其即插即用能力，但作为研究平台和模式参考价值极高。"
next_actions:
  - "clone-and-run"
  - "read-docs"
claim_ledger:
  - claim: "RuView仅用WiFi信号即可实现穿墙存在检测、呼吸和心率监测。"
    plain_english: "该系统不用摄像头，靠分析WiFi无线电波的变化来感知墙后是否有人、测他们的呼吸和心跳。"
    source: "README: 'Detect people, measure breathing and heart rate... through walls, in the dark, with no cameras or wearables.'"
    evidence_strength: "high"
    supports: "提供了详细的信号处理方法（带通滤波、零交叉BPM）和ESP32硬件实现路径。"
    does_not_support: "未提供大样本临床验证数据，精度可能受环境影响。"
    threat: "如果用户WiFi环境干扰严重（如多AP、金属反射），精度可能下降，导致误判。"
  - claim: "预训练模型在存在检测任务上达到82.3% temporal-triplet准确率。"
    plain_english: "该模型判断有没有人时，正确概率约82.3%。"
    source: "README: 'v2 encoder reports ... temporal-triplet accuracy of 82.3%'"
    evidence_strength: "high"
    supports: "明确指出是经过公平重测的结果，并进行了自我纠正。"
    does_not_support: "该数字是在特定条件下测得，未知其在不同房间和人群下的泛化性能。"
    threat: "如果用户过度依赖该数值，可能在复杂场景中产生失望。"
  - claim: "所有传感数据都通过Ed25519见证链进行密码学证明，确保数据不可篡改。"
    plain_english: "每个测量数据都有数字签名，能证明是哪个设备在什么时间生成的，改不了。"
    source: "README: 'Every measurement is cryptographically attested via an Ed25519 witness chain.'"
    evidence_strength: "high"
    supports: "具体说明了使用Ed25519算法和见证链数据结构。"
    does_not_support: "未描述签名如何存储在链上、如何验证，以及链的结构是否防重放。"
    threat: "若签名运算消耗过多计算资源，可能影响低功耗设备的电池寿命。"
  - claim: "系统在MM-Fi基准测试中实现姿态估计SOTA，torso-PCK@20达到82.69%。"
    plain_english: "在公开数据集MM-Fi上，该系统用WiFi信号推断人体17个关键点的准确率最高，超过了之前的模型。"
    source: "README: 'SOTA on MM-Fi: ... hits 82.69% torso-PCK@20, beating MultiFormer ... and CSI2Pose'"
    evidence_strength: "high"
    supports: "提供了具体分数和对比方法，并有AetherArena排行榜可审计。"
    does_not_support: "结果仅限于MM-Fi的特定划分协议，未知在真实穿墙场景下的表现。"
    threat: "可能存在数据集过拟合风险，实际部署时准确率可能下降。"
artifact_audit:
  official_repo: "https://github.com/ruvnet/RuView"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**π RuView 将普通WiFi信号转化为实时空间智能、生命体征监测和存在检测，无需摄像头、无需可穿戴设备。**

> 一句话:用WiFi看穿墙壁，感知生命。

## 为什么火

- 硬件极低成本：ESP32-S3仅需$9，即可实现CSI传感，无需专用雷达。
- 隐私保护：无摄像头、无云端，所有推理在边缘完成，杜绝视频泄露风险。
- 自监督学习突破：仅需60K帧预训练，模型量化后仅8KB，在树莓派上跑实时。
- 生态兼容性：原生支持Home Assistant、Apple Home、Matter等四大智能家居生态，开箱即用。
- 可审计的AI：每个测量都经过Ed25519见证链密码学签名，防止数据篡改。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md 存在且内容详尽，包含架构、安装、使用示例。 |
| 源代码（Python / Rust / 固件） | partial | 仓库含有python/、firmware/、tools/、scripts/等目录，但未发现统一的src/目录。 |
| 测试 | available | 存在tests/目录，README badges显示1463个测试通过。 |
| 文档 | available | docs/目录包含大量ADR和集成指南。 |
| 示例 | available | examples/目录及README中提供Docker、Python、Node多种快速启动示例。 |
| 许可证 | available | LICENSE文件明确为MIT。 |
| 模型权重 | available | Hugging Face上发布了预训练模型ruvnet/wifi-densepose-pretrained。 |
| Docker镜像 | available | README提供了docker pull命令，Docker Hub上存在多架构镜像。 |
| CI/CD | available | 存在.github/workflows目录和verified标签，表明有持续集成。 |
| MCP配置 | available | .mcp.json文件和文档说明支持MCP代理。 |
| 技能/钩子 | available | .claude/、plugins/等目录暗示了技能系统。 |
| 依赖声明 | available | pyproject.toml、requirements.txt、Cargo.toml均存在。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### Agent Loop

RuView 的边缘模块本质上是一个持续的感知-推理-输出循环。模块运行在ESP32微控制器上，循环从**采集CSI数据**开始：ESP32-S3以固定采样率捕获WiFi子载波的幅度和相位信息。随后**特征提取**通过带通滤波、相位解缠等手段得到呼吸、心跳、运动等信号。紧接着**推理引擎**可能调用小型量化模型（如8KB的对比编码器或脉冲神经网络）产生结构化输出（存在/人数/姿势关键点）。最后**输出阶段**通过MQTT、WebSocket或Home Assistant实体发布结果，并触发联动动作（如告警、记录）。该循环可以完全离线运行，不依赖云服务。

### Tool Interface

系统通过多种接口暴露能力，形成工具调用协议：
- **REST API**：提供`/api/v1/config/dedup-factor`等端点，支持运行时调整参数。
- **MQTT**：原生集成Home Assistant，每个节点发布21个实体（原始信号和语义状态），工具可以直接订阅。
- **MCP代理**：MCP（Model Context Protocol，模型上下文协议）允许外部AI模型以标准方式调用RuView的感知功能，实现“AI观察空间”。
- **WebSocket & asyncio客户端**：Python客户端库`ruview[client]`提供了异步工具调用接口，便于集成到其他Agent框架。
- **Cogs（边缘模块）**：105个预编译模块，每个都可视为一个独立工具，如`occupancy-zones`、`elevator-count`，可直接在边缘运行。

### State / Memory

系统状态由CSI流和向量数据库共同维护：
- **短期状态**：内存中保留最近的CSI帧和信号统计，用于实时滤波和阈值判断。
- **长期记忆**：可选的Cognitum Seed（$140）提供持久化向量存储+近似最近邻（kNN）检索。它能保存环境指纹、历史事件，并支持跨时间段的模式比对。
- **密码学状态链**：所有测量通过Ed25519见证链签名，形成不可篡改的状态历史，增强数据审计和信任。
- **环境自适应**：脉冲神经网络在30秒内适应特定空间，存储了环境的校准参数和射频指纹。

### Planner

未在 README/artifact 说明有独立的规划器模块。系统的决策逻辑主要是信号驱动的反应式规则，而非长时规划。例如：
- 呼吸率提取：固定算法（带通滤波+过零检测BPM）。
- 跌倒检测：相位加速度阈值+帧去抖动。
- 多频段跳频：时分调度，由mesh控制器静态分配时隙。
若将“Cog模块组合”视为一种静态规划，则其并不存在动态任务规划能力。

### Sandbox

边缘模块运行在真实的硬件上，隔离性依赖芯片架构和固件设计，而非软件沙箱。ESP32固件划分为独立任务，但未在README中提及内存隔离或受控执行环境。Cog模块从注册表加载，但签名验证仅通过数字签名保证完整性，未提到运行时权限限制。

### 安全边界

系统实现了多层次安全机制：
- **密码学证明**：每条传感数据都用Ed25519签名，形成不可否认的“见证链”，防止数据在传输或存储中被篡改。
- **本地处理**：无云端依赖，隐私数据不出硬件边界，降低攻击面。
- **硬件信任根**：Cognitum Seed提供硬件级密钥存储和加密运算。
- **固件完整性**：ESP32使用安全启动，Cog二进制文件需通过签名验证才能加载。
- **通信加密**：MQTT over TLS，HTTPS API。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 可以学习到：1) WiFi CSI信号处理流水线，包括相位解缠、子载波选择；2) 如何在超低功耗边缘设备上部署量化模型（8KB）；3) 自监督对比学习在无线感知中的应用；4) 密码学证明链在IoT数据溯源中的设计模式；5) 多协议集成（MQTT/Matter/HAP）的工程实践。 |
| 迁移到 AI-Brief | 可将边端智能、实时传感器数据管道、以及设备原生的MCP工具接口模式迁移到AI-Brief的感知层。 |
| 迁移到 BriefMem | 可借鉴其向量存储+witness chain的持久记忆设计，强化BriefMem的数据可信度和历史重放能力。 |
| 简历故事 | 在面试中可以表述为：主导设计了一个基于廉价WiFi硬件的无接触空间感知系统，采用自监督学习在资源受限设备上实现了实时多人姿态估计，并创新性地引入密码学证明链确保传感器数据完整性。 |

## 风险

- 硬件强依赖：全部高级功能（生命体征、穿墙）均需要ESP32-S3或研究级网卡提供CSI数据，普通WiFi网卡只能做RSSI存在检测，功能受限。
- 环境敏感性：模型性能依赖于特定空间布局和多径特征，在不同环境中可能需要重新校准或微调，否则精度下降。
- 精度声明限制：v2编码器82.3%的准确率是在特定测试条件下测得，实际部署中可能受人群移动、家具变动等影响。
- 安全边界模糊：沙箱隔离机制未明确，若加载恶意Cog模块，可能危及整个节点。
- 工程复杂度高：涉及固件烧录、射频参数调整、多种网络协议配置，对非专业用户门槛较高。

## Memory card

```text
problem_pattern:        在不侵犯隐私的前提下，实现对室内空间持续、低成本、非侵入式的人员感知与健康监测。
architecture_pattern:   射频传感前端（ESP32 CSI采集）→ 信号处理层（带通滤波、相位分析）→ AI推理层（量化对比编码器、SNN）→ 输出分发层（MQTT/REST/Matter）→ 可选安全增强（密码学证明链）。
reusable_pattern:       CSI数据处理流程、自监督对比编码器框架、边缘模型量化策略、通过MCP暴露传感器能力为AI工具的标准模式。
risk_pattern:           硬件耦合度过高，致使其难以直接复用到纯软件系统；模型泛化性受环境因素主导，持续维护成本可能较高。
similar_projects:       未在 README/artifact 说明
```

可复用范式落库:[[concepts/wifi-csi-sensing]]、[[concepts/self-supervised-contrastive-encoder]]。另见 [[content/ruview]]、[[claims/ruview-main-claim]]。
