#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §EDITOR-01-D — declarative itemChain guard.
// (1) Extracts _flagToLabel/_grantMissionBit/_takeMissionBit/_applyItemChain
//     from play.html and exercises grant/take/grantBit/takeBit semantics
//     (defaults, `once` idempotency, take-first vs take-all, flag set/clear,
//     unknown-action no-throw) in a sandbox with a mock S_story. (2) Verifies an
//     itemChain object array round-trips through the ph3 source-patch path
//     (editStructuredField → _rawSrc → reload). Pure/read-only: never writes the
//     game file. Lab report: lab-reports/lab-report-editor01d-itemchain.md

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const WBAPI = require(path.join(__dirname, '..', 'js', 'wbapi-core'));
const GAME = path.join(__dirname, '..', '..', 'play.html');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ FAIL:', m); } };

const src = fs.readFileSync(GAME, 'utf8');

// String-aware brace match to lift a top-level `function name(...) {...}` from the HTML.
function extractFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('fn not found: ' + name);
  let i = src.indexOf('{', start), depth = 0, quote = null;
  for (; i < src.length; i++) {
    const ch = src[i], prev = src[i - 1];
    if (quote) { if (ch === quote && prev !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

const sandbox = { S_story: { inventory: [], day: 3 }, msgs: [] };
sandbox.storyMsg = (m) => sandbox.msgs.push(m);
// §MBIT-02: _takeMissionBit consults _gateFlagSet() (which walks QUEST_DB); the sandbox
// has no QUEST_DB, so stub it to the empty set — the test's beads are generic/non-gating,
// which is exactly the empty-gate-set case (token leaves, flag clears). Repairs the crash
// that _gateFlagSet-not-defined introduced when §MBIT-02 landed.
sandbox._gateFlagSet = () => new Set();
vm.createContext(sandbox);
vm.runInContext(
  ['_flagToLabel', '_grantMissionBit', '_takeMissionBit', '_applyItemChain'].map(extractFn).join('\n') +
  '\nthis.applyItemChain = _applyItemChain;', sandbox);
const apply = sandbox.applyItemChain;
const S = sandbox.S_story;

// ── grant: defaults, msg, once idempotency ──────────────────────────────────
S.inventory = [];
let m = apply({ itemChain: [{ action: 'grant', name: 'Test Bead' }] });
ok(S.inventory.length === 1, 'grant adds one item');
ok(JSON.stringify(S.inventory[0]) === JSON.stringify({ name: 'Test Bead', icon: '📦', type: 'misc', sell: 0 }), 'grant applies defaults (icon/type/sell, no desc key)');
ok(m.length === 1 && m[0].includes('Test Bead'), 'grant returns a surfaced message');
apply({ itemChain: [{ action: 'grant', name: 'Test Bead' }] });
ok(S.inventory.length === 1, 'grant once (default): no duplicate');
apply({ itemChain: [{ action: 'grant', name: 'Test Bead', once: false }] });
ok(S.inventory.length === 2, 'grant once:false allows a deliberate duplicate');

// ── grant: full field passthrough ───────────────────────────────────────────
S.inventory = [];
apply({ itemChain: [{ action: 'grant', name: 'Glow', icon: '🟡', type: 'key', sell: 50, desc: 'shiny' }] });
ok(JSON.stringify(S.inventory[0]) === JSON.stringify({ name: 'Glow', icon: '🟡', type: 'key', sell: 50, desc: 'shiny' }), 'grant passes through all fields incl. desc');

// ── grant: rich-field allow-list passthrough (§FU-b1) ───────────────────────
S.inventory = [];
apply({ itemChain: [{ action: 'grant', name: 'Tome', icon: '📗', type: 'tome', sell: 0,
  desc: 'margin note', description: 'dead key', bonus: { deathSave: 1 }, readText: 'long text',
  readable: 'dead key', readableKey: 'dead key', passive: true, uses: 3, minLevel: 2,
  atkBonus: 1, dmgDie: 4, dmgCount: 1, dmgFlat: 0, heal: 8 }] });
{
  const it = S.inventory[0];
  ok(it.desc === 'margin note' && JSON.stringify(it.bonus) === '{"deathSave":1}', 'grant passes desc + bonus through');
  ok(!('description' in it), 'grant drops `description` — the item vocabulary spells it `desc`');
  ok(!('readableKey' in it) && !('readable' in it), 'grant drops `readableKey`/`readable` — readables are selected by `type` and opened by `readText`');
  ok(it.readText === 'long text', 'grant passes readText');
  ok(it.passive === true && it.uses === 3 && it.minLevel === 2, 'grant passes passive/uses/minLevel');
  ok(it.atkBonus === 1 && it.dmgDie === 4 && it.dmgCount === 1 && it.dmgFlat === 0, 'grant passes weapon stats');
  ok(it.heal === 8, 'grant passes heal (§KG Inc 3 — heal-consumable rewards)');
}
// off-allow-list keys are dropped (no arbitrary passthrough)
S.inventory = [];
apply({ itemChain: [{ action: 'grant', name: 'Plain', evil: 'no', __proto__hack: 1 }] });
ok(!('evil' in S.inventory[0]) && !('__proto__hack' in S.inventory[0]), 'grant drops fields outside the allow-list');

// ── grant: silent suppresses the auto message but still adds the item (§FU-b) ──
S.inventory = [];
let sm = apply({ itemChain: [{ action: 'grant', name: 'Quiet Trophy', silent: true }] });
ok(S.inventory.some(i => i.name === 'Quiet Trophy'), 'silent grant still adds the item');
ok(sm.length === 0, 'silent grant emits no "obtained." message');

// ── take all:true then grant in the SAME chain — grant must survive (§FU-b fix) ──
// Regression: take-all used to reassign S_story.inventory, orphaning the cached ref so a
// later grant pushed into the dead array. Now take splices in place.
S.inventory = [{ name: 'Old Lute' }];
apply({ itemChain: [{ action: 'take', name: 'Old Lute', all: true }, { action: 'grant', name: 'New Scrap' }] });
ok(!S.inventory.some(i => i.name === 'Old Lute'), 'take-all removes the item');
ok(S.inventory.some(i => i.name === 'New Scrap'), 'grant after take-all lands in the live inventory');

// ── take: first-match vs all ────────────────────────────────────────────────
S.inventory = [{ name: 'A' }, { name: 'B' }, { name: 'A' }];
apply({ itemChain: [{ action: 'take', name: 'A' }] });
ok(S.inventory.length === 2 && S.inventory.filter(i => i.name === 'A').length === 1, 'take removes first match only');
apply({ itemChain: [{ action: 'take', name: 'A', all: true }] });
ok(!S.inventory.some(i => i.name === 'A'), 'take all:true removes every match');

// ── grantBit / takeBit ──────────────────────────────────────────────────────
S.inventory = []; delete S.harmonyFlag;
apply({ itemChain: [{ action: 'grantBit', flag: 'harmonyFlag', label: 'Harmony' }] });
ok(S.harmonyFlag === true, 'grantBit sets the flag');
ok(S.inventory.some(i => i.type === 'mission_bit' && i.flagRef === 'harmonyFlag'), 'grantBit pushes a mission_bit token');
ok(S.inventory[0].name === 'Harmony Token', 'grantBit label → token name');
apply({ itemChain: [{ action: 'takeBit', flag: 'harmonyFlag' }] });
ok(S.harmonyFlag === false, 'takeBit clears the flag');
ok(!S.inventory.some(i => i.flagRef === 'harmonyFlag'), 'takeBit removes the token');

// ── robustness: unknown action + non-array itemChain ────────────────────────
S.inventory = [];
let threw = false;
try { apply({ itemChain: [{ action: 'frobnicate' }, { action: 'grant', name: 'Z' }] }); } catch (e) { threw = true; }
ok(!threw, 'unknown action does not throw');
ok(S.inventory.some(i => i.name === 'Z'), 'steps after an unknown action still run');
ok(JSON.stringify(apply({})) === '[]', 'quest without itemChain → []');
ok(JSON.stringify(apply(null)) === '[]', 'null quest → []');

// ── ph3 source-patch round-trip (the §6 persistence claim) ──────────────────
WBAPI.load(GAME);
const anyQ = Object.keys(WBAPI.questDb)[0];
const chain = [
  { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: "O'Brien's gift" },
  // §FU-b1: a rich grant must survive the source patch too (readText + bonus + silent)
  { action: 'grant', name: 'Field Tome', icon: '📗', type: 'tome', sell: 0, readText: 'a\nb', bonus: { deathSave: 1 }, silent: true },
  { action: 'take', name: "Smalt's Trust" },
  { action: 'grantBit', flag: 'harmonyChainComplete', label: 'Harmony Chain' },
  { action: 'takeBit', flag: 'harmonyChainComplete' },
];
const r = WBAPI.editStructuredField('quest', anyQ, 'itemChain', chain);
ok(r.ok, 'itemChain editStructuredField succeeds: ' + (r.error || ''));
WBAPI.load(WBAPI._rawSrc);
ok(JSON.stringify(WBAPI.questDb[anyQ].itemChain) === JSON.stringify(chain), 'itemChain object array round-trips through the source patch');

if (fail) { console.log(`\n✗ check-itemchain: ${fail} FAILED, ${pass} passed`); process.exit(1); }
console.log(`✓ §EDITOR-01-D itemChain: all ${pass} checks pass (grant/take/grantBit/takeBit semantics + once + source round-trip)`);
