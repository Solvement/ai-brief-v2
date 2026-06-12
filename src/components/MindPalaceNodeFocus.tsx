"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  componentOf, sphereLayout, shortTitle,
  RelationCards, PropositionCards,
  EDGE_COLOR, CLUSTER_LABEL,
  type RosGraph, type RosGraphNode, type RosGraphEdge, type RosProposition,
} from "./MindPalaceGlobe";
import { RosObjectPanel, useRosObject } from "./RosObjectPanel";

// ════════════════════════════════════════════════════════════════════
//  单条记忆全屏聚焦页 v2（KG-4 对象库投影）：/mind-palace/node/<id>
//  左=该连通分量的 3D 小球；右=对象层面板（单点）或 命题+关系卡（成串）。
// ════════════════════════════════════════════════════════════════════

export function MindPalaceNodeFocus({ nodeId }: { nodeId: string }) {
  const [raw, setRaw] = useState<RosGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/data/brief/ros-graph.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => alive && setRaw(d))
      .catch((e) => alive && setErr(e?.message || String(e)));
    return () => { alive = false; };
  }, []);

  const { nodes, edges } = useMemo(() => {
    const ns = (raw?.nodes || []).filter((n) => n.kind === "paper");
    const ids = new Set(ns.map((n) => n.id));
    const es = (raw?.edges || []).filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes: ns, edges: es };
  }, [raw]);
  const propositions = useMemo(() => raw?.propositions || [], [raw]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const root = byId.get(nodeId) || nodes.find((n) => n.slug === nodeId || n.title === nodeId) || null;

  const comp = useMemo(() => (root ? componentOf(root.id, edges) : new Set<string>()), [root, edges]);
  const compNodes = useMemo(() => [...comp].map((i) => byId.get(i)!).filter(Boolean), [comp, byId]);
  const compEdges = useMemo(() => edges.filter((e) => comp.has(e.source) && comp.has(e.target)), [comp, edges]);
  const isCluster = compNodes.length > 1;
  const compProps = useMemo(() => {
    const slugs = new Set(compNodes.map((n) => n.slug));
    return propositions.filter((p: RosProposition) =>
      (p.support || []).some((s) => slugs.has(s.owner)) || (p.oppose || []).some((s) => slugs.has(s.owner)));
  }, [compNodes, propositions]);
  const { obj: rootObj, loading: objLoading } = useRosObject(root ? root.slug : null);

  // 左侧 3D 小球：只画这个连通分量
  useEffect(() => {
    if (!compNodes.length || !mountRef.current) return;
    let disposed = false;
    const el = mountRef.current;
    (async () => {
      const mod = await import("3d-force-graph");
      if (disposed) return;
      const ForceGraph3D = mod.default;
      const local = compNodes.map((n) => ({ ...n }));
      sphereLayout(local as RosGraphNode[], isCluster ? 130 : 10);
      const { clusterColor } = sphereLayout(nodes.map((n) => ({ ...n })), 430); // 颜色映射与全图一致
      const fg = new ForceGraph3D(el)
        .width(el.clientWidth).height(el.clientHeight)
        .backgroundColor("#f4f7fc")
        .graphData({ nodes: local as object[], links: compEdges.filter((e) => e.primary_type !== "shares_problem").map((e) => ({ ...e })) as object[] })
        .cooldownTicks(0)
        .enableNodeDrag(false)
        .showNavInfo(false)
        .nodeId("id")
        .nodeRelSize(7)
        .nodeLabel((o: object) => { const n = o as RosGraphNode; return `<div style="font:12.5px sans-serif;color:#0f172a;background:rgba(255,255,255,.96);border:1px solid #cbd5e1;padding:5px 9px;border-radius:7px;max-width:300px">${n.title}</div>`; })
        .nodeColor((o: object) => { const n = o as RosGraphNode; return n.id === root?.id ? "#ea580c" : clusterColor(n.cluster || "未分区"); })
        .nodeVal((o: object) => { const n = o as RosGraphNode; return n.id === root?.id ? 6 : 3.5; })
        .linkColor((o: object) => { const l = o as RosGraphEdge; return EDGE_COLOR[l.primary_type] || "#64748b"; })
        .linkWidth(1.4)
        .linkOpacity(0.7)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(1.8);
      fg.cameraPosition({ x: 0, y: 0, z: isCluster ? 420 : 80 });
      const onResize = () => fg.width(el.clientWidth).height(el.clientHeight);
      window.addEventListener("resize", onResize);
      (el as HTMLDivElement & { __cleanup?: () => void }).__cleanup = () => {
        window.removeEventListener("resize", onResize);
        fg._destructor?.();
      };
    })();
    return () => { disposed = true; (el as HTMLDivElement & { __cleanup?: () => void }).__cleanup?.(); el.innerHTML = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compNodes.length, root?.id]);

  if (err) return <main className="page"><div className="notice error">加载失败：{err}</div></main>;
  if (!raw) return <main className="page"><div className="kg-loading">加载记忆…</div></main>;
  if (!root) {
    return (
      <main className="page">
        <a className="dd-back" href="/mind-palace">← 返回记忆宫殿</a>
        <div className="notice">没找到这条记忆：<b>{nodeId}</b></div>
      </main>
    );
  }

  return (
    <main className="page nf-page">
      <div className="nf-top">
        <a className="dd-back" href="/mind-palace">← 返回记忆宫殿</a>
        <div className="nf-kicker">
          {isCluster ? `记忆联结 · ${compNodes.length} 篇文章` : `${CLUSTER_LABEL[root.cluster || ""] || root.cluster || "记忆"} · 单篇对象层`}
        </div>
        <h1 className="nf-title">{root.title}</h1>
      </div>

      <div className="nf-grid">
        <div className="nf-canvas-wrap">
          <div className="nf-canvas" ref={mountRef} />
          <div className="nf-canvas-note">拖动旋转 · 滚轮缩放{isCluster ? " · 橙色=当前记忆" : ""}</div>
        </div>

        <aside className="nf-panel">
          {isCluster ? (
            <>
              <h2 className="nf-h2">这串记忆的密切联系</h2>
              <PropositionCards props={compProps} />
              <div className="globe-members" style={{ marginBottom: 14 }}>
                {compNodes.map((n) => (
                  <a key={n.id} className={`globe-member light ${n.id === root.id ? "root" : ""}`}
                    href={`/mind-palace/node/${encodeURIComponent(n.id)}`}>
                    {shortTitle(n.title, 26)}
                  </a>
                ))}
              </div>
              <RelationCards edges={compEdges} byId={byId} />
              <div style={{ marginTop: 16 }}>
                <h2 className="nf-h2">当前记忆的对象层</h2>
                {objLoading && <p className="kg-loading">加载对象层…</p>}
                {rootObj && <RosObjectPanel obj={rootObj} compact />}
              </div>
            </>
          ) : (
            <>
              <h2 className="nf-h2">这条记忆的对象层</h2>
              {objLoading && <p className="kg-loading">加载对象层…</p>}
              {rootObj ? <RosObjectPanel obj={rootObj} /> : !objLoading && (
                <div className="nf-core">{root.thesis ? <p>{root.thesis}</p> : <p className="nf-muted">（对象层数据缺失。）</p>}</div>
              )}
              {compProps.length > 0 && <div style={{ marginTop: 14 }}><PropositionCards props={compProps} /></div>}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
