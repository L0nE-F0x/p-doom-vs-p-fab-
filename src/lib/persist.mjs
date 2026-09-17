/**
 * Two backends, same shape. The Netlify cron uses Supabase; local `npm run fetch`
 * uses a JSON file so the pipeline can be run without a project.
 *
 * History is insert-only. The indicators row is the current snapshot and may
 * be upserted. Changelog is append-only.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const headers = key => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

export function filePersist(path) {
  const load = () => {
    if (!existsSync(path)) return { indicators: {}, history: [], changelog: [] };
    return JSON.parse(readFileSync(path, 'utf8'));
  };
  const save = data => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  };

  return {
    async get(id) {
      return load().indicators[id] ?? null;
    },
    async write(row, { previous } = {}) {
      const data = load();
      data.indicators[row.id] = row;
      if (row.status === 'ok') {
        data.history.push({
          indicator_id: row.id,
          as_of: row.as_of,
          raw_value: row.value,
          score: row.score,
          conf: row.conf,
          anchor_version: row.anchor_version,
          source_url: row.source_url,
          fetched_at: row.fetched_at,
          response_hash: row.response_hash,
          revised_from: previous?.as_of === row.as_of ? previous.response_hash ?? null : null,
          inserted_at: new Date().toISOString(),
        });
      }
      save(data);
    },
    async writeChangelog(entries) {
      if (!entries.length) return;
      const data = load();
      const today = new Date().toISOString().slice(0, 10);
      for (const e of entries) {
        data.changelog.push({ ...e, happened_on: e.happened_on ?? today, created_at: new Date().toISOString() });
      }
      save(data);
    },
  };
}

export function supabasePersist({ url, key, fetchImpl = globalThis.fetch }) {
  const root = url.replace(/\/$/, '');
  const h = headers(key);

  return {
    async get(id) {
      const res = await fetchImpl(`${root}/rest/v1/indicators?id=eq.${encodeURIComponent(id)}`, { headers: h });
      if (!res.ok) throw new Error(`supabase get ${id}: ${res.status}`);
      const rows = await res.json();
      return rows[0] ?? null;
    },
    async write(row, { previous } = {}) {
      const snapshot = {
        id: row.id,
        category: row.category,
        axis: row.axis,
        value: row.value ?? null,
        score: row.score ?? null,
        conf: row.conf ?? 0,
        as_of: row.as_of ?? null,
        updated_at: new Date().toISOString(),
      };
      const up = await fetchImpl(`${root}/rest/v1/indicators`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify(snapshot),
      });
      if (!up.ok) throw new Error(`supabase upsert ${row.id}: ${up.status} ${await up.text()}`);

      if (row.status !== 'ok') return;

      let revisedFrom = null;
      if (previous?.as_of === row.as_of) {
        const hist = await fetchImpl(
          `${root}/rest/v1/indicator_history?indicator_id=eq.${encodeURIComponent(row.id)}&as_of=eq.${row.as_of}&order=inserted_at.desc&limit=1`,
          { headers: h },
        );
        if (hist.ok) {
          const [last] = await hist.json();
          revisedFrom = last?.row_id ?? null;
        }
      }

      const ins = await fetchImpl(`${root}/rest/v1/indicator_history`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          indicator_id: row.id,
          as_of: row.as_of,
          raw_value: row.value,
          score: row.score,
          conf: row.conf,
          anchor_version: row.anchor_version,
          source_url: row.source_url,
          fetched_at: row.fetched_at,
          response_hash: row.response_hash,
          revised_from: revisedFrom,
        }),
      });
      if (!ins.ok) throw new Error(`supabase history ${row.id}: ${ins.status} ${await ins.text()}`);
    },
    async writeChangelog(entries) {
      if (!entries.length) return;
      const today = new Date().toISOString().slice(0, 10);
      const body = entries.map(e => ({
        happened_on: e.happened_on ?? today,
        indicator_id: e.indicator_id,
        kind: e.kind,
        delta: e.delta,
        summary: e.summary,
      }));
      const res = await fetchImpl(`${root}/rest/v1/changelog`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`supabase changelog: ${res.status} ${await res.text()}`);
    },
  };
}
