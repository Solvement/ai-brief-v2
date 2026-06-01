import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ENTITY_DIRS } from '../brief/loader.mjs';
import { addEdge, appendLog, init, rebuildReverseLinks, slug } from '../brief/wiki.mjs';

async function tempWiki() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'brief-wiki-'));
  await init(root);
  return root;
}

async function writeNote(root, kind, name, extraMeta = {}) {
  const dir = ENTITY_DIRS[kind];
  const meta = { id: name, kind, title: `${kind} ${name}`, ...extraMeta };
  const yaml = Object.entries(meta)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  await writeFile(path.join(root, dir, `${name}.md`), `---\n${yaml}\n---\n\n# ${meta.title}\n`, 'utf8');
}

test('init scaffolds entity dirs directly under the wiki root and seeds the taste singleton', async () => {
  const root = await tempWiki();
  for (const dir of Object.values(ENTITY_DIRS)) {
    assert.equal((await stat(path.join(root, dir))).isDirectory(), true, `${dir} should exist`);
    await assert.rejects(stat(path.join(root, 'brief-wiki', dir)), /ENOENT/, 'no doubled brief-wiki/ prefix');
  }
  assert.equal((await stat(path.join(root, 'taste', 'me.md'))).isFile(), true);
  assert.equal((await stat(path.join(root, 'graph', 'edges.jsonl'))).isFile(), true);
  assert.equal((await stat(path.join(root, 'graph', 'context-brief.md'))).isFile(), true);
  assert.equal((await stat(path.join(root, 'graph', 'gap-map.md'))).isFile(), true);
});

test('slug normalizes titles to lowercase kebab-case', () => {
  assert.match(slug('A  BriefMem Paper: Phase 2A!'), /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.equal(slug('Self-Improving Agents'), 'self-improving-agents');
});

test('addEdge rejects unknown edge types and missing required confidence', async () => {
  const root = await tempWiki();
  await writeNote(root, 'content', 'alpha');
  await writeNote(root, 'content', 'beta');

  await assert.rejects(
    addEdge(root, { from: 'content/alpha', to: 'content/beta', type: 'not-a-real-edge' }),
    /unknown edge type/i,
  );
  await assert.rejects(
    addEdge(root, { from: 'content/alpha', to: 'content/beta', type: 'same_track_as', evidence: 'x' }),
    /confidence/i,
  );
});

test('addEdge sorts endpoints for symmetric edge types', async () => {
  const root = await tempWiki();
  await writeNote(root, 'content', 'alpha');
  await writeNote(root, 'content', 'zeta');

  await addEdge(root, { from: 'content/zeta', to: 'content/alpha', type: 'same_track_as', confidence: 'medium', evidence: 'shared topic' });

  const lines = (await readFile(path.join(root, 'graph', 'edges.jsonl'), 'utf8')).trim().split(/\r?\n/).filter(Boolean);
  const edge = JSON.parse(lines.at(-1));
  assert.equal(edge.from, 'content/alpha', 'symmetric endpoints should be sorted');
  assert.equal(edge.to, 'content/zeta');
});

test('rebuildReverseLinks writes the content-side reverse aggregation for a uses_method edge', async () => {
  const root = await tempWiki();
  await writeNote(root, 'content', 'alpha');
  await writeNote(root, 'method', 'm1');
  await addEdge(root, { from: 'content/alpha', to: 'method/m1', type: 'uses_method', confidence: 'high', evidence: 'uses it directly' });

  await rebuildReverseLinks(root);

  const body = await readFile(path.join(root, ENTITY_DIRS.content, 'alpha.md'), 'utf8');
  assert.match(body, /##\s+Methods/, 'content page should have a Methods reverse section');
  assert.match(body, /m1/, 'Methods section should reference the linked method');
});

test('log is append-only — later entries preserve earlier ones as a prefix', async () => {
  const root = await tempWiki();
  await appendLog(root, 'first entry');
  const after1 = await readFile(path.join(root, 'log.md'), 'utf8');
  await appendLog(root, 'second entry');
  const after2 = await readFile(path.join(root, 'log.md'), 'utf8');

  assert.ok(after2.includes('first entry') && after2.includes('second entry'), 'both entries present');
  assert.ok(after2.startsWith(after1), 'append-only: earlier content preserved as prefix');
});
