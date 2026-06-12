"use client";
import { useEffect, useState } from "react";
import { Markdown } from "./Markdown";
import { ProjectFacetSpine, type FacetRecord } from "./ProjectFacetSpine";

/* ============================================================
   Light-spine deep-dive reading page (project-light-spine/v1)
   Renders the project "深扒 / 分析" reading page from
   meta.light_spine. The same component handles the lighter
   "分析" variant — it simply renders whichever sections exist.
   ============================================================ */

export interface ClaimItem {
  claim: string;
  plain_english?: string;
  source?: string;
  attribution?: "自称" | "已核实" | string;
  evidence_strength?: "high" | "medium" | "low" | "none" | string;
  supports?: string;
  does_not_support?: string;
  threat?: string;
}

interface SectionBody {
  summary?: string;
  body_md?: string;
}

interface ReusableItem {
  name?: string;
  copy?: string;
  skip?: string;
  why_it_matters?: string;
}

interface RiskItem {
  dependency?: string;
  what_if_change?: string;
  exposure?: "high" | "medium" | "low" | string;
  mitigation_or_unknown?: string;
  source?: string;
}

interface Judgment {
  action?: string;
  body_md?: string;
  ratings?: Record<string, number>;
  overall?: number;
}

export interface LightSpine {
  schema_version?: string;
  one_sentence?: SectionBody;
  why_worth_attention?: SectionBody & { bullets?: string[] };
  key_claims_evidence?: SectionBody & { items?: ClaimItem[] };
  how_it_works?: SectionBody;
  reusable_abstractions?: SectionBody & { items?: ReusableItem[] };
  dependency_platform_risk?: SectionBody & { items?: RiskItem[] };
  unknowns_to_confirm?: SectionBody & { items?: string[]; bullets?: string[] };
  judgment?: Judgment;
}

interface DiveItem {
  slug: string;
  title?: string;
  excerpt?: string;
  meta: Record<string, any>;
}

const ACTION_LABEL: Record<string, string> = {
  ignore: "忽略",
  monitor: "观望",
  try: "可一试",
  analyze: "值得分析",
  deep_dive: "值得深扒",
  "deep-dive": "值得深扒",
  clone_and_run: "克隆来跑",
  "clone-and-run": "克隆来跑",
  extract: "提炼复用",
};

const RATING_ORDER = ["相关度", "工程深度", "复用价值", "成熟度"];

function hasText(s?: string): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** A section has content worth rendering if any of its text/list fields are non-empty. */
function sectionHasContent(sec?: SectionBody & { bullets?: string[]; items?: unknown[] }): boolean {
  if (!sec) return false;
  return (
    hasText(sec.summary) ||
    hasText(sec.body_md) ||
    (Array.isArray(sec.bullets) && sec.bullets.length > 0) ||
    (Array.isArray((sec as { items?: unknown[] }).items) && (sec as { items?: unknown[] }).items!.length > 0)
  );
}

/** 返回链接带上来源榜（?win=monthly）：月榜点进来的返回月榜，不重置今日榜 */
function useBackToProjects(): string {
  const [href, setHref] = useState("/projects");
  useEffect(() => {
    const w = new URLSearchParams(location.search).get("win");
    if (w === "daily" || w === "weekly" || w === "monthly") setHref(`/projects?win=${w}`);
  }, []);
  return href;
}

export function LightSpineDeepDive({ item, spine, facet }: { item: DiveItem; spine: LightSpine; facet?: FacetRecord | null }) {
  const backHref = useBackToProjects();
  const m = item.meta ?? {};
  const repo: string | undefined = m.authoring?.repo;
  const projectType: string | undefined = m.project_type;
  const shape: string | undefined = m.shape;
  const isAnalysis = shape === "howto-use" || shape === "analysis";

  const title = (m.title ?? item.title ?? item.slug).replace(/\s*—\s*(深度拆解|深扒|分析)\s*$/u, "");
  const action = spine.judgment?.action;
  const actionLabel = action ? ACTION_LABEL[action] ?? action : null;

  const oneLine = spine.one_sentence;
  const why = spine.why_worth_attention;
  const claims = spine.key_claims_evidence;
  const how = spine.how_it_works;
  const reuse = spine.reusable_abstractions;
  const risk = spine.dependency_platform_risk;
  const unknowns = spine.unknowns_to_confirm;
  const unknownList: string[] =
    (Array.isArray(unknowns?.items) ? unknowns!.items : undefined) ??
    (Array.isArray(unknowns?.bullets) ? unknowns!.bullets : []);

  return (
    <article className="dd">
      <a className="dd-back" href={backHref}>← 项目雷达</a>

      {/* ── Header card ── */}
      <header className="dd-header">
        <div className="dd-header-top">
          {repo && <span className="dd-avatar" aria-hidden>{repo.charAt(0).toUpperCase()}</span>}
          <div className="dd-header-titles">
            <div className="dd-kicker">
              <span className={`dd-tier ${isAnalysis ? "dd-tier--analysis" : "dd-tier--deep"}`}>
                {isAnalysis ? "分析" : "深扒"}
              </span>
              {projectType && <span className="dd-type-tag">{projectType}</span>}
            </div>
            <h1 className="dd-title">{title}</h1>
            {repo && (
              <a className="dd-repo" href={`https://github.com/${repo}`} target="_blank" rel="noreferrer">
                {repo} ↗
              </a>
            )}
          </div>
        </div>

        {hasText(oneLine?.summary) && <p className="dd-positioning">{oneLine!.summary}</p>}
        {hasText(oneLine?.body_md) && (
          <details className="dd-readme" open>
            <summary>带读 · 人话</summary>
            <div className="dd-prose">
              <Markdown text={oneLine!.body_md!} />
            </div>
          </details>
        )}
      </header>

      {/* Mind Palace 深度内化（统一契约：每个深析项目标配，Kevin 2026-06-11） */}
      {facet && <ProjectFacetSpine facet={facet} />}

      {/* ── 2-column body: main content + sticky verdict rail ── */}
      <div className="dd-body">
        <div className="dd-main">
          {/* ── 为什么值得看 ── */}
          {sectionHasContent(why) && (
            <Section title="为什么值得看" kicker="WHY IT MATTERS">
              {hasText(why?.summary) && <p className="dd-section-lead">{why!.summary}</p>}
              {hasText(why?.body_md) && (
                <div className="dd-prose">
                  <Markdown text={why!.body_md!} />
                </div>
              )}
              {Array.isArray(why?.bullets) && why!.bullets.length > 0 && (
                <ul className="dd-checklist">
                  {why!.bullets.map((b, i) => (
                    <li key={i} className={`dd-check ${b.startsWith("需谨慎") ? "dd-check--caution" : "dd-check--verified"}`}>
                      <span className="dd-check-mark" aria-hidden>{b.startsWith("需谨慎") ? "!" : "✓"}</span>
                      <span className="dd-check-text">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {/* ── 关键主张与证据 (signature) ── */}
          {claims && Array.isArray(claims.items) && claims.items.length > 0 && (
            <Section title="关键主张与证据" kicker="CLAIMS & EVIDENCE">
              {hasText(claims.summary) && <p className="dd-section-lead">{claims.summary}</p>}
              {hasText(claims.body_md) && (
                <div className="dd-prose">
                  <Markdown text={claims.body_md!} />
                </div>
              )}
              <div className="dd-claims dd-claims--grid">
                {claims.items.map((c, i) => (
                  <ClaimCard key={i} claim={c} />
                ))}
              </div>
            </Section>
          )}

          {/* ── 它怎么 work ── */}
          {sectionHasContent(how) && (
            <Section title="它怎么 work" kicker="HOW IT WORKS">
              {hasText(how?.summary) && <p className="dd-section-lead">{how!.summary}</p>}
              {hasText(how?.body_md) && (
                <div className="dd-prose">
                  <Markdown text={how!.body_md!} />
                </div>
              )}
            </Section>
          )}

          {/* ── 复用什么抽象 + 依赖 / 平台风险 side-by-side ── */}
          {(sectionHasContent(reuse) || sectionHasContent(risk)) && (
            <div className="dd-duo">
              {sectionHasContent(reuse) && (
                <Section title="复用什么抽象" kicker="REUSABLE PATTERNS">
                  {hasText(reuse?.summary) && <p className="dd-section-lead">{reuse!.summary}</p>}
                  {hasText(reuse?.body_md) && (
                    <div className="dd-prose">
                      <Markdown text={reuse!.body_md!} />
                    </div>
                  )}
                  {Array.isArray(reuse?.items) && reuse!.items.length > 0 && (
                    <div className="dd-reuse-grid">
                      {reuse!.items.map((r, i) => (
                        <div className="dd-reuse-card" key={i}>
                          {hasText(r.name) && <h4 className="dd-reuse-name">{r.name}</h4>}
                          {hasText(r.copy) && (
                            <p className="dd-reuse-line"><span className="dd-reuse-tag dd-reuse-tag--copy">复用</span>{r.copy}</p>
                          )}
                          {hasText(r.skip) && (
                            <p className="dd-reuse-line"><span className="dd-reuse-tag dd-reuse-tag--skip">别学</span>{r.skip}</p>
                          )}
                          {hasText(r.why_it_matters) && <p className="dd-reuse-why">{r.why_it_matters}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {sectionHasContent(risk) && (
                <Section title="依赖 / 平台风险" kicker="DEPENDENCY & PLATFORM RISK">
                  {hasText(risk?.summary) && <p className="dd-section-lead">{risk!.summary}</p>}
                  {hasText(risk?.body_md) && (
                    <div className="dd-prose">
                      <Markdown text={risk!.body_md!} />
                    </div>
                  )}
                  {Array.isArray(risk?.items) && risk!.items.length > 0 && (
                    <div className="dd-risk-list">
                      {risk!.items.map((r, i) => (
                        <div className="dd-risk-row" key={i}>
                          <div className="dd-risk-head">
                            <span className="dd-risk-dep">{r.dependency ?? "依赖"}</span>
                            {hasText(r.exposure) && (
                              <span className={`dd-exposure dd-exposure--${r.exposure}`}>{exposureLabel(r.exposure!)}</span>
                            )}
                          </div>
                          {hasText(r.what_if_change) && <p className="dd-risk-what"><strong>变化影响：</strong>{r.what_if_change}</p>}
                          {hasText(r.mitigation_or_unknown) && <p className="dd-risk-mit"><strong>应对/未知：</strong>{r.mitigation_or_unknown}</p>}
                          {hasText(r.source) && <p className="dd-risk-src">来源：{r.source}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}
            </div>
          )}

          {/* ── 未知与待确认 (honest caveat box) ── */}
          {(hasText(unknowns?.summary) || hasText(unknowns?.body_md) || unknownList.length > 0) && (
            <section className="dd-caveat">
              <div className="dd-caveat-head">
                <span className="dd-caveat-icon" aria-hidden>⚠</span>
                <h2 className="dd-caveat-title">未知与待确认</h2>
              </div>
              {hasText(unknowns?.summary) && <p className="dd-section-lead">{unknowns!.summary}</p>}
              {hasText(unknowns?.body_md) && (
                <div className="dd-prose">
                  <Markdown text={unknowns!.body_md!} />
                </div>
              )}
              {unknownList.length > 0 && (
                <ul className="dd-caveat-list">
                  {unknownList.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── 判断 (prose only — action+ratings live in the rail) ── */}
          {spine.judgment && hasText(spine.judgment.body_md) && (
            <section className="dd-judgment">
              <div className="dd-section-head">
                <span className="dd-kicker-line">VERDICT</span>
                <h2 className="dd-section-title">判断</h2>
              </div>
              <div className="dd-prose dd-judgment-prose">
                <Markdown text={spine.judgment.body_md!} />
              </div>
            </section>
          )}
        </div>

        {/* ── sticky verdict rail ── */}
        {spine.judgment && (actionLabel || spine.judgment.ratings) && (
          <aside className="dd-rail">
            <div className="dd-rail-card">
              <div className="dd-rail-head">
                <span className="dd-kicker-line">VERDICT</span>
                <h2 className="dd-rail-title">判断速览</h2>
              </div>
              {actionLabel && (
                <div className="dd-action">
                  <span className="dd-action-label">建议动作</span>
                  <span className="dd-action-pill">{actionLabel}</span>
                </div>
              )}
              {spine.judgment.ratings && (
                <div className="dd-ratings dd-ratings--grid">
                  {ratingEntries(spine.judgment.ratings).map(([k, v]) => (
                    <ScoreBadge key={k} label={k} value={v} />
                  ))}
                </div>
              )}
              {typeof spine.judgment.overall === "number" && (
                <div className="dd-rail-overall">
                  <ScoreBadge label="综合" value={spine.judgment.overall} overall />
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}

/* ───────────────────────── ClaimCard (trust feature) ───────────────────────── */

const STRENGTH_LABEL: Record<string, string> = { high: "强证据", medium: "中等", low: "弱", none: "无证据" };
const STRENGTH_DOTS: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };

function ClaimCard({ claim }: { claim: ClaimItem }) {
  const [open, setOpen] = useState(false);
  const verified = claim.attribution === "已核实";
  const strength = (claim.evidence_strength ?? "none").toLowerCase();
  const dots = STRENGTH_DOTS[strength] ?? 0;
  const hasDetail = hasText(claim.supports) || hasText(claim.does_not_support) || hasText(claim.threat);

  return (
    <div className={`dd-claim ${verified ? "dd-claim--verified" : "dd-claim--claimed"}`}>
      <div className="dd-claim-body">
        <p className="dd-claim-text">{claim.claim}</p>
        {hasText(claim.plain_english) && <p className="dd-claim-plain">{claim.plain_english}</p>}

        <div className="dd-claim-prov">
          <span className={`dd-attr ${verified ? "dd-attr--verified" : "dd-attr--claimed"}`}>
            {verified ? "已核实" : claim.attribution ?? "自称"}
          </span>
          {claim.evidence_strength && (
            <span className={`dd-strength dd-strength--${strength}`} title={`证据强度：${STRENGTH_LABEL[strength] ?? strength}`}>
              <span className="dd-strength-dots" aria-hidden>
                {[0, 1, 2].map((d) => (
                  <span key={d} className={`dd-dot ${d < dots ? "on" : ""}`} />
                ))}
              </span>
              {STRENGTH_LABEL[strength] ?? strength}
            </span>
          )}
          {hasText(claim.source) && <span className="dd-claim-source">来源：{claim.source}</span>}
        </div>

        {hasDetail && (
          <>
            <button type="button" className="dd-claim-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? "收起 ▴" : "展开支持 / 反证 / 威胁 ▾"}
            </button>
            {open && (
              <dl className="dd-claim-detail">
                {hasText(claim.supports) && (
                  <div className="dd-claim-detail-row dd-claim-detail-row--support">
                    <dt>支持</dt>
                    <dd>{claim.supports}</dd>
                  </div>
                )}
                {hasText(claim.does_not_support) && (
                  <div className="dd-claim-detail-row dd-claim-detail-row--against">
                    <dt>不支持</dt>
                    <dd>{claim.does_not_support}</dd>
                  </div>
                )}
                {hasText(claim.threat) && (
                  <div className="dd-claim-detail-row dd-claim-detail-row--threat">
                    <dt>威胁</dt>
                    <dd>{claim.threat}</dd>
                  </div>
                )}
              </dl>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── small pieces ───────────────────────── */

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

function ScoreBadge({ label, value, overall }: { label: string; value: number; overall?: boolean }) {
  const max = 5;
  const pct = Math.max(0, Math.min(1, value / max));
  const deg = Math.round(pct * 360);
  return (
    <div className={`dd-score ${overall ? "dd-score--overall" : ""}`}>
      <div className="dd-score-ring" style={{ background: `conic-gradient(var(--dd-accent) ${deg}deg, var(--dd-line) 0deg)` }}>
        <span className="dd-score-num">{value}</span>
      </div>
      <span className="dd-score-label">{label}</span>
    </div>
  );
}

function exposureLabel(e: string): string {
  if (e === "high") return "高暴露";
  if (e === "medium") return "中等";
  if (e === "low") return "低";
  return e;
}

/** Order the four canonical ratings first, then any extras, preserving numeric values. */
function ratingEntries(ratings: Record<string, number>): Array<[string, number]> {
  const entries = Object.entries(ratings).filter(([, v]) => typeof v === "number");
  entries.sort((a, b) => {
    const ia = RATING_ORDER.indexOf(a[0]);
    const ib = RATING_ORDER.indexOf(b[0]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return entries;
}
