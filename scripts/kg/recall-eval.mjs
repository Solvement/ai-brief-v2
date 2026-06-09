#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const EMBEDDINGS_FILE = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const HOLDOUT_FILE = path.join(ROOT, "data", "knowledge-graph", "recall-holdout.json");
const MODEL = "Xenova/multilingual-e5-small";

const DEFAULT_HOLDOUT = [
  {
    query: "我要给 agent 加可学习的长期记忆，让它自己决定记什么删什么",
    expect_slug: "agemem",
    note: "learned long-term memory policy",
  },
  {
    query: "搭一个多 agent 协作、角色分工不互相带偏的系统",
    expect_slug: ["metagpt", "gptswarm"],
    note: "multi-agent role separation",
  },
  {
    query: "做一个能自己跑科研实验、迭代假设的研究 agent",
    expect_slug: "ai-scientist-v2",
    note: "autonomous research agent",
  },
  {
    query: "给 agent 一个能查代码库结构、找符号调用关系的工具/记忆",
    expect_slug: "colbymchenry-codegraph",
    note: "codebase graph memory",
  },
  {
    query: "怎么评估一个 agent 的长期记忆系统好不好",
    expect_slug: "memoryagentbench",
    note: "memory benchmark",
  },
];

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function loadHoldout() {
  try {
    return await readJson(HOLDOUT_FILE);
  } catch {
    return DEFAULT_HOLDOUT;
  }
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

function expectedSlugs(item) {
  return Array.isArray(item.expect_slug) ? item.expect_slug : [item.expect_slug];
}

const embeddings = await readJson(EMBEDDINGS_FILE);
const vectors = Array.isArray(embeddings.vectors) ? embeddings.vectors.filter((item) => Array.isArray(item.vec)) : [];
if (!vectors.length) {
  console.error("[recall-eval] no vectors in mind-palace-embeddings.json");
  process.exit(1);
}

const holdout = await loadHoldout();
const vectorSlugs = new Set(vectors.map((item) => item.slug).filter(Boolean));

console.log(`[recall-eval] loading ${MODEL}`);
const extractor = await pipeline("feature-extraction", MODEL);
const embed = async (text) => Array.from((await extractor(text, { pooling: "mean", normalize: true })).data);

let evaluated = 0;
let skipped = 0;
let hitAt1 = 0;
let hitAt3 = 0;

for (const item of holdout) {
  const expects = expectedSlugs(item);
  const availableExpects = expects.filter((slug) => vectorSlugs.has(slug));
  if (!availableExpects.length) {
    skipped += 1;
    console.log(`[recall-eval] skipped (no facet yet): ${expects.join("|")} — ${item.note}`);
    continue;
  }

  const queryVec = await embed(`query: ${item.query}`);
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
