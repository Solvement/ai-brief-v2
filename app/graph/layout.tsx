import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 图谱栏（/graph）共用左侧栏外壳。
export default function GraphLayout({ children }: { children: ReactNode }) {
  return <AppShell active="graph">{children}</AppShell>;
}
