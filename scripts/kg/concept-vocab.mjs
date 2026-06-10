#!/usr/bin/env node
// KG-2 concept vocabulary builder.
// Scans Mind Palace facets and aggregates core_concepts[].name into a small
// generated vocabulary for future facet authors and validators.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FACETS_DIR = path.join(ROOT, "data", "knowledge-graph", "facets");
const OUT = path.join(ROOT, "data", "knowledge-graph", "concept-vocab.json");

const normalizeName = (value) => String(value || "").trim();
const compareKey = (value) => normalizeName(value).toLowerCase().replace(/\s+/g, "");

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

async function loadFacets() {
  let files = [];
  try {
    files = (await readdir(FACETS_DIR)).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch (error) {
    console.error(`[kg:vocab] cannot read ${path.relative(ROOT, FACETS_DIR)}: ${error.message}`);
    process.exit(1);
  }

  const facets = [];
  for (const file of files) {
    const fullPath = path.join(FACETS_DIR, file);
    try {
      const facet = YAML.parse(await readFile(fullPath, "utf8"));
      if (facet && facet.status !== "reject") facets.push({ ...facet, _file: file });
    } catch (error) {
      console.warn(`[kg:vocab] WARN skip ${file}: ${error.message}`);
    }
  }
  return facets;
}

const concepts = new Map();
for (const facet of await loadFacets()) {
  if (!Array.isArray(facet.core_concepts)) continue;
  const slug = normalizeName(facet.slug || facet.node_id || facet._file?.replace(/\.ya?ml$/i, ""));
  for (const concept of facet.core_concepts) {
    const name = normalizeName(concept?.name);
    if (!name) continue;
    if (!concepts.has(name)) concepts.set(name, { name, count: 0, nodes: new Set() });
    const row = concepts.get(name);
    row.count += 1;
    if (slug) row.nodes.add(slug);
  }
}

const rows = [...concepts.values()]
  .map((row) => ({ name: row.name, count: row.count, nodes: [...row.nodes].sort() }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hans-CN"));

for (let i = 0; i < rows.length; i += 1) {
  for (let j = i + 1; j < rows.length; j += 1) {
    const a = compareKey(rows[i].name);
    const b = compareKey(rows[j].name);
    if (!a || !b || a === b) continue;
    if (a.includes(b) || b.includes(a) || levenshtein(a, b) <= 2) {
      console.warn(`[kg:vocab] WARN near-duplicate concept names: "${rows[i].name}" <-> "${rows[j].name}"`);
    }
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
console.log(`[kg:vocab] wrote ${rows.length} concepts -> ${path.relative(ROOT, OUT).replace(/\\/g, "/")}`);
