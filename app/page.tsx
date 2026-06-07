import fs from "node:fs/promises";
import path from "node:path";
import { HomePage } from "@/components/HomePage";
import { homeProjectsFromTrending } from "@/lib/home";

async function readJson(rel: string) {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), rel), "utf8")); } catch { return null; }
}

// Server component: read the data server-side and inline ONLY what the simple Home
// renders — today's papers index + the ≤8 project names. We deliberately do NOT
// inline the full ~720KB trending.json (nor the unused news/digest/models); only a
// slim 8-project slice crosses into the client payload. See src/lib/home.ts.
export default async function Page() {
  const [papers, trending] = await Promise.all([
    readJson("public/data/papers-index.json"),
    readJson("public/data/trending.json"),
  ]);
  return <HomePage initialPapers={papers} initialProjects={homeProjectsFromTrending(trending)} />;
}
