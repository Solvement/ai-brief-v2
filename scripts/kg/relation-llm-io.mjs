// KG-3 relation LLM I/O — out-of-process judging glue.
//
// Why this exists: judging "how do two papers relate" is a comparative-reasoning
// task that wants a strong model, but routing it through `claude -p` shares the
// interactive subscription's 5h window → 429 contention → the build hangs.
// Instead we materialize the judgment OUT of the build: a strong model (codex
// gpt-5.5, separate quota) reads the candidate prompts and writes decisions to a
// file; the deterministic build replays those decisions through the SAME gates
// (evidence-must-be-verbatim, type∈taxonomy, use-required) with zero model calls.
//
// Candidate keys are derived identically in dump and apply (both call
// limitFacetCandidates over the same facets), so decisions line up by key.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { extractEdgesLLM } from "./relation-engine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FACETS = path.join(ROOT, "data", "knowledge-graph", "facets");

// Mirror integrate-kg.mjs loadFacets EXACTLY so candidate generation is identical
// between the dump pass and the build pass.
export async function loadFacets() {
  let files = [];
  try {
    files = (await readdir(FACETS)).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch {
    return [];
  }
  const facets = [];
  for (const file of files) {
    try {
      const facet = YAML.parse(await readFile(path.join(FACETS, file), "utf8"));
      if (facet && facet.status !== "reject") facets.push({ ...facet, _file: file });
    } catch {
      // skip unparseable facet; dump/build both skip the same one
    }
  }
  return facets;
}

export function candidateKey(candidate = {}) {
  return `${candidate.from_slug || candidate.from || ""}|${candidate.to_slug || candidate.to || ""}`;
}

// Capture every candidate prompt without producing edges (judge returns NO_EDGE).
export async function dumpCandidates(facets, { topK = 5, maxCandidates = 80 } = {}) {
  const records = [];
  const recordingJudge = (prompt, ctx = {}) => {
    records.push({ key: candidateKey(ctx.candidate), prompt });
    return { decision: "NO_EDGE", reason: "dump pass" };
  };
  await extractEdgesLLM(facets, { topK, maxCandidates, judge: recordingJudge });
  return records;
}

// Accept either [{key, decision}] or {key: decision}.
export function loadDecisionsMap(raw) {
  const map = new Map();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && item.key) map.set(item.key, item.decision || item);
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, decision] of Object.entries(raw)) map.set(key, decision);
  }
  return map;
}

// A judge that replays precomputed decisions; no model is called.
export function makeFileJudge(decisionsMap) {
  return (_prompt, ctx = {}) => {
    const decision = decisionsMap.get(candidateKey(ctx.candidate));
    return decision || { decision: "NO_EDGE", reason: "no precomputed decision" };
  };
}

export async function loadFileJudge(decisionsPath) {
  const raw = JSON.parse(await readFile(decisionsPath, "utf8"));
  return makeFileJudge(loadDecisionsMap(raw));
}
