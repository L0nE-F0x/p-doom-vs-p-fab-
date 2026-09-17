/**
 * Diff two refresh rows into a changelog entry, or null if nothing is worth
 * showing a returning reader (scaffold §8).
 *
 * prev / next shape: { id, status, value, score, as_of, why }
 * Scores: −100 fab … +100 doom/fizzle.
 */
export function changelogFrom(prev, next) {
  if (!next?.id) return null;
  if (!prev) {
    if (next.status !== 'ok') return null;
    return {
      kind: 'added',
      indicator_id: next.id,
      delta: null,
      summary: `${next.id} added`,
    };
  }

  if (next.status === 'stale' && prev.status !== 'stale') {
    return {
      kind: 'stale',
      indicator_id: next.id,
      delta: null,
      summary: `${next.id} went stale${next.why ? ': ' + next.why : ''}. Last reading held, decaying.`,
    };
  }

  if (next.status !== 'ok') return null;

  const scoreDelta = (next.score ?? 0) - (prev.score ?? 0);
  const toward = scoreDelta > 0 ? 'doom' : 'fab';
  const moved = Math.abs(Math.round(scoreDelta));

  if (prev.as_of === next.as_of && prev.value !== next.value) {
    return {
      kind: 'revision',
      indicator_id: next.id,
      delta: scoreDelta,
      summary: `${next.id} revised ${prev.value} → ${next.value}. Score moved ${moved} toward ${toward}.`,
    };
  }

  if (Math.abs(scoreDelta) < 1) return null;

  return {
    kind: 'move',
    indicator_id: next.id,
    delta: scoreDelta,
    summary: `${next.id} moved ${moved} toward ${toward}.`,
  };
}
