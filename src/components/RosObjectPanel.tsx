"use client";
import { useEffect, useState } from "react";

// ════════════════════════════════════════════════════════════════════
//  ROS 对象面板（KG-4，docs/paradigms/research-object-store.md §1）
//  一份 ros-objects/{slug}.json 的 Kevin-facing 渲染：
//  定位 → 什么时候想起它(trigger_hooks) → 主张与证据(claims+cannot_prove)
//  → 机制(mechanisms) → 假设/失败模式 → 自用判定 → 自检考题。
//  前后端同步门：对象层每个字段在这里都有渲染位，不留孤儿数据。
// ════════════════════════════════════════════════════════════════════

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
  canonical?: { problems?: string[]; concepts?: string[]; benchmarks?: string[] };
  claims?: RosClaim[]; mechanisms?: RosMechanism[]; assumptions?: RosAssumption[];
  failure_modes?: RosFailureMode[]; trigger_hooks?: RosTriggerHook[]; exam_questions?: RosExamQuestion[];
  self_evo_verdict?: { state?: string; reason?: string };
}

const CLAIM_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  fact: { label: "实读事实", color: "#15803d", bg: "#f0fdf4" },
  author_claim: { label: "作者主张", color: "#2563eb", bg: "#eff6ff" },
  interpretation: { label: "我方解释", color: "#b45309", bg: "#fffbeb" },
  inference: { label: "我方推断", color: "#be185d", bg: "#fdf2f8" },
};
const VERDICT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  apply: { label: "可直接自用", color: "#15803d", bg: "#f0fdf4" },
  queue: { label: "排队周审", color: "#b45309", bg: "#fffbeb" },
  no: { label: "暂不自用", color: "#64748b", bg: "#f8fafc" },
};
const EXAM_TYPE_LABEL: Record<string, string> = {
  counterfactual: "反事实", boundary: "边界", transfer: "迁移",
};

function Section({ k, title, children, defaultOpen = true }: { k: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#2563eb" }}>{title}</span>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div data-sec={k} style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

export function RosObjectPanel({ obj, compact = false }: { obj: RosObject; compact?: boolean }) {
  const verdict = obj.self_evo_verdict?.state ? VERDICT_LABEL[obj.self_evo_verdict.state] : null;
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "#1e293b" }}>
      {obj.one_sentence_thesis && (
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#0f172a" }}><b>一句话定位：</b>{obj.one_sentence_thesis}</p>
      )}
      {(obj.canonical?.concepts?.length || obj.canonical?.problems?.length) ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 2px" }}>
          {(obj.canonical?.problems || []).map((p) => (
            <span key={p} style={{ fontSize: 11, color: "#0e7490", background: "#ecfeff", border: "1px solid #cffafe", padding: "1px 8px", borderRadius: 20 }}>{p}</span>
          ))}
          {(obj.canonical?.concepts || []).map((c) => (
            <span key={c} style={{ fontSize: 11, color: "#4338ca", background: "#eef2ff", border: "1px solid #e0e7ff", padding: "1px 8px", borderRadius: 20 }}>{c}</span>
          ))}
        </div>
      ) : null}

      {(obj.trigger_hooks?.length || 0) > 0 && (
        <Section k="hooks" title="什么时候想起这篇">
          <div style={{ display: "grid", gap: 8 }}>
            {obj.trigger_hooks!.map((h, i) => (
              <div key={i} style={{ border: "1px solid #dbeafe", background: "#f5f9ff", borderRadius: 10, padding: "9px 12px" }}>
                <p style={{ margin: 0 }}><b>当你遇到：</b>{h.symptom}</p>
                {h.why_recall && <p style={{ margin: "4px 0 0", color: "#475569" }}>{h.why_recall}</p>}
                {h.risk && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#b45309" }}>⚠ 召回后别乱用：{h.risk}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(obj.claims?.length || 0) > 0 && (
        <Section k="claims" title="主张与证据">
          <div style={{ display: "grid", gap: 10 }}>
            {obj.claims!.map((c) => {
              const t = CLAIM_TYPE_LABEL[c.type || ""] || null;
              return (
                <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    {t && <span style={{ fontSize: 10.5, fontWeight: 700, color: t.color, background: t.bg, padding: "1px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>{t.label}</span>}
                    {c.confidence && <span style={{ fontSize: 10.5, color: "#94a3b8" }}>置信 {c.confidence}</span>}
                  </div>
                  <p style={{ margin: "5px 0 0" }}>{c.statement}</p>
                  {(c.evidence?.length || 0) > 0 && (
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>
                      <b>证据锚点：</b>{c.evidence!.map((e) => e.anchor).filter(Boolean).join("；")}
                    </p>
                  )}
                  {(c.cannot_prove?.length || 0) > 0 && (
                    <div style={{ margin: "6px 0 0", fontSize: 12.5, color: "#9a3412", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 9px" }}>
                      <b>它不能证明：</b>
                      <ul style={{ margin: "3px 0 0", paddingLeft: 18 }}>
                        {c.cannot_prove!.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {(obj.mechanisms?.length || 0) > 0 && (
        <Section k="mech" title="机制怎么跑">
          <div style={{ display: "grid", gap: 10 }}>
            {obj.mechanisms!.map((m) => (
              <div key={m.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{m.name || m.id}</p>
                {(m.input || m.output) && (
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#475569" }}>
                    {m.input && <span style={{ marginRight: 10 }}><b>进：</b>{m.input}</span>}{m.output && <span><b>出：</b>{m.output}</span>}
                  </p>
                )}
                {(m.operations?.length || 0) > 0 && (
                  <ol style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 12.5, color: "#334155" }}>
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
        </Section>
      )}

      {((obj.assumptions?.length || 0) > 0 || (obj.failure_modes?.length || 0) > 0) && (
        <Section k="bounds" title="假设与会怎么失败" defaultOpen={!compact}>
          {(obj.assumptions?.length || 0) > 0 && (
            <ul style={{ margin: "0 0 6px", paddingLeft: 18, color: "#475569", fontSize: 12.5 }}>
              {obj.assumptions!.map((a) => (
                <li key={a.id}>{a.kind === "implicit" ? "（隐含）" : ""}{a.statement}</li>
              ))}
            </ul>
          )}
          {(obj.failure_modes?.length || 0) > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              {obj.failure_modes!.map((f) => (
                <p key={f.id} style={{ margin: 0, fontSize: 12.5, color: "#7f1d1d" }}>
                  ✗ {f.statement}{f.triggered_when ? `——当${f.triggered_when}` : ""}
                </p>
              ))}
            </div>
          )}
        </Section>
      )}

      {obj.self_evo_verdict && (
        <Section k="verdict" title="对我们自己系统" defaultOpen={!compact}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            {verdict && <span style={{ fontSize: 11, fontWeight: 700, color: verdict.color, background: verdict.bg, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{verdict.label}</span>}
          </div>
          {obj.self_evo_verdict.reason && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#475569" }}>{obj.self_evo_verdict.reason}</p>}
        </Section>
      )}

      {(obj.exam_questions?.length || 0) > 0 && (
        <Section k="exam" title="自检考题（AI 理解度 benchmark）" defaultOpen={false}>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: "#475569" }}>
            {obj.exam_questions!.map((qq, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {qq.type && <span style={{ color: "#94a3b8" }}>[{EXAM_TYPE_LABEL[qq.type] || qq.type}] </span>}{qq.q}
              </li>
            ))}
          </ol>
        </Section>
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
