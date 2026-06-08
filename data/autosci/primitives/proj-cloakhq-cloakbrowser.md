<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - CloakHQ/CloakBrowser

## Core Pattern
二进制获取契约: 把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。 启动参数去重器: `build_args()` 用 flag key 去重，并明确优先级：默认值、用户 args、显式参数。这个模式适合任何需要组合 CLI flags 的 agent runtime。 CDP 多路复用与身份隔离: `cloakserve` 用 query seed 路由到不同 Chrome process，并把 `/json/version` 的 `webSocketDebuggerUrl` 改写为公开入口；这个模式可用于多租户 browser worker。 人类行为层作为可选 patch: 把行为模拟做成 `humanize=True`，默认关闭；配置集中在 dataclass，支持 preset 和 per-call override。 安全边界测试写进示例: AWS Lambda 示例把 URL scheme、SSRF、redirect revalidation、caller-controlled flags removal 写进 handler，并有 `tests/test_lambda_security.py`。

## Mapping
- problem_class: domain-agent-workflow-with-validation-and-controls
- components: agent_orchestrator, developer_control_surface, validation_harness, project, cdp, patch
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted finance_agent pattern from CloakHQ/CloakBrowser on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- finance-agent-boundary-as-module: 二进制获取契约: 把 `ensure_binary()` 的模式搬走：本地 override、平台 tag、主下载源、fallback 下载源、SHA256SUMS、原子临时文件、缓存 marker、后台更新检查。 启动参数去重器: `build_args()` 用 flag key 去重，并明确优先级：默认值、用户 args、显式参数。这个模式适合任何需要组合 CLI flags 的 agent runtime。 CDP 多路复用与身份隔离: `cloakserve` 用 query seed 路由到不同 Chrome process，并把 `/json/version` 的 `webSocketDebuggerUrl` 改写为公开入口；这个模式可用于多租户 browser worker。 人类行为层作为可选 patch: 把行为模拟做成 `humanize=True`，默认关闭；配置集中在 dataclass，支持 preset 和 per-call override。 安全边界测试写进示例: AWS Lambda 示例把 URL scheme、SSRF、redirect revalidation、caller-controlled flags removal 写进 handler，并有 `tests/test_lambda_security.py`。
- finance-agent-observable-flow: 真实流程示例：`examples/basic.py` 写的是 `from cloakbrowser import launch`，然后 `browser = launch(headless=False)`，`page = browser.new_page()`，`page.goto("https://example.com")`，最后 `browser.close()`。（来源：examples/basic.py） 调用进入 `cloakbrowser/browser.py launch()` 后，第一步是 `ensure_binary()`。它先看 `CLOAKBROWSER_BINARY_PATH`，没有本地 override 就用 `get_platform_tag()`、`get_effective_version()` 找缓存路径；Windows 目标是 `~/.cloakbrowser/chromium-<version>/chrome.exe`，Linux 是 `chrome`，macOS 是 `Chromium.app/Contents/MacOS/Chromium`。（来源：cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_binary_path） 如果缓存没有二进制，`_download_and_extract()` 先从 `https://cloakbrowser.dev/chromium-v<version>/cloakbrowser-<platform>.<ext>` 下载，失败时 fallback 到 GitHub Releases；下载后默认读取 `SHA256SUMS` 校验，tar/zip 解压有 path traversal 检查，macOS 还会运行 `xattr -cr` 去掉 quarantine。（来源：cloakbrowser/download.py _download_and_extract/_verify_download_checksum/_extract_tar/_extract_zip） 拿到二进制路径后，`launch()` 会处理 proxy/geoip/webrtc，再调用 `build_args()`。默认参数来自 `get_default_stealth_args()`：随机 `--fingerprint=<10000..99999>`，再加平台 profile；`build_args()` 去重规则是“stealth defaults < user args < dedicated timezone/locale params”，所以用户传 `--fingerprint=99887` 会覆盖随机 seed，`timezone="America/New_York"` 会覆盖已有 `--fingerprint-timezone`。（来源：cloakbrowser/config.py get_default_stealth_args；cloakbrowser/browser.py build_args；tests/test_build_args.py） 最后它启动 Playwright：`pw.chromium.launch(executable_path=binary_path, headless=headless, args=chrome_args, ignore_default_args=["--enable-automation", "--enable-unsafe-swiftshader"], ...)`。这就是“同 API，不同浏览器二进制”的核心机制。（来源：cloakbrowser/browser.py launch；cloakbrowser/config.py IGNORE_DEFAULT_ARGS） 另一个实际流是 Docker/CDP：README 给出 `docker run -d --name cloak -p 127.0.0.1:9222:9222 cloakhq/cloakbrowser cloakserve`，然后 `curl http://localhost:9222/json/version?fingerprint=11111` 会返回经过 `cloakserve` 重写的 WebSocket URL。`bin/cloakserve` 的 `ChromePool.get_or_launch()` 为每个 seed 分配 `BASE_CDP_PORT = 5100` 起的本地端口和 `user_data_dir`，并把 query 参数转成 `--fingerprint-*` flags。（来源：README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params）
- finance-agent-risk-first-transfer: Transfer the architecture together with its main failure boundary: CloakHQ patched Chromium binary: 如果 binary release 缺失、patch 失效、检测站点适配、或 license 改变，核心价值会下降。.

## Risks
- CloakHQ patched Chromium binary: 如果 binary release 缺失、patch 失效、检测站点适配、或 license 改变，核心价值会下降。
- cloakbrowser.dev 与 GitHub Releases: 主下载源不可用时 fallback GitHub Releases；两者都不可用则首次安装失败。
- Playwright / puppeteer-core: 上游 launch options、context API、CDP 行为变化会影响 wrapper 兼容。
- GeoIP mirror and IP echo services: GeoLite2-City.mmdb 下载失败、IP echo 被代理阻断、GeoIP 不准确，会导致 timezone/locale/WebRTC IP 对齐失败或降级。
- Binary license: wrapper 是 MIT，但 binary 禁止 redistributing/resell/repackage，SaaS/OEM 需要单独许可。
- Windows / Python 3.14 local test environment: 本地 selected unit tests 在 Windows 下出现路径分隔符、tarfile symlink、executable bit 相关失败。
- over_transfer
