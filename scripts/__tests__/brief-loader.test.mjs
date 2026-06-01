import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EDGES,
  ENTITIES,
  ENTITY_DIRS,
  FIELD_DEFAULTS,
  LIFECYCLE,
  REQUIRED_FIELDS,
  VALID_EDGE_TYPES,
  VALID_VALUES,
  slugRule,
  validateEdgeAttributes,
} from '../brief/loader.mjs';

test('loader exposes the schema metadata wiki/lint/build depend on', () => {
  assert.ok(Object.keys(ENTITIES).length > 0, 'ENTITIES populated');
  assert.ok(Object.keys(ENTITY_DIRS).length > 0, 'ENTITY_DIRS populated');
  assert.ok(Object.keys(REQUIRED_FIELDS).length > 0, 'REQUIRED_FIELDS populated');
  assert.equal(typeof FIELD_DEFAULTS, 'object');
  assert.ok(Object.keys(VALID_VALUES).length > 0, 'VALID_VALUES populated');
  assert.ok(Object.keys(EDGES).length > 0, 'EDGES populated');
  assert.ok(VALID_EDGE_TYPES.length > 0, 'VALID_EDGE_TYPES populated');
  assert.ok(slugRule, 'slugRule exported');
  assert.equal(typeof validateEdgeAttributes, 'function');
});

test('ENTITY_DIRS are relative to the wiki root (regression: doubled brief-wiki/ prefix)', () => {
  for (const [kind, dir] of Object.entries(ENTITY_DIRS)) {
    const normalized = String(dir).replace(/\\/g, '/').replace(/^\/+/, '');
    assert.ok(!normalized.startsWith('brief-wiki/'), `${kind} dir leaked the wiki-root prefix: ${dir}`);
    assert.notEqual(normalized, 'brief-wiki', `${kind} dir should not equal the wiki root`);
    assert.ok(normalized.length > 0, `${kind} dir should be non-empty`);
  }
});

test('content entity carries the expected required fields and enums', () => {
  const required = REQUIRED_FIELDS.content ?? [];
  for (const field of ['title', 'slug', 'type', 'source', 'url', 'discovered_at', 'tags', 'importance', 'status']) {
    assert.ok(required.includes(field), `content should require ${field}`);
  }
  assert.deepEqual(VALID_VALUES.content.type, ['paper', 'project', 'model', 'podcast']);
  assert.ok(VALID_VALUES.content.status.includes('discovered'));
});

test('deep-dive exposes the universal shape switch', () => {
  const shapes = VALID_VALUES['deep-dive'].shape;
  for (const shape of ['paper', 'model-open', 'model-changelog', 'install', 'agent-build', 'howto-use', 'roadmap', 'research-impl']) {
    assert.ok(shapes.includes(shape), `shape enum should include ${shape}`);
  }
});

test('LIFECYCLE is collected per entity (content transitions are present)', () => {
  assert.ok(LIFECYCLE.content, 'content should have a lifecycle');
  const transitions = LIFECYCLE.content.transitions ?? LIFECYCLE.content;
  assert.ok(transitions.discovered, 'content lifecycle should start at discovered');
});

test('graph edge contract includes the irreducible BriefGraph types', () => {
  for (const type of ['same_track_as', 'extends', 'uses_method', 'realizes_concept', 'supports_claim']) {
    assert.ok(VALID_EDGE_TYPES.includes(type), `edge type ${type} should be defined`);
  }
});
