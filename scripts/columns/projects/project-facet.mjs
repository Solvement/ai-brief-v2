import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const QUEUE_FILE = path.join(ROOT, "data", "knowledge-graph", "project-ingest-queue.jsonl");
const REQUIRED_MIND_PALACE_FIELDS = ["problem_solved", "method", "self_evo_use", "core_concepts"];
const SELF_EVO_KEYWORDS = ["记忆", "理解", "自进化"];

export function normalizeProjectMindPalace(input = {}) {
  const source = input.mind_palace || input.mindPalace || input;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const out = {
    problem_solved: clean(source.problem_solved || source.problemSolved),
    discovery_trace: normalizeDiscoveryTrace(source.discovery_trace || source.discoveryTrace),
    method: clean(source.method),
    self_evo_use: clean(source.self_evo_use || source.selfEvoUse),
    core_concepts: normalizeCoreConcepts(source.core_concepts || source.coreConcepts),
  };
  if (!REQUIRED_MIND_PALACE_FIELDS.some((key) => key === "core_concepts" ? out.core_concepts.length : out[key])) return null;
  return out;
}

export function precheckProjectFacet(facet = {}) {
  const errors = [];
  const hasText = (value) => typeof value === "string" && value.trim() !== "";
  if (!facet || typeof facet !== "object" || Array.isArray(facet)) return ["not an object"];
  if (!hasText(facet.problem_solved)) errors.push("problem_solved empty");
  if (!hasText(facet.method)) errors.push("method empty");
  if (!hasText(facet.self_evo_use)) errors.push("self_evo_use empty");
  for (const keyword of SELF_EVO_KEYWORDS) {
    if (!String(facet.self_evo_use || "").includes(keyword)) errors.push(`self_evo_use missing ${keyword}`);
  }
  if (!Array.isArray(facet.core_concepts) || facet.core_concepts.length < 3 || facet.core_concepts.length > 5) {
    errors.push("core_concepts must be 3-5 items");
  } else {
    for (const concept of facet.core_concepts) {
      if (!hasText(concept?.name) || !["primary", "supporting", "mentioned"].includes(concept?.role) || !hasText(concept?.evidence)) {
        errors.push("core_concept missing name/role/evidence");
      }
    }
  }
  const dt = facet.discovery_trace;
  const emptyTrace = dt === undefined || dt === null || (typeof dt === "string" && (!dt.trim() || dt.trim() === "数据不足"));
  if (!emptyTrace && (typeof dt !== "object" || Array.isArray(dt) || !hasText(dt.source_span))) {
    errors.push("non-empty discovery_trace requires source_span");
  }
  return errors;
}

export async function enqueueProjectKgIngest({ repo, slug, mindPalace, sourceFile, generatedAt = new Date().toISOString(), queueFile = QUEUE_FILE } = {}) {
  const normalized = normalizeProjectMindPalace(mindPalace);
  if (!normalized) return null;
  const errors = precheckProjectFacet(normalized);
  if (errors.length) throw new Error(`project mind_palace precheck failed: ${errors.join("; ")}`);
  const fullName = String(repo?.fullName || repo?.repo || "").toLowerCase();
  const record = {
    queued_at: generatedAt,
    status: "queued",
    kind: "project",
    repo: fullName,
    slug: slug || slugify(fullName),
    source_file: sourceFile || "",
    mind_palace: normalized,
  };
  await mkdir(path.dirname(queueFile), { recursive: true });
  await writeFile(queueFile, `${JSON.stringify(record)}\n`, { encoding: "utf8", flag: "a" });
  return record;
}

function normalizeDiscoveryTrace(value) {
  if (value === undefined || value === null || value === "") return "数据不足";
  if (typeof value === "string") return value.trim() || "数据不足";
  if (typeof value !== "object" || Array.isArray(value)) return "数据不足";
  return {
    hypothesis: clean(value.hypothesis),
    failed_attempts: Array.isArray(value.failed_attempts || value.failedAttempts)
      ? (value.failed_attempts || value.failedAttempts).map(clean).filter(Boolean).slice(0, 5)
      : [],
    source_span: clean(value.source_span || value.sourceSpan),
  };
}

function normalizeCoreConcepts(value) {
  return (Array.isArray(value) ? value : []).slice(0, 5).map((concept) => ({
    name: clean(concept?.name),
    role: ["primary", "supporting", "mentioned"].includes(concept?.role) ? concept.role : "supporting",
    evidence: clean(concept?.evidence),
  })).filter((concept) => concept.name && concept.evidence);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "project";
}
