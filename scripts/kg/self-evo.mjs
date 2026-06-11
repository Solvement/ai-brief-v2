#!/usr/bin/env node
// Loop C self-evolution scaffold: queue -> schema gate -> judge -> verify gate -> applied/review logs.
// This file is intentionally narrow: it does not run an open-ended agent and it never auto-applies
// red-line candidates. Model calls, when enabled, are single-shot and model-pinned.

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const QUEUE_FILE = path.join(ROOT, "data", "knowledge-graph", "self-evo-queue.jsonl");
const REVIEW_LOG = path.join(ROOT, "data", "knowledge-graph", "self-evo-review.jsonl");
const APPLIED_LOG = path.join(ROOT, "data", "knowledge-graph", "self-evo-applied.jsonl");
const VALID_APPLIES_TO = new Set(["harness", "memory", "writing", "eval", "paradigm", "pipeline", "frontend", "other"]);
const REQUIRED_FIELDS = ["source", "claim", "our_current", "proposed_change", "applies_to", "red_line", "evidence"];
const VERDICTS = new Set(["stronger", "weaker", "unclear"]);
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";
const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000;

export function validateCandidate(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ok: false, errors: ["candidate must be an object"] };
  }
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(candidate, field)) {
      errors.push(`missing ${field}`);
      continue;
    }
    if (field !== "red_line" && isBlank(candidate[field])) errors.push(`${field} empty`);
  }
  if (Object.hasOwn(candidate, "red_line") && typeof candidate.red_line !== "boolean") {
    errors.push("red_line must be boolean");
  }
  if (Object.hasOwn(candidate, "applies_to") && !VALID_APPLIES_TO.has(candidate.applies_to)) {
    errors.push(`unknown applies_to: ${candidate.applies_to}`);
  }
  return { ok: errors.length === 0, errors };
}

export async function judgeCandidate(candidate, { dryRun = false, model, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const valid = validateCandidate(candidate);
  if (!valid.ok) return { verdict: "unclear", reason: `invalid candidate: ${valid.errors.join("; ")}` };
  if (dryRun) return deterministicJudge(candidate);

  if (candidate.applies_to === "memory" && evidenceMentionsBenchmark(candidate.evidence)) {
    return judgeMemoryBenchmark(candidate, { timeoutMs });
  }

  return judgeWithClaude(candidate, { model: model || process.env.SELF_EVO_JUDGE_MODEL || DEFAULT_CLAUDE_MODEL, timeoutMs });
}

export async function applyCandidate(candidate, decision = {}, options = {}) {
  const mergedOptions = { ...decision, ...options };
  const {
    dryRun = false,
    simulateVerifyFail = false,
    reviewLog = REVIEW_LOG,
    appliedLog = APPLIED_LOG,
    verifyCommand = "npm",
    verifyArgs = ["run", "verify"],
    timeoutMs = 20 * 60 * 1000,
  } = mergedOptions;
  const verdict = normalizeVerdict(decision.verdict);
  const evidence = { verdict, reason: decision.reason || "", dry_run: Boolean(dryRun) };
  const valid = validateCandidate(candidate);
  if (!valid.ok) {
    await appendJsonl(reviewLog, reviewRecord(candidate, "invalid_candidate", { ...evidence, errors: valid.errors }));
    return { applied: false, status: "invalid_candidate", queued: false, evidence: { ...evidence, errors: valid.errors } };
  }

  if (candidate.red_line === true) {
    const record = reviewRecord(candidate, "queued_for_review", evidence);
    await appendJsonl(reviewLog, record);
    return { applied: false, status: "queued_for_review", queued: true, evidence };
  }

  if (verdict !== "stronger") {
    const status = verdict === "unclear" ? "queued_for_review" : "not_stronger";
    const queued = verdict === "unclear";
    await appendJsonl(reviewLog, reviewRecord(candidate, status, evidence));
    return { applied: false, status, queued, evidence };
  }

  if (simulateVerifyFail || candidate?._test_mutation?.kind === "poison-verify") {
    const verify = { ok: false, simulated: true, reason: "simulated verify failure / poison mutation blocked before apply" };
    await appendJsonl(reviewLog, reviewRecord(candidate, "verify_failed", { ...evidence, verify }));
    return { applied: false, status: "verify_failed", queued: false, evidence: { ...evidence, verify, rolled_back: true } };
  }

  const verify = dryRun
    ? { ok: true, simulated: true, command: "npm run verify" }
    : await runVerify({ command: verifyCommand, args: verifyArgs, timeoutMs });

  if (!verify.ok) {
    await appendJsonl(reviewLog, reviewRecord(candidate, "verify_failed", { ...evidence, verify }));
    return { applied: false, status: "verify_failed", queued: false, evidence: { ...evidence, verify, rolled_back: true } };
  }

  const applied = {
    applied_at: new Date().toISOString(),
    status: "applied",
    from: candidate.source,
    claim: candidate.claim,
    applies_to: candidate.applies_to,
    change: candidate.proposed_change,
    verify,
    evidence: {
      verdict,
      reason: decision.reason || "",
      source_evidence: candidate.evidence,
      dry_run: Boolean(dryRun),
    },
  };
  await appendJsonl(appliedLog, applied);
  return { applied: true, status: "applied", queued: false, evidence: { ...applied.evidence, verify } };
}

export async function consumeQueue({ queueFile = QUEUE_FILE, dryRun = false, limit = Infinity, reviewLog = REVIEW_LOG, appliedLog = APPLIED_LOG } = {}) {
  const records = await readJsonl(queueFile).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
  const results = [];
  for (const candidate of records.slice(0, limit)) {
    const validation = validateCandidate(candidate);
    if (!validation.ok) {
      results.push({
        source: candidate?.source || "",
        validation,
        apply: await applyCandidate(candidate, { verdict: "unclear", reason: "schema validation failed" }, { dryRun, reviewLog, appliedLog }),
      });
      continue;
    }
    const judgment = await judgeCandidate(candidate, { dryRun });
    const applied = await applyCandidate(candidate, judgment, { dryRun, reviewLog, appliedLog });
    results.push({ source: candidate.source, validation, judgment, apply: applied });
  }
  return results;
}

function deterministicJudge(candidate) {
  const text = `${candidate.claim}\n${candidate.our_current}\n${candidate.proposed_change}\n${formatEvidence(candidate.evidence)}`.toLowerCase();
  if (/skip verify|disable verify|relax bench|delete bench|remove benchmark|bypass|ignore errors/.test(text)) {
    return { verdict: "weaker", reason: "dry-run deterministic judge: weakens gates or benchmarks" };
  }
  if (/benchmark|recall|precision|mrr|verify gate|regression|rollback|audit|evidence|hybrid|stronger|improve|reduce/.test(text)) {
    return { verdict: "stronger", reason: "dry-run deterministic judge: contains measurable improvement/gate signal" };
  }
  return { verdict: "unclear", reason: "dry-run deterministic judge: no measurable superiority signal" };
}

async function judgeMemoryBenchmark(candidate, { timeoutMs }) {
  const structured = structuredBenchmarkEvidence(candidate.evidence);
  if (structured) {
    const verdict = compareStructuredBenchmark(structured);
    return verdict;
  }

  const bench = await spawnWithInput(process.execPath, [path.join(ROOT, "scripts", "kg", "bench-retrieval.mjs"), "hybrid"], "", { cwd: ROOT, timeoutMs });
  if (bench.code !== 0) {
    return { verdict: "unclear", reason: `recall-bench could not run: ${lastLines(bench.stderr || bench.stdout, 6)}` };
  }
  const metrics = parseBenchMetrics(bench.stdout);
  return {
    verdict: "unclear",
    reason: `recall-bench ran for current hybrid baseline (${formatMetrics(metrics)}), but candidate evidence lacks comparable before/after metrics`,
  };
}

async function judgeWithClaude(candidate, { model, timeoutMs }) {
  const prompt = [
    "You are the cheap critical judge for AI-Brief self-evolution candidates.",
    "Return only JSON: {\"verdict\":\"stronger|weaker|unclear\",\"reason\":\"short grounded reason\"}.",
    "Judge whether proposed_change is stronger than our_current for the applies_to dimension.",
    "Do not approve red-line changes merely because they sound useful; red-line application is handled by a separate gate.",
    "",
    JSON.stringify({
      source: candidate.source,
      claim: candidate.claim,
      our_current: candidate.our_current,
      proposed_change: candidate.proposed_change,
      applies_to: candidate.applies_to,
      red_line: candidate.red_line,
      evidence: candidate.evidence,
    }, null, 2),
  ].join("\n");
  try {
    const result = await spawnWithInput("claude", ["-p", "--output-format", "json", "--model", model], prompt, { cwd: ROOT, timeoutMs });
    if (result.code !== 0) return { verdict: "unclear", reason: `claude judge failed: ${lastLines(result.stderr || result.stdout, 6)}` };
    const text = extractClaudeText(result.stdout);
    const parsed = parseJsonObject(text);
    const verdict = normalizeVerdict(parsed?.verdict);
    return { verdict, reason: cleanReason(parsed?.reason) || `model returned ${verdict}` };
  } catch (error) {
    return { verdict: "unclear", reason: `judge unavailable: ${error.message}` };
  }
}

async function runVerify({ command, args, timeoutMs }) {
  const result = await spawnWithInput(command, args, "", { cwd: ROOT, timeoutMs });
  return {
    ok: result.code === 0,
    command: [command, ...args].join(" "),
    exit_code: result.code,
    stdout_tail: lastLines(result.stdout, 8),
    stderr_tail: lastLines(result.stderr, 8),
  };
}

function reviewRecord(candidate, status, evidence) {
  return {
    queued_at: new Date().toISOString(),
    status,
    from: candidate?.source || "",
    claim: candidate?.claim || "",
    applies_to: candidate?.applies_to || "",
    red_line: candidate?.red_line === true,
    change: candidate?.proposed_change || "",
    evidence,
  };
}

async function appendJsonl(file, record) {
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

async function readJsonl(file) {
  const raw = await readFile(file, "utf8");
  return raw.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${file}:${index + 1} invalid JSONL: ${error.message}`);
    }
  });
}

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
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`process timed out after ${timeoutMs}ms`));
      else resolve({ code, stdout, stderr });
    });
    child.stdin.end(input || "");
  });
}

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function evidenceMentionsBenchmark(evidence) {
  return /benchmark|bench|recall|precision|mrr|eval/i.test(formatEvidence(evidence));
}

function structuredBenchmarkEvidence(evidence) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return null;
  const b = evidence.benchmark || evidence.recall_bench || evidence.recallBench;
  if (!b || typeof b !== "object") return null;
  const before = b.before || b.our_current || b.current;
  const after = b.after || b.proposed || b.candidate;
  return before && after ? { before, after } : null;
}

function compareStructuredBenchmark({ before, after }) {
  const keys = ["precision", "precision_at_1", "recall", "recall_at_3", "mrr"];
  const deltas = keys.map((key) => Number(after[key] ?? 0) - Number(before[key] ?? 0)).filter((value) => Number.isFinite(value));
  if (!deltas.length) return { verdict: "unclear", reason: "benchmark evidence lacks comparable numeric metrics" };
  const anyBetter = deltas.some((delta) => delta > 0.0001);
  const anyWorse = deltas.some((delta) => delta < -0.0001);
  if (anyBetter && !anyWorse) return { verdict: "stronger", reason: "structured benchmark evidence improves without regressions" };
  if (anyWorse && !anyBetter) return { verdict: "weaker", reason: "structured benchmark evidence regresses" };
  return { verdict: "unclear", reason: "structured benchmark evidence is mixed" };
}

function parseBenchMetrics(text) {
  const out = {};
  const precision = /precision\(rank1\):\s*\d+\/\d+\s*=\s*([0-9.]+)/.exec(text);
  const recall = /recall@3:\s*\d+\/\d+\s*=\s*([0-9.]+)/.exec(text);
  const mrr = /MRR\(expect\):\s*([0-9.]+)/.exec(text);
  if (precision) out.precision_rank1 = Number(precision[1]);
  if (recall) out.recall_at_3 = Number(recall[1]);
  if (mrr) out.mrr = Number(mrr[1]);
  return out;
}

function formatMetrics(metrics) {
  const pairs = Object.entries(metrics || {});
  if (!pairs.length) return "metrics unavailable";
  return pairs.map(([key, value]) => `${key}=${Number(value).toFixed(3)}`).join(", ");
}

function normalizeVerdict(value) {
  return VERDICTS.has(value) ? value : "unclear";
}

function formatEvidence(evidence) {
  if (typeof evidence === "string") return evidence;
  return JSON.stringify(evidence ?? "");
}

function extractClaudeText(stdout) {
  try {
    const envelope = JSON.parse(String(stdout).trim());
    return typeof envelope?.result === "string" ? envelope.result : String(stdout);
  } catch {
    return String(stdout);
  }
}

function parseJsonObject(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function cleanReason(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 500);
}

function lastLines(text, count = 8) {
  return String(text || "").trim().split(/\r?\n/).filter(Boolean).slice(-count).join("\n");
}

function printUsage() {
  console.error("Usage: node scripts/kg/self-evo.mjs [--dry-run] [--limit N] [--queue FILE]");
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { dryRun: false, limit: Infinity, queueFile: QUEUE_FILE };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--limit") opts.limit = Number(argv[++i]);
    else if (arg.startsWith("--limit=")) opts.limit = Number(arg.slice("--limit=".length));
    else if (arg === "--queue") opts.queueFile = path.resolve(argv[++i]);
    else {
      printUsage();
      process.exit(2);
    }
  }
  const results = await consumeQueue(opts);
  console.log(JSON.stringify({ processed: results.length, dry_run: opts.dryRun, results }, null, 2));
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(`[self-evo] fatal: ${error.stack || error.message}`);
    process.exit(1);
  });
}
