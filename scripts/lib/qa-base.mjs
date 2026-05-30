export const DEFAULT_SOURCE_KEYS = ["source", "sourceUrl", "sourceUrls", "sources", "provenance", "citations", "evidenceRefs"];
export const DEFAULT_VERIFIED_AT_KEYS = ["verifiedAt", "verified_at"];

const PLACEHOLDER_PATTERNS = [
  /\[\s*(?:placeholder|\u5360\u4f4d)\s*\]/iu,
  /\b(?:TODO|TBD|FIXME)\b/i,
  /\u5f85\u8865|\u6682\u7f3a|\u672a\u586b\u5199/u,
];

const MOJIBAKE_PATTERNS = [
  /[\u00c2\u00c3][\u0080-\u00bf]?/u,
  /\u00e2[\u0080-\u00bf]{1,2}/u,
  /\u00e5[\u0080-\u00bf]{1,2}/u,
  /\u00ef[\u0080-\u00bf]{1,2}/u,
];

const LATEST_CLAIM_PATTERN = /\b(?:latest|current|newest)\b|\u6700\u65b0|\u5f53\u524d|\u76ee\u524d/u;

export function runStructuralQa(payload, options = {}) {
  const checks = [];
  const requiredFields = options.requiredFields || [];
  const requireSources = options.requireSources || false;
  const claimsPath = options.claimsPath || null;
  const sourceKeys = options.sourceKeys || DEFAULT_SOURCE_KEYS;
  const requireVerifiedAtForLatest = options.requireVerifiedAtForLatest ?? true;
  const verifiedAtKeys = options.verifiedAtKeys || DEFAULT_VERIFIED_AT_KEYS;

  for (const fieldPath of requiredFields) {
    const value = getPath(payload, fieldPath);
    checks.push({
      id: "required-field",
      path: fieldPath,
      status: isPresent(value) ? "pass" : "fail",
      message: isPresent(value) ? "required field present" : "required field missing",
    });
  }

  const stringEntries = collectStrings(payload);
  const placeholderHits = stringEntries.filter(({ value }) => PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value)));
  checks.push({
    id: "no-placeholder",
    status: placeholderHits.length ? "fail" : "pass",
    message: placeholderHits.length ? "placeholder text found" : "no placeholder text found",
    paths: placeholderHits.map((hit) => hit.path),
  });

  const mojibakeHits = stringEntries.filter(({ value }) => MOJIBAKE_PATTERNS.some((pattern) => pattern.test(value)));
  checks.push({
    id: "no-mojibake",
    status: mojibakeHits.length ? "fail" : "pass",
    message: mojibakeHits.length ? "mojibake-like text found" : "no mojibake-like text found",
    paths: mojibakeHits.map((hit) => hit.path),
  });

  if (requireSources) {
    checks.push(...sourceChecks(payload, { claimsPath, sourceKeys }));
  }

  if (requireVerifiedAtForLatest) {
    const latestHits = stringEntries.filter(({ value }) => LATEST_CLAIM_PATTERN.test(value));
    const hasVerifiedAt = hasAnyKey(payload, verifiedAtKeys, isPresent);
    checks.push({
      id: "latest-claims-verified-at",
      status: latestHits.length && !hasVerifiedAt ? "fail" : "pass",
      message: latestHits.length && !hasVerifiedAt
        ? "latest/current claim requires verifiedAt"
        : "latest/current claims have verifiedAt or are absent",
      paths: latestHits.map((hit) => hit.path),
    });
  }

  const flags = checks
    .filter((check) => check.status !== "pass")
    .map((check) => ({
      id: check.id,
      path: check.path,
      paths: check.paths,
      message: check.message,
    }));

  return {
    structuralPass: flags.length === 0,
    verdict: flags.length === 0 ? "pass" : "fail",
    flags,
    checks,
  };
}

export async function judgeGroundedness({
  analysis,
  evidence,
  enabled = process.env.AI_BRIEF_LLM_JUDGE === "1",
  chatJson = null,
  model = process.env.QA_JUDGE_MODEL || process.env.PROJECT_LIGHT_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  maxTokens = 1200,
} = {}) {
  if (!enabled) {
    return {
      enabled: false,
      verdict: "skipped",
      groundedScore: null,
      flags: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const callChatJson = chatJson || (await import("./llm.mjs")).createDeepSeekClient().chatJson;
  const response = await callChatJson({
    model,
    maxTokens,
    system: "You are a strict groundedness judge. Return only JSON.",
    user: JSON.stringify({
      task: "Check whether every analysis claim is supported by evidence. Flag fabrication or missing provenance.",
      expectedJson: { verdict: "pass|warn|fail", groundedScore: "0..1", flags: ["string"] },
      evidence,
      analysis,
    }),
  });
  return normalizeGroundednessVerdict(response);
}

export function normalizeGroundednessVerdict(input) {
  const score = Number(input?.groundedScore ?? input?.grounded_score ?? 0);
  const flags = Array.isArray(input?.flags) ? input.flags.map((flag) => String(flag)).filter(Boolean) : [];
  const verdict = ["pass", "warn", "fail"].includes(input?.verdict) ? input.verdict : score >= 0.8 ? "pass" : score >= 0.6 ? "warn" : "fail";
  return {
    enabled: true,
    verdict,
    groundedScore: Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0)),
    flags,
    checkedAt: new Date().toISOString(),
  };
}

function sourceChecks(payload, { claimsPath, sourceKeys }) {
  if (claimsPath) {
    const claims = getPath(payload, claimsPath);
    if (!Array.isArray(claims)) {
      return [{
        id: "claims-sources",
        path: claimsPath,
        status: "fail",
        message: "claims path must be an array",
      }];
    }
    return claims.map((claim, index) => ({
      id: "claims-sources",
      path: `${claimsPath}.${index}`,
      status: hasAnyKey(claim, sourceKeys, isPresent) ? "pass" : "fail",
      message: hasAnyKey(claim, sourceKeys, isPresent) ? "claim has source/provenance" : "claim missing source/provenance",
    }));
  }

  return [{
    id: "sources-present",
    status: hasAnyKey(payload, sourceKeys, isPresent) ? "pass" : "fail",
    message: hasAnyKey(payload, sourceKeys, isPresent) ? "source/provenance present" : "source/provenance missing",
  }];
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

function hasAnyKey(value, keys, predicate) {
  if (!value || typeof value !== "object") return false;
  return keys.some((key) => predicate(value[key]));
}

function isPresent(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
