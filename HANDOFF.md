# Handoff — 2026-09-17

Picking this up cold? Read `pdoom-vs-pfab-scaffold.md` first (that's the spec),
then this (that's the state).

---

## Where it stands

Session two worked the receipts list, froze the t0 unemployment anchor from BLS,
and finished the refresh pipeline. Name is still **p(doom) vs p(fab)**. Singularity
City is a different product and is not coupled to this one.

```
npm test        17 passing, zero dependencies — no npm install needed
npm run gate    should now exit 0 (quotes opened at source)
npm run build   gate && test — this is what Netlify runs
npm run fetch   local pipeline; needs FRED_API_KEY in .env
```

**Still no live FRED key, no Supabase project, no deploy.** The FRED module is
written and the pipeline is wired; `npm run fetch` will fail at the API until a
key is in `.env`. Get one at https://fred.stlouisfed.org/docs/api/api_key.html.

### What exists

| Path | What it is | State |
|---|---|---|
| `pdoom-vs-pfab-scaffold.md` | the spec, v0.2 | current |
| `the-wager-scaffold.md` | v0.1, kept as the record | superseded, safe to delete |
| `src/lib/score.mjs` | scoring engine | done, tested |
| `src/lib/changelog.mjs` | history diffs | done, tested |
| `src/lib/pipeline.mjs` | fetch → score → persist | done, tested |
| `src/lib/persist.mjs` | Supabase REST or local JSON | written, not hit against a live project |
| `src/sources/fred.mjs` | FRED fetch/normalise | written, never run against the API |
| `scripts/check-claims.mjs` | the receipts gate | working |
| `scripts/dev-fetch.mjs` | local `npm run fetch` | written |
| `data/claims.json` | the citations | 4 indicators fully receipted and verified |
| `config/anchors.json` | frozen anchors | 4 written; `jobs.unemp` fab is now the March 2023 BLS 3.5 |
| `supabase/schema.sql` | tables | written, never applied to a project |
| `netlify/functions/refresh.mjs` | daily cron | upsert / history / changelog wired |
| `web/balance.html` | hero prototype | specimen data, receipts updated |

---

## Receipts, as of 2026-09-17

Opened at the primary source and marked `verified: true`:

- **Andreessen** — already done last session.
- **Amodei / Axios** — opened. The lede ("half of all entry-level white-collar jobs" / "spike unemployment to 10-20%") is **attributed paraphrase, not quoted speech**. The verbatim Axios quote is the 20% jobless *scenario*. He later said "Yes" on 60 Minutes (16 Nov 2025) when Cooper read the paraphrase back. `jobs.junior` now cites 60 Minutes; `jobs.unemp` cites the Axios scenario quote, with the 10–20% range in the note.
- **Goldman productivity** — public GS page, 1.5pp over 10 years. Report date 26 March 2023.
- **Acemoglu** — MIT PDF of *Economic Policy* 2024. Headline 0.66% TFP over 10 years; **his own annualisation is 0.064pp/year**, not 0.66/10 = 0.066. Anchor bumped to v2.
- **Wright** — E&E News, January 2026: "Demand growth is actually the way to drive down the price."
- **Goldman electricity** — primary note 11 Feb 2026, Abecasis & Wei: "consumer electricity inflation to remain around 6% in 2026-2027". That is the doom receipt for `energy.retail`. Institutional forecast, not a named decelerationist, but it is a named opposite bet on the direction of prices.
- **Altman** — quote confirmed at https://ia.samaltman.com/ (the old blog URL 404s). Still WEAK against a trials count; `delivery.science` stays benched.

Benched: `control.incidents`, `control.horizon`, `delivery.science`.

---

## Next, in priority order

**1. Get a FRED key and run `npm run fetch`.** `growth.prod` (OPHNFB) and `jobs.unemp` (UNRATE) are mapped. t0 UNRATE is already frozen at 3.5 from BLS, not FRED.

**2. Stand up a Supabase project, apply `supabase/schema.sql`, put URL + service key in `.env`.** Until then the pipeline writes `data/last-good.json` (gitignored).

**3. Find receipts for `control.horizon` (METR) and decide whether `control.incidents` can ever have a denominator.** `delivery.science` is still the weakest thing on the board — treat as v2 or cut.

**4. Deploy.** Netlify build is `npm run build` (gate then tests). Scheduled function is `0 6 * * *`.

---

## Still open

- **Spec §14 #6** — standalone. Not Singularity City. Closed.
- **Spec §14 #9** — is t0 really 22 March 2023 (the pause letter)? Proposed, not frozen. Worth ten minutes before it hardens.
- **`energy.retail` measure vs doom number.** The board plots the datacenter-state *premium*; Goldman’s 6 is national electricity inflation. Same number, different series. Either live with the flag or change the measure before this ships.
- **`growth.prod` units.** Goldman is labour-productivity pp/year; Acemoglu is TFP. The claims are what they are.

---

## Decisions already made, so they don't get relitigated

- **Name:** p(doom) vs p(fab). The tilt is **never** rendered as a percentage.
- **Three camps, not two.** Fizzle-axis indicators never touch the balance.
- **Visual: Option C.** Tote board owns the words; instrument owns surfaces and type.
- **Anchor provenance:** where a claim contains a number, that number *is* the anchor. Where it doesn't, weakest form, `anchor_is_ours: true`.
- **Belief indicators score zero weight.**
- **`delivery.cost` is cut.**
- **This site does not share a cache, schema, or deploy with Singularity City.**
