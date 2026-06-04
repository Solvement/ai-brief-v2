import { NextResponse } from "next/server";

// 各栏在线刷新: 按钮 → 此路由 → 触发 GitHub Actions(daily.yml, inputs.column)→ 重跑该栏 → 提交 → Vercel 重部署。
// Vercel serverless 跑不了 hf CLI、也不能持久化/提交, 所以借 GH Actions 在云端跑真实管线。
// 需 Vercel 环境变量: REFRESH_TOKEN(口令, 防滥用) + GH_DISPATCH_TOKEN(GitHub PAT, 需 actions:write)。
export const runtime = "nodejs";

const REPO = "Solvement/ai-brief-v2";
const COLUMNS = new Set(["all", "news", "papers", "projects", "models"]);

export async function POST(req: Request) {
  const token = req.headers.get("x-refresh-token") || "";
  if (!process.env.REFRESH_TOKEN || token !== process.env.REFRESH_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const gh = process.env.GH_DISPATCH_TOKEN;
  if (!gh) return NextResponse.json({ error: "GH_DISPATCH_TOKEN 未配置(Vercel 环境变量)" }, { status: 500 });

  let column = "all";
  try { const body = await req.json(); if (COLUMNS.has(body?.column)) column = body.column; } catch { /* default all */ }

  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/daily.yml/dispatches`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${gh}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main", inputs: { column } }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json({ error: `github ${res.status}`, detail: detail.slice(0, 200) }, { status: 502 });
  }
  return NextResponse.json({ ok: true, column, message: "已触发刷新,约 2-3 分钟后线上更新" });
}
