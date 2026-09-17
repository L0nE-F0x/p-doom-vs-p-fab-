# The Wager — project scaffold v0.1

A single page that keeps score in the argument between AI doomers and AI
accelerationists, using live public data. Not a prediction. A scoreboard for a
bet that's already been placed.

Status: pre-spec. This is the thing we refine together, not the spec itself.

---

## 1. The one rule

**An indicator only earns a place on the page if the two camps would have bet
opposite ways on it.**

This is the whole spine of the project. Frontier benchmark scores don't qualify —
both camps predicted those would climb. Datacenter buildout doesn't qualify —
both predicted that too. What qualifies is where they made genuinely opposing
claims about the world: jobs, growth, energy prices, incident rates, public
opinion.

Everything else is a chart about AI. This is a scoreboard about a disagreement.

Corollary: every indicator on the page ships with its receipts — a one-line
statement of what each camp claimed, so the reader can check the scoring rather
than take our word for it.

---

## 2. Naming

Not "P(doom) clock". P(doom) is a term of art meaning probability of existential
catastrophe, and most of our indicators are about electricity bills and graduate
hiring. Mislabelling it hands a free dunk to exactly the audience most likely to
share it.

Candidates, all pointing at the bet rather than the outcome:

- **The Wager** — neutral, memorable, works as a domain
- **Receipts** — leans on the strongest feature, slightly meme-y
- **Called It** — playful, maybe too glib
- **Open Bet** — clean, a bit generic

Working title in this doc: The Wager. Nothing is committed.

---

## 3. Indicator registry v0

Twelve is probably the ceiling for one screen's worth of credibility. Start with
eight and add.

### Jobs — does AI destroy work or create it?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `jobs.junior` | Entry-level hiring in AI-exposed occupations | BLS / Indeed Hiring Lab | monthly |
| `jobs.unemp` | Unemployment rate, exposed vs unexposed occupations | BLS | monthly |
| `jobs.layoffs` | Layoffs explicitly attributed to AI | layoffs.fyi | rolling |

Accelerationists said: displacement is offset by new roles, net employment holds.
Decelerationists said: the bottom rung goes first and doesn't come back.

The junior-versus-senior split is the sharpest single signal we have. Lead with it.

### Growth — did the productivity boom arrive?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `growth.prod` | US labour productivity, non-farm business | FRED API | quarterly |
| `growth.gdp` | Real GDP growth vs pre-2023 trend | FRED API | quarterly |

Accelerationists said: a measurable acceleration in output per hour.
Decelerationists (and skeptics) said: it won't show up in the aggregates.

FRED is free, keyed, well-documented, and by far the easiest integration on the
list. Good first one to build.

### Energy — who pays for the compute?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `energy.retail` | Retail electricity price, datacenter states vs national | EIA API | monthly |
| `energy.load` | Datacenter share of grid load | EIA | quarterly |

Accelerationists said: the buildout pulls generation forward and prices fall.
Decelerationists said: consumers eat the cost of the race.

The datacenter-states-versus-national-average line is the most viscerally
shareable chart on the whole page.

### Control — is safety keeping pace with capability?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `control.incidents` | Logged AI incidents, 90-day rolling | AI Incident Database API | rolling |
| `control.horizon` | Autonomous task horizon | METR published data | manual |

Accelerationists said: capability and control scale together.
Decelerationists said: the gap widens as capability climbs.

`control.horizon` is hand-curated. We update it when METR publishes. Being honest
about that in the UI costs us nothing.

### Belief — what do informed people actually think?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `belief.markets` | AGI-timeline and risk market odds | Manifold + Metaculus JSON | live |
| `belief.public` | Public concern about AI | Pew / AIPI polling | occasional |

Both open JSON, no key required. This is our only genuinely live-ticking feed and
it earns the ticker strip on its own.

### Delivery — is it producing the goods?

| id | Indicator | Source | Cadence |
|---|---|---|---|
| `delivery.cost` | Cost per million tokens at fixed capability | curated price index | monthly |
| `delivery.science` | AI-derived drug candidates entering trials | ClinicalTrials.gov | quarterly |

Accelerationists said: abundance, and compounding scientific returns.
Decelerationists said: the benefits stay narrow while the risks generalise.

This is the strongest counterweight on the board. Without it the needle only ever
travels one direction and the page dies of predictability.

---

## 4. Scoring

Each indicator resolves to a single score from −100 (accelerationists winning) to
+100 (decelerationists winning).

```
score_i     = clamp(normalise(value_i, floor_i, ceiling_i), -100, 100)
tilt        = Σ (score_i × weight_i) / Σ weight_i
```

Non-negotiable: **`floor_i` and `ceiling_i` are written into config before the
indicator ships, and never tuned afterwards.** The moment we adjust an anchor to
make the needle sit somewhere we like, the page is worthless. If an anchor turns
out wrong, we version it publicly and show the change.

Weights are user-adjustable with presets — Doomer, Accelerationist, Even. The
tilt is an argument, and letting people re-run it with their own weights is what
makes it a toy worth sharing rather than a claim to be fought over.

---

## 5. Architecture

Fits the existing stack, reuses patterns already proven on Singularity City.

```
Netlify scheduled function (daily 06:00 UTC)
  └─ pull each source → normalise → write Supabase
       ├─ indicators        (current value, score, updated_at)
       └─ indicator_history (time series, for sparklines)

Front end
  ├─ one read of a cached JSON blob → renders everything
  └─ ticker strip polls Manifold/Metaculus client-side (live only)

Keyed APIs behind Netlify proxy redirects, same as /api/hf/*
  └─ /api/fred/*, /api/eia/*
```

Each source gets its own module with a common interface: `fetch()`, `normalise()`,
`lastGood()`. A dead source falls back to its last good value with a visible
staleness marker — never a blank, never a silent zero.

---

## 6. Page structure

```
┌────────────────────────────────┐
│  live ticker (market odds)     │  ← the only thing that moves by the minute
├────────────────────────────────┤
│                                │
│         THE BALANCE            │  ← hero: tilt, physical, one memorable object
│         41  ·······  59        │
│                                │
├────────────────────────────────┤
│  weight presets  [D] [E] [A]   │
├────────────────────────────────┤
│  indicator                     │
│  value · sparkline             │  ← each with both camps' receipts
│  "they said" / "they said"     │
│  point: ___                    │
├────────────────────────────────┤
│  ... × 12                      │
├────────────────────────────────┤
│  methodology, anchors, sources │
└────────────────────────────────┘
```

The balance is the one memorable object. Everything below it stays quiet.

---

## 7. Visual direction — two options to choose between

Both avoid the current generated-page house style (cream + serif + terracotta,
near-black + acid accent, all-caps eyebrows, mono micro-labels).

**Option A — Instrument.** The page is a precision measuring device. Machined
metal and enamel, weights and counterweights, engraved scale markings. Palette
built from oxidised brass and instrument enamel. Numerals in a face with real
tabular figures and some engineering character. The balance is drawn as an object
with mass — it settles, it doesn't animate.

**Option B — Tote board.** The page is a betting board. Chalk and slate, odds
posted and revised, the physical vernacular of a racetrack or a trading pit.
Condensed type, hand-corrected numbers, visible strikethroughs where a previous
reading was superseded. Leans harder into the wager framing.

A suits the "we are being rigorous" read. B suits the "this is a fight and we're
keeping score" read. B is riskier and more shareable. Pick one and commit — the
worst outcome is half of each.

Motion: one orchestrated moment only. The balance settling on load. Nothing else
moves except the ticker.

---

## 8. Honest constraints

- Almost nothing here is live. BLS and EIA are monthly, productivity is quarterly.
  Fake ticking decimals would lose the technical audience instantly. Slowness is
  presented as a credibility feature, with a visible timestamp.
- Two indicators are hand-curated. Say so in the UI.
- Indicator selection is itself a judgement call. The methodology section is not
  an afterthought — it's the defence against the first person who accuses us of
  stacking the board.

---

## 9. Open questions for the laptop session

1. Name. Commit to one.
2. Visual direction A or B.
3. Eight indicators at launch or twelve?
4. Does the tilt have memory — do we show where the balance sat a year ago?
5. Do users get shareable permalinks to their own weight configuration?
6. Standalone, or does Singularity City read the same Supabase cache?
7. Do we publish the anchor config openly in the repo as a credibility play?
8. What happens on the day a source dies for good?
