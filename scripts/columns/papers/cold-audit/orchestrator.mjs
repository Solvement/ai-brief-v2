#!/usr/bin/env node
// Cold-audit orchestrator for the papers deep-read quality gate.
//
// 铁律 (CLAUDE.md + memory cold-audit-deepread-gate / multi-agent-doctrine):
//   generator ≠ critic, AND specifically CROSS-MODEL.
//   - 作者 (author)  = codex (GPT-5.5, effort high) reading the FULL source.
//   - 冷审 (auditor) = Claude in a FRESH context, NO generation history.
//   Self-audit (same agent judging its own work) is meaningless and FORBIDDEN.
//
// 流程 (per docs/superpowers/specs/cold-audit-prompt.md):
//   author(codex) → cold-audit(Claude two-stage) → revise loop, ≤ 3 rounds.
//   pass  → mark ready-to-publish (status file).
//   hold  → 3 rounds still has a MAJOR gap → HOLD + alert, do NOT publish, keep best-so-far.
//
// 红线 (CLAUDE.md): 「禁未过审内容自动落库/上线」. This orchestrator NEVER publishes;
// it only writes a `ready-to-publish` status file. Wiring publish to that status is the
// caller's job (after the async human review surface). Daily cap N guards the quota.
//
// SEAMS: `authorFn` and `auditFn` are injectable so the loop/gate/hold logic is unit-testable
// WITHOUT real CLIs. Real implementations (`codexAuthorFn`, `claudeAuditFn`) shell out; mock
// implementations (`makeMockAuthorFn`, `makeMockAuditFn`) drive the tests.

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");

// ---- constants -------------------------------------------------------------

export const MAX_ROUNDS = 3;
export const DEFAULT_DAILY_CAP = 3;
const DEFAULT_AUDIT_ROOT = path.join(ROOT, "logs", "papers-cold-audit");

// The 5 「透彻」criteria (cold-audit-prompt.md §「透彻」). The auditor scores each;
// any `major` gap on any criterion blocks publication.
export const CRITERIA = ["retellable", "faithful", "mechanism", "concrete", "judgment"];

// ---- pure gate logic (no I/O, fully unit-testable) -------------------------

/**
 * Does this diagnosis contain at least one MAJOR gap?
 * MAJOR = misleads the reader, or the reader cannot understand/retell a core element.
 * Minor (nice-to-have) gaps never block.
 */
export function hasMajorGap(diagnosis) {
  if (!diagnosis || typeof diagnosis !== "object") return true; // malformed audit = treat as blocking
  const perCriterion = Array.isArray(diagnosis.perCriterion) ? diagnosis.perCriterion : [];
  return perCriterion.some((entry) => entry && entry.severity === "major");
}

/**
 * Normalize an auditor verdict into the orchestrator's loop decision.
 * Single source of truth: a MAJOR gap is the real gate, regardless of the auditor's self-labeled
 * verdict string — this keeps the gate honest even if the auditor mis-labels.
 *   pass   → no major gap.
 *   revise → has a major gap and round < MAX_ROUNDS.
 *   hold   → has a major gap and round === MAX_ROUNDS (exhausted).
 */
export function decideOutcome(diagnosis, round, maxRounds = MAX_ROUNDS) {
  const major = hasMajorGap(diagnosis);
  if (!major) return "pass";
  if (round >= maxRounds) return "hold";
  return "revise";
}

/** Collect the actionable fixes the auditor wants the author to apply next round. */
export function collectFixes(diagnosis) {
  if (!diagnosis || typeof diagnosis !== "object") return [];
  const perCriterion = Array.isArray(diagnosis.perCriterion) ? diagnosis.perCriterion : [];
  const fixes = perCriterion
    .filter((entry) => entry && entry.severity === "major" && entry.fix)
    .map((entry) => `[${entry.criterion}] ${entry.gap || ""} → ${entry.fix}`);
  // The spec also allows a top-level `fixes` array; merge it in.
  if (Array.isArray(diagnosis.fixes)) fixes.push(...diagnosis.fixes.map(String));
  return [...new Set(fixes)].filter(Boolean);
}

// ---- the loop: author → cold-audit → revise, ≤ 3 rounds --------------------

/**
 * Run the cross-model gate for ONE paper.
 *
 * @param {object} paper                  paper descriptor (arxivId, title, sourceUrl, contentDir, ...).
 * @param {object} deps
 * @param {function} deps.authorFn        (paper, { round, fixes, prevArtifact }) => Promise<artifact>.
 *                                        round 1 authors from scratch; round >1 revises using `fixes`.
 * @param {function} deps.auditFn         (artifact, source, { round, paper }) => Promise<diagnosis>.
 *                                        FRESH-context cross-model auditor. Returns the structured
 *                                        diagnosis JSON {stageA, stageB, perCriterion[], verdict}.
 * @param {function} [deps.loadSource]    (paper) => Promise<source>. Loads full text + repo for Stage B.
 *                                        Defaults to a no-op (auditFn may load the source itself).
 * @param {number} [deps.maxRounds]
 * @param {function} [deps.logger]
 * @returns {Promise<{status, rounds, finalDiagnosis, artifact, history}>}
 *          status ∈ { ready_to_publish, hold }.
 */
export async function runColdAuditGate(paper, deps = {}) {
  const {
    authorFn,
    auditFn,
    loadSource = async () => null,
    maxRounds = MAX_ROUNDS,
    logger = console,
  } = deps;
  if (typeof authorFn !== "function") throw new Error("runColdAuditGate: authorFn is required");
  if (typeof auditFn !== "function") throw new Error("runColdAuditGate: auditFn is required");

  const history = [];
  const source = await loadSource(paper);
  let artifact = null;
  let fixes = [];
  let finalDiagnosis = null;

  for (let round = 1; round <= maxRounds; round += 1) {
    // 1. author step (codex): author from scratch (round 1) or revise per fixes (round >1).
    artifact = await authorFn(paper, { round, fixes, prevArtifact: artifact });

    // 2. cold-audit step (Claude, fresh context, cross-model). Two-stage per the spec.
    const diagnosis = await auditFn(artifact, source, { round, paper });
    finalDiagnosis = diagnosis;

    // 3. gate.
    const outcome = decideOutcome(diagnosis, round, maxRounds);
    history.push({ round, outcome, verdict: diagnosis?.verdict ?? null, diagnosis });
    logger.log?.(`[cold-audit] ${paper.arxivId || paper.id || "?"} round ${round}: ${outcome}`);

    if (outcome === "pass") {
      return { status: "ready_to_publish", rounds: round, finalDiagnosis, artifact, history };
    }
    if (outcome === "hold") {
      return { status: "hold", rounds: round, finalDiagnosis, artifact, history };
    }
    // revise: feed the major-gap fixes back to the author and loop.
    fixes = collectFixes(diagnosis);
  }

  // Loop fell through (maxRounds reached without pass). Treat as hold (best-so-far retained).
  return { status: "hold", rounds: maxRounds, finalDiagnosis, artifact, history };
}

// ---- batch orchestration: daily cap + status/alert files + digest ----------

/**
 * Run the gate across a batch of papers, honoring the daily cap, then persist:
 *   - per-paper status file (ready-to-publish vs hold) under auditRoot/<id>/status.json
 *   - an alert file + best-effort desktop notification on each HOLD
 *   - a markdown review digest listing pass / hold / needs-human
 *
 * @param {object[]} papers
 * @param {object} deps   same as runColdAuditGate, plus:
 * @param {number} [deps.dailyCap=3]
 * @param {string} [deps.auditRoot]
 * @param {function} [deps.notify]   (alert) => Promise<void>. Defaults to desktopNotify (PowerShell msg).
 * @param {function} [deps.now]      () => Date, for deterministic tests.
 * @returns {Promise<{ generatedAt, dailyCap, processed, skipped, results, digestPath }>}
 */
export async function runBatch(papers = [], deps = {}) {
  const {
    dailyCap = DEFAULT_DAILY_CAP,
    auditRoot = DEFAULT_AUDIT_ROOT,
    notify = desktopNotify,
    now = () => new Date(),
    logger = console,
    writeFiles = true,
  } = deps;

  const cap = Math.max(0, Math.floor(Number.isFinite(dailyCap) ? dailyCap : DEFAULT_DAILY_CAP));
  const toProcess = papers.slice(0, cap);
  const skipped = papers.slice(cap).map((p) => paperId(p));
  const results = [];

  for (const paper of toProcess) {
    const gate = await runColdAuditGate(paper, deps);
    const id = paperId(paper);
    const itemDir = path.join(auditRoot, slugify(id));
    const status = {
      paperId: id,
      title: paper.title || "",
      status: gate.status, // ready_to_publish | hold
      rounds: gate.rounds,
      generatedAt: now().toISOString(),
      finalVerdict: gate.finalDiagnosis?.verdict ?? null,
      majorGaps: majorGapSummary(gate.finalDiagnosis),
      history: gate.history.map((h) => ({ round: h.round, outcome: h.outcome, verdict: h.verdict })),
    };

    if (writeFiles) {
      await mkdir(itemDir, { recursive: true });
      await writeJson(path.join(itemDir, "status.json"), status);
      await writeJson(path.join(itemDir, "diagnosis.json"), gate.finalDiagnosis ?? {});
    }

    if (gate.status === "hold") {
      const alert = {
        kind: "cold-audit-hold",
        paperId: id,
        title: paper.title || "",
        rounds: gate.rounds,
        majorGaps: status.majorGaps,
        message: `深读冷审 HOLD（${gate.rounds} 轮仍有重大缺口，未发布，保留 best-so-far）: ${id}`,
        generatedAt: status.generatedAt,
      };
      if (writeFiles) await writeJson(path.join(itemDir, "alert.json"), alert);
      // best-effort desktop notification; never let a notifier failure break the gate.
      try {
        await notify(alert);
      } catch (error) {
        logger.warn?.(`[cold-audit] desktop notify failed (non-fatal): ${error.message}`);
      }
    }

    results.push({ ...status, statusDir: itemDir });
  }

  const digest = buildDigest({ results, skipped, dailyCap: cap, totalCandidates: papers.length, now });
  const digestPath = path.join(auditRoot, `digest-${now().toISOString().slice(0, 10)}.md`);
  if (writeFiles) {
    await mkdir(auditRoot, { recursive: true });
    await writeFile(digestPath, digest, "utf8");
  }

  return {
    generatedAt: now().toISOString(),
    dailyCap: cap,
    processed: results.length,
    skipped,
    results,
    digest,
    digestPath: writeFiles ? digestPath : null,
  };
}

function majorGapSummary(diagnosis) {
  if (!diagnosis || !Array.isArray(diagnosis.perCriterion)) return [];
  return diagnosis.perCriterion
    .filter((entry) => entry && entry.severity === "major")
    .map((entry) => ({ criterion: entry.criterion, gap: entry.gap || "" }));
}

/** Build the async review digest (markdown). Lists pass / hold / needs-human. */
export function buildDigest({ results = [], skipped = [], dailyCap, totalCandidates, now = () => new Date() }) {
  const date = now().toISOString().slice(0, 10);
  const passed = results.filter((r) => r.status === "ready_to_publish");
  const held = results.filter((r) => r.status === "hold");
  const lines = [];
  lines.push(`# 论文深读冷审复盘 ${date}`);
  lines.push("");
  lines.push(
    `候选 ${totalCandidates} · 日上限 ${dailyCap} · 处理 ${results.length} · 跳过(超上限) ${skipped.length}`,
  );
  lines.push("");
  lines.push(`## 过审待发布 (ready-to-publish) — ${passed.length}`);
  if (passed.length === 0) lines.push("- (无)");
  for (const r of passed) lines.push(`- ${r.paperId} · ${r.title} · ${r.rounds} 轮`);
  lines.push("");
  lines.push(`## 扣下需人工 (HOLD / needs-human) — ${held.length}`);
  if (held.length === 0) lines.push("- (无)");
  for (const r of held) {
    lines.push(`- ${r.paperId} · ${r.title} · ${r.rounds} 轮仍有重大缺口`);
    for (const g of r.majorGaps || []) lines.push(`  - [${g.criterion}] ${g.gap}`);
  }
  lines.push("");
  if (skipped.length) {
    lines.push(`## 超日上限跳过 (next run) — ${skipped.length}`);
    for (const id of skipped) lines.push(`- ${id}`);
    lines.push("");
  }
  lines.push("> 红线: 过审仅写 ready-to-publish 状态，发布由调用方在人工复盘面之后接线。HOLD 永不发布。");
  lines.push("");
  return lines.join("\n");
}

// ===========================================================================
// REAL implementations (shell out to the CLIs). DO NOT run in tests.
// The PM must verify these command strings before wiring (see README.md).
// ===========================================================================

/**
 * REAL author seam: shell out to codex (GPT-5.5, effort high) to author/revise the deep-read.
 * Mirrors scripts/columns/papers/codex-deepdive.mjs runCodexExec conventions.
 *
 * INTENDED COMMAND (Windows, sandbox broken → bypass per deploy-update-flow memory):
 *   codex exec -c model_reasoning_effort="high" -m gpt-5.5 \
 *     --dangerously-bypass-approvals-and-sandbox -C <ROOT> --color never \
 *     --output-last-message <out> -
 *   (prompt piped on stdin; round>1 prompt embeds the auditor `fixes`.)
 *
 * Returns the parsed artifact (the deep-read payload the auditor will read).
 */
export function makeCodexAuthorFn(config = {}) {
  const {
    model = "gpt-5.5",
    reasoningEffort = "high",
    codexBin = "codex",
    timeoutMs = 30 * 60 * 1000,
    buildPrompt, // (paper, { round, fixes, prevArtifact }) => string. REQUIRED for live use.
    cwd = ROOT,
    logger = console,
  } = config;

  return async function codexAuthorFn(paper, { round = 1, fixes = [], prevArtifact = null } = {}) {
    if (typeof buildPrompt !== "function") {
      throw new Error("makeCodexAuthorFn: buildPrompt(paper,{round,fixes,prevArtifact}) is required for live runs");
    }
    const prompt = buildPrompt(paper, { round, fixes, prevArtifact });
    const outDir = path.join(DEFAULT_AUDIT_ROOT, slugify(paperId(paper)), `round-${round}`);
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, "codex-last-message.json");

    const resolved = resolveCodexCommand({ codexBin });
    const codexArgs = [
      "exec",
      "-c",
      `model_reasoning_effort="${reasoningEffort}"`,
      "-m",
      model,
      // Windows OS sandbox is broken on Kevin's machine (deploy-update-flow memory) → must bypass.
      "--dangerously-bypass-approvals-and-sandbox",
      "-C",
      cwd,
      "--color",
      "never",
      "--output-last-message",
      outPath,
      "-",
    ];
    const args = [...resolved.argsPrefix, ...codexArgs];
    logger.log?.(`[cold-audit] author(codex) round ${round}: ${resolved.command} ${args.join(" ")}`);

    const result = await spawnWithInput(resolved.command, args, prompt, { cwd, timeoutMs });
    if (result.code !== 0) {
      throw new Error(`codex author exited ${result.code}: ${lastLines(result.stderr || result.stdout, 8)}`);
    }
    const raw = await readFile(outPath, "utf8");
    return parseJsonLoose(raw);
  };
}

/**
 * REAL auditor seam: shell out to Claude in a FRESH context (cross-model, no generation history)
 * to run the two-stage cold audit. This is the heart of generator ≠ critic.
 *
 * INTENDED COMMAND (headless, JSON-only output):
 *   claude -p "<two-stage cold-audit prompt>" --output-format json
 *   (Stage A: blind retell seeing ONLY the artifact; Stage B: open-book faithfulness diff vs
 *    full text + repo. Returns the per-criterion diagnosis JSON. See docs/.../cold-audit-prompt.md.)
 *
 * The prompt MUST: (a) forbid reusing any author context, (b) gate Stage B behind Stage A so the
 * blind retell is honest, (c) demand strict JSON matching the diagnosis schema below.
 *
 * Returns: { stageA, stageB, perCriterion:[{criterion,severity,gap,fix}], verdict }.
 */
export function makeClaudeAuditFn(config = {}) {
  const {
    claudeBin = "claude",
    timeoutMs = 20 * 60 * 1000,
    buildAuditPrompt, // (artifact, source, { round, paper }) => string. REQUIRED for live use.
    cwd = ROOT,
    logger = console,
  } = config;

  return async function claudeAuditFn(artifact, source, ctx = {}) {
    if (typeof buildAuditPrompt !== "function") {
      throw new Error("makeClaudeAuditFn: buildAuditPrompt(artifact,source,ctx) is required for live runs");
    }
    const prompt = buildAuditPrompt(artifact, source, ctx);
    // -p = headless print mode; --output-format json wraps the result for reliable parsing.
    const args = ["-p", prompt, "--output-format", "json"];
    logger.log?.(`[cold-audit] auditor(claude) round ${ctx.round ?? "?"}: ${claudeBin} -p <prompt> --output-format json`);

    const result = await spawnWithInput(claudeBin, args, "", { cwd, timeoutMs });
    if (result.code !== 0) {
      throw new Error(`claude audit exited ${result.code}: ${lastLines(result.stderr || result.stdout, 8)}`);
    }
    // `claude --output-format json` emits an envelope { result: "<text>", ... }. The auditor's
    // text is itself JSON (the diagnosis). Unwrap both layers defensively.
    const envelope = parseJsonLoose(result.stdout);
    const inner = typeof envelope?.result === "string" ? parseJsonLoose(envelope.result) : envelope;
    return normalizeDiagnosis(inner);
  };
}

/** Coerce a raw auditor payload into the canonical diagnosis shape used by the gate. */
export function normalizeDiagnosis(raw = {}) {
  const perCriterionIn = Array.isArray(raw.perCriterion) ? raw.perCriterion : [];
  const byCriterion = new Map(perCriterionIn.map((e) => [e?.criterion, e]));
  // Ensure every criterion is represented (missing = treated as none/no-gap, but surfaced).
  const perCriterion = CRITERIA.map((criterion) => {
    const e = byCriterion.get(criterion) || {};
    const severity = e.severity === "major" || e.severity === "minor" ? e.severity : "none";
    return { criterion, severity, gap: e.gap || "", fix: e.fix || "" };
  });
  // Also keep any extra criteria the auditor invented (defensive).
  for (const e of perCriterionIn) {
    if (e && e.criterion && !CRITERIA.includes(e.criterion)) {
      const severity = e.severity === "major" || e.severity === "minor" ? e.severity : "none";
      perCriterion.push({ criterion: e.criterion, severity, gap: e.gap || "", fix: e.fix || "" });
    }
  }
  return {
    stageA: raw.stageA ?? null,
    stageB: raw.stageB ?? null,
    perCriterion,
    fixes: Array.isArray(raw.fixes) ? raw.fixes : [],
    verdict: raw.verdict ?? null,
  };
}

// ===========================================================================
// MOCK implementations (for unit tests; no CLIs touched).
// ===========================================================================

/**
 * Mock author. Each call returns a deterministic artifact tagged with the round and the fixes it
 * "applied". Drive behavior via a scripted list or a function.
 *   makeMockAuthorFn({ artifacts: [a1, a2, a3] })  — returns artifacts[round-1].
 *   makeMockAuthorFn({ author: (paper, ctx) => artifact })
 */
export function makeMockAuthorFn(config = {}) {
  const calls = [];
  const fn = async (paper, ctx) => {
    calls.push({ paper, ctx });
    if (typeof config.author === "function") return config.author(paper, ctx);
    const artifacts = config.artifacts || [];
    const artifact = artifacts[ctx.round - 1] ?? artifacts[artifacts.length - 1] ?? {
      arxivId: paper.arxivId,
      round: ctx.round,
      appliedFixes: ctx.fixes || [],
    };
    return { ...artifact, _round: ctx.round, _appliedFixes: ctx.fixes || [] };
  };
  fn.calls = calls;
  return fn;
}

/**
 * Mock auditor. Returns a scripted diagnosis per round so tests can drive pass/revise/hold.
 *   makeMockAuditFn({ diagnoses: [d1, d2, d3] }) — returns diagnoses[round-1].
 *   makeMockAuditFn({ audit: (artifact, source, ctx) => diagnosis })
 * Convenience helpers `passDiagnosis()` / `majorDiagnosis()` / `minorDiagnosis()` build shapes.
 */
export function makeMockAuditFn(config = {}) {
  const calls = [];
  const fn = async (artifact, source, ctx) => {
    calls.push({ artifact, source, ctx });
    if (typeof config.audit === "function") return normalizeDiagnosis(config.audit(artifact, source, ctx));
    const diagnoses = config.diagnoses || [];
    const d = diagnoses[ctx.round - 1] ?? diagnoses[diagnoses.length - 1] ?? passDiagnosis();
    return normalizeDiagnosis(d);
  };
  fn.calls = calls;
  return fn;
}

export function passDiagnosis() {
  return {
    stageA: { retell: "ok", confusions: [] },
    stageB: { faithful: true },
    perCriterion: CRITERIA.map((criterion) => ({ criterion, severity: "none", gap: "", fix: "" })),
    verdict: "pass",
  };
}

export function majorDiagnosis(criterion = "faithful", gap = "fabricated number", fix = "remove it") {
  return {
    stageA: { retell: "partial", confusions: [gap] },
    stageB: { faithful: false },
    perCriterion: CRITERIA.map((c) => ({
      criterion: c,
      severity: c === criterion ? "major" : "none",
      gap: c === criterion ? gap : "",
      fix: c === criterion ? fix : "",
    })),
    verdict: "revise",
  };
}

export function minorDiagnosis(criterion = "concrete", gap = "could add one more example", fix = "nice-to-have") {
  return {
    stageA: { retell: "ok", confusions: [] },
    stageB: { faithful: true },
    perCriterion: CRITERIA.map((c) => ({
      criterion: c,
      severity: c === criterion ? "minor" : "none",
      gap: c === criterion ? gap : "",
      fix: c === criterion ? fix : "",
    })),
    verdict: "pass",
  };
}

// ---- desktop notification (best-effort, PowerShell `msg`) ------------------

/** Best-effort Windows desktop alert. Wrapped by the caller in try/catch; never throws upward. */
export async function desktopNotify(alert) {
  const text = String(alert?.message || "cold-audit HOLD").slice(0, 250);
  if (process.platform !== "win32") {
    // Non-Windows: log only. (msg.exe is Windows-only.)
    console.warn?.(`[cold-audit][alert] ${text}`);
    return;
  }
  // `msg * <text>` shows a message box to the logged-in session. Short timeout so it can't hang.
  await new Promise((resolve) => {
    const child = spawn("msg", ["*", text], { windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => {
      child.kill();
      resolve();
    }, 5000);
    child.on("error", () => {
      clearTimeout(timer);
      resolve();
    });
    child.on("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

// ---- shared helpers --------------------------------------------------------

function spawnWithInput(command, args, input, { cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`process timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

function resolveCodexCommand({ codexBin = "codex" } = {}) {
  if (codexBin && codexBin !== "codex") return { command: codexBin, argsPrefix: [] };
  if (process.platform !== "win32") return { command: codexBin, argsPrefix: [] };
  const npmRoot = process.env.APPDATA ? path.join(process.env.APPDATA, "npm") : "";
  const codexJs = npmRoot ? path.join(npmRoot, "node_modules", "@openai", "codex", "bin", "codex.js") : "";
  if (codexJs) return { command: process.execPath, argsPrefix: [codexJs] };
  return { command: codexBin, argsPrefix: [] };
}

function parseJsonLoose(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    // tolerate fenced ```json blocks or surrounding prose: grab the outermost {...}.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new Error(`could not parse JSON from output (first 200 chars): ${raw.slice(0, 200)}`);
  }
}

function paperId(paper = {}) {
  return paper.arxivId || paper.arxiv_id || paper.id || slugify(paper.title || "paper");
}

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

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function lastLines(value, count) {
  return String(value || "")
    .trim()
    .split(/\r?\n/)
    .slice(-count)
    .join("\n");
}

// ---- CLI entry (live wiring is the PM's job; default run is a no-op guard) --

function printUsage() {
  console.log(`Cold-audit orchestrator (papers deep-read quality gate)

This module is LIBRARY-FIRST. It exports:
  runColdAuditGate(paper, { authorFn, auditFn, ... })  — one-paper author→audit→revise loop
  runBatch(papers, { authorFn, auditFn, dailyCap, ... })— batch + cap + status/alert/digest
  makeCodexAuthorFn(config)   — REAL author seam (codex GPT-5.5 high)
  makeClaudeAuditFn(config)   — REAL auditor seam (claude -p, fresh cross-model context)
  makeMockAuthorFn / makeMockAuditFn — for tests

The real author/auditor need a buildPrompt / buildAuditPrompt wired by the PM.
See README.md for the exact CLI command strings and what to wire before going live.
Run tests: node --test scripts/columns/papers/cold-audit/orchestrator.test.mjs
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  printUsage();
}
