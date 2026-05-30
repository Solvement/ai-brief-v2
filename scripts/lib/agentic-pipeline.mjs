import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export {
  COLUMN_MODULE_STAGES,
  REQUIRED_COLUMN_MODULE_METHODS,
  assertColumnModule,
  defaultSelect,
  describeColumnModule,
  mapLimit,
  runColumnPipeline,
} from "./pipeline-kernel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MEMORY_DIR = path.join(ROOT, "data", "agent-memory");
const PUBLIC_STATUS_FILE = path.join(ROOT, "public", "data", "pipeline-status.json");
const MAX_RUNS_PER_SURFACE = 30;
const MAX_PUBLIC_RUNS = 12;

export const PIPELINE_STAGES = ["discover", "evidence", "rank", "review", "verify", "publish", "archive"];

const ROLE_COPY = {
  discover: {
    role: "Discoverer",
    responsibility: "发现候选内容，保留来源、主题、时间和热度信号，避免只靠标题判断。",
  },
  evidence: {
    role: "Evidence Collector",
    responsibility: "收集 README、abstract、sourceUrl、paperUrl、benchmark、版本号等证据，让分析有依据。",
  },
  rank: {
    role: "Ranker",
    responsibility: "按岗位相关性、架构价值、实践价值、评估质量、可迁移性和新鲜度排序。",
  },
  review: {
    role: "Teacher Reviewer",
    responsibility: "用教授视角解释该学什么、好在哪里、弱在哪里、如何迁移到自己的工作。",
  },
  verify: {
    role: "Verifier",
    responsibility: "运行结构校验、编码校验和质量门槛，失败时不静默发布。",
  },
  publish: {
    role: "Publisher",
    responsibility: "把通过质量门槛的小批量内容写入前端可读 JSON，保持每日 feed 决策清晰。",
  },
  archive: {
    role: "Archivist",
    responsibility: "把未入选但有复用价值的内容和历史运行记录保存下来，后续用于架构思路和选题复盘。",
  },
};

export function buildAgentFlow(surface, signals = {}) {
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    ...ROLE_COPY[stage],
    signal: signals[stage] || defaultSignal(surface, stage),
  }));
}

function defaultSignal(surface, stage) {
  if (stage === "verify") return "quality gate required before publish";
  if (stage === "archive") return `data/agent-memory/${surface}.json`;
  return `${surface} pipeline`;
}

export function createQualityGate({ surface, checks }) {
  const normalizedChecks = checks.map((check) => ({
    id: check.id,
    label: check.label,
    status: check.status || (check.pass ? "pass" : "fail"),
    details: check.details || "",
  }));
  const hasFail = normalizedChecks.some((check) => check.status === "fail");
  const hasWarning = normalizedChecks.some((check) => check.status === "warning");
  return {
    schemaVersion: 1,
    surface,
    status: hasFail ? "fail" : hasWarning ? "warning" : "pass",
    checkedAt: new Date().toISOString(),
    checks: normalizedChecks,
  };
}

export function gateCheck(id, label, pass, details = "") {
  return { id, label, pass: Boolean(pass), details };
}

export function gateWarning(id, label, condition, details = "") {
  return { id, label, status: condition ? "pass" : "warning", details };
}

export function summarizeSelection(items, mapper) {
  return (items || []).filter(Boolean).map((item, index) => mapper(item, index));
}

export async function rememberPipelineRun(input) {
  await mkdir(MEMORY_DIR, { recursive: true });
  await mkdir(path.dirname(PUBLIC_STATUS_FILE), { recursive: true });

  const now = new Date().toISOString();
  const surface = input.surface;
  const memoryFile = path.join(MEMORY_DIR, `${surface}.json`);
  const previous = await readJson(memoryFile, {
    schemaVersion: 1,
    surface,
    updatedAt: now,
    runs: [],
    reusablePatterns: [],
  });

  const run = {
    id: input.runId || `${surface}-${(input.date || now.slice(0, 10)).replace(/[^0-9-]/g, "")}-${Date.now()}`,
    surface,
    date: input.date || now.slice(0, 10),
    generatedAt: now,
    sourceFiles: input.sourceFiles || {},
    agentFlow: input.agentFlow || buildAgentFlow(surface),
    qualityGate: input.qualityGate,
    trace: input.trace || null,
    reflection: input.reflection || null,
    selectedItems: input.selectedItems || [],
    archivedItems: input.archivedItems || [],
    highlights: input.highlights || [],
    nextActions: input.nextActions || [],
  };

  const nextMemory = {
    schemaVersion: 1,
    surface,
    updatedAt: now,
    runs: [run, ...(previous.runs || [])].slice(0, MAX_RUNS_PER_SURFACE),
    reusablePatterns: mergePatterns(previous.reusablePatterns || [], input.reusablePatterns || [], now),
  };

  await writeJson(memoryFile, nextMemory);
  const publicStatus = await publishPipelineStatus();
  return { run, memoryFile, publicStatus };
}

async function publishPipelineStatus() {
  await mkdir(MEMORY_DIR, { recursive: true });
  const files = await safeReaddir(MEMORY_DIR);
  const memories = [];
  for (const name of files.filter((item) => item.endsWith(".json"))) {
    memories.push(await readJson(path.join(MEMORY_DIR, name), null));
  }

  const surfaces = memories
    .filter(Boolean)
    .map((memory) => {
      const latestRun = memory.runs?.[0] || null;
      return {
        surface: memory.surface,
        updatedAt: memory.updatedAt,
        latestRun: latestRun ? publicRun(latestRun) : null,
        runCount: memory.runs?.length || 0,
        reusablePatterns: (memory.reusablePatterns || []).slice(0, 6),
      };
    })
    .sort((a, b) => String(a.surface).localeCompare(String(b.surface)));

  const allRuns = surfaces
    .flatMap((surface) => surface.latestRun ? [surface.latestRun] : [])
    .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
    .slice(0, MAX_PUBLIC_RUNS);

  const status = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    principle: "discover -> evidence -> rank -> review -> verify -> publish -> archive",
    surfaces,
    recentRuns: allRuns,
  };
  await writeJson(PUBLIC_STATUS_FILE, status);
  return status;
}

function publicRun(run) {
  return {
    id: run.id,
    surface: run.surface,
    date: run.date,
    generatedAt: run.generatedAt,
    qualityStatus: run.qualityGate?.status || "unknown",
    selectedCount: run.selectedItems?.length || 0,
    archivedCount: run.archivedItems?.length || 0,
    traceSummary: run.trace?.summary || null,
    reflectionSummary: run.reflection?.summary || "",
    highlights: (run.highlights || []).slice(0, 4),
    nextActions: (run.nextActions || []).slice(0, 4),
  };
}

function mergePatterns(previous, incoming, now) {
  const byKey = new Map();
  for (const pattern of [...incoming, ...previous]) {
    const text = typeof pattern === "string" ? pattern : pattern?.text;
    if (!text) continue;
    const key = text.toLowerCase();
    const prior = byKey.get(key);
    byKey.set(key, {
      text,
      source: typeof pattern === "string" ? "pipeline" : pattern.source || "pipeline",
      firstSeenAt: pattern.firstSeenAt || prior?.firstSeenAt || now,
      lastSeenAt: now,
    });
  }
  return [...byKey.values()].slice(0, 40);
}

async function safeReaddir(dir) {
  try {
    return await readdir(dir);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}
