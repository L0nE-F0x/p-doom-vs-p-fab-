import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRefresh } from '../src/lib/pipeline.mjs';

function memoryPersist(seed = {}) {
  const indicators = { ...seed };
  const history = [];
  const changelog = [];
  return {
    indicators, history, changelog,
    async get(id) { return indicators[id] ?? null; },
    async write(row) {
      indicators[row.id] = row;
      if (row.status === 'ok') history.push(row);
    },
    async writeChangelog(entries) { changelog.push(...entries); },
  };
}

const source = (fetchSeries, normalise = obs => ({ value: obs.at(-1).value, asOf: obs.at(-1).date })) => ({
  indicators: {
    'jobs.unemp': { seriesId: 'UNRATE', axis: 'fab-doom', category: 'jobs', cadenceDays: 30, normalise },
  },
  fetchSeries,
});

const anchors = { 'jobs.unemp': { version: 1, fab: 3.5, doom: 10 } };

test('a live fetch is scored, persisted, and changelogged as added', async () => {
  const persist = memoryPersist();
  const src = source(async () => ({
    observations: [{ date: '2026-08-01', value: 4.4 }],
    provenance: { source_url: 'https://example.test', fetched_at: '2026-09-17T00:00:00Z' },
  }));
  const now = new Date('2026-09-01T00:00:00Z');
  const body = await runRefresh({ sources: [src], anchors, persist, now });
  assert.equal(body.results[0].status, 'ok');
  assert.ok(body.results[0].score < 0, '4.4 is closer to 3.5 than to 10');
  assert.equal(persist.indicators['jobs.unemp'].as_of, '2026-08-01');
  assert.equal(body.changelog[0].kind, 'added');
});

test('a dead source decays last-good instead of writing a silent zero', async () => {
  const persist = memoryPersist({
    'jobs.unemp': { id: 'jobs.unemp', status: 'ok', value: 4.4, score: -72, conf: 1, as_of: '2026-06-01' },
  });
  const src = source(async () => { throw new Error('FRED 503'); });
  const now = new Date('2026-09-01T00:00:00Z'); // ~92 days after as_of, cadence 30 → past 3×, conf 0
  const body = await runRefresh({ sources: [src], anchors, persist, now });
  assert.equal(body.results[0].status, 'stale');
  assert.equal(body.results[0].value, 4.4);
  assert.equal(body.results[0].conf, 0);
  assert.equal(body.changelog[0].kind, 'stale');
});
