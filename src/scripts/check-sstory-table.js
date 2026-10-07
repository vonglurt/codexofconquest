#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02mj + §DX-02mq — `docs/design/index.md`'s *State Fields Quick Reference (S_story)* table
// against `_S_DEFAULTS()` in `play.html`, both ways:
//   · every field a row names must be a key `_S_DEFAULTS()` declares;
//   · every key of its core block — the keys above the literal's first comment-only line,
//     where the per-arc groups begin — must have a row.
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

// Top-level keys of the `_S_DEFAULTS = () => ({ … })` literal, in order, each marked core or not.
function defaultKeys(game) {
  const lines = game.split('\n');
  const start = lines.findIndex((l) => /^const _S_DEFAULTS = \(\) => \(\{/.test(l));
  if (start < 0) return null;
  const keys = [];
  let depth = 0, core = true;
  for (let i = start + 1; i < lines.length; i++) {
    if (depth === 0 && /^\}\);/.test(lines[i])) return keys;
    if (depth === 0 && /^\s*\/\//.test(lines[i])) { core = false; continue; }
    const l = lines[i].replace(/\/\/.*$/, '').replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''");
    for (let j = 0; j < l.length; j++) {
      if (depth === 0) {
        const m = /^([A-Za-z_$][\w$]*)\s*:/.exec(l.slice(j));
        if (m && (j === 0 || /[\s,{]/.test(l[j - 1]))) { keys.push({ key: m[1], core }); j += m[0].length - 1; continue; }
      }
      if ('{[('.includes(l[j])) depth++;
      else if ('}])'.includes(l[j])) depth--;
    }
  }
  return null;
}

function scan(md, game) {
  const fields = tableFields(md);
  if (!fields) return { fields: [], findings: ['index.md has no "## State Fields Quick Reference (S_story)" section'] };
  if (!fields.length) return { fields, findings: ['the S_story table names no fields'] };
  const keys = defaultKeys(game);
  if (!keys || !keys.length) return { fields, findings: ['play.html has no readable `const _S_DEFAULTS = () => ({ … });` literal'] };
  const declared = new Set(keys.map((k) => k.key));
  const named = new Set(fields);
  const findings = [
    ...fields.filter((f) => !declared.has(f)).map((f) => `\`S_story.${f}\` has a row and _S_DEFAULTS() does not declare it`),
    ...keys.filter((k) => k.core && !named.has(k.key)).map((k) => `\`S_story.${k.key}\` is in _S_DEFAULTS()'s core block and has no row`)];
  return { fields, keys, findings };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const doc = (rows) => ['# x', '## State Fields Quick Reference (S_story)', '', '| Field | Type | Purpose |', '|---|---|---|',
    ...rows, '', '## Next', '| `S_story.outside` | n | after the section |'].join('\n');
  const game = ['let x;', 'const _S_DEFAULTS = () => ({', "  gold: 0, hp: 1, hpMax: 2, // gold: 'not a key'",
    "  bag: { inner: 1 }, tag: 'a: b',", '  // §ARC-01: an arc', '  arcFlag: false,', '});', 'S_story.party = {};'].join('\n');
  const core = ['| `S_story.gold` | n | g |', '| `S_story.hp / hpMax` | n | x |', '| `S_story.bag` | o | x |', '| `S_story.tag` | s | x |'];
  ok(scan(doc(core), game).findings.length === 0, 'a table covering the core block is clean');
  ok(defaultKeys(game).map((k) => k.key + (k.core ? '' : '*')).join() === 'gold,hp,hpMax,bag,tag,arcFlag*',
    'keys are top-level only, strings and comments are skipped, and a comment line ends the core block');
  ok(scan(doc([...core, '| `S_story.lastCorridorCells` | a | x |']), game).findings.some((f) => f.includes('lastCorridorCells')),
    'a row for a field the defaults do not declare is named');
  ok(scan(doc([...core, '| `S_story.party` | o | x |']), game).findings.some((f) => f.includes('party')),
    'a field used outside the defaults, or only as a word, is not declared');
  ok(scan(doc([...core, '| `S_story.arcFlag` | b | x |']), game).findings.length === 0, 'an arc flag may have a row');
  ok(scan(doc(core.slice(1)), game).findings.some((f) => f.includes('`S_story.gold` is in')), 'a core field with no row is named');
  ok(scan(doc(['| `S_story.hp / hpMin` |  n | x |', ...core]), game).findings.some((f) => f.includes('hpMin')), 'the second field of a pair is checked too');
  ok(scan(doc(['| `S_story.inner` | n | x |', ...core]), game).findings.some((f) => f.includes('inner')), 'a nested key is not a declaration');
  ok(scan(doc(['| `S_story.golden` | n | x |', ...core]), game).findings.length === 1, 'a prefix of a declared field is not a declaration');
  ok(scan(doc(core), game).fields.length === 5, 'a row after the section is not read');
  ok(scan(doc(core), 'no literal').findings.some((f) => f.includes('no readable')), 'a missing literal is a finding');
  ok(scan('# no table', game).findings.some((f) => f.includes('no "## State Fields')), 'a missing section is a finding');
  ok(scan(doc([]), game).findings.some((f) => f.includes('names no fields')), 'an empty table is a finding');
  ok(tableFields(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8')).length > 100, 'the real table is found and read');
  if (fail) { console.log(`\n✗ check-sstory-table selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-sstory-table selftest: all ${pass} checks pass`);
  process.exit(0);
}

const { fields, keys, findings } = scan(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8'),
  fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8'));
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-sstory-table: ${findings.length} finding(s)`);
  console.log('  A row names a declared field; every core-block field has a row. Add or remove the row in the increment that changed the field.');
  process.exit(1);
}
const core = keys.filter((k) => k.core).length;
console.log(`✓ §DX-02mq S_story table: all ${fields.length} named fields are declared in _S_DEFAULTS(), and all ${core} core-block fields of its ${keys.length} have a row`);
