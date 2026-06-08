const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_BACKOFF_MS = 500;
const DEFAULT_BACKOFF_CAP_MS = 8000;
const DEFAULT_RATE_LIMIT_WAIT_CAP_MS = 60000;

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isTransientNetworkError(error) {
  if (!error) return false;
  const code = error.code || error.cause?.code || "";
  if ([
    "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "EPIPE",
    "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_SOCKET",
  ].includes(code)) return true;
  if (error.name === "TimeoutError") return true;
  const msg = String(error.message || "").toLowerCase();
  return msg.includes("fetch failed") || msg.includes("terminated") || msg.includes("socket hang up");
}

function normalizedRetries(retries) {
  const value = Number(retries);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_RETRIES;
  return Math.floor(value);
}

function normalizedPositiveNumber(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return number;
}

function fullJitterDelay(attempt, { backoffMs, backoffCapMs, random }) {
  const ceiling = Math.min(backoffCapMs, backoffMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

function rateLimitWaitMs(response, waitCapMs) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, waitCapMs);
  }
  if (response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    if (Number.isFinite(reset)) {
      const waitMs = reset * 1000 - Date.now();
      if (waitMs > 0) return Math.min(waitMs, waitCapMs);
    }
    return Math.min(60000, waitCapMs);
  }
  return 0;
}

function initWithTimeout(init, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return { ...init };
  return { ...init, signal: AbortSignal.timeout(timeoutMs) };
}

export async function fetchWithRetry(url, init = {}, {
  logger,
  label = String(url),
  retries = DEFAULT_RETRIES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  backoffMs = DEFAULT_BACKOFF_MS,
  backoffCapMs = DEFAULT_BACKOFF_CAP_MS,
  rateLimitWaitCapMs = DEFAULT_RATE_LIMIT_WAIT_CAP_MS,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
  random = Math.random,
} = {}) {
  const maxAttempts = normalizedRetries(retries) + 1;
  const effectiveTimeoutMs = timeoutMs == null ? 0 : Number(timeoutMs);
  const effectiveBackoffMs = normalizedPositiveNumber(backoffMs, DEFAULT_BACKOFF_MS);
  const effectiveBackoffCapMs = normalizedPositiveNumber(backoffCapMs, DEFAULT_BACKOFF_CAP_MS);
  const effectiveRateLimitWaitCapMs = normalizedPositiveNumber(rateLimitWaitCapMs, DEFAULT_RATE_LIMIT_WAIT_CAP_MS);
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, initWithTimeout(init, effectiveTimeoutMs));
      if (response.status === 403 || response.status === 429) {
        const waitMs = rateLimitWaitMs(response, effectiveRateLimitWaitCapMs);
        if (waitMs > 0 && attempt < maxAttempts - 1) {
          logger?.warn?.(`rate limited ${label}: waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1})`);
          await sleep(waitMs);
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === maxAttempts - 1) throw error;
      const delay = fullJitterDelay(attempt, {
        backoffMs: effectiveBackoffMs,
        backoffCapMs: effectiveBackoffCapMs,
        random,
      });
      logger?.warn?.(`transient fetch ${label} (${error.code || error.name || error.message}); retry ${attempt + 1}/${maxAttempts - 1} in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}
