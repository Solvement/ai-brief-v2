// Shared auth gate for model refresh/analyze API routes (SEC-1 + SEC-3).
// Single source of truth for the REFRESH_TOKEN check so both
// app/api/models/refresh and app/api/models/analyze stay in lockstep.
//
// SEC-3: the comparison is constant-time (crypto.timingSafeEqual) to avoid a
// timing side-channel that could leak the token byte-by-byte.

import { timingSafeEqual } from "node:crypto";

/**
 * Returns true only when a non-empty string token matches the configured
 * REFRESH_TOKEN via a constant-time comparison. When REFRESH_TOKEN is unset,
 * every request is denied (fail closed). A length mismatch returns false —
 * timingSafeEqual requires equal-length buffers, and the length check itself is
 * not constant-time, which is the standard, accepted trade-off for tokens.
 *
 * @param {unknown} token - the candidate token (typically request body `token`)
 * @param {string | undefined} [expected] - override for process.env.REFRESH_TOKEN (testing)
 * @returns {boolean}
 */
export function isAuthorizedRefreshToken(token, expected = process.env.REFRESH_TOKEN) {
  if (typeof token !== "string" || token.length === 0) return false;
  if (typeof expected !== "string" || expected.length === 0) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
