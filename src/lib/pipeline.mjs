/**
 * One pass over every sourced indicator: fetch → normalise → score → persist.
 * A dead source falls back to last-good with decaying confidence, so the
 * failure is visible in the arithmetic (scaffold §9, §10).
 */
import { createHash } from 'node:crypto';
import { scoreIndicator, confidence } from './score.mjs';
import { changelogFrom } from './changelog.mjs';

const daysSince = (d, now) => (now - new Date(d)) / 864e5;
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function staleFrom(prev, spec, now, why) {
  const base = {
    id: prev?.id,
    status: 'stale',
    why,
    category: spec.category,
    axis: spec.axis,
  };
  if (!prev || prev.value == null) return base;
  return {
    ...prev,
    ...base,
    conf: confidence(daysSince(prev.as_of, now), spec.cadenceDays),
  };
}

export async function runRefresh({ sources, anchors, persist, now = new Date() }) {
  const results = [];
  const changelog = [];

  for (const source of sources) {
    for (const [id, spec] of Object.entries(source.indicators)) {
      const anchor = anchors[id];
      if (!anchor) { results.push({ id, status: 'skipped', why: 'no frozen anchor' }); continue; }

      const prev = persist ? await persist.get(id) : null;

      try {
        const raw = await source.fetchSeries(spec.seriesId);
        const norm = spec.normalise(raw.observations);
        if (!norm) throw new Error('normalise returned nothing');

        const row = {
          id,
          status: 'ok',
          category: spec.category,
          axis: spec.axis,
          value: norm.value,
          score: scoreIndicator(norm.value, anchor),
          conf: confidence(daysSince(norm.asOf, now), spec.cadenceDays),
          as_of: norm.asOf,
          anchor_version: anchor.version,
          ...raw.provenance,
          response_hash: sha(raw.observations),
        };
        results.push(row);
        const entry = changelogFrom(prev, row);
        if (entry) changelog.push({ ...entry, happened_on: row.as_of });
        if (persist) await persist.write(row, { previous: prev });
      } catch (err) {
        const row = staleFrom(prev, spec, now, err.message);
        results.push({ ...row, id });
        const entry = changelogFrom(prev, { ...row, id });
        if (entry) changelog.push({ ...entry, happened_on: now.toISOString().slice(0, 10) });
        if (persist && row.value != null) await persist.write({ ...row, id }, { previous: prev });
      }
    }
  }

  if (persist) await persist.writeChangelog(changelog);
  return { ran_at: now.toISOString(), results, changelog };
}
