// scripts/kg/brief-edges.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractWikilinkTargets,
  extractArxivIds,
  makeWikilinkResolver,
  buildWikilinkEdges,
  buildSameTrackEdges,
  buildImplementsEdges,
} from './brief-edges.mjs';

// ── fixtures ───────────────────────────────────────────────────────
const NODES = [
  { id: 'content/agemem', type: 'content', slug: 'agemem', tags: ['agent-memory', 'llm-agents', 'reinforcement-learning'] },
  { id: 'content/memoryagentbench', type: 'content', slug: 'memoryagentbench', tags: ['agent-memory', 'evaluation', 'llm-agents'] },
  { id: 'concept/agentic-memory', type: 'concept', slug: 'agentic-memory', tags: [] },
  { id: 'method/step-wise-grpo', type: 'method', slug: 'step-wise-grpo', tags: [] },
  { id: 'me', type: 'taste', slug: 'me', tags: [] },
  { id: 'paper:2606.02437', type: 'paper', slug: '2606.02437-scaling-peft', title: 'On the Scaling of PEFT: Million Personal Models', arxiv_id: '2606.02437', tags: ['lora', 'agent-memory', 'persistent-state'] },
];

// ── extractWikilinkTargets ─────────────────────────────────────────
test('extractWikilinkTargets parses dir/slug, alias, embed and ignores anchors', () => {
  const text = '- [[concepts/agentic-memory]] and [[methods/step-wise-grpo#training|GRPO]] and ![[artifacts/x]] and [[taste/me]]';
  assert.deepEqual(extractWikilinkTargets(text), [
    'concepts/agentic-memory',
    'methods/step-wise-grpo',
    'artifacts/x',
    'taste/me',
  ]);
});

// ── extractArxivIds ────────────────────────────────────────────────
test('extractArxivIds finds ids and strips version, dedupes', () => {
  const text = 'see arxiv:2606.02437v2 and 2606.02437 and https://arxiv.org/abs/2308.00352';
  assert.deepEqual(extractArxivIds(text).sort(), ['2308.00352', '2606.02437']);
});

// ── makeWikilinkResolver ───────────────────────────────────────────
test('resolver maps dir-prefix to node-id type and bare/aliased slugs', () => {
  const resolve = makeWikilinkResolver(NODES);
  assert.equal(resolve('concepts/agentic-memory'), 'concept/agentic-memory');
  assert.equal(resolve('methods/step-wise-grpo'), 'method/step-wise-grpo');
  assert.equal(resolve('content/agemem'), 'content/agemem');
  assert.equal(resolve('taste/me'), 'me'); // dir/slug where slug alone is the id
  assert.equal(resolve('content/does-not-exist'), null); // unresolved → null (skipped)
  assert.equal(resolve('index'), null);
});

// ── buildWikilinkEdges ─────────────────────────────────────────────
test('buildWikilinkEdges emits references edges, skips unresolved + self + dups', () => {
  const resolve = makeWikilinkResolver(NODES);
  const sources = [
    {
      id: 'content/agemem',
      file: 'content/agemem.md',
      links: [
        'concepts/agentic-memory', // resolves
        'methods/step-wise-grpo', // resolves
        'concepts/agentic-memory', // duplicate → deduped
        'content/agemem', // self-loop → skipped
        'concepts/ghost-node', // unresolved → skipped
      ],
    },
  ];
  const { edges, resolved, unresolved } = buildWikilinkEdges(sources, resolve);
  assert.equal(resolved, 4); // agentic-memory x2 + grpo + self all resolve
  assert.equal(unresolved, 1); // ghost-node
  assert.equal(edges.length, 2); // dedup + self-loop removed
  assert.ok(edges.every((e) => e.type === 'references'));
  assert.ok(edges.every((e) => /链接出现在/.test(e.evidence)));
  assert.deepEqual(
    edges.map((e) => e.to).sort(),
    ['concept/agentic-memory', 'method/step-wise-grpo'],
  );
});

// ── buildSameTrackEdges ────────────────────────────────────────────
test('buildSameTrackEdges links >=2 shared meaningful tags, ignores generic', () => {
  const { edges } = buildSameTrackEdges(NODES, { threshold: 2, perNodeCap: 6 });
  // agemem & memoryagentbench share agent-memory + llm-agents (2) → edge
  const e = edges.find(
    (x) =>
      (x.from === 'content/agemem' && x.to === 'content/memoryagentbench') ||
      (x.from === 'content/memoryagentbench' && x.to === 'content/agemem'),
  );
  assert.ok(e, 'expected same_track edge between the two agent-memory nodes');
  assert.equal(e.type, 'same_track');
  assert.ok(['high', 'medium'].includes(e.confidence));
  assert.ok(/共享标签/.test(e.evidence));
  // agemem & PEFT paper share only agent-memory (1, since l/llm differ) → NO edge
  const cross = edges.find(
    (x) =>
      (x.from === 'content/agemem' && x.to === 'paper:2606.02437') ||
      (x.from === 'paper:2606.02437' && x.to === 'content/agemem'),
  );
  assert.equal(cross, undefined);
});

test('buildSameTrackEdges respects perNodeCap', () => {
  // hub shares 2 tags with 5 others; cap of 2 → at most 2 edges touch hub
  const tags = ['x', 'y'];
  const nodes = [
    { id: 'hub', tags },
    { id: 'a', tags },
    { id: 'b', tags },
    { id: 'c', tags },
    { id: 'd', tags },
    { id: 'e', tags },
  ];
  const { edges } = buildSameTrackEdges(nodes, { threshold: 2, perNodeCap: 2 });
  const hubDeg = edges.filter((x) => x.from === 'hub' || x.to === 'hub').length;
  assert.ok(hubDeg <= 2, `hub degree ${hubDeg} exceeded cap`);
});

// ── buildImplementsEdges ───────────────────────────────────────────
test('buildImplementsEdges matches arXiv ref (high) and title overlap (medium)', () => {
  const papers = [
    { id: 'paper:2606.02437', type: 'paper', arxiv_id: '2606.02437', title: 'Scaling PEFT Personal Models', slug: '2606.02437-scaling-peft-personal-models' },
  ];
  const projects = [
    { id: 'radar:org/peft-runner', type: 'project', title: 'peft runner', slug: 'peft-runner', arxivRefs: ['2606.02437'] },
    { id: 'radar:org/scaling-peft-personal', type: 'project', title: 'Scaling PEFT Personal toolkit', slug: 'scaling-peft-personal', arxivRefs: [] },
    { id: 'radar:org/unrelated', type: 'project', title: 'video editor', slug: 'video-editor', arxivRefs: [] },
  ];
  const { edges } = buildImplementsEdges(projects, papers, { minTitleTokenOverlap: 2 });
  const byArxiv = edges.find((e) => e.from === 'radar:org/peft-runner');
  assert.ok(byArxiv, 'expected arXiv-ref implements edge');
  assert.equal(byArxiv.type, 'implements');
  assert.equal(byArxiv.confidence, 'high');

  const byTitle = edges.find((e) => e.from === 'radar:org/scaling-peft-personal');
  assert.ok(byTitle, 'expected title-overlap implements edge');
  assert.equal(byTitle.confidence, 'medium');

  const unrelated = edges.find((e) => e.from === 'radar:org/unrelated');
  assert.equal(unrelated, undefined, 'unrelated project must not match');
});
