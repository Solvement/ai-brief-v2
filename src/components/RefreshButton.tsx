"use client";
import { useState } from "react";

// 各栏"刷新本栏"按钮 → POST /api/refresh(带口令)→ 触发 GH Actions 重跑该栏 → ~2-3 分钟后线上更新。
// 口令(REFRESH_TOKEN)首次输入后存 localStorage, 不进源码、不公开。
export function RefreshButton({ column, label = "刷新本栏" }: { column: string; label?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function go() {
    let token = "";
    try { token = localStorage.getItem("refreshToken") || ""; } catch { /* ignore */ }
    if (!token) {
      token = (typeof window !== "undefined" && window.prompt("输入刷新口令 (REFRESH_TOKEN):")) || "";
      if (!token) return;
      try { localStorage.setItem("refreshToken", token); } catch { /* ignore */ }
    }
    setState("sending");
    try {
      const r = await fetch("/api/refresh", {
        method: "POST",
        headers: { "content-type": "application/json", "x-refresh-token": token },
        body: JSON.stringify({ column }),
      });
      if (r.status === 401) {
        try { localStorage.removeItem("refreshToken"); } catch { /* ignore */ }
        setState("err");
        if (typeof window !== "undefined") window.alert("口令错误,请重试");
        return;
      }
      setState(r.ok ? "ok" : "err");
    } catch { setState("err"); }
  }

  const text = state === "sending" ? "触发中…" : state === "ok" ? "已触发 ✓ ~2-3分钟" : state === "err" ? "失败,重试" : label;
  return (
    <button className="refresh-btn" onClick={go} disabled={state === "sending"} title="触发云端重跑该栏并自动上线">
      {text}
    </button>
  );
}
