import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 顶会最佳论文栏（/conference 列表，详情复用 /papers/[slug]）共用左侧栏外壳。
export default function ConferenceLayout({ children }: { children: ReactNode }) {
  return <AppShell active="conference">{children}</AppShell>;
}
