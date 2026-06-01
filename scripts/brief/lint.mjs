#!/usr/bin/env node

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  ENTITIES,
  ENTITY_DIRS,
  REQUIRED_FIELDS,
  FIELD_DEFAULTS,
  VALID_VALUES,
  LIFECYCLE,
  EDGES,
  VALID_EDGE_TYPES,
  edgeIsSymmetric,
  edgeRequiresConfidence,
  XREF,
  CONVENTIONS,
  slugRule,
  validateEdgeAttributes,
} from './loader.mjs';

const LEVELS = ['RED', 'YELLOW', 'BLUE'];
const LEVEL_WEIGHT = new Map(LEVELS.map((level, index) => [level, index]));

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  '.cache',
  '.turbo',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

const OFFICIAL_REPO_FIELDS = [
  'official_repo',
  'official_repos',
  'official_repository',
  'official_repositories',
  'repo_official',
  'repository_official',
];

const PRIMARY_SOURCE_FIELDS = ['primary_source', 'primary_sources'];
const DISCOVERY_SOURCE_FIELDS = ['discovery_source', 'discovery_sources'];
const EVIDENCE_FIELDS = [
  'evidence',
  'evidence_ref',
  'evidence_refs',
  'evidence_pack',
  'evidence_packs',
  'source_pointer',
  'source_pointers',
  'runnable_evidence',
  'run_evidence',
  'verification',
  'artifact_audit',
  'audit',
  'provenance',
];
const COMMON_REF_FIELDS = [
  'links',
  'related',
  'related_pages',
  'concept',
  'concepts',
  'method',
  'methods',
  'artifact',
  'artifacts',
  'source',
  'sources',
  'source_pack',
  'source_packs',
  'evidence_pack',
  'evidence_packs',
  'claim',
  'claims',
  ...OFFICIAL_REPO_FIELDS,
  ...PRIMARY_SOURCE_FIELDS,
  ...DISCOVERY_SOURCE_FIELDS,
];
const SHARED_CONTENT_FIELDS = [
  // BriefMem join fields: funnel entities link to content via `content`;
  // knowledge entities link to content via these list_link fields.
  'content',
  'related_content',
  'used_by_content',
  'first_seen_in',
  'seen_in',
  'derived_from',
  'source_url',
  'url',
  'canonical_url',
  'content_url',
  'content_hash',
  'source_id',
  'source_pack',
  'source_pack_slug',
  'origin_slug',
  'content_slug',
  'deep_dive',
  'deep_dive_slug',
];

function parseArgs(argv) {
  const args = {
    root: null,
    json: false,
    fix: false,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      args.json = true;
    } else if (arg === '--fix') {
      args.fix = true;
    } else if (!args.root) {
      args.root = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  args.root = path.resolve(args.root ?? process.cwd());
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const context = await loadWiki(args.root);
  const issues = [];

  lintStructural(context, issues, args);
  lintBriefMemGuardRules(context, issues);

  const sortedIssues = sortIssues(issues);
  if (args.fix) {
    await writeDirtyPages(context);
  }

  const result = {
    summary: summarizeIssues(sortedIssues),
    issues: sortedIssues,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printTextResult(result);
  }

  if (!args.fix && result.summary.red > 0) {
    process.exitCode = 1;
  }
}

async function loadWiki(root) {
  const files = await walkMarkdownFiles(root);
  const pages = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const parsed = parseMarkdown(content);
    const rel = toPosix(path.relative(root, file));
    const kind = inferKind(rel, parsed.frontmatter);
    const slug = normalizeSlugRef(
      firstValue(
        parsed.frontmatter.slug,
        parsed.frontmatter.id,
        parsed.frontmatter.slug_id,
        path.basename(file, path.extname(file)),
      ),
    );

    pages.push({
      absPath: file,
      relPath: rel,
      originalContent: content,
      frontmatter: parsed.frontmatter,
      frontmatterOrder: parsed.frontmatterOrder,
      hadFrontmatter: parsed.hadFrontmatter,
      body: parsed.body,
      kind,
      slug,
      dirty: false,
    });
  }

  const slugMap = new Map();
  const duplicateSlugs = new Map();

  for (const page of pages) {
    for (const alias of pageAliases(page)) {
      const normalized = normalizeSlugRef(alias);
      if (!normalized) continue;
      if (slugMap.has(normalized) && slugMap.get(normalized) !== page) {
        if (!duplicateSlugs.has(normalized)) duplicateSlugs.set(normalized, new Set());
        duplicateSlugs.get(normalized).add(slugMap.get(normalized));
        duplicateSlugs.get(normalized).add(page);
        continue;
      }
      slugMap.set(normalized, page);
    }
  }

  const incoming = new Map(pages.map((page) => [page.slug, new Set()]));
  const outgoing = new Map(pages.map((page) => [page.slug, new Set()]));

  for (const page of pages) {
    for (const ref of pageOutgoingRefs(page)) {
      if (!ref || ref === page.slug) continue;
      outgoing.get(page.slug)?.add(ref);
      const target = slugMap.get(ref);
      if (target) incoming.get(target.slug)?.add(page.slug);
    }
  }

  return {
    root,
    pages,
    slugMap,
    duplicateSlugs,
    incoming,
    outgoing,
    xrefRules: normalizeXrefRules(XREF),
    validEdgeTypes: collectValidEdgeTypes(),
    graphEdges: await loadGraphEdges(root),
  };
}

// The canonical edge store is graph/edges.jsonl (conventions.yaml::edge_storage),
// written by scripts/brief/wiki.mjs add-edge. Parse it for lintGraphEdges.
async function loadGraphEdges(root) {
  const file = path.join(root, 'graph', 'edges.jsonl');
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return [];
  }
  const out = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      out.push({ lineNo: index + 1, edge: JSON.parse(trimmed) });
    } catch {
      out.push({ lineNo: index + 1, parseError: true, raw: trimmed });
    }
  });
  return out;
}

async function walkMarkdownFiles(root) {
  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  await walk(root);
  return files;
}

function parseMarkdown(content) {
  if (!content.startsWith('---')) {
    return {
      frontmatter: {},
      frontmatterOrder: [],
      body: content,
      hadFrontmatter: false,
    };
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) {
    return {
      frontmatter: {},
      frontmatterOrder: [],
      body: content,
      hadFrontmatter: false,
    };
  }

  const frontmatterText = match[1];
  const frontmatter = parseYaml(frontmatterText);
  return {
    frontmatter: frontmatter.value,
    frontmatterOrder: frontmatter.order,
    body: content.slice(match[0].length),
    hadFrontmatter: true,
  };
}

function parseYaml(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const parsed = parseYamlObject(lines, 0, 0);
  return {
    value: parsed.value,
    order: parsed.order,
  };
}

function parseYamlObject(lines, start, indent) {
  const value = {};
  const order = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (isBlankOrComment(line)) {
      index += 1;
      continue;
    }

    const currentIndent = countIndent(line);
    if (currentIndent < indent) break;
    if (currentIndent > indent) {
      index += 1;
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) break;

    const pair = splitYamlPair(trimmed);
    if (!pair) {
      index += 1;
      continue;
    }

    order.push(pair.key);
    if (pair.rawValue === '') {
      const nested = parseYamlNested(lines, index + 1, indent + 2);
      value[pair.key] = nested.value;
      index = nested.next;
    } else {
      value[pair.key] = parseYamlScalar(pair.rawValue);
      index += 1;
    }
  }

  return { value, order, next: index };
}

function parseYamlNested(lines, start, indent) {
  let index = start;
  while (index < lines.length && isBlankOrComment(lines[index])) index += 1;
  if (index >= lines.length || countIndent(lines[index]) < indent) {
    return { value: {}, next: start };
  }

  if (lines[index].slice(countIndent(lines[index])).startsWith('- ')) {
    return parseYamlArray(lines, index, countIndent(lines[index]));
  }

  return parseYamlObject(lines, index, countIndent(lines[index]));
}

function parseYamlArray(lines, start, indent) {
  const value = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (isBlankOrComment(line)) {
      index += 1;
      continue;
    }

    const currentIndent = countIndent(line);
    if (currentIndent < indent) break;
    if (currentIndent > indent) {
      index += 1;
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) break;

    const itemText = trimmed.slice(2).trim();
    if (itemText === '') {
      const nested = parseYamlNested(lines, index + 1, indent + 2);
      value.push(nested.value);
      index = nested.next;
      continue;
    }

    const pair = splitYamlPair(itemText);
    if (pair) {
      const item = {};
      item[pair.key] = pair.rawValue === '' ? {} : parseYamlScalar(pair.rawValue);

      const continuation = parseYamlObject(lines, index + 1, indent + 2);
      Object.assign(item, continuation.value);
      value.push(item);
      index = continuation.next;
      continue;
    }

    value.push(parseYamlScalar(itemText));
    index += 1;
  }

  return { value, next: index };
}

function splitYamlPair(text) {
  const match = text.match(/^([^:#][^:]*):(?:\s*(.*))?$/);
  if (!match) return null;
  return {
    key: match[1].trim(),
    rawValue: match[2] ?? '',
  };
}

function parseYamlScalar(raw) {
  const value = stripYamlComment(raw.trim());
  if (value === '') return '';
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
  if (/^(null|~)$/i.test(value)) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);

  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitInlineList(inner).map(parseYamlScalar);
  }

  if (value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};
    const object = {};
    for (const part of splitInlineList(inner)) {
      const pair = splitYamlPair(part.trim());
      if (pair) object[pair.key] = parseYamlScalar(pair.rawValue);
    }
    return object;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return unquote(value);
  }

  return value;
}

function stripYamlComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
    }
    if (!quote && char === '#' && /\s/.test(value[index - 1] ?? ' ')) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value;
}

function splitInlineList(value) {
  const parts = [];
  let current = '';
  let quote = null;
  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
    } else if (!quote && (char === '[' || char === '{')) {
      depth += 1;
    } else if (!quote && (char === ']' || char === '}')) {
      depth -= 1;
    }

    if (!quote && depth === 0 && char === ',') {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function unquote(value) {
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value.slice(1, -1).replace(/''/g, "'");
}

function isBlankOrComment(line) {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('#');
}

function countIndent(line) {
  const match = line.match(/^[ \t]*/);
  return match ? match[0].replace(/\t/g, '  ').length : 0;
}

function lintStructural(context, issues, args) {
  lintDuplicateSlugs(context, issues);
  lintBrokenWikilinks(context, issues);
  lintOrphans(context, issues);
  lintRequiredFields(context, issues, args);
  lintValueValidators(context, issues);
  lintEdges(context, issues);
  lintGraphEdges(context, issues);
  lintXrefs(context, issues, args);
}

function lintDuplicateSlugs(context, issues) {
  for (const [slug, pages] of context.duplicateSlugs.entries()) {
    for (const page of pages) {
      addIssue(issues, {
        level: 'RED',
        category: 'structural',
        file: page.relPath,
        message: `Duplicate slug or alias "${slug}" makes wiki references ambiguous.`,
        fixable: false,
      });
    }
  }
}

function lintBrokenWikilinks(context, issues) {
  for (const page of context.pages) {
    for (const ref of extractWikilinks(page.originalContent)) {
      if (!context.slugMap.has(ref)) {
        addIssue(issues, {
          level: 'RED',
          category: 'structural',
          file: page.relPath,
          message: `Broken wikilink [[${ref}]].`,
          fixable: false,
        });
      }
    }
  }
}

function lintOrphans(context, issues) {
  for (const page of context.pages) {
    if (!page.slug || !isEntityPage(page) || isIndexLikePage(page)) continue;
    const incoming = context.incoming.get(page.slug);
    if (incoming && incoming.size === 0) {
      addIssue(issues, {
        level: 'YELLOW',
        category: 'structural',
        file: page.relPath,
        message: `Orphan page "${page.slug}" has no incoming wiki, edge, or xref references.`,
        fixable: false,
      });
    }
  }
}

function lintRequiredFields(context, issues, args) {
  for (const page of context.pages) {
    if (!page.kind) continue;

    const required = requiredFieldSpecsFor(page.kind);
    for (const spec of required) {
      if (!spec.field) continue;
      if (spec.when && !conditionMatches(page.frontmatter, spec.when)) continue;
      if (hasFieldValue(page.frontmatter, spec.field)) continue;

      const defaultValue = defaultForField(page.kind, spec.field);
      const fixable = defaultValue !== undefined;

      addIssue(issues, {
        level: 'RED',
        category: 'schema',
        file: page.relPath,
        message: `Missing required field "${spec.field}" for ${page.kind}.`,
        fixable,
      });

      if (args.fix && fixable) {
        setFieldValue(page.frontmatter, spec.field, cloneValue(defaultValue), page.frontmatterOrder);
        markDirty(page);
      }
    }

    for (const spec of requiredWhenSpecsFor(page.kind)) {
      if (!spec.field || !conditionMatches(page.frontmatter, spec.when)) continue;
      if (hasFieldValue(page.frontmatter, spec.field)) continue;

      const defaultValue = defaultForField(page.kind, spec.field);
      const fixable = defaultValue !== undefined;
      addIssue(issues, {
        level: 'RED',
        category: 'schema',
        file: page.relPath,
        message: `Missing conditionally required field "${spec.field}" for ${page.kind}.`,
        fixable,
      });

      if (args.fix && fixable) {
        setFieldValue(page.frontmatter, spec.field, cloneValue(defaultValue), page.frontmatterOrder);
        markDirty(page);
      }
    }
  }
}

function lintValueValidators(context, issues) {
  for (const page of context.pages) {
    if (!page.kind) continue;

    lintSlugRule(page, issues);

    const validators = validatorsForKind(page.kind);
    for (const [field, validator] of validators) {
      const value = getFieldValue(page.frontmatter, field);
      if (!hasValue(value)) continue;
      const message = validationMessage(field, value, validator);
      if (message) {
        addIssue(issues, {
          level: 'RED',
          category: 'schema',
          file: page.relPath,
          message,
          fixable: false,
        });
      }
    }
  }
}

function lintSlugRule(page, issues) {
  if (!page.slug || !slugRule) return;

  let valid = true;
  if (typeof slugRule === 'function') {
    try {
      valid = slugRule(page.slug, page.frontmatter, page.kind) !== false;
    } catch {
      valid = true;
    }
  } else if (slugRule instanceof RegExp) {
    valid = slugRule.test(page.slug);
  } else if (typeof slugRule === 'string') {
    valid = new RegExp(slugRule).test(page.slug);
  } else if (slugRule && typeof slugRule === 'object' && slugRule.pattern) {
    valid = new RegExp(slugRule.pattern).test(page.slug);
  }

  if (!valid) {
    addIssue(issues, {
      level: 'YELLOW',
      category: 'schema',
      file: page.relPath,
      message: `Slug "${page.slug}" does not match the configured slug rule.`,
      fixable: false,
    });
  }
}

function lintEdges(context, issues) {
  for (const page of context.pages) {
    for (const edge of normalizedEdges(page)) {
      const type = edge.type;
      const from = normalizeSlugRef(firstValue(edge.from, page.slug));
      const to = normalizeSlugRef(firstValue(edge.to, edge.target, edge.node, edge.slug));

      if (!type) {
        addIssue(issues, {
          level: 'RED',
          category: 'edge',
          file: page.relPath,
          message: 'Edge is missing a type.',
          fixable: false,
        });
      } else if (context.validEdgeTypes.size > 0 && !context.validEdgeTypes.has(type)) {
        addIssue(issues, {
          level: 'RED',
          category: 'edge',
          file: page.relPath,
          message: `Invalid edge type "${type}".`,
          fixable: false,
        });
      }

      if (!from || !context.slugMap.has(from)) {
        addIssue(issues, {
          level: 'RED',
          category: 'edge',
          file: page.relPath,
          message: `Edge ${type ? `"${type}" ` : ''}references missing from node "${from || '(empty)'}".`,
          fixable: false,
        });
      }

      if (!to || !context.slugMap.has(to)) {
        addIssue(issues, {
          level: 'RED',
          category: 'edge',
          file: page.relPath,
          message: `Edge ${type ? `"${type}" ` : ''}references missing to node "${to || '(empty)'}".`,
          fixable: false,
        });
      }

      if (type && safeEdgeRequiresConfidence(type, edge)) {
        const hasConfidence = hasValue(firstValue(edge.confidence, edge.confidence_score));
        const hasEvidence = EVIDENCE_FIELDS.some((field) => hasFieldValue(edge, field));
        if (!hasConfidence || !hasEvidence) {
          addIssue(issues, {
            level: 'RED',
            category: 'edge',
            file: page.relPath,
            message: `Edge "${type}" requires confidence and evidence fields.`,
            fixable: false,
          });
        }
      }

      for (const message of validateEdge(edge)) {
        addIssue(issues, {
          level: 'RED',
          category: 'edge',
          file: page.relPath,
          message,
          fixable: false,
        });
      }

      if (type && safeEdgeIsSymmetric(type, edge) && from && to && context.slugMap.has(to)) {
        const target = context.slugMap.get(to);
        const reverseExists = normalizedEdges(target).some((candidate) => {
          const candidateType = candidate.type;
          const candidateFrom = normalizeSlugRef(firstValue(candidate.from, target.slug));
          const candidateTo = normalizeSlugRef(firstValue(candidate.to, candidate.target, candidate.node, candidate.slug));
          return candidateType === type && candidateFrom === to && candidateTo === from;
        });
        if (!reverseExists) {
          addIssue(issues, {
            level: 'YELLOW',
            category: 'edge',
            file: page.relPath,
            message: `Symmetric edge "${type}" to "${to}" is missing the reverse edge.`,
            fixable: false,
          });
        }
      }
    }
  }
}

// Validate the canonical graph/edges.jsonl store: JSON validity, required
// from/type/to, known edge type, dangling endpoints, and confidence/evidence
// on edges whose contract requires them.
function lintGraphEdges(context, issues) {
  for (const entry of context.graphEdges ?? []) {
    const file = `graph/edges.jsonl:${entry.lineNo}`;
    if (entry.parseError) {
      addIssue(issues, { level: 'RED', category: 'edge', file, message: 'Invalid JSON in edges.jsonl.', fixable: false });
      continue;
    }
    const edge = entry.edge;
    const type = edge.type;
    const from = normalizeSlugRef(firstValue(edge.from, edge.source));
    const to = normalizeSlugRef(firstValue(edge.to, edge.target));

    if (!type || !from || !to) {
      addIssue(issues, { level: 'RED', category: 'edge', file, message: 'Graph edge is missing from/type/to.', fixable: false });
      continue;
    }
    if (context.validEdgeTypes.size > 0 && !context.validEdgeTypes.has(type)) {
      addIssue(issues, { level: 'RED', category: 'edge', file, message: `Invalid edge type "${type}" in edges.jsonl.`, fixable: false });
    }
    for (const node of [from, to]) {
      if (!context.slugMap.has(node)) {
        addIssue(issues, { level: 'RED', category: 'edge', file, message: `Graph edge references missing node "${node}".`, fixable: false });
      }
    }
    if (safeEdgeRequiresConfidence(type, edge)) {
      const hasConfidence = hasValue(firstValue(edge.confidence, edge.confidence_score));
      const hasEvidence = hasValue(edge.evidence) || EVIDENCE_FIELDS.some((field) => hasFieldValue(edge, field));
      if (!hasConfidence || !hasEvidence) {
        addIssue(issues, { level: 'RED', category: 'edge', file, message: `Graph edge "${type}" requires confidence and evidence fields.`, fixable: false });
      }
    }
  }
}

function lintXrefs(context, issues, args) {
  const seen = new Set();

  for (const rule of context.xrefRules) {
    for (const page of context.pages) {
      if (rule.fromKind && !sameKind(page.kind, rule.fromKind)) continue;

      for (const targetSlug of xrefTargets(page, rule)) {
        const target = context.slugMap.get(targetSlug);
        if (!target) continue;
        if (rule.toKind && !sameKind(target.kind, rule.toKind)) continue;

        const key = `${rule.id}|${page.slug}|${target.slug}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (hasReverseXref(target, page.slug, rule)) continue;

        const fixable = canFixReverseXref(rule);
        addIssue(issues, {
          level: 'YELLOW',
          category: 'xref',
          file: page.relPath,
          message: `Forward xref from "${page.slug}" to "${target.slug}" is missing the configured reverse link.`,
          fixable,
        });

        if (args.fix && fixable) {
          applyReverseXrefFix(target, page.slug, rule);
        }
      }
    }
  }
}

function lintBriefMemGuardRules(context, issues) {
  lintDiscoverySourceAsPrimarySource(context, issues);
  lintUnofficialOfficialRepoRefs(context, issues);
  lintRunnableWithoutEvidence(context, issues);
  lintNumericEvidenceWithoutSourcePointer(context, issues);
  lintMissingSourcesWithHighEvidence(context, issues);
  lintFetchedTextPlaceholders(context, issues);
  lintDeepDives(context, issues);
}

function lintDiscoverySourceAsPrimarySource(context, issues) {
  for (const page of context.pages) {
    const discoverySources = comparableRefsFromFields(page.frontmatter, DISCOVERY_SOURCE_FIELDS);
    const primarySources = comparableRefsFromFields(page.frontmatter, PRIMARY_SOURCE_FIELDS);
    if (discoverySources.size === 0 || primarySources.size === 0) continue;

    for (const source of discoverySources) {
      if (primarySources.has(source)) {
        addIssue(issues, {
          level: 'RED',
          category: 'briefmem',
          file: page.relPath,
          message: `Discovery source "${source}" is also listed as a primary source.`,
          fixable: false,
        });
      }
    }
  }
}

function lintUnofficialOfficialRepoRefs(context, issues) {
  for (const page of context.pages) {
    const repoRefs = refsFromFields(page.frontmatter, OFFICIAL_REPO_FIELDS);
    for (const ref of repoRefs) {
      const artifact = context.slugMap.get(ref);
      if (!artifact || !isKind(artifact, 'artifact')) continue;

      const marker = normalizeEnumValue(artifact.frontmatter.official_or_third_party);
      if (marker !== 'official') {
        addIssue(issues, {
          level: 'RED',
          category: 'briefmem',
          file: page.relPath,
          message: `Artifact "${artifact.slug}" is referenced as the official repo but is not marked official.`,
          fixable: false,
        });
      }
    }
  }
}

function lintRunnableWithoutEvidence(context, issues) {
  for (const page of context.pages) {
    if (!isKind(page, 'artifact')) continue;

    const status = normalizeEnumValue(page.frontmatter.status);
    const runnable = normalizeEnumValue(firstValue(page.frontmatter.runnable, page.frontmatter.is_runnable));
    if (status !== 'available' || !['yes', 'true', 'available'].includes(runnable)) continue;

    if (!hasArtifactEvidence(page, context)) {
      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: 'Artifact is status=available and runnable=yes with no runnable evidence.',
        fixable: false,
      });
    }
  }
}

function lintNumericEvidenceWithoutSourcePointer(context, issues) {
  for (const page of context.pages) {
    if (!isEvidenceContext(page)) continue;
    const pageSourcePointer = firstValue(
      page.frontmatter.source_pointer,
      page.frontmatter.source_pointers,
    );
    const findings = findNumericMetricResults(page.frontmatter, [], pageSourcePointer);

    if (findings.length === 0 && hasNumericMetricResultText(page.body) && !hasValue(pageSourcePointer)) {
      findings.push('body');
    }

    for (const fieldPath of findings) {
      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: `Numeric metric/result evidence at "${fieldPath}" has an empty source_pointer.`,
        fixable: false,
      });
    }
  }
}

function lintMissingSourcesWithHighEvidence(context, issues) {
  for (const page of context.pages) {
    if (!isKind(page, 'source-pack')) continue;
    if (!hasValue(page.frontmatter.missing_sources)) continue;

    for (const linked of linkedPages(page, context)) {
      if (!isEvidenceOrClaimContext(linked)) continue;
      if (normalizeEnumValue(linked.frontmatter.evidence_strength) !== 'high') continue;

      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: `Source-pack has missing_sources while linked ${linked.kind || 'claim/evidence'} "${linked.slug}" has evidence_strength=high.`,
        fixable: false,
      });
    }
  }
}

function lintFetchedTextPlaceholders(context, issues) {
  const pattern = /not specified in fetched text/i;
  for (const page of context.pages) {
    if (pattern.test(page.originalContent)) {
      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: 'Literal placeholder text "not specified in fetched text" is present.',
        fixable: false,
      });
    }
  }
}

function lintDeepDives(context, issues) {
  const evidencePacks = context.pages.filter((page) => isKind(page, 'evidence-pack'));
  const conceptsAndMethods = context.pages.filter(
    (page) => isKind(page, 'concept') || isKind(page, 'method'),
  );

  for (const page of context.pages) {
    if (!isKind(page, 'deep-dive')) continue;

    if (!hasFieldValue(page.frontmatter, 'artifact_audit') && !sectionHasContent(page.body, 'artifact-audit')) {
      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: 'Deep-dive is missing artifact_audit.',
        fixable: false,
      });
    }

    const hasEvidencePack = evidencePacks.some((candidate) => pagesShareContent(page, candidate));
    const hasConceptOrMethod = conceptsAndMethods.some((candidate) => pagesShareContent(page, candidate));

    if (!hasEvidencePack || !hasConceptOrMethod) {
      const missing = [];
      if (!hasEvidencePack) missing.push('evidence-pack');
      if (!hasConceptOrMethod) missing.push('concept/method extraction');

      addIssue(issues, {
        level: 'RED',
        category: 'briefmem',
        file: page.relPath,
        message: `Deep-dive has no structured memory: missing ${missing.join(' and ')}.`,
        fixable: false,
      });
    }
  }
}

function requiredFieldSpecsFor(kind) {
  const schema = lookupKindSchema(REQUIRED_FIELDS, kind);
  const entity = entityDefinition(kind);
  const specs = [];

  specs.push(...normalizeRequiredSpecs(schema));
  specs.push(...normalizeRequiredSpecs(entity?.required));
  specs.push(...normalizeRequiredSpecs(entity?.required_fields));
  specs.push(...normalizeRequiredSpecs(entity?.fields?.required));

  return uniqueSpecs(specs.filter((spec) => !spec.when));
}

function requiredWhenSpecsFor(kind) {
  const schema = lookupKindSchema(REQUIRED_FIELDS, kind);
  const entity = entityDefinition(kind);
  const specs = [];

  specs.push(...normalizeRequiredWhenSpecs(schema?.required_when));
  specs.push(...normalizeRequiredWhenSpecs(entity?.required_when));
  specs.push(...normalizeRequiredSpecs(schema).filter((spec) => spec.when));
  specs.push(...normalizeRequiredSpecs(entity?.required).filter((spec) => spec.when));
  specs.push(...normalizeRequiredSpecs(entity?.required_fields).filter((spec) => spec.when));

  return uniqueSpecs(specs);
}

function normalizeRequiredSpecs(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') return [{ field: raw }];

  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => normalizeRequiredSpecs(entry));
  }

  if (typeof raw === 'object') {
    if (raw.field || raw.name || raw.key) {
      return [{
        field: raw.field ?? raw.name ?? raw.key,
        when: raw.when ?? raw.required_when ?? raw.if,
      }];
    }

    const nested = [];
    for (const [field, rule] of Object.entries(raw)) {
      if (field === 'required_when') continue;
      if (rule === true || rule === 'required') {
        nested.push({ field });
      } else if (rule && typeof rule === 'object' && (rule.required || rule.when || rule.required_when || rule.if)) {
        nested.push({
          field,
          when: rule.when ?? rule.required_when ?? rule.if,
        });
      }
    }
    return nested;
  }

  return [];
}

function normalizeRequiredWhenSpecs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => normalizeRequiredWhenSpecs(entry));
  }

  if (typeof raw === 'object') {
    if (raw.field || raw.name || raw.key) {
      return [{
        field: raw.field ?? raw.name ?? raw.key,
        when: raw.when ?? raw.if ?? raw.condition,
      }];
    }

    return Object.entries(raw).map(([field, when]) => ({ field, when }));
  }

  return [];
}

function uniqueSpecs(specs) {
  const seen = new Set();
  const unique = [];
  for (const spec of specs) {
    const key = `${spec.field}|${JSON.stringify(spec.when ?? null)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(spec);
  }
  return unique;
}

function conditionMatches(frontmatter, condition) {
  if (!condition) return true;
  if (Array.isArray(condition)) return condition.every((entry) => conditionMatches(frontmatter, entry));
  if (typeof condition === 'string') return hasFieldValue(frontmatter, condition);
  if (typeof condition !== 'object') return Boolean(condition);

  if (condition.all) return condition.all.every((entry) => conditionMatches(frontmatter, entry));
  if (condition.any) return condition.any.some((entry) => conditionMatches(frontmatter, entry));

  const field = condition.field ?? condition.key ?? condition.name;
  if (field) {
    const value = getFieldValue(frontmatter, field);
    if (condition.present !== undefined) return hasValue(value) === Boolean(condition.present);
    if (condition.not_empty !== undefined) return hasValue(value) === Boolean(condition.not_empty);
    if (condition.equals !== undefined) return valuesEqual(value, condition.equals);
    if (condition.is !== undefined) return valuesEqual(value, condition.is);
    if (condition.value !== undefined) return valuesEqual(value, condition.value);
    if (condition.in !== undefined) return ensureArray(condition.in).some((candidate) => valuesEqual(value, candidate));
    if (condition.not_in !== undefined) return !ensureArray(condition.not_in).some((candidate) => valuesEqual(value, candidate));
    return hasValue(value);
  }

  return Object.entries(condition).every(([key, expected]) => {
    const value = getFieldValue(frontmatter, key);
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      return conditionMatches(frontmatter, { field: key, ...expected });
    }
    return valuesEqual(value, expected);
  });
}

function validatorsForKind(kind) {
  const validators = new Map();
  const kindSchema = lookupKindSchema(VALID_VALUES, kind);

  addValidators(validators, kindSchema);
  addValidators(validators, VALID_VALUES?.[kind]);

  if (VALID_VALUES && typeof VALID_VALUES === 'object') {
    for (const [key, validator] of Object.entries(VALID_VALUES)) {
      const separatorIndex = key.indexOf('.');
      if (separatorIndex === -1) continue;
      const keyKind = key.slice(0, separatorIndex);
      const field = key.slice(separatorIndex + 1);
      if (sameKind(keyKind, kind)) validators.set(field, validator);
    }
  }

  const lifecycleValues = valuesFromValidator(LIFECYCLE);
  if (lifecycleValues.length > 0) {
    for (const field of ['lifecycle', 'lifecycle_state']) {
      if (!validators.has(field)) validators.set(field, lifecycleValues);
    }
  }

  return validators;
}

function addValidators(validators, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  for (const [field, validator] of Object.entries(raw)) {
    if (field === 'required_when') continue;
    validators.set(field, validator);
  }
}

function validationMessage(field, value, validator) {
  const values = valuesFromValidator(validator);
  if (values.length > 0) {
    const allowed = new Set(values.map(normalizeEnumValue));
    const actualValues = ensureArray(value);
    for (const actual of actualValues) {
      if (!allowed.has(normalizeEnumValue(actual))) {
        return `Invalid value "${stringifyForMessage(actual)}" for "${field}"; expected one of ${values.join(', ')}.`;
      }
    }
  }

  const range = rangeFromValidator(validator);
  if (range) {
    const actualValues = ensureArray(value);
    for (const actual of actualValues) {
      const numeric = Number(actual);
      if (!Number.isFinite(numeric)) {
        return `Invalid numeric value "${stringifyForMessage(actual)}" for "${field}".`;
      }
      if (range.min !== undefined && numeric < range.min) {
        return `Value "${field}" is below minimum ${range.min}.`;
      }
      if (range.max !== undefined && numeric > range.max) {
        return `Value "${field}" is above maximum ${range.max}.`;
      }
    }
  }

  const pattern = patternFromValidator(validator);
  if (pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    for (const actual of ensureArray(value)) {
      if (!regex.test(String(actual))) {
        return `Value "${stringifyForMessage(actual)}" for "${field}" does not match the required pattern.`;
      }
    }
  }

  return null;
}

function valuesFromValidator(validator) {
  if (!validator) return [];
  if (Array.isArray(validator)) return validator.map(String);
  if (validator instanceof Set) return [...validator].map(String);
  if (typeof validator === 'object') {
    if (Array.isArray(validator.values)) return validator.values.map(String);
    if (Array.isArray(validator.enum)) return validator.enum.map(String);
    if (Array.isArray(validator.oneOf)) return validator.oneOf.map(String);
    if (Array.isArray(validator.allowed)) return validator.allowed.map(String);
    const schemaKeys = new Set(['min', 'max', 'range', 'pattern', 'regex', 'values', 'enum', 'oneOf', 'allowed']);
    const keys = Object.keys(validator).filter((key) => !schemaKeys.has(key));
    if (keys.length > 0 && keys.length === Object.keys(validator).length) return keys.map(String);
  }
  return [];
}

function rangeFromValidator(validator) {
  if (!validator || typeof validator !== 'object' || Array.isArray(validator)) return null;
  if (Array.isArray(validator.range)) {
    return { min: validator.range[0], max: validator.range[1] };
  }
  if (validator.min !== undefined || validator.max !== undefined) {
    return { min: validator.min, max: validator.max };
  }
  return null;
}

function patternFromValidator(validator) {
  if (!validator || typeof validator !== 'object' || Array.isArray(validator)) return null;
  return validator.pattern ?? validator.regex ?? null;
}

function normalizedEdges(page) {
  const edges = [];
  const edgeFields = ['edges', 'edge', 'relations', 'relationships'];

  for (const field of edgeFields) {
    const raw = page.frontmatter[field];
    for (const edge of ensureArray(raw)) {
      if (!hasValue(edge)) continue;
      if (typeof edge === 'string') {
        pushNormalizedEdge(edges, { type: field, to: edge, _field: field });
      } else if (edge && typeof edge === 'object') {
        pushNormalizedEdge(edges, {
          ...edge,
          type: edge.type ?? edge.edge_type ?? edge.kind ?? edge.rel ?? edge.relationship,
          _field: field,
        });
      }
    }
  }

  if (EDGES && typeof EDGES === 'object') {
    for (const [edgeType, config] of Object.entries(EDGES)) {
      const field = config?.field ?? config?.frontmatter ?? config?.key;
      if (!field || edgeFields.includes(field)) continue;
      for (const ref of extractRefsFromValue(page.frontmatter[field])) {
        pushNormalizedEdge(edges, { type: edgeType, from: page.slug, to: ref, _field: field });
      }
    }
  }

  return edges;
}

function pushNormalizedEdge(edges, edge) {
  const target = firstValue(edge.to, edge.target, edge.node, edge.slug);
  if (Array.isArray(target)) {
    for (const to of target) {
      edges.push({ ...edge, to });
    }
    return;
  }
  edges.push(edge);
}

function validateEdge(edge) {
  if (typeof validateEdgeAttributes !== 'function') return [];

  try {
    const result = validateEdgeAttributes(edge);
    if (result === undefined || result === null || result === true) return [];
    if (result === false) return ['Edge attributes are invalid.'];
    if (typeof result === 'string') return [result];
    if (Array.isArray(result)) return result.map(String);
    if (result.errors && Array.isArray(result.errors)) return result.errors.map(String);
    if (result.message) return [String(result.message)];
  } catch (error) {
    return [`Edge attribute validation failed: ${error.message}`];
  }

  return [];
}

function safeEdgeRequiresConfidence(type, edge) {
  if (typeof edgeRequiresConfidence !== 'function') return false;
  try {
    return Boolean(edgeRequiresConfidence(type, edge));
  } catch {
    try {
      return Boolean(edgeRequiresConfidence(edge));
    } catch {
      return false;
    }
  }
}

function safeEdgeIsSymmetric(type, edge) {
  if (typeof edgeIsSymmetric !== 'function') return false;
  try {
    return Boolean(edgeIsSymmetric(type, edge));
  } catch {
    try {
      return Boolean(edgeIsSymmetric(edge));
    } catch {
      return false;
    }
  }
}

function collectValidEdgeTypes() {
  const types = new Set();
  for (const value of valuesFromValidator(VALID_EDGE_TYPES)) types.add(value);

  if (VALID_EDGE_TYPES && typeof VALID_EDGE_TYPES === 'object' && !Array.isArray(VALID_EDGE_TYPES)) {
    for (const [key, value] of Object.entries(VALID_EDGE_TYPES)) {
      if (value === true || (value && typeof value === 'object')) types.add(key);
      if (typeof value === 'string') types.add(value);
    }
  }

  if (EDGES && typeof EDGES === 'object') {
    for (const key of Object.keys(EDGES)) types.add(key);
  }

  return types;
}

function normalizeXrefRules(raw) {
  const rules = [];
  const pushRule = (rule, inherited = {}) => {
    const normalized = normalizeXrefRule({ ...inherited, ...rule }, rules.length);
    if (normalized) rules.push(normalized);
  };

  if (Array.isArray(raw)) {
    raw.forEach((entry) => pushRule(entry));
    return rules;
  }

  if (!raw || typeof raw !== 'object') return rules;

  for (const [fromKind, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => pushRule(entry, { fromKind }));
      continue;
    }

    if (value && typeof value === 'object' && looksLikeXrefRule(value)) {
      pushRule(value, { fromKind });
      continue;
    }

    if (value && typeof value === 'object') {
      for (const [field, spec] of Object.entries(value)) {
        if (Array.isArray(spec)) {
          spec.forEach((entry) => pushRule(entry, { fromKind, field }));
        } else if (spec && typeof spec === 'object') {
          pushRule(spec, { fromKind, field });
        } else if (typeof spec === 'string') {
          pushRule({ reverseField: spec }, { fromKind, field });
        }
      }
    }
  }

  return rules;
}

function looksLikeXrefRule(value) {
  return [
    'field',
    'forwardField',
    'forward_field',
    'fromField',
    'from_field',
    'edgeType',
    'edge_type',
    'reverseField',
    'reverse_field',
    'reverseSection',
    'reverse_section',
    'bodySection',
    'body_section',
  ].some((key) => key in value);
}

function normalizeXrefRule(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const reverse = raw.reverse && typeof raw.reverse === 'object' ? raw.reverse : {};
  const reverseString = typeof raw.reverse === 'string' ? raw.reverse : null;

  const rule = {
    id: raw.id ?? `xref-${index}`,
    fromKind: raw.fromKind ?? raw.from_kind ?? raw.from ?? raw.sourceKind ?? raw.source_kind,
    toKind: raw.toKind ?? raw.to_kind ?? raw.to ?? raw.targetKind ?? raw.target_kind,
    field: raw.forwardField ?? raw.forward_field ?? raw.fromField ?? raw.from_field ?? raw.field,
    edgeType: raw.edgeType ?? raw.edge_type ?? raw.type,
    reverseField:
      raw.reverseField ??
      raw.reverse_field ??
      raw.backField ??
      raw.back_field ??
      raw.frontmatterSlug ??
      raw.frontmatter_slug ??
      reverse.field ??
      reverse.frontmatter ??
      reverse.frontmatter_slug,
    reverseSection:
      raw.reverseSection ??
      raw.reverse_section ??
      raw.bodySection ??
      raw.body_section ??
      raw.reverseBodySection ??
      raw.reverse_body_section ??
      reverse.section ??
      reverse.body_section,
  };

  if (!rule.reverseField && !rule.reverseSection && reverseString) {
    if (reverseString.includes('-section') || reverseString.includes('section:')) {
      rule.reverseSection = reverseString.replace(/^section:/, '');
    } else {
      rule.reverseField = reverseString;
    }
  }

  if (!rule.field && !rule.edgeType) return null;
  return rule;
}

function xrefTargets(page, rule) {
  const refs = new Set();

  if (rule.field) {
    for (const ref of extractRefsFromValue(getFieldValue(page.frontmatter, rule.field))) {
      refs.add(ref);
    }
  }

  if (rule.edgeType) {
    for (const edge of normalizedEdges(page)) {
      if (edge.type !== rule.edgeType) continue;
      const ref = normalizeSlugRef(firstValue(edge.to, edge.target, edge.node, edge.slug));
      if (ref) refs.add(ref);
    }
  }

  return refs;
}

function hasReverseXref(target, sourceSlug, rule) {
  const fields = ensureArray(rule.reverseField).filter(Boolean);
  for (const field of fields) {
    const refs = extractRefsFromValue(getFieldValue(target.frontmatter, field));
    if (refs.has(sourceSlug)) return true;
  }

  const sections = ensureArray(rule.reverseSection).filter(Boolean);
  for (const section of sections) {
    if (sectionContainsSlug(target.body, section, sourceSlug)) return true;
  }

  return false;
}

function canFixReverseXref(rule) {
  return hasValue(rule.reverseField) || hasValue(rule.reverseSection);
}

function applyReverseXrefFix(target, sourceSlug, rule) {
  const field = ensureArray(rule.reverseField).filter(Boolean)[0];
  if (field) {
    addSlugToFrontmatterField(target, field, sourceSlug);
    return;
  }

  const section = ensureArray(rule.reverseSection).filter(Boolean)[0];
  if (section) {
    addSlugToBodySection(target, section, sourceSlug);
  }
}

function addSlugToFrontmatterField(page, field, slug) {
  const current = getFieldValue(page.frontmatter, field);
  const refs = extractRefsFromValue(current);
  if (refs.has(slug)) return;

  if (!hasValue(current)) {
    setFieldValue(page.frontmatter, field, [slug], page.frontmatterOrder);
  } else if (Array.isArray(current)) {
    current.push(slug);
  } else {
    setFieldValue(page.frontmatter, field, [current, slug], page.frontmatterOrder);
  }

  markDirty(page);
}

function addSlugToBodySection(page, sectionSlug, slug) {
  if (sectionContainsSlug(page.body, sectionSlug, slug)) return;

  const lines = page.body.replace(/\r\n/g, '\n').split('\n');
  const bounds = findSectionBounds(lines, sectionSlug);
  const entry = `- [[${slug}]]`;

  if (!bounds) {
    const heading = sectionSlugToTitle(sectionSlug);
    const separator = page.body.endsWith('\n') || page.body === '' ? '' : '\n';
    page.body = `${page.body}${separator}\n## ${heading}\n${entry}\n`;
    markDirty(page);
    return;
  }

  const insertAt = bounds.end;
  if (insertAt > bounds.start + 1 && lines[insertAt - 1].trim() !== '') {
    lines.splice(insertAt, 0, entry);
  } else {
    lines.splice(insertAt, 0, entry);
  }
  page.body = lines.join('\n');
  markDirty(page);
}

function hasArtifactEvidence(page, context) {
  if (EVIDENCE_FIELDS.some((field) => hasFieldValue(page.frontmatter, field))) return true;
  if (sectionHasContent(page.body, 'evidence')) return true;
  if (sectionHasContent(page.body, 'artifact-audit')) return true;

  return context.pages.some((candidate) => {
    if (!isKind(candidate, 'evidence-pack')) return false;
    return pagesShareContent(page, candidate);
  });
}

function findNumericMetricResults(value, pathParts, inheritedSourcePointer) {
  const findings = [];

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      findings.push(...findNumericMetricResults(entry, [...pathParts, String(index)], inheritedSourcePointer));
    });
    return findings;
  }

  if (value && typeof value === 'object') {
    const localSourcePointer = firstValue(
      value.source_pointer,
      value.source_pointers,
      inheritedSourcePointer,
    );

    for (const [key, child] of Object.entries(value)) {
      const childPath = [...pathParts, key];
      const keySuggestsMetric = /(?:^|_)(metric|metrics|result|results)(?:_|$)/i.test(key);
      if (keySuggestsMetric && containsNumber(child) && !hasValue(localSourcePointer)) {
        findings.push(childPath.join('.'));
      }
      findings.push(...findNumericMetricResults(child, childPath, localSourcePointer));
    }
    return findings;
  }

  const leafPath = pathParts.join('.');
  if (/metric|result/i.test(leafPath) && containsNumber(value) && !hasValue(inheritedSourcePointer)) {
    findings.push(leafPath);
  }

  return findings;
}

function containsNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return /\b\d+(?:\.\d+)?(?:%|x|ms|s|m|h|tokens?|items?|runs?)?\b/i.test(value);
  if (Array.isArray(value)) return value.some(containsNumber);
  if (value && typeof value === 'object') return Object.values(value).some(containsNumber);
  return false;
}

function hasNumericMetricResultText(body) {
  return /(?:metric|result)[^\n]*\b\d+(?:\.\d+)?/i.test(body);
}

function linkedPages(page, context) {
  const linked = new Map();

  for (const ref of context.outgoing.get(page.slug) ?? []) {
    const target = context.slugMap.get(ref);
    if (target) linked.set(target.slug, target);
  }

  for (const sourceSlug of context.incoming.get(page.slug) ?? []) {
    const source = context.slugMap.get(sourceSlug);
    if (source) linked.set(source.slug, source);
  }

  return [...linked.values()];
}

function pagesShareContent(a, b) {
  if (a.slug === b.slug) return true;

  const aRefs = pageOutgoingRefs(a);
  const bRefs = pageOutgoingRefs(b);
  if (aRefs.has(b.slug) || bRefs.has(a.slug)) return true;

  const aKeys = sharedContentKeys(a);
  const bKeys = sharedContentKeys(b);
  for (const key of aKeys) {
    if (bKeys.has(key)) return true;
  }

  return false;
}

function sharedContentKeys(page) {
  const keys = new Set();
  for (const field of SHARED_CONTENT_FIELDS) {
    for (const ref of extractRefsFromValue(getFieldValue(page.frontmatter, field))) {
      keys.add(ref);
    }
  }
  return keys;
}

function isEvidenceContext(page) {
  return (
    isKind(page, 'evidence-pack') ||
    isKind(page, 'evidence') ||
    hasFieldValue(page.frontmatter, 'evidence_strength') ||
    hasFieldValue(page.frontmatter, 'evidence')
  );
}

function isEvidenceOrClaimContext(page) {
  return isEvidenceContext(page) || isKind(page, 'claim') || hasFieldValue(page.frontmatter, 'claim');
}

function isKind(page, expected) {
  if (sameKind(page.kind, expected)) return true;
  const rel = page.relPath.toLowerCase();
  const normalizedExpected = normalizeKind(expected);
  return rel.split('/').some((part) => normalizeKind(part) === normalizedExpected || normalizeKind(part) === `${normalizedExpected}s`);
}

function isEntityPage(page) {
  if (page.kind) return true;
  if (!ENTITY_DIRS || typeof ENTITY_DIRS !== 'object') return false;
  return Object.values(ENTITY_DIRS).some((dir) => {
    const normalized = toPosix(String(dir)).replace(/\/+$/, '');
    return page.relPath === normalized || page.relPath.startsWith(`${normalized}/`);
  });
}

function isIndexLikePage(page) {
  const base = path.basename(page.relPath, '.md').toLowerCase();
  return ['index', 'readme', 'home'].includes(base);
}

function inferKind(relPath, frontmatter) {
  for (const field of ['kind', 'type', 'entity', 'entity_type', 'briefmem_type']) {
    const value = normalizeKind(frontmatter[field]);
    if (value) return matchingEntityKind(value) ?? value;
  }

  if (ENTITY_DIRS && typeof ENTITY_DIRS === 'object') {
    const entries = Object.entries(ENTITY_DIRS)
      .map(([kind, dir]) => [kind, toPosix(String(dir)).replace(/\/+$/, '')])
      .sort((a, b) => b[1].length - a[1].length);

    for (const [kind, dir] of entries) {
      if (relPath === dir || relPath.startsWith(`${dir}/`)) return kind;
    }
  }

  return null;
}

function entityKindNames() {
  if (Array.isArray(ENTITIES)) {
    return ENTITIES.map((entry) => (typeof entry === 'string' ? entry : entry.kind ?? entry.name)).filter(Boolean);
  }
  if (ENTITIES && typeof ENTITIES === 'object') return Object.keys(ENTITIES);
  return [];
}

function matchingEntityKind(value) {
  return entityKindNames().find((kind) => sameKind(kind, value));
}

function entityDefinition(kind) {
  if (!kind || !ENTITIES) return null;
  if (Array.isArray(ENTITIES)) {
    return ENTITIES.find((entry) => {
      if (typeof entry === 'string') return sameKind(entry, kind);
      return sameKind(entry.kind ?? entry.name, kind);
    }) ?? null;
  }
  if (typeof ENTITIES === 'object') {
    return lookupKindSchema(ENTITIES, kind);
  }
  return null;
}

function lookupKindSchema(schema, kind) {
  if (!schema || typeof schema !== 'object' || !kind) return null;
  if (Object.prototype.hasOwnProperty.call(schema, kind)) return schema[kind];
  const normalizedKind = normalizeKind(kind);
  for (const [key, value] of Object.entries(schema)) {
    if (normalizeKind(key) === normalizedKind) return value;
  }
  return null;
}

function defaultForField(kind, field) {
  const kindDefaults = lookupKindSchema(FIELD_DEFAULTS, kind);
  if (kindDefaults && typeof kindDefaults === 'object') {
    const direct = getFieldValue(kindDefaults, field);
    if (direct !== undefined) return direct;
  }

  if (FIELD_DEFAULTS && typeof FIELD_DEFAULTS === 'object') {
    const direct = getFieldValue(FIELD_DEFAULTS, field);
    if (direct !== undefined) return direct;
  }

  const entity = entityDefinition(kind);
  const defaults = entity?.defaults ?? entity?.field_defaults;
  if (defaults && typeof defaults === 'object') {
    return getFieldValue(defaults, field);
  }

  return undefined;
}

function pageAliases(page) {
  const aliases = new Set([
    page.slug,
    path.basename(page.relPath, '.md'),
    page.relPath.replace(/\.md$/i, ''),
  ]);

  for (const alias of ensureArray(page.frontmatter.aliases)) {
    aliases.add(alias);
  }

  return aliases;
}

function pageOutgoingRefs(page) {
  const refs = new Set([
    ...extractWikilinks(page.originalContent),
    ...extractRefsFromValue(page.frontmatter),
  ]);

  for (const field of COMMON_REF_FIELDS) {
    for (const ref of extractRefsFromValue(getFieldValue(page.frontmatter, field))) {
      refs.add(ref);
    }
  }

  for (const edge of normalizedEdges(page)) {
    for (const value of [edge.from, edge.to, edge.target, edge.node, edge.slug]) {
      const ref = normalizeSlugRef(value);
      if (ref) refs.add(ref);
    }
  }

  return refs;
}

function extractWikilinks(text) {
  const refs = new Set();
  const regex = /\[\[([^\]\n]+)\]\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const ref = normalizeSlugRef(match[1]);
    if (ref) refs.add(ref);
  }
  return refs;
}

function extractRefsFromValue(value) {
  const refs = new Set();

  function visit(current) {
    if (!hasValue(current)) return;

    if (typeof current === 'string') {
      const wikilinks = extractWikilinks(current);
      if (wikilinks.size > 0) {
        for (const ref of wikilinks) refs.add(ref);
        return;
      }

      const ref = normalizeSlugRef(current);
      if (looksLikeSlugRef(ref)) refs.add(ref);
      return;
    }

    if (typeof current === 'number' || typeof current === 'boolean') return;

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (typeof current === 'object') {
      for (const key of ['slug', 'id', 'to', 'from', 'target', 'node', 'ref']) {
        if (current[key] !== undefined) visit(current[key]);
      }
    }
  }

  visit(value);
  return refs;
}

function refsFromFields(frontmatter, fields) {
  const refs = new Set();
  for (const field of fields) {
    for (const ref of extractRefsFromValue(getFieldValue(frontmatter, field))) {
      refs.add(ref);
    }
  }
  return refs;
}

function comparableRefsFromFields(frontmatter, fields) {
  const refs = new Set();
  for (const field of fields) {
    for (const ref of extractComparableRefsFromValue(getFieldValue(frontmatter, field))) {
      refs.add(ref);
    }
  }
  return refs;
}

function extractComparableRefsFromValue(value) {
  const refs = new Set();

  function visit(current) {
    if (!hasValue(current)) return;
    if (typeof current === 'string') {
      const wikilinks = extractWikilinks(current);
      if (wikilinks.size > 0) {
        for (const ref of wikilinks) refs.add(normalizeComparableRef(ref));
      } else {
        refs.add(normalizeComparableRef(current));
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current && typeof current === 'object') {
      Object.values(current).forEach(visit);
    }
  }

  visit(value);
  return refs;
}

function normalizeSlugRef(value) {
  if (value === undefined || value === null) return '';
  let ref = String(value).trim();
  if (!ref) return '';

  const wikilink = ref.match(/^\[\[([^\]]+)\]\]$/);
  if (wikilink) ref = wikilink[1].trim();

  ref = ref.split('|')[0].split('#')[0].trim();
  ref = ref.replace(/^['"]|['"]$/g, '');
  ref = ref.replace(/\\/g, '/');
  ref = ref.replace(/^\.\//, '');
  ref = ref.replace(/\.md$/i, '');
  if (ref.includes('/')) {
    const basename = ref.split('/').pop();
    if (basename) ref = basename;
  }
  return ref;
}

function normalizeComparableRef(value) {
  const raw = String(value ?? '').trim().replace(/^['"]|['"]$/g, '');
  if (/^[a-z]+:\/\//i.test(raw)) return raw.replace(/\/+$/, '').toLowerCase();
  const ref = normalizeSlugRef(raw);
  return ref.replace(/\/+$/, '').toLowerCase();
}

function looksLikeSlugRef(value) {
  if (!value) return false;
  if (/^[a-z]+:\/\//i.test(value)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(value)) return false;
  if (/\s/.test(value)) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value);
}

function getFieldValue(object, field) {
  if (!object || !field) return undefined;
  if (Object.prototype.hasOwnProperty.call(object, field)) return object[field];
  if (!String(field).includes('.')) return undefined;

  let current = object;
  for (const part of String(field).split('.')) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function setFieldValue(object, field, value, order) {
  if (!String(field).includes('.')) {
    if (!Object.prototype.hasOwnProperty.call(object, field)) order.push(field);
    object[field] = value;
    return;
  }

  const parts = String(field).split('.');
  let current = object;
  for (const part of parts.slice(0, -1)) {
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  const leaf = parts[parts.length - 1];
  if (!Object.prototype.hasOwnProperty.call(current, leaf) && parts.length === 1) order.push(field);
  current[leaf] = value;
}

function hasFieldValue(object, field) {
  return hasValue(getFieldValue(object, field));
}

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function ensureArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function valuesEqual(left, right) {
  if (Array.isArray(left)) return left.some((entry) => valuesEqual(entry, right));
  if (Array.isArray(right)) return right.some((entry) => valuesEqual(left, entry));
  return normalizeEnumValue(left) === normalizeEnumValue(right);
}

function normalizeEnumValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase().replace(/_/g, '-');
}

function normalizeKind(value) {
  return normalizeEnumValue(value);
}

function sameKind(left, right) {
  if (!left || !right) return false;
  return normalizeKind(left) === normalizeKind(right);
}

function sectionHasContent(body, sectionSlug) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const bounds = findSectionBounds(lines, sectionSlug);
  if (!bounds) return false;
  return lines.slice(bounds.start + 1, bounds.end).some((line) => line.trim() !== '');
}

function sectionContainsSlug(body, sectionSlug, slug) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const bounds = findSectionBounds(lines, sectionSlug);
  if (!bounds) return false;

  const section = lines.slice(bounds.start + 1, bounds.end).join('\n');
  const wikilinks = extractWikilinks(section);
  if (wikilinks.has(slug)) return true;

  const escaped = escapeRegExp(slug);
  return new RegExp(`(^|[^\\w.-])${escaped}([^\\w.-]|$)`).test(section);
}

function findSectionBounds(lines, sectionSlug) {
  const expected = normalizeSectionSlug(sectionSlug);
  let start = -1;
  let level = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const heading = parseHeading(lines[index]);
    if (!heading) continue;
    if (normalizeSectionSlug(heading.text) === expected) {
      start = index;
      level = heading.level;
      break;
    }
  }

  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = parseHeading(lines[index]);
    if (heading && heading.level <= level) {
      end = index;
      break;
    }
  }

  return { start, end };
}

function parseHeading(line) {
  const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (!match) return null;
  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

function normalizeSectionSlug(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (CONVENTIONS?.sectionSlug && typeof CONVENTIONS.sectionSlug === 'function') {
    try {
      return CONVENTIONS.sectionSlug(raw);
    } catch {
      // Fall through to the local GitHub-style slugger.
    }
  }
  return raw
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sectionSlugToTitle(sectionSlug) {
  return String(sectionSlug)
    .replace(/^section:/, '')
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function addIssue(issues, issue) {
  issues.push({
    level: issue.level,
    category: issue.category,
    file: issue.file,
    message: issue.message,
    fixable: Boolean(issue.fixable),
  });
}

function summarizeIssues(issues) {
  return {
    red: issues.filter((issue) => issue.level === 'RED').length,
    yellow: issues.filter((issue) => issue.level === 'YELLOW').length,
    blue: issues.filter((issue) => issue.level === 'BLUE').length,
  };
}

function sortIssues(issues) {
  const seen = new Set();
  return issues
    .filter((issue) => {
      const key = `${issue.level}|${issue.category}|${issue.file}|${issue.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      return (
        LEVEL_WEIGHT.get(a.level) - LEVEL_WEIGHT.get(b.level) ||
        a.category.localeCompare(b.category) ||
        a.file.localeCompare(b.file) ||
        a.message.localeCompare(b.message)
      );
    });
}

function printTextResult(result) {
  for (const issue of result.issues) {
    const fixable = issue.fixable ? ' fixable' : '';
    console.log(`${issue.level} ${issue.category} ${issue.file}: ${issue.message}${fixable}`);
  }

  console.log(
    `Summary: RED ${result.summary.red}, YELLOW ${result.summary.yellow}, BLUE ${result.summary.blue}`,
  );
}

async function writeDirtyPages(context) {
  const dirtyPages = context.pages.filter((page) => page.dirty);
  dirtyPages.sort((a, b) => a.relPath.localeCompare(b.relPath));

  for (const page of dirtyPages) {
    await writeFile(page.absPath, renderMarkdown(page), 'utf8');
  }
}

function markDirty(page) {
  page.dirty = true;
}

function renderMarkdown(page) {
  if (!page.hadFrontmatter && Object.keys(page.frontmatter).length === 0) {
    return page.body;
  }

  return `---\n${formatYaml(page.frontmatter, page.frontmatterOrder)}---\n${page.body}`;
}

function formatYaml(object, order = [], indent = 0) {
  const keys = [
    ...order.filter((key) => Object.prototype.hasOwnProperty.call(object, key)),
    ...Object.keys(object)
      .filter((key) => !order.includes(key))
      .sort((a, b) => a.localeCompare(b)),
  ];

  return keys.map((key) => formatYamlEntry(key, object[key], indent)).join('');
}

function formatYamlEntry(key, value, indent) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}${key}: []\n`;
    const lines = [`${pad}${key}:\n`];
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        lines.push(formatYamlArrayObjectItem(item, indent + 2));
      } else if (Array.isArray(item)) {
        lines.push(`${pad}  - ${formatYamlScalarValue(item)}\n`);
      } else {
        lines.push(`${pad}  - ${formatYamlScalarValue(item)}\n`);
      }
    }
    return lines.join('');
  }

  if (value && typeof value === 'object') {
    if (Object.keys(value).length === 0) return `${pad}${key}: {}\n`;
    return `${pad}${key}:\n${formatYaml(value, Object.keys(value), indent + 2)}`;
  }

  return `${pad}${key}: ${formatYamlScalarValue(value)}\n`;
}

function formatYamlArrayObjectItem(object, indent) {
  const pad = ' '.repeat(indent);
  const entries = Object.entries(object);
  if (entries.length === 0) return `${pad}- {}\n`;

  const [[key, value], ...remainingEntries] = entries;
  let text = '';
  if (value && typeof value === 'object') {
    text += `${pad}- ${key}:\n${formatYaml(value, Object.keys(value), indent + 4)}`;
  } else {
    text += `${pad}- ${key}: ${formatYamlScalarValue(value)}\n`;
  }

  if (remainingEntries.length > 0) {
    text += formatYaml(Object.fromEntries(remainingEntries), remainingEntries.map(([entryKey]) => entryKey), indent + 2);
  }

  return text;
}

function formatYamlScalarValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.map(formatYamlScalarValue).join(', ')}]`;

  const text = String(value);
  if (text === '') return '""';
  if (/^[A-Za-z0-9_./@-]+$/.test(text) && !/^(true|false|null|~)$/i.test(text)) return text;
  return JSON.stringify(text);
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stringifyForMessage(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exitCode = 2;
});
