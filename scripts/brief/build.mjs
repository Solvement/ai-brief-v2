#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

import { ENTITIES, ENTITY_DIRS } from './loader.mjs';

const PROJECT_ROOT = path.resolve(
  fileURLToPath(new URL('../..', import.meta.url)),
);
const OUTPUT_ROOT = path.join(PROJECT_ROOT, 'public', 'data', 'brief');
const DATA_INSUFFICIENT = '数据不足';
const TEXT_SENTINELS = [DATA_INSUFFICIENT, '官方未披露', ''];

function normalizeEntries(value) {
  if (value instanceof Map) return Array.from(value.entries());
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.entries(value);
  return [];
}

function normalizeEntityNames(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === 'string') return entry;
      if (Array.isArray(entry)) return String(entry[0]);
      if (entry?.name) return String(entry.name);
      if (entry?.type) return String(entry.type);
      return String(entry);
    });
  }

  return normalizeEntries(value).map(([key, entry]) => {
    if (typeof entry === 'string') return key;
    return String(entry?.name ?? entry?.type ?? key);
  });
}

function normalizeEntityDirs(entityDirs, entities) {
  if (entityDirs instanceof Map || !Array.isArray(entityDirs)) {
    return normalizeEntries(entityDirs).map(([type, dir]) => {
      const normalizedDir = normalizeRelativePath(String(dir));
      return {
        type: String(type),
        dir: normalizedDir,
        outputName: outputNameForDir(normalizedDir, String(type)),
      };
    });
  }

  const entityNames = normalizeEntityNames(entities);

  return entityDirs.map((entry, index) => {
    if (Array.isArray(entry)) {
      const [type, dir] = entry;
      const normalizedDir = normalizeRelativePath(String(dir));
      return {
        type: String(type),
        dir: normalizedDir,
        outputName: outputNameForDir(normalizedDir, String(type)),
      };
    }

    if (entry && typeof entry === 'object') {
      const type = String(entry.type ?? entry.name ?? entityNames[index]);
      const normalizedDir = normalizeRelativePath(String(entry.dir ?? entry.path));
      return {
        type,
        dir: normalizedDir,
        outputName: outputNameForDir(normalizedDir, type),
      };
    }

    const type = String(entityNames[index] ?? entry);
    const normalizedDir = normalizeRelativePath(String(entry));
    return {
      type,
      dir: normalizedDir,
      outputName: outputNameForDir(normalizedDir, type),
    };
  });
}

function normalizeRelativePath(value) {
  return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function outputNameForDir(dir, type) {
  const name = dir || type;
  return name.split('/').filter(Boolean).join('-');
}

function slugFromFile(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function titleFromSlug(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseMarkdown(raw) {
  const normalized = raw.replace(/^\uFEFF/, '');

  if (!normalized.startsWith('---')) {
    return {
      meta: {},
      body: normalized,
      frontmatter: '',
    };
  }

  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

  if (!match) {
    return {
      meta: {},
      body: normalized,
      frontmatter: '',
    };
  }

  let meta;
  try {
    // Use the real YAML parser (consistent with wiki.mjs/loader.mjs) so nested
    // objects + list_object fields (claim_ledger, evidence_matrix, artifact_audit)
    // survive intact for the frontend. Fall back to the subset parser on error.
    meta = YAML.parse(match[1]) ?? {};
    if (typeof meta !== 'object' || Array.isArray(meta)) meta = parseYamlSubset(match[1]);
  } catch {
    meta = parseYamlSubset(match[1]);
  }

  return {
    meta,
    body: match[2],
    frontmatter: match[1],
  };
}

function parseYamlSubset(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (/^\s/.test(line)) continue;

    const match = line.match(/^([^:#][^:]*):(?:\s*(.*))?$/);
    if (!match) continue;

    const key = match[1].trim();
    const rawValue = match[2] ?? '';

    if (rawValue === '|' || rawValue === '>') {
      const block = [];
      while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || !lines[index + 1].trim())) {
        index += 1;
        block.push(lines[index].replace(/^\s{2}/, ''));
      }
      out[key] = rawValue === '>' ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n');
      continue;
    }

    if (rawValue !== '') {
      out[key] = parseYamlValue(rawValue);
      continue;
    }

    const list = [];
    const object = {};
    let sawList = false;
    let sawObject = false;

    while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || !lines[index + 1].trim())) {
      const next = lines[index + 1];

      if (!next.trim()) {
        index += 1;
        continue;
      }

      const listMatch = next.match(/^\s*-\s*(.*)$/);
      if (listMatch) {
        sawList = true;
        list.push(parseYamlValue(listMatch[1]));
        index += 1;
        continue;
      }

      const objectMatch = next.match(/^\s+([^:]+):(?:\s*(.*))?$/);
      if (objectMatch) {
        sawObject = true;
        object[objectMatch[1].trim()] = parseYamlValue(objectMatch[2] ?? '');
        index += 1;
        continue;
      }

      break;
    }

    out[key] = sawList ? list : sawObject ? object : null;
  }

  return out;
}

function parseYamlValue(rawValue) {
  const value = rawValue.trim();

  if (value === '') return '';
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitInlineYamlList(inner).map(parseYamlValue);
  }

  return value;
}

function splitInlineYamlList(value) {
  const parts = [];
  let current = '';
  let quote = null;
  let bracketDepth = 0;

  for (const char of value) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[' || char === '{') bracketDepth += 1;
    if (char === ']' || char === '}') bracketDepth -= 1;

    if (char === ',' && bracketDepth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractWikilinks(text) {
  const links = [];
  const regex = /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let match;

  while ((match = regex.exec(text))) {
    const target = normalizeRelativePath(match[1].trim());
    links.push({
      target,
      raw: match[0],
    });
  }

  return links;
}

function extractHeadings(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,6})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      depth: match[1].length,
      text: match[2].trim(),
    }));
}

function excerptFor(text) {
  const paragraph = text
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#'));

  if (!paragraph) return '';
  return paragraph.replace(/\s+/g, ' ').slice(0, 280);
}

function hasAuthoredText(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  return !TEXT_SENTINELS.some((sentinel) => sentinel && (text === sentinel || text.startsWith(`${sentinel}（`) || text.startsWith(`${sentinel}(`)));
}

function firstAuthoredText(...values) {
  return values.find(hasAuthoredText) || '';
}

function stripMarkdown(value = '') {
  return String(value)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, '$2')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}

function bodySection(body, headingPattern) {
  const normalized = String(body || '').replace(/\r\n/g, '\n');
  const regex = /^##\s+(.+)$/gm;
  let match;
  const headings = [];

  while ((match = regex.exec(normalized))) {
    headings.push({ title: match[1].trim(), start: match.index, contentStart: regex.lastIndex });
  }

  const index = headings.findIndex((heading) => headingPattern.test(heading.title));
  if (index === -1) return '';
  const end = headings[index + 1]?.start ?? normalized.length;
  return normalized.slice(headings[index].contentStart, end).trim();
}

function bulletTexts(section, limit = 3) {
  return String(section || '')
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map((line) => stripMarkdown(line).replace(/（来源：[^）]+）/g, '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function memoryCardValue(body, key) {
  const section = bodySection(body, /Memory card/i);
  const match = section.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'));
  return match ? stripMarkdown(match[1]) : '';
}

function spineBody(section = {}) {
  if (typeof section === 'string') return section.trim();
  if (!section || typeof section !== 'object') return '';
  return String(section.body_md || section.body || section.markdown || section.text || section.summary || '').trim();
}

function maturitySignalsFromAudit(meta = {}) {
  const audit = meta.artifact_audit || {};
  return {
    star_velocity: firstAuthoredText(audit.star_velocity, audit.stars_in_period) || DATA_INSUFFICIENT,
    recent_commit: firstAuthoredText(audit.recent_commit, audit.updated_at, audit.pushed_at) || DATA_INSUFFICIENT,
    releases: firstAuthoredText(audit.releases, audit.latest_release) || DATA_INSUFFICIENT,
    issue_activity: firstAuthoredText(audit.issue_activity, audit.open_issues) || DATA_INSUFFICIENT,
  };
}

function tierTemplateHasRenderGaps(template = {}) {
  return [
    template.pain_point,
    template.comparison,
    template.how_it_works_with_analogy,
    template.essential_design_difference,
    template.practitioner_meaning,
  ].some((value) => !hasAuthoredText(value));
}

function synthesizeDeepDiveTierTemplate(meta, body) {
  const existing = meta.tier_template && typeof meta.tier_template === 'object' ? meta.tier_template : {};
  if (Object.keys(existing).length && !tierTemplateHasRenderGaps(existing)) return existing;

  const positioning = bodySection(body, /大白话定位|一句话定位/);
  const whyHot = firstAuthoredText(bodySection(body, /为什么火|为什么值得看|解决什么痛点/), spineBody(meta.light_spine?.why_worth_attention));
  const tech = firstAuthoredText(bodySection(body, /技术拆解|它怎么工作|它怎么work|how it works/i), spineBody(meta.light_spine?.how_it_works));
  const value = firstAuthoredText(bodySection(body, /对我的价值|对从业者|意味着什么|判断/), spineBody(meta.light_spine?.judgment));
  const risk = bodySection(body, /风险/);
  const comparison = firstAuthoredText(
    existing.comparison,
    bodySection(body, /和同类|横向对比|comparison/i),
  );
  const reusable = firstAuthoredText(
    existing.essential_design_difference,
    memoryCardValue(body, 'architecture_pattern'),
    memoryCardValue(body, 'reusable_patterns'),
    spineBody(meta.light_spine?.reusable_abstractions),
    meta.reasoning_trace?.transfer_decision,
  );

  return {
    ...existing,
    tier: Number(existing.tier || 3),
    bucket: existing.bucket || '真·新项目',
    tag: existing.tag || `[Tier ${Number(existing.tier || 3)}｜${existing.bucket || '真·新项目'}]`,
    one_sentence_positioning: firstAuthoredText(existing.one_sentence_positioning, stripMarkdown(positioning).split(/\n\n/)[0], meta.reasoning_trace?.central_contribution) || DATA_INSUFFICIENT,
    what_it_does: firstAuthoredText(existing.what_it_does, meta.reasoning_trace?.central_contribution, stripMarkdown(positioning).split(/\n\n/)[0]) || DATA_INSUFFICIENT,
    metadata: existing.metadata || {},
    labels: existing.labels || [],
    pain_point: firstAuthoredText(existing.pain_point, whyHot) || DATA_INSUFFICIENT,
    core_capabilities: Array.isArray(existing.core_capabilities) && existing.core_capabilities.length
      ? existing.core_capabilities
      : [...bulletTexts(tech, 3), ...bulletTexts(whyHot, 3)].slice(0, 3),
    how_to_run: existing.how_to_run || {},
    maturity_signals: existing.maturity_signals || maturitySignalsFromAudit(meta),
    comparison: comparison || DATA_INSUFFICIENT,
    trajectory_note: firstAuthoredText(existing.trajectory_note, meta.reasoning_trace?.transfer_decision) || DATA_INSUFFICIENT,
    manual_confirmation: existing.manual_confirmation ?? true,
    how_it_works_with_analogy: firstAuthoredText(existing.how_it_works_with_analogy, tech) || DATA_INSUFFICIENT,
    essential_design_difference: reusable || DATA_INSUFFICIENT,
    practitioner_meaning: firstAuthoredText(existing.practitioner_meaning, value, risk, meta.project_verdict?.main_risk) || DATA_INSUFFICIENT,
    cross_links: existing.cross_links || [],
  };
}

function normalizeDeepDiveMeta(meta, body) {
  if (!meta || typeof meta !== 'object') return meta;
  const shouldSynthesize = meta.kind === 'deep-dive' && meta.project_type;
  if (!shouldSynthesize) return meta;
  return {
    ...meta,
    tier_template: synthesizeDeepDiveTierTemplate(meta, body),
  };
}

async function listMarkdownFiles(root) {
  let entries;

  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(root, entry.name);

      if (entry.isDirectory()) return listMarkdownFiles(entryPath);
      if (entry.isFile() && entry.name.endsWith('.md')) return [entryPath];
      return [];
    }),
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function readEntityFile(filePath, wikiRoot, entity) {
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseMarkdown(raw);
  const body = parsed.body;
  const baseSlug = String(parsed.meta.slug ?? slugFromFile(filePath));
  const meta = entity.type === 'deep-dive'
    ? normalizeDeepDiveMeta(parsed.meta, body)
    : parsed.meta;
  const slug = String(meta.slug ?? baseSlug);
  const file = normalizeRelativePath(path.relative(wikiRoot, filePath));

  return {
    id: String(meta.id ?? `${entity.type}/${slug}`),
    type: entity.type,
    slug,
    title: String(meta.title ?? titleFromSlug(slug)),
    file,
    directory: entity.dir,
    meta,
    body,
    excerpt: excerptFor(body),
    links: extractWikilinks(`${JSON.stringify(meta)}\n${body}`),
    headings: extractHeadings(body),
  };
}

async function readEntities(wikiRoot, entity) {
  const dir = path.join(wikiRoot, ...entity.dir.split('/').filter(Boolean));
  const files = await listMarkdownFiles(dir);
  const items = await Promise.all(
    files.map((filePath) => readEntityFile(filePath, wikiRoot, entity)),
  );

  return items.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function readEdges(wikiRoot) {
  const filePath = path.join(wikiRoot, 'graph', 'edges.jsonl');
  const raw = await readTextIfExists(filePath);

  return raw
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line && !line.startsWith('#'))
    .map(({ line, lineNumber }) => {
      try {
        return {
          ...JSON.parse(line),
          lineNumber,
        };
      } catch (error) {
        throw new Error(`${filePath}:${lineNumber}: invalid JSONL edge: ${error.message}`);
      }
    });
}

function endpointFor(edge, names) {
  for (const name of names) {
    if (edge[name] !== undefined) return edge[name];
  }

  return null;
}

function buildGraph(itemsByOutput, edges) {
  const nodes = Object.values(itemsByOutput)
    .flatMap(({ items }) => items)
    .map((item) => ({
      id: item.id,
      type: item.type,
      slug: item.slug,
      title: item.title,
      file: item.file,
    }));

  return {
    nodes,
    edges,
    adjacency: edges.map((edge) => ({
      type: edge.type ?? edge.edge_type ?? null,
      source: endpointFor(edge, ['source', 'from', 'left', 'a']),
      target: endpointFor(edge, ['target', 'to', 'right', 'b']),
      edge,
    })),
    summary: {
      nodes: nodes.length,
      edges: edges.length,
    },
  };
}

function parseTasteDocument(name, body) {
  return {
    name,
    body,
    excerpt: excerptFor(body),
    headings: extractHeadings(body),
    links: extractWikilinks(body),
  };
}

async function readTaste(wikiRoot) {
  const contextBrief = await readTextIfExists(path.join(wikiRoot, 'context-brief.md'));
  const gapMap = await readTextIfExists(path.join(wikiRoot, 'gap-map.md'));

  return {
    contextBrief: parseTasteDocument('context-brief', contextBrief),
    gapMap: parseTasteDocument('gap-map', gapMap),
  };
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function buildBriefData(wikiRootInput = 'brief-wiki') {
  const wikiRoot = path.resolve(process.cwd(), wikiRootInput);
  const generatedAt = new Date().toISOString();
  const entities = normalizeEntityDirs(ENTITY_DIRS, ENTITIES);

  await mkdir(OUTPUT_ROOT, { recursive: true });

  const itemsByOutput = {};

  for (const entity of entities) {
    const items = await readEntities(wikiRoot, entity);
    const payload = {
      generatedAt,
      entity: entity.type,
      directory: entity.dir,
      count: items.length,
      items,
    };

    itemsByOutput[entity.outputName] = payload;
    await writeJson(path.join(OUTPUT_ROOT, `${entity.outputName}.json`), payload);
  }

  const edges = await readEdges(wikiRoot);
  const graph = {
    generatedAt,
    ...buildGraph(itemsByOutput, edges),
  };
  await writeJson(path.join(OUTPUT_ROOT, 'graph.json'), graph);

  const taste = {
    generatedAt,
    ...(await readTaste(wikiRoot)),
  };
  await writeJson(path.join(OUTPUT_ROOT, 'taste.json'), taste);

  const index = {
    generatedAt,
    wikiRoot: normalizeRelativePath(path.relative(PROJECT_ROOT, wikiRoot)),
    namespace: 'public/data/brief',
    outputs: {
      ...Object.fromEntries(
        Object.entries(itemsByOutput).map(([name, payload]) => [
          name,
          {
            path: `brief/${name}.json`,
            entity: payload.entity,
            directory: payload.directory,
            count: payload.count,
          },
        ]),
      ),
      graph: {
        path: 'brief/graph.json',
        count: graph.summary.edges,
      },
      taste: {
        path: 'brief/taste.json',
        count: [taste.contextBrief.body, taste.gapMap.body].filter(Boolean).length,
      },
    },
    summary: {
      entities: Object.values(itemsByOutput).reduce((sum, payload) => sum + payload.count, 0),
      edges: graph.summary.edges,
    },
  };
  await writeJson(path.join(OUTPUT_ROOT, 'index.json'), index);

  return index;
}

const isCli = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isCli) {
  buildBriefData(process.argv[2] ?? 'brief-wiki').catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
