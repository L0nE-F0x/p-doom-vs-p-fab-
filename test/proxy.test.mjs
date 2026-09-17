import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProxyUrl } from '../src/lib/proxy.mjs';
import { loadAnchors } from '../src/lib/anchors.mjs';

test('FRED proxy keeps the series path and injects the key', () => {
  const dest = buildProxyUrl(
    'https://example.net/api/fred/series/observations?series_id=UNRATE',
    { prefix: '/api/fred', origin: 'https://api.stlouisfed.org/fred/', apiKey: 'secret', extraQuery: { file_type: 'json' } },
  );
  assert.equal(dest.origin + dest.pathname, 'https://api.stlouisfed.org/fred/series/observations');
  assert.equal(dest.searchParams.get('series_id'), 'UNRATE');
  assert.equal(dest.searchParams.get('api_key'), 'secret');
  assert.equal(dest.searchParams.get('file_type'), 'json');
});

test('a client-supplied api_key is discarded, not forwarded', () => {
  const dest = buildProxyUrl(
    'https://example.net/api/eia/v2/electricity?api_key=stolen',
    { prefix: '/api/eia', origin: 'https://api.eia.gov/', apiKey: 'real' },
  );
  assert.equal(dest.searchParams.get('api_key'), 'real');
});

test('frozen anchors load from the repo', () => {
  const cfg = loadAnchors();
  assert.equal(cfg.t0, '2023-03-22');
  assert.equal(cfg.anchors['jobs.unemp'].fab, 3.5);
});
