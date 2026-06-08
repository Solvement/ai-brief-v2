import { test } from "node:test";
import assert from "node:assert";
import { fetchWithRetry } from "../lib/http.mjs";

const mkResponse = (status, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (key) => headers[key.toLowerCase()] ?? null },
});

const fetchFailed = () => {
  const error = new TypeError("fetch failed");
  error.cause = { code: "ECONNRESET" };
  return error;
};

const silent = { warn: () => {} };
const noSleep = async () => {};

test("returns a successful response without retrying", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return mkResponse(200);
  };

  const response = await fetchWithRetry("https://x", {}, { fetchImpl, logger: silent, sleep: noSleep });

  assert.equal(response.status, 200);
  assert.equal(calls, 1);
});

test("retries a transient network error then returns the eventual success", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls < 3) throw fetchFailed();
    return mkResponse(200);
  };

  const response = await fetchWithRetry("https://x", {}, {
    fetchImpl,
    logger: silent,
    sleep: noSleep,
    random: () => 0,
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
});

test("does not retry a non-transient error", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new TypeError("invalid URL");
  };

  await assert.rejects(
    () => fetchWithRetry("https://x", {}, { fetchImpl, logger: silent, sleep: noSleep }),
    /invalid URL/,
  );
  assert.equal(calls, 1);
});

test("caps retries at 4 default attempts then rethrows the transient error", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw fetchFailed();
  };

  await assert.rejects(
    () => fetchWithRetry("https://x", {}, {
      fetchImpl,
      logger: silent,
      sleep: noSleep,
      random: () => 0,
    }),
    /fetch failed/,
  );
  assert.equal(calls, 4);
});

test("times out a hung request", async () => {
  let calls = 0;
  let sawSignal = false;
  const fetchImpl = async (_url, init) => {
    calls += 1;
    sawSignal = Boolean(init.signal);
    return new Promise((_resolve, reject) => {
      if (init.signal.aborted) {
        reject(init.signal.reason);
        return;
      }
      init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true });
    });
  };

  await assert.rejects(
    () => fetchWithRetry("https://x", {}, {
      fetchImpl,
      logger: silent,
      retries: 0,
      timeoutMs: 1,
    }),
    (error) => error?.name === "TimeoutError",
  );
  assert.equal(calls, 1);
  assert.equal(sawSignal, true);
});
