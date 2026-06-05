import { PodcastDetail } from "@/components/PodcastDetail";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PodcastDetail slug={slug} />;
}
