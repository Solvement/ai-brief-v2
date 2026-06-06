import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 项目栏（/projects 列表）共用左侧栏外壳。
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <AppShell active="projects">{children}</AppShell>;
}
