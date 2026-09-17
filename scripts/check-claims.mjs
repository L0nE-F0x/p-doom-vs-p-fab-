#!/usr/bin/env node
/**
 * Rule two, enforced (scaffold §2).
 *
 * An indicator with an empty claim slot does not render — and the way we make
 * that true rather than aspirational is that this exits non-zero and the build
 * stops. The failure mode it exists to prevent is us shipping a plausible
 * "accelerationists said ..." that nobody ever actually said.
 */
import { readFileSync } from 'node:fs';

const claims = JSON.parse(readFileSync(new URL('../data/claims.json', import.meta.url)));
const REQUIRED = ['who', 'when', 'source_url', 'quote'];

let shippable = 0;
const benched = [];

for (const [id, entry] of Object.entries(claims)) {
  if (id.startsWith('$')) continue;
  const poles = entry.axis === 'fab-fizzle' ? ['fab', 'fizzle'] : ['fab', 'doom'];
  const problems = [];

  for (const pole of poles) {
    const slot = entry[pole];
    if (!slot) { problems.push(`${pole}: missing entirely`); continue; }
    const empty = REQUIRED.filter(f => !slot[f] || String(slot[f]).trim() === '');
    if (empty.length) problems.push(`${pole}: no ${empty.join(', ')}`);
    else if (/^(PENDING|TODO)/.test(slot.quote)) problems.push(`${pole}: quote is a placeholder`);
    else if (slot.note?.startsWith('WEAK')) problems.push(`${pole}: quote is not falsifiable against this measure`);
  }

  if (problems.length) benched.push({ id, problems });
  else shippable++;
}

const unverified = Object.entries(claims)
  .filter(([id]) => !id.startsWith('$'))
  .flatMap(([id, e]) => ['fab', 'doom', 'fizzle'].filter(p => e[p]?.quote && e[p].verified === false).map(p => `${id}.${p}`));

console.log(`\n  ${shippable} indicator${shippable === 1 ? '' : 's'} may render.\n`);
if (benched.length) {
  console.log('  Benched — missing receipts:');
  for (const b of benched) console.log(`    ${b.id.padEnd(20)} ${b.problems.join(' · ')}`);
  console.log();
}
if (unverified.length) {
  console.log(`  ${unverified.length} quote${unverified.length === 1 ? '' : 's'} not yet checked against the primary source:`);
  console.log(`    ${unverified.join(', ')}\n`);
}

// An empty board is a better launch than an invented one, so zero is not an
// error — but a quote nobody has opened the primary source for is.
if (unverified.length) {
  console.error('  BLOCKED: every quote must be read at its source_url and marked verified:true.\n');
  process.exit(1);
}
