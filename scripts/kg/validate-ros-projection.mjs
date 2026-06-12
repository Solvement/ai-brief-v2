#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRosProjection } from "./build-ros-projection.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH_FILE = path.join("public", "data", "brief", "ros-graph.json");
const OBJECTS_DIR = path.join("public", "data", "brief", "ros-objects");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function readTextOrNull(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function collectObjectIds(objects) {
  const ids = new Set();
  for (const object of objects) {
    ids.add(object.object_id);
    for (const key of ["claims", "mechanisms", "assumptions", "failure_modes"]) {
      for (const item of asArray(object[key])) {
        if (item?.id) ids.add(item.id);
      }
    }
  }
  return ids;
}

function add(errors, message) {
  errors.push(message);
}

export async function validateRosProjection({ root = ROOT } = {}) {
  const errors = [];
  const generated = await buildRosProjection({ root });
  const graphPath = path.join(root, GRAPH_FILE);
  const objectsPath = path.join(root, OBJECTS_DIR);
  const graphRaw = await readTextOrNull(graphPath);
  if (graphRaw === null) {
    add(errors, `${GRAPH_FILE} is missing`);
    return { ok: false, errors, summary: generated.summary };
  }

  let graph = null;
  try {
    graph = JSON.parse(graphRaw);
  } catch (error) {
    add(errors, `${GRAPH_FILE} is invalid JSON: ${error.message}`);
    return { ok: false, errors, summary: generated.summary };
  }

  if (graph.schema !== "ros-graph-v1") add(errors, "ros-graph.json schema must be ros-graph-v1");

  for (const node of asArray(graph.nodes)) {
    if (node.kind === "project" || String(node.id || "").startsWith("project/")) {
      add(errors, `project node leaked into graph: ${node.id || node.slug}`);
    }
    const objectFile = path.join(objectsPath, `${node.slug}.json`);
    if ((await readTextOrNull(objectFile)) === null) add(errors, `missing ros object panel for node ${node.slug}`);
  }

  const nodeIds = new Set(asArray(graph.nodes).map((node) => node.id));
  for (const edge of asArray(graph.edges)) {
    if (!nodeIds.has(edge.source)) add(errors, `edge ${edge.id} source is not a paper node: ${edge.source}`);
    if (!nodeIds.has(edge.target)) add(errors, `edge ${edge.id} target is not a paper node: ${edge.target}`);
    if (String(edge.source).startsWith("project/") || String(edge.target).startsWith("project/")) {
      add(errors, `project endpoint leaked into edge ${edge.id}`);
    }
  }

  const objectIds = collectObjectIds(generated.allObjects);

  for (const proposition of asArray(graph.propositions)) {
    for (const side of ["support", "oppose"]) {
      for (const ref of asArray(proposition[side])) {
        if (!objectIds.has(ref.claim_id)) {
          add(errors, `proposition ${proposition.id} ${side} reference does not exist: ${ref.claim_id}`);
        }
      }
    }
  }

  for (const edge of asArray(graph.edges)) {
    for (const relation of asArray(edge.relations)) {
      if (!objectIds.has(relation.source_object)) {
        add(errors, `edge ${edge.id} relation source_object does not exist: ${relation.source_object}`);
      }
      if (!objectIds.has(relation.target_object)) {
        add(errors, `edge ${edge.id} relation target_object does not exist: ${relation.target_object}`);
      }
    }
  }

  if (graphRaw !== generated.graphJson) add(errors, `${GRAPH_FILE} differs from build-ros-projection output`);
  const existingNames = new Set((await readdir(objectsPath).catch(() => [])).filter((name) => name.endsWith(".json")));
  for (const [name, content] of generated.objectFiles) {
    const existing = await readTextOrNull(path.join(objectsPath, name));
    if (existing === null) add(errors, `${OBJECTS_DIR}/${name} is missing`);
    else if (existing !== content) add(errors, `${OBJECTS_DIR}/${name} differs from build-ros-projection output`);
    existingNames.delete(name);
  }
  for (const name of existingNames) add(errors, `${OBJECTS_DIR}/${name} is stale (not a paper projection object)`);

  return { ok: errors.length === 0, errors, summary: generated.summary };
}

export function renderReport(report) {
  const lines = [];
  for (const error of report.errors) lines.push(`FAIL ${error}`);
  lines.push(`Summary: nodes=${report.summary.paper_nodes} edges=${report.summary.edges} propositions=${report.summary.propositions}`);
  if (report.ok) lines.unshift("PASS ros projection");
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await validateRosProjection();
  process.stdout.write(renderReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
