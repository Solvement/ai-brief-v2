"use client";
import dynamic from "next/dynamic";

const MindPalaceNodeFocus = dynamic(
  () => import("@/components/MindPalaceNodeFocus").then((m) => m.MindPalaceNodeFocus),
  { ssr: false, loading: () => <div className="kg-loading">加载记忆…</div> }
);

export function MindPalaceNodeFocusClient({ nodeId }: { nodeId: string }) {
  return <MindPalaceNodeFocus nodeId={nodeId} />;
}
