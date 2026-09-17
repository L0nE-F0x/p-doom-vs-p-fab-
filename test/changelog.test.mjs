import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changelogFrom } from '../src/lib/changelog.mjs';

test('first live reading is an add, not a move', () => {
  const e = changelogFrom(null, { id: 'jobs.unemp', status: 'ok', score: -70, value: 4.4, as_of: '2026-08-01' });
  assert.equal(e.kind, 'added');
  assert.equal(e.indicator_id, 'jobs.unemp');
});

test('a same-as-of restatement is a revision, never an overwrite', () => {
  const prev = { id: 'jobs.unemp', status: 'ok', score: -72, value: 4.3, as_of: '2026-08-01' };
  const next = { id: 'jobs.unemp', status: 'ok', score: -69, value: 4.4, as_of: '2026-08-01' };
  const e = changelogFrom(prev, next);
  assert.equal(e.kind, 'revision');
  assert.equal(e.delta, 3);
  assert.match(e.summary, /4\.3 → 4\.4/);
  assert.match(e.summary, /toward doom/);
});

test('a move smaller than one point is not worth a Tuesday visit', () => {
  const prev = { id: 'jobs.unemp', status: 'ok', score: -70, value: 4.4, as_of: '2026-07-01' };
  const next = { id: 'jobs.unemp', status: 'ok', score: -70.4, value: 4.41, as_of: '2026-08-01' };
  assert.equal(changelogFrom(prev, next), null);
});

test('crossing a point toward fab is a move', () => {
  const prev = { id: 'energy.retail', status: 'ok', score: 10, value: 3, as_of: '2026-06-01' };
  const next = { id: 'energy.retail', status: 'ok', score: -5, value: 2, as_of: '2026-07-01' };
  const e = changelogFrom(prev, next);
  assert.equal(e.kind, 'move');
  assert.match(e.summary, /toward fab/);
});

test('a newly dead source is marked stale, not zeroed', () => {
  const prev = { id: 'energy.retail', status: 'ok', score: 13, value: 3.4, as_of: '2026-07-01' };
  const next = { id: 'energy.retail', status: 'stale', why: 'EIA 503' };
  const e = changelogFrom(prev, next);
  assert.equal(e.kind, 'stale');
  assert.match(e.summary, /went stale/);
});
