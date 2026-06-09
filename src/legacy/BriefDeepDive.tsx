"use client";
import { useEffect, useState } from "react";
import { Markdown } from "../components/Markdown";
import { loadBriefEntity } from "../lib/data";
import { LightSpineDeepDive } from "../components/LightSpineDeepDive";
import type { LightSpine } from "../components/LightSpineDeepDive";
import { TierTemplateDeepDive } from "../components/TierTemplateDeepDive";
import type { ProjectTierTemplate } from "../types";

/** Minimal shapes for the BriefMem JSON mirror (public/data/brief/*.json). */
interface BriefItem {
  slug: string;
  title?: string;
  body?: string;
  excerpt?: string;
  meta: Record<string, any>;
}

interface ClaimLedgerEntry {
  claim: string;
  plain_english?: string;
  source: string;
  evidence_strength?: string;
  supports?: string;
  does_not_support?: string;
  threat?: string;
}

interface EvidenceRow {
  experiment: string;
  dataset?: string;
  baseline?: string;
  metric?: string;
  result?: string;
  sample_size?: string;
  exactness?: string;
  source: string;
  limitation?: string;
}

export function BriefDeepDive({ slug }: { slug?: string }) {
  const [deepDives, setDeepDives] = useState<BriefItem[] | null>(null);
  const [content, setContent] = useState<BriefItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadBriefEntity<BriefItem>("deep-dives"), loadBriefEntity<BriefItem>("content")])
      .then(([dd, c]) => {
        setDeepDives(dd.items);
        setContent(c.items);
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  if (error) return <Shell><p className="brief-error">加载失败：{error}</p></Shell>;
  if (!deepDives || !content) return <Shell><p className="brief-loading">加载中…</p></Shell>;

  // Pick the requested deep-dive, or the first one available.
  const dive = slug ? deepDives.find((d) => (d.meta?.content ?? d.slug) === slug || d.slug === slug) : deepDives[0];
  if (!dive) {
    return (
      <Shell>
        <h1 className="brief-h1">Deep dives</h1>
        <ul className="brief-list">
          {deepDives.map((d) => (
            <li key={d.slug}>
              <a href={`/brief/${d.meta?.content ?? d.slug}`}>{d.title ?? d.slug}</a>
            </li>
          ))}
          {deepDives.length === 0 && <li>暂无 deep dive。</li>}
        </ul>
      </Shell>
    );
  }

  // NEWEST shape: project-radar tier paradigm (2026-06-03) → tier_template page.
  const tierTpl: ProjectTierTemplate | undefined = dive.meta?.tier_template;
  if (tierTpl && (typeof tierTpl.tier === "number" || tierTpl.one_sentence_positioning)) {
    return (
      <Shell mode="tier">
        <TierTemplateDeepDive item={dive} tpl={tierTpl} />
      </Shell>
    );
  }

  // NEW shape: project-light-spine/v1 → premium light-spine reading page.
  const lightSpine: LightSpine | undefined = dive.meta?.light_spine;
  if (lightSpine && lightSpine.schema_version) {
    return (
      <Shell mode="lightspine">
        <LightSpineDeepDive item={dive} spine={lightSpine} />
      </Shell>
    );
  }

  // ── OLD shape (37 legacy deep-dives): keep the existing renderer working. ──
  const paper = content.find((c) => c.slug === dive.meta?.content);
  const pm = paper?.meta ?? {};
  const m = dive.meta ?? {};
  const quality = m.quality_report ?? {};
  const audit = m.artifact_audit ?? {};
  const trace = m.reasoning_trace ?? {};
  const pv = m.project_verdict ?? null;
  const nextActions: string[] = Array.isArray(m.next_actions) ? m.next_actions : [];
  const typeLabel = pv ? m.project_type : [m.paper_type, m.secondary_type].filter(Boolean).join(" + ");
  const claims: ClaimLedgerEntry[] = Array.isArray(m.claim_ledger) ? m.claim_ledger : [];
  const matrix: EvidenceRow[] = Array.isArray(m.evidence_matrix) ? m.evidence_matrix : [];
  const authors: string[] = Array.isArray(pm.authors_or_creators) ? pm.authors_or_creators : [];

  return (
    <Shell>
      <a className="brief-back" href="/brief">← 所有 deep dive</a>

      <header className="brief-head">
        <div className="brief-kicker">{pm.type ?? "paper"}{typeLabel ? ` · ${typeLabel}` : ""}</div>
        <h1 className="brief-h1">{pm.title ?? dive.title ?? dive.slug}</h1>
        {authors.length > 0 && <div className="brief-authors">{authors.join(", ")}</div>}
        <div className="brief-meta-row">
          {pm.url && <a className="brief-source" href={pm.url} target="_blank" rel="noreferrer">{pm.source ?? "source"} ↗</a>}
          {typeof pm.importance !== "undefined" && <span className="chip">importance {pm.importance}/5</span>}
          {pm.status && <span className="chip">{pm.status}</span>}
        </div>
        {pm.why_selected && <p className="brief-why"><strong>为什么选它：</strong>{pm.why_selected}</p>}
      </header>

      <section className="deep-dive">
        {/* Verdict bar — project (action-oriented) vs paper */}
        {pv ? (
          <>
            <div className="verdict-bar">
              <strong>判定</strong>{" "}
              <span className={`brief-verdict brief-verdict--proj brief-verdict--${pv.verdict ?? "na"}`}>{(pv.verdict ?? "n/a").toUpperCase()}</span>
              {typeof pv.relevance_to_ai_engineer !== "undefined" && <span className="chip">AI工程相关 {pv.relevance_to_ai_engineer}/5</span>}
              {typeof pv.engineering_depth !== "undefined" && <span className="chip">工程深度 {pv.engineering_depth}/5</span>}
              {typeof pv.reuse_value !== "undefined" && <span className="chip">复用价值 {pv.reuse_value}/5</span>}
              {typeof pv.maturity !== "undefined" && <span className="chip">成熟度 {pv.maturity}/5</span>}
            </div>
            {pv.main_risk && <p className="brief-mainrisk"><strong>主要风险：</strong>{pv.main_risk}</p>}
            {nextActions.length > 0 && (
              <p className="brief-actions"><strong>下一步：</strong>{nextActions.map((a, i) => <span className="chip" key={i}>{a}</span>)}</p>
            )}
          </>
        ) : (
          <>
            <div className="verdict-bar">
              <strong>判定</strong>{" "}
              <span className={`brief-verdict brief-verdict--${quality.verdict ?? "na"}`}>{(quality.verdict ?? "n/a").toUpperCase()}</span>
              {typeof quality.grounded_score !== "undefined" && <span className="chip">grounding {quality.grounded_score}</span>}
              {audit.reproducibility_status && <span className="chip">复现: {audit.reproducibility_status}</span>}
              {quality.transfer_value && <span className="chip">迁移价值: {quality.transfer_value}</span>}
              {Array.isArray(quality.flags) && quality.flags.length > 0 && (
                <span className="brief-flags">flags: {quality.flags.join(", ")}</span>
              )}
            </div>
            {quality.main_risk && <p className="brief-mainrisk"><strong>主要风险：</strong>{quality.main_risk}</p>}
          </>
        )}

        {/* Compressed reasoning trace — the analyst's auditable work (collapsed by default) */}
        {Object.keys(trace).length > 0 && (
          <details className="brief-trace">
            <summary>分析推理轨迹 (reasoning trace)</summary>
            <dl className="brief-trace-dl">
              {trace.paper_type_decision && <><dt>类型判定</dt><dd>{trace.paper_type_decision}</dd></>}
              {trace.central_contribution && <><dt>贡献对象</dt><dd>{trace.central_contribution}</dd></>}
              {Array.isArray(trace.inspected) && trace.inspected.length > 0 && (
                <><dt>查阅</dt><dd>{trace.inspected.join("；")}</dd></>
              )}
              {Array.isArray(trace.top_claims) && trace.top_claims.length > 0 && (
                <><dt>Top claims</dt><dd><ol>{trace.top_claims.map((c: string, i: number) => <li key={i}>{c}</li>)}</ol></dd></>
              )}
              {Array.isArray(trace.evidence_needed) && trace.evidence_needed.length > 0 && (
                <><dt>需要的证据</dt><dd><ul>{trace.evidence_needed.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul></dd></>
              )}
              {Array.isArray(trace.main_threats) && trace.main_threats.length > 0 && (
                <><dt>主要威胁</dt><dd><ul>{trace.main_threats.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul></dd></>
              )}
              {trace.transfer_decision && <><dt>迁移决定</dt><dd>{trace.transfer_decision}</dd></>}
            </dl>
          </details>
        )}

        {/* Type-specific analysis body */}
        {dive.body && (
          <div className="brief-body">
            <Markdown text={dive.body} />
          </div>
        )}

        {/* Claim ledger */}
        {claims.length > 0 && (
          <div>
            <h3 className="brief-h3">结论与证据账本</h3>
            <div className="claim-ledger">
              {claims.map((c, i) => (
                <div className="claim-row" key={i}>
                  <p className="claim-text">{c.claim}</p>
                  {c.plain_english && <p className="claim-plain">大白话：{c.plain_english}</p>}
                  <div className="claim-meta">
                    <span className="chip">{c.evidence_strength ?? "?"}</span>
                    <span className="claim-source">{c.source}</span>
                  </div>
                  {c.supports && <p className="claim-sub"><strong>支持：</strong>{c.supports}</p>}
                  {c.does_not_support && <p className="claim-sub"><strong>不支持：</strong>{c.does_not_support}</p>}
                  {c.threat && <p className="claim-sub claim-threat"><strong>威胁：</strong>{c.threat}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence matrix */}
        {matrix.length > 0 && (
          <div>
            <h3 className="brief-h3">原始结果矩阵</h3>
            <table className="evidence-matrix">
              <thead>
                <tr>
                  <th>实验</th><th>baseline</th><th>指标</th><th>结果</th><th>出处</th><th>局限</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((r, i) => (
                  <tr key={i}>
                    <td>{r.experiment}{r.dataset ? <><br /><small>{r.dataset}</small></> : null}</td>
                    <td>{r.baseline ?? "—"}</td>
                    <td>{r.metric ?? "—"}{r.exactness ? <><br /><small>{r.exactness}</small></> : null}</td>
                    <td><strong>{r.result ?? "—"}</strong></td>
                    <td><small>{r.source}</small></td>
                    <td><small>{r.limitation ?? "—"}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Artifact audit */}
        {Object.keys(audit).length > 0 && (
          <div>
            <h3 className="brief-h3">成果可得性审计</h3>
            <dl className="brief-audit">
              {Object.entries(audit).map(([k, v]) => (
                <div className="brief-audit-row" key={k}>
                  <dt>{k}</dt>
                  <dd>{Array.isArray(v) ? (v.length ? v.join(", ") : "—") : String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children, mode }: { children: React.ReactNode; mode?: "lightspine" | "tier" }) {
  // `tier` = the project-radar tier paradigm page: full-width treatment (like the
  // paper page redesign) so architecture diagrams + comparisons use the landscape.
  const extra = mode === "tier" ? " dd-page brief-deepdive--full" : mode === "lightspine" ? " dd-page" : "";
  return (
    <div className="page">
      <main className={`workbench-main brief-deepdive${extra}`}>{children}</main>
    </div>
  );
}
