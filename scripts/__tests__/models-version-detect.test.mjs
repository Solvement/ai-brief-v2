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
    releaseNamePattern: "\\bClaude\\s+(?:[A-Za-z]+\\s+)?[0-9](?:\\.[0-9]+)?(?![0-9])|\\b(?:Opus|Sonnet|Haiku|Fable|Mythos)\\s+[0-9](?:\\.[0-9]+)?(?![0-9])",
  });
  assert.equal(out.name, "Claude Opus 4.8");
});

test("Claude pattern catches new brand words (Fable 5) but not year digits (Claude 2026)", () => {
  const pattern = "\\bClaude\\s+(?:[A-Za-z]+\\s+)?[0-9](?:\\.[0-9]+)?(?![0-9])|\\b(?:Opus|Sonnet|Haiku|Fable|Mythos)\\s+[0-9](?:\\.[0-9]+)?(?![0-9])";
  const hit = detectLatestClosedRelease("Introducing Claude Fable 5, our most capable model.", {
    name: "Claude", releaseNamePattern: pattern,
  });
  assert.match(hit.name, /Fable 5/);
  const miss = detectLatestClosedRelease("the Claude 2026 roadmap and Claude 2025 retrospective", {
    name: "Claude", releaseNamePattern: pattern,
  });
  assert.equal(miss.source, "official-changelog-fallback"); // year digits are NOT a version
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

test("OpenAI pattern ignores minified JS-asset names that look like o-series models", () => {
  // 2026-06-09 bug: the old "o[0-9][A-Za-z0-9.-]*" matched "O5jmM3eTioFPvNvL6Bx" / "o9z4drghg2r.css"
  // scraped from openai.com bundle filenames as if they were a model version.
  const pattern = "\\bGPT[-\\s]?[0-9](?:\\.[0-9]+)?[a-z]?(?![A-Za-z0-9])|\\bo[0-9]{1,2}(?:[-\\s](?:mini|pro|preview))?(?:\\.[0-9]+)?\\b(?![A-Za-z0-9])";
  const junk = "assets O5jmM3eTioFPvNvL6Bx o9z4drghg2r.css O2f42XPnm bundle";
  const out = detectLatestClosedRelease(junk, { name: "OpenAI GPT", releaseNamePattern: pattern });
  assert.equal(out.name, "OpenAI GPT"); // no false model match -> fallback to registry name
});

test("OpenAI pattern still matches real GPT and o-series names, highest wins", () => {
  const pattern = "\\bGPT[-\\s]?[0-9](?:\\.[0-9]+)?[a-z]?(?![A-Za-z0-9])|\\bo[0-9]{1,2}(?:[-\\s](?:mini|pro|preview))?(?:\\.[0-9]+)?\\b(?![A-Za-z0-9])";
  const text = "We shipped o3-mini and o4. The flagship is GPT-5.5; GPT-5.2 is older. GPT-4o lives on.";
  const out = detectLatestClosedRelease(text, { name: "OpenAI GPT", releaseNamePattern: pattern });
  assert.match(out.name, /GPT-5\.5/);
});

test("releaseVersionKey tie-breaks same version by flagship tier (Pro/Opus > Nano/Flash)", () => {
  assert.ok(releaseVersionKey("Gemini 3.5 Pro") > releaseVersionKey("Gemini 3.5 Nano"));
  assert.ok(releaseVersionKey("Gemini 3.5") > releaseVersionKey("Gemini 3.5 Nano"));
  // tier bonus is sub-version: a higher numeric version always beats a lower one regardless of tier.
  assert.ok(releaseVersionKey("Gemini 3.5 Nano") > releaseVersionKey("Gemini 3.4 Pro"));
});

test("detectLatestClosedRelease prefers flagship tier at equal version (no DOM-order luck)", () => {
  const pattern = "\\bGemini[\\s-]*[0-9](?:\\.[0-9]+)?(?:[\\s-]*(?:Pro|Flash-Lite|Flash|Ultra|Nano))?(?![0-9])";
  const text = "Gemini 3.5 Nano ... Gemini 3.5 Flash ... Gemini 3.5 Pro";
  const out = detectLatestClosedRelease(text, { releaseNamePattern: pattern });
  assert.equal(out.name, "Gemini 3.5 Pro");
});

test("Gemini pattern does not crown date fragments as versions (the 'Gemini 29' bug)", () => {
  // 2026-06-10 bug: changelog list text "Gemini · 29 May ..." matched "Gemini 29" under
  // "[0-9][0-9.]*" and the numeric sort crowned it over the real flagship (29 > 3.5).
  const pattern = "\\bGemini[\\s-]*[0-9](?:\\.[0-9]+)?(?:[\\s-]*(?:Pro|Flash-Lite|Flash|Ultra|Nano))?(?![0-9])";
  const text = "Gemini 29 May 2026 update notes ... Gemini 3.5 Pro is the flagship ... Gemini 15 April";
  const out = detectLatestClosedRelease(text, { releaseNamePattern: pattern });
  assert.equal(out.name, "Gemini 3.5 Pro");
});
