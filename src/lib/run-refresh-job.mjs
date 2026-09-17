/**
 * Shared body of the daily job. Used by the scheduled Netlify function, the
 * on-demand /api/refresh endpoint, and local `npm run fetch`.
 *
 * On Netlify, persist only if Supabase is configured — the Lambda filesystem
 * is ephemeral, so a JSON file fallback would lie.
 */
import * as fred from '../sources/fred.mjs';
import { loadAnchors } from './anchors.mjs';
import { runRefresh } from './pipeline.mjs';
import { filePersist, supabasePersist } from './persist.mjs';
import { fileURLToPath } from 'node:url';

export function persistForEnv({ allowFile = false } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (url && key) return supabasePersist({ url, key });
  if (allowFile) {
    return filePersist(fileURLToPath(new URL('../../data/last-good.json', import.meta.url)));
  }
  return null;
}

export async function runRefreshJob({ persist = persistForEnv() } = {}) {
  const anchorConfig = loadAnchors();
  return runRefresh({
    sources: [fred],
    anchors: anchorConfig.anchors,
    persist,
  });
}
