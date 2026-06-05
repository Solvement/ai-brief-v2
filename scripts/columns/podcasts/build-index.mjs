// scripts/columns/podcasts/build-index.mjs
// Aggregate content/podcasts/<slug>/{metadata.json, digest.md} → public/data/podcasts.json
// for the /podcast column to render. "内容即语料": files are the artifact, the index renders.
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DIR = join(ROOT, "content", "podcasts");
const OUT = join(ROOT, "public", "data", "podcasts.json");

const episodes = [];
if (existsSync(DIR)) {
  for (const slug of readdirSync(DIR).filter((d) => statSync(join(DIR, d)).isDirectory())) {
    const metaPath = join(DIR, slug, "metadata.json");
    const digestPath = join(DIR, slug, "digest.md");
    if (!existsSync(metaPath) || !existsSync(digestPath)) continue;
    let meta;
    try { meta = JSON.parse(readFileSync(metaPath, "utf8")); } catch { continue; }
    const body = readFileSync(digestPath, "utf8");
    episodes.push({ ...meta, slug: meta.slug || slug, body });
  }
}
// newest first by ingested date
episodes.sort((a, b) => String(b.ingested || "").localeCompare(String(a.ingested || "")));

const out = {
  generatedAt: new Date().toISOString(),
  count: episodes.length,
  episodes,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`[podcasts] wrote ${OUT} — ${episodes.length} episode(s)`);
