import fs from "node:fs/promises";
import path from "node:path";
import { News } from "@/legacy/News";

// SSR the news data so the hero images are in the initial HTML (fixes LCP).
export default async function Page() {
  let initial = null;
  try { initial = JSON.parse(await fs.readFile(path.join(process.cwd(), "public/data/news.json"), "utf8")); } catch {}
  return <News initial={initial} />;
}
