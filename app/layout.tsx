import "../src/styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI Brief",
  description: "面向 AI 应用开发者的每日情报：论文 / 项目 / 模型 深度解读。",
};

// 根布局：所有页面共用的最外层外壳。全局 CSS 只在这里 import 一次。
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
