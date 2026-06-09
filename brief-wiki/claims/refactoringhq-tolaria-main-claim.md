---
text: "本地文件优先、无导出锁定"
slug: "refactoringhq-tolaria-main-claim"
kind: "claim"
content: "refactoringhq-tolaria"
source_pointer: "README Principles；src-tauri/src/vault/mod.rs parse_md_file；docs/ABSTRACTIONS Document Model"
evidence_strength: "high"
supports:
  - "markdown-vault"
  - "mcp-vault-tools"
contradicts: []
open_challenges:
  - "不证明所有 Markdown 扩展都能无损往返；编辑器序列化仍依赖 BlockNote/CodeMirror 适配。"
  - "富文本编辑器、Mermaid、tldraw、PDF/媒体预览会引入应用层约定；跨工具无损需要逐项验证。"
status: "supported"
---

## Claim

笔记是普通 `.md` 文件，YAML frontmatter 承载 `type`、`status`、关系等字段；解析入口是 Rust 的 `parse_md_file()`。

证据:`parse_md_file()` 读取磁盘文件、解析 YAML frontmatter、提取 H1、wikilinks、word_count、file_kind。。边界:不证明所有 Markdown 扩展都能无损往返；编辑器序列化仍依赖 BlockNote/CodeMirror 适配。。风险:富文本编辑器、Mermaid、tldraw、PDF/媒体预览会引入应用层约定；跨工具无损需要逐项验证。。See [[content/refactoringhq-tolaria]]。
