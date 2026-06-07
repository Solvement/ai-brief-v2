import type { TrendingData, AnalyzedRepo } from "../types";

// The simple Home shows at most 8 project names. This selection is the single
// source of truth, shared by the server (app/page.tsx, which uses it to slim the
// inlined payload) and the client fallback in HomePage — so the two never drift.

/** Only the fields HomePage's project name-row actually renders. Keeping the
 *  inlined home payload to these (×8) avoids shipping the ~720KB trending.json. */
export type HomeRepo = Pick<
  AnalyzedRepo,
  "fullName" | "url" | "stars" | "final_depth" | "project_tier" | "briefSlug" | "brief_slug"
>;

/** Dedupe across the three trending boards, prefer deep / Tier 3, take the top 8. */
export function selectHomeProjects(trending?: TrendingData | null): AnalyzedRepo[] {
  if (!trending) return [];
  const all = [
    ...new Map(
      [
        ...(trending.daily?.repos || []),
        ...(trending.weekly?.repos || []),
        ...(trending.monthly?.repos || []),
      ].map((r) => [r.fullName, r]),
    ).values(),
  ];
  const deep = all.filter((r) => r.final_depth === "deep" || r.project_tier === 3);
  return (deep.length ? deep : all).slice(0, 8);
}

/** Project to the small render-only shape (drops the heavy analysis payload). */
export function slimHomeProjects(repos: AnalyzedRepo[]): HomeRepo[] {
  return repos.map((r) => ({
    fullName: r.fullName,
    url: r.url,
    stars: r.stars,
    final_depth: r.final_depth,
    project_tier: r.project_tier,
    briefSlug: r.briefSlug,
    brief_slug: r.brief_slug,
  }));
}

/** Convenience: full trending -> the ≤8 slim repos Home renders. */
export function homeProjectsFromTrending(trending?: TrendingData | null): HomeRepo[] {
  return slimHomeProjects(selectHomeProjects(trending));
}
