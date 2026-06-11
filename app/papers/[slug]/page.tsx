import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { PaperDeepDive } from "@/components/PaperDeepDive";

const CONTENT_DIR = path.join(process.cwd(), "content", "papers");
const PUBLISHABLE_COLD_AUDIT = new Set(["grandfathered", "ready_to_publish"]);

function isPublishableDeepRead(meta: { status?: string; cold_audit?: { status?: string } } | null) {
  if (!meta || meta.status !== "deep_read") return false;
  const state = meta.cold_audit?.status;
  return !state || PUBLISHABLE_COLD_AUDIT.has(state);
}

export async function generateStaticParams() {
  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    const params = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const raw = await fs.readFile(path.join(CONTENT_DIR, entry.name, "metadata.json"), "utf8");
        if (isPublishableDeepRead(JSON.parse(raw))) params.push({ slug: entry.name });
      } catch {
        // Invalid or missing metadata cannot be safely published.
      }
    }
    return params;
  } catch {
    return [];
  }
}

async function readDeepDive(slug: string) {
  const dir = path.join(CONTENT_DIR, slug);
  try {
    const [metaRaw, paper, career] = await Promise.all([
      fs.readFile(path.join(dir, "metadata.json"), "utf8"),
      fs.readFile(path.join(dir, "paper.mdx"), "utf8"),
      fs.readFile(path.join(dir, "career.mdx"), "utf8"),
    ]);
    return { meta: JSON.parse(metaRaw), paper, career };
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await readDeepDive(slug);
  if (!data || !isPublishableDeepRead(data.meta)) notFound();
  return <PaperDeepDive meta={data.meta} paper={data.paper} career={data.career} />;
}
