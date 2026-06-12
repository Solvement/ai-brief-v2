"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  normalize, componentOf, sphereLayout, shortTitle,
  EDGE_LABEL, EDGE_COLOR,
  type GNode, type GEdge, type RawGraph,
} from "./MindPalaceGlobe";

// ════════════════════════════════════════════════════════════════════
//  /mind-palace/node/[id] — 单条记忆的全屏聚焦页（Kevin 2026-06-11 深夜）
//  生物模型式展示：左侧=这条记忆所在连通分量的 3D 小球（放大、可旋转），
//  右侧=大号中文分析面板（簇=成员间密切联系；孤点=核心+为何无边）。
//  独立页面 → 点击稳定不消失、可分享、可从检索区/项目页直达。
// ════════════════════════════════════════════════════════════════════

export function MindPalaceNodeFocus({ nodeId }: { nodeId: string }) {
  const [raw, setRaw] = useState<RawGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/data/brief/graph.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => alive && setRaw(d))
      .catch((e) => alive && setErr(e?.message || String(e)));
    return () => { alive = false; };
  }, []);

  const { nodes, edges } = useMemo(() => (raw ? normalize(raw) : { nodes: [], edges: [] }), [raw]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const root = byId.get(nodeId) || nodes.find((n) => n.title === nodeId) || null;

  const comp = useMemo(() => (root ? componentOf(root.id, edges) : new Set<string>()), [root, edges]);
  const compNodes = useMemo(() => [...comp].map((i) => byId.get(i)!).filter(Boolean), [comp, byId]);
  const compEdges = useMemo(() => edges.filter((e) => comp.has(e.source) && comp.has(e.target)), [comp, edges]);
  const isCluster = compNodes.length > 1;

  // 左侧 3D 小球：只画这个连通分量（节点少 → 大、清晰、可旋转）
  useEffect(() => {
    if (!compNodes.length || !mountRef.current) return;
    let disposed = false;
    const el = mountRef.current;
    (async () => {
      const mod = await import("3d-force-graph");
      if (disposed) return;
      const ForceGraph3D = mod.default;
      // 小分量用小半径布局，居中放大
      const local = compNodes.map((n) => ({ ...n }));
      sphereLayout(local as GNode[], isCluster ? 130 : 10);
      const { trackColor } = sphereLayout(nodes, 430); // 颜色映射保持与全图一致
      const fg = new ForceGraph3D(el)
        .width(el.clientWidth).height(el.clientHeight)
        .backgroundColor("#f4f7fc")
        .graphData({ nodes: local as object[], links: compEdges.map((e) => ({ ...e })) as object[] })
        .cooldownTicks(0)
        .enableNodeDrag(false)
        .showNavInfo(false)
        .nodeId("id")
        .nodeRelSize(7)
        .nodeLabel((o: object) => { const n = o as GNode; return `<div style="font:12.5px sans-serif;color:#0f172a;background:rgba(255,255,255,.96);border:1px solid #cbd5e1;padding:5px 9px;border-radius:7px;max-width:300px">${n.title}</div>`; })
        .nodeColor((o: object) => { const n = o as GNode; return n.id === root?.id ? "#ea580c" : n.ghost ? "#94a3b8" : trackColor(n.track); })
        .nodeVal((o: object) => { const n = o as GNode; return n.id === root?.id ? 6 : 3.5; })
        .linkColor((o: object) => { const l = o as { type?: string }; return EDGE_COLOR[l.type || "related"] || "#64748b"; })
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
        <div className="nf-kicker">{isCluster ? `记忆联结 · ${compNodes.length} 条记忆` : root.ghost ? "幽灵节点 · 未深读紧邻" : "孤立记忆"}</div>
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
              <div className="globe-members" style={{ marginBottom: 14 }}>
                {compNodes.map((n) => (
                  <a key={n.id} className={`globe-member light ${n.id === root.id ? "root" : ""} ${n.ghost ? "ghost" : ""}`}
                    href={`/mind-palace/node/${encodeURIComponent(n.id)}`}>
                    {shortTitle(n.title, 26)}
                  </a>
                ))}
              </div>
              <div className="nf-edges">
                {compEdges.map((e, i) => {
                  const a = byId.get(e.source); const b = byId.get(e.target);
                  return (
                    <div key={i} className="nf-edge-card">
                      <div className="globe-edge-head">
                        <span className="globe-edge-type" style={{ color: EDGE_COLOR[e.type] || "#475569" }}>{EDGE_LABEL[e.type] || e.type}</span>
                        <span className="nf-edge-pair">{a ? shortTitle(a.title, 20) : e.source} ↔ {b ? shortTitle(b.title, 20) : e.target}</span>
                        {e.confidence && <span className="globe-edge-conf">置信 {e.confidence}</span>}
                      </div>
                      {e.use && <p className="nf-edge-use"><b>怎么利用：</b>{e.use}</p>}
                      {e.evidence && <p className="nf-edge-ev"><b>证据：</b>{e.evidence}</p>}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="nf-h2">这条记忆的核心</h2>
              {root.facets ? (
                <div className="nf-core">
                  {root.facets.problem_solved && <p><b>解决什么：</b>{root.facets.problem_solved}</p>}
                  {root.facets.method && <p><b>用什么方法：</b>{root.facets.method}</p>}
                  {root.facets.result && <p><b>展现结果：</b>{root.facets.result}</p>}
                  {root.facets.innovation && <p><b>创新：</b>{root.facets.innovation}</p>}
                </div>
              ) : (
                <p className="nf-muted">{root.ghost ? "还没深读——这是已知但未内化的紧邻。" : "（这条记忆还没有蒸馏拆解。）"}</p>
              )}
              <div className="nf-noedge">
                <b>为什么还没连边？</b>
                <p>
                  {root.ghost
                    ? "它是已知但还没深读的紧邻——深读后蒸馏 facet 才能进关系判定。"
                    : root.noEdgeReason?.note
                      ? root.noEdgeReason.note + (root.noEdgeReason.kind === "no_real_relation" ? "（判定过候选，确实没有可证实的语义关系——诚实不硬凑）" : "（还没进入候选比较，关系引擎下轮覆盖）")
                      : "关系引擎按 NO_EDGE 默认运行：要么判定过候选无真实关系，要么尚未与它比较——不硬凑边。"}
                </p>
              </div>
              {root.selfEvoUse && <div className="nf-core" style={{ marginTop: 12 }}><p><b>能否用于研究/自进化：</b>{root.selfEvoUse}</p></div>}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
