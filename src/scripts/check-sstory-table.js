#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02mj — every field `docs/design/index.md`'s *State Fields Quick Reference (S_story)*
// table names must occur in `play.html`, as a whole word. A field the engine retires then
// turns this red in the same increment, instead of waiting months for a lab report to
// notice (`voidSignClicked` sat three months; `lastCorridorCells` longer).
// A row's first cell may name several fields (`S_story.hp / hpMax`); each is checked.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-sstory-table.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function tableFields(md) {
  const at = md.search(/^## State Fields Quick Reference \(S_story\)/m);
  if (at < 0) return null;
  const sec = md.slice(at).split(/\n## /)[0];
  const out = [];
  for (const m of sec.matchAll(/^\| `S_story\.([^`]+)`/gm))
    for (const name of m[1].split(/[\s/,]+/)) if (/^[A-Za-z_$][\w$]*$/.test(name)) out.push(name);
  return out;
}

function scan(md, game) {
  const fields = tableFields(md);
  if (!fields) return { fields: [], findings: ['index.md has no "## State Fields Quick Reference (S_story)" section'] };
  if (!fields.length) return { fields, findings: ['the S_story table names no fields'] };
  const findings = fields.filter((f) => !new RegExp(`\\b${f.replace(/\$/g, '\\$')}\\b`).test(game))
    .map((f) => `\`S_story.${f}\` is in the table and nowhere in play.html`);
  return { fields, findings };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const doc = (rows) => ['# x', '## State Fields Quick Reference (S_story)', '', '| Field | Type | Purpose |', '|---|---|---|',
    ...rows, '', '## Next', '| `S_story.outside` | n | after the section |'].join('\n');
  const game = 'S_story.gold = 0; S_story.hp = 1; S_story.hpMax = 2; S_story.goldenKey = 1;';
  ok(scan(doc(['| `S_story.gold` | n | g |']), game).findings.length === 0, 'a field the game uses is clean');
  ok(scan(doc(['| `S_story.lastCorridorCells` | a | x |']), game).findings.some((f) => f.includes('lastCorridorCells')),
    'a field the game does not use is named');
  ok(scan(doc(['| `S_story.hp / hpMax` | n | x |']), game).fields.join() === 'hp,hpMax', 'a cell naming two fields checks both');
  ok(scan(doc(['| `S_story.hp / hpMin` | n | x |']), game).findings.some((f) => f.includes('hpMin')), 'the second field of a pair is checked too');
  ok(scan(doc(['| `S_story.golden` | n | x |']), game).findings.length === 1, 'a prefix of a real field is not a match');
  ok(scan(doc(['| `S_story.gold` | n | g |']), game).fields.length === 1, 'a row after the section is not read');
  ok(scan('# no table', game).findings.some((f) => f.includes('no "## State Fields')), 'a missing section is a finding');
  ok(scan(doc([]), game).findings.some((f) => f.includes('names no fields')), 'an empty table is a finding');
  ok(tableFields(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8')).length > 100, 'the real table is found and read');
  if (fail) { console.log(`\n✗ check-sstory-table selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-sstory-table selftest: all ${pass} checks pass`);
  process.exit(0);
}

const { fields, findings } = scan(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8'),
  fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8'));
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-sstory-table: ${findings.length} of ${fields.length} field(s) are not in play.html`);
  console.log('  Remove the row in the increment that retired the field, or correct its name.');
  process.exit(1);
}
console.log(`✓ §DX-02mj S_story table: all ${fields.length} named fields occur in play.html`);
