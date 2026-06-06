import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 项目详情（/repo/[owner]/[name]）属于「项目」栏 → 高亮 Projects。
export default function RepoLayout({ children }: { children: ReactNode }) {
  return <AppShell active="projects">{children}</AppShell>;
}
