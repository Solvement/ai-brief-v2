"use client";
import { MarkdownRich } from "./MarkdownRich";

// 深度内化 facet 的人读呈现：用 X 方法解决 Y 问题、展现 Z 结果 + 创新/缺点 + Mermaid 架构 + 迁移。
// 数据来自 public/data/brief/facets.json（slug → facet）。满宽、信息密、少英文、大白话。

export interface FacetRecord {
  node_id?: string;
  title?: string;
  kind?: string;
  status?: string;
  facets?: Record<string, string>;
  self_evo_use?: string | null;
  edges?: { to: string; type: string; evidence?: string; confidence?: string }[];
}

const EDGE_LABEL: Record<string, string> = {
  improves_on: "取长补短 / 优化",
  composes_with: "可合并 / 前后关联",
  contradicts: "思路相反",
  special_case_of: "特例",
  derives_from: "派生自",
  same_track: "同赛道",
};

const wrap: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", background: "#fff", marginBottom: 18 };
const kicker: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb", marginBottom: 12 };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".02em", color: "#4338ca", marginBottom: 3 };
const body: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.7, color: "#1e293b", whiteSpace: "pre-wrap" };

function XYZ({ l, b, accent }: { l: string; b: string; accent?: boolean }) {
  return (
    <div style={{ borderLeft: `3px solid ${accent ? "#2563eb" : "#c7d2fe"}`, paddingLeft: 12, background: accent ? "#f5f8ff" : "transparent", borderRadius: accent ? 8 : 0, padding: accent ? "8px 12px" : "0 0 0 12px" }}>
      <div style={label}>{l}</div>
      <p style={body}>{b}</p>
    </div>
  );
}
function Card({ title, b, tone }: { title: string; b: string; tone: "up" | "warn" | "info" }) {
  const c = tone === "up" ? { bg: "#f0fdf4", bd: "#bbf7d0", h: "#15803d" } : tone === "warn" ? { bg: "#fff7ed", bd: "#fed7aa", h: "#c2410c" } : { bg: "#f8fafc", bd: "#e2e8f0", h: "#475569" };
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 12, padding: "12px 14px", flex: "1 1 280px", minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: c.h, marginBottom: 5 }}>{title}</div>
      <p style={body}>{b}</p>
    </div>
  );
}

export function ProjectFacetSpine({ facet }: { facet: FacetRecord }) {
  const f = facet.facets || {};
  if (!f.problem_solved && !f.method) return null;
  return (
    <section style={wrap} aria-label="深度内化">
      <div style={kicker}>深度内化 · Mind Palace</div>
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        {f.problem_solved && <XYZ l="解决什么 · Y" b={f.problem_solved} />}
        {f.method && <XYZ l="用什么方法 · X" b={f.method} accent />}
        {f.result && <XYZ l="展现结果 · Z" b={f.result} />}
      </div>
      {(f.innovation || f.weakness) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {f.innovation && <Card title="创新" b={f.innovation} tone="up" />}
          {f.weakness && <Card title="缺点 / 适用边界" b={f.weakness} tone="warn" />}
        </div>
      )}
      {f.architecture && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label, color: "#475569", marginBottom: 8 }}>架构</div>
          <div className="prose"><MarkdownRich source={f.architecture} /></div>
        </div>
      )}
      {(f.transfer || facet.self_evo_use) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: facet.edges?.length ? 16 : 0 }}>
          {f.transfer && <Card title="能迁移到哪 · 研究/自进化" b={f.transfer} tone="info" />}
          {facet.self_evo_use && <Card title="能否用于研究/自进化（客观判断）" b={facet.self_evo_use} tone="info" />}
        </div>
      )}
      {facet.edges && facet.edges.length > 0 && (
        <div>
          <div style={{ ...label, color: "#475569", marginBottom: 8 }}>与其它知识的关系（已核验语义边）</div>
          <div style={{ display: "grid", gap: 8 }}>
            {facet.edges.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 13, color: "#334155" }}>
                <span style={{ fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap" }}>{EDGE_LABEL[e.type] || e.type}</span>
                <span style={{ fontWeight: 600 }}>{e.to}</span>
                {e.evidence && <span style={{ color: "#64748b" }}>— {e.evidence}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
