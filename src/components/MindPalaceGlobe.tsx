"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ════════════════════════════════════════════════════════════════════
//  Mind Palace 星图 v2 — 真 3D 记忆球（Kevin 2026-06-11 深夜定）
//  - 3d-force-graph（MIT，three.js）懒加载，只在星图 tab 实例化
//  - 有规律布局：节点按 track/主题聚簇，固定在球壳分区上（非力学乱抖）
//  - 点一簇（连通分量）→ 相机动画聚焦、画布让位左侧、右侧大面板展开
//    成员间「密切联系」分析（关系型+怎么利用+逐字证据）
//  - 点孤点 → 同动画，面板=这篇的核心(XYZ 拆解) + 为什么还没连边（诚实）
//  - 面板=深蓝玻璃风，刻意区别于检索区的白卡片
//  - 缺口视图（gap view）从旧 KnowledgeGraph 迁入（唯一真相，不留旧文件）
// ════════════════════════════════════════════════════════════════════

interface RawNode {
  id: string; type?: string; slug?: string; title?: string; name?: string;
  tags?: string[]; track?: string; ghost?: boolean;
  facets?: Record<string, string>; self_evo_use?: string; design_idea?: string;
  no_edge_reason?: { kind?: string; note?: string };
  [k: string]: unknown;
}
interface RawEdge {
  source?: string; target?: string; from?: string; to?: string;
  type?: string; evidence?: string; use?: string; confidence?: string | number;
  layer?: string; hidden?: boolean;
  [k: string]: unknown;
}
interface RawGraph { nodes?: RawNode[]; edges?: RawEdge[] }

interface GNode {
  id: string; title: string; kind: "paper" | "project" | "ghost" | "other";
  track: string; tags: string[]; ghost: boolean;
  facets?: Record<string, string>; selfEvoUse?: string;
  noEdgeReason?: { kind?: string; note?: string };
  deg: number;
  // 3d-force-graph 固定坐标（球壳分区布局）
  fx?: number; fy?: number; fz?: number;
  x?: number; y?: number; z?: number;
}
interface GEdge {
  source: string; target: string; type: string;
  evidence?: string; use?: string; confidence?: string;
}

const EDGE_LABEL: Record<string, string> = {
  improves_on: "取长补短/优化", composes_with: "可合并/前后关联", contradicts: "思路相反",
  builds_on: "演进自", implements: "实现", shares_method: "共享方法",
  shares_concept: "共享概念", same_track: "同赛道", same_use_case: "同用例",
  complements: "互补", references: "引用", related: "关联",
};
const EDGE_COLOR: Record<string, string> = {
  improves_on: "#f87171", composes_with: "#22d3ee", contradicts: "#fbbf24",
  builds_on: "#fb923c", implements: "#a78bfa", shares_method: "#34d399",
  shares_concept: "#c4b5fd", complements: "#67e8f9", related: "#94a3b8",
};
const TRACK_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#db2777", "#4f46e5", "#0d9488", "#9333ea"];

function shortTitle(t: string, max = 30): string {
  const head = t.replace(/\s*[—:：].*$/, "").trim() || t;
  return head.length > max ? head.slice(0, max - 1) + "…" : head;
}

// ── normalize ──
function normalize(raw: RawGraph): { nodes: GNode[]; edges: GEdge[] } {
  const PAPER = new Set(["paper", "content", "deep-dive", "article"]);
  const PROJ = new Set(["project", "repo"]);
  const rawNodes = raw.nodes || [];
  const ids = new Set(rawNodes.map((n) => n.id));
  const edges: GEdge[] = [];
  for (const e of raw.edges || []) {
    if (e.layer === "mechanical" || e.hidden === true) continue;
    const s = (e.source || e.from || "") as string;
    const t = (e.target || e.to || "") as string;
    if (!s || !t || s === t || !ids.has(s) || !ids.has(t)) continue;
    edges.push({ source: s, target: t, type: (e.type || "related").toLowerCase(), evidence: e.evidence, use: e.use as string | undefined, confidence: e.confidence != null ? String(e.confidence) : undefined });
  }
  const deg = new Map<string, number>();
  for (const e of edges) { deg.set(e.source, (deg.get(e.source) || 0) + 1); deg.set(e.target, (deg.get(e.target) || 0) + 1); }

  const nodes: GNode[] = rawNodes
    .filter((n) => n.facets || n.self_evo_use || n.design_idea || n.ghost) // 只画真·内化记忆 + 幽灵紧邻
    .map((n) => {
      const t = (n.type || "").toLowerCase();
      const kind = n.ghost ? "ghost" : PAPER.has(t) ? "paper" : PROJ.has(t) ? "project" : "other";
      return {
        id: n.id,
        title: (n.title || n.name || n.slug || n.id).toString(),
        kind, ghost: !!n.ghost,
        track: (n.track || n.tags?.[0] || "未分区").toString(),
        tags: Array.isArray(n.tags) ? n.tags : [],
        facets: n.facets, selfEvoUse: n.self_evo_use,
        noEdgeReason: n.no_edge_reason,
        deg: deg.get(n.id) || 0,
      } as GNode;
    });
  const nodeIds = new Set(nodes.map((n) => n.id));
  return { nodes, edges: edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)) };
}

// ── 球壳分区布局：track 簇 = 球面"大洲"，成员绕簇心切平面散开后投回球壳 ──
function sphereLayout(nodes: GNode[], R = 320) {
  const tracks = [...new Set(nodes.map((n) => n.track))];
  // fibonacci sphere 给每个 track 一个簇心方向
  const centers = new Map<string, [number, number, number]>();
  const k = tracks.length;
  tracks.forEach((t, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / k);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    centers.set(t, [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)]);
  });
  const byTrack = new Map<string, GNode[]>();
  for (const n of nodes) {
    if (!byTrack.has(n.track)) byTrack.set(n.track, []);
    byTrack.get(n.track)!.push(n);
  }
  for (const [t, members] of byTrack) {
    const c = centers.get(t)!;
    // 簇内再用小 fibonacci 盘绕簇心散开（切平面），投影回球壳 → 规则的"洲"
    const up: [number, number, number] = Math.abs(c[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const tx = norm3(cross3(up, c));
    const ty = cross3(c, tx);
    const spread = Math.min(0.55, 0.18 + members.length * 0.02);
    members.forEach((m, i) => {
      const r = spread * Math.sqrt((i + 0.5) / members.length);
      const a = i * 2.39996; // golden angle
      const p = norm3([
        c[0] + (tx[0] * Math.cos(a) + ty[0] * Math.sin(a)) * r,
        c[1] + (tx[1] * Math.cos(a) + ty[1] * Math.sin(a)) * r,
        c[2] + (tx[2] * Math.cos(a) + ty[2] * Math.sin(a)) * r,
      ]);
      const rr = m.ghost ? R * 1.12 : R; // 幽灵节点略外壳
      m.fx = p[0] * rr; m.fy = p[1] * rr; m.fz = p[2] * rr;
    });
  }
  return { centers, trackColor: (t: string) => TRACK_COLORS[Math.max(0, tracks.indexOf(t)) % TRACK_COLORS.length] };
}
function cross3(a: number[], b: number[]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm3(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ── 连通分量（typed 边） ──
function componentOf(id: string, edges: GEdge[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
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

// ── 缺口视图（从旧 KnowledgeGraph 迁入，唯一真相） ──
interface Cluster { tag: string; members: GNode[]; uncovered: GNode[]; density: number }
function computeClusters(nodes: GNode[], edges: GEdge[]): Cluster[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }
  const tagGroups = new Map<string, GNode[]>();
  for (const n of nodes) {
    if (n.ghost) continue;
    for (const tag of n.tags) {
      if (!tagGroups.has(tag)) tagGroups.set(tag, []);
      tagGroups.get(tag)!.push(n);
    }
  }
  const clusters: Cluster[] = [];
  for (const [tag, members] of tagGroups) {
    if (members.length < 2) continue;
    const memberIds = new Set(members.map((m) => m.id));
    let density = 0;
    for (const e of edges) if (memberIds.has(e.source) && memberIds.has(e.target)) density++;
    const uncoveredIds = new Set<string>();
    for (const m of members) for (const nb of adj.get(m.id) || []) {
      if (memberIds.has(nb)) continue;
      const node = byId.get(nb);
      if (node?.ghost) uncoveredIds.add(nb);
    }
    clusters.push({ tag, members, uncovered: [...uncoveredIds].map((i) => byId.get(i)!).filter(Boolean), density });
  }
  clusters.sort((a, b) => (b.uncovered.length * 3 + b.density * 2 + b.members.length) - (a.uncovered.length * 3 + a.density * 2 + a.members.length));
  return clusters;
}

// ════════════════════════════════════════════════════════════════════
export function MindPalaceGlobe() {
  const [raw, setRaw] = useState<RawGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"globe" | "gaps">("globe");
  const [focus, setFocus] = useState<Set<string> | null>(null); // 选中的连通分量（或单点）
  const [focusRoot, setFocusRoot] = useState<string | null>(null);
  const [libErr, setLibErr] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ReturnType<typeof Object> | null>(null);
  const dataRef = useRef<{ nodes: GNode[]; edges: GEdge[] } | null>(null);
  const colorFnRef = useRef<(t: string) => string>(() => "#2563eb");
  const focusRef = useRef<Set<string> | null>(null);
  focusRef.current = focus;

  useEffect(() => {
    let alive = true;
    fetch("/data/brief/graph.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => alive && setRaw(d))
      .catch((e) => alive && setErr(e?.message || String(e)));
    return () => { alive = false; };
  }, []);

  const { nodes, edges } = useMemo(() => (raw ? normalize(raw) : { nodes: [], edges: [] }), [raw]);
  const clusters = useMemo(() => computeClusters(nodes, edges), [nodes, edges]);
  const ghostCount = useMemo(() => nodes.filter((n) => n.ghost).length, [nodes]);

  // ── 3D 球实例化（懒加载库；只在 globe 模式 + 有数据时） ──
  useEffect(() => {
    if (mode !== "globe" || !nodes.length || !mountRef.current) return;
    let disposed = false;
    const el = mountRef.current;
    (async () => {
      try {
        const mod = await import("3d-force-graph");
        if (disposed) return;
        const ForceGraph3D = mod.default;
        const { trackColor } = sphereLayout(nodes);
        colorFnRef.current = trackColor;
        dataRef.current = { nodes, edges };

        const fg = new ForceGraph3D(el)
          .width(el.clientWidth).height(el.clientHeight)
          .backgroundColor("#0b1020") // 深空底——记忆球的"生物模型展示"感，与白底检索区强对比
          .graphData({ nodes: nodes as object[], links: edges.map((e) => ({ ...e })) as object[] })
          .cooldownTicks(0) // 固定坐标布局，不跑力学
          .enableNodeDrag(false)
          .showNavInfo(false)
          .nodeId("id")
          .nodeLabel((o: object) => { const n = o as GNode; return `<div style="font:12px sans-serif;color:#e2e8f0;background:rgba(11,16,32,.85);padding:4px 8px;border-radius:6px;max-width:280px">${n.title}${n.ghost ? " · 幽灵（未深读）" : ""}</div>`; })
          .nodeVal((o: object) => { const n = o as GNode; return n.ghost ? 1.5 : 2.5 + Math.min(6, n.deg * 1.2); })
          .nodeColor((o: object) => {
            const n = o as GNode;
            const f = focusRef.current;
            const base = n.ghost ? "#475569" : trackColor(n.track);
            if (!f) return base;
            return f.has(n.id) ? base : "rgba(70,80,100,0.12)";
          })
          .nodeOpacity(0.95)
          .linkColor((o: object) => {
            const l = o as { type?: string; source?: GNode | string; target?: GNode | string };
            const f = focusRef.current;
            const c = EDGE_COLOR[l.type || "related"] || "#94a3b8";
            if (!f) return c;
            const s = typeof l.source === "object" ? l.source?.id : l.source;
            const t = typeof l.target === "object" ? l.target?.id : l.target;
            return s && t && f.has(s) && f.has(t) ? c : "rgba(70,80,100,0.06)";
          })
          .linkWidth((o: object) => { const l = o as { type?: string }; return l.type === "improves_on" || l.type === "composes_with" ? 1.6 : 0.8; })
          .linkOpacity(0.55)
          .linkDirectionalParticles((o: object) => { const l = o as { type?: string }; return l.type === "improves_on" || l.type === "builds_on" ? 2 : 0; })
          .linkDirectionalParticleWidth(1.6)
          .onNodeClick((o: object) => {
            const n = o as GNode;
            const comp = componentOf(n.id, dataRef.current!.edges);
            setFocus(comp);
            setFocusRoot(n.id);
            // 相机动画推近：沿该点方向退到 1.9 倍半径，画布同时让位（CSS）→"移到一边放大"
            const d = Math.hypot(n.fx || 1, n.fy || 1, n.fz || 1) || 1;
            const k = 1.9;
            fg.cameraPosition({ x: ((n.fx || 0) / d) * d * k, y: ((n.fy || 0) / d) * d * k, z: ((n.fz || 0) / d) * d * k }, { x: n.fx || 0, y: n.fy || 0, z: n.fz || 0 }, 900);
            setTimeout(() => fg.refresh(), 50);
          })
          .onBackgroundClick(() => {
            setFocus(null); setFocusRoot(null);
            fg.cameraPosition({ x: 0, y: 0, z: 760 }, { x: 0, y: 0, z: 0 }, 900);
            setTimeout(() => fg.refresh(), 50);
          });
        fg.cameraPosition({ x: 0, y: 0, z: 760 });
        fgRef.current = fg as object;

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
  }, [mode, nodes, edges]);

  // focus 变化 → 重画颜色 + 画布让位动画由 CSS 完成
  useEffect(() => {
    const fg = fgRef.current as { refresh?: () => void } | null;
    fg?.refresh?.();
  }, [focus]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const focusNodes = useMemo(() => (focus ? [...focus].map((i) => byId.get(i)!).filter(Boolean) : []), [focus, byId]);
  const focusEdges = useMemo(() => {
    if (!focus) return [] as GEdge[];
    return edges.filter((e) => focus.has(e.source) && focus.has(e.target));
  }, [focus, edges]);
  const rootNode = focusRoot ? byId.get(focusRoot) : null;
  const isCluster = focusNodes.length > 1;

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace · AI 记忆球</div>
          <h1>星图 · 记忆球</h1>
          <p>
            这是<b>AI 的自我记忆库</b>（区别于上方检索区=给你学习用的蒸馏）。深读内化的论文/项目按<b>主题分区</b>固定在球壳上，
            <b>已核验的语义边</b>连接它们。<b>拖动旋转 · 滚轮缩放 · 点一个点/一串点</b> → 球让位、面板展开关系分析。
          </p>
        </div>
        <div className="kg-legend">
          <div className="kg-modetabs">
            <button className={`kg-modetab ${mode === "globe" ? "on" : ""}`} onClick={() => setMode("globe")}>记忆球</button>
            <button className={`kg-modetab ${mode === "gaps" ? "on" : ""}`} onClick={() => setMode("gaps")}>缺口视图{ghostCount ? ` · ${ghostCount}` : ""}</button>
          </div>
        </div>
      </div>

      {err && <div className="notice error">知识图谱加载失败：{err}</div>}
      {libErr && <div className="notice error">3D 引擎加载失败：{libErr}（可刷新重试）</div>}
      {!err && !raw && <div className="kg-loading">加载记忆球…</div>}

      {raw && mode === "globe" && (
        <div className={`globe-stage ${focus ? "focused" : ""}`}>
          <div className="globe-canvas" ref={mountRef} />
          {focus && (
            <aside className="globe-panel">
              <button className="globe-panel-close" onClick={() => { setFocus(null); setFocusRoot(null); (fgRef.current as { cameraPosition?: (a: object, b: object, c: number) => void } | null)?.cameraPosition?.({ x: 0, y: 0, z: 760 }, { x: 0, y: 0, z: 0 }, 900); }}>× 返回全球</button>

              {isCluster ? (
                <>
                  <div className="globe-panel-kicker">关系分析 · 这一串记忆为什么连在一起</div>
                  <h2 className="globe-panel-title">{focusNodes.length} 条记忆的密切联系</h2>
                  <div className="globe-members">
                    {focusNodes.map((n) => (
                      <span key={n.id} className={`globe-member ${n.id === focusRoot ? "root" : ""} ${n.ghost ? "ghost" : ""}`}>
                        {shortTitle(n.title, 24)}
                      </span>
                    ))}
                  </div>
                  <div className="globe-edges">
                    {focusEdges.map((e, i) => {
                      const a = byId.get(e.source); const b = byId.get(e.target);
                      return (
                        <div key={i} className="globe-edge-card">
                          <div className="globe-edge-head">
                            <span className="globe-edge-type" style={{ color: EDGE_COLOR[e.type] || "#94a3b8" }}>{EDGE_LABEL[e.type] || e.type}</span>
                            <span className="globe-edge-pair">{a ? shortTitle(a.title, 18) : e.source} ↔ {b ? shortTitle(b.title, 18) : e.target}</span>
                            {e.confidence && <span className="globe-edge-conf">置信 {e.confidence}</span>}
                          </div>
                          {e.use && <p className="globe-edge-use"><b>怎么利用：</b>{e.use}</p>}
                          {e.evidence && <p className="globe-edge-ev"><b>证据：</b>{e.evidence}</p>}
                        </div>
                      );
                    })}
                    {focusEdges.length === 0 && <p className="globe-empty">（这串点之间的 typed 边数据缺失。）</p>}
                  </div>
                </>
              ) : rootNode ? (
                <>
                  <div className="globe-panel-kicker">{rootNode.ghost ? "幽灵节点 · 未深读紧邻" : "孤立记忆 · 还没连上边"}</div>
                  <h2 className="globe-panel-title">{rootNode.title}</h2>
                  {rootNode.facets && (
                    <div className="globe-core">
                      {rootNode.facets.problem_solved && <p><b>解决什么：</b>{rootNode.facets.problem_solved}</p>}
                      {rootNode.facets.method && <p><b>用什么方法：</b>{rootNode.facets.method}</p>}
                      {rootNode.facets.result && <p><b>展现结果：</b>{rootNode.facets.result}</p>}
                    </div>
                  )}
                  <div className="globe-noedge">
                    <b>为什么还没连边？</b>
                    <p>
                      {rootNode.ghost
                        ? "它是已知但还没深读的紧邻——深读后蒸馏 facet 才能进关系判定。"
                        : rootNode.noEdgeReason?.note
                          ? rootNode.noEdgeReason.note + (rootNode.noEdgeReason.kind === "no_real_relation" ? "（判定过候选，确实没有可证实的语义关系——诚实不硬凑）" : "（还没进入候选比较，关系引擎下轮覆盖）")
                          : "关系引擎按 NO_EDGE 默认运行：要么判定过候选无真实关系，要么尚未与它比较——不硬凑边。"}
                    </p>
                  </div>
                  {rootNode.selfEvoUse && (
                    <div className="globe-core" style={{ marginTop: 10 }}>
                      <p><b>能否用于研究/自进化：</b>{rootNode.selfEvoUse}</p>
                    </div>
                  )}
                </>
              ) : null}
            </aside>
          )}
        </div>
      )}

      {raw && mode === "gaps" && <GapView clusters={clusters} />}
    </main>
  );
}

// ── 缺口视图（迁入版：纯列表，点击不再依赖 2D 图） ──
function GapView({ clusters }: { clusters: Cluster[] }) {
  const withGaps = clusters.filter((c) => c.uncovered.length > 0);
  const dense = clusters.filter((c) => c.uncovered.length === 0).slice(0, 12);
  return (
    <div className="kg-gaps">
      <div className="kg-gaps-intro">
        缺口发现 = 记忆库的杀手用法：<b>你在某个簇投入很深（深读多），但它的强关联邻居还没覆盖</b>（幽灵节点 / 未深读）。
        这些就是「该深读谁」的信号，反哺选品。
      </div>
      {withGaps.length === 0 && (
        <div className="kg-gaps-empty">当前数据里还没算出「有未覆盖邻居的密集簇」。</div>
      )}
      {withGaps.map((c) => (
        <div key={c.tag} className="kg-gapcard">
          <div className="kg-gapcard-head">
            <div className="kg-gapcard-tag">{c.tag}</div>
            <div className="kg-gapcard-stat">
              深读 <b>{c.members.length}</b> · 簇内连边 {c.density} · 未覆盖紧邻 <b className="kg-gap-n">{c.uncovered.length}</b>
            </div>
          </div>
          <div className="kg-gapcard-body">
            <div className="kg-gapcol">
              <div className="kg-gapcol-h">已深读（投入深）</div>
              <div className="kg-chiprow">
                {c.members.slice(0, 8).map((m) => <span key={m.id} className="kg-memberchip">{shortTitle(m.title, 22)}</span>)}
                {c.members.length > 8 && <span className="kg-more">+{c.members.length - 8}</span>}
              </div>
            </div>
            <div className="kg-gapcol">
              <div className="kg-gapcol-h kg-gapcol-h--gap">⚠ 紧邻但还没深读（建议深读）</div>
              <div className="kg-chiprow">
                {c.uncovered.map((u) => <span key={u.id} className="kg-ghostchip" title={u.title}>{shortTitle(u.title, 26)}</span>)}
              </div>
            </div>
          </div>
        </div>
      ))}
      {dense.length > 0 && (
        <div className="kg-densesec">
          <div className="kg-densesec-h">投入最深的簇（暂无缺口）</div>
          <div className="kg-chiprow">
            {dense.map((c) => <span key={c.tag} className="kg-densechip">{c.tag} <em>{c.members.length}</em></span>)}
          </div>
        </div>
      )}
    </div>
  );
}
