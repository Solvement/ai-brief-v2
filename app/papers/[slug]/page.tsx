import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { PaperDeepDive } from "@/components/PaperDeepDive";

const CONTENT_DIR = path.join(process.cwd(), "content", "papers");

export async function generateStaticParams() {
  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => ({ slug: e.name }));
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
  if (!data) notFound();
  return <PaperDeepDive meta={data.meta} paper={data.paper} career={data.career} />;
}
