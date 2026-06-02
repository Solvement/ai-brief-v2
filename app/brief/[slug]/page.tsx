import { BriefDeepDive } from "@/legacy/BriefDeepDive";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BriefDeepDive slug={slug} />;
}
