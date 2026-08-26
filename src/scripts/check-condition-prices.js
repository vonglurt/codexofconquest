#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02z — walks `CONDITION_ITEMS` and `CONDITION_GOLD` against each other, in BOTH
// directions. An item with no price row is the live hazard: every cost lookup read
// `CONDITION_GOLD[…] || 20`, and 20 gp is the pre-Layer-18 scale the ×100 repricing
// was written to delete — so a 13th condition would have shipped at a price that makes
// a three-round ADV-plus-status effect cost less than a healing potion. A missing key
// and a 20 gp key are indistinguishable at the call site, which is why this is a gate
// and not a comment. An orphaned price is the quieter direction and fails too: it means
// an item was renamed or removed and its price was left behind to mislead the next
// reader about what the balance table covers.
//
// Two facts make the pairing worth enforcing mechanically. The tables are ~2,200 lines
// apart and neither names the other; and conditions are NOT inventory-gated — the panel
// offers all of them for gold — so the price table carries the entire balance load for
// the strongest pre-battle effect in the game, alone.
//
// Read-only: never writes the game file.
// Run: node scripts/check-condition-prices.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');
const GAME = path.join(__dirname, '..', '..', 'play.html');

// Both tables are hand-authored literals outside the WORLDBUILDER markers, so they are
// read off the raw source rather than through wbapi-core (the §AUDIT-03b lesson about
// EB_NPC_DIALOGUE, applied again).
function extractBlock(src, name) {
  const open = src.indexOf('const ' + name);
  if (open === -1) return null;
  const start = src.indexOf(name === 'CONDITION_ITEMS' ? '[' : '{', open);
  const close = name === 'CONDITION_ITEMS' ? '];' : '};';
  const end = src.indexOf('\n' + close, start);
  return end === -1 ? null : src.slice(start, end);
}

function scan(src) {
  const findings = [];
  const itemsBlock = extractBlock(src, 'CONDITION_ITEMS');
  const goldBlock = extractBlock(src, 'CONDITION_GOLD');
  if (!itemsBlock) findings.push('CONDITION_ITEMS not found — the gate cannot verify what it cannot read');
  if (!goldBlock) findings.push('CONDITION_GOLD not found — the gate cannot verify what it cannot read');
  if (findings.length) return findings;

  const items = [...itemsBlock.matchAll(/match\s*:\s*'([^']+)'/g)].map(m => m[1]);
  const prices = new Map(
    [...goldBlock.matchAll(/'([^']+)'\s*:\s*(-?\d+)/g)].map(m => [m[1], Number(m[2])]));

  for (const it of items) {
    if (!prices.has(it)) findings.push(`CONDITION_ITEMS '${it}' has no CONDITION_GOLD price`);
  }
  for (const [name] of prices) {
    if (!items.includes(name)) findings.push(`CONDITION_GOLD '${name}' prices no CONDITION_ITEMS entry`);
  }
  // The fallback this row deleted. Its return is the same defect wearing the same clothes.
  for (const m of src.matchAll(/CONDITION_GOLD\s*\[[^\]]+\]\s*(\|\||\?\?)/g)) {
    findings.push(`a CONDITION_GOLD lookup carries a \`${m[1]}\` fallback — a miss must be loud, not priced`);
  }
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + label); } };
  const build = (items, prices, extra = '') => [
    'const CONDITION_ITEMS = [',
    ...items.map(n => `  { match:'${n}', condition:'X', effect:'y', icon:'z' },`),
    '];',
    'const CONDITION_GOLD = {',
    '  ' + prices.map(([n, gp]) => `'${n}':${gp}`).join(', '),
    '};',
    extra,
  ].join('\n');

  ok(scan(build([['A'], ['B']].map(x => x[0]), [['A', 1500], ['B', 2000]])).length === 0,
    'a clean bijection passes');
  ok(scan(build(['A', 'B'], [['A', 1500]])).some(f => f.includes("'B' has no CONDITION_GOLD price")),
    'an unpriced item fails');
  ok(scan(build(['A'], [['A', 1500], ['B', 2000]])).some(f => f.includes("'B' prices no CONDITION_ITEMS entry")),
    'an orphaned price fails — the quieter direction is not skipped');
  ok(scan(build(['A'], [['A', 1500]], 'const c = CONDITION_GOLD[x] || 20;')).some(f => f.includes('fallback')),
    'a reinstated `||` fallback fails');
  ok(scan(build(['A'], [['A', 1500]], 'const c = CONDITION_GOLD[x] ?? 20;')).some(f => f.includes('fallback')),
    '`??` is caught too — the nullish form misprices identically');
  ok(scan(build(['A'], [['A', 1500]], 'const c = CONDITION_GOLD[x];')).length === 0,
    'an unguarded lookup is the shipped shape and passes');
  ok(scan("const CONDITION_ITEMS = [\n  { match:'A' },\n];").some(f => f.includes('CONDITION_GOLD not found')),
    'a missing table is a failure, not a vacuous pass');
  ok(scan(build(["Feint Scroll"], [["Feint Scroll", 1000]])).length === 0,
    'a name with a space round-trips');

  if (fail) { console.log(`\n✗ check-condition-prices selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-condition-prices selftest: all ${pass} checks pass`);
  return;
}

const findings = scan(fs.readFileSync(GAME, 'utf8'));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-condition-prices: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log('✓ §DX-02z condition prices: CONDITION_ITEMS ↔ CONDITION_GOLD is a bijection, and no lookup carries a fallback');
