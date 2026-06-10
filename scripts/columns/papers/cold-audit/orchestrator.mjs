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
const ARXIV_DOWNGRADE_LABEL = "推断/待核";

// The 5 「透彻」criteria (cold-audit-prompt.md §「透彻」). The auditor scores each;
// any `major` gap on any criterion blocks publication.
export const CRITERIA = ["retellable", "faithful", "mechanism", "concrete", "judgment"];

// ---- pure gate logic (no I/O, fully unit-testable) -------------------------

/**
 * Is this auditor response UNTRUSTWORTHY (degenerate / malformed-but-parseable)?
 * A degenerate response cannot be trusted to clear the gate — we must NOT let it pass.
 * Untrustworthy iff ANY of:
 *   - not an object, OR
 *   - perCriterion is missing / not an array / EMPTY, OR
 *   - any of the 5 REQUIRED criteria is absent from perCriterion.
 * (A model that "passes" by returning {} or [] is a failure mode, not a pass.)
 */
export function isUntrustworthyDiagnosis(diagnosis) {
  if (!diagnosis || typeof diagnosis !== "object") return true;
  const perCriterion = Array.isArray(diagnosis.perCriterion) ? diagnosis.perCriterion : null;
  if (!perCriterion || perCriterion.length === 0) return true; // empty/missing perCriterion = can't trust
  const present = new Set(perCriterion.map((e) => e && e.criterion).filter(Boolean));
  // every one of the 5 required criteria must be explicitly present.
  return CRITERIA.some((c) => !present.has(c));
}

/**
 * Does this diagnosis BLOCK publication?
 * Blocks iff it is untrustworthy (degenerate audit → cannot trust → hold) OR it has a MAJOR gap.
 * MAJOR = misleads the reader, or the reader cannot understand/retell a core element.
 * Minor (nice-to-have) gaps never block.
 */
export function hasMajorGap(diagnosis) {
  // A degenerate/untrustworthy audit is treated as blocking — never let a malformed-but-parseable
  // response (empty perCriterion, missing required criteria) silently PASS the gate.
  if (isUntrustworthyDiagnosis(diagnosis)) return true;
  return diagnosis.perCriterion.some((entry) => entry && entry.severity === "major");
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

// ---- arXiv forward-reference verification ---------------------------------

export function extractArxivIdsFromArtifact(artifact) {
  const textParts = [];
  if (typeof artifact === "string") textParts.push(artifact);
  else if (artifact && typeof artifact === "object") {
    if (artifact.paperMdx) textParts.push(String(artifact.paperMdx));
    if (artifact.careerMdx) textParts.push(String(artifact.careerMdx));
    if (artifact.prose_markdown) textParts.push(String(artifact.prose_markdown));
    if (artifact.metadata && typeof artifact.metadata === "object") {
      textParts.push(
        [
          artifact.metadata.one_sentence_judgment,
          ...(Array.isArray(artifact.metadata.tags) ? artifact.metadata.tags : []),
          ...(Array.isArray(artifact.metadata.source_rankings) ? artifact.metadata.source_rankings : []),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }
  const text = textParts.join("\n");
  const ids = new Set();
  for (const match of text.matchAll(/\b(\d{4}\.\d{4,5})(v\d+)?\b/gi)) {
    ids.add(`${match[1]}${match[2] || ""}`);
  }
  return [...ids].sort();
}

export function localArxivIdSuspicion(arxivId, now = new Date()) {
  const match = /^(\d{2})(\d{2})\.(\d{4,5})(v\d+)?$/i.exec(String(arxivId || "").trim());
  if (!match) return { suspicious: true, reason: "format_invalid" };
  const year = 2000 + Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { suspicious: true, reason: "month_invalid" };
  if (year < 2007 || (year === 2007 && month < 4)) return { suspicious: true, reason: "before_modern_arxiv_id_format" };
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return { suspicious: true, reason: "future_arxiv_month" };
  }
  return { suspicious: false, reason: "" };
}

export async function defaultResolveArxivId(arxivId, { timeoutMs = 4000 } = {}) {
  if (typeof fetch !== "function" || typeof AbortController !== "function") {
    return { resolvable: null, reason: "network_unavailable" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const id = String(arxivId || "").replace(/v\d+$/i, "");
    const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "AI-Brief cold-audit arXiv reference verifier" },
    });
    if (!response.ok) return { resolvable: false, reason: `arxiv_api_http_${response.status}` };
    const body = await response.text();
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hasEntry = new RegExp(`<entry>[\\s\\S]*<id>https?://arxiv\\.org/abs/${escaped}(v\\d+)?</id>`, "i").test(body);
    return hasEntry ? { resolvable: true, reason: "" } : { resolvable: false, reason: "arxiv_api_no_entry" };
  } catch (error) {
    return { resolvable: null, reason: error?.name === "AbortError" ? "network_timeout" : "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

export async function auditArxivReferences(artifact, deps = {}) {
  const {
    now = () => new Date(),
    resolveArxivId = defaultResolveArxivId,
    logger = console,
  } = deps;
  const ids = extractArxivIdsFromArtifact(artifact);
  const checked = [];
  const unresolved = [];
  for (const id of ids) {
    const local = localArxivIdSuspicion(id, now());
    if (local.suspicious) {
      const item = {
        id,
        resolvable: false,
        reason: local.reason,
        downgradeLabel: ARXIV_DOWNGRADE_LABEL,
        downgradedCitation: `${id}（${ARXIV_DOWNGRADE_LABEL}: ${local.reason}）`,
      };
      checked.push(item);
      unresolved.push(item);
      continue;
    }
    let resolved = { resolvable: null, reason: "resolver_not_run" };
    try {
      resolved = await resolveArxivId(id, { now: now() });
    } catch (error) {
      resolved = { resolvable: null, reason: error?.message || "resolver_error" };
      logger.warn?.(`[cold-audit] arXiv resolver failed for ${id}: ${resolved.reason}`);
    }
    const item = {
      id,
      resolvable: resolved?.resolvable ?? null,
      reason: resolved?.reason || "",
      downgradeLabel: resolved?.resolvable === false ? ARXIV_DOWNGRADE_LABEL : "",
      downgradedCitation:
        resolved?.resolvable === false ? `${id}（${ARXIV_DOWNGRADE_LABEL}: ${resolved.reason || "unresolved"}）` : "",
    };
    checked.push(item);
    if (item.resolvable === false) unresolved.push(item);
  }
  return {
    checkedCount: checked.length,
    checked,
    unresolved,
    downgradeLabel: ARXIV_DOWNGRADE_LABEL,
  };
}

export function attachArxivCitationAudit(diagnosis, citationAudit) {
  if (!diagnosis || typeof diagnosis !== "object") return diagnosis;
  return {
    ...diagnosis,
    arxivCitationAudit: citationAudit || { checkedCount: 0, checked: [], unresolved: [], downgradeLabel: ARXIV_DOWNGRADE_LABEL },
  };
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
    const arxivCitationAudit = await auditArxivReferences(artifact, deps);
    finalDiagnosis = attachArxivCitationAudit(diagnosis, arxivCitationAudit);

    // 3. gate.
    const outcome = decideOutcome(finalDiagnosis, round, maxRounds);
    history.push({ round, outcome, verdict: finalDiagnosis?.verdict ?? null, diagnosis: finalDiagnosis });
    logger.log?.(`[cold-audit] ${paper.arxivId || paper.id || "?"} round ${round}: ${outcome}`);

    if (outcome === "pass") {
      return { status: "ready_to_publish", rounds: round, finalDiagnosis, artifact, history };
    }
    if (outcome === "hold") {
      return { status: "hold", rounds: round, finalDiagnosis, artifact, history };
    }
    // revise: feed the major-gap fixes back to the author and loop.
    fixes = collectFixes(finalDiagnosis);
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
    // PER-PAPER ISOLATION (2026-06-10): one paper's gate failure (e.g. an unparseable auditor
    // response) must not kill the rest of the batch — that exact crash left 0/3 audited and nothing
    // published on 2026-06-10. On error: record audit_error + alert, leave the paper's metadata
    // untouched (still needs_human, so the next daily run re-audits it), and move on.
    let gate;
    try {
      gate = await runColdAuditGate(paper, deps);
    } catch (error) {
      const errId = paperId(paper);
      logger.warn?.(`[cold-audit] ${errId}: gate crashed (${error.message?.slice(0, 160)}); isolating, continuing batch`);
      const errStatus = {
        paperId: errId,
        title: paper.title || "",
        status: "audit_error",
        rounds: 0,
        generatedAt: now().toISOString(),
        finalVerdict: null,
        majorGaps: [],
        error: String(error.message || error).slice(0, 500),
        history: [],
      };
      if (writeFiles) {
        const errDir = path.join(auditRoot, slugify(errId));
        await mkdir(errDir, { recursive: true });
        await writeJson(path.join(errDir, "status.json"), errStatus);
      }
      results.push(errStatus);
      try {
        await notify({ kind: "cold-audit-error", paperId: errId, title: paper.title || "", error: errStatus.error });
      } catch { /* notifier failure is non-fatal */ }
      continue;
    }
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
      arxivCitationAudit: gate.finalDiagnosis?.arxivCitationAudit || {
        checkedCount: 0,
        checked: [],
        unresolved: [],
        downgradeLabel: ARXIV_DOWNGRADE_LABEL,
      },
      unresolvedArxivReferences: gate.finalDiagnosis?.arxivCitationAudit?.unresolved || [],
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
        unresolvedArxivReferences: status.unresolvedArxivReferences,
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
  const withUnresolvedArxiv = results.filter((r) => (r.unresolvedArxivReferences || []).length > 0);
  lines.push("");
  lines.push(`## arXiv 引用待核 / 降级标注 — ${withUnresolvedArxiv.length}`);
  if (withUnresolvedArxiv.length === 0) lines.push("- (无)");
  for (const r of withUnresolvedArxiv) {
    lines.push(`- ${r.paperId} · ${r.title}`);
    for (const ref of r.unresolvedArxivReferences || []) {
      lines.push(`  - ${ref.downgradedCitation || `${ref.id}（${ARXIV_DOWNGRADE_LABEL}: ${ref.reason || "unresolved"}）`}`);
    }
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
    timeoutMs = Number(process.env.COLD_AUDIT_CODEX_TIMEOUT_MS) || 12 * 60 * 1000, // per codex call cap (was 30min; a single call must not hang the batch)
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
 * to run the cold audit. This is the heart of generator ≠ critic.
 *
 * "Blind" is enforced STRUCTURALLY via TWO SEPARATE claude calls (not one combined prompt):
 *   call 1 (Stage A): `buildStageAPrompt(artifact, ctx)` — artifact ONLY, NO source in the prompt
 *                     → the auditor physically cannot peek; returns { stageA }.
 *   call 2 (Stage B): `buildStageBPrompt(artifact, source, stageA, ctx)` — artifact + source + the
 *                     persisted stageA → open-book faithfulness diff; returns { stageB, perCriterion, verdict }.
 * The two are merged into the canonical diagnosis. See docs/.../cold-audit-prompt.md.
 *
 * INTENDED COMMAND (headless, JSON-only output, prompt piped on STDIN — NOT argv, because the
 * prompt embeds full-text and can reach ~180k chars which blows the Windows command-line limit):
 *   claude -p --output-format json   (prompt written to child.stdin)
 *
 * Each stage's prompt MUST: (a) forbid reusing any author context, (b) Stage A be source-free,
 * (c) demand strict JSON matching the diagnosis schema below.
 *
 * Returns: { stageA, stageB, perCriterion:[{criterion,severity,gap,fix}], verdict }.
 */
export function makeClaudeAuditFn(config = {}) {
  const {
    claudeBin = "claude",
    timeoutMs = Number(process.env.COLD_AUDIT_CLAUDE_TIMEOUT_MS) || 8 * 60 * 1000, // per claude-audit call cap (was 20min)
    // Two-call seam: Stage A (blind, source-free) then Stage B (open-book). Both REQUIRED for live use.
    buildStageAPrompt, // (artifact, ctx) => string
    buildStageBPrompt, // (artifact, source, stageA, ctx) => string
    cwd = ROOT,
    logger = console,
    // Injectable per-call runner (prompt, label, ctx) => Promise<parsed JSON>. Defaults to the real
    // stdin-piped claude spawn below; tests inject a fake to assert the two-call sequence without spend.
    runClaude,
  } = config;

  // One headless claude call: prompt is PIPED ON STDIN (never argv) so giant prompts start reliably
  // on Windows. `--output-format json` wraps the result for reliable parsing; we unwrap both layers.
  const callClaude = runClaude || (async function callClaude(prompt, label, ctx) {
    // -p with no positional prompt = headless print mode reading the prompt from stdin.
    const args = ["-p", "--output-format", "json"];
    // PARSE-RETRY (2026-06-10): the auditor hand-writes JSON; dense numeric notes occasionally break
    // it (unescaped quotes/truncation). 2026-06-10 chain run: one malformed stageB response threw
    // here and killed the WHOLE daily batch (0/3 audited). A malformed sample is usually transient —
    // re-sample once before giving up; the per-paper isolation in runBatch is the second net.
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      logger.log?.(`[cold-audit] auditor(claude) ${label} round ${ctx.round ?? "?"}${attempt > 1 ? ` (parse-retry ${attempt}/2)` : ""}: ${claudeBin} -p --output-format json (prompt on stdin)`);
      const result = await spawnWithInput(claudeBin, args, prompt, { cwd, timeoutMs });
      if (result.code !== 0) {
        throw new Error(`claude audit (${label}) exited ${result.code}: ${lastLines(result.stderr || result.stdout, 8)}`);
      }
      // `claude --output-format json` emits an envelope { result: "<text>", ... }; the auditor's text
      // is itself JSON. Unwrap both layers defensively.
      try {
        const envelope = parseJsonLoose(result.stdout);
        return typeof envelope?.result === "string" ? parseJsonLoose(envelope.result) : envelope;
      } catch (error) {
        lastError = error;
        logger.warn?.(`[cold-audit] auditor(claude) ${label}: unparseable JSON on attempt ${attempt}/2 (${error.message?.slice(0, 120)})`);
      }
    }
    throw lastError;
  });

  return async function claudeAuditFn(artifact, source, ctx = {}) {
    if (typeof buildStageAPrompt !== "function" || typeof buildStageBPrompt !== "function") {
      throw new Error("makeClaudeAuditFn: buildStageAPrompt and buildStageBPrompt are required for live runs");
    }
    // ---- call 1: Stage A (BLIND — no source in the prompt) ----
    const stageARaw = await callClaude(buildStageAPrompt(artifact, ctx), "stageA", ctx);
    const stageA = stageARaw?.stageA ?? stageARaw ?? null;

    // ---- call 2: Stage B (open-book — artifact + source + the committed stageA) ----
    const stageBRaw = await callClaude(buildStageBPrompt(artifact, source, stageA, ctx), "stageB", ctx);

    // Merge: Stage A owns stageA; Stage B owns the diff + perCriterion + verdict.
    return normalizeDiagnosis({ ...stageBRaw, stageA });
  };
}

/**
 * Coerce a raw auditor payload into the canonical diagnosis shape used by the gate.
 *
 * CRITICAL: we do NOT backfill missing criteria as severity:"none". Backfilling would hide a
 * degenerate response (e.g. the auditor returned {} or only 2 of 5 criteria) by manufacturing a
 * full, all-"none" perCriterion that the gate would read as "no major gap → pass". Instead we
 * preserve EXACTLY the criteria the auditor actually returned (normalized), so
 * isUntrustworthyDiagnosis() can detect missing required criteria and HOLD. A trustworthy auditor
 * is instructed (buildStageBPrompt) to always emit all 5.
 */
export function normalizeDiagnosis(raw = {}) {
  const perCriterionIn = Array.isArray(raw.perCriterion) ? raw.perCriterion : [];
  // Normalize only the entries the auditor actually provided — never invent missing ones.
  const perCriterion = perCriterionIn
    .filter((e) => e && e.criterion)
    .map((e) => {
      const severity = e.severity === "major" || e.severity === "minor" ? e.severity : "none";
      return { criterion: e.criterion, severity, gap: e.gap || "", fix: e.fix || "" };
    });
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
