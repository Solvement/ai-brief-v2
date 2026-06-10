# Plan: KG 每日自动入图 stage（papers:kg-ingest）

> Kevin 2026-06-10 预授权（"自动化你自己解决…中午打开已是全自动最新+有精读+mind palace"+"自主推进北极星"）。
> 补齐验收缺的最后一环：Mind Palace 入图从手动变成每日链 stage。

## 目标 / 非目标
- 目标：每天冷审 PASS 发布的论文，自动蒸馏 facet v2 → 过 validator 硬门 → embed/integrate → Mind Palace 可见。
- 非目标：不做全语料回填（KG-2 切片 ③ 单独跑，本 stage 只认 `ready_to_publish`）；不上 LangGraph（PIPE-1）；不让模型自由判边（默认 edges: []，提案边仍被 validator 概念门/证据门拦）。

## 红线对齐
- 「每日流水线禁止开放式 agent」：本 stage = 确定性脚本 + **固定 prompt** 的 `claude -p` 单次调用（与既有深读/冷审 stage 同模式），无工具、无多轮。
- 「不过门不入库不发布」：双层门——脚本内结构预检（required facets / core_concepts 3-5+evidence / discovery_trace 必带 source_span / mermaid fence / node 可解析）+ 全量 `validate-mind-palace`。任一不过 → 新 facet 隔离删除、图产物回滚重建、退出非零留告警，不污染图。

## 设计
- `scripts/kg/ingest-daily.mjs`：
  - `selectUnfaceted(records, facetArxivIds, {cap})` 纯函数（单测）；候选 = `status==="deep_read" && cold_audit.status==="ready_to_publish"` 且 arxiv 不在现有 facets。cap 默认 2/天（限 token）。
  - `--include-grandfathered`：回填模式开关（切片 ③ 复用本管线，小样先证）。`--paper <id>` 指定单篇。`--dry-run` 只列队列。
  - facet slug 由代码确定性派生（目录名去 arxiv 前缀取首词），不信模型。
  - prompt = schema v2 全规则（两层命名制查 `concept-vocab.json` 复用、evidence 逐字短语、discovery_trace 可空+source_span 硬门、NO_EDGE 默认+判边记录注释）+ tropd.yaml 作结构样例 + paper.mdx 全文。输出仅 YAML。
  - 流程：claude -p（8min 超时，订阅）→ 提取 YAML → 结构预检 → 写 facets/{slug}.yaml → embed+vocab+integrate → 全量 validator → 失败回滚。摘要写 `logs/kg-ingest/<date>.json`。
- boot-daily.ps1：build-index 后追加 `node scripts/kg/ingest-daily.mjs`（best-effort 块内，失败不挡确定性 push）。

## 验证
- 单测：selectUnfaceted（只挑 ready_to_publish、跳过已有 facet、cap、grandfathered 开关）。
- 今晚小样：`--paper 2402.16823`（gptswarm，grandfathered）实跑一篇证 prompt 范式（=切片 ③ 小样，iterate-point-to-point）。
- 明早 09:00 真实 E2E：SoCRATES/AdaPlanBench/SpatialWorld 过审后应自动出 facet 入图。
- 全程 `validate-mind-palace` OK + `recall-eval` 不退化 + `npm run verify` 全绿。

## 回滚
- stage 独立 commit；validator 失败时脚本自回滚（删新 facet + 重建 embed/vocab/integrate）。
