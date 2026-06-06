#!/usr/bin/env node
// Daily entrypoint that wires the cold-audit gate into the papers deep-read flow.
//
// WHAT IT DOES (per Kevin's 2026-06-04 decision):
//   - Finds NEWLY-authored deep-reads that have NOT yet been cold-audited.
//   - Runs the cross-model author→cold-audit→revise gate (cap N=3 papers/day).
//   - PASS → marks the deep-read publishable (metadata.cold_audit.status = "ready_to_publish").
//   - FAIL → HOLD: marks it held + alerts; the held deep-read is NOT published.
//   - Existing already-published deep-reads are GRANDFATHERED (skipped, never audited).
//
// 红线: this script writes a STATUS only. It never git-commits/pushes and never deletes content.
// On PASS it flips metadata.cold_audit.status; whether that status gates build-index/publish is
// the PM's call (a one-line filter in build-index, wired separately).
//
// SELECTION (new-only, cap, skip-existing) is a PURE function `selectUnaudited(...)` so it's
// unit-tested with mocks. Real I/O (readdir/readFile) and the real CLIs sit behind injectable deps.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_DAILY_CAP,
  makeClaudeAuditFn,
  makeCodexAuthorFn,
  runBatch,
} from "./orchestrator.mjs";
import { buildPrompt, buildStageAPrompt, buildStageBPrompt, loadArtifact, loadSource } from "./seams.mjs";

// Local slug (mirror of orchestrator's, kept private here for the force-HOLD status dir path).
function slugify(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "paper"
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "papers");
const AUDIT_ROOT = path.join(ROOT, "logs", "papers-cold-audit");

// Cold-audit lifecycle states stored in metadata.cold_audit.status:
//   (absent)          = never audited.
//   "grandfathered"   = pre-gate deep-read, never to be audited (Kevin: do NOT retro-audit).
//   "ready_to_publish"= passed the gate.
//   "hold"            = failed the gate (3 rounds, major gap) — not published, alerted.
export const TERMINAL_STATES = new Set(["grandfathered", "ready_to_publish", "hold"]);

// ---------------------------------------------------------------------------
// PURE selection logic (new-only · cap · skip-existing) — unit-tested
// ---------------------------------------------------------------------------

/**
 * From a list of on-disk deep-read records, pick the ones that should be audited today.
 *
 * A deep-read is an audit candidate iff:
 *   - status === "deep_read" (it is an authored deep-read, not radar/light), AND
 *   - it has NO terminal cold_audit state (absent, or anything not in TERMINAL_STATES).
 * Everything with a terminal cold_audit state — including "grandfathered" — is SKIPPED.
 * The result is then capped at `dailyCap`; the overflow is returned separately (next run).
 *
 * @param {object[]} deepReads  [{ slug, contentDir, metadata }]
 * @param {object}  [opts]      { dailyCap }
 * @returns {{ selected, skippedGrandfathered, skippedAudited, skippedNonDeep, overflow }}
 */
export function selectUnaudited(deepReads = [], opts = {}) {
  const dailyCap = clampCap(opts.dailyCap ?? DEFAULT_DAILY_CAP);
  const selected = [];
  const skippedGrandfathered = [];
  const skippedAudited = [];
  const skippedNonDeep = [];

  for (const rec of deepReads) {
    const meta = rec?.metadata || {};
    if (meta.status !== "deep_read") {
      skippedNonDeep.push(rec.slug);
      continue;
    }
    const state = meta.cold_audit?.status;
    if (state === "grandfathered") {
      skippedGrandfathered.push(rec.slug);
      continue;
    }
    if (TERMINAL_STATES.has(state)) {
      // already ready_to_publish or hold → don't re-audit.
      skippedAudited.push(rec.slug);
      continue;
    }
    // absent / unknown → new & unaudited.
    selected.push(rec);
  }

  const capped = selected.slice(0, dailyCap);
  const overflow = selected.slice(dailyCap).map((r) => r.slug);
  return {
    selected: capped,
    overflow,
    skippedGrandfathered,
    skippedAudited,
    skippedNonDeep,
  };
}

function clampCap(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_CAP;
}

// ---------------------------------------------------------------------------
// scan the corpus → records the selector understands
// ---------------------------------------------------------------------------

/**
 * Read every content/papers/<slug>/metadata.json into a record. Injectable I/O for tests.
 * @param {object} [deps] { readdirFn, readFileFn, contentDir }
 */
export async function scanDeepReads(deps = {}) {
  const contentDir = deps.contentDir || CONTENT_DIR;
  const readdirFn = deps.readdirFn || ((p, o) => readdir(p, o));
  const readFileFn = deps.readFileFn || ((p, e) => readFile(p, e));

  let dirents = [];
  try {
    dirents = (await readdirFn(contentDir, { withFileTypes: true })).filter((d) => d.isDirectory());
  } catch {
    return [];
  }

  const records = [];
  for (const d of dirents) {
    const slug = d.name;
    const dir = path.join(contentDir, slug);
    let metadata = {};
    try {
      metadata = JSON.parse(await readFileFn(path.join(dir, "metadata.json"), "utf8"));
    } catch {
      continue; // no/invalid metadata → not an auditable deep-read.
    }
    records.push({ slug, contentDir: dir, metadata });
  }
  return records;
}

// ---------------------------------------------------------------------------
// map a selected record → the orchestrator's `paper` descriptor
// ---------------------------------------------------------------------------

export function recordToPaper(rec = {}) {
  const m = rec.metadata || {};
  return {
    arxivId: m.arxiv_id || m.paper_id || rec.slug,
    title: m.title || rec.slug,
    sourceUrl: m.huggingface_url || m.paper_url || "",
    paperUrl: m.paper_url || "",
    pdfUrl: m.pdf_url || "",
    codeUrl: m.code_url || "",
    contentDir: rec.contentDir,
    slug: rec.slug,
  };
}

// ---------------------------------------------------------------------------
// mark the deep-read's metadata with the gate outcome (status only; never publishes)
// ---------------------------------------------------------------------------

/**
 * Persist the gate result back into the deep-read's metadata.json.
 * PASS → cold_audit.status="ready_to_publish"; HOLD → "hold". Idempotent + injectable for tests.
 */
export async function markOutcome(rec, gateResult, deps = {}) {
  const readFileFn = deps.readFileFn || ((p, e) => readFile(p, e));
  const writeFileFn = deps.writeFileFn || ((p, data) => writeFile(p, data, "utf8"));
  const now = deps.now || (() => new Date());
  const metaPath = path.join(rec.contentDir, "metadata.json");

  let meta;
  try {
    meta = JSON.parse(await readFileFn(metaPath, "utf8"));
  } catch {
    meta = { ...(rec.metadata || {}) };
  }

  meta.cold_audit = {
    status: gateResult.status, // ready_to_publish | hold
    rounds: gateResult.rounds,
    audited_at: now().toISOString(),
    auditor: "claude-cold-audit",
    author: "codex-gpt-5.5-high",
    final_verdict: gateResult.finalDiagnosis?.verdict ?? null,
    major_gaps: majorGaps(gateResult.finalDiagnosis),
  };

  await writeFileFn(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}

function majorGaps(diagnosis) {
  if (!diagnosis || !Array.isArray(diagnosis.perCriterion)) return [];
  return diagnosis.perCriterion
    .filter((e) => e && e.severity === "major")
    .map((e) => ({ criterion: e.criterion, gap: e.gap || "" }));
}

// ---------------------------------------------------------------------------
// one-time grandfather seeding (so existing 10 deep-reads are NEVER audited)
// ---------------------------------------------------------------------------

/**
 * Mark every existing un-audited deep-read as grandfathered (run ONCE before going live).
 * This is how Kevin's "do NOT retro-audit existing deep-reads" is enforced: after seeding, only
 * deep-reads authored AFTER this point (no cold_audit field) are picked up by selectUnaudited.
 */
export async function grandfatherExisting(deps = {}) {
  const records = await scanDeepReads(deps);
  const writeFileFn = deps.writeFileFn || ((p, data) => writeFile(p, data, "utf8"));
  const now = deps.now || (() => new Date());
  const marked = [];
  for (const rec of records) {
    const m = rec.metadata || {};
    if (m.status !== "deep_read") continue;
    if (m.cold_audit?.status) continue; // already has a state — leave it.
    m.cold_audit = { status: "grandfathered", audited_at: now().toISOString(), note: "pre-gate deep-read; not retro-audited" };
    await writeFileFn(path.join(rec.contentDir, "metadata.json"), `${JSON.stringify(m, null, 2)}\n`);
    marked.push(rec.slug);
  }
  return marked;
}

// ---------------------------------------------------------------------------
// the daily run
// ---------------------------------------------------------------------------

/**
 * Run the daily cold-audit gate.
 *
 * Injectable deps make the whole thing testable without CLIs/network:
 *   - scan        : () => Promise<records[]>                 (default: scanDeepReads)
 *   - loadArtifactFn : (contentDir) => Promise<artifact>     (default: seams.loadArtifact)
 *   - loadSourceFn   : (paper) => Promise<source>            (default: seams.loadSource)
 *   - authorFn / auditFn : the gate seams                    (default: real codex/claude CLIs)
 *   - markFn      : (rec, gateResult) => Promise<void>       (default: markOutcome)
 *   - dailyCap, now, writeFiles, notify, logger
 *
 * @returns {{ generatedAt, dailyCap, selected, batch, overflow, grandfathered, audited }}
 */
export async function runDaily(deps = {}) {
  const {
    dailyCap = DEFAULT_DAILY_CAP,
    now = () => new Date(),
    logger = console,
    writeFiles = true,
    auditRoot = AUDIT_ROOT,
    notify,
  } = deps;

  const records = deps.scan ? await deps.scan() : await scanDeepReads(deps);
  const selection = selectUnaudited(records, { dailyCap });
  const { selected, overflow, skippedGrandfathered, skippedAudited } = selection;

  logger.log?.(
    `[cold-audit:daily] candidates ${records.length} · new&unaudited ${selected.length + overflow.length}` +
      ` · processing ${selected.length} (cap ${dailyCap}) · grandfathered ${skippedGrandfathered.length}` +
      ` · already-audited ${skippedAudited.length}`,
  );

  if (selected.length === 0) {
    return { generatedAt: now().toISOString(), dailyCap, selected: [], batch: null, ...selection };
  }

  const loadArtifactFn = deps.loadArtifactFn || ((contentDir) => loadArtifact(contentDir));
  const loadSourceFn = deps.loadSourceFn || ((paper) => loadSource(paper));
  const markFn = deps.markFn || ((rec, gate) => markOutcome(rec, gate, deps));

  // Resolve the gate seams: default to the REAL cross-model CLIs (codex author / claude auditor),
  // each wired with our prompt builders. Tests inject mock authorFn/auditFn instead.
  const authorFn = deps.authorFn || makeCodexAuthorFn({ buildPrompt: (paper, ctx) => buildPrompt(paper, ctx), logger });
  const auditFn =
    deps.auditFn || makeClaudeAuditFn({ buildStageAPrompt, buildStageBPrompt, logger });

  const recBySlug = new Map(selected.map((r) => [r.slug, r]));
  const papers = selected.map(recordToPaper);

  // 红线 (Fix #4): the auditor must audit the ON-DISK artifact, NEVER a possibly-thin in-memory
  // author handle. We PRE-LOAD each paper's artifact up front. A load failure is NOT recoverable by
  // falling back to the author handle (that would audit thin content and could wrongly PASS) — it
  // BLOCKS: the paper is force-HELD + alerted, and never enters the gate at all.
  const auditPapers = [];
  const preloaded = new Map(); // slug → loaded on-disk artifact
  const loadFailed = []; // [{ rec, paper, error }]
  for (const paper of papers) {
    const rec = recBySlug.get(paper.slug);
    try {
      const artifact = await loadArtifactFn(rec.contentDir);
      preloaded.set(paper.slug, artifact);
      auditPapers.push(paper);
    } catch (error) {
      logger.warn?.(`[cold-audit:daily] artifact load FAILED for ${paper.slug} → HOLD (not audited): ${error.message}`);
      loadFailed.push({ rec, paper, error });
    }
  }

  const batch = await runBatch(auditPapers, {
    authorFn,
    // The auditor ALWAYS reads the pre-loaded on-disk artifact (Stage A source of truth). No
    // fallback to the author handle: if it isn't on disk, the paper was force-held above.
    auditFn: async (artifact, source, ctx) => {
      const toAudit = preloaded.get(ctx?.paper?.slug) ?? artifact;
      return auditFn(toAudit, source, ctx);
    },
    loadSource: loadSourceFn,
    dailyCap,
    auditRoot,
    writeFiles,
    now,
    logger,
    ...(notify ? { notify } : {}),
  });

  // Force-HOLD every load-failure paper: persist status/alert + fire the alert, mirroring runBatch's
  // HOLD path. These never reached the gate, so we synthesize a clear "artifact load failure" gap.
  const loadHeldResults = [];
  for (const { rec, paper, error } of loadFailed) {
    const id = recordToPaper(rec).arxivId;
    const gen = now().toISOString();
    const majorGaps = [{ criterion: "artifact", gap: `深读产物无法从磁盘读取(${error.message})` }];
    const status = {
      paperId: id,
      title: paper.title || "",
      status: "hold",
      rounds: 0,
      generatedAt: gen,
      finalVerdict: "hold",
      majorGaps,
      history: [],
      reason: "artifact_load_failure",
    };
    const alert = {
      kind: "cold-audit-hold",
      paperId: id,
      title: paper.title || "",
      rounds: 0,
      majorGaps,
      message: `深读冷审 HOLD(产物无法读取,未送审,未发布): ${id}`,
      generatedAt: gen,
    };
    if (writeFiles) {
      const itemDir = path.join(auditRoot, slugify(id));
      await mkdir(itemDir, { recursive: true });
      await writeFile(path.join(itemDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
      await writeFile(path.join(itemDir, "alert.json"), `${JSON.stringify(alert, null, 2)}\n`, "utf8");
    }
    try {
      if (notify) await notify(alert);
    } catch (e) {
      logger.warn?.(`[cold-audit:daily] notify failed for load-hold ${id} (non-fatal): ${e.message}`);
    }
    batch.results.push({ ...status });
    loadHeldResults.push(status);
  }

  // Mark each processed paper's metadata with the outcome (status only; never publishes content).
  const audited = [];
  for (const result of batch.results) {
    const rec = selected.find((r) => recordToPaper(r).arxivId === result.paperId);
    if (!rec) continue;
    const gateResult = {
      status: result.status === "ready_to_publish" ? "ready_to_publish" : "hold",
      rounds: result.rounds,
      finalDiagnosis: { perCriterion: (result.majorGaps || []).map((g) => ({ ...g, severity: "major" })), verdict: result.finalVerdict },
    };
    if (writeFiles) await markFn(rec, gateResult);
    audited.push({ slug: rec.slug, paperId: result.paperId, status: gateResult.status, rounds: result.rounds });
  }

  return {
    generatedAt: now().toISOString(),
    dailyCap,
    selected: selected.map((r) => r.slug),
    overflow,
    skippedGrandfathered,
    skippedAudited,
    batch,
    audited,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv = []) {
  const opts = { dailyCap: DEFAULT_DAILY_CAP };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--grandfather") opts.grandfather = true;
    else if (a === "--cap") opts.dailyCap = Number(argv[++i]);
    else if (a.startsWith("--cap=")) opts.dailyCap = Number(a.slice(6));
    else if (a === "--dry-run") opts.dryRun = true;
    else throw new Error(`Unexpected argument: ${a}`);
  }
  return opts;
}

function printUsage() {
  console.log(`Cold-audit daily runner — gates NEW paper deep-reads through author→cold-audit→revise.

Usage:
  node scripts/columns/papers/cold-audit/run-daily.mjs [--cap N] [--grandfather] [--dry-run]

Flags:
  --cap N        Daily cap on papers audited (default ${DEFAULT_DAILY_CAP}).
  --grandfather  One-time: mark every existing un-audited deep_read as grandfathered, then exit.
                 (Run ONCE before going live so the existing corpus is never retro-audited.)
  --dry-run      Scan + print the selection (new/cap/skip) WITHOUT running any CLI.

Selection: status=="deep_read" AND no terminal cold_audit state → audit (capped at N).
Grandfathered / ready_to_publish / hold → skipped. PASS flips metadata.cold_audit.status to
"ready_to_publish"; HOLD writes an alert and leaves the deep-read unpublished. Never git-pushes.`);
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) {
    printUsage();
    return null;
  }
  if (opts.grandfather) {
    const marked = await grandfatherExisting();
    console.log(`[cold-audit:daily] grandfathered ${marked.length} existing deep-read(s): ${marked.join(", ") || "(none)"}`);
    return { grandfathered: marked };
  }
  if (opts.dryRun) {
    const records = await scanDeepReads();
    const selection = selectUnaudited(records, { dailyCap: opts.dailyCap });
    console.log(`[cold-audit:daily] DRY-RUN cap ${opts.dailyCap}`);
    console.log(`  would audit (${selection.selected.length}): ${selection.selected.map((r) => r.slug).join(", ") || "(none)"}`);
    console.log(`  overflow (next run): ${selection.overflow.join(", ") || "(none)"}`);
    console.log(`  grandfathered (skip): ${selection.skippedGrandfathered.length}`);
    console.log(`  already-audited (skip): ${selection.skippedAudited.length}`);
    return selection;
  }
  return runDaily({ dailyCap: opts.dailyCap });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
