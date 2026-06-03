import { judgeGroundedness, runStructuralQa } from "../../lib/qa-base.mjs";

const REQUIRED_FIELDS = [
  "id",
  "title",
  "leadJudgment",
  "originalReading",
  "analystNotes",
  "limitsAndFuture",
  "provenance",
  "verifiedAt",
];

const REQUIRED_ARRAY_FIELDS = [
  { path: "originalReading", nonEmpty: true },
];

const OPTIONAL_ARRAY_FIELDS = [
  "selection.convergence",
  "selection.track",
];

export async function qaGate(analysis, evidence, ctx = {}) {
  const options = ctx.options || {};
  const structural = runStructuralQa(analysis, {
    requiredFields: REQUIRED_FIELDS,
    requireSources: true,
    requireVerifiedAtForLatest: false,
  });
  const structuralFlags = [
    ...structural.flags,
    ...paperShapeFlags(analysis),
    ...reviewAuditFlags(analysis),
  ];
  const structuralPass = structuralFlags.length === 0;

  const grounded = await judgeGroundedness({
    analysis,
    evidence,
    enabled: process.env.AI_BRIEF_LLM_JUDGE === "1" && options.groundedQa !== false,
    chatJson: options.chatJson,
  });
  const flags = [
    ...structuralFlags,
    ...grounded.flags.map((flag) => ({ id: "groundedness", message: String(flag) })),
  ];
  const verdict = !structuralPass || grounded.verdict === "fail"
    ? "fail"
    : grounded.verdict === "warn"
      ? "warn"
      : "pass";
  const result = {
    structuralPass,
    groundedScore: grounded.groundedScore,
    flags,
    verdict,
  };

  const analysisId = resolveAnalysisId(analysis, ctx, options.db);
  if (options.db && analysisId) {
    options.db.upsertQaVerdict({
      analysisId,
      structuralPass: result.structuralPass,
      groundedScore: result.groundedScore,
      flags: result.flags,
      verdict: result.verdict,
    });
  }

  return result;
}

function reviewAuditFlags(analysis) {
  const audit = analysis?._reviewAudit;
  if (!audit) return [];
  const verdict = String(audit.verdict || "").trim().toLowerCase();
  if (verdict === "pass") return [];
  if (verdict === "revise") {
    return [{
      id: "reviewer-revision-open",
      path: "_reviewAudit",
      message: "independent reviewer still requested revision after analyze stage",
    }];
  }
  if (verdict === "downgrade") {
    return [{
      id: "reviewer-downgrade",
      path: "_reviewAudit",
      message: "independent reviewer downgraded this item out of deep publication",
    }];
  }
  return [{
    id: "reviewer-invalid",
    path: "_reviewAudit",
    message: "independent reviewer audit has an invalid verdict",
  }];
}

function paperShapeFlags(analysis) {
  const flags = [];
  for (const { path, nonEmpty } of REQUIRED_ARRAY_FIELDS) {
    const value = getPath(analysis, path);
    if (!Array.isArray(value)) {
      flags.push({ id: "array-field", path, message: `${path} must be an array` });
    } else if (nonEmpty && value.length === 0) {
      flags.push({ id: "array-field", path, message: `${path} must not be empty` });
    }
  }

  for (const path of OPTIONAL_ARRAY_FIELDS) {
    const value = getPath(analysis, path);
    if (value !== undefined && !Array.isArray(value)) {
      flags.push({ id: "array-field", path, message: `${path} must be an array` });
    }
  }

  for (const path of ["limitsAndFuture", "provenance"]) {
    const value = getPath(analysis, path);
    if (value !== undefined && (value === null || Array.isArray(value) || typeof value !== "object")) {
      flags.push({ id: "object-field", path, message: `${path} must be an object` });
    }
  }

  const sections = getPath(analysis, "originalReading");
  if (Array.isArray(sections)) {
    sections.forEach((section, index) => {
      for (const key of ["heading", "summary"]) {
        const path = `originalReading.${index}.${key}`;
        if (!isPresentString(section?.[key])) {
          flags.push({ id: "required-field", path, message: "required field missing" });
        }
      }
    });
  }

  if (!isPresentString(getPath(analysis, "analystNotes"))) {
    flags.push({ id: "required-field", path: "analystNotes", message: "required field missing" });
  }

  const replacementHits = collectStrings(analysis).filter(({ value }) => value.includes("\uFFFD"));
  if (replacementHits.length) {
    flags.push({
      id: "no-mojibake",
      paths: replacementHits.map((hit) => hit.path),
      message: "replacement character U+FFFD found",
    });
  }

  return flags;
}

function resolveAnalysisId(analysis, ctx, db) {
  const direct = analysis?._analysisId
    || ctx.analysisId
    || ctx.item?.analysisId
    || ctx.item?.analysis?._analysisId
    || ctx.item?.analysisRow?.id
    || ctx.item?.analysisRecord?.id;
  if (direct || !db?.listAnalyses) return direct;

  const candidateId = ctx.item?.candidate?.id || ctx.item?.candidateId || analysis?.id;
  if (!candidateId) return null;
  try {
    const rows = db.listAnalyses(candidateId);
    const matching = rows.find((row) => row.payload?.id === analysis?.id && row.payload?.verifiedAt === analysis?.verifiedAt);
    return matching?.id || rows[0]?.id || null;
  } catch {
    return null;
  }
}

function collectStrings(value, path = "$", out = []) {
  if (typeof value === "string") {
    out.push({ path, value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}.${index}`, out));
    return out;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectStrings(item, `${path}.${key}`, out));
  }
  return out;
}

function getPath(value, fieldPath) {
  return String(fieldPath).split(".").reduce((cursor, key) => {
    if (cursor == null) return undefined;
    return cursor[key];
  }, value);
}

function isPresentString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
