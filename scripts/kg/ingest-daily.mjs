#!/usr/bin/env node
// KG 每日自动入图 stage（papers:kg-ingest）— plan docs/plans/2026-06-10-kg-ingest-daily.md
//
// 冷审 PASS 发布的论文 → 固定 prompt 的 claude -p 蒸馏 facet v2 → 双层门（结构预检 + 全量
// validate-mind-palace）→ embed/vocab/integrate → Mind Palace 可见。任一门不过 → 新 facet
// 删除、图产物重建回滚、退出非零——不过门不入图（红线）。
//
// 确定性脚本：单次 claude -p、无工具、无多轮（与深读/冷审 stage 同模式，非开放 agent）。
// 用法：
//   node scripts/kg/ingest-daily.mjs                      # 每日模式（ready_to_publish 未入图，cap 2）
//   node scripts/kg/ingest-daily.mjs --dry-run             # 只列队列
//   node scripts/kg/ingest-daily.mjs --paper 2402.16823    # 指定单篇（测试/回填小样）
//   node scripts/kg/ingest-daily.mjs --include-grandfathered --cap 5   # 回填模式（KG-2 切片③）

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PAPERS_DIR = path.join(ROOT, "content", "papers");
const FACETS_DIR = path.join(ROOT, "data", "knowledge-graph", "facets");
const VOCAB_FILE = path.join(ROOT, "data", "knowledge-graph", "concept-vocab.json");
const GRAPH_FILE = path.join(ROOT, "public", "data", "brief", "graph.json");
const EXAMPLE_FACET = path.join(FACETS_DIR, "tropd.yaml");
const LOG_DIR = path.join(ROOT, "logs", "kg-ingest");
const DEFAULT_CAP = 2;
const CLAUDE_TIMEOUT_MS = Number(process.env.KG_INGEST_CLAUDE_TIMEOUT_MS) || 8 * 60 * 1000;

const arxivOf = (s) => (/(\d{4}\.\d{4,5})/.exec(String(s || "")) || [])[1] || "";

// ---------------------------------------------------------------------------
// PURE selection（单测覆盖）：ready_to_publish 且未入图；grandfathered 仅回填模式收。
// ---------------------------------------------------------------------------
export function selectUnfaceted(records, facetArxivIds, { cap = DEFAULT_CAP, includeGrandfathered = false, paperId = "" } = {}) {
  const selected = [];
  const skipped = [];
  for (const rec of records) {
    const meta = rec.metadata || {};
    const arxiv = meta.arxiv_id || arxivOf(rec.dirName);
    const gate = meta.cold_audit?.status || "";
    const eligible =
      meta.status === "deep_read" &&
      (gate === "ready_to_publish" || (includeGrandfathered && gate === "grandfathered"));
    if (paperId && arxiv !== paperId) continue;
    if (!eligible) {
      skipped.push({ dirName: rec.dirName, reason: `gate=${gate || "none"}` });
      continue;
    }
    if (facetArxivIds.has(arxiv)) {
      skipped.push({ dirName: rec.dirName, reason: "already-faceted" });
      continue;
    }
    selected.push(rec);
  }
  return { selected: selected.slice(0, cap), overflow: selected.slice(cap).map((r) => r.dirName), skipped };
}

// facet 短 slug 由代码确定性派生（不信模型）：目录名去 arxiv 前缀取首词。
export function facetSlugFromDir(dirName, existingSlugs = new Set()) {
  const base = String(dirName).replace(/^\d{4}\.\d{4,5}-/, "").split("-")[0] || dirName;
  if (!existingSlugs.has(base)) return base;
  const arxiv = arxivOf(dirName).replace(".", "");
  return `${base}-${arxiv}`;
}

// ---------------------------------------------------------------------------
// scanning
// ---------------------------------------------------------------------------
async function scanPapers() {
  const out = [];
  for (const dirName of await readdir(PAPERS_DIR)) {
    try {
      const raw = await readFile(path.join(PAPERS_DIR, dirName, "metadata.json"), "utf8");
      out.push({ dirName, contentDir: path.join(PAPERS_DIR, dirName), metadata: JSON.parse(raw.replace(/^﻿/, "")) });
    } catch {
      /* not a paper dir */
    }
  }
  return out;
}

async function scanFacets() {
  const ids = new Set();
  const slugs = new Set();
  for (const file of await readdir(FACETS_DIR)) {
    if (!/\.ya?ml$/i.test(file)) continue;
    try {
      const f = YAML.parse(await readFile(path.join(FACETS_DIR, file), "utf8"));
      const ax = arxivOf(f?.node_id) || arxivOf(f?.source);
      if (ax) ids.add(ax);
      if (f?.slug) slugs.add(f.slug);
    } catch {
      /* unparseable facet — validator's problem, not selection's */
    }
  }
  return { ids, slugs };
}

// ---------------------------------------------------------------------------
// fixed distillation prompt（schema v2 全规则；输出仅 YAML）
// ---------------------------------------------------------------------------
export function buildFacetPrompt({ nodeId, slug, dirName, paperMdx, vocabJson, exampleYaml }) {
  return [
    "你是 AI-Brief 知识图谱的 facet 蒸馏器。任务：把下面这篇已过冷审的论文深读蒸馏成一份 Mind Palace facet v2 YAML。",
    "只输出 YAML（可以包在 ```yaml 围栏里），不要任何解释文字。",
    "",
    "硬规则（validator 会机器校验，违反=整份被拒）：",
    `1. 顶层字段：schema: v2 / node_id: ${nodeId} / slug: ${slug} / kind: paper / title / source / facets / self_evo_use / core_concepts / discovery_trace / edges / status: extracted。`,
    "2. facets 必含非空的 problem_solved, method, result, innovation, weakness, transfer；architecture 可选但若给必须含 ```mermaid 围栏。",
    "3. 不编造：一切数字/结论只能来自深读原文；自报数字标「自报」；未知写「数据不足」。",
    "4. core_concepts：3-5 个对象 {name, role: primary|supporting|mentioned, evidence}。两层命名制：",
    "   - name = 跨文件统一的受控规范名。先查下方 concept-vocab，同义概念必须复用既有名；新概念允许但命名要规范（中文为主，可带英文括注）。",
    "   - evidence = 深读原文的逐字短语（防幻觉锚点，审计查 evidence 不查 name）。",
    "5. discovery_trace：只在原文真有「先试 X 失败 → 走到 Y」的解法发现叙事时填 {hypothesis, failed_attempts, source_span}；",
    "   非空必须带 source_span 指向深读具体段落（无 span 会被 validator 直接 reject）。没有真实叙事就写 discovery_trace: 数据不足。",
    "6. edges: []（判边默认 NO_EDGE）。不要提案边。把你对语义近邻的 NO_EDGE 判断写成 edges 上方的 # 注释（型如：# xxx(理由)：…… → NO_EDGE）。",
    "7. 风格学样例：problem_solved 一句犀利点出真问题；method 大白话+类比；result 真实数字密集并标自报；",
    "   innovation 同赛道对比；weakness 含适用边界和坑；transfer 指向 AI-Brief（个人 AI 情报站+自进化 agent 语料库）自身可搬的方法论；",
    "   self_evo_use 客观判断能不能用、能搬什么。",
    "",
    "=== 结构样例（tropd.yaml，学结构和密度，不抄内容）===",
    exampleYaml,
    "",
    "=== concept-vocab（同义概念必须复用这些名）===",
    vocabJson,
    "",
    `=== 深读原文（content/papers/${dirName}/paper.mdx）===`,
    paperMdx,
  ].join("\n");
}

export function extractYaml(text) {
  const raw = String(text || "").trim();
  // GREEDY to the LAST closing fence: the facet body legally contains inner ```mermaid fences
  // (architecture field), so a non-greedy match truncates mid-document — the 2026-06-10 live run
  // failed exactly this way on both papers (mermaid fence + core_concepts cut off).
  const fence = raw.match(/```ya?ml\s*\n([\s\S]*)\n```/i) || raw.match(/```\s*\n((?:#[^\n]*\n)*schema:\s*v2[\s\S]*)\n```/i);
  let body = (fence ? fence[1] : raw).trim();
  const start = body.search(/(^|\n)(#[^\n]*\n)*schema:\s*v2/);
  if (start > 0) body = body.slice(start);
  // Models sometimes append prose after the terminal `status:` line — keep through that line only.
  const m = body.match(/^[\s\S]*\nstatus:[^\n]*/);
  if (m) body = m[0];
  return body.trim();
}

// 结构预检（validator 的快速前哨；全量 validator 仍是终门）
export function precheckFacet(facet, { nodeId, slug }) {
  const errors = [];
  const hasText = (v) => typeof v === "string" && v.trim() !== "";
  if (!facet || typeof facet !== "object") return ["not an object"];
  if (facet.schema !== "v2") errors.push("schema must be v2");
  if (facet.node_id !== nodeId) errors.push(`node_id must be ${nodeId}, got ${facet.node_id}`);
  if (facet.slug !== slug) errors.push(`slug must be ${slug}, got ${facet.slug}`);
  for (const key of ["problem_solved", "method", "result", "innovation", "weakness", "transfer"]) {
    if (!hasText(facet.facets?.[key])) errors.push(`facets.${key} empty`);
  }
  if (facet.facets?.architecture !== undefined && !String(facet.facets.architecture).includes("```mermaid")) {
    errors.push("architecture without mermaid fence");
  }
  const cc = facet.core_concepts;
  if (!Array.isArray(cc) || cc.length < 3 || cc.length > 5) errors.push("core_concepts must be 3-5 items");
  else for (const c of cc) if (!hasText(c?.name) || !hasText(c?.evidence) || !["primary", "supporting", "mentioned"].includes(c?.role)) errors.push("core_concept missing name/role/evidence");
  const dt = facet.discovery_trace;
  const dtEmpty = dt === undefined || dt === null || (typeof dt === "string" && (dt.trim() === "" || dt.trim() === "数据不足"));
  if (!dtEmpty && (typeof dt !== "object" || !hasText(dt.source_span))) errors.push("non-empty discovery_trace requires source_span");
  if (Array.isArray(facet.edges) && facet.edges.length > 0) errors.push("edges must be [] in auto-ingest (NO_EDGE default)");
  if (facet.edges !== undefined && !Array.isArray(facet.edges)) errors.push("edges must be an array");
  return errors;
}

// ---------------------------------------------------------------------------
// plumbing
// ---------------------------------------------------------------------------
function spawnWithInput(command, args, input, { cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.stderr.on("data", (c) => (stderr += c.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`process timed out after ${timeoutMs}ms`));
      else resolve({ code, stdout, stderr });
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function callClaude(prompt, logger = console) {
  // claude -p（订阅）：prompt 走 stdin（Windows 大 prompt 可靠）；输出走 --output-format json 信封。
  logger.log(`[kg-ingest] claude -p (prompt ${Math.round(prompt.length / 1024)}KB on stdin, timeout ${CLAUDE_TIMEOUT_MS / 60000}min)`);
  const result = await spawnWithInput("claude", ["-p", "--output-format", "json"], prompt, { cwd: ROOT, timeoutMs: CLAUDE_TIMEOUT_MS });
  if (result.code !== 0) throw new Error(`claude exited ${result.code}: ${String(result.stderr || result.stdout).slice(-400)}`);
  try {
    const envelope = JSON.parse(String(result.stdout).trim());
    return typeof envelope?.result === "string" ? envelope.result : String(result.stdout);
  } catch {
    return String(result.stdout);
  }
}

function runNode(script, args = []) {
  return spawnWithInput(process.execPath, [path.join(ROOT, script), ...args], "", { cwd: ROOT, timeoutMs: 10 * 60 * 1000 });
}

async function rebuildGraphArtifacts(logger = console) {
  for (const script of ["scripts/kg/embed.mjs", "scripts/kg/concept-vocab.mjs", "scripts/kg/integrate-kg.mjs"]) {
    const r = await runNode(script);
    if (r.code !== 0) throw new Error(`${script} failed: ${String(r.stderr || r.stdout).slice(-400)}`);
    logger.log(`[kg-ingest] ${script} ok`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  const opts = { cap: DEFAULT_CAP, dryRun: false, includeGrandfathered: false, paperId: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--include-grandfathered") opts.includeGrandfathered = true;
    else if (a === "--cap") opts.cap = Number(argv[++i]);
    else if (a === "--paper") opts.paperId = String(argv[++i]);
    else throw new Error(`unexpected arg ${a}`);
  }

  const records = await scanPapers();
  const { ids: facetIds, slugs: facetSlugs } = await scanFacets();
  const { selected, overflow } = selectUnfaceted(records, facetIds, opts);
  console.log(`[kg-ingest] papers ${records.length} · faceted ${facetIds.size} · queue ${selected.length} (cap ${opts.cap}) · overflow ${overflow.length}`);
  if (opts.dryRun || selected.length === 0) {
    for (const r of selected) console.log(`  would ingest: ${r.dirName}`);
    if (opts.dryRun) for (const o of overflow) console.log(`  overflow: ${o}`);
    return;
  }

  const graph = JSON.parse(await readFile(GRAPH_FILE, "utf8"));
  const graphIds = new Set((graph.nodes || []).map((n) => n.id));
  const vocabJson = await readFile(VOCAB_FILE, "utf8").catch(() => "[]");
  const exampleYaml = await readFile(EXAMPLE_FACET, "utf8");
  await mkdir(LOG_DIR, { recursive: true });

  const summary = { generatedAt: new Date().toISOString(), results: [] };
  const writtenFiles = [];
  for (const rec of selected) {
    const arxiv = rec.metadata.arxiv_id || arxivOf(rec.dirName);
    const nodeId = `paper:${arxiv}`;
    if (!graphIds.has(nodeId)) {
      console.warn(`[kg-ingest] SKIP ${rec.dirName}: ${nodeId} not in graph (build-index/kg:build 未跑?)`);
      summary.results.push({ paper: rec.dirName, status: "skipped-no-node" });
      continue;
    }
    const slug = facetSlugFromDir(rec.dirName, facetSlugs);
    const facetPath = path.join(FACETS_DIR, `${slug}.yaml`);
    try {
      const paperMdx = await readFile(path.join(rec.contentDir, "paper.mdx"), "utf8");
      const prompt = buildFacetPrompt({ nodeId, slug, dirName: rec.dirName, paperMdx, vocabJson, exampleYaml });
      const raw = await callClaude(prompt);
      const yamlText = extractYaml(raw);
      const facet = YAML.parse(yamlText);
      const errors = precheckFacet(facet, { nodeId, slug });
      if (errors.length) throw new Error(`precheck failed: ${errors.join("; ")}`);
      await writeFile(facetPath, `${yamlText.trim()}\n`, "utf8");
      writtenFiles.push(facetPath);
      facetSlugs.add(slug);
      console.log(`[kg-ingest] wrote ${path.relative(ROOT, facetPath)}`);
      summary.results.push({ paper: rec.dirName, status: "written", facet: `${slug}.yaml` });
    } catch (error) {
      console.error(`[kg-ingest] FAILED ${rec.dirName} (isolated, continuing): ${error.message}`);
      summary.results.push({ paper: rec.dirName, status: "failed", error: String(error.message).slice(0, 400) });
    }
  }

  if (writtenFiles.length) {
    await rebuildGraphArtifacts();
    const v = await runNode("scripts/validate-mind-palace.mjs");
    if (v.code !== 0) {
      // 终门失败 → 回滚本次全部新 facet 并重建产物，不污染图（不过门不入图）。
      console.error(`[kg-ingest] validator FAILED → rolling back ${writtenFiles.length} new facet(s)\n${String(v.stderr || v.stdout).slice(-800)}`);
      for (const f of writtenFiles) await rm(f, { force: true });
      await rebuildGraphArtifacts();
      summary.validator = "failed-rolled-back";
      await writeFile(path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.json`), `${JSON.stringify(summary, null, 2)}\n`);
      process.exit(1);
    }
    console.log(`[kg-ingest] validator OK — ${writtenFiles.length} facet(s) live in Mind Palace`);
    summary.validator = "ok";
  }
  await writeFile(path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  const failed = summary.results.filter((r) => r.status === "failed").length;
  if (failed) process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[kg-ingest] fatal: ${error.message}`);
    process.exit(1);
  });
}
