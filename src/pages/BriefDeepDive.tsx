import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { Markdown } from "../components/Markdown";
import { loadBriefEntity } from "../lib/data";

/** Minimal shapes for the BriefMem JSON mirror (public/data/brief/*.json). */
interface BriefItem {
  slug: string;
  title?: string;
  body?: string;
  meta: Record<string, any>;
}

interface ClaimLedgerEntry {
  claim: string;
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
  const dive = slug ? deepDives.find((d) => (d.meta?.content ?? d.slug) === slug) : deepDives[0];
  if (!dive) {
    return (
      <Shell>
        <h1 className="brief-h1">Deep dives</h1>
        <ul className="brief-list">
          {deepDives.map((d) => (
            <li key={d.slug}>
              <a href={`#/brief/${d.meta?.content ?? d.slug}`}>{d.title ?? d.slug}</a>
            </li>
          ))}
          {deepDives.length === 0 && <li>暂无 deep dive。</li>}
        </ul>
      </Shell>
    );
  }

  const paper = content.find((c) => c.slug === dive.meta?.content);
  const pm = paper?.meta ?? {};
  const m = dive.meta ?? {};
  const quality = m.quality_report ?? {};
  const audit = m.artifact_audit ?? {};
  const claims: ClaimLedgerEntry[] = Array.isArray(m.claim_ledger) ? m.claim_ledger : [];
  const matrix: EvidenceRow[] = Array.isArray(m.evidence_matrix) ? m.evidence_matrix : [];
  const authors: string[] = Array.isArray(pm.authors_or_creators) ? pm.authors_or_creators : [];

  return (
    <Shell>
      <a className="brief-back" href="#/brief">← 所有 deep dive</a>

      <header className="brief-head">
        <div className="brief-kicker">{pm.type ?? "paper"} · {m.shape ?? "paper"}{m.paper_type ? ` · ${m.paper_type}` : ""}</div>
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
        {/* Verdict bar */}
        <div className="verdict-bar">
          <strong>判定</strong>{" "}
          <span className={`brief-verdict brief-verdict--${quality.verdict ?? "na"}`}>{(quality.verdict ?? "n/a").toUpperCase()}</span>
          {typeof quality.grounded_score !== "undefined" && <span className="chip">grounding {quality.grounded_score}</span>}
          {audit.reproducibility_status && <span className="chip">复现: {audit.reproducibility_status}</span>}
          {Array.isArray(quality.flags) && quality.flags.length > 0 && (
            <span className="brief-flags">flags: {quality.flags.join(", ")}</span>
          )}
        </div>

        {/* Technical reading + mechanisms + highlights + defects + after-analysis (the body) */}
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <SiteHeader active="articles" />
      <main className="workbench-main brief-deepdive">{children}</main>
    </div>
  );
}
