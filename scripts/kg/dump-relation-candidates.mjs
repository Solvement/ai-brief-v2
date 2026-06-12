// Dump KG-3 relation candidate prompts for out-of-process judging.
// Usage: node scripts/kg/dump-relation-candidates.mjs [outPath]
// Output: JSON array of { key, prompt } — feed to codex (gpt-5.5) to judge.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadFacets, dumpCandidates } from "./relation-llm-io.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, ".agent", "relation-candidates.json");

const topK = Number(process.env.KG_RELATION_TOPK) || 10;
const maxCandidates = Number(process.env.KG_RELATION_MAX_CANDIDATES) || 300;

const facets = await loadFacets();
const records = await dumpCandidates(facets, { topK, maxCandidates });
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`[dump-relation-candidates] facets=${facets.length} candidates=${records.length} -> ${path.relative(ROOT, outPath)}`);
