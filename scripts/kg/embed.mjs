#!/usr/bin/env node
// ROS-backed local embedding index. Output shape stays compatible with the
// existing frontend consumer: public/data/brief/mind-palace-embeddings.json.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OBJECTS = path.join(ROOT, "data", "knowledge-graph", "objects");
const OUT = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const MODEL = "Xenova/multilingual-e5-small";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "object") return Object.values(value).map(text).join(" ");
  return String(value);
}

export function embedText(object) {
  const parts = [
    object.title,
    object.one_sentence_thesis,
    ...asArray(object.claims).map((claim) => claim?.statement),
    ...asArray(object.mechanisms).flatMap((mechanism) => [
      mechanism?.name,
      mechanism?.problem,
      mechanism?.reusable_pattern,
    ]),
    ...asArray(object.trigger_hooks).map((hook) => hook?.symptom),
  ].map(text).map((item) => item.trim()).filter(Boolean);
  return `passage: ${parts.join("\n")}`;
}

async function loadPaperObjects() {
  let files = [];
  try {
    files = (await readdir(OBJECTS)).filter((name) => /\.ya?ml$/i.test(name)).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const objects = [];
  for (const file of files) {
    try {
      const object = parseYaml(await readFile(path.join(OBJECTS, file), "utf8"));
      if (!object || object.kind !== "paper") continue;
      objects.push({
        ...object,
        object_id: object.object_id || `paper/${object.slug || path.basename(file, path.extname(file))}`,
      });
    } catch (error) {
      console.warn(`[embed] skip ${file}: ${error.message}`);
    }
  }
  return objects.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

const objects = await loadPaperObjects();
if (!objects.length) {
  console.error("[embed] no paper ROS objects to embed - nothing written");
  process.exit(0);
}

console.log(`[embed] loading ${MODEL} ...`);
const extractor = await pipeline("feature-extraction", MODEL);
const embed = async (input) => Array.from((await extractor(input, { pooling: "mean", normalize: true })).data);

const vectors = [];
for (const object of objects) {
  const vec = await embed(embedText(object));
  vectors.push({
    id: object.object_id,
    slug: object.slug,
    title: object.title,
    kind: object.kind,
    status: object.status || "draft",
    vec,
  });
  console.log(`[embed] ${object.slug} (${vec.length}d)`);
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({
  model: MODEL,
  dim: vectors[0]?.vec.length || 0,
  generated_at: new Date().toISOString(),
  count: vectors.length,
  vectors,
})}\n`, "utf8");
console.log(`[embed] wrote ${vectors.length} vectors -> ${path.relative(ROOT, OUT)}`);
