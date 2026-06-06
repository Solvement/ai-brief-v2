import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 旧版深读视图（/brief, /brief/[slug]）多为论文 → 默认高亮 Articles。
export default function BriefLayout({ children }: { children: ReactNode }) {
  return <AppShell active="articles">{children}</AppShell>;
}
