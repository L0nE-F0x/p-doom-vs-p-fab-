#!/usr/bin/env node
/**
 * Local run of the daily pipeline. Reads .env if present (never committed).
 * Writes data/last-good.json unless SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
 */
import { readFileSync, existsSync } from 'node:fs';
import * as fred from '../src/sources/fred.mjs';
import anchorConfig from '../config/anchors.json' with { type: 'json' };
import { runRefresh } from '../src/lib/pipeline.mjs';
import { supabasePersist, filePersist } from '../src/lib/persist.mjs';

function loadEnv() {
  const p = new URL('../.env', import.meta.url);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

loadEnv();

const persist = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? supabasePersist({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_KEY })
  : filePersist(new URL('../data/last-good.json', import.meta.url).pathname);

const body = await runRefresh({
  sources: [fred],
  anchors: anchorConfig.anchors,
  persist,
});

console.log(JSON.stringify(body, null, 2));
if (body.results.some(r => r.status !== 'ok')) process.exitCode = 1;
