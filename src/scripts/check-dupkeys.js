#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
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
// §AUDIT-03f — parse-parity phase: every entry key declared in the source text
// must survive the WBAPI parse (`wbapi-core.load`). The fn-stripper once
// swallowed whole entries when a section COMMENT contained an arrow-fn example
// (quest_sea_01/quest_sb_01 were un-listable through the entire API surface);
// this phase fails on any textual-vs-parsed key mismatch so that class of
// silent drop can never return.
//
// Usage:  node src/scripts/check-dupkeys.js            # audit, exit 1 on findings
//         node src/scripts/check-dupkeys.js --selftest # prove the scanner catches
//                                                  # a planted duplicate
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
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
//   {open:'{'|'[', index}, {close:'}'|']', index}, {key, index} for every
// `key:` / `'key':` that starts a property (key position = first token after
// `{` or `,`). Handles // and /* */ comments and ' " ` strings (escapes
// honored, template interiors treated as opaque). Ternary `cond ? a : b`
// colons never sit in key position, so they are ignored by construction.
//
// §DX-01d/i — the scanner MOVED to js/wbapi-core.js and is imported here. This
// gate and the source-level entry deleters (`WBAPI.deleteEntrySource`) must
// agree on what an entry is: a private copy here would drift, and a scanner
// that disagrees with the writer is the §AUDIT-03f silent-drop class again.
const scanTokens = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))._scanTokens;

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

// ── §AUDIT-03f parse parity: textual entry keys ↔ WBAPI-parsed keys ──────────
// Sections whose parsed collection is an object keyed by entry id. FISH_DB /
// ITEM_DB / NODE_COORDS-style array or empty sections are covered where mapped.
const PARSE_PARITY = [
  ['QUEST_DB', 'questDb'], ['NODE_MAP', 'nodeMap'], ['NODE_COORDS', 'nodeCoords'],
  ['WORLD_DB', 'worldDb'], ['MONSTER_POOL', 'monsterPool'], ['MONSTER_DROPS', 'monsterDrops'],
  ['BIRKA_NPC', 'birkaNpcs'], ['NPC_DIALOGUES', 'npcDialogues'], ['LAKE_MAGIC', 'lakeMagicDb'],
];

// Depth-1 key set of a section's top-level object literal, from source text.
function sectionKeys(src, name) {
  let text = sectionText(src, name);
  if (text == null) return null;
  // MONSTER_DROPS nests inside MONSTER_POOL's markers — apply the same split load() uses.
  if (name === 'MONSTER_POOL') text = text.split('WORLDBUILDER:MONSTER_DROPS')[0];
  const keys = new Set(); const stack = [];
  for (const t of scanTokens(text)) {
    if (t.open) { stack.push(t.open); continue; }
    if (t.close) { stack.pop(); continue; }
    if (stack.length === 1) keys.add(t.key);
  }
  return keys;
}

function auditParseParity(src, fails, core, only) {
  core = core || require(path.join(ROOT, 'src', 'js', 'wbapi-core.js')).load(src);
  for (const [section, coll] of PARSE_PARITY) {
    if (only && !only.includes(section)) continue;
    const textual = sectionKeys(src, section);
    if (textual == null) { fails.push(`${section}: section markers not found (parse-parity)`); continue; }
    const parsed = new Set(Object.keys(core[coll] || {}));
    for (const k of textual) if (!parsed.has(k))
      fails.push(`${section}.${k}: declared in source but DROPPED by the WBAPI parse — un-listable/un-editable through the whole API surface (§AUDIT-03f class)`);
    for (const k of parsed) if (!textual.has(k))
      fails.push(`${section}.${k}: in the WBAPI parse but not found textually — scanner/parser disagreement, investigate`);
  }
}

function run(src) {
  const fails = [];
  const counts = {};
  for (const s of SECTIONS) counts[s] = auditSection(src, s, fails).entries;
  auditParseParity(src, fails);
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
  // §AUDIT-03f parity selftest: an arrow-fn example inside a section COMMENT is
  // the exact trap that dropped quest_sea_01/quest_sb_01 — the fixed parser must
  // keep both entries, and a simulated drop must be caught by the parity audit.
  const trap = `// ◆◆◆ WORLDBUILDER:QUEST_DB:START ◆◆◆
const QUEST_DB = {
  // migrated: gate:{} ← activateCond:()=>true, and completeFn:()=>S.x==='NWI' (notes with, commas). more
  q_c: { title:'Trap survivor', gate:{}, completion:{ atNode:'NWI' }, onDo:()=>{ /* body { */ S.f=1; } },
  q_d: { title:'Next', gate:{ flags:['x'] } },
};
// ◆◆◆ WORLDBUILDER:QUEST_DB:END ◆◆◆
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆
const MONSTER_POOL = {};
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:END ◆◆◆`;
  const core = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js')).load(trap);
  const f3 = [];
  auditParseParity(trap, f3, core, ['QUEST_DB', 'MONSTER_POOL']);
  const ok3 = !!(f3.length === 0 && core.questDb.q_c && core.questDb.q_d);
  delete core.questDb.q_c; // simulate a parser drop — parity must catch it
  const f4 = [];
  auditParseParity(trap, f4, core, ['QUEST_DB', 'MONSTER_POOL']);
  const ok4 = f4.length === 1 && f4[0].includes('QUEST_DB.q_c') && f4[0].includes('DROPPED');
  console.log(`selftest clean-pass=${ok1} planted-dup-caught=${ok2} comment-trap-survives=${ok3} simulated-drop-caught=${ok4}${ok3 && ok4 ? '' : ' → ' + JSON.stringify([...f3, ...f4])}`);
  process.exit(ok1 && ok2 && ok3 && ok4 ? 0 : 1);
}

const src = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const { fails, counts } = run(src);
console.log('§AUDIT-03a duplicate-key audit');
console.log('  ' + SECTIONS.map(s => `${s}=${counts[s]}`).join(' · '));
if (fails.length) {
  console.error(`\n✗ ${fails.length} DUPLICATE-KEY FINDING(S):`);
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ no entry declares the same key twice — no silently-shadowed authored values');
console.log('✓ parse parity: every source entry key survives the WBAPI parse (§AUDIT-03f)');
process.exit(0);
