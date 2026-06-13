"use client";
import { useEffect, useState } from "react";

// ════════════════════════════════════════════════════════════════════
//  ROS 对象面板（KG-5 表达分层 · 受众分离，docs/paradigms/research-object-store.md）
//  默认只渲染 human 块（人话：定位/怎么用/能借/不能借/成熟度）。
//  AI 内部认知记账（主张分型/逐字锚点/cannot_prove/机制/考题/canonical）收进
//  两个折叠层：「拆开看」(详情) + 「查证·审计」(审计)，默认不裸露。
// ════════════════════════════════════════════════════════════════════

export interface RosHuman {
  headline?: string; plain_summary?: string; use_type?: string; use_type_reason?: string;
  how_to_use?: string; can_borrow?: string[]; cannot_borrow?: string[]; maturity?: string;
}
export interface RosClaim {
  id: string; statement: string; type?: string;
  evidence?: { anchor?: string; quote?: string; strength?: string }[];
  cannot_prove?: string[]; confidence?: string; confidence_reason?: string;
}
export interface RosMechanism {
  id: string; name?: string; canonical_concept?: string; problem?: string;
  input?: string; output?: string; operations?: string[]; optimization?: string;
  replaceable?: string[]; non_replaceable?: string[]; reusable_pattern?: string; anchor?: string;
}
export interface RosAssumption { id: string; statement: string; kind?: string; anchor?: string }
export interface RosFailureMode { id: string; statement: string; triggered_when?: string; consequence?: string }
export interface RosTriggerHook { symptom: string; why_recall?: string; related_object?: string; risk?: string }
export interface RosExamQuestion { q: string; type?: string; expected_points?: string[] }
export interface RosObject {
  slug: string; kind?: string; title?: string; source?: string; one_sentence_thesis?: string;
  human?: RosHuman;
  canonical?: { problems?: string[]; concepts?: string[]; benchmarks?: string[] };
  claims?: RosClaim[]; mechanisms?: RosMechanism[]; assumptions?: RosAssumption[];
  failure_modes?: RosFailureMode[]; trigger_hooks?: RosTriggerHook[]; exam_questions?: RosExamQuestion[];
  self_evo_verdict?: { state?: string; reason?: string };
}

const USE_TYPE_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  directly_usable: { label: "直接可用", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  design_inspiration: { label: "设计启发", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  background_reference: { label: "背景参考", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};
const CLAIM_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  fact: { label: "实读事实", color: "#15803d", bg: "#f0fdf4" },
  author_claim: { label: "作者主张", color: "#2563eb", bg: "#eff6ff" },
  interpretation: { label: "我方解释", color: "#b45309", bg: "#fffbeb" },
  inference: { label: "我方推断", color: "#be185d", bg: "#fdf2f8" },
};
const EXAM_TYPE_LABEL: Record<string, string> = { counterfactual: "反事实", boundary: "边界", transfer: "迁移" };

function Collapsible({ title, hint, children, defaultOpen = false }: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 14, border: "1px solid #e8edf3", borderRadius: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: open ? "#f8fafc" : "#fff", border: "none", padding: "10px 13px", cursor: "pointer" }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em", color: "#334155" }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>{hint}</span>}
      </button>
      {open && <div style={{ padding: "4px 14px 14px" }}>{children}</div>}
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#2563eb", marginBottom: 7 }}>{title}</div>
      {children}
    </div>
  );
}

// ── 默认人读层 ──────────────────────────────────────────────────────
function HumanLayer({ h }: { h: RosHuman }) {
  const ut = h.use_type ? USE_TYPE_LABEL[h.use_type] : null;
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "#1e293b" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        {ut && <span style={{ fontSize: 11, fontWeight: 700, color: ut.color, background: ut.bg, border: `1px solid ${ut.border}`, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{ut.label}</span>}
        {h.use_type_reason && <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{h.use_type_reason}</span>}
      </div>
      {h.headline && <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}>{h.headline}</p>}
      {h.plain_summary && <p style={{ margin: "0 0 12px", color: "#334155" }}>{h.plain_summary}</p>}
      {h.how_to_use && (
        <div style={{ margin: "0 0 10px", padding: "10px 13px", background: "#f5f9ff", border: "1px solid #dbeafe", borderRadius: 10 }}>
          <b style={{ color: "#1e40af" }}>怎么用：</b>{h.how_to_use}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(h.can_borrow?.length || 0) > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>✓ 能借什么</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "#334155" }}>
              {h.can_borrow!.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}
            </ul>
          </div>
        )}
        {(h.cannot_borrow?.length || 0) > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>✗ 不能照搬</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "#334155" }}>
              {h.cannot_borrow!.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}
            </ul>
          </div>
        )}
      </div>
      {h.maturity && <p style={{ margin: "11px 0 0", fontSize: 12, color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}><b>成熟度：</b>{h.maturity}</p>}
    </div>
  );
}

// ── 详情层（拆开看：主张/机制/边界） ────────────────────────────────
function DetailLayer({ obj }: { obj: RosObject }) {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#1e293b" }}>
      {(obj.trigger_hooks?.length || 0) > 0 && (
        <Sub title="什么时候想起这篇">
          <div style={{ display: "grid", gap: 7 }}>
            {obj.trigger_hooks!.map((hk, i) => (
              <div key={i} style={{ border: "1px solid #dbeafe", background: "#f5f9ff", borderRadius: 9, padding: "8px 11px" }}>
                <p style={{ margin: 0 }}><b>当你遇到：</b>{hk.symptom}</p>
                {hk.why_recall && <p style={{ margin: "3px 0 0", color: "#475569", fontSize: 12.5 }}>{hk.why_recall}</p>}
                {hk.risk && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#b45309" }}>⚠ 别乱用：{hk.risk}</p>}
              </div>
            ))}
          </div>
        </Sub>
      )}
      {(obj.claims?.length || 0) > 0 && (
        <Sub title="主张与边界">
          <div style={{ display: "grid", gap: 9 }}>
            {obj.claims!.map((c) => {
              const t = CLAIM_TYPE_LABEL[c.type || ""] || null;
              return (
                <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 11px", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    {t && <span style={{ fontSize: 10.5, fontWeight: 700, color: t.color, background: t.bg, padding: "1px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>{t.label}</span>}
                    {c.confidence && <span style={{ fontSize: 10.5, color: "#94a3b8" }}>支撑 {c.confidence}</span>}
                  </div>
                  <p style={{ margin: "5px 0 0" }}>{c.statement}</p>
                  {(c.cannot_prove?.length || 0) > 0 && (
                    <div style={{ margin: "6px 0 0", fontSize: 12, color: "#9a3412", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 9px" }}>
                      <b>它不能证明：</b>
                      <ul style={{ margin: "3px 0 0", paddingLeft: 17 }}>{c.cannot_prove!.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Sub>
      )}
      {(obj.mechanisms?.length || 0) > 0 && (
        <Sub title="机制怎么跑">
          <div style={{ display: "grid", gap: 9 }}>
            {obj.mechanisms!.map((m) => (
              <div key={m.id} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 11px", background: "#fff" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{m.name || m.id}</p>
                {(m.input || m.output) && (
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#475569" }}>
                    {m.input && <span style={{ marginRight: 10 }}><b>进：</b>{m.input}</span>}{m.output && <span><b>出：</b>{m.output}</span>}
                  </p>
                )}
                {(m.operations?.length || 0) > 0 && (
                  <ol style={{ margin: "6px 0 0", paddingLeft: 19, fontSize: 12.5, color: "#334155" }}>
                    {m.operations!.map((op, i) => <li key={i}>{op}</li>)}
                  </ol>
                )}
                {m.reusable_pattern && (
                  <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#0e7490", background: "#ecfeff", borderRadius: 8, padding: "6px 9px" }}>
                    <b>可迁移的设计：</b>{m.reusable_pattern}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Sub>
      )}
      {((obj.assumptions?.length || 0) > 0 || (obj.failure_modes?.length || 0) > 0) && (
        <Sub title="假设与会怎么失败">
          {(obj.assumptions?.length || 0) > 0 && (
            <ul style={{ margin: "0 0 6px", paddingLeft: 18, color: "#475569", fontSize: 12.5 }}>
              {obj.assumptions!.map((a) => <li key={a.id}>{a.kind === "implicit" ? "（隐含）" : ""}{a.statement}</li>)}
            </ul>
          )}
          {(obj.failure_modes?.length || 0) > 0 && (
            <div style={{ display: "grid", gap: 5 }}>
              {obj.failure_modes!.map((f) => (
                <p key={f.id} style={{ margin: 0, fontSize: 12.5, color: "#7f1d1d" }}>
                  ✗ {f.statement}{f.triggered_when ? `——当${f.triggered_when}` : ""}
                </p>
              ))}
            </div>
          )}
        </Sub>
      )}
    </div>
  );
}

// ── 审计层（查证：逐字锚点/考题/canonical） ─────────────────────────
function AuditLayer({ obj }: { obj: RosObject }) {
  const anchors = (obj.claims || []).flatMap((c) => (c.evidence || []).map((e) => ({ claim: c.id, anchor: e.anchor, quote: e.quote })).filter((x) => x.anchor));
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#475569" }}>
      {anchors.length > 0 && (
        <Sub title="逐字证据锚点">
          <ul style={{ margin: 0, paddingLeft: 17 }}>
            {anchors.map((a, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{a.anchor}</span>
                {a.quote && <span style={{ color: "#64748b" }}> — “{a.quote}”</span>}
              </li>
            ))}
          </ul>
        </Sub>
      )}
      {(obj.exam_questions?.length || 0) > 0 && (
        <Sub title="自检考题（AI 理解度 benchmark）">
          <ol style={{ margin: 0, paddingLeft: 19 }}>
            {obj.exam_questions!.map((qq, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {qq.type && <span style={{ color: "#94a3b8" }}>[{EXAM_TYPE_LABEL[qq.type] || qq.type}] </span>}{qq.q}
              </li>
            ))}
          </ol>
        </Sub>
      )}
      {(obj.canonical?.problems?.length || obj.canonical?.concepts?.length) ? (
        <Sub title="正典挂接">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(obj.canonical?.problems || []).map((p) => (
              <span key={p} style={{ fontSize: 11, color: "#0e7490", background: "#ecfeff", border: "1px solid #cffafe", padding: "1px 8px", borderRadius: 20, fontFamily: "monospace" }}>{p}</span>
            ))}
            {(obj.canonical?.concepts || []).map((c) => (
              <span key={c} style={{ fontSize: 11, color: "#4338ca", background: "#eef2ff", border: "1px solid #e0e7ff", padding: "1px 8px", borderRadius: 20, fontFamily: "monospace" }}>{c}</span>
            ))}
          </div>
        </Sub>
      ) : null}
      {obj.self_evo_verdict?.reason && (
        <Sub title="对我们自己系统（self-evo 判定）">
          <p style={{ margin: 0 }}>{obj.self_evo_verdict.reason}</p>
        </Sub>
      )}
    </div>
  );
}

export function RosObjectPanel({ obj, compact = false }: { obj: RosObject; compact?: boolean }) {
  const hasDetail = (obj.claims?.length || obj.mechanisms?.length || obj.trigger_hooks?.length || 0) > 0;
  const hasAudit = (obj.claims || []).some((c) => (c.evidence?.length || 0) > 0) || (obj.exam_questions?.length || 0) > 0 || (obj.canonical?.concepts?.length || 0) > 0;
  return (
    <div style={{ fontSize: 13.5 }}>
      {obj.human ? <HumanLayer h={obj.human} /> : (
        obj.one_sentence_thesis && <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>{obj.one_sentence_thesis}</p>
      )}
      {hasDetail && (
        <Collapsible title="拆开看" hint="主张 · 机制 · 假设与失败" defaultOpen={false}>
          <DetailLayer obj={obj} />
        </Collapsible>
      )}
      {hasAudit && !compact && (
        <Collapsible title="查证 · 审计" hint="逐字锚点 · 考题 · 正典 ID" defaultOpen={false}>
          <AuditLayer obj={obj} />
        </Collapsible>
      )}
    </div>
  );
}

export function useRosObject(slug: string | null) {
  const [loaded, setLoaded] = useState<{ slug: string; obj: RosObject | null } | null>(null);
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    fetch(`/data/brief/ros-objects/${encodeURIComponent(slug)}.json`, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setLoaded({ slug, obj: d }); })
      .catch(() => { if (alive) setLoaded({ slug, obj: null }); });
    return () => { alive = false; };
  }, [slug]);
  const obj = slug && loaded?.slug === slug ? loaded.obj : null;
  const loading = !!slug && loaded?.slug !== slug;
  return { obj, loading };
}
