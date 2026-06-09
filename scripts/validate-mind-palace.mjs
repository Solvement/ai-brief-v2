#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FACETS_DIR = path.join(ROOT, "data", "knowledge-graph", "facets");
const GRAPH_FILE = path.join(ROOT, "public", "data", "brief", "graph.json");
const EMBEDDINGS_FILE = path.join(ROOT, "public", "data", "brief", "mind-palace-embeddings.json");
const REQUIRED_FACETS = ["problem_solved", "method", "result", "innovation", "weakness", "transfer"];
const EDGE_TYPES = new Set(["improves_on", "composes_with", "contradicts", "special_case_of", "derives_from"]);

const errors = [];
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const hasText = (value) => typeof value === "string" && value.trim() !== "";
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function fail(where, message) {
  errors.push(`${where}: ${message}`);
}

async function readJson(file, label) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail(label, `cannot read/parse JSON: ${error.message}`);
    return null;
  }
}

function nodeSlugs(nodes) {
  const slugs = new Set();
  for (const node of nodes) {
    if (hasText(node.slug)) slugs.add(node.slug);
    if (hasText(node.id)) {
      const id = node.id;
      slugs.add(id.replace(/^(paper|project|ghost|content|radar|deep-dive|concept|method|claim|evidence|artifact|source-pack|evidence-pack|system-component|design-principle|taste)[/:]/, ""));
    }
  }
  return slugs;
}

let facetFiles = [];
try {
  facetFiles = (await readdir(FACETS_DIR)).filter((name) => /\.ya?ml$/i.test(name)).sort();
} catch (error) {
  fail(rel(FACETS_DIR), `cannot read facets directory: ${error.message}`);
}

const graph = await readJson(GRAPH_FILE, rel(GRAPH_FILE));
const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
const nodeIds = new Set(nodes.map((node) => node.id).filter(Boolean));
const slugSet = nodeSlugs(nodes);

const embeddings = await readJson(EMBEDDINGS_FILE, rel(EMBEDDINGS_FILE));
const vectors = Array.isArray(embeddings?.vectors) ? embeddings.vectors : [];
const vectorIds = new Set(vectors.map((item) => item.id).filter(Boolean));
const vectorSlugs = new Set(vectors.map((item) => item.slug).filter(Boolean));

const activeFacets = [];
for (const file of facetFiles) {
  const fullPath = path.join(FACETS_DIR, file);
  const where = rel(fullPath);
  let facet;
  try {
    facet = YAML.parse(await readFile(fullPath, "utf8"));
  } catch (error) {
    fail(where, `cannot parse YAML: ${error.message}`);
    continue;
  }

  if (!isObject(facet)) {
    fail(where, "must parse to an object");
    continue;
  }

  if (facet.status === "reject") continue;
  activeFacets.push(facet);

  if (!hasText(facet.node_id)) fail(where, "node_id must be a non-empty string");
  else if (!nodeIds.has(facet.node_id)) fail(where, `node_id does not resolve in graph nodes: ${facet.node_id}`);

  if (!isObject(facet.facets)) {
    fail(where, "facets must be an object");
  } else {
    for (const key of REQUIRED_FACETS) {
      if (!hasText(facet.facets[key])) fail(where, `facets.${key} must be non-empty`);
    }
    if (facet.facets.architecture !== undefined && !String(facet.facets.architecture).includes("```mermaid")) {
      fail(where, "facets.architecture must include a ```mermaid fence when present");
    }
  }

  if (hasText(facet.node_id) && !vectorIds.has(facet.node_id) && !vectorSlugs.has(facet.slug)) {
    fail(where, `missing embedding vector for ${facet.node_id}${facet.slug ? ` / ${facet.slug}` : ""}`);
  }

  if (facet.edges !== undefined) {
    if (!Array.isArray(facet.edges)) {
      fail(where, "edges must be an array when present");
    } else {
      facet.edges.forEach((edge, index) => {
        const edgePath = `${where}.edges[${index}]`;
        if (!isObject(edge)) {
          fail(edgePath, "must be an object");
          return;
        }
        if (!EDGE_TYPES.has(edge.type)) fail(edgePath, `type must be one of ${[...EDGE_TYPES].join("|")}`);
        if (!hasText(edge.to)) fail(edgePath, "to must be a non-empty slug");
        else if (!slugSet.has(edge.to)) fail(edgePath, `to slug does not resolve in graph nodes: ${edge.to}`);
      });
    }
  }
}

if (!facetFiles.length) fail(rel(FACETS_DIR), "must contain at least one facet YAML file");
if (!Array.isArray(graph?.nodes)) fail(rel(GRAPH_FILE), "nodes must be an array");
if (!Array.isArray(embeddings?.vectors)) fail(rel(EMBEDDINGS_FILE), "vectors must be an array");

if (errors.length) {
  console.error(`[validate-mind-palace] ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`[validate-mind-palace] OK facets:${activeFacets.length} vectors:${vectors.length}`);
