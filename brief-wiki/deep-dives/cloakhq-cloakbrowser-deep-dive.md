---
content: "cloakhq-cloakbrowser"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "library_sdk"
title: "CloakBrowser — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "CloakHQ/CloakBrowser：GitHub 描述为“Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches. 30/30 tests passed”。"
  what_it_does: "Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches. 30/30 tests passed."
  metadata:
    language: "Python"
    total_stars: "24836"
    stars_in_period: "22732"
    author: "CloakHQ"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "cli"
    - "deep"
  pain_point: "人话：它值得看，不是因为 README 里自称“passes every bot detection test”，而是因为 repo 里确实有一套完整包装：自动下载二进制、校验 SHA-256、按平台选择 Chromium 版本、生成 fingerprint seed、改写 Playwright 默认参数、支持 `cloakserve` CDP 多路复用、还给 browser-use/Crawl4AI/AWS Lambda 留了集成示例。技术词：这是“patched browser binary + thin SDK wrapper + CDP bridge”的组合，而不是单纯 JS 注入脚本。（来源：README How It Works；cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_default_stealth_args；bin/cloakserve；examples/integrations/browser_use_example.py）"
  core_capabilities:
    - "二进制获取契约"
    - "启动参数去重器"
    - "CDP 多路复用与身份隔离"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向判断要分两层： 1. Stock Playwright：差异维度是浏览器二进制与启动参数。CloakBrowser 的 Python/JS wrapper 都把 Playwright 指向 CloakHQ binary，并屏蔽 `--enable-automation`、`--enable-unsafe-swiftshader`；普通 Playwright 更适合 QA、端到端测试、低风险自动化，因为上游成熟、无额外二进制许可负担。做 AI 浏览器 Agent 且目标站点会因 automation fingerprint 挑战时，再考虑 CloakBrowser。（来源：cloakbrowser/browser.py launch；pyproject.toml dependencies） 2. Puppeteer：差异维度是集成路径。CloakBrowser 的 JS 包导出 `./puppeteer`，内部用 `puppeteer-core` 加 `executablePath: binaryPath` 启动，并支持 proxy auth fallback 和 humanize patch；如果现有代码是 Puppeteer，可用该入口；如果新项目需要 Python 或 Playwright context API，Playwright 入口更直接。（来源：js/package.json exports；js/src/puppeteer.ts） 3. Selenium / undetected-chromedriver：差异维度是 driver 生态。repo 里有 `examples/integrations/selenium_example.py` 和 `undetected_chromedriver.py`，都用 `ensure_binary()` + `get_default_stealth_args()` 给 Selenium/uc 提供 CloakBrowser binary。README 对 undetected-chromedriver 的“config patches / Selenium / sometimes / stale”等比较属于自称，未独立验证；已有 Selenium 栈可复用这些示例，新项目若要 browser-use/Crawl4AI/CDP 连接，CloakBrowser 的 Playwright/CDP 路径更贴合。（来源：examples/integrations/selenium_example.py；examples/integrations/undetected_chromedriver.py；README Comparison） 4. Camoufox：README 自称差异是 Firefox vs Chromium，并说 Camoufox 是 Firefox C++ patch、CloakBrowser 是 Chromium C++ patch；本次未检查 Camoufox 上游，按未验证处理。需要 Firefox 指纹或 Firefox API 生态时选 Camoufox；需要 Chromium、Chrome TLS/UA 形态、Playwright/Puppeteer 生态时 CloakBrowser 更匹配。（来源：README Comparison/FAQ，自称未独立核验）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "真实流程示例：`examples/basic.py` 写的是 `from cloakbrowser import launch`，然后 `browser = launch(headless=False)`，`page = browser.new_page()`，`page.goto(\"https://example.com\")`，最后 `browser.close()`。（来源：examples/basic.py） 调用进入 `cloakbrowser/browser.py launch()` 后，第一步是 `ensure_binary()`。它先看 `CLOAKBROWSER_BINARY_PATH`，没有本地 override 就用 `get_platform_tag()`、`get_effective_version()` 找缓存路径；Windows 目标是 `~/.cloakbrowser/chromium-<version>/chrome.exe`，Linux 是 `chrome`，macOS 是 `Chromium.app/Contents/MacOS/Chromium`。（来源：cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_binary_path） 如果缓存没有二进制，`_download_and_extract()` 先从 `https://cloakbrowser.dev/chromium-v<version>/cloakbrowser-<platform>.<ext>` 下载，失败时 fallback 到 GitHub Releases；下载后默认读取 `SHA256SUMS` 校验，tar/zip 解压有 path traversal 检查，macOS 还会运行 `xattr -cr` 去掉 quarantine。（来源：cloakbrowser/download.py _download_and_extract/_verify_download_checksum/_extract_tar/_extract_zip） 拿到二进制路径后，`launch()` 会处理 proxy/geoip/webrtc，再调用 `build_args()`。默认参数来自 `get_default_stealth_args()`：随机 `--fingerprint=<10000..99999>`，再加平台 profile；`build_args()` 去重规则是“stealth defaults < user args < dedicated timezone/locale params”，所以用户传 `--fingerprint=99887` 会覆盖随机 seed，`timezone=\"America/New_York\"` 会覆盖已有 `--fingerprint-timezone`。（来源：cloakbrowser/config.py get_default_stealth_args；cloakbrowser/browser.py build_args；tests/test_build_args.py） 最后它启动 Playwright：`pw.chromium.launch(executable_path=binary_path, headless=headless, args=chrome_args, ignore_default_args=[\"--enable-automation\", \"--enable-unsafe-swiftshader\"], ...)`。这就是“同 API，不同浏览器二进制”的核心机制。（来源：cloakbrowser/browser.py launch；cloakbrowser/config.py IGNORE_DEFAULT_ARGS） 另一个实际流是 Docker/CDP：README 给出 `docker run -d --name cloak -p 127.0.0.1:9222:9222 cloakhq/cloakbrowser cloakserve`，然后 `curl http://localhost:9222/json/version?fingerprint=11111` 会返回经过 `cloakserve` 重写的 WebSocket URL。`bin/cloakserve` 的 `ChromePool.get_or_launch()` 为每个 seed 分配 `BASE_CDP_PORT = 5100` 起的本地端口和 `user_data_dir`，并把 query 参数转成 `--fingerprint-*` flags。（来源：README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params）"
  essential_design_difference: "这些模式比“反检测”本身更容易复用到一般 AI 工程。 - 二进制获取契约；把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。；如果你的工具只依赖普通 Python/Node 包，不分发大二进制，就不要引入这套复杂度。；AI 工具经常需要浏览器、OCR engine、FFmpeg、model runtime；这个 repo 展示了如何把大二进制做成 SDK 的一部分。（来源：cloakbrowser/download.py；cloakbrowser/config.py） - 启动参数去重器；`build_args()` 用 flag key 去重，并明确优先级：默认值、用户 args、显式参数。这个模式适合任何需要组合 CLI flags 的 agent runtime。；如果参数顺序本身有语义，不能简单按 `=` 左侧去重。；避免同一 flag 同时出现两个值，减少“配置看起来传了但实际被覆盖”的调试成本。（来源：cloakbrowser/browser.py build_args；tests/test_build_args.py） - CDP 多路复用与身份隔离；`cloakserve` 用 query seed 路由到不同 Chrome process，并把 `/json/version` 的 `webSocketDebuggerUrl` 改写为公开入口；这个模式可用于多租户 browser worker。；如果没有认证、配额、隔离、审计，不要把 CDP 暴露给不可信用户。；浏览器 Agent 服务常要给每个任务独立 profile/fingerprint/session；per-seed pool 是一个可复用骨架。（来源：bin/cloakserve；README Docker CDP server mode） - 人类行为层作为可选 patch；把行为模拟做成 `humanize=True`，默认关闭；配置集中在 dataclass，支持 preset 和 per-call override。；不要把这种 monkey patch 混进核心业务 API；它会改变时序和错误路径。；许多浏览器 Agent 需要“慢而自然”的输入行为，但不应污染基础浏览器控制层。（来源：cloakbrowser/human/config.py；cloakbrowser/human/__init__.py；tests/test_humanize_unit.py） - 安全边界测试写进示例；AWS Lambda 示例把 URL scheme、SSRF、redirect revalidation、caller-controlled flags removal 写进 handler，并有 `tests/test_lambda_security.py`。；不要把示例当生产系统；README 自己也说需要认证层。；浏览器即网络访问器；给 Agent 开网页能力时，SSRF 和本地文件访问是第一风险。（来源：examples/integrations/aws_lambda/INSTRUCTIONS.md；tests/test_lambda_security.py）"
  practitioner_meaning: "结论：对 AI 浏览器 Agent、爬虫、自动化采集工程师，CloakBrowser 值得 clone-and-run，但不要把 README 的检测分数当事实。它的工程价值在 wrapper 设计、binary distribution、CDP multiplexer、humanize 行为层和安全示例；核心反检测能力依赖不可直接审计的 patched Chromium binary。下一步应在授权目标、固定代理、明确平台上跑 `examples/basic.py`、`examples/stealth_test.py --no-screenshots` 或自己的 smoke test，并检查 binary license 是否允许你的分发/服务模式。（来源：README Examples/Test Results/License；BINARY-LICENSE.md；examples/*；bin/cloakserve）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "CloakBrowser 是一个 Python/JavaScript 浏览器自动化 SDK，用 Playwright/Puppeteer 风格 API 启动 CloakHQ 自己分发的 patched Chromium 二进制，并把 fingerprint、proxy、GeoIP、humanize、CDP server 等反检测相关配置封装成启动参数。"
    body_md: "人话：它不是新的 Agent 框架，而是给浏览器 Agent、爬虫、自动化测试换一颗浏览器内核；调用方仍然写 `launch()`、`page.goto()`、`browser.close()`。技术词：`pyproject.toml` 声明 Python 包 `cloakbrowser`、入口 `cloakbrowser = cloakbrowser.__main__:main`，依赖 `playwright>=1.40` 和 `httpx>=0.24`；`js/package.json` 声明 npm 包 `cloakbrowser` 版本 `0.3.31`，导出 Playwright、Puppeteer、human 模块，并要求 Node `>=20.0.0`。（来源：pyproject.toml project/project.scripts/dependencies；js/package.json exports/engines）"
  why_worth_attention:
    summary: ""
    body_md: "人话：它值得看，不是因为 README 里自称“passes every bot detection test”，而是因为 repo 里确实有一套完整包装：自动下载二进制、校验 SHA-256、按平台选择 Chromium 版本、生成 fingerprint seed、改写 Playwright 默认参数、支持 `cloakserve` CDP 多路复用、还给 browser-use/Crawl4AI/AWS Lambda 留了集成示例。技术词：这是“patched browser binary + thin SDK wrapper + CDP bridge”的组合，而不是单纯 JS 注入脚本。（来源：README How It Works；cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_default_stealth_args；bin/cloakserve；examples/integrations/browser_use_example.py）"
    bullets:
      - "已核实：Python 入口 `launch()` 调用 `ensure_binary()`，然后把 `executable_path=binary_path` 传给 `pw.chromium.launch()`，并设置 `ignore_default_args=IGNORE_DEFAULT_ARGS`。（来源：cloakbrowser/browser.py launch）"
      - "已核实：默认 stealth args 至少包含 `--no-sandbox`、随机 `--fingerprint=10000..99999`、以及平台 profile：macOS 用 `--fingerprint-platform=macos`，Linux/Windows 用 `--fingerprint-platform=windows`。（来源：cloakbrowser/config.py get_default_stealth_args）"
      - "自称：README 写 `58 source-level C++ patches`、`0.9 reCAPTCHA v3 score`、`Tested against 30+ detection sites`；repo 没有 Chromium patch 源码，只有 wrapper、tests、examples、下载逻辑和二进制许可。（来源：README Test Results；BINARY-LICENSE.md；repo tree）"
      - "已核实：Dockerfile 会安装 Python wrapper、构建 JS wrapper、执行 `python -c \"from cloakbrowser import ensure_binary; ensure_binary()\"` 预下载二进制，并提供 `cloaktest`、`cloakserve` 快捷命令。（来源：Dockerfile）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README/营销说法和代码可核实事实分开。凡是 live benchmark、通过检测站点、patch 数量、性能数字，没有本次实际运行验证的，都按“自称”。"
    items:
      - claim: "“Drop-in Playwright/Puppeteer replacement for Python and JavaScript”。"
        plain_english: "人话：用户把原来的 Playwright/Puppeteer 启动入口替换成 CloakBrowser 的 `launch()`，后续仍用熟悉的 page/browser API。技术词：wrapper 将自定义 `executable_path`/`executablePath` 注入到 Playwright/Puppeteer launch options。"
        source: "README Quickstart；cloakbrowser/browser.py launch；js/src/playwright.ts launch；js/src/puppeteer.ts launch"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Python `launch()` 返回 Playwright Browser；JS `launch()` 从 `playwright-core` 导入 `chromium` 并调用 `chromium.launch(await buildLaunchOptions(options))`；Puppeteer 版本调用 `puppeteer.default.launch({ executablePath: binaryPath, ... })`。"
        does_not_support: "不证明所有 Playwright/Puppeteer API 100% 等价，也不证明所有目标网站都可用。"
        threat: "Playwright 或 Puppeteer 上游 API 变化、CDP 行为变化、浏览器二进制版本不匹配会破坏兼容性。"
      - claim: "“Auto-downloading binary / auto-updating binary”。"
        plain_english: "人话：第一次运行时它会找缓存，没有就下载；之后会按间隔检查更新。技术词：`ensure_binary()` 使用 cache marker、platform tag、release API 和 SHA256SUMS。"
        source: "cloakbrowser/download.py ensure_binary/check_for_update/_maybe_trigger_update_check；cloakbrowser/config.py get_download_url/get_fallback_download_url"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`DOWNLOAD_BASE_URL` 默认为 `https://cloakbrowser.dev`，fallback 为 GitHub Releases；`UPDATE_CHECK_INTERVAL = 3600`；下载后 `_verify_download_checksum()` 读取 `SHA256SUMS`；`CLOAKBROWSER_BINARY_PATH` 可跳过下载。"
        does_not_support: "不证明远端二进制始终可下载，也不证明每个 release 都有每个平台资产。"
        threat: "cloakbrowser.dev、GitHub Releases、SHA256SUMS、平台资产缺失都会影响安装；`CLOAKBROWSER_SKIP_CHECKSUM=true` 会降低供应链保障。"
      - claim: "“58 source-level C++ patches”。"
        plain_english: "人话：README 说浏览器指纹不是靠 JS 注入，而是编译进 Chromium 的 C++ patch。技术词：这属于 binary-level fingerprint patch，而 wrapper 只负责启动参数和下载。"
        source: "README Latest/Test Results/How It Works；CHANGELOG.md 0.3.30；repo tree"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 和 CHANGELOG 写 Linux x64 + Windows x64 build `146.0.7680.177.5` 有 `58 source-level fingerprint patches`；`config.py`/`js/src/config.ts` 平台版本表也写 Linux x64、Windows x64 为 `146.0.7680.177.5`。"
        does_not_support: "repo tree 未包含 Chromium patch 源码或 patch 列表，无法逐项核验“58”或 patch 内容。"
        threat: "核心差异在闭源/不可直接审计的二进制 patch；安全、合规、可维护性都依赖 CloakHQ 发布流程。"
      - claim: "“0.9 reCAPTCHA v3 score / passes Cloudflare Turnstile / tested against 30+ detection sites”。"
        plain_english: "人话：这是 README 的检测结果表，不是本次复测结果。技术词：这些是 live anti-bot benchmark claims。"
        source: "README Test Results；examples/stealth_test.py；tests/test_stealth.py"
        attribution: "自称"
        evidence_strength: "low"
        supports: "README 表格列出 reCAPTCHA v3 `0.9`、BrowserScan `NORMAL (4/4)`、bot.incolumitas.com `1 fail`、deviceandbrowserinfo.com `0 true flags`；`examples/stealth_test.py` 确实写了访问 bot.sannysoft、bot.incolumitas、BrowserScan、FingerprintJS、Google reCAPTCHA demo 的脚本。"
        does_not_support: "本次未运行 live detection；repo 脚本存在不等于结果持续有效。"
        threat: "反检测是对抗场景，检测站点、浏览器版本、IP 声誉、代理、headless/headed 模式都会改变结果。"
      - claim: "`humanize=True` 会替换鼠标、键盘、滚动行为。"
        plain_english: "人话：开这个 flag 后，它会把一些 Playwright 页面方法包一层，让点击、输入、滚动慢一点、更像人。技术词：monkey patch Page/Context/Browser methods，并用 `HumanConfig` 控制 timing、overshoot、scroll 等参数。"
        source: "README Human Behavior；cloakbrowser/browser.py launch humanize block；cloakbrowser/human/config.py HumanConfig；cloakbrowser/human/__init__.py patch_browser/patch_page"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`HumanConfig` 默认 `typing_delay=70`、`mouse_min_steps=25`、`mouse_max_steps=80`、`mouse_overshoot_chance=0.15`、`scroll_delta_base=(80,130)`；`careful` preset 改为更慢配置；`patch_browser()`/`patch_context()`/`patch_page()` 会替换 click/type/fill/scroll 等路径。"
        does_not_support: "不证明 humanize 行为一定能骗过行为检测，也不证明不会拖慢业务流程。"
        threat: "monkey patch 会影响 API 语义、超时预算和调试；复杂页面、iframe、ElementHandle 行为需要更多回归测试。"
      - claim: "`geoip=True` 从代理出口 IP 自动匹配 timezone/locale，并可注入 WebRTC IP。"
        plain_english: "人话：给代理时，它会尝试查代理出口在哪里，然后把浏览器时区、语言和 WebRTC IP 对齐。技术词：GeoIP database + proxy exit IP echo + `--fingerprint-timezone`/`--fingerprint-locale`/`--fingerprint-webrtc-ip` flags。"
        source: "README API launch；cloakbrowser/geoip.py；cloakbrowser/browser.py maybe_resolve_geoip/_resolve_webrtc_args；tests/test_proxy.py TestMaybeResolveGeoip"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "GeoIP DB URL 为 `https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb`，文件名 `GeoLite2-City.mmdb`，更新间隔 `30 * 86_400`；IP echo 服务包括 `api.ipify.org`、`checkip.amazonaws.com`、`ifconfig.me/ip`；默认 timeout `5.0` 秒。"
        does_not_support: "不证明 GeoIP 数据准确，也不证明每个代理都支持该探测。"
        threat: "依赖第三方 GeoIP mirror、IP echo 服务、代理网络；SOCKS5 需要 `socksio`，缺依赖会失败或降级。"
      - claim: "`cloakserve` 提供 CDP server mode 和 per-connection fingerprint seeds。"
        plain_english: "人话：它能在一个端口上接多个 CDP 连接，不同 `fingerprint` query 对应不同 Chrome 进程。技术词：CDP multiplexer：`/json/version?fingerprint=11111` 重写 `webSocketDebuggerUrl` 到 `/fingerprint/11111/devtools/browser/...`。"
        source: "README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params/handle_json_version；tests/test_cloakserve.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`SAFE_SEED_RE = ^[A-Za-z0-9_-]{1,128}$`；query 参数 `platform=windows` 会映射到 `--fingerprint-platform=windows`；`GET /` 返回 active processes、PIDs、ports、connection counts；WebSocket Origin guard 拒绝不可信浏览器 origin。"
        does_not_support: "不证明公网暴露安全；README 也明确 CDP 可执行 JS、读页面、访问文件，不应无认证公开。"
        threat: "CDP 是高权限接口；反向代理、Host/X-Forwarded-*、origin guard、认证缺失都会变成安全边界问题。"
  how_it_works:
    summary: ""
    body_md: "真实流程示例：`examples/basic.py` 写的是 `from cloakbrowser import launch`，然后 `browser = launch(headless=False)`，`page = browser.new_page()`，`page.goto(\"https://example.com\")`，最后 `browser.close()`。（来源：examples/basic.py）\n\n调用进入 `cloakbrowser/browser.py launch()` 后，第一步是 `ensure_binary()`。它先看 `CLOAKBROWSER_BINARY_PATH`，没有本地 override 就用 `get_platform_tag()`、`get_effective_version()` 找缓存路径；Windows 目标是 `~/.cloakbrowser/chromium-<version>/chrome.exe`，Linux 是 `chrome`，macOS 是 `Chromium.app/Contents/MacOS/Chromium`。（来源：cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_binary_path）\n\n如果缓存没有二进制，`_download_and_extract()` 先从 `https://cloakbrowser.dev/chromium-v<version>/cloakbrowser-<platform>.<ext>` 下载，失败时 fallback 到 GitHub Releases；下载后默认读取 `SHA256SUMS` 校验，tar/zip 解压有 path traversal 检查，macOS 还会运行 `xattr -cr` 去掉 quarantine。（来源：cloakbrowser/download.py _download_and_extract/_verify_download_checksum/_extract_tar/_extract_zip）\n\n拿到二进制路径后，`launch()` 会处理 proxy/geoip/webrtc，再调用 `build_args()`。默认参数来自 `get_default_stealth_args()`：随机 `--fingerprint=<10000..99999>`，再加平台 profile；`build_args()` 去重规则是“stealth defaults < user args < dedicated timezone/locale params”，所以用户传 `--fingerprint=99887` 会覆盖随机 seed，`timezone=\"America/New_York\"` 会覆盖已有 `--fingerprint-timezone`。（来源：cloakbrowser/config.py get_default_stealth_args；cloakbrowser/browser.py build_args；tests/test_build_args.py）\n\n最后它启动 Playwright：`pw.chromium.launch(executable_path=binary_path, headless=headless, args=chrome_args, ignore_default_args=[\"--enable-automation\", \"--enable-unsafe-swiftshader\"], ...)`。这就是“同 API，不同浏览器二进制”的核心机制。（来源：cloakbrowser/browser.py launch；cloakbrowser/config.py IGNORE_DEFAULT_ARGS）\n\n另一个实际流是 Docker/CDP：README 给出 `docker run -d --name cloak -p 127.0.0.1:9222:9222 cloakhq/cloakbrowser cloakserve`，然后 `curl http://localhost:9222/json/version?fingerprint=11111` 会返回经过 `cloakserve` 重写的 WebSocket URL。`bin/cloakserve` 的 `ChromePool.get_or_launch()` 为每个 seed 分配 `BASE_CDP_PORT = 5100` 起的本地端口和 `user_data_dir`，并把 query 参数转成 `--fingerprint-*` flags。（来源：README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params）"
  reusable_abstractions:
    summary: ""
    body_md: "这些模式比“反检测”本身更容易复用到一般 AI 工程。"
    items:
      - name: "二进制获取契约"
        copy: "把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。"
        skip: "如果你的工具只依赖普通 Python/Node 包，不分发大二进制，就不要引入这套复杂度。"
        why_it_matters: "AI 工具经常需要浏览器、OCR engine、FFmpeg、model runtime；这个 repo 展示了如何把大二进制做成 SDK 的一部分。（来源：cloakbrowser/download.py；cloakbrowser/config.py）"
      - name: "启动参数去重器"
        copy: "`build_args()` 用 flag key 去重，并明确优先级：默认值、用户 args、显式参数。这个模式适合任何需要组合 CLI flags 的 agent runtime。"
        skip: "如果参数顺序本身有语义，不能简单按 `=` 左侧去重。"
        why_it_matters: "避免同一 flag 同时出现两个值，减少“配置看起来传了但实际被覆盖”的调试成本。（来源：cloakbrowser/browser.py build_args；tests/test_build_args.py）"
      - name: "CDP 多路复用与身份隔离"
        copy: "`cloakserve` 用 query seed 路由到不同 Chrome process，并把 `/json/version` 的 `webSocketDebuggerUrl` 改写为公开入口；这个模式可用于多租户 browser worker。"
        skip: "如果没有认证、配额、隔离、审计，不要把 CDP 暴露给不可信用户。"
        why_it_matters: "浏览器 Agent 服务常要给每个任务独立 profile/fingerprint/session；per-seed pool 是一个可复用骨架。（来源：bin/cloakserve；README Docker CDP server mode）"
      - name: "人类行为层作为可选 patch"
        copy: "把行为模拟做成 `humanize=True`，默认关闭；配置集中在 dataclass，支持 preset 和 per-call override。"
        skip: "不要把这种 monkey patch 混进核心业务 API；它会改变时序和错误路径。"
        why_it_matters: "许多浏览器 Agent 需要“慢而自然”的输入行为，但不应污染基础浏览器控制层。（来源：cloakbrowser/human/config.py；cloakbrowser/human/__init__.py；tests/test_humanize_unit.py）"
      - name: "安全边界测试写进示例"
        copy: "AWS Lambda 示例把 URL scheme、SSRF、redirect revalidation、caller-controlled flags removal 写进 handler，并有 `tests/test_lambda_security.py`。"
        skip: "不要把示例当生产系统；README 自己也说需要认证层。"
        why_it_matters: "浏览器即网络访问器；给 Agent 开网页能力时，SSRF 和本地文件访问是第一风险。（来源：examples/integrations/aws_lambda/INSTRUCTIONS.md；tests/test_lambda_security.py）"
  dependency_platform_risk:
    summary: ""
    body_md: "这个项目的风险不只在 Python/JS wrapper，而在“下载并运行专有 patched Chromium binary”。"
    items:
      - dependency: "CloakHQ patched Chromium binary"
        what_if_change: "如果 binary release 缺失、patch 失效、检测站点适配、或 license 改变，核心价值会下降。"
        exposure: "high"
        mitigation_or_unknown: "可用 `CLOAKBROWSER_BINARY_PATH` 指向本地 binary，但 repo 未提供 Chromium patch 源码；具体 58 patches 无法从 tree 复现。"
        source: "BINARY-LICENSE.md；cloakbrowser/download.py ensure_binary；repo tree"
      - dependency: "cloakbrowser.dev 与 GitHub Releases"
        what_if_change: "主下载源不可用时 fallback GitHub Releases；两者都不可用则首次安装失败。"
        exposure: "medium"
        mitigation_or_unknown: "`CLOAKBROWSER_DOWNLOAD_URL` 可改自定义源，但自定义源会禁用 GitHub fallback；可用 `CLOAKBROWSER_BINARY_PATH`。"
        source: "cloakbrowser/config.py DOWNLOAD_BASE_URL/GITHUB_DOWNLOAD_BASE_URL；cloakbrowser/download.py _download_and_extract"
      - dependency: "Playwright / puppeteer-core"
        what_if_change: "上游 launch options、context API、CDP 行为变化会影响 wrapper 兼容。"
        exposure: "medium"
        mitigation_or_unknown: "Python 依赖 `playwright>=1.40`；JS peer dependency 为 `playwright-core>=1.53.0`、`puppeteer-core>=21.0.0`，并在 devDeps pin 了 `playwright-core` `1.60`。"
        source: "pyproject.toml dependencies；js/package.json peerDependencies/devDependencies"
      - dependency: "GeoIP mirror and IP echo services"
        what_if_change: "GeoLite2-City.mmdb 下载失败、IP echo 被代理阻断、GeoIP 不准确，会导致 timezone/locale/WebRTC IP 对齐失败或降级。"
        exposure: "medium"
        mitigation_or_unknown: "默认 GeoIP timeout `5.0` 秒；失败时返回 None 并继续；用户可手动传 `timezone`/`locale`/`--fingerprint-webrtc-ip`。"
        source: "cloakbrowser/geoip.py；cloakbrowser/browser.py maybe_resolve_geoip"
      - dependency: "Binary license"
        what_if_change: "wrapper 是 MIT，但 binary 禁止 redistributing/resell/repackage，SaaS/OEM 需要单独许可。"
        exposure: "high"
        mitigation_or_unknown: "内部使用免费；如果把它打包给第三方客户或做 browser-as-a-service，需要联系 CloakHQ。"
        source: "LICENSE；BINARY-LICENSE.md Grant of Use/Restrictions/Cloud, Container & Integration Use"
      - dependency: "Windows / Python 3.14 local test environment"
        what_if_change: "本地 selected unit tests 在 Windows 下出现路径分隔符、tarfile symlink、executable bit 相关失败。"
        exposure: "low"
        mitigation_or_unknown: "本次运行 `python -m pytest tests/test_config.py tests/test_build_args.py tests/test_proxy.py tests/test_extract.py tests/test_cloakserve.py -q` 得到 `202 passed, 1 skipped, 6 failed`；未运行 live browser tests。"
        source: "本地 pytest run 2026-06-08"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点不能从 README/docs/tree 直接确认。"
    items:
      - "Chromium patch 源码、完整 patch 列表、每个 patch 对应检测向量：未在 repo tree 说明；README/CHANGELOG 的 `58` 按自称处理。"
      - "README benchmark 是否在 2026-06-08 仍成立：本次未运行 live detection sites，也未下载/启动 patched Chromium binary。"
      - "各平台实际二进制质量：配置写 Linux x64/Windows x64 为 `146.0.7680.177.5`，Linux arm64 为 `146.0.7680.177.3`，macOS arm64/x64 为 `145.0.7632.109.2`；本次未逐平台验证。"
      - "合法使用边界：README FAQ 与 BINARY-LICENSE 禁止非法使用和部分高风险场景，但具体目标站点 ToS/授权需要用户自己确认。"
      - "CloakBrowser Manager 是另一个 repo；这里只看到 README 提到 `cloakhq/cloakbrowser-manager` Docker 命令，未检查该 upstream。"
      - "本地 selected unit tests 有 6 个失败，主要暴露 Windows/Python 3.14 环境兼容测试问题；这不等同于产品不可运行，但需要上游确认。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "结论：对 AI 浏览器 Agent、爬虫、自动化采集工程师，CloakBrowser 值得 clone-and-run，但不要把 README 的检测分数当事实。它的工程价值在 wrapper 设计、binary distribution、CDP multiplexer、humanize 行为层和安全示例；核心反检测能力依赖不可直接审计的 patched Chromium binary。下一步应在授权目标、固定代理、明确平台上跑 `examples/basic.py`、`examples/stealth_test.py --no-screenshots` 或自己的 smoke test，并检查 binary license 是否允许你的分发/服务模式。（来源：README Examples/Test Results/License；BINARY-LICENSE.md；examples/*；bin/cloakserve）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\cloakhq-cloakbrowser\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\cloakhq-cloakbrowser\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\cloakhq-cloakbrowser\\codex-last-message.json"
  invoked_at: "2026-06-08T14:55:46.571Z"
  completed_at: "2026-06-08T15:00:05.480Z"
  repo: "CloakHQ/CloakBrowser"
reasoning_trace:
  paper_type_decision: "project_type = library_sdk; evidence from README/artifactAudit only."
  central_contribution: "Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches. 30/30 tests passed."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“Drop-in Playwright/Puppeteer replacement for Python and JavaScript”。"
    - "“Auto-downloading binary / auto-updating binary”。"
    - "“58 source-level C++ patches”。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "BINARY-LICENSE.md；cloakbrowser/download.py ensure_binary；repo tree"
    - "cloakbrowser/config.py DOWNLOAD_BASE_URL/GITHUB_DOWNLOAD_BASE_URL；cloakbrowser/download.py _download_and_extract"
    - "pyproject.toml dependencies；js/package.json peerDependencies/devDependencies"
    - "cloakbrowser/geoip.py；cloakbrowser/browser.py maybe_resolve_geoip"
    - "LICENSE；BINARY-LICENSE.md Grant of Use/Restrictions/Cloud, Container & Integration Use"
    - "本地 pytest run 2026-06-08"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "结论：对 AI 浏览器 Agent、爬虫、自动化采集工程师，CloakBrowser 值得 clone-and-run，但不要把 README 的检测分数当事实。它的工程价值在 wrapper 设计、binary distribution、CDP multiplexer、humanize 行为层和安全示例；核心反检测能力依赖不可直接审计的 patched Chromium binary。下一步应在授权目标、固定代理、明确平台上跑 `examples/basic.py`、`examples/stealth_test.py --no-screenshots` 或自己的 smoke test，并检查 binary license 是否允许你的分发/服务模式。（来源：README Examples/Test Results/License；BINARY-LICENSE.md；examples/*；bin/cloakserve）"
next_actions:
  - "clone-and-run"
unknowns:
  - "Chromium patch 源码、完整 patch 列表、每个 patch 对应检测向量：未在 repo tree 说明；README/CHANGELOG 的 `58` 按自称处理。"
  - "README benchmark 是否在 2026-06-08 仍成立：本次未运行 live detection sites，也未下载/启动 patched Chromium binary。"
  - "各平台实际二进制质量：配置写 Linux x64/Windows x64 为 `146.0.7680.177.5`，Linux arm64 为 `146.0.7680.177.3`，macOS arm64/x64 为 `145.0.7632.109.2`；本次未逐平台验证。"
  - "合法使用边界：README FAQ 与 BINARY-LICENSE 禁止非法使用和部分高风险场景，但具体目标站点 ToS/授权需要用户自己确认。"
  - "CloakBrowser Manager 是另一个 repo；这里只看到 README 提到 `cloakhq/cloakbrowser-manager` Docker 命令，未检查该 upstream。"
  - "本地 selected unit tests 有 6 个失败，主要暴露 Windows/Python 3.14 环境兼容测试问题；这不等同于产品不可运行，但需要上游确认。"
builder_reuse:
  pattern: "二进制获取契约"
  copy: "把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。"
  skip: "如果你的工具只依赖普通 Python/Node 包，不分发大二进制，就不要引入这套复杂度。"
  why_it_matters: "AI 工具经常需要浏览器、OCR engine、FFmpeg、model runtime；这个 repo 展示了如何把大二进制做成 SDK 的一部分。（来源：cloakbrowser/download.py；cloakbrowser/config.py）"
dependency_platform_risk:
  dependency: "CloakHQ patched Chromium binary"
  what_if_change: "如果 binary release 缺失、patch 失效、检测站点适配、或 license 改变，核心价值会下降。"
  exposure: "high"
  mitigation_or_unknown: "可用 `CLOAKBROWSER_BINARY_PATH` 指向本地 binary，但 repo 未提供 Chromium patch 源码；具体 58 patches 无法从 tree 复现。"
claim_ledger:
  - claim: "“Drop-in Playwright/Puppeteer replacement for Python and JavaScript”。"
    plain_english: "人话：用户把原来的 Playwright/Puppeteer 启动入口替换成 CloakBrowser 的 `launch()`，后续仍用熟悉的 page/browser API。技术词：wrapper 将自定义 `executable_path`/`executablePath` 注入到 Playwright/Puppeteer launch options。"
    source: "README Quickstart；cloakbrowser/browser.py launch；js/src/playwright.ts launch；js/src/puppeteer.ts launch"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "Python `launch()` 返回 Playwright Browser；JS `launch()` 从 `playwright-core` 导入 `chromium` 并调用 `chromium.launch(await buildLaunchOptions(options))`；Puppeteer 版本调用 `puppeteer.default.launch({ executablePath: binaryPath, ... })`。"
    does_not_support: "不证明所有 Playwright/Puppeteer API 100% 等价，也不证明所有目标网站都可用。"
    threat: "Playwright 或 Puppeteer 上游 API 变化、CDP 行为变化、浏览器二进制版本不匹配会破坏兼容性。"
  - claim: "“Auto-downloading binary / auto-updating binary”。"
    plain_english: "人话：第一次运行时它会找缓存，没有就下载；之后会按间隔检查更新。技术词：`ensure_binary()` 使用 cache marker、platform tag、release API 和 SHA256SUMS。"
    source: "cloakbrowser/download.py ensure_binary/check_for_update/_maybe_trigger_update_check；cloakbrowser/config.py get_download_url/get_fallback_download_url"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`DOWNLOAD_BASE_URL` 默认为 `https://cloakbrowser.dev`，fallback 为 GitHub Releases；`UPDATE_CHECK_INTERVAL = 3600`；下载后 `_verify_download_checksum()` 读取 `SHA256SUMS`；`CLOAKBROWSER_BINARY_PATH` 可跳过下载。"
    does_not_support: "不证明远端二进制始终可下载，也不证明每个 release 都有每个平台资产。"
    threat: "cloakbrowser.dev、GitHub Releases、SHA256SUMS、平台资产缺失都会影响安装；`CLOAKBROWSER_SKIP_CHECKSUM=true` 会降低供应链保障。"
  - claim: "“58 source-level C++ patches”。"
    plain_english: "人话：README 说浏览器指纹不是靠 JS 注入，而是编译进 Chromium 的 C++ patch。技术词：这属于 binary-level fingerprint patch，而 wrapper 只负责启动参数和下载。"
    source: "README Latest/Test Results/How It Works；CHANGELOG.md 0.3.30；repo tree"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 和 CHANGELOG 写 Linux x64 + Windows x64 build `146.0.7680.177.5` 有 `58 source-level fingerprint patches`；`config.py`/`js/src/config.ts` 平台版本表也写 Linux x64、Windows x64 为 `146.0.7680.177.5`。"
    does_not_support: "repo tree 未包含 Chromium patch 源码或 patch 列表，无法逐项核验“58”或 patch 内容。"
    threat: "核心差异在闭源/不可直接审计的二进制 patch；安全、合规、可维护性都依赖 CloakHQ 发布流程。"
  - claim: "“0.9 reCAPTCHA v3 score / passes Cloudflare Turnstile / tested against 30+ detection sites”。"
    plain_english: "人话：这是 README 的检测结果表，不是本次复测结果。技术词：这些是 live anti-bot benchmark claims。"
    source: "README Test Results；examples/stealth_test.py；tests/test_stealth.py"
    attribution: "自称"
    evidence_strength: "low"
    supports: "README 表格列出 reCAPTCHA v3 `0.9`、BrowserScan `NORMAL (4/4)`、bot.incolumitas.com `1 fail`、deviceandbrowserinfo.com `0 true flags`；`examples/stealth_test.py` 确实写了访问 bot.sannysoft、bot.incolumitas、BrowserScan、FingerprintJS、Google reCAPTCHA demo 的脚本。"
    does_not_support: "本次未运行 live detection；repo 脚本存在不等于结果持续有效。"
    threat: "反检测是对抗场景，检测站点、浏览器版本、IP 声誉、代理、headless/headed 模式都会改变结果。"
  - claim: "`humanize=True` 会替换鼠标、键盘、滚动行为。"
    plain_english: "人话：开这个 flag 后，它会把一些 Playwright 页面方法包一层，让点击、输入、滚动慢一点、更像人。技术词：monkey patch Page/Context/Browser methods，并用 `HumanConfig` 控制 timing、overshoot、scroll 等参数。"
    source: "README Human Behavior；cloakbrowser/browser.py launch humanize block；cloakbrowser/human/config.py HumanConfig；cloakbrowser/human/__init__.py patch_browser/patch_page"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`HumanConfig` 默认 `typing_delay=70`、`mouse_min_steps=25`、`mouse_max_steps=80`、`mouse_overshoot_chance=0.15`、`scroll_delta_base=(80,130)`；`careful` preset 改为更慢配置；`patch_browser()`/`patch_context()`/`patch_page()` 会替换 click/type/fill/scroll 等路径。"
    does_not_support: "不证明 humanize 行为一定能骗过行为检测，也不证明不会拖慢业务流程。"
    threat: "monkey patch 会影响 API 语义、超时预算和调试；复杂页面、iframe、ElementHandle 行为需要更多回归测试。"
  - claim: "`geoip=True` 从代理出口 IP 自动匹配 timezone/locale，并可注入 WebRTC IP。"
    plain_english: "人话：给代理时，它会尝试查代理出口在哪里，然后把浏览器时区、语言和 WebRTC IP 对齐。技术词：GeoIP database + proxy exit IP echo + `--fingerprint-timezone`/`--fingerprint-locale`/`--fingerprint-webrtc-ip` flags。"
    source: "README API launch；cloakbrowser/geoip.py；cloakbrowser/browser.py maybe_resolve_geoip/_resolve_webrtc_args；tests/test_proxy.py TestMaybeResolveGeoip"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "GeoIP DB URL 为 `https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb`，文件名 `GeoLite2-City.mmdb`，更新间隔 `30 * 86_400`；IP echo 服务包括 `api.ipify.org`、`checkip.amazonaws.com`、`ifconfig.me/ip`；默认 timeout `5.0` 秒。"
    does_not_support: "不证明 GeoIP 数据准确，也不证明每个代理都支持该探测。"
    threat: "依赖第三方 GeoIP mirror、IP echo 服务、代理网络；SOCKS5 需要 `socksio`，缺依赖会失败或降级。"
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

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

CloakHQ/CloakBrowser：GitHub 描述为“Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches. 30/30 tests passed”。

（来源：README/artifactAudit）

## 干什么

Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches. 30/30 tests passed.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 24836 |
| stars_in_period | 22732 |
| author | CloakHQ |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- cli（来源：数据不足）
- deep（来源：数据不足）

## 解决什么痛点

人话：它值得看，不是因为 README 里自称“passes every bot detection test”，而是因为 repo 里确实有一套完整包装：自动下载二进制、校验 SHA-256、按平台选择 Chromium 版本、生成 fingerprint seed、改写 Playwright 默认参数、支持 `cloakserve` CDP 多路复用、还给 browser-use/Crawl4AI/AWS Lambda 留了集成示例。技术词：这是“patched browser binary + thin SDK wrapper + CDP bridge”的组合，而不是单纯 JS 注入脚本。（来源：README How It Works；cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_default_stealth_args；bin/cloakserve；examples/integrations/browser_use_example.py）

## 核心能力

- 二进制获取契约（来源：数据不足）
- 启动参数去重器（来源：数据不足）
- CDP 多路复用与身份隔离（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向判断要分两层： 1. Stock Playwright：差异维度是浏览器二进制与启动参数。CloakBrowser 的 Python/JS wrapper 都把 Playwright 指向 CloakHQ binary，并屏蔽 `--enable-automation`、`--enable-unsafe-swiftshader`；普通 Playwright 更适合 QA、端到端测试、低风险自动化，因为上游成熟、无额外二进制许可负担。做 AI 浏览器 Agent 且目标站点会因 automation fingerprint 挑战时，再考虑 CloakBrowser。（来源：cloakbrowser/browser.py launch；pyproject.toml dependencies） 2. Puppeteer：差异维度是集成路径。CloakBrowser 的 JS 包导出 `./puppeteer`，内部用 `puppeteer-core` 加 `executablePath: binaryPath` 启动，并支持 proxy auth fallback 和 humanize patch；如果现有代码是 Puppeteer，可用该入口；如果新项目需要 Python 或 Playwright context API，Playwright 入口更直接。（来源：js/package.json exports；js/src/puppeteer.ts） 3. Selenium / undetected-chromedriver：差异维度是 driver 生态。repo 里有 `examples/integrations/selenium_example.py` 和 `undetected_chromedriver.py`，都用 `ensure_binary()` + `get_default_stealth_args()` 给 Selenium/uc 提供 CloakBrowser binary。README 对 undetected-chromedriver 的“config patches / Selenium / sometimes / stale”等比较属于自称，未独立验证；已有 Selenium 栈可复用这些示例，新项目若要 browser-use/Crawl4AI/CDP 连接，CloakBrowser 的 Playwright/CDP 路径更贴合。（来源：examples/integrations/selenium_example.py；examples/integrations/undetected_chromedriver.py；README Comparison） 4. Camoufox：README 自称差异是 Firefox vs Chromium，并说 Camoufox 是 Firefox C++ patch、CloakBrowser 是 Chromium C++ patch；本次未检查 Camoufox 上游，按未验证处理。需要 Firefox 指纹或 Firefox API 生态时选 Camoufox；需要 Chromium、Chrome TLS/UA 形态、Playwright/Puppeteer 生态时 CloakBrowser 更匹配。（来源：README Comparison/FAQ，自称未独立核验）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

真实流程示例：`examples/basic.py` 写的是 `from cloakbrowser import launch`，然后 `browser = launch(headless=False)`，`page = browser.new_page()`，`page.goto("https://example.com")`，最后 `browser.close()`。（来源：examples/basic.py） 调用进入 `cloakbrowser/browser.py launch()` 后，第一步是 `ensure_binary()`。它先看 `CLOAKBROWSER_BINARY_PATH`，没有本地 override 就用 `get_platform_tag()`、`get_effective_version()` 找缓存路径；Windows 目标是 `~/.cloakbrowser/chromium-<version>/chrome.exe`，Linux 是 `chrome`，macOS 是 `Chromium.app/Contents/MacOS/Chromium`。（来源：cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_binary_path） 如果缓存没有二进制，`_download_and_extract()` 先从 `https://cloakbrowser.dev/chromium-v<version>/cloakbrowser-<platform>.<ext>` 下载，失败时 fallback 到 GitHub Releases；下载后默认读取 `SHA256SUMS` 校验，tar/zip 解压有 path traversal 检查，macOS 还会运行 `xattr -cr` 去掉 quarantine。（来源：cloakbrowser/download.py _download_and_extract/_verify_download_checksum/_extract_tar/_extract_zip） 拿到二进制路径后，`launch()` 会处理 proxy/geoip/webrtc，再调用 `build_args()`。默认参数来自 `get_default_stealth_args()`：随机 `--fingerprint=<10000..99999>`，再加平台 profile；`build_args()` 去重规则是“stealth defaults < user args < dedicated timezone/locale params”，所以用户传 `--fingerprint=99887` 会覆盖随机 seed，`timezone="America/New_York"` 会覆盖已有 `--fingerprint-timezone`。（来源：cloakbrowser/config.py get_default_stealth_args；cloakbrowser/browser.py build_args；tests/test_build_args.py） 最后它启动 Playwright：`pw.chromium.launch(executable_path=binary_path, headless=headless, args=chrome_args, ignore_default_args=["--enable-automation", "--enable-unsafe-swiftshader"], ...)`。这就是“同 API，不同浏览器二进制”的核心机制。（来源：cloakbrowser/browser.py launch；cloakbrowser/config.py IGNORE_DEFAULT_ARGS） 另一个实际流是 Docker/CDP：README 给出 `docker run -d --name cloak -p 127.0.0.1:9222:9222 cloakhq/cloakbrowser cloakserve`，然后 `curl http://localhost:9222/json/version?fingerprint=11111` 会返回经过 `cloakserve` 重写的 WebSocket URL。`bin/cloakserve` 的 `ChromePool.get_or_launch()` 为每个 seed 分配 `BASE_CDP_PORT = 5100` 起的本地端口和 `user_data_dir`，并把 query 参数转成 `--fingerprint-*` flags。（来源：README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params）

## 本质不同的设计取舍

这些模式比“反检测”本身更容易复用到一般 AI 工程。 - 二进制获取契约；把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。；如果你的工具只依赖普通 Python/Node 包，不分发大二进制，就不要引入这套复杂度。；AI 工具经常需要浏览器、OCR engine、FFmpeg、model runtime；这个 repo 展示了如何把大二进制做成 SDK 的一部分。（来源：cloakbrowser/download.py；cloakbrowser/config.py） - 启动参数去重器；`build_args()` 用 flag key 去重，并明确优先级：默认值、用户 args、显式参数。这个模式适合任何需要组合 CLI flags 的 agent runtime。；如果参数顺序本身有语义，不能简单按 `=` 左侧去重。；避免同一 flag 同时出现两个值，减少“配置未确认传了但实际被覆盖”的调试成本。（来源：cloakbrowser/browser.py build_args；tests/test_build_args.py） - CDP 多路复用与身份隔离；`cloakserve` 用 query seed 路由到不同 Chrome process，并把 `/json/version` 的 `webSocketDebuggerUrl` 改写为公开入口；这个模式可用于多租户 browser worker。；如果没有认证、配额、隔离、审计，不要把 CDP 暴露给不可信用户。；浏览器 Agent 服务常要给每个任务独立 profile/fingerprint/session；per-seed pool 是一个可复用骨架。（来源：bin/cloakserve；README Docker CDP server mode） - 人类行为层作为可选 patch；把行为模拟做成 `humanize=True`，默认关闭；配置集中在 dataclass，支持 preset 和 per-call override。；不要把这种 monkey patch 混进核心业务 API；它会改变时序和错误路径。；许多浏览器 Agent 需要“慢而自然”的输入行为，但不应污染基础浏览器控制层。（来源：cloakbrowser/human/config.py；cloakbrowser/human/__init__.py；tests/test_humanize_unit.py） - 安全边界测试写进示例；AWS Lambda 示例把 URL scheme、SSRF、redirect revalidation、caller-controlled flags removal 写进 handler，并有 `tests/test_lambda_security.py`。；不要把示例当生产系统；README 自己也说需要认证层。；浏览器即网络访问器；给 Agent 开网页能力时，SSRF 和本地文件访问是第一风险。（来源：examples/integrations/aws_lambda/INSTRUCTIONS.md；tests/test_lambda_security.py）

## 对从业者意味着什么

结论：对 AI 浏览器 Agent、爬虫、自动化采集工程师，CloakBrowser 值得 clone-and-run，但不要把 README 的检测分数当事实。它的工程价值在 wrapper 设计、binary distribution、CDP multiplexer、humanize 行为层和安全示例；核心反检测能力依赖不可直接审计的 patched Chromium binary。下一步应在授权目标、固定代理、明确平台上跑 `examples/basic.py`、`examples/stealth_test.py --no-screenshots` 或自己的 smoke test，并检查 binary license 是否允许你的分发/服务模式。（来源：README Examples/Test Results/License；BINARY-LICENSE.md；examples/*；bin/cloakserve）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/patched-browser-binary]]、[[concepts/fingerprint-seed]]。另见 [[content/cloakhq-cloakbrowser]]、[[claims/cloakhq-cloakbrowser-main-claim]]。
