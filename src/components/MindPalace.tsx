"use client";
import { useState } from "react";
import { MindPalaceBrowse } from "./MindPalaceBrowse";
import { KnowledgeGraph } from "./KnowledgeGraph";

// 记忆宫殿外层：默认「记忆库」可搜索浏览器；「星图」= 旧关联图（仅作辅助表达）。
export function MindPalace() {
  const [mode, setMode] = useState<"browse" | "graph">("browse");
  const btn = (m: "browse" | "graph", label: string) => (
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
        {btn("browse", "记忆库")}
        {btn("graph", "星图")}
      </div>
      {mode === "browse" ? <MindPalaceBrowse /> : <KnowledgeGraph />}
    </div>
  );
}
