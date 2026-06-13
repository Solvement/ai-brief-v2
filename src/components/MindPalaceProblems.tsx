"use client";
import { useEffect, useMemo, useState } from "react";
import { RosObjectPanel, useRosObject } from "./RosObjectPanel";
import { CLUSTER_LABEL, PropositionCards, type RosGraph, type RosGraphNode, type RosProposition } from "./MindPalaceGlobe";

// ════════════════════════════════════════════════════════════════════
//  Mind Palace 问题地图（KG-5.1，借 Karpathy LLM Wiki 的 kind:comparison）
//  宽屏 master-detail：左=问题家族导航；中=选中家族的对比裁决+方法网格；
//  右=选中方法的对象层。撞到一个问题 → 看已有哪些方法+目前判断+能不能拿，
//  别重复造轮子。不再一长条从上到下滚。
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
  const [selFamily, setSelFamily] = useState<string | null>(null);
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
    return [...map.values()].sort((a, b) => (b.props.length * 10 + b.papers.length) - (a.props.length * 10 + a.papers.length));
  }, [graph]);

  // 默认选中最富对比的家族（派生，不在 effect 里 setState）
  const activeFamily = selFamily || families[0]?.cluster || null;

  const allPapers = useMemo(() => (graph?.nodes || []).filter((n) => n.kind === "paper"), [graph]);
  const fam = useMemo(() => families.find((f) => f.cluster === activeFamily) || null, [families, activeFamily]);
  const selNode = useMemo(() => allPapers.find((p) => p.slug === sel) || null, [allPapers, sel]);
  const { obj: selObj, loading: selLoading } = useRosObject(sel);

  const paperCard = (p: RosGraphNode) => {
    const on = sel === p.slug;
    const ut = p.human?.use_type ? USE_TYPE_CHIP[p.human.use_type] : null;
    return (
      <button key={p.slug} onClick={() => setSel(p.slug)}
        style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", width: "100%", height: "100%",
          border: `1px solid ${on ? "#2563eb" : "#e2e8f0"}`, background: on ? "#f5f8ff" : "#fff",
          boxShadow: on ? "0 1px 8px rgba(37,99,235,.12)" : "none" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
          {ut && <span style={{ fontSize: 10, fontWeight: 700, color: ut.color, background: ut.bg, border: `1px solid ${ut.border}`, padding: "1px 7px", borderRadius: 20 }}>{ut.label}</span>}
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{(p.title || p.slug).split(/[—–:：]/)[0].trim()}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>{p.human?.headline || p.thesis?.slice(0, 120) || ""}</div>
        {p.human?.how_to_use && (
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: "1px dashed #eef2f7" }}>
            <b style={{ color: "#2563eb" }}>怎么用 · </b>{p.human.how_to_use}
          </div>
        )}
      </button>
    );
  };

  const cols = sel
    ? "minmax(180px, 210px) minmax(0, 1fr) minmax(340px, 400px)"
    : "minmax(180px, 210px) minmax(0, 1fr)";

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace · 问题地图</div>
          <h1>按问题找方法 · 别重复造轮子</h1>
          <p>
            按你会撞到的<b>问题家族</b>组织。选一个家族 → 看这个问题<b>已有哪些方法</b>、<b>目前的判断</b>
            （最强正方 vs 反方 + 第三条路），点方法看<b>能不能直接拿</b>。
            共 <b>{allPapers.length}</b> 篇方法、<b>{(graph?.propositions || []).length}</b> 条跨篇判断。
          </p>
        </div>
      </div>

      {err && <div className="notice error">记忆库加载失败：{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 20, alignItems: "start" }}>
        {/* 左：问题家族导航 */}
        <nav style={{ position: "sticky", top: 12, display: "grid", gap: 6 }}>
          {families.map((f) => {
            const on = f.cluster === activeFamily;
            return (
              <button key={f.cluster} onClick={() => { setSelFamily(f.cluster); setSel(null); }}
                style={{ textAlign: "left", padding: "9px 11px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${on ? "#2563eb" : "#e2e8f0"}`, background: on ? "#2563eb" : "#fff",
                  color: on ? "#fff" : "#334155" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{CLUSTER_LABEL[f.cluster] || f.cluster}</div>
                <div style={{ fontSize: 11, opacity: on ? 0.85 : 0.6, marginTop: 1 }}>{f.papers.length} 方法 · {f.props.length} 判断</div>
              </button>
            );
          })}
        </nav>

        {/* 中：选中家族的判断 + 方法网格 */}
        <div style={{ minWidth: 0 }}>
          {fam && (
            <>
              <h2 style={{ margin: "0 0 12px", fontSize: 19, color: "#0f172a" }}>{CLUSTER_LABEL[fam.cluster] || fam.cluster}</h2>

              {fam.props.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#b45309", marginBottom: 9 }}>目前的判断（同问题下多方法对比）</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12, alignItems: "start" }}>
                    {fam.props.map((p) => <PropositionCards key={p.id} props={[p]} />)}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 18, fontStyle: "italic" }}>
                  这个问题家族还没有跨篇判断（命题），下面是单篇方法——回填更多论文后会长出对比。
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb", marginBottom: 9 }}>这个问题下的方法</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 11, alignItems: "stretch" }}>
                {fam.papers.map(paperCard)}
              </div>
            </>
          )}
        </div>

        {/* 右：选中方法的对象层 */}
        {sel && (
          <div style={{ position: "sticky", top: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", flex: 1 }}>{selNode?.title || sel}</h3>
              <button onClick={() => setSel(null)} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>✕ 收起</button>
            </div>
            <a href={`/mind-palace/node/${encodeURIComponent(selNode?.id || `paper/${sel}`)}`} style={{ fontSize: 12, color: "#2563eb" }}>⤢ 关系球</a>
            {selLoading && <p className="kg-loading">加载对象层…</p>}
            {selObj && <div style={{ marginTop: 8 }}><RosObjectPanel obj={selObj} /></div>}
            {!selLoading && !selObj && <div className="notice">对象层数据缺失（投影未含此篇）。</div>}
          </div>
        )}
      </div>
    </main>
  );
}
