import type { ReactNode } from "react";

// /graph 仅做重定向到 /mind-palace，外壳交给目标路由。
export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}
