/**
 * FRED — free key, REST, good docs. The easiest source on the board, which is
 * why it is the pipeline proof.
 *
 * Every source module implements the same three:
 *   fetch()      pull raw observations
 *   normalise()  raw -> { value, asOf } in the unit the anchor is written in
 *   lastGood()   what to serve when fetch() fails
 */

const BASE = 'https://api.stlouisfed.org/fred/series/observations';

export const meta = {
  id: 'fred',
  cadenceDays: { OPHNFB: 91, UNRATE: 30 },
  keyEnv: 'FRED_API_KEY',
};

export async function fetchSeries(seriesId, { apiKey = process.env.FRED_API_KEY, from = '2015-01-01', fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) throw new Error(`missing ${meta.keyEnv}`);
  const url = `${BASE}?series_id=${encodeURIComponent(seriesId)}&observation_start=${from}&file_type=json&api_key=${apiKey}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status} ${res.statusText}`);
  const body = await res.json();
  return {
    seriesId,
    observations: body.observations
      .filter(o => o.value !== '.')                       // FRED's missing marker
      .map(o => ({ date: o.date, value: Number(o.value) })),
    // Provenance travels with the data, not in a comment (scaffold §8).
    provenance: { source_url: url.replace(apiKey, 'REDACTED'), fetched_at: new Date().toISOString() },
  };
}

/** Annualised growth of an index over `years`, in percentage points. */
export function annualisedGrowth(observations, years = 5) {
  if (observations.length < 2) return null;
  const last = observations.at(-1);
  const target = new Date(last.date);
  target.setFullYear(target.getFullYear() - years);
  // nearest observation at or before the target date
  let base = null;
  for (const o of observations) { if (new Date(o.date) <= target) base = o; else break; }
  if (!base || base.value <= 0) return null;
  const spanYears = (new Date(last.date) - new Date(base.date)) / (365.25 * 864e5);
  if (spanYears <= 0) return null;
  return { value: (Math.pow(last.value / base.value, 1 / spanYears) - 1) * 100, asOf: last.date, baseDate: base.date };
}

/** Level as-is — for claims that were made about a level, like unemployment. */
export function latestLevel(observations) {
  const last = observations.at(-1);
  return last ? { value: last.value, asOf: last.date } : null;
}

/** Last-good is the previous persisted row. The orchestrator decays confidence. */
export function lastGood(previous) {
  return previous ?? null;
}

export const indicators = {
  'growth.prod': {
    seriesId: 'OPHNFB',
    axis: 'fab-fizzle',
    category: 'growth',
    cadenceDays: 91,
    normalise: obs => annualisedGrowth(obs, 5),
    unit: 'pp_per_year',
  },
  'jobs.unemp': {
    seriesId: 'UNRATE',
    axis: 'fab-doom',
    category: 'jobs',
    cadenceDays: 30,
    normalise: latestLevel,
    unit: 'percent_level',
  },
};
