// scripts/kg/build-brief-graph.mjs
// ------------------------------------------------------------------
// Brief knowledge-graph EDGE ENGINE runner (Kevin 2026-06-09).
//
// Unifies TWO node families into ONE associative-memory graph and builds the
// real edge set that public/data/brief/graph.json was missing (1 → many hundreds):
//   • brief-wiki entities (content / deep-dives / concepts / claims / …)
//   • papers (content/papers/<slug>/metadata.json)
//   • radar projects (public/data/trending.json) as light project nodes
//   • ghost nodes (data/knowledge-graph/discovery-candidates.json, if present)
//
// Edges:
//   references  (wikilinks, deterministic)        — brief-edges.mjs
//   same_track  (>=2 shared tags, deterministic)  — brief-edges.mjs
//   implements  (project↔paper, deterministic)    — brief-edges.mjs
//   builds_on / shares_method / same_use_case     — authored focus-cluster edges below
//
// Idempotent: rebuilds graph.json from sources every run. Re-run after
// brief:build to re-apply the edge set (brief:build emits the 1-edge graph).
// ------------------------------------------------------------------
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve as pathResolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import {
  extractWikilinkTargets,
  extractArxivIds,
  makeWikilinkResolver,
  buildWikilinkEdges,
  buildSameTrackEdges,
  buildImplementsEdges,
} from './brief-edges.mjs';
import { FOCUS_TYPED_EDGES, FOCUS_TAGS } from './focus-edges.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WIKI_DIR = join(ROOT, 'brief-wiki');
const PAPERS_DIR = join(ROOT, 'content', 'papers');
const TRENDING = join(ROOT, 'public', 'data', 'trending.json');
const GHOSTS = join(ROOT, 'data', 'knowledge-graph', 'discovery-candidates.json');
const OUT_FILE = join(ROOT, 'public', 'data', 'brief', 'graph.json');

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

// brief-wiki entity dir → graph node-id type prefix
const ENTITY_DIRS = {
  content: 'content',
  'source-packs': 'source-pack',
  'evidence-packs': 'evidence-pack',
  'deep-dives': 'deep-dive',
  concepts: 'concept',
  methods: 'method',
  claims: 'claim',
  evidence: 'evidence',
  artifacts: 'artifact',
  'system-components': 'system-component',
  'design-principles': 'design-principle',
  taste: 'taste',
};

function parseFrontmatter(raw) {
  const normalized = raw.replace(/^﻿/, '');
  const m = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { meta: {}, body: normalized };
  let meta;
  try {
    meta = YAML.parse(m[1]) ?? {};
    if (typeof meta !== 'object' || Array.isArray(meta)) meta = {};
  } catch {
    meta = {};
  }
  return { meta, body: m[2] };
}

function titleFromSlug(slug) {
  return slug.split(/[-_]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' ');
}

function listMd(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMd(p));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// ------------------------------------------------------------------
// 1. read brief-wiki entity nodes
// ------------------------------------------------------------------
function readBriefWikiNodes() {
  const nodes = new Map();
  for (const [dirName, typePrefix] of Object.entries(ENTITY_DIRS)) {
    const dir = join(WIKI_DIR, dirName);
    for (const file of listMd(dir)) {
      const raw = readFileSync(file, 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const slug = String(meta.slug ?? file.split(/[\\/]/).pop().replace(/\.md$/, ''));
      const id = String(meta.id ?? `${typePrefix}/${slug}`);
      // wikilinks extracted over frontmatter + body (matches brief build.mjs)
      const links = extractWikilinkTargets(`${JSON.stringify(meta)}\n${body}`);
      const arxivRefs = extractArxivIds(raw);
      const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
      nodes.set(id, {
        id,
        type: typePrefix,
        family: 'project', // brief-wiki = deep-read projects/papers feed
        slug,
        title: String(meta.title ?? titleFromSlug(slug)),
        tags,
        file: rel(file),
        links,
        arxivRefs,
        ghost: false,
      });
    }
  }
  return nodes;
}

// ------------------------------------------------------------------
// 2. read paper nodes (content/papers/<slug>/metadata.json)
// ------------------------------------------------------------------
function readPaperNodes() {
  const nodes = new Map();
  if (!existsSync(PAPERS_DIR)) return nodes;
  for (const dir of readdirSync(PAPERS_DIR)) {
    const dirPath = join(PAPERS_DIR, dir);
    if (!statSync(dirPath).isDirectory()) continue;
    const metaPath = join(dirPath, 'metadata.json');
    if (!existsSync(metaPath)) continue;
    let m;
    try {
      m = readJSON(metaPath);
    } catch {
      continue;
    }
    const arxiv = String(m.arxiv_id || m.paper_id || dir.split('-')[0]);
    const id = `paper:${arxiv}`;
    nodes.set(id, {
      id,
      type: 'paper',
      family: 'paper',
      slug: dir,
      arxiv_id: arxiv,
      title: m.title || dir,
      tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
      topic: m.topic || '',
      file: rel(metaPath),
      links: [],
      arxivRefs: [arxiv],
      ghost: false,
    });
  }
  return nodes;
}

// ------------------------------------------------------------------
// 3. radar project nodes (lightweight, from trending.json)
// ------------------------------------------------------------------
function readRadarNodes(existingIds) {
  const nodes = new Map();
  if (!existsSync(TRENDING)) return nodes;
  let t;
  try {
    t = readJSON(TRENDING);
  } catch {
    return nodes;
  }
  const repos = t.radar && Array.isArray(t.radar.repos) ? t.radar.repos : [];
  for (const r of repos) {
    if (!r || !r.fullName) continue;
    const slug = String(r.name || r.fullName).toLowerCase();
    // skip if a deep-read brief-wiki node already covers this slug
    if (existingIds.has(`content/${slug}`)) continue;
    const id = `radar:${r.fullName}`;
    nodes.set(id, {
      id,
      type: 'project',
      family: 'project',
      slug,
      title: r.fullName,
      tags: [],
      file: 'public/data/trending.json',
      url: r.url || '',
      links: [],
      arxivRefs: extractArxivIds(`${r.description || ''} ${r.tldr || ''}`),
      ghost: true, // radar = known-but-not-deep-read
      radar: true,
    });
  }
  return nodes;
}

// ------------------------------------------------------------------
// 4. ghost candidate nodes (optional sibling-agent output)
// ------------------------------------------------------------------
function readGhostNodes() {
  const nodes = new Map();
  const edges = [];
  if (!existsSync(GHOSTS)) return { nodes, edges, present: false };
  let g;
  try {
    g = readJSON(GHOSTS);
  } catch {
    return { nodes, edges, present: false };
  }
  const list = Array.isArray(g) ? g : Array.isArray(g.nodes) ? g.nodes : [];
  for (const n of list) {
    if (!n || !n.id) continue;
    nodes.set(String(n.id), {
      id: String(n.id),
      type: n.type || 'concept',
      family: n.family || 'ghost',
      slug: n.slug || String(n.id),
      title: n.title || String(n.id),
      tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
      file: n.file || GHOSTS.split(/[\\/]/).pop(),
      links: [],
      arxivRefs: n.arxiv_id ? [String(n.arxiv_id)] : [],
      ghost: true,
      design_idea: n.design_idea || '',
      self_evo_use: n.self_evo_use || '',
    });
  }
  const ghostEdges = Array.isArray(g.edges) ? g.edges : [];
  for (const e of ghostEdges) {
    if (!e || !(e.from || e.source) || !(e.to || e.target)) continue;
    edges.push({
      from: String(e.from || e.source),
      to: String(e.to || e.target),
      type: e.type || 'references',
      confidence: e.confidence,
      evidence: e.evidence || '来自 discovery-candidates.json',
      ghost: true,
    });
  }
  return { nodes, edges, present: true };
}

// ------------------------------------------------------------------
// build
// ------------------------------------------------------------------
export function buildBriefGraph() {
  const nodes = new Map();
  for (const [id, n] of readBriefWikiNodes()) nodes.set(id, n);
  for (const [id, n] of readPaperNodes()) nodes.set(id, n);
  const existingIds = new Set(nodes.keys());
  for (const [id, n] of readRadarNodes(existingIds)) if (!nodes.has(id)) nodes.set(id, n);
  const ghosts = readGhostNodes();
  for (const [id, n] of ghosts.nodes) if (!nodes.has(id)) nodes.set(id, n);

  const allNodes = [...nodes.values()];
  const resolver = makeWikilinkResolver(allNodes);

  // ---- 1. wikilink edges ----
  const wiki = buildWikilinkEdges(allNodes, resolver);

  // ---- 2. same_track edges (tag overlap) ----
  // brief-wiki content tags are coarse; paper tags are rich. Run over every
  // tagged node so cross-family (paper↔paper, project↔project) tracks surface.
  const sameTrack = buildSameTrackEdges(allNodes, { threshold: 2, perNodeCap: 6 });

  // ---- 3. implements edges (project → paper) ----
  const paperNodes = allNodes.filter((n) => n.family === 'paper');
  const projectNodes = allNodes.filter((n) => n.family === 'project' || n.radar);
  const implementsRes = buildImplementsEdges(projectNodes, paperNodes, { minTitleTokenOverlap: 2 });

  // ---- 4. authored focus-cluster typed edges ----
  const idSet = new Set(nodes.keys());
  const focusEdges = FOCUS_TYPED_EDGES.filter((e) => {
    const ok = idSet.has(e.from) && idSet.has(e.to);
    if (!ok) {
      console.warn(`[kg] focus edge skipped (missing node): ${e.from} -> ${e.to}`);
    }
    return ok;
  });

  // ---- assemble edges (dedupe by from|to|type) ----
  const edges = [];
  const seen = new Set();
  const pushAll = (list) => {
    for (const e of list) {
      const key = `${e.from}|${e.to}|${e.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(e);
    }
  };
  pushAll(focusEdges); // authored first (highest signal, wins dedupe)
  pushAll(implementsRes.edges);
  pushAll(wiki.edges);
  pushAll(sameTrack.edges);
  pushAll(ghosts.edges);

  // ---- adjacency + summary (shape parallel to brief/build.mjs buildGraph) ----
  const adjacency = edges.map((e) => ({ type: e.type, source: e.from, target: e.to, edge: e }));
  const edgeByType = {};
  for (const e of edges) edgeByType[e.type] = (edgeByType[e.type] || 0) + 1;
  const nodeByType = {};
  for (const n of allNodes) nodeByType[n.type] = (nodeByType[n.type] || 0) + 1;

  const out = {
    generatedAt: new Date().toISOString(),
    note: 'Unified associative-memory graph. Edges: references(wikilink)/same_track(tags)/implements(project↔paper)/builds_on·shares_method·same_use_case(authored focus clusters).',
    nodes: allNodes.map((n) => ({
      id: n.id,
      type: n.type,
      family: n.family,
      slug: n.slug,
      title: n.title,
      tags: n.tags || [],
      file: n.file,
      ...(n.arxiv_id ? { arxiv_id: n.arxiv_id } : {}),
      ...(n.topic ? { topic: n.topic } : {}),
      ...(n.url ? { url: n.url } : {}),
      ...(n.ghost ? { ghost: true } : {}),
      ...(n.radar ? { radar: true } : {}),
      ...(n.design_idea ? { design_idea: n.design_idea } : {}),
      ...(n.self_evo_use ? { self_evo_use: n.self_evo_use } : {}),
    })),
    edges,
    adjacency,
    summary: {
      nodes: allNodes.length,
      edges: edges.length,
      nodeByType,
      edgeByType,
      wikilinks: { resolved: wiki.resolved, unresolved: wiki.unresolved },
      focusTags: FOCUS_TAGS,
      ghostCandidates: ghosts.present ? ghosts.nodes.size : 0,
    },
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log('[kg] built brief/graph.json');
  console.log(`[kg] nodes: ${allNodes.length}`, nodeByType);
  console.log(`[kg] edges: ${edges.length}`, edgeByType);
  console.log(`[kg] wikilinks: resolved ${wiki.resolved}, unresolved ${wiki.unresolved}`);
  console.log(`[kg] focus typed edges: ${focusEdges.length} | ghost candidates: ${out.summary.ghostCandidates}`);
  return out;
}

if (process.argv[1] && pathResolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    buildBriefGraph();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}
