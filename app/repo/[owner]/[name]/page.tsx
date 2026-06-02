import { Detail } from "@/legacy/Detail";

export default async function Page({ params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  return <Detail owner={owner} name={name} />;
}
