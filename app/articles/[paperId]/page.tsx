import { Articles } from "@/legacy/Articles";

export default async function Page({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  return <Articles paperId={paperId} />;
}
