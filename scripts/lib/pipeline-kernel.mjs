export const COLUMN_MODULE_STAGES = [
  "discover",
  "evidence",
  "evaluate",
  "select",
  "analyze",
  "qaGate",
  "publish",
  "archive",
];

export const REQUIRED_COLUMN_MODULE_METHODS = [
  "discover",
  "collectEvidence",
  "evaluate",
  "analyze",
  "qaGate",
];

export function assertColumnModule(module) {
  if (!module || typeof module !== "object") throw new Error("ColumnModule must be an object");
  if (!module.id || typeof module.id !== "string") throw new Error("ColumnModule.id must be a string");
  const missing = REQUIRED_COLUMN_MODULE_METHODS.filter((method) => typeof module[method] !== "function");
  if (missing.length) throw new Error(`ColumnModule ${module.id} missing method(s): ${missing.join(", ")}`);
  return module;
}

export function describeColumnModule(module) {
  assertColumnModule(module);
  return {
    id: module.id,
    stages: COLUMN_MODULE_STAGES.map((stage) => ({
      stage,
      implemented: stage === "select" ? typeof module.select === "function" : typeof module[stageMethod(stage)] === "function",
    })),
  };
}

export async function runColumnPipeline(module, options = {}) {
  assertColumnModule(module);
  const startedAt = options.now?.() || new Date().toISOString();
  const logger = options.logger || console;
  const runId = options.runId || `${module.id}-${startedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
  const ctx = {
    column: module.id,
    runId,
    startedAt,
    logger,
    options,
    state: options.state || {},
  };

  const result = {
    runId,
    column: module.id,
    startedAt,
    finishedAt: null,
    stages: [],
    candidates: [],
    evidence: [],
    evals: [],
    selected: [],
    analyses: [],
    qa: [],
    published: null,
    archived: null,
  };

  result.candidates = await runStage(result, "discover", () => asArray(module.discover(ctx)));

  result.evidence = await runStage(result, "evidence", () => mapLimit(
    result.candidates,
    stageConcurrency(options, "evidence"),
    async (candidate, index) => ({
      candidate,
      evidence: await module.collectEvidence(candidate, { ...ctx, stage: "evidence", index, candidate }),
    }),
  ));

  result.evals = await runStage(result, "evaluate", () => mapLimit(
    result.evidence,
    stageConcurrency(options, "evaluate"),
    async (item, index) => ({
      ...item,
      eval: await module.evaluate(item.candidate, item.evidence, { ...ctx, stage: "evaluate", index, item }),
    }),
  ));

  result.selected = await runStage(result, "select", async () => {
    if (typeof module.select === "function") {
      return asArray(await module.select(result.evals, { ...ctx, stage: "select" }));
    }
    return defaultSelect(result.evals, options.select || {});
  });

  result.analyses = await runStage(result, "analyze", () => mapLimit(
    result.selected,
    stageConcurrency(options, "analyze"),
    async (item, index) => ({
      ...item,
      analysis: await module.analyze(item, item.evidence, { ...ctx, stage: "analyze", index, item }),
    }),
  ));

  result.qa = await runStage(result, "qaGate", () => mapLimit(
    result.analyses,
    stageConcurrency(options, "qaGate"),
    async (item, index) => ({
      ...item,
      qa: await module.qaGate(item.analysis, item.evidence, { ...ctx, stage: "qaGate", index, item }),
    }),
  ));

  result.published = await runStage(result, "publish", async () => {
    if (typeof module.publish !== "function") return null;
    return module.publish(result.qa, { ...ctx, stage: "publish", result });
  });

  result.archived = await runStage(result, "archive", async () => {
    if (typeof module.archive !== "function") return null;
    return module.archive(result, { ...ctx, stage: "archive" });
  });

  result.finishedAt = options.now?.() || new Date().toISOString();
  return result;
}

export function defaultSelect(items, {
  threshold = null,
  topN = null,
  keepDecisions = ["select", "keep", "keep-all", "accept"],
  dropDecisions = ["reject", "drop", "skip", "fail"],
} = {}) {
  const normalized = asArray(items).filter((item) => {
    const decision = String(item?.eval?.decision || "").toLowerCase();
    if (dropDecisions.includes(decision)) return false;
    if (item?.eval?.mode === "coverage" || decision === "keep-all") return true;
    if (threshold !== null && Number(item?.eval?.score) < threshold) return false;
    return !decision || keepDecisions.includes(decision) || Number.isFinite(Number(item?.eval?.score));
  });

  const ranked = [...normalized].sort((a, b) => Number(b?.eval?.score ?? -Infinity) - Number(a?.eval?.score ?? -Infinity));
  return topN === null ? ranked : ranked.slice(0, topN);
}

export async function mapLimit(items, limit, fn) {
  const input = asArray(items);
  const concurrency = Math.max(1, Math.min(Number(limit) || 1, input.length || 1));
  const out = new Array(input.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= input.length) return;
      out[index] = await fn(input[index], index);
    }
  }));
  return out;
}

async function runStage(result, stage, fn) {
  const startedAt = new Date().toISOString();
  const record = { stage, status: "running", startedAt, finishedAt: null, count: null };
  result.stages.push(record);
  try {
    const value = await fn();
    record.status = "pass";
    record.count = Array.isArray(value) ? value.length : value == null ? 0 : 1;
    return value;
  } catch (error) {
    record.status = "fail";
    record.error = error?.message || String(error);
    throw error;
  } finally {
    record.finishedAt = new Date().toISOString();
  }
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function stageConcurrency(options, stage) {
  return options.concurrency?.[stage] || options.concurrency?.default || 1;
}

function stageMethod(stage) {
  if (stage === "evidence") return "collectEvidence";
  return stage;
}
