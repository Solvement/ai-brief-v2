#!/usr/bin/env node
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH_OUT = path.join("public", "data", "brief", "ros-graph.json");
const OBJECTS_OUT_DIR = path.join("public", "data", "brief", "ros-objects");
const RELATION_PRIORITY = ["evaluates", "tension_with", "complements", "compares_with", "can_be_evaluated_by", "shares_problem"];
const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 };

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clip(value, length = 120) {
  const text = cleanText(value);
  return text.length <= length ? text : text.slice(0, length);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, stable(value[key])]));
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readYamlFile(file) {
  return parseYaml(await readFile(file, "utf8")) ?? {};
}

async function listYamlFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => path.join(dir, entry.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadObjects(root) {
  const files = await listYamlFiles(path.join(root, "data", "knowledge-graph", "objects"));
  const objects = [];
  for (const file of files) {
    const object = await readYamlFile(file);
    objects.push({
      ...object,
      object_id: object.object_id || `${object.kind || "paper"}/${object.slug || path.basename(file, path.extname(file))}`,
      _file: file,
    });
  }
  return objects.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

async function loadRegistryList(root, name) {
  const file = path.join(root, "data", "knowledge-graph", "registry", `${name}.yaml`);
  try {
    return asArray(await readYamlFile(file));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadRelationsFile(root, name) {
  const file = path.join(root, "data", "knowledge-graph", "relations", name);
  let raw = "";
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  // judged.yaml appends a root-level no_edge ledger after the relation sequence.
  // Projection only consumes the sequence entries.
  const sequenceOnly = raw.split(/\nno_edge:\s*\n/)[0].trim();
  if (!sequenceOnly) return [];
  const parsed = parseYaml(sequenceOnly);
  return asArray(parsed).filter((item) => item && typeof item === "object" && item.relation_type);
}

async function generatedAt(root, files) {
  const stats = await Promise.all(files.map((file) => stat(file).catch(() => null)));
  const latest = Math.max(0, ...stats.filter(Boolean).map((item) => item.mtimeMs));
  return new Date(latest || 0).toISOString();
}

function rootNamespace(problemId) {
  const [root] = String(problemId || "uncategorized").split(".");
  return root || "uncategorized";
}

function counts(object) {
  return {
    claims: asArray(object.claims).length,
    mechanisms: asArray(object.mechanisms).length,
    trigger_hooks: asArray(object.trigger_hooks).length,
    exam_questions: asArray(object.exam_questions).length,
  };
}

// 卡片/星图默认渲染用的人话摘要（受众分离：默认视图只读这块，不碰 AI-内部字段）。
function humanCard(object) {
  const h = object.human;
  if (!h || typeof h !== "object") return null;
  return {
    headline: h.headline || "",
    plain_summary: h.plain_summary || "",
    use_type: h.use_type || "",
    how_to_use: h.how_to_use || "",
  };
}

function nodeFor(object) {
  const canonical = object.canonical || {};
  const problems = asArray(canonical.problems);
  return {
    id: object.object_id,
    slug: object.slug,
    kind: object.kind,
    title: object.title || object.slug,
    thesis: object.one_sentence_thesis || "",
    human: humanCard(object),
    problems,
    concepts: asArray(canonical.concepts),
    benchmarks: asArray(canonical.benchmarks),
    cluster: rootNamespace(problems[0]),
    counts: counts(object),
  };
}

function shortTitle(title) {
  // 只在破折号/冒号断，不在 ASCII 连字符断（否则 "SWE-Explore" 会被切成 "SWE"）。
  return String(title || "").split(/[—–:：]/)[0].trim() || String(title || "");
}

// 边的人话 gloss（受众分离）：按关系类型 + 两端标题 + 共享问题人名拼成自然语句，
// 不出现 object ID / canonical ID / "conflicts_assumption:" 等调试串；具体分歧留审计层（relations[].reason）。
function edgeGloss(primaryType, sourceNode, targetNode, problemName) {
  const a = shortTitle(sourceNode?.title);
  const b = shortTitle(targetNode?.title);
  const shared = (sourceNode?.problems || []).find((p) => (targetNode?.problems || []).includes(p));
  const sn = shared ? problemName(shared) : "";
  switch (primaryType) {
    case "shares_problem":
      return `${a} 与 ${b}：都在解同一个问题${sn ? `——${sn}` : ""}。`;
    case "tension_with":
      return `${a} 与 ${b}：${sn ? `同在「${sn}」上` : "在关键假设上"}路线不同，是设计层张力（不是实验证明的冲突）；具体分歧点开看。`;
    case "can_be_evaluated_by":
      return `${a} 关心的能力，可以用 ${b} 这套评测来检验。`;
    case "evaluates":
      return `${b} 对 ${a} 做了实测。`;
    case "compares_with":
      return `${a} 与 ${b} 可横向对比。`;
    case "complements":
      return `${a} 与 ${b} 互补，可组合使用。`;
    default:
      return `${a} 与 ${b} 相关。`;
  }
}

function indexObjects(objects) {
  const byObjectId = new Map();
  const bySlug = new Map();
  const ownerById = new Map();
  const recordById = new Map();
  for (const object of objects) {
    byObjectId.set(object.object_id, object);
    bySlug.set(object.slug, object);
    ownerById.set(object.object_id, object);
    recordById.set(object.object_id, object);
    for (const key of ["claims", "mechanisms", "assumptions", "failure_modes"]) {
      for (const item of asArray(object[key])) {
        if (!item?.id) continue;
        ownerById.set(item.id, object);
        recordById.set(item.id, item);
      }
    }
  }
  return { byObjectId, bySlug, ownerById, recordById };
}

function confidenceValue(relation) {
  const raw = typeof relation.confidence === "object" ? relation.confidence?.value : relation.confidence;
  return raw || "low";
}

function confidenceReason(relation) {
  return typeof relation.confidence === "object" ? relation.confidence?.reason || "" : "";
}

function relationDetail(relation) {
  return {
    relation_type: relation.relation_type,
    source_object: relation.source?.id || "",
    target_object: relation.target?.id || "",
    confidence: confidenceValue(relation),
    derived_by: relation.derived_by || "",
    boundary: relation.boundary || "",
    reason: confidenceReason(relation),
  };
}

function priorityIndex(type) {
  const index = RELATION_PRIORITY.indexOf(type);
  return index === -1 ? RELATION_PRIORITY.length : index;
}

function edgeSortKey(item) {
  return [
    item.relation_type,
    item.source?.type,
    item.source?.id,
    item.target?.type,
    item.target?.id,
    confidenceReason(item),
  ].join("|");
}

function aggregateEdges(relations, ownerById, nodeById, problemName) {
  const groups = new Map();
  for (const relation of relations) {
    const sourceOwner = ownerById.get(relation.source?.id);
    const targetOwner = ownerById.get(relation.target?.id);
    if (!sourceOwner || !targetOwner) continue;
    if (sourceOwner.kind !== "paper" || targetOwner.kind !== "paper") continue;
    if (sourceOwner.object_id === targetOwner.object_id) continue;
    const [source, target] = [sourceOwner.object_id, targetOwner.object_id].sort((a, b) => a.localeCompare(b));
    const key = `${source}|${target}`;
    const group = groups.get(key) || { source, target, relations: [] };
    group.relations.push(relation);
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => `${a.source}|${a.target}`.localeCompare(`${b.source}|${b.target}`))
    .map((group, index) => {
      const sorted = group.relations.sort((a, b) => edgeSortKey(a).localeCompare(edgeSortKey(b)));
      const primary = sorted
        .map((relation) => relation.relation_type)
        .sort((a, b) => priorityIndex(a) - priorityIndex(b))[0] || "shares_problem";
      const confidence = sorted
        .map(confidenceValue)
        .sort((a, b) => (CONFIDENCE_RANK[b] || 0) - (CONFIDENCE_RANK[a] || 0))[0] || "low";
      return {
        id: `e-${String(index + 1).padStart(4, "0")}`,
        source: group.source,
        target: group.target,
        primary_type: primary,
        confidence,
        count: sorted.length,
        gloss: edgeGloss(primary, nodeById.get(group.source), nodeById.get(group.target), problemName),
        relations: sorted.map(relationDetail),
      };
    });
}

function propositionCluster(proposition, recordById, ownerById) {
  for (const id of [...asArray(proposition.support), ...asArray(proposition.oppose)]) {
    if (!recordById.has(id)) continue;
    const owner = ownerById.get(id);
    return rootNamespace(asArray(owner?.canonical?.problems)[0]);
  }
  return "uncategorized";
}

function evidenceRef(id, recordById, ownerById) {
  const record = recordById.get(id);
  const owner = ownerById.get(id);
  return {
    claim_id: id,
    owner: owner?.slug || "",
    owner_kind: owner?.kind || "",
    excerpt: clip(record?.statement || record?.name || ""),
  };
}

function humanProp(proposition) {
  const h = proposition.human;
  if (!h || typeof h !== "object") return null;
  return {
    current_judgment: h.current_judgment || "",
    why: asArray(h.why),
    strongest_for: h.strongest_for || "",
    strongest_against: h.strongest_against || "",
    third_way: h.third_way || "",
    for_you: h.for_you || "",
  };
}

function propositionFor(proposition, indexes) {
  return {
    id: proposition.id,
    statement: proposition.statement || "",
    state: proposition.state || "open",
    cluster: propositionCluster(proposition, indexes.recordById, indexes.ownerById),
    human: humanProp(proposition),
    possible_synthesis: proposition.possible_synthesis || "",
    support: asArray(proposition.support).map((id) => evidenceRef(id, indexes.recordById, indexes.ownerById)),
    oppose: asArray(proposition.oppose).map((id) => evidenceRef(id, indexes.recordById, indexes.ownerById)),
  };
}

export async function buildRosProjection({ root = ROOT } = {}) {
  const objects = await loadObjects(root);
  const registryFiles = ["problems.yaml", "concepts.yaml", "benchmarks.yaml", "propositions.yaml"]
    .map((name) => path.join(root, "data", "knowledge-graph", "registry", name));
  const relationFiles = ["derived.yaml", "judged.yaml"]
    .map((name) => path.join(root, "data", "knowledge-graph", "relations", name));
  const inputFiles = [...objects.map((object) => object._file), ...registryFiles, ...relationFiles];
  const indexes = indexObjects(objects);
  const relations = [
    ...await loadRelationsFile(root, "derived.yaml"),
    ...await loadRelationsFile(root, "judged.yaml"),
  ];
  const propositions = (await loadRegistryList(root, "propositions")).map((item) => propositionFor(item, indexes));
  const problemList = await loadRegistryList(root, "problems");
  const problemNames = new Map(problemList.map((p) => [p.id, p.name || p.id]));
  const problemName = (id) => problemNames.get(id) || id;
  const paperObjects = objects.filter((object) => object.kind === "paper");
  const nodes = paperObjects.map(nodeFor);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const graph = {
    schema: "ros-graph-v1",
    generated_at: await generatedAt(root, inputFiles),
    nodes,
    edges: aggregateEdges(relations, indexes.ownerById, nodeById, problemName),
    propositions,
  };

  const objectFiles = new Map();
  for (const object of paperObjects) {
    objectFiles.set(`${object.slug}.json`, json(stable(Object.fromEntries(Object.entries(object).filter(([key]) => !key.startsWith("_"))))));
  }

  return {
    graph,
    graphJson: json(graph),
    objectFiles,
    allObjects: objects.map((object) => Object.fromEntries(Object.entries(object).filter(([key]) => !key.startsWith("_")))),
    summary: {
      objects: objects.length,
      paper_nodes: paperObjects.length,
      project_objects: objects.filter((object) => object.kind === "project").length,
      edges: graph.edges.length,
      propositions: graph.propositions.length,
    },
  };
}

export async function writeRosProjection({ root = ROOT } = {}) {
  const projection = await buildRosProjection({ root });
  const graphFile = path.join(root, GRAPH_OUT);
  const objectsDir = path.join(root, OBJECTS_OUT_DIR);
  await mkdir(path.dirname(graphFile), { recursive: true });
  await mkdir(objectsDir, { recursive: true });
  await writeFile(graphFile, projection.graphJson, "utf8");

  const expected = new Set(projection.objectFiles.keys());
  const existing = await readdir(objectsDir).catch(() => []);
  await Promise.all(existing
    .filter((name) => name.endsWith(".json") && !expected.has(name))
    .map((name) => rm(path.join(objectsDir, name), { force: true })));
  for (const [name, content] of projection.objectFiles) {
    await writeFile(path.join(objectsDir, name), content, "utf8");
  }
  return projection;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const projection = await writeRosProjection();
  console.log(`[ros-projection] wrote ${GRAPH_OUT}`);
  console.log(`[ros-projection] wrote ${projection.objectFiles.size} object panels -> ${OBJECTS_OUT_DIR}`);
  console.log(`[ros-projection] nodes:${projection.summary.paper_nodes} edges:${projection.summary.edges} propositions:${projection.summary.propositions}`);
}
