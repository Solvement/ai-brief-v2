"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SiteHeader } from "./SiteHeader";

// ── types ──────────────────────────────────────────────────────────
interface KGNodeRaw {
  id: string;
  type: "paper" | "principle";
  arxiv_id?: string;
  slug?: string;
  title?: string;
  key?: string;
  principle?: string;
  tags?: string[];
  topic?: string;
  agent_relevant?: boolean;
  is_lineage_seed?: boolean;
  external?: boolean;
  scores?: Record<string, number>;
  papers?: string[];
}
interface KGEdge {
  source: string;
  target: string;
  type: string;
  subtype?: string;
  what_changed?: string;
  confidence?: string;
  via?: string;
  tags?: string[];
}
interface KGData {
  generatedAt: string;
  stats?: Record<string, unknown>;
  nodes: KGNodeRaw[];
  edges: KGEdge[];
}
interface SimNode extends KGNodeRaw {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

const W = 1100;
const H = 760;

// score axes for the JoJo-style ability panel
const SCORE_AXES: { key: string; label: string }[] = [
  { key: "idea_novelty", label: "新颖" },
  { key: "system_design_value", label: "系统设计" },
  { key: "career_value", label: "职业" },
  { key: "autosci_reuse_value", label: "可复用" },
  { key: "buildability", label: "可造" },
  { key: "evaluation_value", label: "评估" },
  { key: "breadth_value", label: "广度" },
  { key: "evidence_quality", label: "证据" },
];

const EDGE_STYLE: Record<string, { color: string; width: number; dash?: string; directed?: boolean }> = {
  forward_lineage: { color: "#ea580c", width: 2.2, directed: true },
  exhibits_principle: { color: "#d8d2c6", width: 1 },
  shares_tag: { color: "#93c5fd", width: 1.2, dash: "4 4" },
  shares_principle: { color: "#a7f3d0", width: 1.2, dash: "2 4" },
};
function edgeStyle(t: string) {
  return EDGE_STYLE[t] || { color: "#cbd5e1", width: 1.2 };
}

function nodeColor(n: KGNodeRaw): string {
  if (n.type === "principle") return "#2f9e63";
  if (n.external) return "#ffffff";
  if (n.agent_relevant) return "#2563eb";
  return "#7c3aed";
}
function nodeRadius(n: KGNodeRaw): number {
  if (n.type === "principle") return 6;
  if (n.external) return 7;
  return n.is_lineage_seed ? 13 : 11;
}
function shortTitle(n: KGNodeRaw): string {
  if (n.type === "principle") return n.key || "";
  const t = (n.title || n.arxiv_id || "").replace(/[:：].*$/, "");
  return t.length > 22 ? t.slice(0, 21) + "…" : t;
}

// ── ability radar (JoJo panel) ─────────────────────────────────────
function AbilityRadar({ scores }: { scores: Record<string, number> }) {
  const R = 78;
  const cx = 110;
  const cy = 100;
  const pts = SCORE_AXES.map((ax, i) => {
    const v = Math.max(0, Math.min(10, scores[ax.key] ?? 0)) / 10;
    const a = (i / SCORE_AXES.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * R * v, y: cy + Math.sin(a) * R * v, ax, a, v };
  });
  const ring = (f: number) =>
    SCORE_AXES.map((_, i) => {
      const a = (i / SCORE_AXES.length) * Math.PI * 2 - Math.PI / 2;
      return `${cx + Math.cos(a) * R * f},${cy + Math.sin(a) * R * f}`;
    }).join(" ");
  return (
    <svg viewBox="0 0 220 210" className="kg-radar">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#e7e3da" strokeWidth={1} />
      ))}
      {SCORE_AXES.map((ax, i) => {
        const a = (i / SCORE_AXES.length) * Math.PI * 2 - Math.PI / 2;
        return <line key={ax.key} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="#e7e3da" strokeWidth={1} />;
      })}
      <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="rgba(124,58,237,.22)" stroke="#7c3aed" strokeWidth={2} />
      {pts.map((p) => (
        <circle key={p.ax.key} cx={p.x} cy={p.y} r={2.4} fill="#7c3aed" />
      ))}
      {SCORE_AXES.map((ax, i) => {
        const a = (i / SCORE_AXES.length) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(a) * (R + 16);
        const ly = cy + Math.sin(a) * (R + 16);
        return (
          <text key={ax.key} x={lx} y={ly} className="kg-radar-label" textAnchor="middle" dominantBaseline="middle">
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── main component ─────────────────────────────────────────────────
export function KnowledgeGraph() {
  const [data, setData] = useState<KGData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [showPrinciples, setShowPrinciples] = useState(true);

  const simRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<KGEdge[]>([]);
  const alphaRef = useRef(1);
  const dragRef = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    fetch("/data/knowledge-graph.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("加载失败 " + r.status))))
      .then((d: KGData) => setData(d))
      .catch((e) => setErr(e.message || String(e)));
  }, []);

  // init simulation when data arrives
  useEffect(() => {
    if (!data) return;
    const cx = W / 2;
    const cy = H / 2;
    simRef.current = data.nodes.map((n, i) => {
      const a = (i / data.nodes.length) * Math.PI * 2;
      const rr = n.type === "paper" && !n.external ? 90 : 230;
      return { ...n, x: cx + Math.cos(a) * rr + (Math.random() - 0.5) * 40, y: cy + Math.sin(a) * rr + (Math.random() - 0.5) * 40, vx: 0, vy: 0, pinned: false };
    });
    edgesRef.current = data.edges;
    alphaRef.current = 1;

    const idIndex = new Map(simRef.current.map((n, i) => [n.id, i]));
    const step = () => {
      const nodes = simRef.current;
      const edges = edgesRef.current;
      const alpha = alphaRef.current;
      // charge repulsion (O(n^2), fine for ~50 nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          const d = Math.sqrt(d2);
          const f = (1500 * alpha) / d2;
          const ux = dx / d;
          const uy = dy / d;
          a.vx += ux * f;
          a.vy += uy * f;
          b.vx -= ux * f;
          b.vy -= uy * f;
        }
      }
      // link springs
      for (const e of edges) {
        const ia = idIndex.get(e.source);
        const ib = idIndex.get(e.target);
        if (ia == null || ib == null) continue;
        const a = nodes[ia];
        const b = nodes[ib];
        const L = e.type === "exhibits_principle" ? 72 : e.type === "forward_lineage" ? 150 : 116;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - L) * 0.045 * alpha;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        a.vx += ux;
        a.vy += uy;
        b.vx -= ux;
        b.vy -= uy;
      }
      // centering + integrate
      for (const n of nodes) {
        if (n.pinned) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (W / 2 - n.x) * 0.011 * alpha;
        n.vy += (H / 2 - n.y) * 0.011 * alpha;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(24, Math.min(W - 24, n.x));
        n.y = Math.max(24, Math.min(H - 24, n.y));
      }
      alphaRef.current = Math.max(0.015, alpha * 0.992);
      setTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data]);

  // pointer → svg coords
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
  }, []);

  const onPointerDownNode = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = id;
    const n = simRef.current.find((m) => m.id === id);
    if (n) n.pinned = true;
    alphaRef.current = Math.max(alphaRef.current, 0.5);
    setSelected(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const p = toSvg(e.clientX, e.clientY);
    const n = simRef.current.find((m) => m.id === dragRef.current);
    if (n) {
      n.x = p.x;
      n.y = p.y;
    }
  };
  const onPointerUp = () => {
    if (dragRef.current) {
      const n = simRef.current.find((m) => m.id === dragRef.current);
      if (n) n.pinned = false;
      dragRef.current = null;
    }
  };

  const nodes = simRef.current;
  const edges = edgesRef.current;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes, data]);

  // neighbor highlight set
  const active = hover || selected;
  const neighborSet = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>([active]);
    for (const e of edges) {
      if (e.source === active) s.add(e.target);
      if (e.target === active) s.add(e.source);
    }
    return s;
  }, [active, edges]);

  const selectedNode = selected ? byId.get(selected) : null;
  const selectedEdges = useMemo(() => {
    if (!selected) return [] as { e: KGEdge; other?: KGNodeRaw; dir: "out" | "in" }[];
    const out: { e: KGEdge; other?: KGNodeRaw; dir: "out" | "in" }[] = [];
    for (const e of edges) {
      if (e.source === selected) out.push({ e, other: byId.get(e.target), dir: "out" });
      else if (e.target === selected) out.push({ e, other: byId.get(e.source), dir: "in" });
    }
    return out;
  }, [selected, edges, byId]);

  const stats = data?.stats as { nodeByType?: Record<string, number>; edgeByType?: Record<string, number> } | undefined;

  return (
    <>
      <SiteHeader active="graph" />
      <main className="page kg-page">
        <div className="kg-head">
          <div>
            <div className="eyebrow">Knowledge Graph</div>
            <h1>L0 知识图谱 · 大脑神经元网</h1>
            <p>论文与设计原则是神经元，<b style={{ color: "#ea580c" }}>橙色边 = 后续演化（谁优化/替换了谁）</b>，灰边=论文体现的设计原则。拖动节点，点论文看能力面板。</p>
          </div>
          <div className="kg-legend">
            {stats?.nodeByType && (
              <span className="kg-chip">论文 {stats.nodeByType.paper ?? 0} · 原则 {stats.nodeByType.principle ?? 0}</span>
            )}
            {stats?.edgeByType?.forward_lineage != null && (
              <span className="kg-chip kg-chip-fwd">边效应 {stats.edgeByType.forward_lineage}</span>
            )}
            <button className="kg-toggle" onClick={() => setShowPrinciples((v) => !v)}>
              {showPrinciples ? "隐藏原则节点" : "显示原则节点"}
            </button>
          </div>
        </div>

        {err && <div className="notice error">知识图谱加载失败：{err}</div>}

        <div className="kg-stage">
          <svg
            ref={svgRef}
            className="kg-svg"
            viewBox={`0 0 ${W} ${H}`}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={() => setSelected(null)}
          >
            <defs>
              <marker id="kg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#ea580c" />
              </marker>
            </defs>
            {/* edges */}
            <g>
              {edges.map((e, i) => {
                const a = byId.get(e.source);
                const b = byId.get(e.target);
                if (!a || !b) return null;
                if (!showPrinciples && (a.type === "principle" || b.type === "principle")) return null;
                const st = edgeStyle(e.type);
                const dim = neighborSet && !(neighborSet.has(e.source) && neighborSet.has(e.target));
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={st.color}
                    strokeWidth={st.width}
                    strokeDasharray={st.dash}
                    markerEnd={st.directed ? "url(#kg-arrow)" : undefined}
                    opacity={dim ? 0.08 : st.color === "#d8d2c6" ? 0.55 : 0.85}
                  />
                );
              })}
            </g>
            {/* nodes */}
            <g>
              {nodes.map((n) => {
                if (!showPrinciples && n.type === "principle") return null;
                const dim = neighborSet && !neighborSet.has(n.id);
                const r = nodeRadius(n);
                const isPaper = n.type === "paper";
                const showLabel = (isPaper && !n.external) || active === n.id || hover === n.id;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    opacity={dim ? 0.25 : 1}
                    style={{ cursor: "pointer" }}
                    onPointerDown={onPointerDownNode(n.id)}
                    onPointerEnter={() => setHover(n.id)}
                    onPointerLeave={() => setHover(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(n.id);
                    }}
                  >
                    <circle
                      r={r}
                      fill={nodeColor(n)}
                      stroke={n.external ? "#94a3b8" : selected === n.id ? "#ea580c" : "#ffffff"}
                      strokeWidth={selected === n.id ? 3 : n.external ? 1.5 : 2}
                    />
                    {n.is_lineage_seed && <circle r={r + 3} fill="none" stroke="#2563eb" strokeWidth={1} opacity={0.5} />}
                    {showLabel && (
                      <text className={`kg-node-label ${n.type === "principle" ? "kg-label-pri" : ""}`} x={0} y={r + 12} textAnchor="middle">
                        {shortTitle(n)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* side panel */}
          {selectedNode && (
            <aside className="kg-panel">
              <button className="kg-panel-close" onClick={() => setSelected(null)}>
                ×
              </button>
              {selectedNode.type === "paper" ? (
                <>
                  <div className="kg-panel-kind">{selectedNode.external ? "外部 · 后续工作" : selectedNode.agent_relevant ? "Agent 论文" : "论文"}</div>
                  <h3>{selectedNode.title}</h3>
                  <div className="kg-panel-meta">
                    {selectedNode.arxiv_id && <span>arXiv:{selectedNode.arxiv_id}</span>}
                    {selectedNode.is_lineage_seed && <span className="kg-seed">脉络种子</span>}
                  </div>
                  {selectedNode.scores && Object.keys(selectedNode.scores).length > 0 && (
                    <>
                      <div className="kg-panel-sub">能力面板</div>
                      <AbilityRadar scores={selectedNode.scores} />
                    </>
                  )}
                  {!selectedNode.external && selectedNode.slug && (
                    <a className="kg-panel-link" href={`/papers/${selectedNode.slug}`}>
                      读深读 →
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className="kg-panel-kind">设计原则 · 概念神经元</div>
                  <h3>{selectedNode.key}</h3>
                  <p className="kg-panel-principle">{selectedNode.principle}</p>
                </>
              )}
              {selectedEdges.length > 0 && (
                <div className="kg-panel-conn">
                  <div className="kg-panel-sub">连接（{selectedEdges.length}）</div>
                  {selectedEdges.map(({ e, other, dir }, i) => (
                    <button key={i} className="kg-conn-row" onClick={() => other && setSelected(other.id)}>
                      <span className={`kg-conn-type kg-conn-${e.type}`}>
                        {e.type === "forward_lineage" ? (dir === "out" ? "→演化" : "←前身") : e.type === "exhibits_principle" ? "原则" : e.type === "shares_tag" ? "同主题" : e.type}
                        {e.subtype ? ` · ${e.subtype}` : ""}
                      </span>
                      <span className="kg-conn-title">{other ? shortTitle(other) : ""}</span>
                      {e.what_changed && <span className="kg-conn-what">{e.what_changed}</span>}
                    </button>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
