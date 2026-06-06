import fs from "node:fs/promises";
import path from "node:path";
import { HomePage } from "@/components/HomePage";

async function readJson(rel: string) {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), rel), "utf8")); } catch { return null; }
}

// Server component: read the data at build time and inline it so the landing's
// content (and LCP image) is in the initial HTML — avoids the 5s client-fetch LCP.
export default async function Page() {
  const [papers, trending, news, digest, models] = await Promise.all([
    readJson("public/data/papers-index.json"),
    readJson("public/data/trending.json"),
    readJson("public/data/news.json"),
    readJson("public/data/daily-digest.json"),
    readJson("public/data/models.json"),
  ]);
  return <HomePage initialPapers={papers} initialTrending={trending} initialNews={news?.items || []} initialDigest={digest} initialModels={models} />;
}
