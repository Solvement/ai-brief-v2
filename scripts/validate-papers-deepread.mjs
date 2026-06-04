#!/usr/bin/env node
// Lint gate for the file-based paper deep-read corpus + aggregated index.
// 不过门不入库不发布(宪法 2026-06-04)。校验:
//   - public/data/papers-index.json 形状(deepReads[]、board 三窗)
//   - content/papers/<slug>/: metadata.json 合法+必填字段、paper.mdx/career.mdx 非空、mermaid 围栏配平
//   - data/autosci/primitives/*.yaml 可解析
// Read-only. 任一失败 → 非零退出。

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content", "papers");
const PRIMITIVES = path.join(ROOT, "data", "autosci", "primitives");
const INDEX = path.join(ROOT, "public", "data", "papers-index.json");

const errors = [];
const fail = (m) => errors.push(m);

async function exists(p) { try { await readFile(p); return true; } catch { return false; } }

function checkMermaidBalanced(md, where) {
  const opens = (md.match(/```mermaid/g) || []).length;
  const fences = (md.match(/```/g) || []).length;
  if (fences % 2 !== 0) fail(`${where}: 代码围栏数量为奇数(${fences})——未配平`);
  if (opens > fences / 2) fail(`${where}: mermaid 围栏(${opens})多于可配对围栏对(${fences / 2})`);
}

async function checkIndex() {
  if (!(await exists(INDEX))) { fail("public/data/papers-index.json 缺失 — 运行 build-index.mjs"); return; }
  let idx;
  try { idx = JSON.parse(await readFile(INDEX, "utf8")); } catch (e) { fail(`papers-index.json 非法 JSON: ${e.message}`); return; }
  if (!Array.isArray(idx.deepReads)) fail("papers-index.json: deepReads 不是数组");
  for (const w of ["daily", "weekly", "monthly"]) {
    if (!Array.isArray(idx.board?.[w])) fail(`papers-index.json: board.${w} 不是数组`);
  }
}

async function checkDeepReads() {
  let dirs = [];
  try { dirs = (await readdir(CONTENT, { withFileTypes: true })).filter((d) => d.isDirectory()); } catch { return; }
  for (const d of dirs) {
    const dir = path.join(CONTENT, d.name);
    const w = `content/papers/${d.name}`;
    // metadata.json
    try {
      const meta = JSON.parse(await readFile(path.join(dir, "metadata.json"), "utf8"));
      for (const f of ["paper_id", "title", "status"]) if (!meta[f]) fail(`${w}/metadata.json: 缺字段 ${f}`);
      if (meta.scores && typeof meta.scores !== "object") fail(`${w}/metadata.json: scores 应为对象`);
    } catch (e) { fail(`${w}/metadata.json: ${e.message}`); }
    // tabs
    for (const tab of ["paper.mdx", "career.mdx"]) {
      try {
        const md = await readFile(path.join(dir, tab), "utf8");
        if (md.trim().length < 50) fail(`${w}/${tab}: 内容过短(<50 字符)`);
        checkMermaidBalanced(md, `${w}/${tab}`);
      } catch (e) { fail(`${w}/${tab}: ${e.message}`); }
    }
  }
}

async function checkPrimitives() {
  let files = [];
  try { files = (await readdir(PRIMITIVES)).filter((f) => f.endsWith(".yaml")); } catch { return; }
  for (const f of files) {
    try { parseYaml(await readFile(path.join(PRIMITIVES, f), "utf8")); }
    catch (e) { fail(`data/autosci/primitives/${f}: YAML 解析失败 ${e.message}`); }
  }
}

await checkIndex();
await checkDeepReads();
await checkPrimitives();

if (errors.length) {
  console.error(`[validate-papers-deepread] ✗ ${errors.length} 个问题:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("[validate-papers-deepread] ✓ 论文深读语料 + 索引 校验通过");
