/**
 * Scheduled daily 06:00 UTC.
 *
 * Nothing here is live — BLS and EIA are monthly, productivity quarterly — so
 * most runs write no change at all. That is correct behaviour (scaffold §13).
 */
import { runRefreshJob } from '../../src/lib/run-refresh-job.mjs';

export default async () => {
  const body = await runRefreshJob();
  return Response.json(body);
};

export const config = { schedule: '0 6 * * *' };
