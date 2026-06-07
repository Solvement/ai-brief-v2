import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRunOutcome, main } from "../daily.mjs";

test("evaluateRunOutcome reports strict and allow-partial outcomes", () => {
  assert.deepEqual(evaluateRunOutcome([
    { name: "news", status: "ok" },
    { name: "models", status: "ok" },
  ]), { failed: [], allFailed: false, shouldFail: false });

  assert.deepEqual(evaluateRunOutcome([
    { name: "news", status: "failed" },
    { name: "models", status: "ok" },
  ]), { failed: ["news"], allFailed: false, shouldFail: true });

  assert.deepEqual(evaluateRunOutcome([
    { name: "news", status: "failed" },
    { name: "models", status: "failed" },
  ]), { failed: ["news", "models"], allFailed: true, shouldFail: true });

  assert.deepEqual(evaluateRunOutcome([
    { name: "news", status: "failed" },
    { name: "models", status: "ok" },
  ], { allowPartial: true }), { failed: ["news"], allFailed: false, shouldFail: false });

  assert.deepEqual(evaluateRunOutcome([
    { name: "news", status: "failed" },
    { name: "models", status: "failed" },
  ], { allowPartial: true }), { failed: ["news", "models"], allFailed: true, shouldFail: true });
});

test("main rejects a single failed column in strict mode", async () => {
  await withCapturedConsole(async (output) => {
    const error = await catchError(() => main(["--only", "news"], {
      runners: {
        news: () => {
          throw new Error("boom");
        },
      },
    }));

    assert.ok(error);
    assert.match(error.message, /news/);
    assert.equal(error.results[0].name, "news");
    assert.equal(error.results[0].status, "failed");
    assert.deepEqual(output.error, ["daily: FAILED columns: news"]);
  });
});

test("main resolves when the selected column succeeds", async () => {
  await withCapturedConsole(async () => {
    const results = await main(["--only", "news"], {
      runners: {
        news: async () => ({ ok: true }),
      },
    });

    assert.equal(results[0].name, "news");
    assert.equal(results[0].status, "ok");
  });
});

test("main supports allow-partial for partial failures only", async () => {
  const runners = {
    news: async () => ({ ok: true }),
    papers: () => {
      throw new Error("boom");
    },
    kg: async () => ({ ok: true }),
    projects: async () => ({ ok: true }),
    models: async () => ({ ok: true }),
  };

  await withCapturedConsole(async (output) => {
    const results = await main(["--allow-partial"], { runners });
    assert.equal(results.find((result) => result.name === "papers").status, "failed");
    assert.deepEqual(output.error, []);
  });

  await withCapturedConsole(async (output) => {
    const error = await catchError(() => main([], { runners }));
    assert.ok(error);
    assert.match(error.message, /papers/);
    assert.equal(error.results.find((result) => result.name === "papers").status, "failed");
    assert.deepEqual(output.error, ["daily: FAILED columns: papers"]);
  });
});

async function catchError(fn) {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

async function withCapturedConsole(fn) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const output = {
    log: [],
    warn: [],
    error: [],
  };

  console.log = (...args) => output.log.push(args.join(" "));
  console.warn = (...args) => output.warn.push(args.join(" "));
  console.error = (...args) => output.error.push(args.join(" "));

  try {
    return await fn(output);
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}
