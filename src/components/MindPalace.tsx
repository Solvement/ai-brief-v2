"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MindPalaceBrowse } from "./MindPalaceBrowse";
import { MindPalaceProblems } from "./MindPalaceProblems";

// 记忆宫殿两区（Kevin 2026-06-11 深夜定）：
// 「检索区」（默认）= 给 Kevin 学习/使用的蒸馏知识点；
// 「记忆球」= AI 自我记忆库的 3D 展示（three.js 重，懒加载、关 SSR）。
const MindPalaceGlobe = dynamic(() => import("./MindPalaceGlobe").then((m) => m.MindPalaceGlobe), {
  ssr: false,
  loading: () => <div className="kg-loading">加载 3D 记忆球…</div>,
});

export function MindPalace() {
  const [mode, setMode] = useState<"problems" | "browse" | "globe">("problems");
  const btn = (m: "problems" | "browse" | "globe", label: string) => (
    <button
      onClick={() => setMode(m)}
      style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
        border: `1px solid ${mode === m ? "#2563eb" : "#cbd5e1"}`,
        background: mode === m ? "#2563eb" : "#fff", color: mode === m ? "#fff" : "#475569",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 14, right: 18, zIndex: 20, display: "flex", gap: 8 }}>
        {btn("problems", "问题地图 · 别造轮子")}
        {btn("browse", "按文章 · 检索")}
        {btn("globe", "记忆球 · AI")}
      </div>
      {mode === "problems" ? <MindPalaceProblems /> : mode === "browse" ? <MindPalaceBrowse /> : <MindPalaceGlobe />}
    </div>
  );
}
