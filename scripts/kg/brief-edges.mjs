// scripts/kg/brief-edges.mjs
// ------------------------------------------------------------------
// EDGE ENGINE for the unified Brief knowledge graph (Kevin 2026-06-09).
// Pure, side-effect-free edge builders so they can be unit-tested with
// fixture nodes. The runner (build-brief-graph.mjs) wires real data in.
//
// Edge layers (see docs/superpowers/specs/2026-06-09-KG-associative-memory-design.md):
//   1. wikilinks   — deterministic [[target]] -> references edge
//   2. same_track  — deterministic >=2 shared tags
//   3. implements  — project mentions a paper's arXiv id, or strong title match
//   (typed focus-cluster edges are authored by the runner, not here)
//
// NO-FABRICATION: unresolved wikilink targets are skipped, never turned
// into broken edges (a lint RED).
// ------------------------------------------------------------------

// ---- wikilink target → node-id resolution -------------------------

// brief-wiki dir prefix → graph node-id type prefix
export const DIR_TO_TYPE = {
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

const WIKILINK_RE = /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
const ARXIV_RE = /\b(\d{4}\.\d{4,5})(?:v\d+)?\b/g;

function normalizeTarget(raw) {
  return String(raw).trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

/** Extract every [[wikilink]] target (normalized) from a text blob. */
export function extractWikilinkTargets(text) {
  const out = [];
  let m;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(String(text)))) out.push(normalizeTarget(m[1]));
  return out;
}

/** Extract distinct arXiv ids (NNNN.NNNNN, version stripped) from text. */
export function extractArxivIds(text) {
  const ids = new Set();
  let m;
  ARXIV_RE.lastIndex = 0;
  while ((m = ARXIV_RE.exec(String(text)))) ids.add(m[1]);
  return [...ids];
}

/**
 * Build a resolver from the node set. Resolves a wikilink target string to an
 * existing node id, or null if it cannot be resolved (caller skips nulls).
 *   - "dir/slug"  → `${DIR_TO_TYPE[dir]}/slug` when that node id exists
 *   - bare "slug" → unique node whose slug matches (e.g. taste/me → id "me")
 */
export function makeWikilinkResolver(nodes) {
  const ids = new Set(nodes.map((n) => n.id));
  const slugIndex = new Map();
  for (const n of nodes) {
    const key = n.slug ?? n.id;
    if (!slugIndex.has(key)) slugIndex.set(key, []);
    slugIndex.get(key).push(n.id);
  }
  return (rawTarget) => {
    const target = normalizeTarget(rawTarget);
    if (!target) return null;
    if (ids.has(target)) return target; // already a node id
    if (target.includes('/')) {
      const slash = target.indexOf('/');
      const dir = target.slice(0, slash);
      const rest = target.slice(slash + 1);
      const type = DIR_TO_TYPE[dir];
      if (type) {
        const id = `${type}/${rest}`;
        if (ids.has(id)) return id;
      }
      // dir/slug where the slug alone is unique (e.g. taste/me → id "me")
      const bare = slugIndex.get(rest);
      if (bare && bare.length === 1) return bare[0];
      return null;
    }
    const cands = slugIndex.get(target);
    if (cands && cands.length === 1) return cands[0];
    return null;
  };
}

// ---- 1. wikilink edges --------------------------------------------

/**
 * @param {Array<{id,links?:string[]}>} sources nodes carrying raw wikilink targets
 * @param {(t:string)=>string|null} resolve
 * @returns {{edges:Array, resolved:number, unresolved:number}}
 */
export function buildWikilinkEdges(sources, resolve) {
  const edges = [];
  const seen = new Set();
  let resolved = 0;
  let unresolved = 0;
  for (const src of sources) {
    const file = src.file || src.id;
    for (const rawTarget of src.links || []) {
      const to = resolve(rawTarget);
      if (!to) {
        unresolved += 1;
        continue;
      }
      resolved += 1;
      if (to === src.id) continue; // no self-loops
      const key = `${src.id}->${to}`;
      if (seen.has(key)) continue; // dedupe repeated links
      seen.add(key);
      edges.push({
        from: src.id,
        to,
        type: 'references',
        evidence: `链接出现在 ${file}`,
      });
    }
  }
  return { edges, resolved, unresolved };
}

// ---- 2. same_track edges (tag overlap) ----------------------------

const GENERIC_TAGS = new Set([
  'agent',
  'agents',
  'survey',
  'benchmark',
  'evaluation',
  'breadth',
  'agent-framework',
  'project',
  'skills',
  'models',
  'python',
  'cli',
  'docs',
  'typescript',
  'javascript',
  'deep',
  'tier-1',
  'tier-2',
  'tier-3',
  'mcp',
  'shell',
  'rust',
  'java',
  'analysis',
]);

/**
 * Two nodes sharing >= threshold MEANINGFUL tags → symmetric same_track edge.
 * Capped per node (topK by overlap) to avoid an explosion.
 * @param {Array<{id,tags?:string[]}>} nodes
 */
export function buildSameTrackEdges(nodes, { threshold = 2, perNodeCap = 6 } = {}) {
  const tagged = nodes
    .map((n) => ({ id: n.id, tags: (n.tags || []).filter((t) => !GENERIC_TAGS.has(t)) }))
    .filter((n) => n.tags.length);
  const tagSets = new Map(tagged.map((n) => [n.id, new Set(n.tags)]));

  // candidate pairs with their shared tags
  const candidates = [];
  for (let i = 0; i < tagged.length; i += 1) {
    for (let j = i + 1; j < tagged.length; j += 1) {
      const a = tagged[i];
      const b = tagSets.get(tagged[j].id);
      const shared = a.tags.filter((t) => b.has(t));
      if (shared.length >= threshold) {
        candidates.push({ a: a.id, b: tagged[j].id, shared, weight: shared.length });
      }
    }
  }
  candidates.sort((x, y) => y.weight - x.weight);

  // enforce per-node cap
  const degree = new Map();
  const edges = [];
  const seen = new Set();
  for (const c of candidates) {
    const da = degree.get(c.a) || 0;
    const db = degree.get(c.b) || 0;
    if (da >= perNodeCap || db >= perNodeCap) continue;
    const [from, to] = c.a < c.b ? [c.a, c.b] : [c.b, c.a];
    const key = `${from}|${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    degree.set(c.a, da + 1);
    degree.set(c.b, db + 1);
    edges.push({
      from,
      to,
      type: 'same_track',
      confidence: c.weight >= 3 ? 'high' : 'medium',
      evidence: `共享标签 ${c.shared.slice(0, 4).join('、')}`,
      weight: c.weight,
    });
  }
  return { edges };
}

// ---- 3. implements edges (project → paper) ------------------------

// English/title stopwords + over-generic tech words that must NOT count as a
// distinctive title match (otherwise "for/and/code/model" create false edges).
const TITLE_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'via', 'using', 'into', 'onto', 'towards', 'toward',
  'learning', 'language', 'model', 'models', 'agent', 'agents', 'agentic', 'llm', 'llms',
  'code', 'coding', 'framework', 'system', 'systems', 'method', 'methods', 'based', 'approach',
  'task', 'tasks', 'data', 'scale', 'scaling', 'survey', 'benchmark', 'evaluation', 'multi',
  'deep', 'long', 'context', 'reasoning', 'training', 'efficient', 'large', 'small', 'new',
]);

function slugTokens(s) {
  return new Set(
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((t) => t.length >= 3),
  );
}

/** distinctive tokens = real, non-stopword title tokens that can anchor a match */
function distinctiveTokens(s) {
  return new Set([...slugTokens(s)].filter((t) => !TITLE_STOPWORDS.has(t)));
}

/**
 * A project node whose text mentions a paper's arXiv id → implements edge.
 * Falls back to a strong title/slug token-overlap match (>=2 distinctive tokens).
 * @param {Array<{id,type,arxivRefs?:string[],title?,slug?}>} projects
 * @param {Array<{id,type,arxiv_id?,title?,slug?}>} papers
 */
export function buildImplementsEdges(projects, papers, { minTitleTokenOverlap = 2 } = {}) {
  const paperByArxiv = new Map();
  for (const p of papers) {
    if (p.arxiv_id) paperByArxiv.set(String(p.arxiv_id), p);
  }
  const paperTokens = papers.map((p) => ({
    node: p,
    tokens: distinctiveTokens(`${p.title || ''} ${p.slug || ''}`),
  }));

  const edges = [];
  const seen = new Set();
  const emit = (from, to, evidence, confidence) => {
    const key = `${from}->${to}`;
    if (seen.has(key) || from === to) return;
    seen.add(key);
    edges.push({ from, to, type: 'implements', confidence, evidence });
  };

  for (const proj of projects) {
    // a) explicit arXiv id reference (highest confidence)
    for (const ref of proj.arxivRefs || []) {
      const paper = paperByArxiv.get(String(ref));
      if (paper) emit(proj.id, paper.id, `${proj.title || proj.slug || proj.id} 的深读/源码提及 arXiv:${ref}`, 'high');
    }
    // b) strong title/slug token overlap on DISTINCTIVE (non-stopword) tokens
    const pt = distinctiveTokens(`${proj.title || ''} ${proj.slug || ''}`);
    if (pt.size < minTitleTokenOverlap) continue;
    for (const cand of paperTokens) {
      if (seen.has(`${proj.id}->${cand.node.id}`)) continue;
      const overlap = [...pt].filter((t) => cand.tokens.has(t));
      if (overlap.length >= minTitleTokenOverlap) {
        emit(
          proj.id,
          cand.node.id,
          `项目与论文标题强匹配:${overlap.slice(0, 3).join('、')}`,
          'medium',
        );
      }
    }
  }
  return { edges };
}

export { GENERIC_TAGS };
