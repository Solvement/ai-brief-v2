#!/usr/bin/env node
// Ingest the self-improving / self-evolving agent lineage into the ledger as deep-read
// candidates (Kevin 2026-06-04). These foundational works never trend on HF daily, so we
// seed them by name. Read path stays HF/arXiv (deep-read fetches full text by id). Optional
// --awesome polls a maintained awesome-list README and extracts arxiv ids. Deterministic +
// idempotent (dedupe via ledger). See memory agent-focus-direction.
// Run: node scripts/columns/papers/lineage-seed.mjs [--awesome] [--limit N]

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readLedger, writeLedger, upsertSeen, isDone } from "./ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SEED_FILE = path.join(ROOT, "data", "papers", "lineage-seed.json");
const ARXIV_RE = /\b(\d{4}\.\d{4,5})\b/g;

function hasFlag(name) {
  return process.argv.includes(name);
}

async function loadSeeds() {
  const raw = JSON.parse(await readFile(SEED_FILE, "utf8"));
  return raw;
}

/** Best-effort: fetch awesome-list README(s) and extract arxiv ids. Network-guarded. */
async function pollAwesome(urls, limit) {
  const found = new Map(); // id -> title (title unknown from list → "")
  for (const url of urls) {
    // GitHub repo URL → raw README. Try common default branches.
    const repo = url.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    for (const branch of ["main", "master"]) {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/README.md`;
      try {
        const res = await fetch(rawUrl, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const text = await res.text();
        for (const m of text.matchAll(ARXIV_RE)) {
          if (!found.has(m[1])) found.set(m[1], "");
          if (limit && found.size >= limit) break;
        }
        console.log(`[lineage] awesome ${repo}@${branch}: +${found.size} arxiv ids so far`);
        break; // got this repo, don't try the other branch
      } catch (err) {
        // network/timeout → skip this source, keep deterministic seeds
        console.log(`[lineage] awesome ${repo}@${branch} skipped (${err.message})`);
      }
    }
  }
  return [...found.entries()].map(([arxiv_id, title]) => ({ arxiv_id, title, priority: 3, why: "awesome-list 脉络发现" }));
}

export async function main() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 && process.argv[limitArg + 1] ? Number(process.argv[limitArg + 1]) : undefined;

  const raw = await loadSeeds();
  let seeds = raw.seeds || [];
  if (hasFlag("--awesome")) {
    const fromList = await pollAwesome(raw.awesome_lists || [], limit);
    // named seeds win on title; awesome-only ids appended
    const named = new Set(seeds.map((s) => s.arxiv_id));
    seeds = [...seeds, ...fromList.filter((s) => !named.has(s.arxiv_id))];
  }

  const ledger = await readLedger();
  let added = 0;
  let already = 0;
  for (const seed of seeds) {
    if (!seed.arxiv_id) continue;
    const candidate = {
      arxiv_id: seed.arxiv_id,
      hf_paper_url: `https://huggingface.co/papers/${seed.arxiv_id}`,
      title: seed.title || "",
    };
    const { record, isNew } = upsertSeen(ledger, candidate, { date, source: "lineage" });
    if (isNew) {
      record.notes = seed.why || "self-improving-agent lineage seed";
      record.tags = ["agent", "self-improving-agent", "lineage-seed"];
      added += 1;
    } else {
      if (isDone(record)) already += 1;
      // ensure 'lineage' is recorded as a seen source even on reappearance
      const sources = new Set([...(record.all_seen_sources || []), "lineage"]);
      record.all_seen_sources = [...sources];
    }
  }

  await writeLedger(ledger);
  console.log(`[lineage] ${seeds.length} seeds processed → ${added} new candidates added · ${already} already deep-read (skipped) · ledger ${ledger.size} total`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`[lineage] FAILED: ${err.message}`);
    process.exitCode = 1;
  });
}
