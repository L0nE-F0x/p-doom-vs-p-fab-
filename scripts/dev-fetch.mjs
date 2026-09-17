#!/usr/bin/env node
/**
 * Local run of the daily pipeline. Reads .env if present (never committed).
 * Writes data/last-good.json unless SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
 */
import { readFileSync, existsSync } from 'node:fs';
import { persistForEnv, runRefreshJob } from '../src/lib/run-refresh-job.mjs';

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

const body = await runRefreshJob({ persist: persistForEnv({ allowFile: true }) });
console.log(JSON.stringify(body, null, 2));
if (body.results.some(r => r.status !== 'ok')) process.exitCode = 1;
