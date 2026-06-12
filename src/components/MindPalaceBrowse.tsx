"use client";
import { useEffect, useMemo, useState } from "react";
import { ProjectFacetSpine, type FacetRecord } from "./ProjectFacetSpine";

// Mind Palace 主视图 = 可搜索的「记忆库」浏览器（取代 325 节点的神经元毛球）。
// 只展示真·内化记忆（有 facet 的节点）；搜主题 → 点开看结构 + 相关。清晰、可放大、可找到。

interface FacetsDoc { facets: Record<string, FacetRecord> }
interface EmbDoc { vectors: { slug: string; title: string; vec: number[] }[] }

const cos = (a: number[], b: number[]) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; };

// 一句话脊：problem → method 首句
function spineLine(f?: Record<string, string>): string {
  if (!f) return "";
  const m = (f.method || "").replace(/```[\s\S]*?```/g, "").trim();
  const p = (f.problem_solved || "").trim();
  const first = (s: string) => (s.match(/^(.+?[。！？.!?])/)?.[1] || s).slice(0, 90);
  if (p && m) return `${first(p)} → ${first(m)}`;
  return first(p || m);
}

export function MindPalaceBrowse() {
  const [doc, setDoc] = useState<FacetsDoc | null>(null);
  const [emb, setEmb] = useState<EmbDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/brief/facets.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setDoc).catch((e) => setErr(e?.message || String(e)));
    fetch("/data/brief/mind-palace-embeddings.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null)).then(setEmb).catch(() => setEmb(null));
  }, []);

  // ?q= 直达：项目页"已内化"链接跳过来时预填搜索（检索区入口）
  useEffect(() => {
    const initQ = new URLSearchParams(location.search).get("q");
    if (initQ) setQ(initQ);
  }, []);

  const records = useMemo(() => {
    if (!doc) return [] as (FacetRecord & { slug: string })[];
    return Object.entries(doc.facets)
      .filter(([, f]) => (f.status !== "reject") && f.facets)
      .map(([slug, f]) => ({ slug, ...f }))
      .sort((a, b) => (b.edges?.length || 0) - (a.edges?.length || 0));
  }, [doc]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return records;
    return records.filter((r) => {
      const hay = [r.title, r.slug, ...(Object.values(r.facets || {}))].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [records, q]);

  const selected = sel ? doc?.facets[sel] : null;
  const neighbors = useMemo(() => {
    if (!sel || !emb) return [] as { slug: string; title: string; score: number }[];
    const self = emb.vectors.find((v) => v.slug === sel);
    if (!self) return [];
    return emb.vectors.filter((v) => v.slug !== sel)
      .map((v) => ({ slug: v.slug, title: v.title, score: cos(self.vec, v.vec) }))
      .sort((a, b) => b.score - a.score).slice(0, 4);
  }, [sel, emb]);

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace</div>
          <h1>记忆宫殿 · Mind Palace</h1>
          <p>
            深读过的<b>论文 / 项目</b>被内化成结构化记忆（用 X 解决 Y · 展现 Z · 创新/缺点）。
            <b>搜一个主题 → 看它的结构 + 相关记忆</b>。共 <b>{records.length}</b> 条记忆（深读越攒越多）。
          </p>
        </div>
      </div>

      {err && <div className="notice error">记忆库加载失败：{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: 20, alignItems: "start" }}>
        {/* 左：搜索 + 记忆列表 */}
        <div style={{ position: "sticky", top: 12 }}>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="搜主题 / 方法 / 项目名…"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14, marginBottom: 12 }}
          />
          <div style={{ display: "grid", gap: 9 }}>
            {filtered.map((r) => {
              const on = sel === r.slug;
              return (
                <button key={r.slug} onClick={() => setSel(r.slug)}
                  style={{ textAlign: "left", padding: "11px 13px", borderRadius: 11, cursor: "pointer",
                    border: `1px solid ${on ? "#2563eb" : "#e2e8f0"}`, background: on ? "#f5f8ff" : "#fff",
                    boxShadow: on ? "0 1px 8px rgba(37,99,235,.12)" : "none" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: r.kind === "paper" ? "#2563eb" : "#7c3aed",
                      background: r.kind === "paper" ? "#eff6ff" : "#f5f3ff", padding: "1px 7px", borderRadius: 20 }}>
                      {r.kind === "paper" ? "论文" : "项目"}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{(r.title || r.slug).split(/[—:：]/)[0].trim()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{spineLine(r.facets)}</div>
                  {(r.edges?.length || 0) > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{r.edges!.length} 条关联</div>}
                </button>
              );
            })}
            {filtered.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: 12 }}>没有匹配「{q}」的记忆。</div>}
          </div>
        </div>

        {/* 右：选中记忆的结构 + 相关 */}
        <div>
          {!selected && (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>
              ← 选左边一条记忆，看它的<b>结构</b>（用 X 解决 Y · 架构图）和<b>相关记忆</b>。
            </div>
          )}
          {selected && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "#0f172a" }}>{selected.title}</h2>
              <ProjectFacetSpine facet={selected} />
              {(neighbors.length > 0) && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#fff" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb", marginBottom: 10 }}>语义相邻的记忆</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {neighbors.map((n) => (
                      <button key={n.slug} onClick={() => setSel(n.slug)}
                        style={{ textAlign: "left", display: "flex", gap: 10, alignItems: "baseline", padding: "8px 10px", borderRadius: 9, border: "1px solid #eef2f7", background: "#f8fafc", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0891b2", fontVariantNumeric: "tabular-nums" }}>{n.score.toFixed(2)}</span>
                        <span style={{ fontSize: 13, color: "#334155" }}>{n.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
