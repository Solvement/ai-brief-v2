import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "./daily.mjs";

test("parseArgs enables projects v2 growth and optional HF source flags", () => {
  const options = parseArgs(["--growth-search-limit", "6", "--hf-source"]);

  assert.equal(options.growthSearchLimit, 6);
  assert.equal(options.hfSource, true);
});

test("parseArgs can disable GitHub growth blind-spot search", () => {
  const options = parseArgs(["--no-growth-search"]);
  assert.equal(options.growthSearchLimit, 0);
});
