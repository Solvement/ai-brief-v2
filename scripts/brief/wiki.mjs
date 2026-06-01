#!/usr/bin/env node

import { existsSync } from 'node:fs';
import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';
import {
  ENTITY_DIRS,
  FIELD_DEFAULTS,
  REQUIRED_FIELDS,
  VALID_EDGE_TYPES,
  XREF,
  edgeIsSymmetric,
  edgeRequiresConfidence,
  slugRule,
  validateEdgeAttributes,
} from './loader.mjs';

const DEFAULT_WIKI_ROOT = 'brief-wiki';
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const DEFAULT_CONFIDENCE_VALUES = new Set(['low', 'medium', 'high']);

function usage() {
  return `Usage:
  node scripts/brief/wiki.mjs init [wiki-root]
  node scripts/brief/wiki.mjs slug <text>
  node scripts/brief/wiki.mjs read-meta <file>
  node scripts/brief/wiki.mjs set-meta <file> <key> <value> [--append]
  node scripts/brief/wiki.mjs add-edge [wiki-root] <from> <type> <to> [--confidence value] [--evidence value] [--note value] [--attr key=value]
  node scripts/brief/wiki.mjs rebuild-reverse-links [wiki-root]
  node scripts/brief/wiki.mjs log <wiki-root> <message>
  node scripts/brief/wiki.mjs rebuild-context-brief [wiki-root]
  node scripts/brief/wiki.mjs rebuild-gap-map [wiki-root]`;
}

function die(message) {
  console.error(message);
  process.exitCode = 1;
}

function nowIso() {
  return new Date().toISOString();
}

function titleize(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugPattern() {
  if (slugRule.pattern instanceof RegExp) return slugRule.pattern;
  if (typeof slugRule.pattern === 'string') return new RegExp(slugRule.pattern);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
}

function slug(text) {
  const separator = slugRule.separator ?? '-';
  const normalized = String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}+`, 'g'), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
  const value = slugRule.lowercase === false ? normalized : normalized.toLowerCase();
  const pattern = slugPattern();
  if (!pattern.test(value)) {
    throw new Error(`Slug does not match configured slug rule: ${value}`);
  }
  return value;
}

function wikiPath(root, ...parts) {
  return resolve(root, ...parts);
}

function ensureInsideWiki(root, path) {
  const wikiRoot = resolve(root);
  const target = resolve(path);
  if (target !== wikiRoot && !target.startsWith(`${wikiRoot}\\`) && !target.startsWith(`${wikiRoot}/`)) {
    throw new Error(`Path escapes wiki root: ${path}`);
  }
  return target;
}

function parseMarkdown(markdown) {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) return { meta: {}, body: markdown };
  return {
    meta: YAML.parse(match[1]) ?? {},
    body: markdown.slice(match[0].length),
  };
}

function stringifyMarkdown(meta, body) {
  return `---\n${YAML.stringify(meta).trimEnd()}\n---\n${body.startsWith('\n') ? body : `\n${body}`}`;
}

async function readMarkdown(file) {
  return parseMarkdown(await readFile(file, 'utf8'));
}

async function writeMarkdown(file, meta, body) {
  await writeFile(file, stringifyMarkdown(meta, body), 'utf8');
}

function defaultValueFor(field, kind, id) {
  if (field === 'id' || field === 'slug') return id;
  if (field === 'kind' || field === 'type') return kind;
  if (field === 'title') return titleize(id);
  if (field === 'aliases' || field === 'tags') return [];
  if (field === 'created' || field === 'updated') return nowIso();
  return null;
}

function defaultFrontmatter(kind, id) {
  const meta = {
    ...(FIELD_DEFAULTS[kind] ?? {}),
    id,
    kind,
    title: titleize(id),
  };

  for (const field of REQUIRED_FIELDS[kind] ?? []) {
    if (!Object.hasOwn(meta, field) || meta[field] == null) {
      meta[field] = defaultValueFor(field, kind, id);
    }
  }

  return meta;
}

async function writeIfMissing(file, content) {
  if (existsSync(file)) return false;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
  return true;
}

async function init(root = DEFAULT_WIKI_ROOT) {
  const wikiRoot = resolve(root);
  await mkdir(wikiRoot, { recursive: true });
  await mkdir(wikiPath(wikiRoot, 'graph'), { recursive: true });

  for (const dir of Object.values(ENTITY_DIRS)) {
    await mkdir(wikiPath(wikiRoot, dir), { recursive: true });
  }
  await mkdir(wikiPath(wikiRoot, ENTITY_DIRS.taste ?? 'taste'), { recursive: true });

  await writeIfMissing(
    wikiPath(wikiRoot, 'index.md'),
    '# BriefMem Wiki\n\n## Entry Points\n\n- [[taste/me|UserTaste]]\n\n## Graph\n\n- [Context brief](graph/context-brief.md)\n- [Gap map](graph/gap-map.md)\n',
  );
  await writeIfMissing(wikiPath(wikiRoot, 'log.md'), '# BriefMem Log\n\n');
  await writeIfMissing(wikiPath(wikiRoot, 'graph', 'edges.jsonl'), '');
  await writeIfMissing(wikiPath(wikiRoot, 'graph', 'context-brief.md'), '# Context Brief\n\nNo context built yet.\n');
  await writeIfMissing(wikiPath(wikiRoot, 'graph', 'gap-map.md'), '# Gap Map\n\nNo gap map built yet.\n');

  {
    const id = 'me';
    const tasteDir = ENTITY_DIRS.taste ?? 'taste';
    const frontmatter = {
      ...defaultFrontmatter('taste', id),
      title: 'UserTaste',
    };
    const seedBody = `## UserTaste Seed

- Prefer technically specific AI briefings that explain mechanisms, tradeoffs, and implementation consequences.
- Favor primary evidence, concrete artifacts, and reproducible claims over broad market commentary.
- Call out defects, uncertainty, and missing evidence directly.
- Keep summaries dense and useful for follow-up research, not promotional.
`;
    const tasteFile = wikiPath(wikiRoot, tasteDir, `${id}.md`);
    await writeIfMissing(tasteFile, stringifyMarkdown(frontmatter, seedBody));
  }

  console.log(`Initialized ${relative(process.cwd(), wikiRoot) || wikiRoot}`);
}

function parseValue(value) {
  try {
    return YAML.parse(value);
  } catch {
    return value;
  }
}

function setNested(target, key, value, append = false) {
  const parts = key.split('.');
  let cursor = target;
  while (parts.length > 1) {
    const part = parts.shift();
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }

  const finalKey = parts[0];
  if (append) {
    const current = cursor[finalKey];
    cursor[finalKey] = Array.isArray(current) ? [...current, value] : current == null ? [value] : [current, value];
    return;
  }

  cursor[finalKey] = value;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function guardWritableMetaFile(file) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.endsWith('/log.md') || normalized.includes('/graph/')) {
    throw new Error('log.md is append-only and graph/ is tool-only');
  }
}

async function readMeta(file) {
  const { meta } = await readMarkdown(file);
  console.log(JSON.stringify(meta, null, 2));
}

async function setMeta(file, key, rawValue, append = false) {
  guardWritableMetaFile(file);
  const { meta, body } = await readMarkdown(file);
  setNested(meta, key, parseValue(rawValue), append);
  await writeMarkdown(file, meta, body);
}

async function walkMarkdown(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git') continue;
        await walk(path);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path);
      }
    }
  }
  await walk(root);
  return files;
}

function canonicalFromMeta(root, file, meta) {
  const rel = relative(root, file).replace(/\\/g, '/').replace(/\.md$/, '');
  const kind = meta.kind ?? rel.split('/')[0];
  const id = meta.id ?? rel.split('/').at(-1);
  return `${kind}/${id}`;
}

async function noteIndex(root) {
  const index = new Map();
  const files = await walkMarkdown(root);
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, '/');
    if (rel === 'log.md' || rel.startsWith('graph/')) continue;
    const { meta } = await readMarkdown(file);
    const canonical = canonicalFromMeta(root, file, meta);
    index.set(canonical, { file, rel, meta, canonical });
    index.set(rel.replace(/\.md$/, ''), { file, rel, meta, canonical });
    if (meta.id) index.set(String(meta.id), { file, rel, meta, canonical });
  }
  return index;
}

async function resolveEndpoint(root, endpoint) {
  const index = await noteIndex(root);
  const normalized = endpoint.replace(/\\/g, '/').replace(/\.md$/, '');
  const match = index.get(normalized) ?? index.get(endpoint);
  if (match) return match;

  const direct = ensureInsideWiki(root, wikiPath(root, endpoint.endsWith('.md') ? endpoint : `${endpoint}.md`));
  if (existsSync(direct) && (await stat(direct)).isFile()) {
    const { meta } = await readMarkdown(direct);
    return {
      file: direct,
      rel: relative(root, direct).replace(/\\/g, '/'),
      meta,
      canonical: canonicalFromMeta(root, direct, meta),
    };
  }

  throw new Error(`Unknown endpoint: ${endpoint}`);
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const key = arg.slice(2);
    if (key === 'append') {
      flags.append = true;
      continue;
    }

    const next = argv[index + 1];
    if (next == null || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }

  return { positionals, flags };
}

function parseAttrFlags(argv) {
  const attrs = {};
  const rest = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--confidence' || arg === '--evidence' || arg === '--note') {
      attrs[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else if (arg === '--attr') {
      const [key, ...valueParts] = String(argv[index + 1] ?? '').split('=');
      attrs[key] = parseValue(valueParts.join('='));
      index += 1;
    } else {
      rest.push(arg);
    }
  }
  return { rest, attrs };
}

function validateConfidence(attrs) {
  if (attrs.confidence == null) return;
  const value = attrs.confidence;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 1) return;
  if (DEFAULT_CONFIDENCE_VALUES.has(String(value))) return;
  throw new Error(`Invalid confidence: ${value}`);
}

async function appendEdge(root, argv) {
  const { rest, attrs } = parseAttrFlags(argv);
  const [fromInput, type, toInput] = rest;
  if (!fromInput || !type || !toInput) throw new Error(usage());
  if (!VALID_EDGE_TYPES.includes(type)) throw new Error(`Unknown edge type: ${type}`);

  validateConfidence(attrs);
  if (edgeRequiresConfidence(type) && attrs.confidence == null) {
    throw new Error(`Edge type ${type} requires --confidence`);
  }

  let from = await resolveEndpoint(root, fromInput);
  let to = await resolveEndpoint(root, toInput);
  if (edgeIsSymmetric(type) && from.canonical.localeCompare(to.canonical) > 0) {
    [from, to] = [to, from];
  }

  validateEdgeAttributes(type, attrs);

  const edge = {
    from: from.canonical,
    type,
    to: to.canonical,
    ...attrs,
    created: nowIso(),
  };

  const graphFile = wikiPath(root, 'graph', 'edges.jsonl');
  await appendFile(graphFile, `${JSON.stringify(edge)}\n`, 'utf8');
  console.log(JSON.stringify(edge));
}

async function readEdges(root) {
  const file = wikiPath(root, 'graph', 'edges.jsonl');
  if (!existsSync(file)) return [];
  const text = await readFile(file, 'utf8');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function reverseLinkSections(kind) {
  const source = XREF.reverse_links ?? XREF.sections ?? XREF.xref ?? XREF;
  const specs = source[kind] ?? source[`${kind}s`];
  if (Array.isArray(specs)) return specs.map(normalizeReverseSpec);
  if (isPlainObject(specs)) {
    return Object.entries(specs).map(([heading, spec]) => normalizeReverseSpec({ heading, ...spec }));
  }

  if (kind === 'content') {
    return ['Methods', 'Concepts', 'Components', 'Claims', 'Evidence', 'Artifacts', 'Principles'].map((heading) =>
      normalizeReverseSpec({ heading, kind: heading.toLowerCase().replace(/s$/, '') }),
    );
  }

  return [];
}

function normalizeReverseSpec(spec) {
  const heading = spec.heading ?? spec.title ?? spec.name;
  return {
    heading,
    otherKind: spec.kind ?? spec.from_kind ?? spec.to_kind ?? spec.entity ?? spec.target_kind,
    edgeTypes: asList(spec.edge_types ?? spec.edges ?? spec.types ?? spec.edge),
  };
}

function asList(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function noteKind(endpoint) {
  return String(endpoint).split('/')[0];
}

function edgeMatchesSpec(edge, note, spec) {
  const touches = edge.from === note.canonical || edge.to === note.canonical;
  if (!touches) return false;
  if (spec.edgeTypes.length > 0 && !spec.edgeTypes.includes(edge.type)) return false;
  const other = edge.from === note.canonical ? edge.to : edge.from;
  if (spec.otherKind && noteKind(other) !== spec.otherKind) return false;
  return true;
}

function renderReverseItems(edges, note, spec, index) {
  const lines = edges
    .filter((edge) => edgeMatchesSpec(edge, note, spec))
    .map((edge) => {
      const other = edge.from === note.canonical ? edge.to : edge.from;
      const otherNote = index.get(other);
      const label = otherNote?.meta?.title ?? titleize(other.split('/').at(-1));
      const target = otherNote?.rel?.replace(/\.md$/, '') ?? other;
      const attrs = [edge.type, edge.confidence ? `confidence: ${edge.confidence}` : null, edge.evidence ? `evidence: ${edge.evidence}` : null]
        .filter(Boolean)
        .join('; ');
      return `- [[${target}|${label}]]${attrs ? ` (${attrs})` : ''}`;
    });

  return lines.length > 0 ? lines.join('\n') : '- None yet.';
}

function replaceSection(body, heading, content) {
  const section = `## ${heading}\n\n${content.trimEnd()}\n`;
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^## ${escaped}\\s*\\r?\\n)[\\s\\S]*?(?=^##\\s+|(?![\\s\\S]))`, 'm');
  if (pattern.test(body)) return body.replace(pattern, section);
  return `${body.trimEnd()}\n\n${section}`;
}

async function rebuildReverseLinks(root = DEFAULT_WIKI_ROOT) {
  const wikiRoot = resolve(root);
  const index = await noteIndex(wikiRoot);
  const edges = await readEdges(wikiRoot);

  for (const note of new Map([...index.values()].map((entry) => [entry.file, entry])).values()) {
    const kind = note.meta.kind ?? note.rel.split('/')[0];
    const specs = reverseLinkSections(kind).filter((spec) => spec.heading);
    if (specs.length === 0) continue;

    const { meta, body } = await readMarkdown(note.file);
    let nextBody = body;
    for (const spec of specs) {
      nextBody = replaceSection(nextBody, spec.heading, renderReverseItems(edges, note, spec, index));
    }
    await writeMarkdown(note.file, meta, nextBody);
  }
}

async function appendLog(root, message) {
  const file = wikiPath(root, 'log.md');
  await appendFile(file, `- ${nowIso()} ${message}\n`, 'utf8');
}

async function rebuildContextBrief(root = DEFAULT_WIKI_ROOT) {
  const wikiRoot = resolve(root);
  const index = await noteIndex(wikiRoot);
  const edges = await readEdges(wikiRoot);
  const notes = [...new Map([...index.values()].map((entry) => [entry.file, entry])).values()]
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
  const byKind = new Map();
  for (const note of notes) {
    const kind = note.meta.kind ?? note.canonical.split('/')[0];
    byKind.set(kind, [...(byKind.get(kind) ?? []), note]);
  }

  const sections = [
    '# Context Brief',
    '',
    `Generated: ${nowIso()}`,
    '',
    `Edges: ${edges.length}`,
    '',
  ];

  for (const [kind, kindNotes] of byKind) {
    sections.push(`## ${titleize(kind)}`, '');
    for (const note of kindNotes) {
      sections.push(`- [[${note.rel.replace(/\.md$/, '')}|${note.meta.title ?? note.canonical}]]`);
    }
    sections.push('');
  }

  await writeFile(wikiPath(wikiRoot, 'graph', 'context-brief.md'), sections.join('\n'), 'utf8');
}

async function rebuildGapMap(root = DEFAULT_WIKI_ROOT) {
  const wikiRoot = resolve(root);
  const index = await noteIndex(wikiRoot);
  const notes = [...new Map([...index.values()].map((entry) => [entry.file, entry])).values()]
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
  const lines = ['# Gap Map', '', `Generated: ${nowIso()}`, ''];
  let gapCount = 0;

  for (const note of notes) {
    const kind = note.meta.kind ?? note.canonical.split('/')[0];
    const missing = (REQUIRED_FIELDS[kind] ?? []).filter((field) => note.meta[field] == null || note.meta[field] === '');
    if (missing.length === 0) continue;
    gapCount += missing.length;
    lines.push(`- [[${note.rel.replace(/\.md$/, '')}|${note.meta.title ?? note.canonical}]] missing ${missing.join(', ')}`);
  }

  if (gapCount === 0) lines.push('No required-field gaps detected.');
  lines.push('');
  await writeFile(wikiPath(wikiRoot, 'graph', 'gap-map.md'), lines.join('\n'), 'utf8');
}

async function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    return;
  }

  if (command === 'init') return init(rest[0] ?? DEFAULT_WIKI_ROOT);
  if (command === 'slug') {
    console.log(slug(rest.join(' ')));
    return;
  }
  if (command === 'read-meta') return readMeta(rest[0]);
  if (command === 'set-meta') {
    const { positionals, flags } = parseArgs(rest);
    return setMeta(positionals[0], positionals[1], positionals.slice(2).join(' '), Boolean(flags.append));
  }
  if (command === 'add-edge') {
    const hasExplicitRoot = !VALID_EDGE_TYPES.includes(rest[1]) && VALID_EDGE_TYPES.includes(rest[2]);
    const root = hasExplicitRoot ? rest[0] : DEFAULT_WIKI_ROOT;
    const edgeArgs = hasExplicitRoot ? rest.slice(1) : rest;
    return appendEdge(resolve(root), edgeArgs);
  }
  if (command === 'rebuild-reverse-links') return rebuildReverseLinks(rest[0] ?? DEFAULT_WIKI_ROOT);
  if (command === 'log') {
    const [root, ...message] = rest;
    return appendLog(resolve(root ?? DEFAULT_WIKI_ROOT), message.join(' '));
  }
  if (command === 'rebuild-context-brief') return rebuildContextBrief(rest[0] ?? DEFAULT_WIKI_ROOT);
  if (command === 'rebuild-gap-map') return rebuildGapMap(rest[0] ?? DEFAULT_WIKI_ROOT);

  throw new Error(`Unknown command: ${command}\n${usage()}`);
}

// Ergonomic programmatic edge writer for tests and BriefFlow stages.
// Wraps the CLI-oriented appendEdge (which takes a from/type/to argv array).
async function addEdge(root, { from, to, type, confidence, evidence, note } = {}) {
  const argv = [from, type, to];
  if (confidence != null) argv.push('--confidence', String(confidence));
  if (evidence != null) argv.push('--evidence', String(evidence));
  if (note != null) argv.push('--note', String(note));
  return appendEdge(resolve(root), argv);
}

export {
  init,
  slug,
  readMeta,
  setMeta,
  appendEdge,
  addEdge,
  appendLog,
  appendLog as log,
  rebuildReverseLinks,
  rebuildContextBrief,
  rebuildGapMap,
  wikiPath,
};

// Only run the CLI when invoked directly (not when imported by tests/stages).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((error) => die(error.message));
}
