/**
 * Scoring for p(doom) vs p(fab).
 *
 * Three rules this file exists to enforce, from scaffold §7:
 *   1. indicators score their change since t0, not their level (unless the
 *      claim itself was about a level);
 *   2. staleness decays an indicator out of the tilt rather than freezing it
 *      at a dead reading;
 *   3. the tilt averages categories, not indicators, so a camp cannot win by
 *      having more indicators and correlated series cannot stack.
 */

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * −100 is the fab pole, +100 the doom (or fizzle) pole.
 * Either anchor may be the larger number; the formula handles both directions,
 * so no indicator needs a sign flag.
 */
export function scoreIndicator(value, anchor) {
  const far = anchor.doom ?? anchor.fizzle;
  if (far === undefined) throw new Error('anchor needs a doom or fizzle pole');
  if (far === anchor.fab) throw new Error('anchor poles are identical');
  return clamp(-100 + 200 * ((value - anchor.fab) / (far - anchor.fab)), -100, 100);
}

/** Cadence in days. Confidence holds to 1.5×, decays linearly to 0 at 3×. */
export function confidence(ageDays, cadenceDays) {
  if (!(cadenceDays > 0)) throw new Error('cadence must be positive');
  const hold = 1.5 * cadenceDays;
  const dead = 3 * cadenceDays;
  if (ageDays <= hold) return 1;
  if (ageDays >= dead) return 0;
  return (dead - ageDays) / (dead - hold);
}

/** Confidence-weighted mean. Returns null when every member is dead. */
function weightedMean(items, valueOf, weightOf) {
  let num = 0, den = 0;
  for (const it of items) {
    const w = weightOf(it);
    if (w > 0) { num += valueOf(it) * w; den += w; }
  }
  return den === 0 ? null : num / den;
}

/**
 * @param scored  [{ id, category, axis, score, conf }]
 * @param weights { [category]: number }  — user preset
 * @returns { tilt, fizzle, categories, counted, excluded }
 *
 * Belief indicators carry weight zero and never reach here (scaffold §5).
 * fab-fizzle indicators are reported separately and never touch the tilt —
 * a fizzle refutes p(fab), it does not confirm p(doom) (scaffold §3).
 */
export function computeTilt(scored, weights = {}) {
  const live = scored.filter(s => s.conf > 0);
  const excluded = scored.filter(s => s.conf <= 0).map(s => s.id);

  const byAxis = axis => {
    const rows = live.filter(s => s.axis === axis);
    const cats = new Map();
    for (const r of rows) {
      if (!cats.has(r.category)) cats.set(r.category, []);
      cats.get(r.category).push(r);
    }
    const catScores = [...cats].map(([category, members]) => ({
      category,
      score: weightedMean(members, m => m.score, m => m.conf),
      conf: weightedMean(members, m => m.conf, () => 1),
      members: members.map(m => m.id),
    })).filter(c => c.score !== null);
    const value = weightedMean(catScores, c => c.score, c => (weights[c.category] ?? 1) * c.conf);
    return { value, categories: catScores };
  };

  const doomAxis = byAxis('fab-doom');
  const fizzleAxis = byAxis('fab-fizzle');

  return {
    tilt: doomAxis.value,
    fizzle: fizzleAxis.value,
    categories: doomAxis.categories,
    fizzleCategories: fizzleAxis.categories,
    counted: live.length,
    excluded,
  };
}

/** The hero reads as a position on a scale. Never a percentage (scaffold §1). */
export function renderTilt(tilt) {
  if (tilt === null || tilt === undefined) return { doom: null, fab: null, label: 'no live indicators' };
  const doom = Math.round((tilt + 100) / 2);
  return { doom, fab: 100 - doom, label: "who's winning so far" };
}
