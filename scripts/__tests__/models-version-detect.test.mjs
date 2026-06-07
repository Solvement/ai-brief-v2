import test from "node:test";
import assert from "node:assert/strict";

import { detectLatestClosedRelease, releaseVersionKey } from "../columns/models/sources.mjs";

test("releaseVersionKey orders versions numerically (4.8 > 4.1 > 4, 4.10 > 4.9)", () => {
  assert.ok(releaseVersionKey("Claude Opus 4.8") > releaseVersionKey("Claude Opus 4.1"));
  assert.ok(releaseVersionKey("Claude Opus 4.1") > releaseVersionKey("Claude Opus 4"));
  assert.ok(releaseVersionKey("Claude Opus 4.10") > releaseVersionKey("Claude Opus 4.9"));
  assert.equal(releaseVersionKey("no version here"), -1);
});

test("detectLatestClosedRelease picks the highest version, not the first textual match", () => {
  // Mirrors the real bug: the changelog mentions an older version first.
  const text = "Claude Opus 4.1 (legacy) ... see Claude Opus 4.8 release ... also Claude Opus 4.7 ... Claude Sonnet 4.6";
  const out = detectLatestClosedRelease(text, {
    releaseNamePattern: "\\bClaude\\s+(?:Opus|Sonnet|Haiku)?\\s*[0-9.]+\\b",
  });
  assert.equal(out.name, "Claude Opus 4.8");
});

test("detectLatestClosedRelease handles Gemini ordering too", () => {
  const text = "Gemini 2.0 Flash is older. Gemini 3.0 Pro is the latest. Gemini 1.5 also exists.";
  const out = detectLatestClosedRelease(text, {});
  assert.match(out.name, /Gemini 3\.0/);
});

test("detectLatestClosedRelease falls back to model.name when no version is present", () => {
  const out = detectLatestClosedRelease("no recognizable model versions here", { name: "Some Model" });
  assert.equal(out.name, "Some Model");
});
