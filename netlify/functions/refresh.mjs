/**
 * Scheduled daily 06:00 UTC (see config export below).
 *
 * Nothing here is live — BLS and EIA are monthly, productivity quarterly — so
 * most runs write no change at all. That is correct behaviour, not a bug, and
 * the page says so with a visible timestamp (scaffold §13).
 */
import * as fred from '../../src/sources/fred.mjs';
import anchorConfig from '../../config/anchors.json' with { type: 'json' };
import { runRefresh } from '../../src/lib/pipeline.mjs';
import { supabasePersist, filePersist } from '../../src/lib/persist.mjs';

const SOURCES = [fred];

function persistForEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (url && key) return supabasePersist({ url, key });
  return filePersist(new URL('../../data/last-good.json', import.meta.url).pathname);
}

export default async () => {
  const persist = persistForEnv();
  const body = await runRefresh({
    sources: SOURCES,
    anchors: anchorConfig.anchors,
    persist,
  });
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};

export const config = { schedule: '0 6 * * *' };
