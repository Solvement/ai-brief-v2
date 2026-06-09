"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════
//  Knowledge Graph — associative-memory view for AI-Brief.
//  Renders /data/brief/graph.json = { nodes, edges, adjacency?, summary? }.
//
//  IMPORTANT: this must work with BOTH the current sparse graph (529 nodes,
//  ~1 edge, edges keyed from/to, many internal node types) AND the upcoming
//  dense rebuild (hundreds of typed edges, node types paper/project/concept/
//  claim + ghost:true, nodes carrying design_idea / self_evo_use). We
//  NORMALIZE both into one internal shape and never crash on missing fields.
// ════════════════════════════════════════════════════════════════════

// ── raw (on-disk) shapes — every field optional, both vocabularies ──
interface RawNode {
  id: string;
  type?: string;
  slug?: string;
  title?: string;
  name?: string;
  file?: string;
  tags?: string[];
  topic?: string;
  track?: string;
  ghost?: boolean;
  external?: boolean;
  arxiv_id?: string;
  arxivId?: string;
  design_idea?: string;
  self_evo_use?: string;
  facets?: Record<string, string>;
  [k: string]: unknown;
}
interface RawEdge {
  // upcoming shape
  source?: string;
  target?: string;
  // current shape
  from?: string;
  to?: string;
  type?: string;
  subtype?: string;
  confidence?: string | number;
  evidence?: string;
  what_changed?: string;
  via?: string;
  [k: string]: unknown;
}
interface RawGraph {
  generatedAt?: string;
  nodes?: RawNode[];
  edges?: RawEdge[];
  adjacency?: unknown;
  summary?: Record<string, unknown>;
  stats?: Record<string, unknown>;
}

// ── normalized internal shapes ──
type NodeKind = "paper" | "project" | "concept" | "claim" | "ghost" | "other";
interface GNode {
  id: string;
  kind: NodeKind;
  rawType: string;
  title: string;
  slug?: string;
  tags: string[];
  ghost: boolean;
  designIdea?: string;
  selfEvoUse?: string;
  facets?: Record<string, string>;
  arxivId?: string;
  href?: string;
  deg: number; // edge degree (computed)
}
interface GEdge {
  source: string;
  target: string;
  type: string; // normalized edge type
  rawType: string;
  evidence?: string;
  confidence?: string;
}
interface SimNode extends GNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

const W = 1480;
const H = 900;

// ── node kind classification (handles BOTH vocabularies) ────────────
const PAPER_TYPES = new Set(["paper", "content", "deep-dive", "article"]);
const PROJECT_TYPES = new Set(["project", "repo"]);
const CONCEPT_TYPES = new Set(["concept", "principle", "method", "taste", "track"]);
const CLAIM_TYPES = new Set(["claim", "evidence", "artifact", "source-pack", "evidence-pack"]);

function classify(n: RawNode): NodeKind {
  if (n.ghost) return "ghost";
  const t = (n.type || "").toLowerCase();
  if (PAPER_TYPES.has(t)) return "paper";
  if (PROJECT_TYPES.has(t)) return "project";
  if (CONCEPT_TYPES.has(t)) return "concept";
  if (CLAIM_TYPES.has(t)) return "claim";
  return "other";
}

// ── visual encoding by node kind (light theme + blue accent) ────────
const KIND_META: Record<NodeKind, { color: string; label: string; r: number }> = {
  paper: { color: "#2563eb", label: "论文 / 深读", r: 9 },
  project: { color: "#7c3aed", label: "项目", r: 9 },
  concept: { color: "#2f9e63", label: "概念 / 方法", r: 6 },
  claim: { color: "#d97706", label: "证据 / 论断", r: 5.5 },
  ghost: { color: "#ffffff", label: "幽灵节点（未深读 / 外搜）", r: 8 },
  other: { color: "#94a3b8", label: "其它", r: 6 },
};

// ── edge-type normalization + style (handles both vocabularies) ─────
// Upcoming: references, same_track, implements, builds_on, shares_method, same_use_case
// Current:  same_track_as, forward_lineage, exhibits_principle, shares_tag, shares_principle
function normEdgeType(t?: string): string {
  const x = (t || "").toLowerCase();
  if (x === "same_track_as") return "same_track";
  if (x === "shares_tag") return "same_track";
  if (x === "shares_principle") return "shares_method";
  if (x === "exhibits_principle") return "shares_method";
  if (x === "forward_lineage") return "builds_on";
  return x || "related";
}
const EDGE_STYLE: Record<string, { color: string; width: number; dash?: string; directed?: boolean; label: string }> = {
  references: { color: "#64748b", width: 1.4, directed: true, label: "引用" },
  builds_on: { color: "#ea580c", width: 2, directed: true, label: "演进自" },
  implements: { color: "#7c3aed", width: 1.8, directed: true, label: "实现" },
  same_track: { color: "#93c5fd", width: 1.2, dash: "4 4", label: "同赛道" },
  shares_method: { color: "#a7f3d0", width: 1.2, dash: "2 4", label: "共享方法" },
  same_use_case: { color: "#fbcfe8", width: 1.3, dash: "5 3", label: "同用例" },
  shares_concept: { color: "#c4b5fd", width: 1.2, dash: "3 3", label: "共享概念" },
  // the add/replace/merge judgment edges — visually distinct (this is the point of the typed layer)
  improves_on: { color: "#dc2626", width: 2.2, directed: true, label: "取长补短/优化" },
  composes_with: { color: "#0891b2", width: 2, dash: "6 3", directed: true, label: "可合并/前后关联" },
  related: { color: "#cbd5e1", width: 1, label: "关联" },
};
const edgeStyle = (t: string) => EDGE_STYLE[t] || EDGE_STYLE.related;

function rawTitle(n: RawNode): string {
  return (n.title || n.name || n.slug || n.id || "").toString();
}
function shortTitle(t: string, max = 26): string {
  const head = t.replace(/\s*[—:：].*$/, "").trim() || t;
  const s = head.length > 0 ? head : t;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── normalize a raw graph into internal shape (degree-tagged) ───────
function normalizeGraph(raw: RawGraph): { nodes: GNode[]; edges: GEdge[] } {
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const idSet = new Set(rawNodes.map((n) => n.id));

  const nodes: GNode[] = rawNodes.map((n) => {
    const kind = classify(n);
    const slug = n.slug;
    const arxivId = (n.arxiv_id || n.arxivId) as string | undefined;
    let href: string | undefined;
    if (!n.ghost && (kind === "paper") && slug) href = `/papers/${slug}`;
    return {
      id: n.id,
      kind,
      rawType: (n.type || "").toString(),
      title: rawTitle(n),
      slug,
      tags: Array.isArray(n.tags) ? n.tags : [],
      ghost: !!n.ghost,
      designIdea: typeof n.design_idea === "string" ? n.design_idea : undefined,
      selfEvoUse: typeof n.self_evo_use === "string" ? n.self_evo_use : undefined,
      facets: n.facets && typeof n.facets === "object" ? (n.facets as Record<string, string>) : undefined,
      arxivId,
      href,
      deg: 0,
    };
  });

  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  const edges: GEdge[] = [];
  for (const e of rawEdges) {
    const src = (e.source || e.from || "") as string;
    const tgt = (e.target || e.to || "") as string;
    if (!src || !tgt || src === tgt) continue;
    if (!idSet.has(src) || !idSet.has(tgt)) continue;
    edges.push({
      source: src,
      target: tgt,
      type: normEdgeType(e.type),
      rawType: (e.type || "").toString(),
      evidence: e.evidence,
      confidence: e.confidence != null ? String(e.confidence) : undefined,
    });
  }

  // degree
  const degMap = new Map<string, number>();
  for (const e of edges) {
    degMap.set(e.source, (degMap.get(e.source) || 0) + 1);
    degMap.set(e.target, (degMap.get(e.target) || 0) + 1);
  }
  for (const n of nodes) n.deg = degMap.get(n.id) || 0;

  return { nodes, edges };
}

// ── tag-based cluster detection for the gap view ────────────────────
// A "cluster" = a tag shared by several deep-read (non-ghost) nodes.
// Its "uncovered neighbors" = ghost nodes (or zero-design nodes) linked to
// any cluster member. This surfaces "你在此簇投入很深,这些紧邻还没深读".
interface Cluster {
  tag: string;
  members: GNode[]; // deep-read nodes
  uncovered: GNode[]; // ghost / undeepened neighbors of the cluster
  density: number; // internal edges among members
}
function computeClusters(nodes: GNode[], edges: GEdge[]): Cluster[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // adjacency
  const adj = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }
  // group deep-read nodes by tag
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
    // internal density
    let density = 0;
    for (const e of edges) {
      if (memberIds.has(e.source) && memberIds.has(e.target)) density++;
    }
    // uncovered neighbors: nodes adjacent to a member that are ghost OR carry no judgment
    const uncoveredIds = new Set<string>();
    for (const m of members) {
      for (const nb of adj.get(m.id) || []) {
        if (memberIds.has(nb)) continue;
        const node = byId.get(nb);
        if (!node) continue;
        if (node.ghost) uncoveredIds.add(nb);
      }
    }
    const uncovered = [...uncoveredIds].map((id) => byId.get(id)!).filter(Boolean);
    clusters.push({ tag, members, uncovered, density });
  }
  // rank: deep clusters with uncovered neighbors first, then by size+density
  clusters.sort((a, b) => {
    const sa = a.uncovered.length * 3 + a.density * 2 + a.members.length;
    const sb = b.uncovered.length * 3 + b.density * 2 + b.members.length;
    return sb - sa;
  });
  return clusters;
}

// ════════════════════════════════════════════════════════════════════
export function KnowledgeGraph() {
  const [raw, setRaw] = useState<RawGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"graph" | "gaps">("graph");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [, setTick] = useState(0);
  const [enabledKinds, setEnabledKinds] = useState<Record<NodeKind, boolean>>({
    paper: true, project: true, concept: true, claim: false, ghost: true, other: false,
  });
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });

  const simRef = useRef<SimNode[]>([]);
  const alphaRef = useRef(1);
  const dragRef = useRef<string | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number>(0);

  // ── load (graceful: try brief/graph.json, fall back to legacy path) ──
  useEffect(() => {
    let alive = true;
    const tryFetch = (url: string) =>
      fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))));
    tryFetch("/data/brief/graph.json")
      .catch(() => tryFetch("/data/knowledge-graph.json"))
      .then((d: RawGraph) => alive && setRaw(d))
      .catch((e) => alive && setErr(e?.message || String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const { nodes: allNodes, edges: allEdges } = useMemo(
    () => (raw ? normalizeGraph(raw) : { nodes: [] as GNode[], edges: [] as GEdge[] }),
    [raw]
  );

  // visible subset by enabled kinds (perf: drop dense low-signal types by default)
  const { nodes, edges } = useMemo(() => {
    const vis = allNodes.filter((n) => enabledKinds[n.kind]);
    const visIds = new Set(vis.map((n) => n.id));
    const ve = allEdges.filter((e) => visIds.has(e.source) && visIds.has(e.target));
    return { nodes: vis, edges: ve };
  }, [allNodes, allEdges, enabledKinds]);

  const clusters = useMemo(() => computeClusters(allNodes, allEdges), [allNodes, allEdges]);

  // ── (re)build simulation when the visible node set changes ──
  useEffect(() => {
    if (!nodes.length) {
      simRef.current = [];
      return;
    }
    const cx = W / 2;
    const cy = H / 2;
    // seed positions: papers/projects near centre, leaf types on the rim
    simRef.current = nodes.map((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      const core = n.kind === "paper" || n.kind === "project";
      const rr = core ? 180 : 340;
      return {
        ...n,
        x: cx + Math.cos(a) * rr + (Math.random() - 0.5) * 60,
        y: cy + Math.sin(a) * rr + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
        pinned: false,
      };
    });
    alphaRef.current = 1;

    const idIndex = new Map(simRef.current.map((n, i) => [n.id, i]));
    // perf: above this many nodes, skip the O(n²) charge pass (springs + centering
    // still give a usable layout, and we sub-sample repulsion below)
    const N = simRef.current.length;
    const heavy = N > 280;

    const step = () => {
      const ns = simRef.current;
      const alpha = alphaRef.current;
      // charge repulsion — full O(n²) when small, sub-sampled when large
      if (!heavy) {
        for (let i = 0; i < ns.length; i++) {
          for (let j = i + 1; j < ns.length; j++) {
            applyCharge(ns[i], ns[j], alpha);
          }
        }
      } else {
        // sub-sample: each node repelled by a rotating window of others — keeps
        // it O(n·k) so hundreds of nodes stay smooth
        const k = 40;
        const off = Math.floor(Math.random() * ns.length);
        for (let i = 0; i < ns.length; i++) {
          for (let s = 1; s <= k; s++) {
            const j = (i + off + s * 7) % ns.length;
            if (j === i) continue;
            applyCharge(ns[i], ns[j], alpha);
          }
        }
      }
      // link springs
      for (const e of edges) {
        const ia = idIndex.get(e.source);
        const ib = idIndex.get(e.target);
        if (ia == null || ib == null) continue;
        const a = ns[ia];
        const b = ns[ib];
        const L = e.type === "builds_on" ? 175 : e.type === "same_track" ? 150 : 120;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - L) * 0.045 * alpha;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      for (const n of ns) {
        if (n.pinned) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (W / 2 - n.x) * 0.008 * alpha;
        n.vy += (H / 2 - n.y) * 0.008 * alpha;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(24, Math.min(W - 24, n.x));
        n.y = Math.max(24, Math.min(H - 24, n.y));
      }
      alphaRef.current = Math.max(0.01, alpha * 0.99);
      setTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, edges]);

  // ── pointer/zoom plumbing ──
  const toGraph = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    const v = viewRef.current;
    return { x: (sx - v.tx) / v.scale, y: (sy - v.ty) / v.scale };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const scale = Math.max(0.4, Math.min(5, v.scale * factor));
        const k = scale / v.scale;
        return { scale, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [mode]);

  const zoomBy = (f: number) =>
    setView((v) => {
      const scale = Math.max(0.4, Math.min(5, v.scale * f));
      const k = scale / v.scale;
      return { scale, tx: W / 2 - (W / 2 - v.tx) * k, ty: H / 2 - (H / 2 - v.ty) * k };
    });
  const resetView = () => setView({ scale: 1, tx: 0, ty: 0 });

  const onPointerDownNode = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = id;
    const n = simRef.current.find((m) => m.id === id);
    if (n) n.pinned = true;
    alphaRef.current = Math.max(alphaRef.current, 0.4);
    setSelected(id);
  };
  const onSvgPointerDown = (e: React.PointerEvent) => {
    if (dragRef.current) return;
    panRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const p = toGraph(e.clientX, e.clientY);
      const n = simRef.current.find((m) => m.id === dragRef.current);
      if (n) {
        n.x = p.x;
        n.y = p.y;
      }
      return;
    }
    if (panRef.current) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = ((e.clientX - panRef.current.x) / rect.width) * W;
      const sy = ((e.clientY - panRef.current.y) / rect.height) * H;
      setView((v) => ({ ...v, tx: panRef.current!.tx + sx, ty: panRef.current!.ty + sy }));
    }
  };
  const onPointerUp = () => {
    if (dragRef.current) {
      const n = simRef.current.find((m) => m.id === dragRef.current);
      if (n) n.pinned = false;
      dragRef.current = null;
    }
    panRef.current = null;
  };

  // ── derived view data ──
  const simNodes = simRef.current;
  const byId = useMemo(() => new Map(simNodes.map((n) => [n.id, n])), [simNodes]);
  const allById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  const q = query.trim().toLowerCase();
  const matchSet = useMemo(() => {
    if (!q) return null;
    const s = new Set<string>();
    for (const n of simNodes) {
      if (n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))) s.add(n.id);
    }
    return s;
  }, [q, simNodes]);

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

  const selectedNode = selected ? allById.get(selected) : null;
  const selectedEdges = useMemo(() => {
    if (!selected) return [] as { e: GEdge; other?: GNode; dir: "out" | "in" }[];
    const out: { e: GEdge; other?: GNode; dir: "out" | "in" }[] = [];
    for (const e of allEdges) {
      if (e.source === selected) out.push({ e, other: allById.get(e.target), dir: "out" });
      else if (e.target === selected) out.push({ e, other: allById.get(e.source), dir: "in" });
    }
    return out;
  }, [selected, allEdges, allById]);

  // counts for legend
  const kindCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of allNodes) c[n.kind] = (c[n.kind] || 0) + 1;
    return c;
  }, [allNodes]);
  const ghostCount = kindCounts.ghost || 0;

  const tf = `translate(${view.tx},${view.ty}) scale(${view.scale})`;
  const labelDetail = view.scale >= 1.3;

  const focusNode = useCallback((id: string) => {
    setSelected(id);
    const n = simRef.current.find((m) => m.id === id);
    if (n) {
      setView({ scale: 1.6, tx: W / 2 - n.x * 1.6, ty: H / 2 - n.y * 1.6 });
      alphaRef.current = Math.max(alphaRef.current, 0.3);
    } else {
      // node filtered out of current view — enable its kind so it appears
      const gn = allById.get(id);
      if (gn) setEnabledKinds((k) => ({ ...k, [gn.kind]: true }));
    }
  }, [allById]);

  return (
    <main className="page kg-page">
      <div className="kg-head">
        <div>
          <div className="eyebrow">Mind Palace</div>
          <h1>记忆宫殿 · Mind Palace</h1>
          <p>
            深读过的<b style={{ color: KIND_META.paper.color }}>论文</b>与<b style={{ color: KIND_META.project.color }}>项目</b>被<b>内化</b>成结构化记忆节点（用 X 方法解决 Y 问题、展现 Z 结果 + 创新/缺点），
            <b>已核验的语义边</b>（取长补短/可合并/相反）连成推理网络。点节点看内化拆解 + 「能否用于研究/自进化」。
            <b>幽灵节点</b>=已知但还没深读的紧邻。
          </p>
        </div>
        <div className="kg-legend">
          <div className="kg-modetabs">
            <button className={`kg-modetab ${mode === "graph" ? "on" : ""}`} onClick={() => setMode("graph")}>
              关联图
            </button>
            <button className={`kg-modetab ${mode === "gaps" ? "on" : ""}`} onClick={() => setMode("gaps")}>
              缺口视图{ghostCount ? ` · ${ghostCount}` : ""}
            </button>
          </div>
        </div>
      </div>

      {err && <div className="notice error">知识图谱加载失败：{err}</div>}
      {!err && !raw && <div className="kg-loading">加载知识图谱…</div>}

      {raw && mode === "graph" && (
        <>
          <div className="kg-controls">
            <input
              className="kg-search"
              placeholder="搜节点 / 标签…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="kg-kindtoggles">
              {(["paper", "project", "concept", "claim", "ghost"] as NodeKind[]).map((k) => {
                const meta = KIND_META[k];
                const n = kindCounts[k] || 0;
                if (!n) return null;
                const on = enabledKinds[k];
                return (
                  <button
                    key={k}
                    className={`kg-kindtoggle ${on ? "on" : ""}`}
                    onClick={() => setEnabledKinds((s) => ({ ...s, [k]: !s[k] }))}
                    title={meta.label}
                  >
                    <span className="kg-swatch" style={{ background: meta.color, border: k === "ghost" ? "1px solid #94a3b8" : "none" }} />
                    {meta.label.split(" ")[0]} <em>{n}</em>
                  </button>
                );
              })}
            </div>
            <div className="kg-zoom">
              <button className="kg-toggle" onClick={() => zoomBy(1 / 1.25)} aria-label="缩小">−</button>
              <button className="kg-toggle" onClick={() => zoomBy(1.25)} aria-label="放大">+</button>
              <button className="kg-toggle" onClick={resetView}>重置</button>
            </div>
          </div>

          <div className="kg-stage">
            {edges.length === 0 && nodes.length > 0 && (
              <div className="kg-sparse-note">
                当前图只有 <b>{allEdges.length}</b> 条边（关联还在重建中）。节点已就位，等密集 typed 边写入后会自动连成网络。
              </div>
            )}
            <svg
              ref={svgRef}
              className="kg-svg"
              viewBox={`0 0 ${W} ${H}`}
              onPointerDown={onSvgPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onClick={() => setSelected(null)}
            >
              <defs>
                {Object.entries(EDGE_STYLE).map(([t, st]) =>
                  st.directed ? (
                    <marker key={t} id={`kg-arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={st.color} />
                    </marker>
                  ) : null
                )}
              </defs>
              <g transform={tf}>
                {/* edges */}
                <g>
                  {edges.map((e, i) => {
                    const a = byId.get(e.source);
                    const b = byId.get(e.target);
                    if (!a || !b) return null;
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
                        markerEnd={st.directed ? `url(#kg-arrow-${e.type})` : undefined}
                        opacity={dim ? 0.06 : 0.8}
                      />
                    );
                  })}
                </g>
                {/* nodes */}
                <g>
                  {simNodes.map((n) => {
                    const meta = KIND_META[n.kind];
                    const dim =
                      (neighborSet && !neighborSet.has(n.id)) ||
                      (matchSet && !matchSet.has(n.id));
                    const r = meta.r + Math.min(6, n.deg * 0.5);
                    const isCore = n.kind === "paper" || n.kind === "project";
                    const showLabel = active === n.id || hover === n.id || (matchSet?.has(n.id) ?? false) || (isCore && (labelDetail || n.deg >= 2));
                    return (
                      <g
                        key={n.id}
                        transform={`translate(${n.x},${n.y})`}
                        opacity={dim ? 0.18 : 1}
                        style={{ cursor: "pointer" }}
                        onPointerDown={onPointerDownNode(n.id)}
                        onPointerEnter={() => setHover(n.id)}
                        onPointerLeave={() => setHover(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(n.id);
                        }}
                      >
                        {n.ghost ? (
                          <circle r={r} fill="#ffffff" stroke="#94a3b8" strokeWidth={1.6} strokeDasharray="3 2" />
                        ) : (
                          <circle
                            r={r}
                            fill={meta.color}
                            stroke={selected === n.id ? "#ea580c" : "#ffffff"}
                            strokeWidth={selected === n.id ? 3 : 1.8}
                          />
                        )}
                        {(n.designIdea || n.selfEvoUse) && !n.ghost && (
                          <circle r={r + 3} fill="none" stroke={meta.color} strokeWidth={1} opacity={0.4} />
                        )}
                        {showLabel && (
                          <text className="kg-node-label" x={0} y={r + 12} textAnchor="middle">
                            {shortTitle(n.title)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>

            <div className="kg-zoom-readout">{Math.round(view.scale * 100)}%</div>

            <div className="kg-edgelegend">
              {Object.entries(EDGE_STYLE).filter(([t]) => t !== "related").map(([t, st]) => (
                <span key={t} className="kg-edgekey">
                  <svg width="22" height="8">
                    <line x1="0" y1="4" x2="22" y2="4" stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash} />
                  </svg>
                  {st.label}
                </span>
              ))}
            </div>

            {selectedNode && (
              <NodeDetail node={selectedNode} edges={selectedEdges} onPick={focusNode} onClose={() => setSelected(null)} />
            )}
          </div>
        </>
      )}

      {raw && mode === "gaps" && (
        <GapView clusters={clusters} onPick={(id) => { setMode("graph"); focusNode(id); }} />
      )}
    </main>
  );
}

// ── repulsion helper (shared by full + sampled passes) ──
function applyCharge(a: SimNode, b: SimNode, alpha: number) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  let d2 = dx * dx + dy * dy;
  if (d2 < 1) d2 = 1;
  const d = Math.sqrt(d2);
  const f = (2600 * alpha) / d2;
  a.vx += (dx / d) * f;
  a.vy += (dy / d) * f;
  b.vx -= (dx / d) * f;
  b.vy -= (dy / d) * f;
}

// ── facet spine (internalization made visible: 用 X 解决 Y，展现 Z + 创新/缺点) ──
const FACET_ORDER: [string, string][] = [
  ["problem_solved", "解决什么 · Y"],
  ["method", "用什么方法 · X"],
  ["result", "展现结果 · Z"],
  ["innovation", "创新"],
  ["weakness", "缺点 / 适用边界"],
  ["transfer", "迁移 · 研究/自进化"],
];
function FacetSpine({ facets }: { facets: Record<string, string> }) {
  const rows = FACET_ORDER.filter(([k]) => facets[k] && String(facets[k]).trim());
  if (!rows.length) return null;
  return (
    <div className="kg-judge" style={{ display: "grid", gap: 9 }}>
      <div className="kg-judge-h">内化拆解（用 X 解决 Y · 展现 Z）</div>
      {rows.map(([k, label]) => (
        <div key={k} style={{ borderLeft: "2px solid #c7d2fe", paddingLeft: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", letterSpacing: ".02em" }}>{label}</div>
          <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.55, color: "#334155", whiteSpace: "pre-wrap" }}>
            {facets[k]}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── node detail panel ───────────────────────────────────────────────
function NodeDetail({
  node,
  edges,
  onPick,
  onClose,
}: {
  node: GNode;
  edges: { e: GEdge; other?: GNode; dir: "out" | "in" }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const meta = KIND_META[node.kind];
  return (
    <aside className="kg-panel">
      <button className="kg-panel-close" onClick={onClose}>×</button>
      <div className="kg-panel-kind" style={{ color: node.ghost ? "#64748b" : meta.color }}>
        {node.ghost ? "幽灵节点 · 未深读 / 外搜" : meta.label}
      </div>
      <h3>{node.title || node.id}</h3>
      <div className="kg-panel-meta">
        {node.arxivId && <span>arXiv:{node.arxivId}</span>}
        {node.rawType && <span>type:{node.rawType}</span>}
        {node.deg > 0 && <span>{node.deg} 条关联</span>}
      </div>
      {node.tags.length > 0 && (
        <div className="kg-tags">
          {node.tags.slice(0, 12).map((t) => (
            <span key={t} className="kg-tag">{t}</span>
          ))}
        </div>
      )}

      {node.facets && <FacetSpine facets={node.facets} />}

      {node.designIdea && (
        <div className="kg-judge kg-judge-design">
          <div className="kg-judge-h">架构设计思路</div>
          <p>{node.designIdea}</p>
        </div>
      )}
      {node.selfEvoUse && (
        <div className="kg-judge kg-judge-evo">
          <div className="kg-judge-h">能否用于研究 / 自进化</div>
          <p>{node.selfEvoUse}</p>
        </div>
      )}
      {!node.designIdea && !node.selfEvoUse && !node.ghost && (
        <p className="kg-judge-empty">（这条深读还没沉淀「设计思路 / 自进化可用性」判断。）</p>
      )}
      {node.ghost && (
        <p className="kg-judge-empty">这是一个<b>缺口节点</b>：簇内的紧邻，但还没深读。建议把它纳入选品。</p>
      )}

      {node.href && (
        <a className="kg-panel-link" href={node.href}>读深读 →</a>
      )}
      {!node.href && node.arxivId && (
        <a className="kg-panel-link" href={`https://arxiv.org/abs/${node.arxivId}`} target="_blank" rel="noreferrer">arXiv ↗</a>
      )}

      {edges.length > 0 && (
        <div className="kg-panel-conn">
          <div className="kg-panel-sub">关联（{edges.length}）</div>
          {edges.slice(0, 40).map(({ e, other, dir }, i) => {
            const st = edgeStyle(e.type);
            return (
              <button key={i} className="kg-conn-row" onClick={() => other && onPick(other.id)}>
                <span className="kg-conn-type" style={{ color: st.color === "#fbcfe8" || st.color === "#a7f3d0" || st.color === "#93c5fd" ? "#475569" : st.color }}>
                  {dir === "out" ? "→ " : "← "}
                  {st.label}
                  {e.confidence ? ` · ${e.confidence}` : ""}
                </span>
                <span className="kg-conn-title">{other ? shortTitle(other.title, 30) : e[dir === "out" ? "target" : "source"]}</span>
                {e.evidence && <span className="kg-conn-what">{e.evidence}</span>}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

// ── gap view ────────────────────────────────────────────────────────
function GapView({ clusters, onPick }: { clusters: Cluster[]; onPick: (id: string) => void }) {
  const withGaps = clusters.filter((c) => c.uncovered.length > 0);
  const dense = clusters.filter((c) => c.uncovered.length === 0).slice(0, 12);
  return (
    <div className="kg-gaps">
      <div className="kg-gaps-intro">
        缺口发现 = 记忆库的杀手用法：<b>你在某个簇投入很深（深读多），但它的强关联邻居还没覆盖</b>（幽灵节点 / 未深读）。
        这些就是「该深读谁」的信号，反哺选品——补上现选品只认 star/upvote 动量、缺「簇兴趣」维度的盲点。
      </div>

      {withGaps.length === 0 && (
        <div className="kg-gaps-empty">
          当前数据里还没算出「有未覆盖邻居的密集簇」。等密集 typed 边 + 幽灵节点写入 graph.json 后，这里会列出该深读的紧邻。
        </div>
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
                {c.members.slice(0, 8).map((m) => (
                  <button key={m.id} className="kg-memberchip" onClick={() => onPick(m.id)}>
                    {shortTitle(m.title, 22)}
                  </button>
                ))}
                {c.members.length > 8 && <span className="kg-more">+{c.members.length - 8}</span>}
              </div>
            </div>
            <div className="kg-gapcol">
              <div className="kg-gapcol-h kg-gapcol-h--gap">⚠ 紧邻但还没深读（建议深读）</div>
              <div className="kg-chiprow">
                {c.uncovered.map((u) => (
                  <button key={u.id} className="kg-ghostchip" onClick={() => onPick(u.id)} title={u.designIdea || u.title}>
                    {shortTitle(u.title, 26)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {dense.length > 0 && (
        <div className="kg-densesec">
          <div className="kg-densesec-h">投入最深的簇（暂无缺口）</div>
          <div className="kg-chiprow">
            {dense.map((c) => (
              <span key={c.tag} className="kg-densechip">
                {c.tag} <em>{c.members.length}</em>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
