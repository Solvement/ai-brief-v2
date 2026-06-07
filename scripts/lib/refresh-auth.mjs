// Shared auth gate for model refresh/analyze API routes (SEC-1).
// Single source of truth for the REFRESH_TOKEN check so both
// app/api/models/refresh and app/api/models/analyze stay in lockstep.
//
// Semantics are intentionally identical to the original inline check in
// analyze/route.ts: `if (!token || token !== process.env.REFRESH_TOKEN) -> 401`.
// (Constant-time comparison is a separate task, SEC-3 — not done here.)

/**
 * Returns true only when a non-empty string token exactly matches the
 * configured REFRESH_TOKEN. When REFRESH_TOKEN is unset, every request is
 * denied (fail closed).
 *
 * @param {unknown} token - the candidate token (typically request body `token`)
 * @param {string | undefined} [expected] - override for process.env.REFRESH_TOKEN (testing)
 * @returns {boolean}
 */
export function isAuthorizedRefreshToken(token, expected = process.env.REFRESH_TOKEN) {
  if (typeof token !== "string" || token.length === 0) return false;
  if (typeof expected !== "string" || expected.length === 0) return false;
  return token === expected;
}
