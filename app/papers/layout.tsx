import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 论文深读（/papers/[slug]）属于「文章」栏 → 高亮 Articles。
export default function PapersLayout({ children }: { children: ReactNode }) {
  return <AppShell active="articles">{children}</AppShell>;
}
