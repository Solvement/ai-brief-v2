import { test } from "node:test";
import assert from "node:assert";
import { fetchWithRetry, isTransientNetworkError } from "../columns/projects/sources.mjs";

const mkResponse = (status, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});
const fetchFailed = () => {
  const e = new TypeError("fetch failed");
  e.cause = { code: "ECONNRESET" };
  return e;
};
const silent = { warn: () => {} };

test("retries a transient network error then returns the eventual success", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls < 3) throw fetchFailed();
    return mkResponse(200);
  };
  const res = await fetchWithRetry("https://x", {}, { logger: silent, label: "t" });
  assert.equal(res.status, 200);
  assert.equal(calls, 3);
});

test("caps retries at 4 attempts then rethrows the transient error", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw fetchFailed(); };
  await assert.rejects(() => fetchWithRetry("https://x", {}, { logger: silent }), /fetch failed/);
  assert.equal(calls, 4);
});

test("does not retry a non-transient error", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new TypeError("invalid URL"); };
  await assert.rejects(() => fetchWithRetry("https://x", {}, { logger: silent }), /invalid URL/);
  assert.equal(calls, 1);
});

test("returns a 404 immediately without retrying (caller interprets non-ok)", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return mkResponse(404); };
  const res = await fetchWithRetry("https://x", {}, { logger: silent });
  assert.equal(res.status, 404);
  assert.equal(calls, 1);
});

test("classifies transient vs non-transient errors", () => {
  assert.equal(isTransientNetworkError(fetchFailed()), true);
  assert.equal(isTransientNetworkError({ name: "TimeoutError" }), true);
  assert.equal(isTransientNetworkError({ code: "ETIMEDOUT" }), true);
  assert.equal(isTransientNetworkError(new TypeError("invalid URL")), false);
  assert.equal(isTransientNetworkError(null), false);
});
