"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { RosObjectPanel, useRosObject } from "./RosObjectPanel";

// ════════════════════════════════════════════════════════════════════
//  Mind Palace 星图 v3（KG-4 Research Object Store 投影，2026-06-12 重做）
//  - 数据源：public/data/brief/ros-graph.json（对象库投影，只含 kind=paper 文章）
//  - 节点=文章；边=对象级关系聚合（claim/机制/假设级，点开展开）；
//    命题/张力（propositions）= 面板的群体分析层。
//  - 项目 col 不进星图（Kevin 2026-06-12 产品决策）；项目对象保留在数据层作命题证据。
//  - 球壳分区布局/聚焦让位机制沿用 v2（Kevin 已验收的交互），旧 facet 投影退役。
// ════════════════════════════════════════════════════════════════════

export interface RosGraphNode {
  id: string; slug: string; kind: string; title: string; thesis?: string;
  problems?: string[]; concepts?: string[]; benchmarks?: string[];
  cluster?: string; counts?: Record<string, number>;
  fx?: number; fy?: number; fz?: number; x?: number; y?: number; z?: number;
  deg?: number;
}
export interface RosRelation {
  relation_type: string; source_object?: string; target_object?: string;
  confidence?: string; derived_by?: string; boundary?: string; reason?: string;
}
export interface RosGraphEdge {
  id?: string; source: string; target: string;
  primary_type: string; confidence?: string; count?: number;
  relations?: RosRelation[];
}
export interface RosPropEvidence { claim_id: string; owner: string; owner_kind?: string; excerpt?: string }
export interface RosProposition {
  id: string; statement: string; state?: string; cluster?: string;
  possible_synthesis?: string; support?: RosPropEvidence[]; oppose?: RosPropEvidence[];
}
export interface RosGraph { schema?: string; nodes?: RosGraphNode[]; edges?: RosGraphEdge[]; propositions?: RosProposition[] }

export const CLUSTER_LABEL: Record<string, string> = {
  mem: "记忆", agent: "Agent 工程", eval: "评测", code: "代码理解",
  skill: "技能参数化", train: "训练信号", infra: "推理设施", data: "数据工厂", 未分区: "未分区",
};
export const EDGE_LABEL: Record<string, string> = {
  evaluates: "实测评测", can_be_evaluated_by: "可被评测（功能）", shares_problem: "同问题底座",
  tension_with: "张力/路线冲突", complements: "取长补短", compares_with: "同赛道对比",
  composes_with: "可拼接", supersedes: "替代", precedes: "谱系前作", validates: "互证",
};
export const EDGE_COLOR: Record<string, string> = {
  evaluates: "#0e7490", can_be_evaluated_by: "#0891b2", shares_problem: "#cbd5e1",
  tension_with: "#b91c1c", complements: "#15803d", compares_with: "#b45309",
  composes_with: "#4338ca", supersedes: "#7c3aed", precedes: "#64748b", validates: "#0f766e",
};
const STATE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "尚无定论", color: "#64748b", bg: "#f8fafc" },
  "leaning-support": { label: "证据偏向成立", color: "#15803d", bg: "#f0fdf4" },
  "leaning-oppose": { label: "证据偏向不成立", color: "#b91c1c", bg: "#fef2f2" },
  resolved: { label: "已收敛", color: "#0e7490", bg: "#ecfeff" },
};

export function shortTitle(t: string, max = 30): string {
  const head = t.replace(/\s*[—:：].*$/, "").trim() || t;
  return head.length > max ? head.slice(0, max - 1) + "…" : head;
}

// 浅底高对比色板（light theme 宪法）
const CLUSTER_COLORS = ["#1d4ed8", "#7c3aed", "#0e7490", "#15803d", "#b45309", "#b91c1c", "#be185d", "#4338ca", "#0f766e", "#86198f"];

// ── 球壳分区布局：cluster（正典问题域）= 球面"大洲" ──
export function sphereLayout(nodes: RosGraphNode[], R = 430) {
  const clusters = [...new Set(nodes.map((n) => n.cluster || "未分区"))];
  const centers = new Map<string, [number, number, number]>();
  const k = Math.max(1, clusters.length);
  clusters.forEach((t, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / k);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    centers.set(t, [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)]);
  });
  const byCluster = new Map<string, RosGraphNode[]>();
  for (const n of nodes) {
    const c = n.cluster || "未分区";
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(n);
  }
  for (const [t, members] of byCluster) {
    const c = centers.get(t)!;
    const up: [number, number, number] = Math.abs(c[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const tx = norm3(cross3(up, c));
    const ty = cross3(c, tx);
    const spread = Math.min(0.8, 0.3 + members.length * 0.03);
    members.forEach((m, i) => {
      const r = spread * Math.sqrt((i + 0.5) / members.length);
      const a = i * 2.39996; // golden angle
      const p = norm3([
        c[0] + (tx[0] * Math.cos(a) + ty[0] * Math.sin(a)) * r,
        c[1] + (tx[1] * Math.cos(a) + ty[1] * Math.sin(a)) * r,
        c[2] + (tx[2] * Math.cos(a) + ty[2] * Math.sin(a)) * r,
      ]);
      m.fx = p[0] * R; m.fy = p[1] * R; m.fz = p[2] * R;
    });
  }
  return { centers, clusterColor: (t: string) => CLUSTER_COLORS[Math.max(0, clusters.indexOf(t)) % CLUSTER_COLORS.length] };
}
function cross3(a: number[], b: number[]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm3(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ── 连通分量（同问题底座边不算连通依据，判断型关系才把记忆连成串） ──
export function componentOf(id: string, edges: RosGraphEdge[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.primary_type === "shares_problem") continue;
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  }
  const seen = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nb of adj.get(cur) || []) if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
  }
  return seen;
}

function edgeWidth(e: RosGraphEdge): number {
  if (e.primary_type === "shares_problem") return 0.4;
  return e.confidence === "high" ? 1.9 : e.confidence === "medium" ? 1.2 : 0.7;
}
function edgeBaseColor(e: RosGraphEdge): string {
  if (e.primary_type === "shares_problem") return "rgba(148,163,184,0.25)";
  return EDGE_COLOR[e.primary_type] || "#64748b";
}

// ── 关系卡（边的对象级展开） ──
export function RelationCards({ edges, byId }: { edges: RosGraphEdge[]; byId: Map<string, RosGraphNode> }) {
  const [open, setOpen] = useState<string | null>(null);
  const judged = edges.filter((e) => e.primary_type !== "shares_problem");
  const base = edges.filter((e) => e.primary_type === "shares_problem");
  return (
    <div className="globe-edges">
      {judged.map((e, i) => {
        const a = byId.get(e.source); const b = byId.get(e.target);
        const key = e.id || `${e.source}|${e.target}|${i}`;
        const expanded = open === key;
        const rels = e.relations || [];
        return (
          <div key={key} className="globe-edge-card">
            <div className="globe-edge-head">
              <span className="globe-edge-type" style={{ color: EDGE_COLOR[e.primary_type] || "#94a3b8" }}>{EDGE_LABEL[e.primary_type] || e.primary_type}</span>
              <span className="globe-edge-pair">{a ? shortTitle(a.title, 18) : e.source} ↔ {b ? shortTitle(b.title, 18) : e.target}</span>
              {e.confidence && <span className="globe-edge-conf">置信 {e.confidence}</span>}
              {rels.length > 1 && (
                <button onClick={() => setOpen(expanded ? null : key)}
                  style={{ marginLeft: "auto", fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                  {expanded ? "收起" : `${rels.length} 条对象级关系 ▸`}
                </button>
              )}
            </div>
            {(expanded ? rels : rels.slice(0, 1)).map((r, j) => (
              <div key={j} style={{ marginTop: 6, fontSize: 12.5, color: "#475569", borderLeft: "2px solid #e2e8f0", paddingLeft: 9 }}>
                <p style={{ margin: 0 }}>
                  <b style={{ color: "#334155" }}>{r.source_object}</b> → <b style={{ color: "#334155" }}>{r.target_object}</b>
                  <span style={{ color: "#94a3b8" }}>（{EDGE_LABEL[r.relation_type] || r.relation_type}{r.derived_by === "structural_join" ? " · 结构推导" : r.derived_by === "llm_judgment" ? " · 判定" : ""}）</span>
                </p>
                {r.reason && <p style={{ margin: "2px 0 0" }}>{r.reason}</p>}
                {r.boundary && <p style={{ margin: "2px 0 0", color: "#9a3412" }}>边界：{r.boundary}</p>}
              </div>
            ))}
          </div>
        );
      })}
      {base.length > 0 && (
        <p className="globe-empty" style={{ marginTop: 8 }}>另有 {base.length} 条「同问题底座」关联（结构推导，不构成判断）。</p>
      )}
      {judged.length === 0 && base.length === 0 && <p className="globe-empty">（这串记忆之间暂无已判定关系。）</p>}
    </div>
  );
}

// ── 命题板（群体分析层：科研张力的正反证据） ──
export function PropositionCards({ props: propositions }: { props: RosProposition[] }) {
  if (!propositions.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="globe-synth-h" style={{ marginBottom: 8 }}>群体视角 · 这一簇在争什么命题</div>
      <div style={{ display: "grid", gap: 10 }}>
        {propositions.map((p) => {
          const st = STATE_LABEL[p.state || "open"] || STATE_LABEL.open;
          return (
            <div key={p.id} style={{ border: "1px solid #e0e7ff", background: "#fafbff", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: "1px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.label}</span>
                <b style={{ fontSize: 13.5, color: "#0f172a" }}>{p.statement}</b>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>正方证据</div>
                  {(p.support || []).map((s) => (
                    <p key={s.claim_id} style={{ margin: "0 0 4px", fontSize: 12, color: "#475569" }}>
                      <b>{s.owner}</b>{s.owner_kind === "project" && <span style={{ color: "#94a3b8" }}>（项目证据）</span>}：{s.excerpt}
                    </p>
                  ))}
                  {!(p.support || []).length && <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>（暂无）</p>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>反方证据</div>
                  {(p.oppose || []).map((s) => (
                    <p key={s.claim_id} style={{ margin: "0 0 4px", fontSize: 12, color: "#475569" }}>
                      <b>{s.owner}</b>{s.owner_kind === "project" && <span style={{ color: "#94a3b8" }}>（项目证据）</span>}：{s.excerpt}
                    </p>
                  ))}
                  {!(p.oppose || []).length && <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>（暂无）</p>}
                </div>
              </div>
              {p.possible_synthesis && (
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#0e7490" }}><b>可能的第三条路：</b>{p.possible_synthesis}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
export function MindPalaceGlobe() {
  const [raw, setRaw] = useState<RosGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [focus, setFocus] = useState<Set<string> | null>(null);
  const [focusRoot, setFocusRoot] = useState<string | null>(null);
  const [libErr, setLibErr] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ReturnType<typeof Object> | null>(null);
  const dataRef = useRef<{ nodes: RosGraphNode[]; edges: RosGraphEdge[] } | null>(null);
  const focusRef = useRef<Set<string> | null>(null);
  focusRef.current = focus;

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
    const es = (raw?.edges || []).filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target);
    const deg = new Map<string, number>();
    for (const e of es) {
      if (e.primary_type === "shares_problem") continue;
      deg.set(e.source, (deg.get(e.source) || 0) + 1);
      deg.set(e.target, (deg.get(e.target) || 0) + 1);
    }
    for (const n of ns) n.deg = deg.get(n.id) || 0;
    return { nodes: ns, edges: es };
  }, [raw]);
  const propositions = useMemo(() => raw?.propositions || [], [raw]);

  // ── 3D 球实例化（懒加载库） ──
  useEffect(() => {
    if (!nodes.length || !mountRef.current) return;
    let disposed = false;
    const el = mountRef.current;
    (async () => {
      try {
        const mod = await import("3d-force-graph");
        if (disposed) return;
        const ForceGraph3D = mod.default;
        const { clusterColor } = sphereLayout(nodes);
        dataRef.current = { nodes, edges };

        const fg = new ForceGraph3D(el)
          .width(el.clientWidth).height(el.clientHeight)
          .backgroundColor("#f4f7fc") // 浅底（light theme 宪法）
          .graphData({ nodes: nodes as object[], links: edges.map((e) => ({ ...e })) as object[] })
          .cooldownTicks(0)
          .enableNodeDrag(false)
          .showNavInfo(false)
          .nodeId("id")
          .nodeRelSize(5)
          .nodeLabel((o: object) => {
            const n = o as RosGraphNode;
            return `<div style="font:12.5px sans-serif;color:#0f172a;background:rgba(255,255,255,.96);border:1px solid #cbd5e1;padding:5px 9px;border-radius:7px;max-width:320px;box-shadow:0 4px 14px rgba(15,23,42,.12)"><b>${n.title}</b>${n.thesis ? `<br/><span style="color:#475569">${n.thesis.slice(0, 110)}…</span>` : ""}</div>`;
          })
          .nodeVal((o: object) => {
            const n = o as RosGraphNode;
            const substance = (n.counts?.claims || 0) + (n.counts?.mechanisms || 0);
            return 2.5 + Math.min(5, substance * 0.5) + Math.min(4, (n.deg || 0) * 0.9);
          })
          .nodeColor((o: object) => {
            const n = o as RosGraphNode;
            const f = focusRef.current;
            const base = clusterColor(n.cluster || "未分区");
            if (!f) return base;
            return f.has(n.id) ? base : "rgba(148,163,184,0.18)";
          })
          .nodeOpacity(0.95)
          .linkColor((o: object) => {
            const l = o as RosGraphEdge & { source?: RosGraphNode | string; target?: RosGraphNode | string };
            const f = focusRef.current;
            const c = edgeBaseColor(l as RosGraphEdge);
            if (!f) return c;
            const s = typeof l.source === "object" ? (l.source as RosGraphNode)?.id : l.source;
            const t = typeof l.target === "object" ? (l.target as RosGraphNode)?.id : l.target;
            return s && t && f.has(s as string) && f.has(t as string) ? c : "rgba(148,163,184,0.06)";
          })
          .linkWidth((o: object) => edgeWidth(o as RosGraphEdge))
          .linkOpacity(0.55)
          .linkDirectionalParticles((o: object) => {
            const l = o as RosGraphEdge;
            return l.primary_type === "evaluates" || l.primary_type === "supersedes" ? 2 : 0;
          })
          .linkDirectionalParticleWidth(1.6)
          .onNodeClick((o: object) => focusOn(o as RosGraphNode))
          .onBackgroundClick(() => { if (focusRef.current) return; });

        function focusOn(n: RosGraphNode) {
          const comp = componentOf(n.id, dataRef.current!.edges);
          setFocus(comp);
          setFocusRoot(n.id);
          const d = Math.hypot(n.fx || 1, n.fy || 1, n.fz || 1) || 1;
          const k = 1.9;
          fg.cameraPosition({ x: ((n.fx || 0) / d) * d * k, y: ((n.fy || 0) / d) * d * k, z: ((n.fz || 0) / d) * d * k }, { x: n.fx || 0, y: n.fy || 0, z: n.fz || 0 }, 900);
          setTimeout(() => fg.refresh(), 50);
        }
        fg.cameraPosition({ x: 0, y: 0, z: 980 });
        fgRef.current = fg as object;

        // ?focus=<id|slug|title> 深链（检索区/自动化验证钩子共用）
        const focusParam = new URLSearchParams(location.search).get("focus");
        if (focusParam) {
          const target = nodes.find((x) => x.id === focusParam || x.slug === focusParam || x.title === focusParam);
          if (target) setTimeout(() => focusOn(target), 400);
        }
        (window as unknown as { __mpFocus?: (id: string) => boolean }).__mpFocus = (id: string) => {
          const target = nodes.find((x) => x.id === id || x.slug === id || x.title.includes(id));
          if (target) { focusOn(target); return true; }
          return false;
        };

        const onResize = () => fg.width(el.clientWidth).height(el.clientHeight);
        window.addEventListener("resize", onResize);
        (el as HTMLDivElement & { __cleanup?: () => void }).__cleanup = () => {
          window.removeEventListener("resize", onResize);
          fg._destructor?.();
        };
      } catch (e) {
        setLibErr((e as Error)?.message || String(e));
      }
    })();
    return () => {
      disposed = true;
      (el as HTMLDivElement & { __cleanup?: () => void }).__cleanup?.();
      el.innerHTML = "";
      fgRef.current = null;
    };
  }, [nodes, edges]);

  // focus 变化 → 画布尺寸同步（CSS 过渡后），防 WebGL 画布盖住面板
  useEffect(() => {
    const fg = fgRef.current as { width?: (n: number) => void; height?: (n: number) => void; refresh?: () => void } | null;
    const el = mountRef.current;
    if (!fg) return;
    fg.refresh?.();
    if (!el) return;
    const t = setTimeout(() => {
      fg.width?.(el.clientWidth);
      fg.height?.(el.clientHeight);
      fg.refresh?.();
    }, 650);
    return () => clearTimeout(t);
  }, [focus]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const focusNodes = useMemo(() => (focus ? [...focus].map((i) => byId.get(i)!).filter(Boolean) : []), [focus, byId]);
  const focusEdges = useMemo(() => {
    if (!focus) return [] as RosGraphEdge[];
    return edges.filter((e) => focus.has(e.source) && focus.has(e.target));
  }, [focus, edges]);
  const rootNode = focusRoot ? byId.get(focusRoot) : null;
  const isCluster = focusNodes.length > 1;
  const focusProps = useMemo(() => {
    if (!focus) return [] as RosProposition[];
    const slugs = new Set(focusNodes.map((n) => n.slug));
    return propositions.filter((p) =>
      (p.support || []).some((s) => slugs.has(s.owner)) || (p.oppose || []).some((s) => slugs.has(s.owner)));
  }, [focus, focusNodes, propositions]);
  const { obj: rootObj, loading: rootLoading } = useRosObject(rootNode && !isCluster ? rootNode.slug : null);

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace · AI 记忆球</div>
          <h1>星图 · 记忆球</h1>
          <p>
            这是<b>AI 的自我记忆库</b>——只含<b>深读过的文章</b>。每篇被拆成主张/机制/假设/失败模式等可推理对象，
            按<b>问题域分区</b>固定在球壳上；连线=<b>带证据与边界的对象级关系</b>（淡虚线=同问题底座，彩线=已判定关系，线越粗置信越高）。
            <b>拖动旋转 · 滚轮缩放 · 点一个点</b> → 球让位、面板展开。
          </p>
        </div>
      </div>

      {err && <div className="notice error">记忆球加载失败：{err}</div>}
      {libErr && <div className="notice error">3D 引擎加载失败：{libErr}（可刷新重试）</div>}
      {!err && !raw && <div className="kg-loading">加载记忆球…</div>}

      {raw && (
        <div className={`globe-stage ${focus ? "focused" : ""}`}>
          <div className="globe-canvas" ref={mountRef} />
          {focus && (
            <aside className="globe-panel">
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <button className="globe-panel-close" style={{ marginBottom: 0 }} onClick={() => { setFocus(null); setFocusRoot(null); (fgRef.current as { cameraPosition?: (a: object, b: object, c: number) => void } | null)?.cameraPosition?.({ x: 0, y: 0, z: 980 }, { x: 0, y: 0, z: 0 }, 900); }}>× 返回全球</button>
                {focusRoot && (
                  <a className="globe-fullpage" href={`/mind-palace/node/${encodeURIComponent(focusRoot)}`}>⤢ 全屏打开这条记忆</a>
                )}
              </div>

              {isCluster ? (
                <>
                  <div className="globe-panel-kicker">关系分析 · 这一串记忆为什么连在一起</div>
                  <h2 className="globe-panel-title">{focusNodes.length} 篇文章的对象级关系</h2>
                  <PropositionCards props={focusProps} />
                  <div className="globe-members">
                    {focusNodes.map((n) => (
                      <a key={n.id} className={`globe-member ${n.id === focusRoot ? "root" : ""}`}
                        href={`/mind-palace/node/${encodeURIComponent(n.id)}`}>
                        {shortTitle(n.title, 24)}
                      </a>
                    ))}
                  </div>
                  <RelationCards edges={focusEdges} byId={byId} />
                </>
              ) : rootNode ? (
                <>
                  <div className="globe-panel-kicker">
                    {CLUSTER_LABEL[rootNode.cluster || ""] || rootNode.cluster || "记忆"} · {rootNode.counts?.claims || 0} 主张 · {rootNode.counts?.mechanisms || 0} 机制
                  </div>
                  <h2 className="globe-panel-title">{rootNode.title}</h2>
                  {rootLoading && <p className="kg-loading">加载对象层…</p>}
                  {rootObj && <RosObjectPanel obj={rootObj} compact />}
                  {!rootLoading && !rootObj && rootNode.thesis && (
                    <div className="globe-core"><p>{rootNode.thesis}</p></div>
                  )}
                  {focusProps.length > 0 && <div style={{ marginTop: 12 }}><PropositionCards props={focusProps} /></div>}
                </>
              ) : null}
            </aside>
          )}
        </div>
      )}
    </main>
  );
}
