"use client";
import { useEffect, useMemo, useState } from "react";
import { RosObjectPanel, useRosObject } from "./RosObjectPanel";
import { CLUSTER_LABEL, type RosGraph, type RosGraphNode } from "./MindPalaceGlobe";

// ════════════════════════════════════════════════════════════════════
//  Mind Palace 检索区 v2（KG-4 对象库投影；只含文章，项目 col 退出语料）
//  搜一个主题/症状 → 看对象层（主张/证据/机制/触发钩子）+ 语义相邻。
// ════════════════════════════════════════════════════════════════════

interface EmbDoc { vectors: { slug: string; title: string; vec: number[] }[] }
const cos = (a: number[], b: number[]) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; };

export function MindPalaceBrowse() {
  const [graph, setGraph] = useState<RosGraph | null>(null);
  const [emb, setEmb] = useState<EmbDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/brief/ros-graph.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setGraph).catch((e) => setErr(e?.message || String(e)));
    fetch("/data/brief/mind-palace-embeddings.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null)).then(setEmb).catch(() => setEmb(null));
  }, []);

  // ?q= 直达：外部链接跳过来时预填搜索
  useEffect(() => {
    const initQ = new URLSearchParams(location.search).get("q");
    if (initQ) setQ(initQ);
  }, []);

  const records = useMemo(() => {
    return (graph?.nodes || [])
      .filter((n) => n.kind === "paper")
      .slice()
      .sort((a, b) => ((b.counts?.claims || 0) + (b.counts?.mechanisms || 0)) - ((a.counts?.claims || 0) + (a.counts?.mechanisms || 0)));
  }, [graph]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return records;
    return records.filter((r) => {
      const hay = [r.title, r.slug, r.thesis, ...(r.problems || []), ...(r.concepts || [])].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [records, q]);

  const selNode: RosGraphNode | null = useMemo(() => records.find((r) => r.slug === sel) || null, [records, sel]);
  const { obj: selObj, loading: selLoading } = useRosObject(sel);

  const neighbors = useMemo(() => {
    if (!sel || !emb) return [] as { slug: string; title: string; score: number }[];
    const paperSlugs = new Set(records.map((r) => r.slug));
    const self = emb.vectors.find((v) => v.slug === sel);
    if (!self) return [];
    return emb.vectors.filter((v) => v.slug !== sel && paperSlugs.has(v.slug))
      .map((v) => ({ slug: v.slug, title: v.title, score: cos(self.vec, v.vec) }))
      .sort((a, b) => b.score - a.score).slice(0, 4);
  }, [sel, emb, records]);

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace</div>
          <h1>记忆宫殿 · Mind Palace</h1>
          <p>
            深读过的<b>文章</b>被拆成可推理的结构化对象（主张+证据 · 机制 · 假设 · 失败模式 · 什么时候想起它）。
            <b>搜一个主题或你遇到的问题 → 看对象层 + 语义相邻</b>。共 <b>{records.length}</b> 篇（按波次持续回填）。
          </p>
        </div>
      </div>

      {err && <div className="notice error">记忆库加载失败：{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: 20, alignItems: "start" }}>
        {/* 左：搜索 + 文章列表 */}
        <div style={{ position: "sticky", top: 12 }}>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="搜主题 / 方法 / 你遇到的问题…"
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "1px 7px", borderRadius: 20 }}>
                      {CLUSTER_LABEL[r.cluster || ""] || r.cluster || "文章"}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{(r.title || r.slug).split(/[—:：]/)[0].trim()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{(r.thesis || "").slice(0, 90)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {r.counts?.claims || 0} 主张 · {r.counts?.mechanisms || 0} 机制 · {r.counts?.trigger_hooks || 0} 触发钩子
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: 12 }}>没有匹配「{q}」的记忆。</div>}
          </div>
        </div>

        {/* 右：选中文章的对象层 + 语义相邻 */}
        <div>
          {!sel && (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>
              ← 选左边一篇文章，看它的<b>对象层</b>（主张+证据 · 机制 · 什么时候想起它）和<b>语义相邻</b>。
            </div>
          )}
          {sel && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>{selNode?.title || sel}</h2>
                <a href={`/mind-palace/node/${encodeURIComponent(selNode?.id || `paper/${sel}`)}`} style={{ fontSize: 12, color: "#2563eb", whiteSpace: "nowrap" }}>⤢ 全屏 + 关系球</a>
              </div>
              {selLoading && <p className="kg-loading">加载对象层…</p>}
              {selObj && <RosObjectPanel obj={selObj} />}
              {!selLoading && !selObj && <div className="notice">对象层数据缺失（投影未含此篇）。</div>}
              {(neighbors.length > 0) && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#fff", marginTop: 14 }}>
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
