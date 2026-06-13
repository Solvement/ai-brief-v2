"use client";
import { useEffect, useMemo, useState } from "react";
import { RosObjectPanel, useRosObject } from "./RosObjectPanel";
import { CLUSTER_LABEL, PropositionCards, type RosGraph, type RosGraphNode, type RosProposition } from "./MindPalaceGlobe";

// ════════════════════════════════════════════════════════════════════
//  Mind Palace 问题地图（KG-5.1 mock，借 Karpathy LLM Wiki 的 kind:comparison）
//  以「问题家族」为骨架：撞到一个问题 → 先看这里已有哪些方法 + 目前的判断 +
//  能不能直接拿，别重复造轮子。验证「按问题组织 > 按论文组织」这个方向。
// ════════════════════════════════════════════════════════════════════

const USE_TYPE_CHIP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  directly_usable: { label: "直接可用", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  design_inspiration: { label: "设计启发", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  background_reference: { label: "背景参考", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

interface Family { cluster: string; papers: RosGraphNode[]; props: RosProposition[] }

export function MindPalaceProblems() {
  const [graph, setGraph] = useState<RosGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/brief/ros-graph.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setGraph).catch((e) => setErr(e?.message || String(e)));
  }, []);

  const families = useMemo<Family[]>(() => {
    const papers = (graph?.nodes || []).filter((n) => n.kind === "paper");
    const props = graph?.propositions || [];
    const map = new Map<string, Family>();
    const ensure = (c: string) => { if (!map.has(c)) map.set(c, { cluster: c, papers: [], props: [] }); return map.get(c)!; };
    for (const p of papers) ensure(p.cluster || "未分区").papers.push(p);
    for (const pr of props) ensure(pr.cluster || "未分区").props.push(pr);
    // 富对比的家族（命题多 → 论文多）排前面
    return [...map.values()].sort((a, b) => (b.props.length * 10 + b.papers.length) - (a.props.length * 10 + a.papers.length));
  }, [graph]);

  const allPapers = useMemo(() => (graph?.nodes || []).filter((n) => n.kind === "paper"), [graph]);
  const selNode = useMemo(() => allPapers.find((p) => p.slug === sel) || null, [allPapers, sel]);
  const { obj: selObj, loading: selLoading } = useRosObject(sel);

  const paperCard = (p: RosGraphNode) => {
    const on = sel === p.slug;
    const ut = p.human?.use_type ? USE_TYPE_CHIP[p.human.use_type] : null;
    return (
      <button key={p.slug} onClick={() => setSel(p.slug)}
        style={{ textAlign: "left", padding: "11px 13px", borderRadius: 11, cursor: "pointer", width: "100%",
          border: `1px solid ${on ? "#2563eb" : "#e2e8f0"}`, background: on ? "#f5f8ff" : "#fff",
          boxShadow: on ? "0 1px 8px rgba(37,99,235,.12)" : "none" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          {ut && <span style={{ fontSize: 10, fontWeight: 700, color: ut.color, background: ut.bg, border: `1px solid ${ut.border}`, padding: "1px 7px", borderRadius: 20 }}>{ut.label}</span>}
          <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{(p.title || p.slug).split(/[—–:：]/)[0].trim()}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>{p.human?.headline || p.thesis?.slice(0, 110) || ""}</div>
        {p.human?.how_to_use && (
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, marginTop: 5, paddingTop: 5, borderTop: "1px dashed #eef2f7" }}>
            <b style={{ color: "#2563eb" }}>怎么用 · </b>{p.human.how_to_use}
          </div>
        )}
      </button>
    );
  };

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace · 问题地图</div>
          <h1>按问题找方法 · 别重复造轮子</h1>
          <p>
            不按论文、不按图，<b>按你会撞到的问题家族</b>组织。撞到一个问题 → 先看这里：
            <b>这个问题已经有哪些方法</b>、<b>目前的判断是什么</b>（最强正方 vs 反方 + 第三条路）、<b>能不能直接拿来用</b>——
            而不是从零造轮子。共 <b>{allPapers.length}</b> 篇方法、<b>{(graph?.propositions || []).length}</b> 条跨篇判断。
          </p>
        </div>
      </div>

      {err && <div className="notice error">记忆库加载失败：{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(300px, 380px)", gap: 22, alignItems: "start" }}>
        {/* 左：问题家族 → 判断 + 方法 */}
        <div style={{ display: "grid", gap: 26 }}>
          {families.map((f) => (
            <section key={f.cluster}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: "2px solid #e2e8f0" }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>{CLUSTER_LABEL[f.cluster] || f.cluster}</h2>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{f.papers.length} 篇方法 · {f.props.length} 条判断</span>
              </div>

              {/* 目前的判断（comparison / 裁决）—— 命题人话对比卡 */}
              {f.props.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#b45309", marginBottom: 8 }}>目前的判断（同问题下多方法对比）</div>
                  <PropositionCards props={f.props} />
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 12, fontStyle: "italic" }}>
                  这个问题家族还没有跨篇判断（命题），下面是单篇方法——回填更多论文后会长出对比。
                </div>
              )}

              {/* 这个问题下的方法（论文卡） */}
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb", marginBottom: 8 }}>这个问题下的方法</div>
              <div style={{ display: "grid", gap: 9 }}>
                {f.papers.map(paperCard)}
              </div>
            </section>
          ))}
        </div>

        {/* 右：选中方法的对象层（拆开看 / 查证审计在面板里折叠） */}
        <div style={{ position: "sticky", top: 12 }}>
          {!sel && (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: "40px 22px", textAlign: "center", color: "#94a3b8" }}>
              点左边任一<b>方法</b> → 看它怎么用、能借什么、不能照搬什么；想深究再点「拆开看」。
            </div>
          )}
          {sel && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>{selNode?.title || sel}</h3>
                <a href={`/mind-palace/node/${encodeURIComponent(selNode?.id || `paper/${sel}`)}`} style={{ fontSize: 12, color: "#2563eb", whiteSpace: "nowrap" }}>⤢ 关系球</a>
              </div>
              {selLoading && <p className="kg-loading">加载对象层…</p>}
              {selObj && <RosObjectPanel obj={selObj} />}
              {!selLoading && !selObj && <div className="notice">对象层数据缺失（投影未含此篇）。</div>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
