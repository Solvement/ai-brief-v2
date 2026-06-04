---
content: "cloakbrowser"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "CloakBrowser — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目被 GitHub topics 标记为 ai-agents，README 明确提及与 AI agents 和自动化框架集成，但核心是浏览器隐身工具，定位为 agent_framework 因为它提供了 agent 可用的关键能力。"
  central_contribution: "提供 58 个 C++ 源码补丁的隐身 Chromium 二进制，可在 Playwright/Puppeteer 中即插即用，通过源码级修改实现较高的反检测通过率。"
  inspected:
    - "README.md"
    - "仓库目录结构"
    - "GitHub topics"
    - "artifact audit 信息"
  top_claims:
    - "58 个 C++ 源码补丁修改浏览器指纹。"
    - "reCAPTCHA v3 得分 0.9（人类级别）。"
    - "通过 Cloudflare Turnstile、FingerprintJS、BrowserScan 等 30+ 检测站点。"
  evidence_needed:
    - "源码补丁的具体内容和修改点。"
    - "二进制构建流程和来源验证。"
    - "独立第三方对检测通过率的复测报告。"
  main_threats:
    - "预编译二进制可能包含恶意代码。"
    - "检测方针对 CloakBrowser 二进制建立特征库。"
    - "法律或合规风险。"
  transfer_decision: "可将隐身二进制直接作为 tool 引入 AI 自动化管道，但需补上构建透明度和法律风险评估。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 3
  reuse_value: 5
  maturity: 5
  main_risk: "未公开构建过程的预编译二进制可能引入供应链攻击或特征暴露风险。"
next_actions:
  - "clone-and-run"
  - "write-deepdive"
  - "extract-pattern(source-level-stealth)"
claim_ledger:
  - claim: "CloakBrowser 通过 58 个 C++ 源码补丁修改 Chromium 指纹。"
    plain_english: "在编译前对 Chromium 源代码打了 58 个补丁，直接修改浏览器底层行为。"
    source: "README: \"58 source-level C++ patches\""
    evidence_strength: "medium"
    supports: "声称的 stealth 能力源自底层修改。"
    does_not_support: "补丁内容未公开，无法独立验证。"
    threat: "补丁可能不完整或被夸大。"
  - claim: "reCAPTCHA v3 得分 0.9，被判定为人类。"
    plain_english: "Google 的 reCAPTCHA v3 给这个浏览器的请求打了 0.9 分（人类高分）。"
    source: "README 测试表格及截图"
    evidence_strength: "medium"
    supports: "浏览器伪装程度高，能达到人类级别。"
    does_not_support: "仅提供了截图，无实时验证或脚本复现。"
    threat: "测试环境可能特殊，或仅在某个时间点有效。"
  - claim: "可无感通过 Cloudflare Turnstile 等 30+ 检测站点。"
    plain_english: "能自动解决 Cloudflare Turnstile 非交互式挑战，并在多个反爬检测网站上未被标记为 bot。"
    source: "README 测试表格和截图"
    evidence_strength: "medium"
    supports: "广泛的反检测覆盖。"
    does_not_support: "具体测试站点和条件未列出，无法重现。"
    threat: "可能只对特定网站配置有效。"
  - claim: "即插即用 Playwright/Puppeteer 替代品。"
    plain_english: "只需将 import 从 Playwright 改为 CloakBrowser，剩余代码无需修改。"
    source: "README 迁移 diff 示例"
    evidence_strength: "high"
    supports: "API 完全兼容。"
    does_not_support: "未对所有 Playwright 功能进行兼容性声明。"
    threat: "部分高级功能或插件可能失效。"
artifact_audit:
  official_repo: "https://github.com/CloakHQ/CloakBrowser"
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

**一个在 C++ 源码级修改 Chromium 指纹的 stealth 浏览器，可无缝替换 Playwright/Puppeteer，专门针对反爬虫检测。**

> 一句话:它不解决验证码，它不让验证码出现。

## 为什么火

- 爬虫工程师和 AI agent 开发者普遍面临反爬检测，CloakBrowser 提供了源码级绕过方案，无需折腾 JS 注入或配置补丁。
- 与 Playwright/Puppeteer API 100% 兼容，迁移成本极低，只需更改 import。
- 免费开源并持续维护，无订阅，无使用限制。
- 近期在反检测测试中取得 reCAPTCHA v3 0.9、通过 Cloudflare Turnstile 等亮眼成绩，社区关注度高。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | README 长达 14000 字符，详细说明用法、原理和测试结果。 |
| tests/ | available | 仓库包含 tests 目录，有测试文件。 |
| examples/ | available | 仓库包含 examples 目录，提供使用示例。 |
| LICENSE | available | 使用 MIT 许可证。 |
| pyproject.toml | available | Python 包管理配置文件。 |
| Dockerfile | available | 提供 Docker 镜像构建文件，可快速试用。 |
| 补丁源码 | not_found | 未在仓库中提供 C++ 补丁文件或构建过程。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 如何服务 AI Agent
CloakBrowser 本身不实现 agent 循环，但可作为被 AI agent 调用的浏览器工具。它暴露与 Playwright 完全一致的 API，agent 可直接使用 `page.goto()`、`page.click()` 等方法与网页交互。

#### Agent Loop 集成
- 外部 agent 在决策循环中调用 CloakBrowser 启动的浏览器实例，通过标准 Page 对象执行动作和获取页面状态。
- 无内置计划或推理，仅为浏览器自动化提供隐身通道。

#### Tool Interface
- 通过 `launch()` 返回浏览器对象（Python/JS 均为 Playwright 的 Browser 类型），后续所有操作都通过该对象进行。
- 支持常用配置：代理、有无头模式、`humanize=True` 等，全部通过参数传递。
- 可加载 Chrome 扩展（`extension_paths`），实现更复杂的工具扩展。

#### State & Memory
- 支持 `launch_persistent_context()`，实现持久化用户数据目录（cookies、localStorage 等），跨 session 保留状态，绕过隐身模式检测。
- 通过随机化指纹种子，每次启动产生不同的浏览器指纹，避免 session 关联。
- 无共享内存或外部存储抽象。

#### Planner
未提供规划器。完全依赖外部 agent 或脚本控制流程。

#### Sandbox
- 浏览器进程本身是操作系统的进程沙盒，但 CloakBrowser 未额外增加隔离层。
- 代理功能支持通过 HTTP/SOCKS5 代理，可配合网络隔离。
- 无代码执行环境隔离。

#### 安全边界
- 核心安全机制是隐身而非访问控制。它隐藏自动化痕迹，但不防止被攻击或防护目标站点。
- 预编译二进制通过 SHA-256 校验，但未公开构建过程或补丁源码，存在供应链信任风险。
- 启用 `humanize` 和 `geoip` 时，会向外部服务发起网络请求以获取出口 IP 信息（ipify.org 等），可能暴露特征。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习到源码级浏览器指纹对抗技术，理解仅仅 JS 注入或配置修改的局限性。 |
| 迁移到 AI-Brief | 在 AI-Brief 的数据采集中，可集成 CloakBrowser 作为浏览器工具，大幅提高反爬虫站点的抓取成功率。 |
| 迁移到 BriefMem | 为 BriefMem 的记忆系统提供稳定的网页内容获取通道，尤其适用于需要登录或高反爬的网站。 |
| 简历故事 | 简历中可体现：深入理解并应用先进的浏览器反检测方案，成功集成 CloakBrowser 提升自动化流程的鲁棒性。 |

## 风险

- 预编译二进制未经源码审计，可能包含未声明的功能或漏洞。
- 检测方可能采集 CloakBrowser 的独特指纹，进行针对性拦截。
- 依赖 Chromium 升级，补丁可能在新版本中出现兼容性或遗漏。
- 使用非自有代理或模拟人类行为可能违反目标网站服务条款。

## Memory card

```text
problem_pattern:        网页抓取或自动化操作被反爬虫/反自动化系统检测并拦截。
architecture_pattern:   通过修改浏览器引擎源码来消除自动化特征，并封装为与主流自动化工具兼容的轻量级 API。
reusable_pattern:       即插即用的 Playwright 替代，零侵入式迁移，同时提供多种 anti-detection 策略（代理、地理匹配、人性化模拟）。
risk_pattern:           依赖非透明的预编译二进制，信任边界模糊，且可能引入法律合规风险。
similar_projects:       undetected-chromedriver, playwright-stealth, Camoufox, puppeteer-extra
```

可复用范式落库:[[concepts/source-level-stealth]]、[[concepts/humanize]]。另见 [[content/cloakbrowser]]、[[claims/cloakbrowser-main-claim]]。
