#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §AUDIT-03a — duplicate-key audit over the WORLDBUILDER data sections.
//
// JS object literals silently drop earlier duplicate keys (last-key-wins), so a
// bulk edit that APPENDS a field to an entry that already declares it flips the
// authored value with no error anywhere — exactly how the `a721254`/`ea02faf`
// audit waves killed quest staging corpus-wide (found by §VM-01-G3).
//
// This checker re-reads the SOURCE TEXT (a parsed object can't see the shadowed
// key): for every entry object directly inside each WORLDBUILDER section, it
// collects the keys declared at the entry's own top level (depth 2 relative to
// the section object) with a string/template/comment/regex-safe scanner, and
// fails on any key declared twice in the same entry.
//
// Usage:  node scripts/check-dupkeys.js            # audit, exit 1 on findings
//         node scripts/check-dupkeys.js --selftest # prove the scanner catches
//                                                  # a planted duplicate
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SECTIONS = [
  'NODE_MAP', 'QUEST_DB', 'WORLD_DB', 'MONSTER_POOL', 'MONSTER_DROPS',
  'ITEM_DB', 'FISH_DB', 'BIRKA_NPC', 'NPC_DIALOGUES', 'LAKE_MAGIC', 'NODE_COORDS',
];

function sectionText(src, name) {
  const start = src.indexOf(`WORLDBUILDER:${name}:START`);
  const end = src.indexOf(`WORLDBUILDER:${name}:END`);
  if (start < 0 || end < 0) return null;
  return src.slice(start, end);
}

// Scan an object-literal body, yielding events:
//   {open:'{'|'['}, {close:'}'|']'}, {key, index} for every `key:` / `'key':`
// that starts a property (key position = first token after `{` or `,`).
// Handles // and /* */ comments and ' " ` strings (escapes honored, template
// interiors treated as opaque). Ternary `cond ? a : b` colons never sit in key
// position, so they are ignored by construction.
function* scanTokens(body) {
  let i = 0, expectKey = false;
  const n = body.length;
  while (i < n) {
    const ch = body[i];
    if (ch === '/' && body[i + 1] === '/') { i = body.indexOf('\n', i); if (i < 0) return; continue; }
    if (ch === '/' && body[i + 1] === '*') { i = body.indexOf('*/', i); if (i < 0) return; i += 2; continue; }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; const strStart = i; i++;
      while (i < n && body[i] !== q) { if (body[i] === '\\') i++; i++; }
      // a quoted string in key position is a quoted property name
      if (expectKey) {
        let j = i + 1; while (j < n && /\s/.test(body[j])) j++;
        if (body[j] === ':') yield { key: body.slice(strStart + 1, i), index: strStart };
        expectKey = false;
      }
      i++; continue;
    }
    if (ch === '{' || ch === '[') { yield { open: ch }; expectKey = ch === '{'; i++; continue; }
    if (ch === '}' || ch === ']') { yield { close: ch }; expectKey = false; i++; continue; }
    if (ch === ',') { expectKey = true; i++; continue; }
    if (expectKey && /[A-Za-z_$]/.test(ch)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(body[j])) j++;
      let k = j; while (k < n && /\s/.test(body[k])) k++;
      if (body[k] === ':' && body[k + 1] !== ':') yield { key: body.slice(i, j), index: i };
      expectKey = false; i = j; continue;
    }
    if (!/\s/.test(ch)) expectKey = false;
    i++;
  }
}

function auditSection(src, name, fails) {
  const text = sectionText(src, name);
  if (text == null) { fails.push(`${name}: section markers not found`); return { entries: 0 }; }
  // Stack of per-object key maps: '{' pushes, '}' pops — so a duplicate inside
  // ANY single object literal (entry, nested gate:{}, array element) is caught,
  // while sibling objects never share a map. '[' pushes null (arrays hold no
  // keys). The key seen at stack depth 1 doubles as the entry name for reports.
  let currentEntry = '(top)', entries = 0;
  const stack = [];
  const lineOf = (idx) => text.slice(0, idx).split('\n').length;
  for (const t of scanTokens(text)) {
    if (t.open) { stack.push(t.open === '{' ? new Map() : null); continue; }
    if (t.close) { stack.pop(); continue; }
    if (stack.length === 1) { currentEntry = t.key; entries++; }
    const seen = stack[stack.length - 1];
    if (!seen) continue; // key-shaped token directly inside an array — ignore
    if (seen.has(t.key)) {
      fails.push(`${name}.${currentEntry}: duplicate key '${t.key}' at nesting ${stack.length} (first at section-line ${seen.get(t.key)}, again at ${lineOf(t.index)}) — last-key-wins silently shadows the authored value`);
    } else seen.set(t.key, lineOf(t.index));
  }
  return { entries };
}

function run(src) {
  const fails = [];
  const counts = {};
  for (const s of SECTIONS) counts[s] = auditSection(src, s, fails).entries;
  return { fails, counts };
}

// ── selftest: planted duplicate must be caught; clean twin must pass ─────────
if (process.argv.includes('--selftest')) {
  const clean = `// ◆◆◆ WORLDBUILDER:QUEST_DB:START ◆◆◆
const QUEST_DB = {
  q_a: { title:'A "quoted: thing"', activateNode:null, gate:{flags:['x']}, desc:'has a // colon: and {braces}' },
  q_b: { title:\`t \${'x:1'}\`, reward:5, steps:[{go:'x', n:1},{go:'y', n:2}], onDo:()=>{ if (1) { S.f = {a:1}; } } }, // sibling array elements + fn bodies must not collide
};
// ◆◆◆ WORLDBUILDER:QUEST_DB:END ◆◆◆`;
  const dirty = clean.replace("}, desc", "}, activateNode:'ZRH', desc");
  const f1 = [], f2 = [];
  auditSection(clean, 'QUEST_DB', f1);
  auditSection(dirty, 'QUEST_DB', f2);
  const ok1 = f1.length === 0;
  const ok2 = f2.length === 1 && f2[0].includes("duplicate key 'activateNode'");
  const r2 = { fails: f2 };
  console.log(`selftest clean-pass=${ok1} planted-dup-caught=${ok2}${ok2 ? '' : ' → ' + JSON.stringify(r2.fails)}`);
  process.exit(ok1 && ok2 ? 0 : 1);
}

const src = fs.readFileSync(path.join(ROOT, 'roll2hit-v3.html'), 'utf8');
const { fails, counts } = run(src);
console.log('§AUDIT-03a duplicate-key audit');
console.log('  ' + SECTIONS.map(s => `${s}=${counts[s]}`).join(' · '));
if (fails.length) {
  console.error(`\n✗ ${fails.length} DUPLICATE-KEY FINDING(S):`);
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ no entry declares the same key twice — no silently-shadowed authored values');
process.exit(0);
