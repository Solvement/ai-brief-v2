# Deep-dive authoring (A/B reasoning-effort test) — analyst role

You are the ANALYST. Write ONE Chinese project deep-dive for **microsoft/agent-governance-toolkit**. Autonomously gather your own evidence: use your tools to read the real GitHub repo — README AND any deeper docs in the repo (e.g. docs/, including compliance/spec files). Do not rely only on the README surface.

Write the result to: `OUTPUT_PATH_PLACEHOLDER`

## Audience
An applied-AI builder (AI PM / FDE / app developer who vibe-codes). Serve "what does this unlock for BUILDING AI apps" and expand thinking — not research-mechanism depth for its own sake.

## HARD quality principles (non-negotiable — these are substance, not format)
1. **Traceability:** every substantive claim carries an inline anchor to WHERE in the source it came from (e.g. （来源：README Quick Start）/（来源：docs/compliance/...）).
2. **No fabrication / attribution discipline:** README marketing, badges, coverage %, "supports N", benchmarks, superlatives must be framed as CLAIMS ("README 自称/声称…"), not verified facts — UNLESS you independently verified them against deeper repo evidence, in which case state what you verified and from where. Quote numbers exactly from source; never invent or round. If something is not documented, say "未说明" or put it under 未知 — do NOT speculate it as fact.
3. **Plain-language two-layer (大白话):** explain in plain language + a concrete example BEFORE introducing jargon. A motivated student who never saw this repo should understand it.
4. **Builder reuse:** name the concrete, specific abstraction/pattern a builder should copy (and what to skip).

## LIGHT common spine (keep these sections for renderability/comparability; the BODY under each is free-form, sized to the material — do NOT pad to fill)
- 一句话（大白话定位）
- 为什么值得看（对应用建造者）
- 关键主张与证据（每条标来源；明确区分「README 自称」与「我已核实」）
- 它怎么 work（从第一性，必要的 jargon 先用大白话+例子铺垫）
- 如果我要造类似的，复用什么抽象
- 依赖/平台风险
- 未知与待确认（源里没写的就放这，别脑补）
- 判断（动作建议 + 简短评分）

## Note
This repo's README prominently claims broad security coverage. Your job is to verify such marketing claims against the repo's own deeper documentation before presenting them as fact — that verification is exactly the quality we're testing. Do not state marketing claims as verified unless the deeper docs confirm them; if the deeper docs reveal nuance, surface it.

Output ONLY the deep-dive markdown to the file. Do not modify any other repo files. Do not commit.
