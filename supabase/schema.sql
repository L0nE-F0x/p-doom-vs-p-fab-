-- p(doom) vs p(fab) — schema
--
-- The credibility of this project lives in two properties of these tables:
-- history is append-only, and every row can reproduce its own score without
-- consulting anything else. Both are load-bearing (scaffold §8).

create table indicators (
  id            text primary key,          -- 'jobs.junior'
  category      text not null,             -- 'jobs'  — correlated series share one
  axis          text not null check (axis in ('fab-doom', 'fab-fizzle', 'belief')),
  value         double precision,
  score         double precision,          -- -100 fab .. +100 doom/fizzle
  conf          double precision not null default 1,
  as_of         date,                      -- what the source says the reading covers
  updated_at    timestamptz not null default now(),  -- when we last pulled
  retired_at    date,                      -- set when a source dies for good
  retired_note  text
);

-- Append only. No UPDATE, no DELETE — enforced below, not just by convention.
create table indicator_history (
  row_id          bigserial primary key,
  indicator_id    text not null references indicators(id),
  as_of           date not null,
  raw_value       double precision not null,  -- exactly what the source returned
  score           double precision not null,  -- what we computed from it
  conf            double precision not null,
  anchor_version  int not null,               -- so re-anchoring never rewrites the past
  source_url      text not null,
  fetched_at      timestamptz not null,
  response_hash   text not null,
  revised_from    bigint references indicator_history(row_id),  -- BLS revises; we append
  inserted_at     timestamptz not null default now()
);

create unique index on indicator_history (indicator_id, as_of, anchor_version)
  where revised_from is null;
create index on indicator_history (indicator_id, as_of desc);

create rule no_update as on update to indicator_history do instead nothing;
create rule no_delete as on delete to indicator_history do instead nothing;

-- The return hook. On most days nothing moves; this is what makes a Tuesday
-- visit worthwhile (scaffold §8).
create table changelog (
  id            bigserial primary key,
  happened_on   date not null,
  indicator_id  text references indicators(id),
  kind          text not null check (kind in ('move', 'revision', 'stale', 'retired', 'anchor_change', 'added')),
  delta         double precision,
  summary       text not null,      -- 'jobs.junior moved 4 toward doom'
  created_at    timestamptz not null default now()
);
create index on changelog (happened_on desc);
