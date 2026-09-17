/**
 * On-demand run of the same job as the daily cron. Useful to confirm keys
 * after a deploy: GET /api/refresh
 */
import { runRefreshJob } from '../../src/lib/run-refresh-job.mjs';

export default async () => {
  const body = await runRefreshJob();
  const ok = body.results.every(r => r.status === 'ok' || r.status === 'skipped');
  return Response.json(body, { status: ok ? 200 : 502 });
};

export const config = { path: '/api/refresh' };
