---
content: "cloakhq-cloakbrowser"
kind: "evidence-pack"
title: "CloakBrowser — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "API"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "CloakBrowser 是一个 Python/JavaScript 浏览器自动化 SDK，用 Playwright/Puppeteer 风格 API 启动 CloakHQ 自己分发的 patched Chromium 二进制，并把 fingerprint、proxy、GeoIP、humanize、CDP server 等反检测相关配置封装成启动参数。"
    internal_logic: "真实流程示例：`examples/basic.py` 写的是 `from cloakbrowser import launch`，然后 `browser = launch(headless=False)`，`page = browser.new_page()`，`page.goto(\"https://example.com\")`，最后 `browser.close()`。（来源：examples/basic.py）\n\n调用进入 `cloakbrowser/browser.py launch()` 后，第一步是 `ensure_binary()`。它先看 `CLOAKBROWSER_BINARY_PATH`，没有本地 override 就用 `get_platform_tag()`、`get_effective_version()` 找缓存路径；Windows 目标是 `~/.cloakbrowser/chromium-<version>/chrome.exe`，Linux 是 `chrome`，macOS 是 `Chromium.app/Contents/MacOS/Chromium`。（来源：cloakbrowser/download.py ensure_binary；cloakbrowser/config.py get_binary_path）\n\n如果缓存没有二进制，`_download_and_extract()` 先从 `https://cloakbrowser.dev/chromium-v<version>/cloakbrowser-<platform>.<ext>` 下载，失败时 fallback 到 GitHub Releases；下载后默认读取 `SHA256SUMS` 校验，tar/zip 解压有 path traversal 检查，macOS 还会运行 `xattr -cr` 去掉 quarantine。（来源：cloakbrowser/download.py _download_and_extract/_verify_download_checksum/_extract_tar/_extract_zip）\n\n拿到二进制路径后，`launch()` 会处理 proxy/geoip/webrtc，再调用 `build_args()`。默认参数来自 `get_default_stealth_args()`：随机 `--fingerprint=<10000..99999>`，再加平台 profile；`build_args()` 去重规则是“stealth defaults < user args < dedicated timezone/locale params”，所以用户传 `--fingerprint=99887` 会覆盖随机 seed，`timezone=\"America/New_York\"` 会覆盖已有 `--fingerprint-timezone`。（来源：cloakbrowser/config.py get_default_stealth_args；cloakbrowser/browser.py build_args；tests/test_build_args.py）\n\n最后它启动 Playwright：`pw.chromium.launch(executable_path=binary_path, headless=headless, args=chrome_args, ignore_default_args=[\"--enable-automation\", \"--enable-unsafe-swiftshader\"], ...)`。这就是“同 API，不同浏览器二进制”的核心机制。（来源：cloakbrowser/browser.py launch；cloakbrowser/config.py IGNORE_DEFAULT_ARGS）\n\n另一个实际流是 Docker/CDP：README 给出 `docker run -d --name cloak -p 127.0.0.1:9222:9222 cloakhq/cloakbrowser cloakserve`，然后 `curl http://localhost:9222/json/version?fingerprint=11111` 会返回经过 `cloakserve` 重写的 WebSocket URL。`bin/cloakserve` 的 `ChromePool.get_or_launch()` 为每个 seed 分配 `BASE_CDP_PORT = 5100` 起的本地端口和 `user_data_dir`，并把 query 参数转成 `--fingerprint-*` flags。（来源：README Docker CDP server mode；bin/cloakserve ChromePool/parse_connection_params）"
    failure_mode: "BINARY-LICENSE.md；cloakbrowser/download.py ensure_binary；repo tree"
    source_pointer: "https://github.com/cloakhq/cloakbrowser"
pipeline_steps:
  - "project_type 分诊:library_sdk"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/false/true/MIT/chromium-v146.0.7680.177.5"
experiments: []
claims:
  - "[[claims/cloakhq-cloakbrowser-main-claim]]"
artifacts:
  - "[[artifacts/cloakhq-cloakbrowser-repo]]"
metrics:
  - "stars=24836"
  - "forks=1979"
  - "open_issues=115"
  - "latest_release=chromium-v146.0.7680.177.5"
  - "pushed_at=2026-06-07T20:13:19Z"
baselines: []
failure_modes:
  - "BINARY-LICENSE.md；cloakbrowser/download.py ensure_binary；repo tree"
  - "cloakbrowser/config.py DOWNLOAD_BASE_URL/GITHUB_DOWNLOAD_BASE_URL；cloakbrowser/download.py _download_and_extract"
  - "pyproject.toml dependencies；js/package.json peerDependencies/devDependencies"
  - "cloakbrowser/geoip.py；cloakbrowser/browser.py maybe_resolve_geoip"
  - "LICENSE；BINARY-LICENSE.md Grant of Use/Restrictions/Cloud, Container & Integration Use"
  - "本地 pytest run 2026-06-08"
missing_details: []
source_pointers:
  - "https://github.com/cloakhq/cloakbrowser"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/cloakhq-cloakbrowser-main-claim]],官方 artifact 落库为 [[artifacts/cloakhq-cloakbrowser-repo]]。See [[content/cloakhq-cloakbrowser]]。
