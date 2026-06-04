// HF papers DAILY flow for the cron (replaces the old deep-dive kernel in the daily run).
//   curate (hf 拉日/周/月 → ledger 去重 → candidates)
//   → select (DeepSeek 8维评分 → 选 1-3 深读候选 + 5-10 雷达 + radar.md)
//   → build-index (聚合 → public/data/papers-index.json: 榜单 + 雷达 + 深读)
// 深读三栏正文由强模型(Claude)另写(CI 无强模型, 不在此自动化)——本流程产出榜单/雷达/候选,
// 已有的深读(content/papers/*)会被 build-index 聚合进 deepReads。
// 需要: PATH 上有 `hf`(CI 装 huggingface_hub) + DEEPSEEK_API_KEY(select 评分; 缺则跳过评分)。

import { main as curate } from "./curate.mjs";
import { main as select } from "./select.mjs";
import { main as buildIndex } from "./build-index.mjs";

export async function main() {
  await curate();
  await select();        // 无 DEEPSEEK_API_KEY 时内部优雅跳过评分(仍出榜单)
  await buildIndex();
  return { ok: true };
}

import path from "node:path";
import { fileURLToPath } from "node:url";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[papers:daily-hf] FAILED: ${e.message}`); process.exitCode = 1; });
}
