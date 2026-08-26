#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DOCPTR-01 — the mirror of gate #15. `check:anchors` proves doc→code: every `symbol@N`
// written in a doc still names something in the source. Nothing proved code→doc: that a
// `// → doc: <file> §<Section>` comment beside a table names a file that exists and a
// section that is in it. The two directions rot independently, and this one rotted
// unobserved — fourteen of ninety-two pointers named a file or a section that was not there.
//
// The resolution rule is the load-bearing part. Most pointers are written as a BARE
// BASENAME (`world.md`, `story.md`) living under docs/design/, some are repo-relative
// (`docs/mechanics/...`) and some are written relative to docs/. Resolving literal paths only reports 50 dead
// files on a healthy corpus; resolving a basename against the doc tree reports 0. A gate
// that gets this wrong is worse than no gate. An ambiguous basename — two docs sharing it
// — is itself a finding, because the pointer does not say which one it means.
//
// A section marker matches when its text CONTAINS the section name, after both are folded
// to lowercase words: headings carry status badges, node lists and parentheticals that a
// pointer does not repeat.
//
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-docpointers.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'play.html');
const DOCS = path.join(ROOT, 'docs');

const POINTER = /→ doc:\s*([^\s]+\.md)(?:\s+§\s*(.*?))?\s*$/;

// `§Conditions (item name → condition + effect)` is a section plus a gloss, and the gloss
// nests its own parens: `§D100 Loot Table (… used by _rollD100Loot())`. Balance-scan back
// from the close paren rather than matching a paren-free body.
function stripTrailingParenthetical(s) {
  s = s.trim();
  while (s.endsWith(')')) {
    let depth = 0, i = s.length - 1;
    for (; i >= 0; i--) {
      if (s[i] === ')') depth++;
      else if (s[i] === '(') { depth--; if (depth === 0) break; }
    }
    if (i <= 0) break;
    s = s.slice(0, i).trim();
  }
  return s;
}

function parse(text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    const m = POINTER.exec(line.replace(/\*\/\s*$/, ''));
    if (!m) return;
    let section = m[2] || null;
    if (section) section = stripTrailingParenthetical(section) || null;
    out.push({ line: i + 1, file: m[1], section });
  });
  return out;
}

function docIndex(dir, rel = '', acc = { byPath: new Map(), byBase: new Map() }) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name), r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) docIndex(p, r, acc);
    else if (e.name.endsWith('.md')) {
      acc.byPath.set('docs/' + r, p);
      if (!acc.byBase.has(e.name)) acc.byBase.set(e.name, []);
      acc.byBase.get(e.name).push(p);
    }
  }
  return acc;
}

const fold = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// A section marker in this doc tree is a markdown heading OR a line-leading bold run:
// world.md and story.md name most of their beats as `**Rough Whiskey** (…) — prose`, not
// as `###`. A headings-only rule reports 26 dead sections on a healthy corpus.
const HEADING = /^#{1,6}\s+(.*)$/;
const BOLD_LABEL = /^>?\s*\*\*(.+?)\*\*/;
function sections(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const h = HEADING.exec(line);
    if (h) { out.push(fold(h[1])); continue; }
    const b = BOLD_LABEL.exec(line);
    if (b) out.push(fold(b[1]));
  }
  return out;
}

function scan(pointers, index, readFile) {
  const findings = [];
  for (const p of pointers) {
    const at = `play.html:${p.line}`;
    let file = index.byPath.get(p.file) || index.byPath.get('docs/' + p.file);
    if (!file && !p.file.includes('/')) {
      const hits = index.byBase.get(p.file) || [];
      if (hits.length > 1) {
        findings.push(`${at} — \`${p.file}\` is ambiguous: ${hits.length} docs share that basename. Write the pointer repo-relative.`);
        continue;
      }
      file = hits[0];
    }
    if (!file) { findings.push(`${at} — \`${p.file}\` does not resolve to a doc on disk`); continue; }
    if (!p.section) continue;
    if (!sections(readFile(file)).some(h => h.includes(fold(p.section)))) {
      findings.push(`${at} — \`${p.file}\` exists, but has no section matching §${p.section}`);
    }
  }
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };

  ok(parse('const X = { // → doc: world.md §WORLD_DB')[0].file === 'world.md', 'a bare-basename pointer parses its file');
  ok(parse('const X = { // → doc: world.md §WORLD_DB')[0].section === 'WORLD_DB', 'a bare-basename pointer parses its section');
  ok(parse('// → doc: docs/mechanics/mechanics-economy.md §D100 Loot Table')[0].file === 'docs/mechanics/mechanics-economy.md',
    'a repo-relative pointer keeps its path');
  ok(parse('// → doc: docs/spec/combat.md §Conditions (item name → condition + effect)')[0].section === 'Conditions',
    'a trailing parenthetical is prose, not part of the section name');
  ok(parse('// → doc: docs/story/x.md')[0].section === null, 'a file-only pointer carries no section');
  ok(parse('// → doc: m.md §D100 Loot Table (d100 result → item; used by _rollD100Loot())')[0].section === 'D100 Loot Table',
    'a gloss that nests its own parens is still stripped whole');
  ok(parse('// → doc: m.md §Act (I) Beats')[0].section === 'Act (I) Beats',
    'a parenthetical that is not trailing stays part of the section name');
  ok(parse('const X = 1; // nothing here').length === 0, 'a line with no pointer yields nothing');

  const index = {
    byPath: new Map([['docs/mechanics/m.md', '/m.md'], ['docs/design/world.md', '/design/world.md'], ['docs/other/world.md', '/other/world.md']]),
    byBase: new Map([['m.md', ['/m.md']], ['world.md', ['/design/world.md', '/other/world.md']], ['solo.md', ['/solo.md']]]),
  };
  const read = f => f === '/solo.md' ? '# Top\n## §Live Section\ntext\n' : '# Other\n';

  ok(scan(parse('// → doc: solo.md §Live Section'), index, read).length === 0,
    'a bare basename resolving to ONE doc with the heading present passes — the case that decides whether the gate is usable');
  ok(scan(parse('// → doc: solo.md §Live'), index, read).length === 0,
    'a heading whose text merely CONTAINS the section name matches');
  ok(scan(parse('// → doc: solo.md §Ghost Section'), index, read).some(f => f.includes('no section matching')),
    'a planted dead section is caught');
  ok(scan(parse('// → doc: docs/nope/gone.md §X'), index, read).some(f => f.includes('does not resolve')),
    'a planted unresolvable file is caught');
  ok(scan(parse('// → doc: world.md §X'), index, read).some(f => f.includes('ambiguous')),
    'a planted ambiguous basename is caught rather than silently taking the first hit');
  ok(scan(parse('// → doc: mechanics/m.md §Anything'), index, read).some(f => f.includes('does not resolve')) === false,
    'a path written relative to docs/ resolves — the corpus uses that form too');
  ok(scan(parse('// → doc: m.md §Anything'), index, read).length === 1,
    'a repo-relative file that exists is still section-checked');

  if (fail) { console.log(`\n✗ check-docpointers selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-docpointers selftest: all ${pass} checks pass`);
  return;
}

const pointers = parse(fs.readFileSync(SOURCE, 'utf8'));
const findings = scan(pointers, docIndex(DOCS), f => fs.readFileSync(f, 'utf8'));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-docpointers: ${findings.length} of ${pointers.length} \`→ doc:\` pointer(s) name a doc or section that is not there`);
  console.log('  Find the live section and repoint the comment — deleting the pointer loses the only');
  console.log('  code→doc link that table has.');
  process.exit(1);
}
console.log(`✓ §DOCPTR-01 doc pointers: all ${pointers.length} \`→ doc:\` pointers resolve to a live file and heading`);
