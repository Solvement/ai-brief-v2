import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ENTITY_DIRS } from '../brief/loader.mjs';

const lintPath = fileURLToPath(new URL('../brief/lint.mjs', import.meta.url));

function yaml(meta) {
  return Object.entries(meta)
    .map(([k, v]) => {
      if (Array.isArray(v)) return v.length ? `${k}:\n${v.map((e) => `  - ${JSON.stringify(e)}`).join('\n')}` : `${k}: []`;
      if (v && typeof v === 'object') {
        return `${k}:\n${Object.entries(v).map(([ik, iv]) => `  ${ik}: ${JSON.stringify(iv)}`).join('\n')}`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
}

async function writeEntity(root, kind, name, meta, body = '') {
  const dir = path.join(root, ENTITY_DIRS[kind]);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.md`), `---\n${yaml({ id: name, kind, ...meta })}\n---\n\n${body}\n`, 'utf8');
}

// A complete, schema-valid paper sample (content + funnel + knowledge), fully cross-linked.
async function buildValidSample() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'brief-lint-'));
  for (const dir of Object.values(ENTITY_DIRS)) await mkdir(path.join(root, dir), { recursive: true });
  await mkdir(path.join(root, 'graph'), { recursive: true });
  await writeFile(path.join(root, 'graph', 'edges.jsonl'), '', 'utf8');

  const c = 'sample-paper';
  await writeEntity(root, 'content', c, {
    title: 'Sample Paper', slug: c, type: 'paper', source: 'arxiv', url: 'https://arxiv.org/abs/0000.00000',
    discovered_at: '2026-06-01', tags: ['memory'], importance: 3, status: 'deep_dived',
  }, 'A sample paper.\n\n## Methods\n- [[methods/source-tracing]]\n\n## Concepts\n- [[concepts/brief-memory]]\n\n## Claims\n- [[claims/memory-helps]]\n\n## Evidence\n- [[evidence/quality-evidence]]\n\n## Artifacts\n- [[artifacts/repo]]');
  await writeEntity(root, 'source-pack', `${c}-source-pack`, { content: c, primary_sources: ['https://arxiv.org/abs/0000.00000'], discovery_sources: ['arxiv-listing'] }, 'Source pack.');
  await writeEntity(root, 'evidence-pack', `${c}-evidence-pack`, { content: c }, 'Evidence pack.');
  await writeEntity(root, 'deep-dive', `${c}-deep-dive`, {
    content: c, shape: 'paper',
    artifact_audit: { reproducibility_status: 'partial', license: 'MIT' },
  }, 'Deep dive. See [[content/sample-paper]].');
  await writeEntity(root, 'concept', 'brief-memory', { name: 'Brief Memory', slug: 'brief-memory', tags: ['memory'], maturity: 'active', related_content: ['[[content/sample-paper]]'] }, 'A concept.');
  await writeEntity(root, 'method', 'source-tracing', { name: 'Source Tracing', slug: 'source-tracing', type: 'architecture', tags: ['memory'], used_by_content: ['[[content/sample-paper]]'] }, 'A method.');
  await writeEntity(root, 'claim', 'memory-helps', { text: 'Memory helps brief quality.', slug: 'memory-helps', content: c, evidence_strength: 'medium', status: 'untested' }, 'A claim. See [[content/sample-paper]].');
  await writeEntity(root, 'evidence', 'quality-evidence', { slug: 'quality-evidence', content: c, experiment_or_case: 'case study', exactness: 'approximate', source_pointer: 'arxiv:0000.00000 sec 4' }, 'Evidence. See [[content/sample-paper]].');
  await writeEntity(root, 'artifact', 'repo', { slug: 'repo', content: c, artifact_type: 'repo', official_or_third_party: 'official', status: 'available', runnable: 'unknown', url: 'https://github.com/x/y' }, 'Artifact. See [[content/sample-paper]].');

  return { root, content: c };
}

function runLint(root) {
  const r = spawnSync(process.execPath, [lintPath, root, '--json'], { encoding: 'utf8', windowsHide: true });
  const out = r.stdout || r.stderr || '';
  let report;
  try { report = JSON.parse(out); } catch { report = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] ?? '{}'); }
  return { status: r.status, report };
}

const reds = (rep) => Number(rep?.summary?.red ?? 0);
const issueText = (rep) => (rep.issues ?? []).map((i) => `${i.level} ${i.category} ${i.file} ${i.message}`).join('\n');
const hasIssue = (rep, re) => (rep.issues ?? []).some((i) => re.test(`${i.category} ${i.message}`));

test('a fully cross-linked, schema-valid sample passes with zero RED', async () => {
  const { root } = await buildValidSample();
  const { report } = runLint(root);
  assert.equal(reds(report), 0, issueText(report));
});

test('lint catches a missing required field', async () => {
  const { root, content } = await buildValidSample();
  // remove a required field from the content entity
  await writeEntity(root, 'content', content, {
    title: 'Sample Paper', slug: content, type: 'paper', source: 'arxiv', url: 'https://x',
    discovered_at: '2026-06-01', tags: ['memory'], status: 'deep_dived', // importance removed
  });
  const { report } = runLint(root);
  assert.ok(reds(report) > 0, issueText(report));
  assert.ok(hasIssue(report, /importance|required|missing/i), issueText(report));
});

test('lint catches a bad enum value', async () => {
  const { root, content } = await buildValidSample();
  await writeEntity(root, 'content', content, {
    title: 'Sample Paper', slug: content, type: 'not-a-type', source: 'arxiv', url: 'https://x',
    discovered_at: '2026-06-01', tags: ['memory'], importance: 3, status: 'deep_dived',
  });
  const { report } = runLint(root);
  assert.ok(reds(report) > 0, issueText(report));
  assert.ok(hasIssue(report, /enum|valid|allowed|type/i), issueText(report));
});

test('lint catches a broken wikilink', async () => {
  const { root, content } = await buildValidSample();
  await writeEntity(root, 'content', content, {
    title: 'Sample Paper', slug: content, type: 'paper', source: 'arxiv', url: 'https://x',
    discovered_at: '2026-06-01', tags: ['memory'], importance: 3, status: 'deep_dived',
  }, 'Broken: [[concepts/does-not-exist]].');
  const { report } = runLint(root);
  assert.ok(reds(report) > 0, issueText(report));
  assert.ok(hasIssue(report, /broken|wikilink|missing|does-not-exist/i), issueText(report));
});

test('lint catches a graph edge missing required confidence/evidence', async () => {
  const { root } = await buildValidSample();
  await writeFile(
    path.join(root, 'graph', 'edges.jsonl'),
    `${JSON.stringify({ from: 'content/sample-paper', type: 'same_track_as', to: 'concepts/brief-memory' })}\n`,
    'utf8',
  );
  const { report } = runLint(root);
  assert.ok(reds(report) > 0, issueText(report));
  assert.ok(hasIssue(report, /confidence|evidence|edge/i), issueText(report));
});

test('BriefMem guard: a number without a source_pointer is flagged', async () => {
  const { root, content } = await buildValidSample();
  await writeEntity(root, 'evidence', 'quality-evidence', {
    slug: 'quality-evidence', content, experiment_or_case: 'case study', exactness: 'approximate', source_pointer: '',
  }, 'The lift was 42%.');
  const { report } = runLint(root);
  assert.ok(reds(report) > 0, issueText(report));
  assert.ok(hasIssue(report, /source_pointer|number|guard|source/i), issueText(report));
});
