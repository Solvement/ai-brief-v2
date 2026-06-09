import { redirect } from "next/navigation";

// /graph 已更名为 /mind-palace（记忆宫殿）。保留此路由做重定向，避免旧链接死掉。
export default function Page() {
  redirect("/mind-palace");
}
