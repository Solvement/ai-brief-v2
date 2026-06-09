import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 记忆宫殿（/mind-palace）共用左侧栏外壳。
export default function MindPalaceLayout({ children }: { children: ReactNode }) {
  return <AppShell active="mind-palace">{children}</AppShell>;
}
