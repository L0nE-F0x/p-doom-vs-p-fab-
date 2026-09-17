import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreIndicator, confidence, computeTilt, renderTilt } from '../src/lib/score.mjs';

test('anchors map to the poles regardless of direction', () => {
  const desc = { fab: 0, doom: -50 };   // jobs.junior: doom anchor is lower
  assert.equal(scoreIndicator(0, desc), -100);
  assert.equal(scoreIndicator(-50, desc), 100);
  assert.equal(scoreIndicator(-25, desc), 0);

  const asc = { fab: 3.5, doom: 10 };   // jobs.unemp: doom anchor is higher
  assert.equal(scoreIndicator(3.5, asc), -100);
  assert.equal(scoreIndicator(10, asc), 100);
});

test('values beyond the anchors clamp instead of running away', () => {
  assert.equal(scoreIndicator(-90, { fab: 0, doom: -50 }), 100);
  assert.equal(scoreIndicator(40, { fab: 0, doom: -50 }), -100);
});

test('identical poles are a config error, not a divide by zero', () => {
  assert.throws(() => scoreIndicator(1, { fab: 2, doom: 2 }), /identical/);
});

test('confidence holds, decays, then zeroes', () => {
  const q = 91;                                   // quarterly
  assert.equal(confidence(0, q), 1);
  assert.equal(confidence(1.5 * q, q), 1);        // still fresh at 1.5x
  assert.equal(confidence(2.25 * q, q), 0.5);     // halfway through the decay
  assert.equal(confidence(3 * q, q), 0);          // dead
  assert.equal(confidence(400, q), 0);
});

test('categories average, so correlated indicators cannot stack', () => {
  // Three doom-leaning jobs indicators must not outvote one fab-leaning energy one.
  const scored = [
    { id: 'jobs.a', category: 'jobs', axis: 'fab-doom', score: 60, conf: 1 },
    { id: 'jobs.b', category: 'jobs', axis: 'fab-doom', score: 60, conf: 1 },
    { id: 'jobs.c', category: 'jobs', axis: 'fab-doom', score: 60, conf: 1 },
    { id: 'energy.a', category: 'energy', axis: 'fab-doom', score: -60, conf: 1 },
  ];
  assert.equal(computeTilt(scored).tilt, 0);
});

test('a fizzle never lands on the doom side of the balance', () => {
  const scored = [
    { id: 'growth.prod', category: 'growth', axis: 'fab-fizzle', score: 100, conf: 1 },
    { id: 'energy.retail', category: 'energy', axis: 'fab-doom', score: -40, conf: 1 },
  ];
  const r = computeTilt(scored);
  assert.equal(r.tilt, -40, 'tilt reflects only the fab-doom axis');
  assert.equal(r.fizzle, 100, 'the fizzle reads out separately');
});

test('a stale indicator leaves the tilt instead of holding it at a dead value', () => {
  const scored = [
    { id: 'fresh', category: 'jobs', axis: 'fab-doom', score: -50, conf: 1 },
    { id: 'dead', category: 'energy', axis: 'fab-doom', score: 100, conf: 0 },
  ];
  const r = computeTilt(scored);
  assert.equal(r.tilt, -50);
  assert.deepEqual(r.excluded, ['dead']);
  assert.equal(r.counted, 1);
});

test('all-dead returns null rather than a confident zero', () => {
  const r = computeTilt([{ id: 'dead', category: 'jobs', axis: 'fab-doom', score: 80, conf: 0 }]);
  assert.equal(r.tilt, null);
  assert.equal(renderTilt(r.tilt).doom, null);
});

test('weights re-run the argument', () => {
  const scored = [
    { id: 'j', category: 'jobs', axis: 'fab-doom', score: 100, conf: 1 },
    { id: 'e', category: 'energy', axis: 'fab-doom', score: -100, conf: 1 },
  ];
  assert.equal(computeTilt(scored, { jobs: 1, energy: 1 }).tilt, 0);
  assert.equal(computeTilt(scored, { jobs: 3, energy: 1 }).tilt, 50);
});

test('the hero never renders as a percentage', () => {
  const r = renderTilt(-18);
  assert.equal(r.doom, 41);
  assert.equal(r.fab, 59);
  assert.equal(r.doom + r.fab, 100);
  assert.ok(!JSON.stringify(r).includes('%'));
});
