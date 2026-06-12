import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const ROOT = process.cwd();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

async function readYamlFile(file) {
  const text = await readFile(file, "utf8");
  return parseYaml(text) ?? {};
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
  const objectsDir = path.join(root, "data", "knowledge-graph", "objects");
  const files = await listYamlFiles(objectsDir);
  const objects = [];
  for (const file of files) {
    const object = await readYamlFile(file);
    objects.push({
      ...object,
      _file: file,
      _objectId: object.object_id || `${object.kind || "paper"}/${object.slug || path.basename(file, path.extname(file))}`,
    });
  }
  return objects.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

async function loadRegistry(root) {
  const registryDir = path.join(root, "data", "knowledge-graph", "registry");
  const load = async (name) => {
    try {
      return asArray(await readYamlFile(path.join(registryDir, `${name}.yaml`)));
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  };
  return {
    concepts: await load("concepts"),
    benchmarks: await load("benchmarks"),
  };
}

function source(type, id) {
  return { type, id };
}

function relation({ source: sourceRef, target, relationType, reason, anchors, status = "candidate", confidence = "medium", boundary = "", validationExperiment = "" }) {
  return {
    source: sourceRef,
    target,
    relation_type: relationType,
    derived_by: "structural_join",
    evidence_anchors: anchors || { source: "", target: "" },
    boundary,
    validation_experiment: validationExperiment,
    confidence: { value: confidence, reason },
    status,
  };
}

function objectPairs(objects) {
  const pairs = [];
  for (let i = 0; i < objects.length; i += 1) {
    for (let j = i + 1; j < objects.length; j += 1) {
      if (objects[i].slug && objects[i].slug === objects[j].slug) continue;
      pairs.push([objects[i], objects[j]]);
    }
  }
  return pairs;
}

function deriveSharesProblem(objects) {
  const relations = [];
  const sharedByPair = new Map();
  for (const [a, b] of objectPairs(objects)) {
    const shared = uniqSorted(asArray(a.canonical?.problems).filter((id) => asArray(b.canonical?.problems).includes(id)));
    if (!shared.length) continue;
    const pairKey = [a.slug, b.slug].sort().join("|");
    sharedByPair.set(pairKey, { a, b, shared_problems: shared });
    relations.push(relation({
      source: source("object", a._objectId),
      target: source("object", b._objectId),
      relationType: "shares_problem",
      anchors: { source: "canonical.problems", target: "canonical.problems" },
      reason: `shares_problem: both objects attach to ${shared.join(", ")}`,
      confidence: "medium",
    }));
  }
  return { relations, sharedByPair };
}

function deriveCanBeEvaluatedBy(objects, benchmarks) {
  const relations = [];
  const benchmarkRows = benchmarks
    .map((benchmark) => ({ id: benchmark.id, evaluates: asArray(benchmark.evaluates) }))
    .filter((benchmark) => benchmark.id);

  for (const object of objects) {
    for (const mechanism of asArray(object.mechanisms)) {
      if (!mechanism?.id || !mechanism.problem) continue;
      for (const benchmark of benchmarkRows) {
        if (!benchmark.evaluates.includes(mechanism.problem)) continue;
        relations.push(relation({
          source: source("mechanism", mechanism.id),
          target: source("benchmark", benchmark.id),
          relationType: "can_be_evaluated_by",
          anchors: { source: mechanism.anchor || "mechanism.problem", target: "registry.benchmarks.evaluates" },
          reason: `can_be_evaluated_by: mechanism.problem ${mechanism.problem} is evaluated by ${benchmark.id} (functional join, not an actual test run)`,
          confidence: "medium",
          boundary: "Functional relation only — the benchmark has not actually tested this mechanism; upgrade requires a result-table/self-run record (canonical.benchmarks → evaluates).",
          validationExperiment: "Run the benchmark against this mechanism's declared problem setting.",
        }));
      }
    }
  }
  return relations;
}

function deriveSameConceptFamily(objects) {
  const mechanisms = objects.flatMap((object) => asArray(object.mechanisms)
    .filter((mechanism) => mechanism?.id && mechanism?.canonical_concept)
    .map((mechanism) => ({ object, mechanism })));
  const relations = [];
  for (let i = 0; i < mechanisms.length; i += 1) {
    for (let j = i + 1; j < mechanisms.length; j += 1) {
      const a = mechanisms[i];
      const b = mechanisms[j];
      if (a.object.slug === b.object.slug) continue;
      if (a.mechanism.canonical_concept !== b.mechanism.canonical_concept) continue;
      relations.push(relation({
        source: source("mechanism", a.mechanism.id),
        target: source("mechanism", b.mechanism.id),
        relationType: "compares_with",
        anchors: { source: a.mechanism.anchor || "mechanism.canonical_concept", target: b.mechanism.anchor || "mechanism.canonical_concept" },
        reason: `same_concept_family: both mechanisms attach to ${a.mechanism.canonical_concept}`,
        confidence: "medium",
        boundary: "Candidate only; shared concept family does not prove dominance or compatibility.",
      }));
    }
  }
  return relations;
}

function conceptConflictMap(concepts) {
  const byId = new Map();
  for (const concept of concepts) {
    if (!concept?.id) continue;
    byId.set(concept.id, new Set([...asArray(concept.distinct_from), ...asArray(concept.conflicts_with)]));
  }
  return byId;
}

function conceptsConflict(aConcepts, bConcepts, conflicts) {
  for (const a of aConcepts) {
    for (const b of bConcepts) {
      if (conflicts.get(a)?.has(b) || conflicts.get(b)?.has(a)) return [a, b];
    }
  }
  return null;
}

function deriveConflictsAssumption(objects, concepts) {
  const conflicts = conceptConflictMap(concepts);
  const relations = [];
  for (const [a, b] of objectPairs(objects)) {
    const hit = conceptsConflict(asArray(a.canonical?.concepts), asArray(b.canonical?.concepts), conflicts);
    if (!hit) continue;
    const aAssumptions = asArray(a.assumptions).filter((assumption) => assumption?.id && String(assumption.conflicts_hint || "").trim());
    const bAssumptions = asArray(b.assumptions).filter((assumption) => assumption?.id && String(assumption.conflicts_hint || "").trim());
    if (!aAssumptions.length || !bAssumptions.length) continue;
    // One aggregated edge per object pair + concept conflict — never an assumption×assumption
    // cartesian product (that is category-level pairing noise in disguise).
    relations.push(relation({
      source: source("object", a._objectId),
      target: source("object", b._objectId),
      relationType: "tension_with",
      anchors: {
        source: aAssumptions.map((assumption) => assumption.id).join(", "),
        target: bAssumptions.map((assumption) => assumption.id).join(", "),
      },
      reason: `conflicts_assumption: ${hit[0]} is distinct_from/conflicts_with ${hit[1]}; assumption carriers listed in evidence_anchors (aggregated, one edge per object pair)`,
      confidence: "medium",
      boundary: "Candidate only; concept-level conflict plus hints must be checked against source anchors.",
    }));
  }
  return relations;
}

function deriveEvaluates(objects, benchmarks) {
  const benchmarkIds = new Set(benchmarks.map((benchmark) => benchmark?.id).filter(Boolean));
  const relations = [];
  for (const object of objects) {
    for (const benchId of asArray(object.canonical?.benchmarks)) {
      if (!benchmarkIds.has(benchId)) continue;
      if (object.canonical?.benchmarks && benchId === `bench.${object.slug}`) continue; // a benchmark paper does not evaluate itself
      relations.push(relation({
        source: source("benchmark", benchId),
        target: source("object", object._objectId),
        relationType: "evaluates",
        anchors: { source: "registry.benchmarks", target: "canonical.benchmarks (actual/self-reported test record, see object claims)" },
        reason: `evaluates: object declares an actual test record on ${benchId} (canonical.benchmarks = tested relation by ruling 2026-06-12)`,
        confidence: "medium",
        boundary: "Self-reported runs are not cross-comparable across systems; upgrade to high only with independent reproduction.",
      }));
    }
  }
  return relations;
}

function ownerByObject(objects) {
  const byId = new Map();
  for (const object of objects) {
    byId.set(object._objectId, object.slug);
    for (const mechanism of asArray(object.mechanisms)) byId.set(mechanism?.id, object.slug);
    for (const assumption of asArray(object.assumptions)) byId.set(assumption?.id, object.slug);
    for (const claim of asArray(object.claims)) byId.set(claim?.id, object.slug);
    for (const failure of asArray(object.failure_modes)) byId.set(failure?.id, object.slug);
  }
  return byId;
}

function buildResidualQueue(objects, sharedByPair, relations) {
  const owners = ownerByObject(objects);
  const coveredPairs = new Set();
  for (const item of relations) {
    if (item.relation_type === "shares_problem") continue;
    const a = owners.get(item.source?.id);
    const b = owners.get(item.target?.id);
    if (a && b && a !== b) coveredPairs.add([a, b].sort().join("|"));
  }

  return [...sharedByPair.entries()]
    .filter(([pairKey]) => !coveredPairs.has(pairKey))
    .map(([, item]) => ({
      source: item.a._objectId,
      target: item.b._objectId,
      shared_problems: item.shared_problems,
    }))
    .sort((a, b) => `${a.source}|${a.target}`.localeCompare(`${b.source}|${b.target}`));
}

function withIds(relations) {
  return relations
    .sort((a, b) => [
      a.relation_type,
      a.source?.type,
      a.source?.id,
      a.target?.type,
      a.target?.id,
      a.confidence?.reason,
    ].join("|").localeCompare([
      b.relation_type,
      b.source?.type,
      b.source?.id,
      b.target?.type,
      b.target?.id,
      b.confidence?.reason,
    ].join("|")))
    .map((item, index) => ({ id: `r-${String(index + 1).padStart(4, "0")}`, ...item }));
}

function renderYaml(value) {
  return stringifyYaml(value, { lineWidth: 0 }).trimEnd() + "\n";
}

export async function buildDerivedRelations({ root = ROOT } = {}) {
  const objects = await loadObjects(root);
  const registry = await loadRegistry(root);
  const shares = deriveSharesProblem(objects);
  const relationObjects = withIds([
    ...shares.relations,
    ...deriveCanBeEvaluatedBy(objects, registry.benchmarks),
    ...deriveEvaluates(objects, registry.benchmarks),
    ...deriveSameConceptFamily(objects),
    ...deriveConflictsAssumption(objects, registry.concepts),
  ]);
  const residualQueue = buildResidualQueue(objects, shares.sharedByPair, relationObjects);

  return {
    relations: relationObjects,
    residualQueue,
    derivedYaml: renderYaml(relationObjects),
    residualYaml: renderYaml(residualQueue),
  };
}

export async function deriveRelations({ root = ROOT, check = false } = {}) {
  const relationsDir = path.join(root, "data", "knowledge-graph", "relations");
  const derivedFile = path.join(relationsDir, "derived.yaml");
  const residualFile = path.join(relationsDir, "residual-queue.yaml");
  const generated = await buildDerivedRelations({ root });

  if (check) {
    const existingDerived = await readFile(derivedFile, "utf8").catch(() => "");
    const existingResidual = await readFile(residualFile, "utf8").catch(() => "");
    const ok = existingDerived === generated.derivedYaml && existingResidual === generated.residualYaml;
    return {
      ok,
      checked: true,
      relations: generated.relations.length,
      residual: generated.residualQueue.length,
      mismatches: ok ? [] : [
        ...(existingDerived === generated.derivedYaml ? [] : ["derived.yaml"]),
        ...(existingResidual === generated.residualYaml ? [] : ["residual-queue.yaml"]),
      ],
    };
  }

  await mkdir(relationsDir, { recursive: true });
  await writeFile(derivedFile, generated.derivedYaml, "utf8");
  await writeFile(residualFile, generated.residualYaml, "utf8");
  return {
    ok: true,
    checked: false,
    relations: generated.relations.length,
    residual: generated.residualQueue.length,
    files: [derivedFile, residualFile],
  };
}

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
    root: argv.find((arg) => arg.startsWith("--root="))?.slice("--root=".length) || ROOT,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const result = await deriveRelations(options);
  if (result.ok) {
    process.stdout.write(`${options.check ? "PASS" : "WROTE"} ${result.relations} derived relations, ${result.residual} residual pairs\n`);
  } else {
    process.stdout.write(`FAIL derived relation files differ: ${result.mismatches.join(", ")}\n`);
    process.exitCode = 1;
  }
}
