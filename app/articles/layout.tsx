import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 文章栏（/articles 列表 + /articles/[paperId] 详情）共用左侧栏外壳。
export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return <AppShell active="articles">{children}</AppShell>;
}
