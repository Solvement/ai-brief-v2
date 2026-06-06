import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 播客栏（/podcast 列表 + /podcast/[slug] 详情）共用左侧栏外壳。
export default function PodcastLayout({ children }: { children: ReactNode }) {
  return <AppShell active="podcast">{children}</AppShell>;
}
