#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const EMBEDDINGS_FILE = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const BENCH_FILE = path.join(ROOT, "data", "knowledge-graph", "recall-bench.json");
const MODEL = "Xenova/multilingual-e5-small";

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function cosine(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

function acceptedSlugs(item) {
  return [...new Set([item.expect, ...(Array.isArray(item.accept) ? item.accept : [])].filter(Boolean))];
}

const [embeddings, bench] = await Promise.all([readJson(EMBEDDINGS_FILE), readJson(BENCH_FILE)]);
const vectors = Array.isArray(embeddings.vectors) ? embeddings.vectors.filter((item) => Array.isArray(item.vec) && item.kind === "paper") : [];
if (!vectors.length) {
  console.error("[recall-eval] no paper vectors in mind-palace-embeddings.json");
  process.exit(1);
}

const queries = Array.isArray(bench.queries) ? bench.queries : [];
const vectorSlugs = new Set(vectors.map((item) => item.slug).filter(Boolean));

console.log(`[recall-eval] loading ${MODEL}`);
const extractor = await pipeline("feature-extraction", MODEL);
const embed = async (text) => Array.from((await extractor(text, { pooling: "mean", normalize: true })).data);

let evaluated = 0;
let skipped = 0;
let hitAt1 = 0;
let hitAt3 = 0;

for (const item of queries) {
  const expects = acceptedSlugs(item);
  const availableExpects = expects.filter((slug) => vectorSlugs.has(slug));
  if (!availableExpects.length) {
    skipped += 1;
    console.log(`[recall-eval] skipped (no paper vector): ${expects.join("|")} - ${item.type || item.mode || "case"}`);
    continue;
  }

  const queryVec = await embed(`query: ${item.q || item.query}`);
  const ranked = vectors
    .map((candidate) => ({ ...candidate, score: cosine(queryVec, candidate.vec) }))
    .sort((a, b) => b.score - a.score);
  const top3 = ranked.slice(0, 3);
  const topSlugs = top3.map((candidate) => candidate.slug);
  const at1 = availableExpects.includes(topSlugs[0]);
  const at3 = topSlugs.some((slug) => availableExpects.includes(slug));
  if (at1) hitAt1 += 1;
  if (at3) hitAt3 += 1;
  evaluated += 1;
  console.log(
    `[recall-eval] ${at3 ? "hit" : "miss"} expect=${expects.join("|")} recall@1=${at1 ? 1 : 0} recall@3=${at3 ? 1 : 0} top=${top3
      .map((candidate) => `${candidate.slug}:${candidate.score.toFixed(4)}`)
      .join(", ")}`,
  );
}

const recall1 = evaluated ? hitAt1 / evaluated : 0;
const recall3 = evaluated ? hitAt3 / evaluated : 0;
console.log(`[recall-eval] summary evaluated:${evaluated} skipped:${skipped} recall@1:${recall1.toFixed(3)} recall@3:${recall3.toFixed(3)}`);
if (!evaluated) process.exitCode = 1;
