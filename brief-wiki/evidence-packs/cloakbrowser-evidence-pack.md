---
content: "cloakbrowser"
kind: "evidence-pack"
title: "CloakBrowser — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个在 C++ 源码级修改 Chromium 指纹的 stealth 浏览器，可无缝替换 Playwright/Puppeteer，专门针对反爬虫检测。"
    internal_logic: "### 如何服务 AI Agent\nCloakBrowser 本身不实现 agent 循环，但可作为被 AI agent 调用的浏览器工具。它暴露与 Playwright 完全一致的 API，agent 可直接使用 `page.goto()`、`page.click()` 等方法与网页交互。\n\n#### Agent Loop 集成\n- 外部 agent 在决策循环中调用 CloakBrowser 启动的浏览器实例，通过标准 Page 对象执行动作和获取页面状态。\n- 无内置计划或推理，仅为浏览器自动化提供隐身通道。\n\n#### Tool Interface\n- 通过 `launch()` 返回浏览器对象（Python/JS 均为 Playwright 的 Browser 类型），后续所有操作都通过该对象进行。\n- 支持常用配置：代理、有无头模式、`humanize=True` 等，全部通过参数传递。\n- 可加载 Chrome 扩展（`extension_paths`），实现更复杂的工具扩展。\n\n#### State & Memory\n- 支持 `launch_persistent_context()`，实现持久化用户数据目录（cookies、localStorage 等），跨 session 保留状态，绕过隐身模式检测。\n- 通过随机化指纹种子，每次启动产生不同的浏览器指纹，避免 session 关联。\n- 无共享内存或外部存储抽象。\n\n#### Planner\n未提供规划器。完全依赖外部 agent 或脚本控制流程。\n\n#### Sandbox\n- 浏览器进程本身是操作系统的进程沙盒，但 CloakBrowser 未额外增加隔离层。\n- 代理功能支持通过 HTTP/SOCKS5 代理，可配合网络隔离。\n- 无代码执行环境隔离。\n\n#### 安全边界\n- 核心安全机制是隐身而非访问控制。它隐藏自动化痕迹，但不防止被攻击或防护目标站点。\n- 预编译二进制通过 SHA-256 校验，但未公开构建过程或补丁源码，存在供应链信任风险。\n- 启用 `humanize` 和 `geoip` 时，会向外部服务发起网络请求以获取出口 IP 信息（ipify.org 等），可能暴露特征。"
    failure_mode: "预编译二进制未经源码审计，可能包含未声明的功能或漏洞。"
    source_pointer: "https://github.com/cloakhq/cloakbrowser"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/false/true/MIT/chromium-v146.0.7680.177.5"
experiments: []
claims:
  - "[[claims/cloakbrowser-main-claim]]"
artifacts:
  - "[[artifacts/cloakbrowser-repo]]"
metrics:
  - "stars=23578"
  - "forks=1873"
  - "open_issues=105"
  - "latest_release=chromium-v146.0.7680.177.5"
  - "pushed_at=2026-05-31T20:50:52Z"
baselines: []
failure_modes:
  - "预编译二进制未经源码审计，可能包含未声明的功能或漏洞。"
  - "检测方可能采集 CloakBrowser 的独特指纹，进行针对性拦截。"
  - "依赖 Chromium 升级，补丁可能在新版本中出现兼容性或遗漏。"
  - "使用非自有代理或模拟人类行为可能违反目标网站服务条款。"
missing_details: []
source_pointers:
  - "https://github.com/cloakhq/cloakbrowser"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/cloakbrowser-main-claim]],官方 artifact 落库为 [[artifacts/cloakbrowser-repo]]。See [[content/cloakbrowser]]。
