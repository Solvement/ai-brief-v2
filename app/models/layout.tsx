import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

// 模型栏（/models 列表 + /models/[id] 详情）共用左侧栏外壳。
export default function ModelsLayout({ children }: { children: ReactNode }) {
  return <AppShell active="models">{children}</AppShell>;
}
