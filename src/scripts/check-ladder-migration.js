#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §EDITOR-01-D-FU(b) — reward-ladder → itemChain migration parity guard.
//
// The 61-branch `if (id === 'quest_…')` reward ladder in storyCheckQuests is being
// migrated, branch by branch, so the *inventory* effect (push/filter) moves into the
// quest's declarative `itemChain` while gold/favor/XP/flag/narrative-msg stay as code
// (lab-reports/lab-report-editor01d-fu-b-ladder-migration.md, §3–4).
//
// This guard is the safety net (lab report §3.6). It is MANIFEST-DRIVEN: each migrated
// quest gets one MIGRATION_MANIFEST entry recording the item(s) its ladder branch USED
// to push/remove. For every entry the guard asserts, against the LIVE game file:
//   (a) inventory parity — running _applyItemChain on the quest's real itemChain from
//       an empty inventory reproduces exactly the recorded grant(s) (field-by-field over
//       the allow-list) and applies the recorded take(s);
//   (b) silent grants — each migrated grant step carries silent:true, so the auto
//       "<item> obtained." line cannot double up with the ladder's verbatim narrative msg;
//   (c) no double-grant — that quest's surviving ladder branch no longer pushes the
//       migrated item name (catches a half-finished migration that grants twice);
//   (d) name preservation — a migrated item name referenced by KEY_EVENTS[].item or any
//       quest's completeItems still appears in the quest's itemChain (those references
//       match by string; a rename silently breaks a key event / completion).
//
// At Inc 2 the manifest is EMPTY: the guard ships green as a baseline harness, proving
// the extractor reads the ladder + KEY_EVENTS + QUEST_DB correctly. Waves b2a (Inc 3)
// and b2b (Inc 5) add entries; this file does not change shape. Pure/read-only — never
// writes the game file.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const WBAPI = require(path.join(__dirname, '..', 'js', 'wbapi-core'));
const GAME = path.join(__dirname, '..', '..', 'play.html');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ FAIL:', m); } };

const src = fs.readFileSync(GAME, 'utf8');

// ── String/comment-aware brace matcher: lift a `{...}` block starting at the first
//    `{` at or after `from`. Returns [startBraceIdx, endIdxExclusive]. ───────────────
function matchBraces(from) {
  let i = src.indexOf('{', from), depth = 0, quote = null;
  const start = i;
  for (; i < src.length; i++) {
    const ch = src[i], prev = src[i - 1];
    if (quote) { if (ch === quote && prev !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return [start, i];
}

function extractFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('fn not found: ' + name);
  const [, end] = matchBraces(start);
  return src.slice(start, end);
}

// ── (1) _applyItemChain runtime into a sandbox (same lift as check-itemchain) ────────
const sandbox = { S_story: { inventory: [], day: 3 }, msgs: [] };
sandbox.storyMsg = (m) => sandbox.msgs.push(m);
vm.createContext(sandbox);
vm.runInContext(
  ['_flagToLabel', '_grantMissionBit', '_takeMissionBit', '_applyItemChain'].map(extractFn).join('\n') +
  '\nthis.applyItemChain = _applyItemChain;', sandbox);
const apply = sandbox.applyItemChain;
const S = sandbox.S_story;

// ── (2) Parse the reward ladder: quest_id → branch body source ───────────────────────
// Branches live inside storyCheckQuests as top-level `if (id === 'quest_X') { … }`.
const ladderFn = extractFn('storyCheckQuests');
const LADDER = new Map();
{
  const re = /if \(id === '([^']+)'\)\s*\{/g;
  let m;
  while ((m = re.exec(ladderFn))) {
    const braceFrom = m.index + m[0].length - 1; // position of the `{`
    // local brace match within the function string
    let depth = 0, quote = null, i = braceFrom;
    for (; i < ladderFn.length; i++) {
      const ch = ladderFn[i], prev = ladderFn[i - 1];
      if (quote) { if (ch === quote && prev !== '\\') quote = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    LADDER.set(m[1], ladderFn.slice(m.index, i));
  }
}
// Names a branch still pushes (any `name:'…'` inside the branch body — push objects only;
// `take` filters compare `i.name !== 'X'`, which is not a `name:` key, so they're excluded).
function branchPushNames(body) {
  const out = new Set();
  const re = /name:\s*(['"])([^'"]+)\1/g;
  let m; while ((m = re.exec(body))) out.add(m[2]);
  return out;
}

// ── (3) Load-bearing item names: KEY_EVENTS[].item + every quest's completeItems ─────
const KEY_EVENT_ITEMS = new Set();
{
  const k = src.indexOf('const KEY_EVENTS');
  const re = /\bitem:\s*(['"])([^'"]+)\1/g;
  re.lastIndex = k;
  // bound the scan to the array literal
  const arrStart = src.indexOf('[', k);
  let depth = 0, quote = null, i = arrStart, end = arrStart;
  for (; i < src.length; i++) {
    const ch = src[i], prev = src[i - 1];
    if (quote) { if (ch === quote && prev !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  const arr = src.slice(arrStart, end);
  let m; const ire = /\bitem:\s*(['"])([^'"]+)\1/g;
  while ((m = ire.exec(arr))) KEY_EVENT_ITEMS.add(m[2]);
}

WBAPI.load(GAME);
const COMPLETE_ITEMS = new Set();
for (const q of Object.values(WBAPI.questDb)) {
  for (const ci of (q.completeItems || [])) COMPLETE_ITEMS.add(ci);
}

// ── (4) THE MIGRATION MANIFEST ───────────────────────────────────────────────────────
// One entry per migrated quest. EMPTY at Inc 2 (baseline). Wave b2a (Inc 3) and b2b
// (Inc 5) populate it. Shape:
//   { quest:'quest_x',
//     grants:[{ name, icon, type, sell, desc?, /* + b1 allow-list fields */ }],
//     takes:['Item Name', …] }            // names removed by the old branch
// Field set on a grant must match exactly what the old ladder pushed (allow-list only).
const MIGRATION_MANIFEST = [
  // ── Wave b2a (Inc 3) — 10 expressible-now branches, less wm_01 (its seal removal is
  //    conditional + count-limited to 3, which a simple `take` can't express → stays code).
  //    Each grant is silent:true; gold/favor/XP/flag/msg stay in the ladder branch.
  { quest: 'quest_cat_03', grants: [{ name: 'Rhinestone Collar', icon: '💎', type: 'trophy', sell: 0 }] },
  { quest: 'quest_cat_04', grants: [{ name: 'Furball Crown', icon: '🌀', type: 'trophy', sell: 0 }] },
  { quest: 'quest_cat_05', grants: [{ name: "The Don's Signet Ring", icon: '💍', type: 'trophy', sell: 35 }] },
  { quest: 'quest_cat_06', grants: [{ name: "Cat-King's Claw Fragment", icon: '👑', type: 'trophy', sell: 50 }] },
  { quest: 'quest_night_eel', grants: [{ name: 'Eel Skin Pouch', icon: '🏮', type: 'trinket', sell: 35, desc: '+1 Type bonus on all fishing casts. The light never fully goes out.' }] },
  { quest: 'quest_pit_training', grants: [{ name: 'Pit Legend Token', icon: '🏆', type: 'token', sell: 30 }] },
  { quest: 'quest_couperin_lute', grants: [{ name: 'Cipher Scrap', icon: '📜', type: 'key', sell: 0 }], takes: ["Quill's Lute"] },
  { quest: 'quest_brynn_ledger', takes: ['Worn Ledger Book'] },
  { quest: 'quest_pachelbel_shipment', takes: ['Sealed Scholar Box'] },

  // ── Wave b2b (Inc 5) — 13 rich-field branches, migrated via the b1-widened grant grammar.
  //    fishing_guide is excluded: its readText is FISHING_GUIDE_TEXT, a const defined AFTER
  //    QUEST_DB (line 24017 vs 9373) — a TDZ reference in a data literal — so it stays code
  //    (logged residue, lab report §6). Each grant is silent:true; gold/favor/XP/flag/ability
  //    writes + the verbatim narrative msg stay in the ladder branch.
  //
  //    NOTE on the manifest grant fields: long readText blobs and long desc prose are
  //    OMITTED here on purpose — they were moved byte-for-byte by the mechanical transform, and
  //    fieldsEqual only checks fields present in `want`. The short STRUCTURED rich fields (bonus,
  //    uses, passive, weapon stats, readable/readableKey) ARE asserted — they're the parity-
  //    sensitive ones b1 exists to carry. grant-exists / silent / no-double-push / name-
  //    preservation are asserted for every entry regardless.
  { quest: 'quest_void_below', grants: [
    { name: "Scholar's Note", icon: '📋', type: 'key', sell: 0 },
    { name: 'EMP Grenade', icon: '💥', type: 'flashbang', sell: 50, uses: 1 } ] },
  { quest: 'quest_shale_drop', grants: [{ name: 'Y. Gurt Field Survey', icon: '📋', type: 'readable', sell: 0 }] },
  { quest: 'quest_guide_06', grants: [{ name: 'Rod of Self-Discovery', icon: '🎣', type: 'weapon', sell: 0,
    atkBonus: 1, dmgDie: 4, dmgCount: 1, dmgFlat: 0, minLevel: 1 }] },
  { quest: 'quest_scar_04', grants: [
    { name: "The Scar's Light", icon: '🕯', type: 'amulet', sell: 0, passive: true },
    { name: 'Orrens Manuscript', icon: '📕', type: 'readable', sell: 0 } ] },
  { quest: 'quest_wm_02', grants: [{ name: "Froberger's Field Notes", icon: '📗', type: 'tome', sell: 0, bonus: { deathSave: 1 } }] },
  { quest: 'quest_wm_03', grants: [{ name: "Scholar Kings' History", icon: '📘', type: 'tome', sell: 0, bonus: { initiative: 2 } }] },
  { quest: 'quest_wm_04', grants: [{ name: "Benedikt's Annotated Copy", icon: '📙', type: 'tome', sell: 0, bonus: { atkWhileQuestActive: 1 } }] },
  { quest: 'quest_muffat_05', grants: [{ name: 'Scholar Kings Requisition (Handwritten)', icon: '📜', type: 'readable', sell: 0 }] },
  { quest: 'quest_solm_01', grants: [{ name: 'Analyst Solm Field File', icon: '📋', type: 'readable', sell: 0 }] },
  { quest: 'quest_signal_01', grants: [{ name: 'Warrant Suppressor Log', icon: '📡', type: 'readable', sell: 0 }] },
  { quest: 'quest_muffat_03', grants: [{ name: 'Station 7 Transmission Log', icon: '📡', type: 'readable', sell: 0 }] },
  { quest: 'quest_muffat_02', grants: [{ name: 'Shipping Manifest (Intercepted)', icon: '📦', type: 'readable', sell: 0 }] },
  { quest: 'quest_va_02', grants: [
    { name: "The Constructor's Log", icon: '📜', type: 'readable', sell: 0, readable: true, readableKey: 'constructors_log' },
    { name: 'Antecedent Seal', icon: '🏛️', type: 'relic', sell: 0 } ] },
];

// Field allow-list a migrated grant may carry (lab report §3.1). `silent` is authoring-only.
const GRANT_FIELDS = ['name', 'icon', 'type', 'sell', 'desc', 'readText',
  'readableKey', 'readable', 'passive', 'bonus', 'uses', 'minLevel',
  'atkBonus', 'dmgDie', 'dmgCount', 'dmgFlat'];

function fieldsEqual(got, want) {
  for (const f of GRANT_FIELDS) {
    if (!(f in want)) continue;
    if (JSON.stringify(got[f]) !== JSON.stringify(want[f])) return false;
  }
  return true;
}

// ── (5) Structural smoke — proves the harness reads the file (holds at every wave) ───
ok(typeof apply === 'function', '_applyItemChain lifted and callable');
{ S.inventory = []; apply({ itemChain: [{ action: 'grant', name: '__smoke__' }] });
  ok(S.inventory.some(i => i.name === '__smoke__'), '_applyItemChain grant works in-sandbox'); }
// §ARCH-01 W7c (`a79c76a`, 2026-07-03) migrated every remaining ladder branch to
// declarative onComplete chains and DELETED the per-id reward block. This guard's
// migration-era baseline (`size >= 30`) is therefore inverted: it now pins the
// ladder GONE — red means someone reintroduced an `if (id === 'quest_…')` reward
// branch in storyCheckQuests. The manifest parity checks below still verify the
// migrated itemChains against the recorded ladder effects.
ok(LADDER.size === 0, `reward ladder stays deleted (§ARCH-01 W7c) — found ${LADDER.size} reintroduced branch(es)`);
ok(KEY_EVENT_ITEMS.size > 0, `KEY_EVENTS item names parsed (${KEY_EVENT_ITEMS.size})`);
ok(Object.keys(WBAPI.questDb).length > 0, 'QUEST_DB loaded');
// Manifest internal consistency.
{ const ids = MIGRATION_MANIFEST.map(e => e.quest);
  ok(new Set(ids).size === ids.length, 'manifest has no duplicate quest entries'); }

// ── (6) Per-migration parity checks (run once the manifest is populated) ──────────────
for (const entry of MIGRATION_MANIFEST) {
  const tag = entry.quest;
  const q = WBAPI.questDb[entry.quest];
  ok(q, `[${tag}] quest exists in QUEST_DB`);
  if (!q) continue;
  const chain = q.itemChain;
  ok(Array.isArray(chain) && chain.length > 0, `[${tag}] has a non-empty itemChain`);
  if (!Array.isArray(chain)) continue;

  // (a) inventory parity — replay from empty, compare to the recorded effect.
  S.inventory = [];
  // seed items the takes need to remove, so a take's effect is observable
  for (const name of (entry.takes || [])) S.inventory.push({ name });
  apply({ itemChain: chain });
  for (const g of (entry.grants || [])) {
    const got = S.inventory.find(i => i.name === g.name);
    ok(got, `[${tag}] itemChain grants "${g.name}"`);
    ok(got && fieldsEqual(got, g), `[${tag}] "${g.name}" fields match the recorded ladder push`);
  }
  for (const name of (entry.takes || [])) {
    ok(!S.inventory.some(i => i.name === name), `[${tag}] itemChain removes "${name}"`);
  }

  // (b) silent grants — no double "<item> obtained." alongside the ladder's narrative line.
  for (const g of (entry.grants || [])) {
    const step = chain.find(s => s && s.action === 'grant' && s.name === g.name);
    ok(step && step.silent === true, `[${tag}] grant "${g.name}" is silent:true`);
  }

  // (c) no double-grant — the surviving ladder branch must not still push the migrated name.
  const body = LADDER.get(entry.quest) || '';
  const stillPushes = branchPushNames(body);
  for (const g of (entry.grants || [])) {
    ok(!stillPushes.has(g.name), `[${tag}] ladder branch no longer pushes "${g.name}"`);
  }

  // (d) name preservation — load-bearing names referenced elsewhere must persist in the chain.
  const chainGrantNames = new Set(chain.filter(s => s && s.action === 'grant').map(s => s.name));
  for (const g of (entry.grants || [])) {
    if (KEY_EVENT_ITEMS.has(g.name) || COMPLETE_ITEMS.has(g.name)) {
      ok(chainGrantNames.has(g.name),
        `[${tag}] load-bearing name "${g.name}" (key-event/completeItems) preserved in itemChain`);
    }
  }
}

const n = MIGRATION_MANIFEST.length;
if (fail) { console.log(`\n✗ check-ladder-migration: ${fail} FAILED, ${pass} passed`); process.exit(1); }
console.log(`✓ §EDITOR-01-D-FU(b) ladder migration: all ${pass} checks pass ` +
  `(${n} quest${n === 1 ? '' : 's'} migrated; ${LADDER.size} ladder branches, ${KEY_EVENT_ITEMS.size} key-event items indexed)`);
