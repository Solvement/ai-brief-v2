---
text: "桌面端会安装或复用 Hermes Agent，并把 Hermes 文件放到 Hermes home。"
slug: "fathah-hermes-desktop-main-claim"
kind: "claim"
content: "fathah-hermes-desktop"
source_pointer: "src/renderer/src/screens/Install/Install.tsx lines 33-80, 112-130；src/main/installer.ts HERMES_HOME/HERMES_REPO/validateHermesHome/runInstallWindows；README First-Time Setup"
evidence_strength: "high"
supports:
  - "desktop-companion-for-cli-agent"
  - "capabilities-gated-streaming-transport"
contradicts: []
open_challenges:
  - "不证明安装脚本在本机成功跑通；本次未执行安装。"
  - "上游 install.sh/install.ps1 或 Hermes Agent 目录结构变化会直接破坏桌面安装/复用逻辑。"
status: "supported"
---

## Claim

安装页先展示目标目录和 fresh/update/replace 状态，用户确认后才调用安装；也允许选择已有安装并校验 venv binary。

证据:`HERMES_HOME` 解析到 env override、desktop override 或默认目录；`HERMES_REPO = join(HERMES_HOME, "hermes-agent")`；Windows wrapper 下载 `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1` 并传 `-SkipSetup -HermesHome ... -InstallDir ...`。。边界:不证明安装脚本在本机成功跑通；本次未执行安装。。风险:上游 install.sh/install.ps1 或 Hermes Agent 目录结构变化会直接破坏桌面安装/复用逻辑。。See [[content/fathah-hermes-desktop]]。
