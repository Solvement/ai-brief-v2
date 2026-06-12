import { MindPalaceNodeFocusClient } from "./client";

// 单条记忆的全屏聚焦页：/mind-palace/node/<encodeURIComponent(id)>
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MindPalaceNodeFocusClient nodeId={decodeURIComponent(id)} />;
}
