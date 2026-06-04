"use client";
import { Markdown } from "./Markdown";
import type { ProjectTierTemplate } from "../types";

/* ============================================================
   项目深扒 — tier_template reading page (project-radar tier
   paradigm, 2026-06-03). Replaces the old light_spine renderer.
   Renders whichever fields exist for the repo's tier:
     Tier 1: positioning / what / metadata / labels
     Tier 2+: + pain / capabilities / how-to-run / maturity /
              comparison / trajectory
     Tier 3+: + how-it-works(analogy) / design difference /
              practitioner meaning / cross-links  [需人工确认]
   Light + blue look, reusing the .dd-* design tokens.
   ============================================================ */

interface DiveItem {
  slug: string;
  title?: string;
  excerpt?: string;
  meta: Record<string, unknown>;
}

const TIER_LABEL: Record<number, string> = { 3: "深扒", 2: "分析", 1: "速读", 0: "索引" };

/** No-fabrication sentinels: values the analyzer emits when it has nothing real. */
const SENTINELS = ["数据不足", "官方未披露"];

/**
 * True only when `s` carries real content. Rejects empty/whitespace, the bare
 * sentinels, prefixed/suffixed variants (starts-with a sentinel), and strings
 * that are nothing but sentinels + punctuation/whitespace.
 */
function isMeaningfulText(s?: string): s is string {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (t.length === 0) return false;
  for (const sentinel of SENTINELS) {
    if (t === sentinel) return false;
    if (t.startsWith(sentinel)) return false;
  }
  // Strip every sentinel + surrounding punctuation/whitespace; if nothing is
  // left, the string was only sentinels (e.g. "数据不足。" or "数据不足/官方未披露").
  let stripped = t;
  for (const sentinel of SENTINELS) {
    stripped = stripped.split(sentinel).join("");
  }
  if (/^[\s。，、；：·/|\\—-]*$/u.test(stripped)) return false;
  return true;
}

/** Back-compat alias used throughout the renderer. */
function hasText(s?: string): s is string {
  return isMeaningfulText(s);
}

function fmtStars(v?: number | string): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return String(v ?? "—");
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

export function TierTemplateDeepDive({ item, tpl }: { item: DiveItem; tpl: ProjectTierTemplate }) {
  const tier = typeof tpl.tier === "number" ? tpl.tier : 1;
  const bucket = tpl.bucket || "";
  const repo: string | undefined = (item.meta?.authoring as { repo?: string } | undefined)?.repo;
  const title = (item.title ?? item.slug).replace(/\s*—\s*(深度拆解|深扒|分析|速读)\s*$/u, "");
  const manualConfirm = tpl.manual_confirmation || tier === 3;

  const md = tpl.metadata;
  const caps = (tpl.core_capabilities || []).filter((c) => hasText(c));
  const labels = tpl.labels || [];
  const install = tpl.how_to_run?.install_command;
  const example = tpl.how_to_run?.minimal_example;
  const showHowRun = hasText(install) || hasText(example);
  const maturity = tpl.maturity_signals;
  const crossLinks = (tpl.cross_links || []).filter(Boolean);

  return (
    <article className="dd dd-tier">
      <a className="dd-back" href="/projects">← 项目雷达</a>

      <header className="dd-header">
        <div className="dd-header-top">
          {repo && <span className="dd-avatar" aria-hidden>{repo.charAt(0).toUpperCase()}</span>}
          <div className="dd-header-titles">
            <div className="dd-kicker">
              <span className={`dd-tier ${tier >= 3 ? "dd-tier--deep" : "dd-tier--analysis"}`}>
                {hasText(tpl.tag) ? tpl.tag : `Tier ${tier}${bucket ? `｜${bucket}` : ""}`}
              </span>
              <span className="dd-type-tag">{TIER_LABEL[tier] || "速读"}</span>
              {manualConfirm && <span className="dd-manual">需人工确认</span>}
            </div>
            <h1 className="dd-title">{title}</h1>
            {repo && (
              <a className="dd-repo" href={`https://github.com/${repo}`} target="_blank" rel="noreferrer">
                {repo} ↗
              </a>
            )}
          </div>
        </div>

        {hasText(tpl.one_sentence_positioning) && (
          <p className="dd-positioning">{tpl.one_sentence_positioning}</p>
        )}

        {/* 元数据 strip */}
        {md && (
          <div className="dd-tier-meta">
            {md.language ? <span className="dd-tier-meta-item"><b>语言</b>{md.language}</span> : null}
            {md.total_stars != null ? <span className="dd-tier-meta-item"><b>总 star</b>{fmtStars(md.total_stars)}</span> : null}
            {md.stars_in_period != null ? <span className="dd-tier-meta-item"><b>周期 star</b>{fmtStars(md.stars_in_period)}</span> : null}
            {md.author ? <span className="dd-tier-meta-item"><b>作者</b>{md.author}</span> : null}
          </div>
        )}
        {labels.length > 0 && (
          <div className="dd-tier-labels">
            {labels.map((l) => <span className="dd-tier-label" key={l}>{l}</span>)}
          </div>
        )}
      </header>

      <div className="dd-body dd-body--single">
        <div className="dd-main">
          {/* 干什么 */}
          {hasText(tpl.what_it_does) && (
            <Section title="干什么" kicker="WHAT IT DOES">
              <p className="dd-section-lead">{tpl.what_it_does}</p>
            </Section>
          )}

          {/* ── Tier 2+ ── */}
          {hasText(tpl.pain_point) && (
            <Section title="解决什么痛点" kicker="PAIN POINT">
              <p className="dd-section-lead">{tpl.pain_point}</p>
            </Section>
          )}

          {caps.length > 0 && (
            <Section title="核心能力" kicker="CORE CAPABILITIES">
              <ol className="dd-cap-list">
                {caps.map((c, i) => <li key={i}>{c}</li>)}
              </ol>
            </Section>
          )}

          {showHowRun && (
            <Section title="怎么跑起来" kicker="HOW TO RUN">
              {hasText(install) && (
                <div className="dd-run-block">
                  <span className="dd-run-label">安装</span>
                  <pre className="dd-code"><code>{install}</code></pre>
                </div>
              )}
              {hasText(example) && (
                <div className="dd-run-block">
                  <span className="dd-run-label">最小示例</span>
                  <pre className="dd-code"><code>{example}</code></pre>
                </div>
              )}
            </Section>
          )}

          {maturity && (hasText(maturity.star_velocity) || hasText(maturity.recent_commit) || hasText(maturity.releases) || hasText(maturity.issue_activity)) && (
            <Section title="成熟度信号" kicker="MATURITY">
              <div className="dd-maturity-grid">
                {hasText(maturity.star_velocity) && <MaturityRow label="star 增速" value={maturity.star_velocity!} />}
                {hasText(maturity.recent_commit) && <MaturityRow label="最近提交" value={maturity.recent_commit!} />}
                {hasText(maturity.releases) && <MaturityRow label="发布" value={maturity.releases!} />}
                {hasText(maturity.issue_activity) && <MaturityRow label="issue 活跃度" value={maturity.issue_activity!} />}
              </div>
            </Section>
          )}

          {hasText(tpl.comparison) && (
            <Section title="和同类的区别" kicker="VS ALTERNATIVES">
              <p className="dd-section-lead">{tpl.comparison}</p>
            </Section>
          )}

          {hasText(tpl.trajectory_note) && (
            <Section title="轨迹备注" kicker="TRAJECTORY">
              <p className="dd-section-lead">{tpl.trajectory_note}</p>
            </Section>
          )}

          {/* ── Tier 3+ ── */}
          {hasText(tpl.how_it_works_with_analogy) && (
            <Section title="它怎么工作" kicker="HOW IT WORKS">
              <div className="dd-prose"><Markdown text={tpl.how_it_works_with_analogy!} /></div>
            </Section>
          )}

          {hasText(tpl.essential_design_difference) && (
            <Section title="为什么和同类本质不同" kicker="DESIGN TRADE-OFFS">
              <div className="dd-prose"><Markdown text={tpl.essential_design_difference!} /></div>
            </Section>
          )}

          {hasText(tpl.practitioner_meaning) && (
            <Section title="对从业者意味着什么" kicker="WHAT IT MEANS FOR YOU">
              <div className="dd-prose"><Markdown text={tpl.practitioner_meaning!} /></div>
            </Section>
          )}

          {crossLinks.length > 0 && (
            <Section title="交叉链接" kicker="CROSS LINKS">
              <ul className="dd-crosslinks">
                {crossLinks.map((c, i) => {
                  if (typeof c === "string") return <li key={i}>{c}</li>;
                  const label = c.label || c.title || c.url || "链接";
                  return (
                    <li key={i}>
                      {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{label} ↗</a> : label}
                      {c.type ? <span className="dd-crosslink-type">{c.type}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </article>
  );
}

function MaturityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="dd-maturity-row">
      <span className="dd-maturity-label">{label}</span>
      <span className="dd-maturity-value">{value}</span>
    </div>
  );
}

function Section({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="dd-section">
      <div className="dd-section-head">
        {kicker && <span className="dd-kicker-line">{kicker}</span>}
        <h2 className="dd-section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}
