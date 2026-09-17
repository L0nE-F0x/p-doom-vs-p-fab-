# p(doom) vs p(fab) — project scaffold v0.2

A single page that keeps score in the argument between AI doomers and AI
accelerationists, using live public data. Not a prediction. A scoreboard for a
bet that's already been placed.

Status: pre-spec. Supersedes `the-wager-scaffold.md` (v0.1).

**Changed in v0.2:** name committed · the one rule hardened into a data contract
that can refuse an indicator · the doom/fizzle conflation split out · scoring
moved from levels to change-since-t0 with two-level weighting · belief
indicators demoted out of the score · rejected-indicator registry added.

---

## 1. The name

**p(doom) vs p(fab)**

p(doom) is borrowed as-is: the probability that this goes catastrophically
wrong. p(fab) is ours, and it has to be defined on the page in one line or the
pun does nothing:

> **p(fab)** — the probability that it goes fabulously right. Named for the
> fabs, because that is what the other side is building.

Two guardrails, both non-negotiable, both cheap:

- **The tilt is never rendered as a percentage.** No `%`, no `0.41`, no decimal
  that could be screenshotted as "this site says P(doom) is 41%". The hero reads
  as a signed position on a scale, or as a physical balance with no number
  attached at all. We borrowed the notation for the title; we do not get to
  borrow its authority.
- **The subtitle does the disambiguation.** "Who is winning the argument so
  far" — present perfect, scoped to the record, making no claim about the end
  state.

The name is a joke about probability notation. The page underneath it must be
visibly not a probability estimate, or the first reply is the last word.

---

## 2. The two rules

### Rule one — opposition

**An indicator only earns a place on the page if the two camps would have bet
opposite ways on it.**

Frontier benchmark scores don't qualify — both camps predicted those would
climb. Datacenter buildout doesn't qualify — both predicted that too. What
qualifies is where they made genuinely opposing claims about the world.

### Rule two — receipts, enforced

v0.1 said every indicator "ships with its receipts". That was an editorial
intention, and editorial intentions lose to deadlines. Make it a schema
constraint instead:

```jsonc
{
  "id": "jobs.junior",
  "claims": {
    "fab":  { "who": "", "when": "", "source_url": "", "quote": "" },
    "doom": { "who": "", "when": "", "source_url": "", "quote": "" }
  }
}
```

**Both claim slots require a named person, a date, a link, and a verbatim
quote. An indicator with an empty slot does not render.** Not "renders with a
caveat" — does not render. The build fails.

This is the single most important change in v0.2, because the failure mode it
prevents is the one that kills the project: us writing a plausible-sounding
"Accelerationists said: …" that nobody ever actually said, and a hostile reader
finding it. Every paraphrase in v0.1's registry is currently unsourced. Some of
them will survive contact with a citation search. Some won't — see §6.

Where only one side has a real quote, the indicator is not disqualified
forever; it goes to the bench with the missing slot named, so the gap is a
to-do rather than a silent invention.

---

## 3. The third camp

v0.1 has a structural bug: it treats "decelerationist" and "skeptic" as one
side. They are not, and collapsing them is how the board ends up dishonest.

|  | it works | it doesn't |
|---|---|---|
| **good** | **fab** — abundance, growth, cures | — |
| **bad** | **doom** — displacement, concentration, loss of control | **fizzle** — no boom, narrow benefits, plateau |

v0.1 scores "productivity growth didn't show up" as a point against the
accelerationists, which is fair, and then lets it fall onto the doom side of
the balance, which is not. **A fizzle refutes p(fab). It does not confirm
p(doom).** Gary Marcus being right is not Eliezer Yudkowsky being right, and a
board that quietly converts one into the other is exactly the stacked deck
we'll be accused of.

So: every indicator is tagged with the axis it resolves —

- `fab↔doom` — scores the balance
- `fab↔fizzle` — scores a **separate readout**, shown below the balance, never
  added into the tilt

The fizzle track is a feature, not a caveat. It is the only place on the
internet keeping that particular score, and it's the honest answer to "your
needle only moves one way".

---

## 4. When the bet was placed

A scoreboard needs a kickoff. Without one, every indicator is a level with no
meaning — unemployment at 4.2% scores nothing; unemployment *versus where it
was when the claims were made* scores everything.

**Proposed t0: 22 March 2023** — the FLI pause letter and the e/acc response to
it. That week is the closest thing to a moment when both camps put falsifiable
claims on the record simultaneously, it predates almost all of the data we'll
plot, and it's a date we can defend in one sentence.

Everything on the page is change since t0. The page says so at the top.

Consequence: indicators whose data doesn't reach back to March 2023 can't ship
until they do, or ship with an explicit later t0 of their own, shown inline.
Per-indicator t0 overrides are allowed and must be visible.

---

## 5. Indicator registry v1

Claim slots are deliberately left empty. Filling them is the next work item,
and §2 means the empty ones cannot ship. Nothing in this table is committed
until it has two citations.

### Jobs — does AI destroy work or create it?

| id | Indicator | Axis | Source | Cadence | Status |
|---|---|---|---|---|---|
| `jobs.junior` | Entry-level hiring in AI-exposed occupations | fab↔doom | Indeed Hiring Lab | monthly | **lead** |
| `jobs.unemp` | Unemployment, exposed vs unexposed occupations | fab↔doom | BLS | monthly | candidate |
| `jobs.layoffs` | Layoffs explicitly attributed to AI | fab↔doom | layoffs.fyi | rolling | at risk — see §9 |

The junior-versus-senior split is still the sharpest single signal on the board.
Lead with it.

### Growth — did the productivity boom arrive?

| id | Indicator | Axis | Source | Cadence | Status |
|---|---|---|---|---|---|
| `growth.prod` | US labour productivity, non-farm business | **fab↔fizzle** | FRED | quarterly | build first |
| `growth.gdp` | Real GDP vs pre-2023 trend | **fab↔fizzle** | FRED | quarterly | correlated — see §7 |

Both are fizzle-axis. Neither belongs on the balance. FRED is free, keyed,
well-documented and the easiest integration on the list — build it first as the
pipeline proof, then wire it to the correct readout.

### Energy — who pays for the compute?

| id | Indicator | Axis | Source | Cadence | Status |
|---|---|---|---|---|---|
| `energy.retail` | Retail electricity price, datacenter states vs national | fab↔doom | EIA | monthly | **claim check needed** |
| `energy.load` | Datacenter share of grid load | — | EIA | quarterly | **probably fails rule one** |

`energy.retail` is the most viscerally shareable chart on the page and also the
one most likely to be built on an invented claim. v0.1 asserts accelerationists
said prices would fall. Some did say abundance-eventually; a near-term retail
price claim is a different and much more specific thing. Find the quote or cut
the indicator.

`energy.load` is a buildout metric. Both camps predicted it climbs. Under rule
one it goes to §6 unless someone finds a real disagreement.

### Control — is safety keeping pace with capability?

| id | Indicator | Axis | Source | Cadence | Status |
|---|---|---|---|---|---|
| `control.incidents` | Logged AI incidents, 90-day rolling | fab↔doom | AI Incident Database | rolling | needs denominator |
| `control.horizon` | Autonomous task horizon | fab↔doom | METR | manual | hand-curated |

`control.incidents` has a confound that will be the first thing a critical
reader finds: the count rises when reporting effort rises. A growing database
is not a more dangerous world. Either normalise by something (deployment
volume, submissions per contributor) or state the confound in the indicator's
own caption. Do not ship the raw count with no denominator and no warning.

`control.horizon` is hand-curated; we update it when METR publishes. Saying so
in the UI costs us nothing.

### Delivery — is it producing the goods?

| id | Indicator | Axis | Source | Cadence | Status |
|---|---|---|---|---|---|
| `delivery.science` | AI-derived drug candidates entering trials | **fab↔fizzle** | ClinicalTrials.gov | quarterly | hard — see §9 |
| ~~`delivery.cost`~~ | Cost per million tokens at fixed capability | — | — | — | **cut, see §6** |

### Belief — displayed, never scored

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `belief.markets` | AGI-timeline and risk market odds | Manifold + Metaculus | live |
| `belief.public` | Public concern about AI | Pew / AIPI | occasional |

**Belief indicators carry weight zero and are excluded from the tilt.** What
people think is not evidence about who was right, and a board that scores
opinion is measuring its own audience. They earn the ticker strip — they are
the only genuinely live feed we have, and motion at the top of the page is
worth having — but they do not touch the balance. This separation is stated in
the methodology, because it's the kind of restraint that buys credibility for
the indicators that *do* score.

---

## 6. The rejected registry

A public list of indicators we considered and dropped, with the reason. Cheap
to maintain, and it is the strongest available answer to "you stacked the
board" — the defence is showing our work, not asserting our neutrality.

Opening entries:

- **Frontier benchmark scores** — both camps predicted they climb. Fails rule one.
- **Datacenter capex / buildout** — both camps predicted it. Fails rule one.
- **`delivery.cost`, cost per token at fixed capability** — both camps predicted
  it falls; no doomer ever bet on inference staying expensive. Fails rule one.
  v0.1 kept it explicitly as a counterweight, "without it the needle only ever
  travels one direction" — which is selecting an indicator to move the needle,
  the same sin §7 forbids for anchors. The fizzle track in §3 is the honest
  version of that counterweight.
- **`energy.load`, datacenter share of grid load** — pending a real opposing
  claim; otherwise a buildout metric.

---

## 7. Scoring

### Per indicator

Anchors are defined on the **change since t0**, not the level:

```
v_i      = value_i(t) − value_i(t0)          # or deviation from a stated
                                             # counterfactual trend
score_i  = clamp(−100 + 200 × (v_i − fab_i) / (doom_i − fab_i), −100, +100)
```

`fab_i` is the change at which the accelerationist claim is unambiguously
vindicated; `doom_i` the same for the other side. Either may be the larger
number — the formula handles both directions, so no indicator needs a sign flag.

### Anchor provenance

**Where a claim contains a number, that number *is* the anchor.**

This is the rule that makes "never tune an anchor" enforceable rather than
merely promised, because it removes the discretion instead of policing it.
`growth.prod` is anchored at 1.5pp because Goldman said 1.5pp and at 0.066pp
because Acemoglu said ~0.66% over ten years; neither number is ours to move.
Anchoring becomes quotation.

Where a claim carries no figure — Andreessen's "technology doesn't destroy jobs
and never will" gives none, confirmed at source — the anchor is set to the
weakest defensible form of the claim, carries `anchor_is_ours: true`, and says
so on the page. Charitable to the claimant, visible to the reader.

### Confidence and staleness

Most of this data is monthly or quarterly. A quarterly indicator five months
late is not evidence of anything:

```
conf_i = 1                     while age ≤ 1.5 × cadence
         linear 1 → 0          from 1.5 × to 3 × cadence
         0                     beyond
```

A stale indicator fades out of the tilt rather than holding it at a stale
reading. It stays visible, greyed, with its last value, its age, and a "not
counted" marker. Never a blank, never a silent zero, and never a confident
number computed from a dead feed.

### Two levels, not one

v0.1 sums over indicators, which means a camp wins by having more indicators —
Jobs with three would outweigh Control with two, and `growth.prod` and
`growth.gdp` would double-count the same underlying economy.

```
category_c = Σ(score_i × conf_i) / Σ(conf_i)        over indicators in c
tilt       = Σ(category_c × weight_c) / Σ(weight_c) over categories
```

Correlated indicators therefore have to live in the same category, where they
average instead of stacking. That's the de-duplication rule: **if two
indicators would move together for the same underlying reason, they share a
category.**

Weights are per category, user-adjustable, with presets — Doomer,
Accelerationist, Even. The tilt is an argument, and letting people re-run it
with their own weights is what makes this a toy worth sharing rather than a
claim to be fought over. Weight state lives in the URL hash so a re-run is
shareable.

### The rule that matters

**Anchors are written into config before an indicator ships and never tuned
afterwards.** The moment we move an anchor to put the needle somewhere we like,
the page is worthless. If an anchor turns out wrong, we version it publicly and
show the change.

Mechanism, because a promise isn't one:

- `anchors.json` lives in the repo, committed, one entry per indicator.
- Changes land by PR with a stated reason. No admin UI, ever — if an anchor can
  be changed from a dashboard it will be.
- The page links to that file's commit history from the methodology section.
- Every anchor entry carries a `version`; history rows record the anchor version
  they were scored under, so re-anchoring never silently rewrites the past.

That last point is what makes §8 possible.

---

## 8. Memory

The tilt has history, and it's the best feature on the board — a gauge is a
mood, a line going back to March 2023 is a scoreboard. It's also free once
anchors are frozen and versioned, and impossible if they aren't. The two
decisions are the same decision.

Requirements this puts on the data layer:

- `indicator_history` is **append-only**. Restatements from the source (BLS
  revises; everyone revises) are appended as new rows with a `revised_from`
  pointer, never overwritten in place.
- Every row stores the raw source value *and* the normalised score *and* the
  anchor version used. Scores are reproducible from the row alone.
- Provenance on every row: source URL, fetch timestamp, response hash.

The return-visit hook is not the gauge — on most days nothing has moved. It's
the **change log**: "this week, `jobs.junior` moved 4 toward doom; BLS revised
Q2 productivity up". Small, dated, permalinkable entries. That's the shareable
artifact and the reason to come back on a Tuesday.

---

## 9. Sources — integration reality

| Source | Access | Risk |
|---|---|---|
| FRED | free key, REST, excellent docs | none — build first |
| EIA | free key, REST | series discovery is fiddly |
| BLS | free key, REST, 500 queries/day | occupation-level series are awkward to assemble |
| Indeed Hiring Lab | published data files, permissive licence | check licence, attribute |
| AI Incident Database | API + full DB export | the denominator problem in §5 |
| Manifold / Metaculus | open JSON, no key | rate limits; client-side only |
| METR | published reports | manual, by design |
| Pew / AIPI | reports, no API | manual, occasional |
| **layoffs.fyi** | **no public API** | **scraping a private site's ToS; single point of failure; find a licensed alternative or cut** |
| **ClinicalTrials.gov** | good API | **"AI-derived" is a classification problem, not a query — no field encodes it. Needs a curated candidate list from company disclosures. Highest effort on the board by a distance; treat as v2.** |

**When a source dies for good:** the indicator is retired, not replaced.
It freezes at its last value, is marked retired with a date and a reason, drops
to `conf = 0`, and stays in the history. A substitute source becomes a **new
indicator id with its own anchors and its own t0** — because silently swapping
the input under a continuous line is the most defensible-looking way to lie on
this entire page.

---

## 10. Architecture

```
Netlify scheduled function (daily 06:00 UTC)
  └─ per source: fetch() → normalise() → lastGood()
       ├─ indicators          current value, score, conf, updated_at
       ├─ indicator_history   append-only, with provenance + anchor version
       └─ changelog           diffs worth showing a returning reader

Front end
  ├─ one read of a cached JSON blob → renders everything
  ├─ weights from URL hash → tilt computed client-side
  └─ ticker strip polls Manifold/Metaculus client-side (live only)

Keyed APIs behind Netlify proxy redirects, same as /api/hf/*
  └─ /api/fred/*, /api/eia/*, /api/bls/*
```

Each source is a module with the same interface. A dead source falls back to
last-good with a visible staleness marker and a decaying confidence — the
fallback is *visible in the arithmetic*, not just in a tooltip.

---

## 11. Page structure

```
┌────────────────────────────────┐
│  live ticker (market odds)     │  ← moves by the minute · scores nothing
├────────────────────────────────┤
│                                │
│      p(doom) vs p(fab)         │
│      ·········◆·······         │  ← hero: one object with mass. no % sign.
│      who's winning so far      │
│                                │
│      since 22 March 2023       │
├────────────────────────────────┤
│  weight presets  [D] [E] [A]   │
├────────────────────────────────┤
│  fizzle readout                │  ← "and neither of you predicted this"
├────────────────────────────────┤
│  indicator                     │
│  value · sparkline · as of ▢   │
│  "…" — who, date  ↔  "…" — who │  ← real quotes, linked
│  point: ___                    │
├────────────────────────────────┤
│  ... × n                       │
├────────────────────────────────┤
│  change log — last 5 moves     │  ← the return hook
├────────────────────────────────┤
│  methodology · anchors (git)   │
│  rejected indicators · sources │
└────────────────────────────────┘
```

The balance is the one memorable object. Everything below it stays quiet.

---

## 12. Visual direction — Option C, committed

**Instrument surfaces, tote-board language.** Chosen deliberately over A or B.
The risk v0.1 named is real, but it applies to an *undecided* blend; a specified
third system with a clear ownership rule is not "half of each". The rule:

> **The tote board owns the words and the state changes. The instrument owns
> the surfaces and the type.** Wager vocabulary, posted-and-revised numbers,
> strikethrough where a reading was superseded — on quiet enamel, in precision
> type, with no chalk texture and no faux handwriting anywhere.

That division is load-bearing, not stylistic: the revision strikethrough is the
only visual device in either option that natively expresses §8's append-only
history. B had the right vocabulary for our data model and the wrong surfaces
for our credibility.

**Palette.** Instrument enamel `#DDE2DC` (a cool grey-green — deliberately not
the warm cream that every generated page defaults to), graphite `#1C1E1D` for
the dark theme, oxidised brass `#9A7B3F`. The two poles are **brass for fab
and steel-blue for doom** — never red/green, which codes a moral answer we have
not earned and fails colourblind readers.

**Type.** IBM Plex, one superfamily covering both registers: Plex Sans
Condensed caps for headings (tote board), Plex Mono with real tabular figures
for every reading (instrument), Plex Sans for the quotes.

**Motion.** One orchestrated moment: the pointer settling on load, geared
steeper than the beam the way a real balance amplifies a small deflection.
Weight presets re-settle rather than jump. Nothing else moves except the ticker.

Prototype: `web/balance.html`.


---

## 13. Honest constraints

- Almost nothing here is live. BLS and EIA are monthly, productivity quarterly.
  Fake ticking decimals would lose the technical audience instantly. Slowness is
  presented as a credibility feature, with a visible timestamp.
- Two indicators are hand-curated. Say so in the UI.
- Indicator selection is itself a judgement call. The methodology section and
  the rejected registry are not afterthoughts — they're the defence against the
  first person who accuses us of stacking the board.
- The citation contract will disqualify indicators we like. That is the
  contract working, not the contract failing.

---

## 14. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Name | **settled — p(doom) vs p(fab)**, with the §1 guardrails |
| 2 | Visual direction | **settled — Option C**, §12, with the ownership rule |
| 3 | How many indicators at launch | **as many as pass §2, probably 5–7.** Rule beats count; the empty board is a better launch than the invented one |
| 4 | Does the tilt have memory | **yes** — §8. Requires 7 |
| 5 | Shareable weight permalinks | **yes** — URL hash, it's the share loop |
| 6 | Standalone, or Singularity City reads the same cache | **open — needs you.** Standalone domain, shared Supabase, seems right: the name only pays off if it carries its own address |
| 7 | Publish anchors openly | **yes** — `anchors.json` in the repo, PR-only, linked from the page. It's the whole credibility play |
| 8 | What happens when a source dies | **settled** — §9, retire don't replace |
| 9 | t0 = 22 March 2023? | proposed, §4 — worth ten minutes of argument before it's frozen |
| 10 | Is `energy.retail` real? | **yes** — Chris Wright, US Energy Secretary, Jan 2026: "Demand growth is actually the way to drive down the price." Still needs a named claimant on the doom side |

---

## 15. State of the board

Run `npm run gate` for the current count. As of 2026-09-16:

```
3 indicators may render.

Benched — missing receipts:
  energy.retail      doom: quote is a placeholder
  control.incidents  fab, doom: no receipts at all
  control.horizon    fab, doom: no receipts at all
  delivery.science   fab: quote is not falsifiable against this measure
```

Verified at the primary source: Andreessen only. Axios returns 403 to
automated fetch, so Amodei's quotes need a human to open the page — and
specifically to check whether "half of all entry-level white-collar jobs" is
him speaking or the reporter's framing. It appears in headlines, which is
exactly how a paraphrase gets laundered into a quotation.

The gate exits non-zero while any quote is unverified, so none of this can ship
by accident.
